"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { useCart } from "@/utils/cart-context";
import { normalizeCustomDesign, sideHasContent } from "@/utils/design-helpers";
import { GARMENT_CONFIGS, isValidGarmentType } from "@/constants/garment-types";
import ShirtPreview from "./ShirtPreview";

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
}

export default function CartDrawer({ open, onClose }: CartDrawerProps) {
  const { items, removeItem, updateQuantity, totalPrice, totalItems } = useCart();

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Close on escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-[60] bg-dark/40 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 z-[70] h-full w-full max-w-md bg-bg shadow-2xl transition-transform duration-300 ease-out flex flex-col ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 h-14 border-b border-border shrink-0">
          <h2 className="font-heading font-bold text-lg">
            Cart ({totalItems})
          </h2>
          <button
            onClick={onClose}
            aria-label="Close cart"
            className="text-muted hover:text-primary transition-colors duration-200 cursor-pointer"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M6 6l12 12M6 18L18 6" />
            </svg>
          </button>
        </div>

        {/* Items */}
        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center px-6">
            <svg className="w-12 h-12 text-muted/20 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0" />
            </svg>
            <p className="font-heading font-semibold text-sm text-muted/60">Your cart is empty</p>
            <button
              onClick={onClose}
              className="mt-4 text-sm text-muted hover:text-primary underline underline-offset-2 transition-colors duration-200 cursor-pointer"
            >
              Continue shopping
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-0 divide-y divide-border">
              {items.map((item) => {
                const key = `${item.productId}-${item.color}-${item.size}`;
                const nd = item.isCustom && item.customDesign ? normalizeCustomDesign(item.customDesign) : null;
                const frontSide = nd?.front;
                const hasBackDesign = nd ? sideHasContent(nd.back) : false;
                return (
                  <div key={key} className="flex gap-3 py-4 first:pt-0">
                    {/* Thumbnail */}
                    {item.isCustom && nd ? (
                      <div className="shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-surface flex items-center justify-center">
                        <ShirtPreview
                          shirtColor={nd.shirtColor}
                          text={frontSide?.text}
                          textColor={frontSide?.textColor}
                          fontFamily={frontSide?.fontFamily}
                          fontSize={frontSide?.fontSize ?? 24}
                          imageData={frontSide?.imageData}
                          imagePos={frontSide?.imagePos}
                          textPos={frontSide?.textPos}
                          textItems={frontSide?.textItems}
                          side="front"
                          className="w-16 h-16"
                        />
                      </div>
                    ) : (
                      <Link href={`/product/${item.productId}`} onClick={onClose} className="shrink-0">
                        <div className="w-20 h-20 relative rounded-lg overflow-hidden bg-surface">
                          {item.image ? (
                            <Image
                              src={item.image}
                              alt={item.name}
                              fill
                              sizes="80px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted/30 text-[10px]">
                              No img
                            </div>
                          )}
                        </div>
                      </Link>
                    )}

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      {item.isCustom ? (
                        <h3 className="text-[13px] font-semibold text-primary leading-snug truncate">
                          {`Custom ${isValidGarmentType(nd?.garmentType ?? "") ? GARMENT_CONFIGS[nd!.garmentType].label : "Shirt"}`}
                        </h3>
                      ) : (
                        <Link href={`/product/${item.productId}`} onClick={onClose}>
                          <h3 className="text-[13px] font-semibold text-primary leading-snug truncate">
                            {item.name}
                          </h3>
                        </Link>
                      )}
                      <p className="text-[11px] text-muted mt-0.5">
                        {item.color} / {item.size}
                        {hasBackDesign && " · Front & Back"}
                      </p>
                      <p className="text-[13px] font-semibold text-primary mt-1">
                        ${item.price.toFixed(2)}
                      </p>

                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center border border-border rounded-md">
                          <button
                            onClick={() => updateQuantity(item.productId, item.color, item.size, item.quantity - 1)}
                            className="w-7 h-7 flex items-center justify-center text-muted hover:text-primary transition-colors duration-200 cursor-pointer"
                            aria-label="Decrease"
                          >
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                              <path d="M5 12h14" />
                            </svg>
                          </button>
                          <span className="w-6 text-center text-xs font-medium text-primary">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.productId, item.color, item.size, item.quantity + 1)}
                            className="w-7 h-7 flex items-center justify-center text-muted hover:text-primary transition-colors duration-200 cursor-pointer"
                            aria-label="Increase"
                          >
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                              <path d="M12 5v14M5 12h14" />
                            </svg>
                          </button>
                        </div>
                        <button
                          onClick={() => removeItem(item.productId, item.color, item.size)}
                          className="text-[11px] text-muted hover:text-primary transition-colors duration-200 cursor-pointer"
                          aria-label="Remove item"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="shrink-0 border-t border-border px-6 py-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">Subtotal</span>
                <span className="font-heading font-bold text-lg">${totalPrice.toFixed(2)}</span>
              </div>
              {totalPrice > 0 && totalPrice < 100 && (
                <p className="text-[11px] text-muted">
                  ${(100 - totalPrice).toFixed(2)} away from free shipping
                </p>
              )}
              {totalPrice >= 100 && (
                <p className="text-[11px] text-emerald-600 font-medium">
                  You qualify for free shipping
                </p>
              )}
              <Link
                href="/checkout"
                onClick={onClose}
                className="block w-full bg-dark text-white font-heading font-semibold text-sm py-3.5 rounded-full hover:bg-dark/80 transition-colors duration-200 text-center"
              >
                Checkout
              </Link>
              <Link
                href="/cart"
                onClick={onClose}
                className="block text-center text-xs text-muted hover:text-primary underline underline-offset-2 transition-colors duration-200"
              >
                View full cart
              </Link>
            </div>
          </>
        )}
      </div>
    </>
  );
}
