"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/utils/cart-context";
import ShirtPreview from "@/components/ShirtPreview";

export default function CartPage() {
  const { items, removeItem, updateQuantity, totalPrice, totalItems } = useCart();

  if (items.length === 0) {
    return (
      <section className="px-6 py-24">
        <div className="max-w-2xl mx-auto text-center">
          <svg className="w-16 h-16 mx-auto text-muted/20 mb-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0" />
          </svg>
          <h1 className="font-heading font-bold text-2xl mb-2">Your cart is empty</h1>
          <p className="text-muted text-sm mb-8">Looks like you haven&apos;t added anything yet.</p>
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
      <div className="max-w-4xl mx-auto">
        <h1 className="font-heading font-bold text-2xl md:text-3xl mb-2">
          Cart ({totalItems})
        </h1>
        <p className="text-muted text-sm mb-8">Review your items before checkout.</p>

        <div className="grid lg:grid-cols-[1fr_320px] gap-8">
          {/* Items */}
          <div className="space-y-0 divide-y divide-border">
            {items.map((item) => {
              const key = `${item.productId}-${item.color}-${item.size}`;
              return (
                <div key={key} className="flex gap-4 py-6 first:pt-0">
                  {/* Image */}
                  {item.isCustom && item.customDesign ? (
                    <div className="shrink-0 w-24 h-24 md:w-28 md:h-28 rounded-lg overflow-hidden bg-surface flex items-center justify-center">
                      <ShirtPreview
                        shirtColor={item.customDesign.shirtColor}
                        text={item.customDesign.text}
                        textColor={item.customDesign.textColor}
                        fontFamily={item.customDesign.fontFamily}
                        fontSize={item.customDesign.fontSize ?? 24}
                        imageData={item.customDesign.imageData}
                        imagePos={item.customDesign.imagePos}
                        textPos={item.customDesign.textPos}
                        className="w-20 h-20 md:w-24 md:h-24"
                      />
                    </div>
                  ) : (
                    <Link href={`/product/${item.productId}`} className="shrink-0">
                      <div className="w-24 h-24 md:w-28 md:h-28 relative rounded-lg overflow-hidden bg-surface">
                        {item.image ? (
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted/30 text-xs">
                            No image
                          </div>
                        )}
                      </div>
                    </Link>
                  )}

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    {item.isCustom ? (
                      <h3 className="text-sm font-semibold text-primary leading-snug">
                        Custom Shirt
                      </h3>
                    ) : (
                      <Link href={`/product/${item.productId}`}>
                        <h3 className="text-sm font-semibold text-primary leading-snug">
                          {item.name}
                        </h3>
                      </Link>
                    )}
                    <p className="text-xs text-muted mt-1">
                      {item.color} / {item.size}
                    </p>
                    <p className="text-sm font-semibold text-primary mt-2">
                      ${item.price.toFixed(2)}
                    </p>

                    {/* Quantity + Remove */}
                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex items-center border border-border rounded-lg">
                        <button
                          onClick={() => updateQuantity(item.productId, item.color, item.size, item.quantity - 1)}
                          className="w-8 h-8 flex items-center justify-center text-muted hover:text-primary transition-colors duration-200 cursor-pointer"
                          aria-label="Decrease quantity"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <path d="M5 12h14" />
                          </svg>
                        </button>
                        <span className="w-8 text-center text-sm font-medium text-primary">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.color, item.size, item.quantity + 1)}
                          className="w-8 h-8 flex items-center justify-center text-muted hover:text-primary transition-colors duration-200 cursor-pointer"
                          aria-label="Increase quantity"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <path d="M12 5v14M5 12h14" />
                          </svg>
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem(item.productId, item.color, item.size)}
                        className="text-xs text-muted hover:text-primary underline underline-offset-2 transition-colors duration-200 cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary */}
          <div className="lg:sticky lg:top-20 lg:self-start">
            <div className="bg-surface rounded-2xl p-6 space-y-4">
              <h2 className="font-heading font-bold text-lg">Summary</h2>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Subtotal</span>
                  <span className="font-medium text-primary">${totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Shipping</span>
                  <span className="font-medium text-primary">
                    {totalPrice >= 100 ? "Free" : "$9.99"}
                  </span>
                </div>
              </div>
              <hr className="border-border" />
              <div className="flex justify-between">
                <span className="font-heading font-bold">Total</span>
                <span className="font-heading font-bold">
                  ${(totalPrice + (totalPrice >= 100 ? 0 : 9.99)).toFixed(2)}
                </span>
              </div>
              <button className="w-full bg-dark text-white font-heading font-semibold text-sm py-4 rounded-full hover:bg-dark/80 transition-colors duration-200 cursor-pointer">
                Checkout
              </button>
              <Link
                href="/"
                className="block text-center text-xs text-muted hover:text-primary underline underline-offset-2 transition-colors duration-200"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
