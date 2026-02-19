"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/utils/cart-context";
import type { Product } from "@/types/product";

export default function ProductDetail({ product }: { product: Product }) {
  const variants = product.color_variants ?? [];
  const hasVariants = variants.length > 0;

  const [selectedColor, setSelectedColor] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  const { addItem } = useCart();

  const displayImage = hasVariants
    ? variants[selectedColor]?.image
    : product.images?.[0];

  const allImages = hasVariants
    ? [variants[selectedColor]?.image].filter(Boolean) as string[]
    : product.images ?? [];

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
    });

    setAdded(true);
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
          {/* Images */}
          <div className="space-y-3">
            {allImages.length > 0 ? (
              allImages.map((url, i) => (
                <div key={`${selectedColor}-${i}`} className="overflow-hidden rounded-2xl bg-surface">
                  <Image
                    src={url}
                    alt={`${product.name} - Image ${i + 1}`}
                    width={600}
                    height={800}
                    priority={i === 0}
                    className="w-full h-auto object-cover"
                  />
                </div>
              ))
            ) : (
              <div className="w-full aspect-[3/4] bg-surface rounded-2xl flex items-center justify-center">
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
              {added ? "Added to Cart" : selectedSize ? "Add to Cart" : "Select a Size"}
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
