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
  const [showBack, setShowBack] = useState(false);
  const [hovered, setHovered] = useState(false);
  const normalized = normalizeDesign(product.custom_design);
  const design = normalized.front;
  const hasBack = sideHasContent(normalized.back);
  const mainSide = showBack ? normalized.back : normalized.front;
  const thumbSide = showBack ? normalized.front : normalized.back;
  const mainSideKey = showBack ? "back" : "front";
  const thumbSideKey = showBack ? "front" : "back";

  const activeVariant = variants[activeIndex];
  const displayImage = variants.length > 0
    ? activeVariant?.image
    : fallbackImage;

  const activeShirtColor = activeVariant?.hex ?? "#0a0a0a";

  // Build gallery from modelImages for hover-to-cycle
  const modelImages = activeVariant?.modelImages;
  const allModelPhotos: string[] = [];
  if (modelImages) {
    allModelPhotos.push(...modelImages.front, ...modelImages.back);
  }
  const hasMultiplePhotos = allModelPhotos.length >= 2;

  // The image to show: on hover, show second photo if available
  const heroImage = displayImage;
  const hoverImage = hasMultiplePhotos ? allModelPhotos[1] : null;
  const shownImage = hovered && hoverImage ? hoverImage : heroImage;

  // If design exists but the active variant has a generated AI model image, show the photo instead
  const hasModelImage = design && displayImage;

  return (
    <div className="group">
      <Link href={`/product/${product.id}`} className="block">
        <div
          className="relative overflow-hidden rounded-lg bg-surface aspect-[3/4]"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          {hasModelImage ? (
            <Image
              src={shownImage!}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
            />
          ) : design ? (
            <div className="absolute inset-0 flex items-center justify-center p-4">
              <ShirtPreview
                shirtColor={activeShirtColor}
                text={mainSide?.text}
                textColor={mainSide?.textColor}
                fontFamily={mainSide?.fontFamily}
                fontSize={mainSide?.fontSize}
                imageData={mainSide?.imageData}
                imagePos={mainSide?.imagePos}
                textPos={mainSide?.textPos}
                textItems={mainSide?.textItems}
                side={mainSideKey}
                className="w-full h-full"
              />
              {hasBack && (
                <div
                  className="absolute bottom-2 right-2 w-16 h-20 rounded-md overflow-hidden border-2 border-white/50 bg-surface shadow-md cursor-pointer transition-all duration-200 hover:scale-110 hover:border-white/80"
                  onMouseEnter={() => setShowBack((prev) => !prev)}
                  onMouseLeave={() => {}}
                >
                  <ShirtPreview
                    shirtColor={activeShirtColor}
                    text={thumbSide?.text}
                    textColor={thumbSide?.textColor}
                    fontFamily={thumbSide?.fontFamily}
                    fontSize={thumbSide?.fontSize}
                    imageData={thumbSide?.imageData}
                    imagePos={thumbSide?.imagePos}
                    textPos={thumbSide?.textPos}
                    textItems={thumbSide?.textItems}
                    side={thumbSideKey}
                    className="w-full h-full"
                  />
                </div>
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
