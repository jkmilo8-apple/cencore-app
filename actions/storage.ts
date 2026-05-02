"use server";

import { createClient } from "@/lib/supabase/server";

export async function uploadProductImage(formData: FormData) {
  const supabase = await createClient();
  const file = formData.get("file") as File;
  if (!file) return { error: "No se proporcionó ningún archivo" };

  const fileExt = file.name.split(".").pop();
  const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
  const filePath = `products/${fileName}`;

  const { data, error } = await supabase.storage
    .from("product-images")
    .upload(filePath, file);

  if (error) return { error: error.message };

  const { data: { publicUrl } } = supabase.storage
    .from("product-images")
    .getPublicUrl(filePath);

  return { url: publicUrl };
}
