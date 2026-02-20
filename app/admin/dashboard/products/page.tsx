import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import ProductForm from "../ProductForm";
import ProductList from "../ProductList";

export default async function ProductsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin");

  const { data: products } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  const productCount = products?.length ?? 0;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl">Products</h1>
        <p className="text-muted text-sm mt-1">Add and manage your products</p>
      </div>

      {/* Add Product card */}
      <div className="bg-card border border-border rounded-2xl p-6 md:p-8">
        <div className="mb-6">
          <h2 className="text-xl font-heading font-bold">Add New Product</h2>
          <p className="text-muted text-sm mt-1">
            Fill in the details to add a product
          </p>
        </div>
        <ProductForm />
      </div>

      {/* Product List card */}
      <div className="bg-card border border-border rounded-2xl p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-heading font-bold">All Products</h2>
          <span className="text-muted text-sm">{productCount} total</span>
        </div>
        <ProductList initialProducts={products ?? []} />
      </div>
    </div>
  );
}
