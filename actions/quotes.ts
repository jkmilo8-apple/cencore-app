"use server";

import { createClient } from "@/lib/supabase/server";
import { Quote, QuoteItem } from "@/types/database";

// ─── GET ALL QUOTES (with client join) ──────────────────────────────
export async function getQuotes(filters?: {
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}) {
  const supabase = await createClient();

  let query = supabase
    .from("quotes")
    .select("*, clients(id, name, email, contact_name)")
    .order("created_at", { ascending: false });

  if (filters?.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  if (filters?.dateFrom) {
    query = query.gte("created_at", filters.dateFrom);
  }

  if (filters?.dateTo) {
    query = query.lte("created_at", filters.dateTo);
  }

  if (filters?.search) {
    query = query.or(
      `quote_number.ilike.%${filters.search}%,notes.ilike.%${filters.search}%`
    );
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching quotes:", error);
    return { data: null, error: error.message };
  }

  return { data: data as Quote[], error: null };
}

// ─── GET SINGLE QUOTE (with items + products) ──────────────────────
export async function getQuote(id: string) {
  const supabase = await createClient();

  const { data: quote, error: quoteError } = await supabase
    .from("quotes")
    .select("*, clients(*)")
    .eq("id", id)
    .single();

  if (quoteError) {
    console.error("Error fetching quote:", quoteError);
    return { data: null, items: null, error: quoteError.message };
  }

  const { data: items, error: itemsError } = await supabase
    .from("quote_items")
    .select("*, products(*)")
    .eq("quote_id", id);

  if (itemsError) {
    console.error("Error fetching quote items:", itemsError);
    return { data: quote as Quote, items: null, error: itemsError.message };
  }

  return { data: quote as Quote, items: items as QuoteItem[], error: null };
}

// ─── CREATE QUOTE ───────────────────────────────────────────────────
export async function createQuoteAction(quoteData: {
  client_id: string;
  total_amount: number;
  notes?: string;
  urgent_delivery?: boolean;
  items: {
    product_id: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    configuration?: any;
  }[];
}) {
  const supabase = await createClient();

  // Generate quote number
  const { count, error: countError } = await supabase
    .from("quotes")
    .select("*", { count: "exact", head: true });

  if (countError) {
    console.error("Error counting quotes:", countError);
  }

  const currentCount = count || 0;
  const quoteNumber = `QT-${new Date().getFullYear()}-${String(currentCount + 1).padStart(3, "0")}`;

  // Insert quote
  const { data: quote, error: quoteError } = await supabase
    .from("quotes")
    .insert({
      client_id: quoteData.client_id,
      total_amount: quoteData.total_amount,
      notes: quoteData.notes || null,
      urgent_delivery: quoteData.urgent_delivery || false,
      quote_number: quoteNumber,
      valid_until: new Date(
        Date.now() + 15 * 24 * 60 * 60 * 1000
      ).toISOString(),
    })
    .select()
    .single();

  if (quoteError) {
    console.error("Error creating quote:", quoteError);
    return { data: null, error: quoteError.message };
  }

  // Insert items
  if (quoteData.items.length > 0) {
    const itemsToInsert = quoteData.items.map((item) => ({
      ...item,
      quote_id: quote.id,
    }));

    const { error: itemsError } = await supabase
      .from("quote_items")
      .insert(itemsToInsert);

    if (itemsError) {
      console.error("Error creating quote items:", itemsError);
      return { data: quote as Quote, error: `Quote created but items failed: ${itemsError.message}` };
    }
  }

  return { data: quote as Quote, error: null };
}

// ─── UPDATE QUOTE STATUS ────────────────────────────────────────────
export async function updateQuoteStatusAction(id: string, status: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("quotes")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating quote status:", error);
    return { data: null, error: error.message };
  }

  return { data: data as Quote, error: null };
}

