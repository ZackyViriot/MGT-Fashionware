import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Order, OrderLineItem } from "@/types/order";
import { GARMENT_CONFIGS, isValidGarmentType } from "@/constants/garment-types";
import ClearCartOnMount from "@/components/ClearCartOnMount";

function getCustomLabel(garmentType?: string): string {
  if (garmentType && isValidGarmentType(garmentType)) return GARMENT_CONFIGS[garmentType].label;
  return "Shirt";
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  processing: "bg-blue-100 text-blue-700",
  shipped: "bg-purple-100 text-purple-700",
  delivered: "bg-emerald-100 text-emerald-700",
};

const PAYMENT_COLORS: Record<string, string> = {
  unpaid: "bg-amber-100 text-amber-700",
  paid: "bg-emerald-100 text-emerald-700",
  failed: "bg-red-100 text-red-700",
  refunded: "bg-gray-100 text-gray-700",
};

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // The id could be a Supabase order UUID or a Stripe checkout session ID
  // Try by order ID first, then by stripe_session_id
  let order;

  const { data: byId } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .single();

  if (byId) {
    order = byId;
  } else {
    // Try looking up by Stripe session ID (Stripe redirects with session ID)
    const { data: bySession } = await supabase
      .from("orders")
      .select("*")
      .eq("stripe_session_id", id)
      .single();
    order = bySession;
  }

  if (!order) notFound();

  const o = order as Order;
  const items = o.items as OrderLineItem[];
  const shortId = o.id.slice(-8).toUpperCase();

  return (
    <section className="px-6 py-10">
      <ClearCartOnMount />
      <div className="max-w-3xl mx-auto">
        {/* Success header */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-emerald-600"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h1 className="font-heading font-bold text-2xl md:text-3xl mb-1">
            {o.payment_status === "paid" ? "Payment Confirmed" : "Order Received"}
          </h1>
          <p className="text-muted text-sm">
            Order #{shortId}
          </p>
          {o.payment_status === "paid" && (
            <p className="text-emerald-600 text-sm mt-1">
              Your payment was successful. We&apos;ll start processing your order shortly.
            </p>
          )}
          {o.payment_status === "unpaid" && (
            <p className="text-amber-600 text-sm mt-1">
              Payment is being processed. This page will update once confirmed.
            </p>
          )}
        </div>

        <div className="space-y-6">
          {/* Items */}
          <div className="bg-surface rounded-2xl p-6">
            <h2 className="font-heading font-bold text-lg mb-4">Items</h2>
            <div className="space-y-3">
              {items.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-2 border-b border-border last:border-0"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-primary">
                      {item.isCustom ? `Custom ${getCustomLabel((item as any).garmentType)}` : item.name}
                    </p>
                    <p className="text-xs text-muted">
                      {item.color} / {item.size} &middot; Qty {item.quantity}
                    </p>
                  </div>
                  <p className="text-sm font-medium text-primary shrink-0">
                    ${(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Shipping & Status */}
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="bg-surface rounded-2xl p-6">
              <h2 className="font-heading font-bold text-lg mb-3">Shipping</h2>
              <div className="text-sm text-primary space-y-1">
                <p className="font-medium">{o.customer_name}</p>
                <p className="text-muted">{o.shipping_address}</p>
                <p className="text-muted">
                  {o.shipping_city}, {o.shipping_state} {o.shipping_zip}
                </p>
                <p className="text-muted">{o.customer_phone}</p>
                <p className="text-muted">{o.customer_email}</p>
              </div>
            </div>

            <div className="bg-surface rounded-2xl p-6">
              <h2 className="font-heading font-bold text-lg mb-3">Summary</h2>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Subtotal</span>
                  <span className="font-medium">${Number(o.subtotal).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Shipping</span>
                  <span className="font-medium">
                    {Number(o.shipping_cost) === 0 ? "Free" : `$${Number(o.shipping_cost).toFixed(2)}`}
                  </span>
                </div>
                <hr className="border-border" />
                <div className="flex justify-between">
                  <span className="font-heading font-bold">Total</span>
                  <span className="font-heading font-bold">${Number(o.total).toFixed(2)}</span>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <div>
                  <span className="text-xs text-muted mr-1.5">Status:</span>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[11px] font-medium ${
                      STATUS_COLORS[o.status] || "bg-muted/10 text-muted"
                    }`}
                  >
                    {o.status.charAt(0).toUpperCase() + o.status.slice(1)}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-muted mr-1.5">Payment:</span>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[11px] font-medium ${
                      PAYMENT_COLORS[o.payment_status] || "bg-muted/10 text-muted"
                    }`}
                  >
                    {o.payment_status.charAt(0).toUpperCase() + o.payment_status.slice(1)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center pt-4">
            <Link
              href="/"
              className="inline-block bg-dark text-white font-heading font-semibold text-sm px-8 py-3.5 rounded-full hover:bg-dark/80 transition-colors duration-200"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
