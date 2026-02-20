"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import type { Order, OrderLineItem, OrderStatus } from "@/types/order";

interface Props {
  initialOrders: Order[];
}

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: "bg-amber-100 text-amber-700",
  processing: "bg-blue-100 text-blue-700",
  shipped: "bg-purple-100 text-purple-700",
  delivered: "bg-emerald-100 text-emerald-700",
};

const STATUS_FLOW: OrderStatus[] = ["pending", "processing", "shipped", "delivered"];

const FILTER_TABS: Array<{ label: string; value: OrderStatus | "all" }> = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Processing", value: "processing" },
  { label: "Shipped", value: "shipped" },
  { label: "Delivered", value: "delivered" },
];

const PAGE_SIZE = 10;

type SortKey = "date" | "total";
type SortDir = "asc" | "desc";

export default function OrderList({ initialOrders }: Props) {
  const [orders, setOrders] = useState(initialOrders);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [deleteTarget, setDeleteTarget] = useState<Order | null>(null);
  const [deleting, setDeleting] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    await supabase.from("orders").delete().eq("id", deleteTarget.id);
    setOrders((prev) => prev.filter((o) => o.id !== deleteTarget.id));
    setDeleteTarget(null);
    setDeleting(false);
    router.refresh();
  }

  const filtered = useMemo(() => {
    let result = orders;

    if (statusFilter !== "all") {
      result = result.filter((o) => o.status === statusFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (o) =>
          o.customer_name.toLowerCase().includes(q) ||
          o.customer_email.toLowerCase().includes(q) ||
          o.id.toLowerCase().includes(q)
      );
    }

    result = [...result].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "date") {
        cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else {
        cmp = Number(a.total) - Number(b.total);
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [orders, statusFilter, search, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function handleSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  function handleStatusFilter(value: OrderStatus | "all") {
    setStatusFilter(value);
    setPage(1);
  }

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: orders.length };
    for (const s of STATUS_FLOW) counts[s] = 0;
    for (const o of orders) counts[o.status]++;
    return counts;
  }, [orders]);

  function SortArrow({ column }: { column: SortKey }) {
    if (sortKey !== column) return null;
    return (
      <svg
        className="inline-block w-3 h-3 ml-1"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      >
        {sortDir === "asc" ? (
          <polyline points="18 15 12 9 6 15" />
        ) : (
          <polyline points="6 9 12 15 18 9" />
        )}
      </svg>
    );
  }

  if (orders.length === 0) {
    return <p className="text-muted text-sm">No orders yet.</p>;
  }

  const thClass =
    "text-left text-[10px] font-heading font-semibold uppercase tracking-widest text-muted py-3 pr-4";

  return (
    <>
      <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search name, email, or order ID…"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-border bg-bg placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-dark/10"
            />
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => handleStatusFilter(tab.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors duration-200 cursor-pointer ${
                  statusFilter === tab.value
                    ? "bg-dark text-white"
                    : "bg-surface text-muted hover:text-primary"
                }`}
              >
                {tab.label}
                <span className="ml-1.5 opacity-60">{statusCounts[tab.value]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="font-heading font-semibold text-primary/40">No orders found</p>
            <p className="text-muted text-sm mt-1">Try a different search or filter.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto -mx-6 md:-mx-8 px-6 md:px-8">
              <table className="w-full min-w-[780px]">
                <thead>
                  <tr className="border-b border-border">
                    <th className={thClass}>Order&nbsp;#</th>
                    <th className={thClass}>Customer</th>
                    <th className={thClass}>Items</th>
                    <th
                      className={`${thClass} cursor-pointer select-none hover:text-primary`}
                      onClick={() => handleSort("total")}
                    >
                      Total
                      <SortArrow column="total" />
                    </th>
                    <th
                      className={`${thClass} cursor-pointer select-none hover:text-primary`}
                      onClick={() => handleSort("date")}
                    >
                      Date
                      <SortArrow column="date" />
                    </th>
                    <th className={thClass}>Status</th>
                    <th className="py-3 w-20" />
                  </tr>
                </thead>
                <tbody>
                  {paged.map((order) => {
                    const items = order.items as OrderLineItem[];
                    const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

                    return (
                      <tr
                        key={order.id}
                        className="border-b border-border/50 hover:bg-bg/50 transition-colors duration-150"
                      >
                        <td
                          className="py-3 pr-4 text-sm font-mono text-muted cursor-pointer"
                          onClick={() => router.push(`/admin/dashboard/orders/${order.id}`)}
                        >
                          {order.id.slice(-8)}
                        </td>
                        <td
                          className="py-3 pr-4 cursor-pointer"
                          onClick={() => router.push(`/admin/dashboard/orders/${order.id}`)}
                        >
                          <p className="text-sm font-medium truncate max-w-[180px]">
                            {order.customer_name}
                          </p>
                          <p className="text-xs text-muted truncate max-w-[180px]">
                            {order.customer_email}
                          </p>
                        </td>
                        <td
                          className="py-3 pr-4 text-sm text-muted cursor-pointer"
                          onClick={() => router.push(`/admin/dashboard/orders/${order.id}`)}
                        >
                          {itemCount} item{itemCount !== 1 ? "s" : ""}
                        </td>
                        <td
                          className="py-3 pr-4 text-sm font-semibold cursor-pointer"
                          onClick={() => router.push(`/admin/dashboard/orders/${order.id}`)}
                        >
                          ${Number(order.total).toFixed(2)}
                        </td>
                        <td
                          className="py-3 pr-4 text-sm text-muted cursor-pointer"
                          onClick={() => router.push(`/admin/dashboard/orders/${order.id}`)}
                        >
                          {new Date(order.created_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </td>
                        <td
                          className="py-3 pr-4 cursor-pointer"
                          onClick={() => router.push(`/admin/dashboard/orders/${order.id}`)}
                        >
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-medium ${
                              STATUS_COLORS[order.status]
                            }`}
                          >
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteTarget(order);
                            }}
                            className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors duration-200 cursor-pointer"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={safePage <= 1}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium border border-border bg-surface text-muted hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-200 cursor-pointer"
                >
                  Previous
                </button>
                <span className="text-xs text-muted">
                  Page {safePage} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage >= totalPages}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium border border-border bg-surface text-muted hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-200 cursor-pointer"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-dark/50 backdrop-blur-sm"
            onClick={() => !deleting && setDeleteTarget(null)}
          />
          <div className="relative bg-card border border-border rounded-2xl p-6 shadow-xl max-w-sm w-full mx-4">
            <h3 className="text-lg font-heading font-bold">Delete Order</h3>
            <p className="text-sm text-muted mt-2">
              Are you sure you want to delete order{" "}
              <span className="font-mono font-medium text-primary">
                #{deleteTarget.id.slice(-8)}
              </span>{" "}
              from <span className="font-medium text-primary">{deleteTarget.customer_name}</span>?
              This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2 mt-6">
              <button
                onClick={() => setDeleteTarget(null)}
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