// ─── CALCULATE PRICING (via FastAPI) ──────────────────────────────
export async function calculatePricingAction(pricingData: {
  product_line: string;
  requested_quantity: number;
  dimensions: {
    length_mm?: number;
    width_mm?: number;
    height_mm?: number;
    diameter_mm?: number;
    thickness_mm?: number;
    wing_1_mm?: number;
    wing_2_mm?: number;
  };
  bom: {
    layers?: { material_name: string; quantity: number }[];
    lamina_madre?: string;
    accessories?: { material_name: string; quantity: number }[];
  };
  routing: { step: string; speed: number; setup_hours: number }[];
  packaging?: string[];
  logistics?: { truck_type: string };
  margin?: number;
  quote_date?: string;
}) {
  const serviceUrl = process.env.PRICING_SERVICE_URL || "http://localhost:8000";
  
  try {
    const response = await fetch(`${serviceUrl}/calculate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(pricingData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Pricing service error: ${errorText}`);
    }

    const result = await response.json();
    return { data: result, error: null };
  } catch (error: any) {
    console.error("Error calculating pricing:", error);
    return { data: null, error: error.message };
  }
}
// ─── DELETE QUOTE (draft only) ─────────────────────────────────────
export async function deleteQuoteAction(id: string) {
  const supabase = await createClient();

  // Verify it is a draft
  const { data: quote, error: fetchErr } = await supabase
    .from("quotes")
    .select("status")
    .eq("id", id)
    .single();

  if (fetchErr || !quote) return { success: false, error: "Cotización no encontrada." };
  if (quote.status !== "draft") return { success: false, error: "Solo se pueden eliminar cotizaciones en estado Borrador." };

  // Delete items first (FK)
  await supabase.from("quote_items").delete().eq("quote_id", id);

  const { error } = await supabase.from("quotes").delete().eq("id", id);
  if (error) return { success: false, error: error.message };
  return { success: true, error: null };
}

// ─── SEND QUOTE TO CLIENT VIA n8n WEBHOOK ───────────────────────────
export async function sendQuoteToClientAction(id: string) {
  const supabase = await createClient();

  const { data: quote, error: quoteErr } = await supabase
    .from("quotes")
    .select("*, clients(*)")
    .eq("id", id)
    .single();

  if (quoteErr || !quote) return { success: false, error: "Cotización no encontrada." };

  const client = quote.clients as any;
  if (!client?.email) return { success: false, error: "El cliente no tiene email registrado." };

  const { data: items } = await supabase
    .from("quote_items")
    .select("*, products(*)")
    .eq("quote_id", id);

  const subtotal = Number(quote.total_amount);
  const tax = subtotal * 0.19;
  const total = subtotal + tax;

  const webhookUrl = process.env.N8N_WEBHOOK_URL;
  if (!webhookUrl) return { success: false, error: "N8N_WEBHOOK_URL no configurado en el servidor." };

  const payload = {
    quote_number: quote.quote_number || id.slice(0, 8).toUpperCase(),
    client: {
      name: client.name,
      email: client.email,
      contact_name: client.contact_name || "",
      phone: client.phone || "",
      city: client.city || "",
    },
    items: (items || []).map((item: any) => ({
      product: item.products?.name || item.description || "Ítem personalizado",
      quantity: item.quantity,
      unit_price: Number(item.unit_price),
      total_price: Number(item.total_price),
    })),
    subtotal,
    tax,
    total,
    valid_until: quote.valid_until || null,
    urgent_delivery: quote.urgent_delivery || false,
    notes: quote.notes || "",
    created_at: quote.created_at,
  };

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();

    if (!response.ok) {
      let errMsg = responseText;
      try {
        const json = JSON.parse(responseText);
        // "Unused Respond to Webhook" is an n8n config warning — the email IS sent
        // Treat it as success but warn the user to fix the n8n workflow config
        if (json?.message?.includes("Unused Respond to Webhook")) {
          // Still mark as sent — email was processed
          await supabase
            .from("quotes")
            .update({ status: "sent", updated_at: new Date().toISOString() })
            .eq("id", id);
          return {
            success: true,
            error: null,
            warning: 'n8n: elimina el nodo "Respond to Webhook" del workflow para limpiar esta advertencia.',
          };
        }
        errMsg = json?.message || responseText;
      } catch {}
      return { success: false, error: `Error n8n: ${errMsg}` };
    }

    // Mark as sent
    await supabase
      .from("quotes")
      .update({ status: "sent", updated_at: new Date().toISOString() })
      .eq("id", id);

    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: `No se pudo conectar con n8n: ${err.message}` };
  }
}
