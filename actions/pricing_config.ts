"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// ─── MATERIALS CATALOG V2 ──────────────────────────────────────────
export async function getMaterialsCatalog(category?: string) {
  const supabase = await createClient();
  let query = supabase.from("pricing_materials_catalog").select("*").eq("active", true);
  if (category) {
    query = query.eq("category", category);
  }
  const { data, error } = await query.order("category").order("name");
  return { data, error: error?.message };
}

export async function getAccessories() {
  return getMaterialsCatalog("Accesorio");
}

export async function getGluesCatalog() {
  return getMaterialsCatalog("Pegante");
}

export async function getPapersCatalog() {
  return getMaterialsCatalog("Papel");
}

export async function getPackagingCatalog() {
  return getMaterialsCatalog("Empaque");
}

export async function createMaterial(data: any) {
  const supabase = await createClient();
  const { error } = await supabase.from("pricing_materials_catalog").insert(data);
  if (!error) revalidatePath("/admin/costs");
  return { error: error?.message };
}

export async function updateMaterial(id: string, updates: any) {
  const supabase = await createClient();
  const { error } = await supabase.from("pricing_materials_catalog").update({ ...updates, updated_at: new Date().toISOString() }).eq("id", id);
  if (!error) revalidatePath("/admin/costs");
  return { error: error?.message };
}

// ─── LABOR ROUTES V2 ───────────────────────────────────────────────
export async function getLaborRoutes(productLine?: string) {
  const supabase = await createClient();
  let query = supabase.from("pricing_labor_routes").select("*").eq("active", true);
  if (productLine) {
    query = query.eq("product_line", productLine);
  }
  const { data, error } = await query.order("product_line").order("process_name");
  return { data, error: error?.message };
}

export async function createLaborRoute(data: any) {
  const supabase = await createClient();
  const { error } = await supabase.from("pricing_labor_routes").insert(data);
  if (!error) revalidatePath("/admin/costs");
  return { error: error?.message };
}

export async function updateLaborRoute(id: string, updates: any) {
  const supabase = await createClient();
  const { error } = await supabase.from("pricing_labor_routes").update({ ...updates, updated_at: new Date().toISOString() }).eq("id", id);
  if (!error) revalidatePath("/admin/costs");
  return { error: error?.message };
}

// ─── LOGISTICS V2 ──────────────────────────────────────────────────
export async function getLogistics() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("pricing_logistics").select("*").eq("active", true).order("truck_type");
  return { data, error: error?.message };
}


// ───────────────────────────────────────────────────────────────────
// LEGACY V1 FUNCTIONS (Retained for /admin/costs backward compatibility)
// ───────────────────────────────────────────────────────────────────

export async function getPapers() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("pricing_papers").select("*").order("name");
  return { data, error: error?.message };
}
export async function updatePaper(id: string, updates: any) {
  const supabase = await createClient();
  const { error } = await supabase.from("pricing_papers").update({ ...updates, updated_at: new Date().toISOString() }).eq("id", id);
  if (!error) revalidatePath("/admin/costs");
  return { error: error?.message };
}
export async function createPaper(paperData: any) {
  const supabase = await createClient();
  const { error } = await supabase.from("pricing_papers").insert(paperData);
  if (!error) revalidatePath("/admin/costs");
  return { error: error?.message };
}

export async function getGlues() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("pricing_glues").select("*").order("name");
  return { data, error: error?.message };
}
export async function updateGlue(id: string, updates: any) {
  const supabase = await createClient();
  const { error } = await supabase.from("pricing_glues").update({ ...updates, updated_at: new Date().toISOString() }).eq("id", id);
  if (!error) revalidatePath("/admin/costs");
  return { error: error?.message };
}
export async function createGlue(glueData: any) {
  const supabase = await createClient();
  const { error } = await supabase.from("pricing_glues").insert(glueData);
  if (!error) revalidatePath("/admin/costs");
  return { error: error?.message };
}

export async function getPackaging() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("pricing_packaging").select("*").order("name");
  return { data, error: error?.message };
}
export async function updatePackaging(id: string, updates: any) {
  const supabase = await createClient();
  const { error } = await supabase.from("pricing_packaging").update({ ...updates, updated_at: new Date().toISOString() }).eq("id", id);
  if (!error) revalidatePath("/admin/costs");
  return { error: error?.message };
}

export async function getVehicles() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("pricing_freight_vehicles").select("*").order("vehicle_type");
  return { data, error: error?.message };
}
export async function updateVehicle(id: string, updates: any) {
  const supabase = await createClient();
  const { error } = await supabase.from("pricing_freight_vehicles").update({ ...updates, updated_at: new Date().toISOString() }).eq("id", id);
  if (!error) revalidatePath("/admin/costs");
  return { error: error?.message };
}
export async function createVehicle(vehicleData: any) {
  const supabase = await createClient();
  const { error } = await supabase.from("pricing_freight_vehicles").insert(vehicleData);
  if (!error) revalidatePath("/admin/costs");
  return { error: error?.message };
}

export async function getLaborProvisions() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("pricing_labor_provisions").select("*").order("category");
  return { data, error: error?.message };
}
export async function updateLaborProvision(id: string, updates: any) {
  const supabase = await createClient();
  const { error } = await supabase.from("pricing_labor_provisions").update({ ...updates, updated_at: new Date().toISOString() }).eq("id", id);
  if (!error) revalidatePath("/admin/costs");
  return { error: error?.message };
}

export async function getProcessConfigs() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("pricing_process_configs").select("*").order("process_name");
  return { data, error: error?.message };
}
export async function updateProcessConfig(id: string, updates: any) {
  const supabase = await createClient();
  const { error } = await supabase.from("pricing_process_configs").update({ ...updates, updated_at: new Date().toISOString() }).eq("id", id);
  if (!error) revalidatePath("/admin/costs");
  return { error: error?.message };
}
export async function createProcessConfig(configData: any) {
  const supabase = await createClient();
  const { error } = await supabase.from("pricing_process_configs").insert(configData);
  if (!error) revalidatePath("/admin/costs");
  return { error: error?.message };
}

export async function getIndirectCosts() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("pricing_indirect_costs").select("*").order("start_date", { ascending: false });
  return { data, error: error?.message };
}
export async function createIndirectCost(costData: any) {
  const supabase = await createClient();
  const { error } = await supabase.from("pricing_indirect_costs").insert(costData);
  if (!error) revalidatePath("/admin/costs");
  return { error: error?.message };
}

export async function getBusinessLines() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("pricing_business_lines").select("*").order("name");
  return { data, error: error?.message };
}
export async function createBusinessLine(lineData: any) {
  const supabase = await createClient();
  const { error } = await supabase.from("pricing_business_lines").insert(lineData);
  if (!error) revalidatePath("/admin/costs");
  return { error: error?.message };
}
export async function updateBusinessLine(id: string, updates: any) {
  const supabase = await createClient();
  const { error } = await supabase.from("pricing_business_lines").update({ ...updates, updated_at: new Date().toISOString() }).eq("id", id);
  if (!error) revalidatePath("/admin/costs");
  return { error: error?.message };
}
