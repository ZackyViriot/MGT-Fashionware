import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import ProductDetail from "@/components/ProductDetail";
import ProductCard from "@/components/ProductCard";
import type { Product } from "@/types/product";
import type { Metadata } from "next";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  if (!product) return { title: "Product Not Found" };

  const p = product as Product;
  const image = p.color_variants?.[0]?.image ?? p.images?.[0];

  return {
    title: p.name,
    description: p.description ?? `Shop ${p.name} at MGT Fashion.`,
    openGraph: image ? { images: [{ url: image }] } : undefined,
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  if (!product) notFound();

  const p = product as Product;

  // Fetch related products (same gender, different product)
  let relatedProducts: Product[] = [];
  if (p.gender) {
    const { data } = await supabase
      .from("products")
      .select("*")
      .neq("id", p.id)
      .ilike("gender", `%${p.gender.includes("Women") ? "Women" : "Men"}%`)
      .limit(4);
    relatedProducts = (data as Product[]) ?? [];
  }

  if (relatedProducts.length === 0) {
    const { data } = await supabase
      .from("products")
      .select("*")
      .neq("id", p.id)
      .limit(4);
    relatedProducts = (data as Product[]) ?? [];
  }

  const image = p.color_variants?.[0]?.image ?? p.images?.[0];

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: p.description ?? `Shop ${p.name} at MGT Fashion.`,
    ...(image && { image }),
    offers: {
      "@type": "Offer",
      price: p.price,
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      url: `https://mgtfashion.com/product/${p.id}`,
    },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://mgtfashion.com" },
      ...(p.gender
        ? [
            {
              "@type": "ListItem",
              position: 2,
              name: p.gender.includes("Women") ? "Women" : "Men",
              item: `https://mgtfashion.com/${p.gender.includes("Women") ? "women" : "men"}`,
            },
          ]
        : []),
      { "@type": "ListItem", position: p.gender ? 3 : 2, name: p.name },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <ProductDetail product={p} />

      {relatedProducts.length > 0 && (
        <section className="px-6 pb-20">
          <div className="max-w-7xl mx-auto">
            <h2 className="font-heading font-bold text-xl mb-6">You Might Also Like</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5 md:gap-6">
              {relatedProducts.map((rp) => (
                <ProductCard key={rp.id} product={rp} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
