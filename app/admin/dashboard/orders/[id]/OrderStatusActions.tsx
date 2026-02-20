"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import type { OrderStatus } from "@/types/order";

const STATUS_FLOW: OrderStatus[] = ["pending", "processing", "shipped", "delivered"];

const NEXT_LABELS: Record<string, string> = {
  processing: "Mark Processing",
  shipped: "Mark Shipped",
  delivered: "Mark Delivered",
};

export default function OrderStatusActions({
  orderId,
  currentStatus,
}: {
  orderId: string;
  currentStatus: OrderStatus;
}) {
  const supabase = createClient();
  const router = useRouter();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const idx = STATUS_FLOW.indexOf(currentStatus);
  const next = idx < STATUS_FLOW.length - 1 ? STATUS_FLOW[idx + 1] : null;
  const prev = idx > 0 ? STATUS_FLOW[idx - 1] : null;

  async function updateStatus(status: OrderStatus) {
    await supabase
      .from("orders")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", orderId);
    router.refresh();
  }

  async function handleDelete() {
    setDeleting(true);
    await supabase.from("orders").delete().eq("id", orderId);
    router.push("/admin/dashboard/orders");
    router.refresh();
  }

  return (
    <>
      <div className="flex items-center gap-2 flex-wrap">
        {next && (
          <button
            onClick={() => updateStatus(next)}
            className="px-5 py-2.5 rounded-lg bg-dark text-white text-sm font-medium hover:bg-dark/80 transition-colors duration-200 cursor-pointer"
          >
            {NEXT_LABELS[next]}
          </button>
        )}
        {prev && (
          <button
            onClick={() => updateStatus(prev)}
            className="px-5 py-2.5 rounded-lg bg-surface border border-border text-sm font-medium text-muted hover:text-primary transition-colors duration-200 cursor-pointer"
          >
            Revert to {prev.charAt(0).toUpperCase() + prev.slice(1)}
          </button>
        )}

        <button
          onClick={() => setShowDeleteModal(true)}
          className="px-5 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors duration-200 cursor-pointer ml-auto"
        >
          Delete Order
        </button>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-dark/50 backdrop-blur-sm"
            onClick={() => !deleting && setShowDeleteModal(false)}
          />
          <div className="relative bg-card border border-border rounded-2xl p-6 shadow-xl max-w-sm w-full mx-4">
            <h3 className="text-lg font-heading font-bold">Delete Order</h3>
            <p className="text-sm text-muted mt-2">
              Are you sure you want to delete order{" "}
              <span className="font-mono font-medium text-primary">
                #{orderId.slice(-8)}
              </span>
              ? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2 mt-6">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="px-4 py-2 rounded-lg text-sm font-medium text-muted hover:text-primary transition-colors duration-200 cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors duration-200 cursor-pointer disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete Order"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
