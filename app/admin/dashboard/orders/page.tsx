import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import OrderList from "../OrderList";
import type { Order } from "@/types/order";

export default async function OrdersPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin");

  const { data: orders } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  const orderCount = orders?.length ?? 0;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl">Orders</h1>
        <p className="text-muted text-sm mt-1">View and manage all orders</p>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-heading font-bold">Orders</h2>
          <span className="text-muted text-sm">{orderCount} total</span>
        </div>
        <OrderList initialOrders={(orders ?? []) as Order[]} />
      </div>
    </div>
  );
}
