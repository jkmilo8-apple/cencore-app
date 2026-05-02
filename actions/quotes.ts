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
