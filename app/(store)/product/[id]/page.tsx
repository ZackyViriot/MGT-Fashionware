import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import ProductDetail from "@/components/ProductDetail";
import type { Product } from "@/types/product";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  if (!product) notFound();

  return <ProductDetail product={product as Product} />;
}
