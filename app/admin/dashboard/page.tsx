import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import LogoutButton from "./LogoutButton";
import ProductForm from "./ProductForm";
import ProductList from "./ProductList";
import OrderList from "./OrderList";
import type { Order } from "@/types/order";

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/admin");
  }

  const { data: products } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  const { data: orders } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  const productCount = products?.length ?? 0;
  const menCount = products?.filter(p => p.gender?.includes("Men")).length ?? 0;
  const womenCount = products?.filter(p => p.gender?.includes("Women")).length ?? 0;
  const orderCount = orders?.length ?? 0;
  const pendingOrders = orders?.filter(o => o.status === "pending").length ?? 0;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl">Dashboard</h1>
          <p className="text-muted text-sm mt-1">Manage your store</p>
        </div>
        <LogoutButton />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-card border border-border rounded-2xl p-6">
          <p className="text-3xl font-heading font-bold">{productCount}</p>
          <p className="text-muted text-sm mt-1">Total Products</p>
        </div>
        <div className="bg-dark rounded-2xl p-6">
          <p className="text-3xl font-heading font-bold text-white">{menCount}</p>
          <p className="text-white/40 text-sm mt-1">Men&apos;s</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-6">
          <p className="text-3xl font-heading font-bold">{womenCount}</p>
          <p className="text-muted text-sm mt-1">Women&apos;s</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-6">
          <p className="text-3xl font-heading font-bold">{orderCount}</p>
          <p className="text-muted text-sm mt-1">Total Orders</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-6">
          <p className="text-3xl font-heading font-bold">{pendingOrders}</p>
          <p className="text-muted text-sm mt-1">Pending Orders</p>
        </div>
      </div>

      {/* Orders card */}
      <div className="bg-card border border-border rounded-2xl p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-heading font-bold">Orders</h2>
          <span className="text-muted text-sm">{orderCount} total</span>
        </div>
        <OrderList initialOrders={(orders ?? []) as Order[]} />
      </div>

      {/* Add Product card */}
      <div className="bg-card border border-border rounded-2xl p-6 md:p-8">
        <div className="mb-6">
          <h2 className="text-xl font-heading font-bold">Add New Product</h2>
          <p className="text-muted text-sm mt-1">Fill in the details to add a product</p>
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
