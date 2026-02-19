"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

interface TextItemData {
  text: string;
  textColor: string;
  fontSize: number;
  fontFamily: string;
  pos: { x: number; y: number; scale: number };
}

interface CustomOrder {
  id: string;
  shirt_color: string;
  shirt_color_name: string | null;
  size: string;
  front_text: string | null;
  front_text_color: string | null;
  front_font_family: string | null;
  front_font_size: number | null;
  front_image_url: string | null;
  front_text_items: TextItemData[] | null;
  back_text: string | null;
  back_text_color: string | null;
  back_font_family: string | null;
  back_font_size: number | null;
  back_image_url: string | null;
  back_text_items: TextItemData[] | null;
  status: string;
  created_at: string;
}

interface Props {
  initialOrders: CustomOrder[];
}

function TextItemDisplay({ item, idx }: { item: TextItemData; idx: number }) {
  return (
    <div className="bg-surface rounded-lg px-3 py-2 border border-border">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[10px] text-muted">#{idx + 1}</span>
        <span
          className="w-4 h-4 rounded-full border border-border inline-block shrink-0"
          style={{ backgroundColor: item.textColor }}
        />
        <p className="text-sm font-medium truncate" style={{ fontFamily: item.fontFamily }}>
          &ldquo;{item.text}&rdquo;
        </p>
      </div>
      <p className="text-[11px] text-muted">
        {item.fontFamily} · {item.fontSize}px
      </p>
    </div>
  );
}

export default function CustomOrderList({ initialOrders }: Props) {
  const [orders, setOrders] = useState(initialOrders);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const supabase = createClient();
  const router = useRouter();

  async function updateStatus(id: string, status: string) {
    await supabase.from("custom_orders").update({ status }).eq("id", id);
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status } : o))
    );
    router.refresh();
  }

  if (orders.length === 0) {
    return <p className="text-muted text-sm">No custom orders yet.</p>;
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => {
        const isExpanded = expandedId === order.id;
        const hasFrontTexts = order.front_text_items && order.front_text_items.length > 0;
        const hasFront = order.front_text || order.front_image_url || hasFrontTexts;
        const hasBackTexts = order.back_text_items && order.back_text_items.length > 0;
        const hasBack = order.back_text || order.back_image_url || hasBackTexts;

        return (
          <div
            key={order.id}
            className="border border-border rounded-xl overflow-hidden"
          >
            {/* Summary row */}
            <button
              onClick={() => setExpandedId(isExpanded ? null : order.id)}
              className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-surface/50 transition-colors duration-200 cursor-pointer"
            >
              <span
                className="w-8 h-8 rounded-full border border-border shrink-0"
                style={{ backgroundColor: order.shirt_color }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-primary truncate">
                  {order.shirt_color_name || "Custom"} — Size {order.size}
                </p>
                <p className="text-xs text-muted">
                  {new Date(order.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <span
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium shrink-0 ${
                  order.status === "pending"
                    ? "bg-amber-100 text-amber-700"
                    : order.status === "completed"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-muted/10 text-muted"
                }`}
              >
                {order.status}
              </span>
              <svg
                className={`w-4 h-4 text-muted transition-transform duration-200 ${
                  isExpanded ? "rotate-180" : ""
                }`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {/* Expanded details */}
            {isExpanded && (
              <div className="px-5 pb-5 space-y-4 border-t border-border pt-4">
                {/* Front design */}
                {hasFront && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted mb-2">
                      Front Design
                    </p>

                    {/* Multi-text items */}
                    {hasFrontTexts && (
                      <div className="space-y-1.5 mb-3">
                        <span className="text-muted text-xs">Text Items:</span>
                        {order.front_text_items!.map((item, i) => (
                          <TextItemDisplay key={i} item={item} idx={i} />
                        ))}
                      </div>
                    )}

                    {/* Legacy single text */}
                    {!hasFrontTexts && order.front_text && (
                      <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                        <div>
                          <span className="text-muted text-xs">Text:</span>
                          <p className="font-medium" style={{ fontFamily: order.front_font_family || undefined }}>
                            {order.front_text}
                          </p>
                        </div>
                        {order.front_font_family && (
                          <div>
                            <span className="text-muted text-xs">Font:</span>
                            <p>{order.front_font_family}</p>
                          </div>
                        )}
                        {order.front_font_size && (
                          <div>
                            <span className="text-muted text-xs">Size:</span>
                            <p>{order.front_font_size}px</p>
                          </div>
                        )}
                        {order.front_text_color && (
                          <div className="flex items-center gap-2">
                            <span className="text-muted text-xs">Color:</span>
                            <span
                              className="w-5 h-5 rounded-full border border-border inline-block"
                              style={{ backgroundColor: order.front_text_color }}
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {order.front_image_url && (
                      <div>
                        <span className="text-muted text-xs block mb-1">Uploaded Image:</span>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={order.front_image_url}
                          alt="Front design"
                          className="w-32 h-32 object-contain rounded-lg border border-border bg-surface"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Back design */}
                {hasBack && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted mb-2">
                      Back Design
                    </p>

                    {hasBackTexts && (
                      <div className="space-y-1.5 mb-3">
                        <span className="text-muted text-xs">Text Items:</span>
                        {order.back_text_items!.map((item, i) => (
                          <TextItemDisplay key={i} item={item} idx={i} />
                        ))}
                      </div>
                    )}

                    {!hasBackTexts && order.back_text && (
                      <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                        <div>
                          <span className="text-muted text-xs">Text:</span>
                          <p className="font-medium" style={{ fontFamily: order.back_font_family || undefined }}>
                            {order.back_text}
                          </p>
                        </div>
                        {order.back_font_family && (
                          <div>
                            <span className="text-muted text-xs">Font:</span>
                            <p>{order.back_font_family}</p>
                          </div>
                        )}
                        {order.back_font_size && (
                          <div>
                            <span className="text-muted text-xs">Size:</span>
                            <p>{order.back_font_size}px</p>
                          </div>
                        )}
                        {order.back_text_color && (
                          <div className="flex items-center gap-2">
                            <span className="text-muted text-xs">Color:</span>
                            <span
                              className="w-5 h-5 rounded-full border border-border inline-block"
                              style={{ backgroundColor: order.back_text_color }}
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {order.back_image_url && (
                      <div>
                        <span className="text-muted text-xs block mb-1">Uploaded Image:</span>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={order.back_image_url}
                          alt="Back design"
                          className="w-32 h-32 object-contain rounded-lg border border-border bg-surface"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Status actions */}
                <div className="flex gap-2 pt-2">
                  {order.status === "pending" && (
                    <button
                      onClick={() => updateStatus(order.id, "completed")}
                      className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700 transition-colors duration-200 cursor-pointer"
                    >
                      Mark Completed
                    </button>
                  )}
                  {order.status === "completed" && (
                    <button
                      onClick={() => updateStatus(order.id, "pending")}
                      className="px-4 py-2 rounded-lg bg-surface border border-border text-xs font-medium text-muted hover:text-primary transition-colors duration-200 cursor-pointer"
                    >
                      Reopen
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
