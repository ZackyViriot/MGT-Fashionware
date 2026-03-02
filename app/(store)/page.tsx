import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import ProductGrid from "@/components/ProductGrid";
import SortSelect from "@/components/SortSelect";
import CategoryFilter from "@/components/CategoryFilter";
import type { Product } from "@/types/product";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shop All",
  description: "Browse the full MGT Fashion collection — vintage-inspired streetwear and independent fashion for everyone.",
  alternates: { canonical: "/" },
};

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; category?: string }>;
}) {
  const { sort, category } = await searchParams;
  const supabase = await createClient();

  let query = supabase.from("products").select("*");
  if (category) query = query.eq("category", category);
  if (sort === "price-asc") query = query.order("price", { ascending: true });
  else if (sort === "price-desc") query = query.order("price", { ascending: false });
  else query = query.order("created_at", { ascending: false });

  const { data: products } = await query;
  const count = products?.length ?? 0;

  return (
    <>
      <div className="pt-10 pb-2 text-center px-6">
        <h1 className="font-heading font-bold text-3xl md:text-4xl tracking-tight">Explore</h1>
        <p className="text-muted text-sm mt-2">Curated vintage-inspired streetwear and independent fashion</p>
      </div>

      <div className="px-6 mt-6 mb-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center gap-8 border-b border-border">
            <Link href="/" className="text-sm font-semibold text-primary pb-3.5 border-b-2 border-primary -mb-px">All</Link>
            <Link href="/men" className="text-sm font-medium text-muted hover:text-primary pb-3.5 border-b-2 border-transparent -mb-px transition-colors duration-200">Men</Link>
            <Link href="/women" className="text-sm font-medium text-muted hover:text-primary pb-3.5 border-b-2 border-transparent -mb-px transition-colors duration-200">Women</Link>
          </div>
        </div>
      </div>

      <div className="px-6 mb-4">
        <div className="max-w-7xl mx-auto">
          <CategoryFilter current={category} />
        </div>
      </div>

      <div className="px-6 mb-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <p className="text-xs text-muted">{count} products</p>
          <SortSelect current={sort} />
        </div>
      </div>

      <section className="px-6 pb-20">
        <div className="max-w-7xl mx-auto">
          <ProductGrid products={(products as Product[]) || []} />
        </div>
      </section>
    </>
  );
}
