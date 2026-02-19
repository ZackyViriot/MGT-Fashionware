"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { Product } from "@/types/product";
import ProductForm from "./ProductForm";

export default function ProductList({ initialProducts }: { initialProducts: Product[] }) {
  const supabase = createClient();
  const router = useRouter();
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (editingProduct) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [editingProduct]);

  async function handleDelete(product: Product) {
    if (!confirm("Are you sure you want to delete this product?")) return;

    if (product.images && product.images.length > 0) {
      const paths = product.images.map((url) => {
        const parts = url.split("/product-images/");
        return parts[parts.length - 1];
      });
      await supabase.storage.from("product-images").remove(paths);
    }

    const { error } = await supabase.from("products").delete().eq("id", product.id);
    if (error) {
      alert("Failed to delete: " + error.message);
      return;
    }
    router.refresh();
  }

  if (initialProducts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="font-heading font-semibold text-primary/40">No products yet</p>
        <p className="text-muted text-sm mt-1">Add your first product above.</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto -mx-6 md:-mx-8 px-6 md:px-8">
        <table className="w-full min-w-[640px]">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-[10px] font-heading font-semibold uppercase tracking-widest text-muted py-3 pr-4">Image</th>
              <th className="text-left text-[10px] font-heading font-semibold uppercase tracking-widest text-muted py-3 pr-4">Name</th>
              <th className="text-left text-[10px] font-heading font-semibold uppercase tracking-widest text-muted py-3 pr-4">Category</th>
              <th className="text-left text-[10px] font-heading font-semibold uppercase tracking-widest text-muted py-3 pr-4">Price</th>
              <th className="text-left text-[10px] font-heading font-semibold uppercase tracking-widest text-muted py-3 pr-4">Colors</th>
              <th className="text-left text-[10px] font-heading font-semibold uppercase tracking-widest text-muted py-3 pr-4">Gender</th>
              <th className="text-left text-[10px] font-heading font-semibold uppercase tracking-widest text-muted py-3 pr-4">Sizes</th>
              <th className="text-left text-[10px] font-heading font-semibold uppercase tracking-widest text-muted py-3 pr-4">Date</th>
              <th className="text-right text-[10px] font-heading font-semibold uppercase tracking-widest text-muted py-3"></th>
            </tr>
          </thead>
          <tbody>
            {initialProducts.map((product) => (
              <tr key={product.id} className="border-b border-border/50 hover:bg-bg/50 transition-colors duration-150">
                <td className="py-3 pr-4">
                  {product.images && product.images.length > 0 ? (
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      width={48}
                      height={48}
                      className="w-10 h-10 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-surface rounded-lg flex items-center justify-center">
                      <span className="text-muted/40 text-[10px]">N/A</span>
                    </div>
                  )}
                </td>
                <td className="py-3 pr-4 text-sm font-medium">{product.name}</td>
                <td className="py-3 pr-4 text-sm text-muted">{product.category || "\u2014"}</td>
                <td className="py-3 pr-4 text-sm font-semibold">${product.price.toFixed(2)}</td>
                <td className="py-3 pr-4">
                  {product.color_variants && product.color_variants.length > 0 ? (
                    <div className="flex items-center gap-1">
                      {product.color_variants.map((v, i) => (
                        <span
                          key={i}
                          title={v.color}
                          className="w-5 h-5 rounded-full border border-border"
                          style={{ backgroundColor: v.hex }}
                        />
                      ))}
                    </div>
                  ) : (
                    <span className="text-sm text-muted">&mdash;</span>
                  )}
                </td>
                <td className="py-3 pr-4 text-sm text-muted">{product.gender || "\u2014"}</td>
                <td className="py-3 pr-4 text-sm text-muted">
                  {product.sizes && product.sizes.length > 0
                    ? product.sizes.join(", ")
                    : "\u2014"}
                </td>
                <td className="py-3 pr-4 text-sm text-muted">
                  {new Date(product.created_at).toLocaleDateString()}
                </td>
                <td className="py-3 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <button
                      onClick={() => setEditingProduct(product)}
                      className="text-xs text-primary hover:text-dark font-medium transition-colors duration-200 cursor-pointer"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(product)}
                      className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors duration-200 cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-dark/50 backdrop-blur-sm"
            onClick={() => setEditingProduct(null)}
          />
          {/* Modal card */}
          <div className="relative w-full max-w-2xl mx-4 my-8 bg-card border border-border rounded-2xl p-6 md:p-8 shadow-xl">
            {/* Close button */}
            <button
              onClick={() => setEditingProduct(null)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-muted hover:text-primary transition-colors duration-200 cursor-pointer"
              aria-label="Close"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M6 6l12 12M6 18L18 6" />
              </svg>
            </button>

            <div className="mb-6">
              <h2 className="text-xl font-heading font-bold">Edit Product</h2>
              <p className="text-muted text-sm mt-1">Update the product details below</p>
            </div>

            <ProductForm
              key={editingProduct.id}
              editProduct={editingProduct}
              onCancel={() => setEditingProduct(null)}
              onSuccess={() => setEditingProduct(null)}
            />
          </div>
        </div>
      )}
    </>
  );
}
