"use server";

import { createClient } from "@/lib/supabase/server";
import { Client } from "@/types/database";

// ─── GET ALL CLIENTS ────────────────────────────────────────────────
export async function getClients(search?: string) {
  const supabase = await createClient();

  let query = supabase
    .from("clients")
    .select("*")
    .order("created_at", { ascending: false });

  if (search) {
    query = query.or(
      `name.ilike.%${search}%,email.ilike.%${search}%,industry.ilike.%${search}%`
    );
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching clients:", error);
    return { data: null, error: error.message };
  }

  return { data: data as Client[], error: null };
}

// ─── GET SINGLE CLIENT ──────────────────────────────────────────────
export async function getClient(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching client:", error);
    return { data: null, error: error.message };
  }

  return { data: data as Client, error: null };
}

// ─── CREATE CLIENT ──────────────────────────────────────────────────
export async function createClientAction(clientData: {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  industry?: string;
  city?: string;
  contact_name?: string;
}) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("clients")
    .insert(clientData)
    .select()
    .single();

  if (error) {
    console.error("Error creating client:", error);
    return { data: null, error: error.message };
  }

  return { data: data as Client, error: null };
}

// ─── UPDATE CLIENT ──────────────────────────────────────────────────
export async function updateClientAction(
  id: string,
  clientData: Partial<{
    name: string;
    email: string;
    phone: string;
    address: string;
    industry: string;
    city: string;
    contact_name: string;
    status: string;
  }>
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("clients")
    .update({ ...clientData, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating client:", error);
    return { data: null, error: error.message };
  }

  return { data: data as Client, error: null };
}

// ─── DELETE CLIENT ──────────────────────────────────────────────────
export async function deleteClientAction(id: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("clients").delete().eq("id", id);

  if (error) {
    console.error("Error deleting client:", error);
    return { success: false, error: error.message };
  }

  return { success: true, error: null };
}
