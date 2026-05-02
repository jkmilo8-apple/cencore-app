"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getCommercialConfig() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("commercial_config")
    .select("*")
    .order("category", { ascending: true });

  return { data, error: error?.message };
}

export async function updateConfigAction(key: string, value: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("commercial_config")
    .update({ value, updated_at: new Date().toISOString() })
    .eq("key", key)
    .select()
    .single();

  if (!error) {
    revalidatePath("/admin/products/commercial");
  }

  return { data, error: error?.message };
}
