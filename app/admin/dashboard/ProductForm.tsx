"use client";

import { useState, useRef, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

const MEN_SIZES = ["S", "M", "L", "XL", "XXL"];
const WOMEN_SIZES = ["XS", "S", "M", "L", "XL"];
const ALL_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

function getSizesForGenders(genders: string[]): string[] {
  if (genders.includes("Men") && genders.includes("Women")) return ALL_SIZES;
  if (genders.includes("Men")) return MEN_SIZES;
  if (genders.includes("Women")) return WOMEN_SIZES;
  return [];
}

interface ColorEntry {
  color: string;
  hex: string;
  file: File | null;
  preview: string;
}

export default function ProductForm() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [genderSelections, setGenderSelections] = useState<string[]>([]);
  const [sizes, setSizes] = useState<string[]>([]);
  const [colorEntries, setColorEntries] = useState<ColorEntry[]>([
    { color: "", hex: "#000000", file: null, preview: "" },
  ]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fileRefs = useRef<(HTMLInputElement | null)[]>([]);
  const router = useRouter();
  const supabase = createClient();

  const availableSizes = getSizesForGenders(genderSelections);

  function toggleGender(value: string) {
    setGenderSelections((prev) => {
      const next = prev.includes(value) ? prev.filter((g) => g !== value) : [...prev, value];
      setSizes((prevSizes) => prevSizes.filter((s) => getSizesForGenders(next).includes(s)));
      return next;
    });
  }

  function toggleSize(size: string) {
    setSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  }

  function addColorEntry() {
    setColorEntries((prev) => [...prev, { color: "", hex: "#000000", file: null, preview: "" }]);
  }

  function removeColorEntry(index: number) {
    setColorEntries((prev) => {
      if (prev[index].preview) URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  }

  function updateColorEntry(index: number, field: keyof ColorEntry, value: string) {
    setColorEntries((prev) =>
      prev.map((entry, i) => (i === index ? { ...entry, [field]: value } : entry))
    );
  }

  const handleColorImage = useCallback((index: number, file: File) => {
    const preview = URL.createObjectURL(file);
    setColorEntries((prev) =>
      prev.map((entry, i) => {
        if (i === index) {
          if (entry.preview) URL.revokeObjectURL(entry.preview);
          return { ...entry, file, preview };
        }
        return entry;
      })
    );
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    // Validate color entries
    const validEntries = colorEntries.filter((e) => e.color.trim() && e.file);
    if (validEntries.length === 0) {
      setMessage({ type: "error", text: "Add at least one color with an image." });
      setLoading(false);
      return;
    }

    // Upload images and build color_variants
    const colorVariants: { color: string; hex: string; image: string }[] = [];
    const allImageUrls: string[] = [];

    for (const entry of validEntries) {
      if (!entry.file) continue;
      const ext = entry.file.name.split(".").pop();
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(path, entry.file);

      if (uploadError) {
        setMessage({ type: "error", text: `Image upload failed: ${uploadError.message}` });
        setLoading(false);
        return;
      }

      const { data: urlData } = supabase.storage
        .from("product-images")
        .getPublicUrl(path);

      colorVariants.push({
        color: entry.color.trim(),
        hex: entry.hex,
        image: urlData.publicUrl,
      });
      allImageUrls.push(urlData.publicUrl);
    }

    const gender = genderSelections.join(",") || null;

    const { error } = await supabase.from("products").insert({
      name,
      description,
      price: parseFloat(price),
      images: allImageUrls,
      color_variants: colorVariants,
      category: category || null,
      gender,
      sizes,
    });

    if (error) {
      setMessage({ type: "error", text: error.message });
      setLoading(false);
      return;
    }

    setMessage({ type: "success", text: "Product added!" });
    setName("");
    setDescription("");
    setPrice("");
    setCategory("");
    setGenderSelections([]);
    setSizes([]);
    colorEntries.forEach((e) => { if (e.preview) URL.revokeObjectURL(e.preview); });
    setColorEntries([{ color: "", hex: "#000000", file: null, preview: "" }]);
    setLoading(false);
    router.refresh();
  }

  const inputClass =
    "w-full bg-bg rounded-lg px-4 py-3 text-sm text-primary placeholder:text-muted/50 border border-border focus:border-primary focus:outline-none transition-colors duration-200";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-heading font-semibold uppercase tracking-widest text-primary mb-2">
            Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Product name"
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs font-heading font-semibold uppercase tracking-widest text-primary mb-2">
            Price *
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
            placeholder="0.00"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-heading font-semibold uppercase tracking-widest text-primary mb-2">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Describe the product..."
          className={`${inputClass} resize-none`}
        />
      </div>

      <div>
        <label className="block text-xs font-heading font-semibold uppercase tracking-widest text-primary mb-2">
          Category
        </label>
        <input
          type="text"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="e.g. Tops, Bottoms, Outerwear"
          className={inputClass}
        />
      </div>

      <div>
        <label className="block text-xs font-heading font-semibold uppercase tracking-widest text-primary mb-2">
          Gender *
        </label>
        <div className="flex gap-3">
          {(["Men", "Women"] as const).map((g) => {
            const isSelected = genderSelections.includes(g);
            return (
              <label
                key={g}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg border text-sm font-medium cursor-pointer transition-all duration-200 select-none ${
                  isSelected
                    ? "bg-dark text-white border-dark"
                    : "bg-bg text-primary border-border hover:border-primary"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleGender(g)}
                  className="sr-only"
                />
                {g}
              </label>
            );
          })}
        </div>
      </div>

      {genderSelections.length > 0 && (
        <div>
          <label className="block text-xs font-heading font-semibold uppercase tracking-widest text-primary mb-2">
            Sizes
          </label>
          <div className="flex flex-wrap gap-2">
            {availableSizes.map((size) => {
              const isSelected = sizes.includes(size);
              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => toggleSize(size)}
                  className={`w-12 h-12 flex items-center justify-center rounded-lg text-sm font-medium border transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? "bg-dark text-white border-dark"
                      : "bg-bg text-primary border-border hover:border-primary"
                  }`}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Color Variants */}
      <div>
        <label className="block text-xs font-heading font-semibold uppercase tracking-widest text-primary mb-2">
          Color Variants *
        </label>
        <div className="space-y-3">
          {colorEntries.map((entry, index) => (
            <div
              key={index}
              className="bg-bg border border-border rounded-xl p-4 space-y-3"
            >
              <div className="flex items-center gap-3">
                {/* Color picker */}
                <div className="shrink-0">
                  <input
                    type="color"
                    value={entry.hex}
                    onChange={(e) => updateColorEntry(index, "hex", e.target.value)}
                    className="w-10 h-10 rounded-lg border border-border cursor-pointer appearance-none bg-transparent [&::-webkit-color-swatch-wrapper]:p-0.5 [&::-webkit-color-swatch]:rounded-md [&::-webkit-color-swatch]:border-none"
                  />
                </div>
                {/* Color name */}
                <input
                  type="text"
                  value={entry.color}
                  onChange={(e) => updateColorEntry(index, "color", e.target.value)}
                  placeholder="Color name (e.g. Black, Navy)"
                  className="flex-1 bg-card rounded-lg px-3 py-2.5 text-sm text-primary placeholder:text-muted/50 border border-border focus:border-primary focus:outline-none transition-colors duration-200"
                />
                {/* Remove */}
                {colorEntries.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeColorEntry(index)}
                    className="shrink-0 w-8 h-8 flex items-center justify-center text-muted hover:text-red-500 transition-colors duration-200 cursor-pointer"
                    aria-label="Remove color"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                      <path d="M6 6l12 12M6 18L18 6" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Image upload */}
              {entry.preview ? (
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={entry.preview}
                    alt={`${entry.color || "Color"} preview`}
                    className="w-20 h-20 object-cover rounded-lg border border-border"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      URL.revokeObjectURL(entry.preview);
                      setColorEntries((prev) =>
                        prev.map((e, i) => (i === index ? { ...e, file: null, preview: "" } : e))
                      );
                    }}
                    className="text-xs text-muted hover:text-red-500 underline underline-offset-2 transition-colors duration-200 cursor-pointer"
                  >
                    Remove image
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRefs.current[index]?.click()}
                  className="w-full border border-dashed border-border rounded-lg py-4 text-center text-sm text-muted hover:border-muted transition-colors duration-200 cursor-pointer"
                >
                  <svg className="w-5 h-5 mx-auto mb-1 text-muted/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                  </svg>
                  Upload image for this color
                </button>
              )}
              <input
                ref={(el) => { fileRefs.current[index] = el; }}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleColorImage(index, file);
                  e.target.value = "";
                }}
                className="hidden"
              />
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addColorEntry}
          className="mt-3 flex items-center gap-2 text-sm font-medium text-muted hover:text-primary transition-colors duration-200 cursor-pointer"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Add another color
        </button>
      </div>

      {message && (
        <div
          className={`text-sm rounded-lg px-4 py-3 ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-red-50 text-red-600 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="bg-dark text-white font-heading font-semibold text-sm px-8 py-3.5 rounded-lg hover:bg-dark/80 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        {loading ? "Adding..." : "Add Product"}
      </button>
    </form>
  );
}
