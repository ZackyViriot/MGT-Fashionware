import { createClient } from "@/utils/supabase/server";
import { redirect, notFound } from "next/navigation";
import type { Order, OrderLineItem, OrderDesignSide } from "@/types/order";
import { GARMENT_CONFIGS, isValidGarmentType } from "@/constants/garment-types";
import Image from "next/image";
import Link from "next/link";
import OrderStatusActions from "./OrderStatusActions";
import OrderDesignPreview from "./OrderDesignPreview";

function getCustomLabel(garmentType?: string): string {
  if (garmentType && isValidGarmentType(garmentType)) return GARMENT_CONFIGS[garmentType].label;
  return "Shirt";
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin");

  const { data } = await supabase.from("orders").select("*").eq("id", id).single();
  if (!data) notFound();

  const order = data as Order;
  const items = order.items as OrderLineItem[];
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  const STATUS_COLORS: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700",
    processing: "bg-blue-100 text-blue-700",
    shipped: "bg-purple-100 text-purple-700",
    delivered: "bg-emerald-100 text-emerald-700",
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back + header */}
      <div>
        <Link
          href="/admin/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-primary transition-colors duration-200 mb-4"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-heading font-bold">
              Order #{order.id.slice(-8)}
            </h1>
            <p className="text-muted text-sm mt-1">
              {new Date(order.created_at).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}{" "}
              &middot; {itemCount} item{itemCount !== 1 ? "s" : ""}
            </p>
          </div>
          <span
            className={`px-3 py-1.5 rounded-full text-xs font-medium shrink-0 ${
              STATUS_COLORS[order.status] ?? ""
            }`}
          >
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </span>
        </div>
      </div>

      {/* Contact + Shipping */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-2xl p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted mb-3">
            Contact
          </p>
          <div className="text-sm space-y-1">
            <p className="font-medium">{order.customer_name}</p>
            <p className="text-muted">{order.customer_email}</p>
            <p className="text-muted">{order.customer_phone}</p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted mb-3">
            Shipping
          </p>
          <div className="text-sm space-y-1">
            <p>{order.shipping_address}</p>
            <p className="text-muted">
              {order.shipping_city}, {order.shipping_state} {order.shipping_zip}
            </p>
          </div>
        </div>
      </div>

      {/* Line items */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted mb-4">
          Items
        </p>
        <div className="space-y-6">
          {items.map((item, i) => {
            const design = item.customDesign;
            const shirtColor = item.shirtColor || "#0a0a0a";
            const hasDesignData = !!(
              design?.front?.imageUrl ||
              design?.front?.textItems?.length ||
              design?.back?.imageUrl ||
              design?.back?.textItems?.length
            );
            const legacyDesignUrl = !design && item.customDesignUrl;

            return (
              <div
                key={i}
                className="border-b border-border last:border-0 pb-6 last:pb-0"
              >
                {/* Item summary row */}
                <div className="flex gap-4">
                  <div className="shrink-0">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.isCustom ? `Custom ${getCustomLabel((item as any).garmentType)}` : item.name}
                        width={80}
                        height={80}
                        className="w-20 h-20 object-cover rounded-lg border border-border"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-lg border border-border bg-surface flex items-center justify-center">
                        <svg
                          className="w-8 h-8 text-muted/30"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        >
                          <path d="M20.38 3.46L16 2 12 3.5 8 2 3.62 3.46a2 2 0 00-1.34 1.93l.38 12.32A2 2 0 004.62 19.7L12 22l7.38-2.3a2 2 0 001.96-1.99l.38-12.32a2 2 0 00-1.34-1.93z" />
                          <path d="M12 22V3.5" />
                        </svg>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-sm">
                        {item.isCustom ? `Custom ${getCustomLabel((item as any).garmentType)}` : item.name}
                      </p>
                      <p className="text-xs text-muted mt-0.5">
                        {item.color} / {item.size} &middot; Qty {item.quantity}
                      </p>
                      {item.isCustom && (
                        <span className="inline-block mt-1.5 px-2 py-0.5 rounded text-[10px] font-medium bg-purple-100 text-purple-700">
                          Custom Design
                        </span>
                      )}
                    </div>
                    <p className="font-medium text-sm shrink-0">
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Custom design: shirt preview + details */}
                {item.isCustom && hasDesignData && (
                  <div className="mt-4 space-y-4">
                    {/* Shirt preview — shows how it looks on the shirt */}
                    <div className="bg-surface rounded-xl p-4">
                      <OrderDesignPreview
                        shirtColor={shirtColor}
                        front={design?.front}
                        back={design?.back}
                        garmentType={(item as any).garmentType}
                      />
                    </div>

                    {/* Raw design assets — image files + text specs */}
                    <div className="bg-surface rounded-xl p-4 space-y-4">
                      <p className="text-xs font-semibold uppercase tracking-widest text-muted">
                        Design Assets
                      </p>

                      {shirtColor && (
                        <div className="flex items-center gap-2">
                          <span
                            className="w-5 h-5 rounded-full border border-border"
                            style={{ backgroundColor: shirtColor }}
                          />
                          <span className="text-sm text-muted">
                            Shirt color: {item.color}
                          </span>
                        </div>
                      )}

                      <div className="grid sm:grid-cols-2 gap-4">
                        {design?.front && (
                          <DesignSidePanel label="Front" side={design.front} />
                        )}
                        {design?.back && (
                          <DesignSidePanel label="Back" side={design.back} />
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Legacy: old orders with single customDesignUrl */}
                {item.isCustom && legacyDesignUrl && (
                  <div className="mt-4">
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted mb-2">
                      Uploaded Design
                    </p>
                    <a
                      href={legacyDesignUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <img
                        src={legacyDesignUrl}
                        alt="Custom design"
                        className="max-w-xs h-auto object-contain rounded-lg border border-border hover:opacity-80 transition-opacity"
                      />
                    </a>
                  </div>
                )}

                {/* No design data at all */}
                {item.isCustom && !hasDesignData && !legacyDesignUrl && (
                  <div className="mt-3 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200">
                    <p className="text-xs text-amber-700">
                      No design data was saved for this item. This order was
                      placed before design storage was updated.
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-4 pt-3 border-t border-border space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-muted">Subtotal</span>
            <span>${Number(order.subtotal).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted">Shipping</span>
            <span>
              {Number(order.shipping_cost) === 0
                ? "Free"
                : `$${Number(order.shipping_cost).toFixed(2)}`}
            </span>
          </div>
          <div className="flex justify-between font-bold pt-2 border-t border-border">
            <span>Total</span>
            <span>${Number(order.total).toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Status actions */}
      <OrderStatusActions orderId={order.id} currentStatus={order.status} />
    </div>
  );
}

function DesignSidePanel({
  label,
  side,
}: {
  label: string;
  side: OrderDesignSide;
}) {
  const hasImage = !!side.imageUrl;
  const hasText = !!(side.textItems && side.textItems.length > 0);

  if (!hasImage && !hasText) return null;

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-primary">{label}</p>

      {hasImage && side.imageUrl && (
        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted mb-1">
            Uploaded Image
          </p>
          <a href={side.imageUrl} target="_blank" rel="noopener noreferrer">
            <img
              src={side.imageUrl}
              alt={`${label} design`}
              className="max-w-full h-auto max-h-48 object-contain rounded-lg border border-border hover:opacity-80 transition-opacity"
            />
          </a>
          <p className="text-[10px] text-muted mt-1">Click to open full size</p>
        </div>
      )}

      {hasText && side.textItems && (
        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted mb-1.5">
            Text
          </p>
          <div className="space-y-2">
            {side.textItems.map((t, idx) => {
              const isLight =
                t.textColor === "#ffffff" ||
                t.textColor === "#fff" ||
                t.textColor.toLowerCase() === "white";
              return (
                <div
                  key={idx}
                  className={`rounded-lg px-3 py-2 border ${
                    isLight
                      ? "bg-dark border-dark"
                      : "bg-card border-border"
                  }`}
                >
                  <p
                    className="font-medium text-sm"
                    style={{
                      color: t.textColor,
                      fontFamily: t.fontFamily,
                      fontSize: `${Math.min(t.fontSize, 24)}px`,
                    }}
                  >
                    {t.text}
                  </p>
                  <p className={`text-[10px] mt-1 ${isLight ? "text-white/50" : "text-muted"}`}>
                    {t.fontFamily} &middot; {t.fontSize}px &middot;{" "}
                    <span
                      className="inline-block w-2.5 h-2.5 rounded-full align-middle border border-border"
                      style={{ backgroundColor: t.textColor }}
                    />{" "}
                    {t.textColor}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
