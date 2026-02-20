import { createClient } from "@/utils/supabase/server";
import type { GarmentType } from "@/constants/garment-types";
import type { CategorySetting } from "./use-category-settings";

/** Server-side: get enabled categories directly from Supabase */
export async function getEnabledCategories(): Promise<GarmentType[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("category_settings")
    .select("category")
    .eq("enabled", true);
  return (data?.map((r) => r.category) ?? []) as GarmentType[];
}

/** Server-side: get all category settings */
export async function getAllCategorySettings(): Promise<CategorySetting[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("category_settings")
    .select("*")
    .order("category");
  return (data ?? []) as CategorySetting[];
}
