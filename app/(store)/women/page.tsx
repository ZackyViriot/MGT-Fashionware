import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import ProductGrid from "@/components/ProductGrid";
import type { Product } from "@/types/product";

export default async function WomenPage() {
  const supabase = await createClient();
  const { data: products } = await supabase
    .from("products")
    .select("*")
    .ilike("gender", "%Women%")
    .order("created_at", { ascending: false });

  const count = products?.length ?? 0;

  return (
    <>
      {/* Page header */}
      <div className="pt-10 pb-2 text-center px-6">
        <h1 className="font-heading font-bold text-3xl md:text-4xl tracking-tight">
          Women&apos;s
        </h1>
        <p className="text-muted text-sm mt-2">
          Versatile, refined pieces for those who value substance over trend
        </p>
      </div>

      {/* Tabs */}
      <div className="px-6 mt-6 mb-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center gap-8 border-b border-border">
            <Link
              href="/"
              className="text-sm font-medium text-muted hover:text-primary pb-3.5 border-b-2 border-transparent -mb-px transition-colors duration-200"
            >
              All
            </Link>
            <Link
              href="/men"
              className="text-sm font-medium text-muted hover:text-primary pb-3.5 border-b-2 border-transparent -mb-px transition-colors duration-200"
            >
              Men
            </Link>
            <Link
              href="/women"
              className="text-sm font-semibold text-primary pb-3.5 border-b-2 border-primary -mb-px"
            >
              Women
            </Link>
          </div>
        </div>
      </div>

      {/* Results count */}
      <div className="px-6 mb-6">
        <div className="max-w-7xl mx-auto">
          <p className="text-xs text-muted">{count} products</p>
        </div>
      </div>

      {/* Product Grid */}
      <section className="px-6 pb-20">
        <div className="max-w-7xl mx-auto">
          <ProductGrid products={(products as Product[]) || []} />
        </div>
      </section>
    </>
  );
}
