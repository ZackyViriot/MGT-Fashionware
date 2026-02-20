"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/utils/cart-context";
import { GARMENT_CONFIGS, isValidGarmentType } from "@/constants/garment-types";

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY",
];

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalPrice, clearCart } = useCart();
  const shippingCost = totalPrice >= 100 ? 0 : 9.99;
  const total = totalPrice + shippingCost;

  const [form, setForm] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    shippingAddress: "",
    shippingCity: "",
    shippingState: "",
    shippingZip: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (items.length === 0) return;
    setSubmitting(true);
    setError("");

    try {
      const orderItems = items.map((item) => ({
        productId: item.productId,
        name: item.name,
        price: item.price,
        color: item.color,
        size: item.size,
        quantity: item.quantity,
        image: item.image,
        isCustom: item.isCustom || false,
        garmentType: item.isCustom && item.customDesign?.garmentType ? item.customDesign.garmentType : undefined,
        shirtColor: item.isCustom ? item.customDesign?.shirtColor ?? null : null,
        frontImageData: item.isCustom && item.customDesign?.front?.imageData
          ? item.customDesign.front.imageData
          : null,
        frontImagePos: item.isCustom ? item.customDesign?.front?.imagePos ?? null : null,
        frontTextItems: item.isCustom ? item.customDesign?.front?.textItems ?? null : null,
        backImageData: item.isCustom && item.customDesign?.back?.imageData
          ? item.customDesign.back.imageData
          : null,
        backImagePos: item.isCustom ? item.customDesign?.back?.imagePos ?? null : null,
        backTextItems: item.isCustom ? item.customDesign?.back?.textItems ?? null : null,
      }));

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, items: orderItems }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        setSubmitting(false);
        return;
      }

      // Clear cart and redirect to Stripe Checkout
      clearCart();
      window.location.href = data.url;
    } catch {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  if (items.length === 0) {
    return (
      <section className="px-6 py-24">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="font-heading font-bold text-2xl mb-2">Your cart is empty</h1>
          <p className="text-muted text-sm mb-8">Add some items before checking out.</p>
          <Link
            href="/"
            className="inline-block bg-dark text-white font-heading font-semibold text-sm px-8 py-3.5 rounded-full hover:bg-dark/80 transition-colors duration-200"
          >
            Continue Shopping
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="px-6 py-10">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <Link href="/cart" className="text-sm text-muted hover:text-primary transition-colors duration-200">
            &larr; Back to cart
          </Link>
          <h1 className="font-heading font-bold text-2xl md:text-3xl mt-2">Checkout</h1>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-[1fr_380px] gap-8">
            {/* Left — Form */}
            <div className="space-y-6">
              {/* Contact Info */}
              <div className="bg-surface rounded-2xl p-6">
                <h2 className="font-heading font-bold text-lg mb-4">Contact Information</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-muted mb-1.5">Full Name</label>
                    <input
                      type="text"
                      required
                      value={form.customerName}
                      onChange={(e) => update("customerName", e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-border bg-bg text-sm text-primary focus:outline-none focus:ring-2 focus:ring-dark/20 transition-shadow duration-200"
                      placeholder="John Doe"
                    />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-muted mb-1.5">Email</label>
                      <input
                        type="email"
                        required
                        value={form.customerEmail}
                        onChange={(e) => update("customerEmail", e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-border bg-bg text-sm text-primary focus:outline-none focus:ring-2 focus:ring-dark/20 transition-shadow duration-200"
                        placeholder="john@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-muted mb-1.5">Phone</label>
                      <input
                        type="tel"
                        required
                        value={form.customerPhone}
                        onChange={(e) => update("customerPhone", e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-border bg-bg text-sm text-primary focus:outline-none focus:ring-2 focus:ring-dark/20 transition-shadow duration-200"
                        placeholder="(555) 123-4567"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="bg-surface rounded-2xl p-6">
                <h2 className="font-heading font-bold text-lg mb-4">Shipping Address</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-muted mb-1.5">Street Address</label>
                    <input
                      type="text"
                      required
                      value={form.shippingAddress}
                      onChange={(e) => update("shippingAddress", e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-border bg-bg text-sm text-primary focus:outline-none focus:ring-2 focus:ring-dark/20 transition-shadow duration-200"
                      placeholder="123 Main St"
                    />
                  </div>
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs text-muted mb-1.5">City</label>
                      <input
                        type="text"
                        required
                        value={form.shippingCity}
                        onChange={(e) => update("shippingCity", e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-border bg-bg text-sm text-primary focus:outline-none focus:ring-2 focus:ring-dark/20 transition-shadow duration-200"
                        placeholder="New York"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-muted mb-1.5">State</label>
                      <select
                        required
                        value={form.shippingState}
                        onChange={(e) => update("shippingState", e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-border bg-bg text-sm text-primary focus:outline-none focus:ring-2 focus:ring-dark/20 transition-shadow duration-200"
                      >
                        <option value="">Select</option>
                        {US_STATES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-muted mb-1.5">ZIP Code</label>
                      <input
                        type="text"
                        required
                        value={form.shippingZip}
                        onChange={(e) => update("shippingZip", e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-border bg-bg text-sm text-primary focus:outline-none focus:ring-2 focus:ring-dark/20 transition-shadow duration-200"
                        placeholder="10001"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl">
                  {error}
                </div>
              )}
            </div>

            {/* Right — Order Summary */}
            <div className="lg:sticky lg:top-20 lg:self-start">
              <div className="bg-surface rounded-2xl p-6 space-y-4">
                <h2 className="font-heading font-bold text-lg">Order Summary</h2>

                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {items.map((item) => {
                    const key = `${item.productId}-${item.color}-${item.size}`;
                    return (
                      <div key={key} className="flex gap-3">
                        <div className="w-14 h-14 relative rounded-lg overflow-hidden bg-bg shrink-0">
                          {item.image ? (
                            <Image
                              src={item.image}
                              alt={item.name}
                              fill
                              sizes="56px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted/30 text-[10px]">
                              No img
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-primary truncate">
                            {item.isCustom ? `Custom ${isValidGarmentType(item.customDesign?.garmentType ?? "") ? GARMENT_CONFIGS[item.customDesign!.garmentType!].label : "Shirt"}` : item.name}
                          </p>
                          <p className="text-[11px] text-muted">
                            {item.color} / {item.size} &middot; Qty {item.quantity}
                          </p>
                        </div>
                        <p className="text-sm font-medium text-primary shrink-0">
                          ${(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    );
                  })}
                </div>

                <hr className="border-border" />

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted">Subtotal</span>
                    <span className="font-medium text-primary">${totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted">Shipping</span>
                    <span className="font-medium text-primary">
                      {shippingCost === 0 ? "Free" : `$${shippingCost.toFixed(2)}`}
                    </span>
                  </div>
                </div>

                <hr className="border-border" />

                <div className="flex justify-between">
                  <span className="font-heading font-bold">Total</span>
                  <span className="font-heading font-bold">${total.toFixed(2)}</span>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-dark text-white font-heading font-semibold text-sm py-4 rounded-full hover:bg-dark/80 transition-colors duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "Redirecting to Payment..." : "Pay Now"}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </section>
  );
}
