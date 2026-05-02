"use server";

import { createClient } from "@/lib/supabase/server";
import { Product } from "@/types/database";

// ─── GET ALL PRODUCTS ───────────────────────────────────────────────
export async function getProducts(filters?: {
  category?: string;
  search?: string;
}) {
  const supabase = await createClient();

  let query = supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (filters?.category && filters.category !== "all") {
    query = query.eq("category", filters.category);
  }

  if (filters?.search) {
    query = query.or(
      `name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%`
    );
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching products:", error);
    return { data: null, error: error.message };
  }

  return { data: data as Product[], error: null };
}
// ─── CREATE PRODUCT ─────────────────────────────────────────────────
export async function createProductAction(productData: {
  name: string;
  description?: string;
  price: number;
  sku?: string;
  category?: string;
  stock?: number;
  image_url?: string;
}) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("products")
    .insert(productData)
    .select()
    .single();

  if (error) {
    console.error("Error creating product:", error);
    return { data: null, error: error.message };
  }

  return { data: data as Product, error: null };
}

// ─── UPDATE PRODUCT ─────────────────────────────────────────────────
export async function updateProductAction(
  id: string,
  productData: Partial<{
    name: string;
    description: string;
    price: number;
    sku: string;
    category: string;
    stock: number;
    status: string;
    image_url: string;
  }>
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("products")
    .update({ ...productData, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating product:", error);
    return { data: null, error: error.message };
  }

  return { data: data as Product, error: null };
}

// ─── DELETE PRODUCT ─────────────────────────────────────────────────
export async function deleteProductAction(id: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("products").delete().eq("id", id);

  if (error) {
    console.error("Error deleting product:", error);
    return { success: false, error: error.message };
  }

  return { success: true, error: null };
}
