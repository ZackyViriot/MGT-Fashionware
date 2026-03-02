"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useCart } from "@/utils/cart-context";
import type { Product } from "@/types/product";
import { normalizeDesign, sideHasContent } from "@/utils/design-helpers";
import ShirtPreview from "./ShirtPreview";

interface GalleryImage {
  url: string;
  label: string;
}

export default function ProductDetail({ product }: { product: Product }) {
  const variants = product.color_variants ?? [];
  const hasVariants = variants.length > 0;
  const normalized = normalizeDesign(product.custom_design);
  const hasDesign = !!(normalized.front || normalized.back);
  const hasBack = sideHasContent(normalized.back);

  const [selectedColor, setSelectedColor] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [activeSide, setActiveSide] = useState<"front" | "back">("front");
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const { addItem } = useCart();

  const currentVariant = hasVariants ? variants[selectedColor] : null;
  const displayImage = currentVariant?.image ?? product.images?.[0];
  const activeShirtColor = currentVariant?.hex ?? "#0a0a0a";

  // Build gallery from modelImages
  const modelImages = currentVariant?.modelImages;
  const galleryImages: GalleryImage[] = [];
  if (modelImages) {
    modelImages.front.forEach((url, i) => galleryImages.push({ url, label: `Front ${i + 1}` }));
    modelImages.back.forEach((url, i) => galleryImages.push({ url, label: `Back ${i + 1}` }));
  }
  // Fallback: if no modelImages but there's a single AI image
  if (galleryImages.length === 0 && hasDesign && displayImage) {
    galleryImages.push({ url: displayImage, label: "Front 1" });
  }

  const hasModelGallery = hasDesign && galleryImages.length > 0;

  const allImages = hasVariants
    ? [currentVariant?.image].filter(Boolean) as string[]
    : product.images ?? [];

  // Reset gallery index when color changes
  useEffect(() => {
    setActiveImageIndex(0);
  }, [selectedColor]);

  function handleAddToCart() {
    if (!selectedSize) return;
    const colorName = hasVariants ? variants[selectedColor].color : "Default";
    const image = displayImage || "";

    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      image,
      color: colorName,
      size: selectedSize,
    }, quantity);

    setAdded(true);
    setQuantity(1);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <section className="py-10 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumbs */}
        <nav className="mb-8">
          <ol className="flex items-center gap-2 text-sm">
            <li>
              <Link href="/" className="text-muted hover:text-primary transition-colors duration-200">
                Home
              </Link>
            </li>
            <li className="text-border">/</li>
            {product.gender && (
              <>
                <li>
                  <Link
                    href={product.gender.includes("Women") ? "/women" : "/men"}
                    className="text-muted hover:text-primary transition-colors duration-200"
                  >
                    {product.gender.includes("Women") ? "Women" : "Men"}
                  </Link>
                </li>
                <li className="text-border">/</li>
              </>
            )}
            <li className="text-primary font-medium">{product.name}</li>
          </ol>
        </nav>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {/* Images / Shirt Preview — Nike-style thumbnails + main view */}
          <div className="flex gap-3">
            {hasModelGallery ? (
              /* AI model photo gallery for custom-design product */
              <>
                {galleryImages.length > 1 && (
                  <div className="flex flex-col gap-2 w-16 shrink-0">
                    {galleryImages.map((img, i) => (
                      <button
                        key={`${selectedColor}-model-${i}`}
                        onClick={() => setActiveImageIndex(i)}
                        className={`relative rounded-lg overflow-hidden bg-surface aspect-[3/4] border-2 transition-all duration-200 cursor-pointer ${
                          activeImageIndex === i
                            ? "border-dark"
                            : "border-transparent hover:border-muted"
                        }`}
                      >
                        <Image
                          src={img.url}
                          alt={`${product.name} - ${img.label}`}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                        <span className="absolute bottom-0 left-0 right-0 text-[8px] text-center bg-black/50 text-white py-0.5 leading-none">
                          {img.label}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
                <div className="flex-1 overflow-hidden rounded-2xl bg-surface">
                  <Image
                    src={galleryImages[activeImageIndex]?.url ?? displayImage!}
                    alt={`${product.name} - ${galleryImages[activeImageIndex]?.label ?? "Photo"}`}
                    width={600}
                    height={800}
                    priority
                    className="w-full h-auto object-cover"
                  />
                </div>
              </>
            ) : hasDesign && hasBack ? (
              <>
                <div className="flex flex-col gap-2 w-16 shrink-0">
                  {(["front", "back"] as const).map((side) => {
                    const sideData = normalized[side];
                    return (
                      <button
                        key={side}
                        onClick={() => setActiveSide(side)}
                        className={`relative rounded-lg overflow-hidden bg-surface aspect-[3/4] border-2 transition-all duration-200 cursor-pointer ${
                          activeSide === side
                            ? "border-dark"
                            : "border-transparent hover:border-muted"
                        }`}
                      >
                        <ShirtPreview
                          shirtColor={activeShirtColor}
                          text={sideData?.text}
                          textColor={sideData?.textColor}
                          fontFamily={sideData?.fontFamily}
                          fontSize={sideData?.fontSize}
                          imageData={sideData?.imageData}
                          imagePos={sideData?.imagePos}
                          textPos={sideData?.textPos}
                          textItems={sideData?.textItems}
                          side={side}
                          className="w-full h-full"
                        />
                      </button>
                    );
                  })}
                </div>
                {/* Main preview */}
                <div className="flex-1 overflow-hidden rounded-2xl bg-surface flex items-center justify-center p-8">
                  <ShirtPreview
                    shirtColor={activeShirtColor}
                    text={normalized[activeSide]?.text}
                    textColor={normalized[activeSide]?.textColor}
                    fontFamily={normalized[activeSide]?.fontFamily}
                    fontSize={normalized[activeSide]?.fontSize}
                    imageData={normalized[activeSide]?.imageData}
                    imagePos={normalized[activeSide]?.imagePos}
                    textPos={normalized[activeSide]?.textPos}
                    textItems={normalized[activeSide]?.textItems}
                    side={activeSide}
                    className="w-full max-w-md"
                  />
                </div>
              </>
            ) : hasDesign ? (
              <div className="flex-1 overflow-hidden rounded-2xl bg-surface flex items-center justify-center p-8">
                <ShirtPreview
                  shirtColor={activeShirtColor}
                  text={normalized.front?.text}
                  textColor={normalized.front?.textColor}
                  fontFamily={normalized.front?.fontFamily}
                  fontSize={normalized.front?.fontSize}
                  imageData={normalized.front?.imageData}
                  imagePos={normalized.front?.imagePos}
                  textPos={normalized.front?.textPos}
                  textItems={normalized.front?.textItems}
                  side="front"
                  className="w-full max-w-md"
                />
              </div>
            ) : allImages.length > 0 ? (
              <>
                {allImages.length > 1 && (
                  <div className="flex flex-col gap-2 w-16 shrink-0">
                    {allImages.map((url, i) => (
                      <button
                        key={`${selectedColor}-thumb-${i}`}
                        onClick={() => setActiveImageIndex(i)}
                        className={`relative rounded-lg overflow-hidden bg-surface aspect-[3/4] border-2 transition-all duration-200 cursor-pointer ${
                          activeImageIndex === i
                            ? "border-dark"
                            : "border-transparent hover:border-muted"
                        }`}
                      >
                        <Image
                          src={url}
                          alt={`${product.name} - Thumb ${i + 1}`}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
                <div className="flex-1 overflow-hidden rounded-2xl bg-surface">
                  <Image
                    src={allImages[activeImageIndex] ?? allImages[0]}
                    alt={`${product.name}`}
                    width={600}
                    height={800}
                    priority
                    className="w-full h-auto object-cover"
                  />
                </div>
              </>
            ) : (
              <div className="flex-1 aspect-[3/4] bg-surface rounded-2xl flex items-center justify-center">
                <p className="text-muted/50 text-sm">No images available</p>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="md:sticky md:top-20 md:self-start space-y-6">
            {product.category && (
              <p className="font-heading font-semibold text-xs uppercase tracking-widest text-muted">
                {product.category}
              </p>
            )}
            <h1 className="text-2xl md:text-3xl">{product.name}</h1>
            <p className="font-semibold text-xl text-primary">
              ${product.price.toFixed(2)}
            </p>

            {product.description && (
              <p className="text-muted leading-relaxed text-sm">{product.description}</p>
            )}

            {/* Color selection */}
            {hasVariants && (
              <div>
                <h3 className="font-heading font-semibold text-xs uppercase tracking-widest text-primary mb-3">
                  Color &mdash; {variants[selectedColor].color}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {variants.map((v, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedColor(i)}
                      aria-label={v.color}
                      title={v.color}
                      className={`w-8 h-8 rounded-full border-2 transition-all duration-200 cursor-pointer ${
                        i === selectedColor
                          ? "border-primary scale-110"
                          : "border-border hover:border-muted"
                      }`}
                      style={{ backgroundColor: v.hex }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Size selection */}
            {product.sizes && product.sizes.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-heading font-semibold text-xs uppercase tracking-widest text-primary">
                    Select size
                  </h3>
                  <Link
                    href="/size-guide"
                    className="text-xs text-muted hover:text-primary underline underline-offset-2 transition-colors duration-200"
                  >
                    Size Guide
                  </Link>
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`w-12 h-12 flex items-center justify-center rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                        selectedSize === size
                          ? "bg-dark text-white border border-dark"
                          : "border border-border text-primary hover:border-dark"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div>
              <h3 className="font-heading font-semibold text-xs uppercase tracking-widest text-primary mb-3">
                Quantity
              </h3>
              <div className="flex items-center border border-border rounded-lg w-fit">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-10 h-10 flex items-center justify-center text-muted hover:text-primary transition-colors duration-200 cursor-pointer"
                  aria-label="Decrease quantity"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M5 12h14" />
                  </svg>
                </button>
                <span className="w-10 text-center text-sm font-semibold text-primary">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => q + 1)}
                  className="w-10 h-10 flex items-center justify-center text-muted hover:text-primary transition-colors duration-200 cursor-pointer"
                  aria-label="Increase quantity"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Add to Cart */}
            <button
              onClick={handleAddToCart}
              disabled={!selectedSize}
              className={`w-full font-heading font-semibold text-sm py-4 rounded-full transition-all duration-200 cursor-pointer ${
                added
                  ? "bg-emerald-600 text-white"
                  : selectedSize
                    ? "bg-dark text-white hover:bg-dark/80"
                    : "bg-border text-muted cursor-not-allowed"
              }`}
            >
              {added ? "Added to Cart" : selectedSize ? `Add to Cart${quantity > 1 ? ` (${quantity})` : ""}` : "Select a Size"}
            </button>

            <div className="flex flex-wrap gap-5">
              <span className="text-xs text-muted uppercase tracking-wider">
                Free shipping over $100
              </span>
              <span className="text-xs text-muted uppercase tracking-wider">
                Easy returns
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
