import { createClient } from "@/utils/supabase/server";
import ProductGrid from "@/components/ProductGrid";
import type { Product } from "@/types/product";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Search",
  description: "Search the MGT Fashion collection.",
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  let products: Product[] = [];

  if (query) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("products")
      .select("*")
      .or(`name.ilike.%${query}%,category.ilike.%${query}%,description.ilike.%${query}%`)
      .order("created_at", { ascending: false })
      .limit(40);
    products = (data as Product[]) ?? [];
  }

  return (
    <>
      <div className="pt-10 pb-2 text-center px-6">
        <h1 className="font-heading font-bold text-3xl md:text-4xl tracking-tight">Search</h1>
        {query && (
          <p className="text-muted text-sm mt-2">
            {products.length} result{products.length !== 1 ? "s" : ""} for &ldquo;{query}&rdquo;
          </p>
        )}
      </div>

      <section className="px-6 pb-20 pt-8">
        <div className="max-w-7xl mx-auto">
          {!query ? (
            <div className="text-center py-24">
              <svg className="w-16 h-16 mx-auto text-muted/20 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round">
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <p className="text-muted text-sm">Enter a search term to find products.</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-24">
              <p className="font-heading font-semibold text-xl text-muted/60">No results found</p>
              <p className="text-muted text-sm mt-2">Try a different search term.</p>
            </div>
          ) : (
            <ProductGrid products={products} />
          )}
        </div>
      </section>
    </>
  );
}
