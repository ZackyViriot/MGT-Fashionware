"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { Product } from "@/types/product";
import { normalizeDesign, sideHasContent } from "@/utils/design-helpers";
import ShirtPreview from "./ShirtPreview";

export default function ProductCard({ product }: { product: Product }) {
  const variants = product.color_variants ?? [];
  const fallbackImage = product.images?.[0];
  const [activeIndex, setActiveIndex] = useState(0);
  const normalized = normalizeDesign(product.custom_design);
  const design = normalized.front;
  const hasBack = sideHasContent(normalized.back);

  const displayImage = variants.length > 0
    ? variants[activeIndex]?.image
    : fallbackImage;

  const activeShirtColor = variants[activeIndex]?.hex ?? "#0a0a0a";

  return (
    <div className="group">
      <Link href={`/product/${product.id}`} className="block">
        <div className="relative overflow-hidden rounded-lg bg-surface aspect-[3/4]">
          {design ? (
            <div className="absolute inset-0 flex items-center justify-center p-4">
              <ShirtPreview
                shirtColor={activeShirtColor}
                text={design.text}
                textColor={design.textColor}
                fontFamily={design.fontFamily}
                fontSize={design.fontSize}
                imageData={design.imageData}
                imagePos={design.imagePos}
                textPos={design.textPos}
                side="front"
                className="w-full h-full"
              />
              {hasBack && (
                <span className="absolute top-2 right-2 bg-dark/70 text-white text-[10px] font-medium px-2 py-0.5 rounded-full">
                  Front &amp; Back
                </span>
              )}
            </div>
          ) : displayImage ? (
            <Image
              src={displayImage}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-muted/20">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </div>
          )}
        </div>
      </Link>

      <div className="mt-3 space-y-0.5">
        <Link href={`/product/${product.id}`}>
          <h3 className="text-[13px] font-semibold text-primary leading-snug">
            {product.name}
          </h3>
        </Link>
        {product.category && (
          <p className="text-[12px] text-muted">{product.category}</p>
        )}
        {variants.length > 1 && (
          <p className="text-[12px] text-muted">{variants.length} Colors</p>
        )}
        <p className="text-[13px] font-semibold text-primary pt-1">
          ${product.price.toFixed(2)}
        </p>
      </div>

      {variants.length > 1 && (
        <div className="flex items-center gap-1.5 mt-2.5">
          {variants.map((v, i) => (
            <button
              key={i}
              onMouseEnter={() => setActiveIndex(i)}
              onClick={(e) => {
                e.preventDefault();
                setActiveIndex(i);
              }}
              aria-label={v.color}
              title={v.color}
              className={`w-3.5 h-3.5 rounded-full border transition-all duration-150 cursor-pointer ${
                i === activeIndex
                  ? "border-primary scale-125"
                  : "border-border hover:border-muted"
              }`}
              style={{ backgroundColor: v.hex }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
