"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// ─── LABOR RATES ─────────────────────────────────────────────────────
export async function getLaborRates() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("pricing_labor_rates").select("*").order("category");
  return { data, error: error?.message };
}

export async function updateLaborRate(category: string, hourlyRate: number) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("pricing_labor_rates")
    .update({ hourly_rate: hourlyRate, updated_at: new Date().toISOString() })
    .eq("category", category);
  
  if (!error) revalidatePath("/admin/costs");
  return { error: error?.message };
}

// ─── MATERIAL COSTS ──────────────────────────────────────────────────
export async function getMaterialCosts() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("pricing_material_costs").select("*").order("material_name");
  return { data, error: error?.message };
}

export async function updateMaterialCost(materialName: string, costPerKg: number) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("pricing_material_costs")
    .update({ cost_per_kg: costPerKg, updated_at: new Date().toISOString() })
    .eq("material_name", materialName);
  
  if (!error) revalidatePath("/admin/costs");
  return { error: error?.message };
}

// ─── INDIRECT COSTS (NIF/CIF) ────────────────────────────────────────
export async function getIndirectCosts() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("pricing_indirect_costs").select("*").order("start_date", { ascending: false });
  return { data, error: error?.message };
}

export async function createIndirectCost(costData: { start_date: string, end_date: string, rent: number, utilities: number, administration: number, maintenance: number, payroll: number, others: number }) {
  const supabase = await createClient();
  const { error } = await supabase.from("pricing_indirect_costs").insert(costData);
  if (!error) revalidatePath("/admin/costs");
  return { error: error?.message };
}

// ─── PRODUCT CONFIGS ─────────────────────────────────────────────────
export async function getProductConfigs() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("pricing_product_configs").select("*").order("category");
  return { data, error: error?.message };
}

export async function updateProductConfig(category: string, config: { machine_speed: number, overhead_rate: number }) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("pricing_product_configs")
    .update({ ...config, updated_at: new Date().toISOString() })
    .eq("category", category);
  
  if (!error) revalidatePath("/admin/costs");
  return { error: error?.message };
}

// ─── REFERENCES ──────────────────────────────────────────────────────
export async function getPricingReferences() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("pricing_references").select("*").order("reference_id");
  return { data, error: error?.message };
}

export async function updatePricingReference(referenceId: string, config: { labor_multiplier: number, waste_factor: number, setup_time: number }) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("pricing_references")
    .update({ ...config, updated_at: new Date().toISOString() })
    .eq("reference_id", referenceId);
  
  if (!error) revalidatePath("/admin/costs");
  return { error: error?.message };
}
