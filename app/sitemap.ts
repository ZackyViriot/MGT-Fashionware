import { createClient } from "@/utils/supabase/server";
import type { MetadataRoute } from "next";

const BASE_URL = "https://mgtfashion.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();

  // Fetch all product IDs and updated timestamps
  const { data: products } = await supabase
    .from("products")
    .select("id, created_at")
    .order("created_at", { ascending: false });

  const productEntries: MetadataRoute.Sitemap = (products ?? []).map((p) => ({
    url: `${BASE_URL}/product/${p.id}`,
    lastModified: new Date(p.created_at),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
    { url: `${BASE_URL}/men`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/women`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/custom`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/search`, changeFrequency: "weekly", priority: 0.3 },
    { url: `${BASE_URL}/about`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/contact`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/faq`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/size-guide`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/shipping-returns`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/privacy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/terms`, changeFrequency: "yearly", priority: 0.3 },
  ];

  return [...staticPages, ...productEntries];
}
