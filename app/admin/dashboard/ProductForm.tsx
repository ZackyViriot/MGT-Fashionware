"use client";

import { useState, useRef, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import type { Product, ProductDesign } from "@/types/product";
import type { ElementPosition, TextItem } from "@/utils/cart-context";
import { SHIRT_COLORS } from "@/constants/shirt-colors";
import { LIGHT_SHIRT_VALUES } from "@/constants/shirt-colors";
import { FONT_GROUPS, FONT_SIZE_MIN, FONT_SIZE_MAX, FONT_SIZE_DEFAULT, getTextColors } from "@/constants/design-config";
import { normalizeDesign } from "@/utils/design-helpers";
import { GARMENT_CONFIGS, GARMENT_TYPES, type GarmentType, type GarmentSide } from "@/constants/garment-types";
import ShirtEditor from "@/components/ShirtEditor";

const MEN_SIZES = ["S", "M", "L", "XL", "XXL"];
const WOMEN_SIZES = ["XS", "S", "M", "L", "XL"];
const ALL_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

const DEFAULT_IMAGE_POS: ElementPosition = { x: 100, y: 110, scale: 1 };
const DEFAULT_TEXT_POS: ElementPosition = { x: 100, y: 130, scale: 1 };

let nextAdminTextId = 1;
function makeTextId() {
  return `at-${nextAdminTextId++}-${Date.now()}`;
}

function getSizesForGenders(genders: string[]): string[] {
  if (genders.includes("Men") && genders.includes("Women")) return ALL_SIZES;
  if (genders.includes("Men")) return MEN_SIZES;
  if (genders.includes("Women")) return WOMEN_SIZES;
  return [];
}

interface ColorImageEntry {
  file: File | null;
  preview: string;
  existingUrl?: string;
}

interface ProductFormProps {
  editProduct?: Product | null;
  onCancel?: () => void;
  onSuccess?: () => void;
}

interface SideState {
  imageData: string;
  imageName: string;
  imagePos: ElementPosition;
  textItems: TextItem[];
  fontGroupIdx: number;
}

function defaultSideState(): SideState {
  return {
    imageData: "",
    imageName: "",
    imagePos: DEFAULT_IMAGE_POS,
    textItems: [],
    fontGroupIdx: 0,
  };
}

function sideStateFromDesign(d: {
  text?: string;
  textColor?: string;
  fontSize?: number;
  fontFamily?: string;
  imageData?: string;
  imagePos?: { x: number; y: number; scale: number };
  textPos?: { x: number; y: number; scale: number };
  textItems?: { id: string; text: string; textColor: string; fontSize: number; fontFamily: string; pos: { x: number; y: number; scale: number } }[];
} | undefined): SideState {
  if (!d) return defaultSideState();

  // If the design already has textItems, use them
  let textItems: TextItem[] = [];
  if (d.textItems && d.textItems.length > 0) {
    textItems = d.textItems.map((t) => ({
      id: t.id || makeTextId(),
      text: t.text,
      textColor: t.textColor,
      fontSize: t.fontSize,
      fontFamily: t.fontFamily,
      pos: t.pos,
    }));
  } else if (d.text) {
    // Legacy single text — convert to a text item
    textItems = [{
      id: makeTextId(),
      text: d.text,
      textColor: d.textColor ?? "#ffffff",
      fontSize: d.fontSize ?? FONT_SIZE_DEFAULT,
      fontFamily: d.fontFamily ?? FONT_GROUPS[0].fonts[0].value,
      pos: d.textPos ?? DEFAULT_TEXT_POS,
    }];
  }

  return {
    imageData: d.imageData ?? "",
    imageName: "",
    imagePos: d.imagePos ?? DEFAULT_IMAGE_POS,
    textItems,
    fontGroupIdx: 0,
  };
}

export default function ProductForm({ editProduct, onCancel, onSuccess }: ProductFormProps = {}) {
  const isEditing = !!editProduct;

  const [name, setName] = useState(editProduct?.name ?? "");
  const [description, setDescription] = useState(editProduct?.description ?? "");
  const [price, setPrice] = useState(editProduct ? String(editProduct.price) : "");
  const [category, setCategory] = useState(editProduct?.garment_type ?? editProduct?.category ?? "");
  const [genderSelections, setGenderSelections] = useState<string[]>(
    editProduct?.gender ? editProduct.gender.split(",") : []
  );
  const [sizes, setSizes] = useState<string[]>(editProduct?.sizes ?? []);

  const [selectedColors, setSelectedColors] = useState<string[]>(() => {
    if (editProduct?.color_variants && editProduct.color_variants.length > 0) {
      return editProduct.color_variants.map((v) => {
        const match = SHIRT_COLORS.find((sc) => sc.name === v.color);
        return match?.value ?? v.hex;
      });
    }
    return [];
  });

  const [colorImages, setColorImages] = useState<Record<string, ColorImageEntry>>(() => {
    if (editProduct?.color_variants && editProduct.color_variants.length > 0 && !editProduct.custom_design) {
      const images: Record<string, ColorImageEntry> = {};
      for (const v of editProduct.color_variants) {
        const match = SHIRT_COLORS.find((sc) => sc.name === v.color);
        const key = match?.value ?? v.hex;
        images[key] = { file: null, preview: "", existingUrl: v.image };
      }
      return images;
    }
    return {};
  });

  const [customDesignEnabled, setCustomDesignEnabled] = useState(!!editProduct?.custom_design);
  const [activeSide, setActiveSide] = useState<GarmentSide>("front");

  const normalizedEdit = editProduct?.custom_design ? normalizeDesign(editProduct.custom_design) : null;
  const [frontDesign, setFrontDesign] = useState<SideState>(() =>
    normalizedEdit ? sideStateFromDesign(normalizedEdit.front) : defaultSideState()
  );
  const [backDesign, setBackDesign] = useState<SideState>(() =>
    normalizedEdit ? sideStateFromDesign(normalizedEdit.back) : defaultSideState()
  );

  const currentDesign = activeSide === "front" ? frontDesign : backDesign;
  const setCurrentDesign = activeSide === "front" ? setFrontDesign : setBackDesign;

  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const designFileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const supabase = createClient();

  const selectedGarmentConfig = (category && category in GARMENT_CONFIGS)
    ? GARMENT_CONFIGS[category as GarmentType]
    : null;

  const availableSizes = getSizesForGenders(genderSelections);
  const previewShirtColor = selectedColors[0] ?? "#0a0a0a";
  const currentTextColors = getTextColors(previewShirtColor);
  const hasDesignImage = currentDesign.imageData.length > 0;
  const selectedTextItem = currentDesign.textItems.find((t) => t.id === selectedTextId) ?? null;

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

  function toggleColor(hex: string) {
    setSelectedColors((prev) => {
      if (prev.includes(hex)) {
        const entry = colorImages[hex];
        if (entry?.preview) URL.revokeObjectURL(entry.preview);
        setColorImages((imgs) => {
          const next = { ...imgs };
          delete next[hex];
          return next;
        });
        return prev.filter((c) => c !== hex);
      }
      return [...prev, hex];
    });
  }

  const handleColorImage = useCallback((hex: string, file: File) => {
    const preview = URL.createObjectURL(file);
    setColorImages((prev) => {
      const existing = prev[hex];
      if (existing?.preview) URL.revokeObjectURL(existing.preview);
      return { ...prev, [hex]: { file, preview, existingUrl: undefined } };
    });
  }, []);

  function handleShirtColorChange(hex: string) {
    const newOptions = getTextColors(hex);
    const fixColors = (prev: SideState): SideState => ({
      ...prev,
      textItems: prev.textItems.map((t) => {
        if (!newOptions.find((c) => c.value === t.textColor)) {
          return { ...t, textColor: newOptions[0].value };
        }
        return t;
      }),
    });
    setFrontDesign(fixColors);
    setBackDesign(fixColors);
  }

  function handleDesignImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    const img = new window.Image();
    img.onload = () => {
      const MAX = 400;
      let { width, height } = img;
      if (width > MAX || height > MAX) {
        const ratio = Math.min(MAX / width, MAX / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);
      const compressed = canvas.toDataURL("image/jpeg", 0.8);
      setCurrentDesign((prev) => ({
        ...prev,
        imageData: compressed,
        imageName: file.name,
        imagePos: DEFAULT_IMAGE_POS,
      }));
      URL.revokeObjectURL(img.src);
    };
    img.src = URL.createObjectURL(file);
  }

  function clearDesignImage() {
    setCurrentDesign((prev) => ({
      ...prev,
      imageData: "",
      imageName: "",
      imagePos: DEFAULT_IMAGE_POS,
    }));
    if (designFileRef.current) designFileRef.current.value = "";
  }

  function addTextField() {
    const id = makeTextId();
    const defaultColor = currentTextColors[0].value;
    const newItem: TextItem = {
      id,
      text: "",
      textColor: defaultColor,
      fontSize: FONT_SIZE_DEFAULT,
      fontFamily: FONT_GROUPS[0].fonts[0].value,
      pos: DEFAULT_TEXT_POS,
    };
    setCurrentDesign((prev) => ({ ...prev, textItems: [...prev.textItems, newItem] }));
    setSelectedTextId(id);
  }

  function removeTextField(id: string) {
    setCurrentDesign((prev) => ({
      ...prev,
      textItems: prev.textItems.filter((t) => t.id !== id),
    }));
    if (selectedTextId === id) setSelectedTextId(null);
  }

  function updateTextItem(id: string, updates: Partial<TextItem>) {
    setCurrentDesign((prev) => ({
      ...prev,
      textItems: prev.textItems.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    }));
  }

  function handleSelect(type: "image" | "text", id?: string) {
    setSelectedTextId(type === "text" && id ? id : null);
  }

  function handleDeselect() {
    setSelectedTextId(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (selectedColors.length === 0) {
      setMessage({ type: "error", text: "Select at least one color." });
      setLoading(false);
      return;
    }

    const colorVariants: { color: string; hex: string; image: string }[] = [];
    const allImageUrls: string[] = [];

    if (customDesignEnabled) {
      const fHasContent = frontDesign.textItems.length > 0 || frontDesign.imageData.length > 0;
      const bHasContent = backDesign.textItems.length > 0 || backDesign.imageData.length > 0;

      if (!fHasContent && !bHasContent) {
        setMessage({ type: "error", text: "Add text or an image to the custom design." });
        setLoading(false);
        return;
      }

      for (const hex of selectedColors) {
        const colorName = SHIRT_COLORS.find((sc) => sc.value === hex)?.name ?? "";
        colorVariants.push({ color: colorName, hex, image: "" });
      }
    } else {
      const colorsMissingImages = selectedColors.filter((hex) => {
        const entry = colorImages[hex];
        return !entry || (!entry.file && !entry.existingUrl);
      });

      if (colorsMissingImages.length > 0) {
        const names = colorsMissingImages
          .map((hex) => SHIRT_COLORS.find((sc) => sc.value === hex)?.name ?? hex)
          .join(", ");
        setMessage({ type: "error", text: `Missing images for: ${names}` });
        setLoading(false);
        return;
      }

      for (const hex of selectedColors) {
        const entry = colorImages[hex];
        const colorName = SHIRT_COLORS.find((sc) => sc.value === hex)?.name ?? "";

        if (entry.existingUrl && !entry.file) {
          colorVariants.push({ color: colorName, hex, image: entry.existingUrl });
          allImageUrls.push(entry.existingUrl);
          continue;
        }

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

        colorVariants.push({ color: colorName, hex, image: urlData.publicUrl });
        allImageUrls.push(urlData.publicUrl);
      }
    }

    const gender = genderSelections.join(",") || null;

    let custom_design: ProductDesign | null = null;
    if (customDesignEnabled) {
      const buildSide = (s: SideState) => {
        const hasTexts = s.textItems.length > 0;
        const hasImg = s.imageData.length > 0;
        if (!hasTexts && !hasImg) return undefined;
        return {
          imageData: hasImg ? s.imageData : undefined,
          imagePos: hasImg ? s.imagePos : undefined,
          textItems: hasTexts ? s.textItems.map((t) => ({
            id: t.id,
            text: t.text,
            textColor: t.textColor,
            fontSize: t.fontSize,
            fontFamily: t.fontFamily,
            pos: t.pos,
          })) : undefined,
        };
      };

      custom_design = {
        front: buildSide(frontDesign),
        back: buildSide(backDesign),
      };
    }

    const productData = {
      name,
      description,
      price: parseFloat(price),
      images: allImageUrls,
      color_variants: colorVariants,
      category: category || null,
      garment_type: (category && category in GARMENT_CONFIGS) ? category : null,
      gender,
      sizes,
      custom_design,
    };

    if (isEditing) {
      if (!customDesignEnabled) {
        const oldUrls = editProduct!.images ?? [];
        const orphanedUrls = oldUrls.filter((url) => !allImageUrls.includes(url));
        if (orphanedUrls.length > 0) {
          const orphanedPaths = orphanedUrls.map((url) => {
            const parts = url.split("/product-images/");
            return parts[parts.length - 1];
          });
          await supabase.storage.from("product-images").remove(orphanedPaths);
        }
      }

      const { error } = await supabase
        .from("products")
        .update(productData)
        .eq("id", editProduct!.id);

      if (error) {
        setMessage({ type: "error", text: error.message });
        setLoading(false);
        return;
      }

      setMessage({ type: "success", text: "Product updated!" });
      setLoading(false);
      router.refresh();
      onSuccess?.();
    } else {
      const { error } = await supabase.from("products").insert(productData);

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
      Object.values(colorImages).forEach((e) => { if (e.preview) URL.revokeObjectURL(e.preview); });
      setSelectedColors([]);
      setColorImages({});
      setCustomDesignEnabled(false);
      setActiveSide("front");
      setSelectedTextId(null);
      setFrontDesign(defaultSideState());
      setBackDesign(defaultSideState());
      setLoading(false);
      router.refresh();
    }
  }

  const visibleTextItems = currentDesign.textItems.filter((t) => t.text.trim().length > 0);

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
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className={inputClass}
        >
          <option value="">None (Regular Product)</option>
          {GARMENT_TYPES.map((type) => (
            <option key={type} value={type}>
              {GARMENT_CONFIGS[type].label}
            </option>
          ))}
        </select>
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

      {/* Color Selection */}
      <div>
        <label className="block text-xs font-heading font-semibold uppercase tracking-widest text-primary mb-2">
          Colors *
        </label>
        <p className="text-xs text-muted mb-3">Select all colors this product comes in</p>
        <div className="flex flex-wrap gap-2">
          {SHIRT_COLORS.map((c) => {
            const isSelected = selectedColors.includes(c.value);
            return (
              <button
                key={c.value}
                type="button"
                onClick={() => {
                  toggleColor(c.value);
                  if (!selectedColors.includes(c.value)) {
                    handleShirtColorChange(c.value);
                  }
                }}
                title={c.name}
                className={`w-9 h-9 rounded-full border-2 transition-all duration-200 cursor-pointer relative ${
                  isSelected
                    ? "border-primary scale-110 ring-2 ring-primary/20"
                    : "border-border hover:border-muted"
                }`}
                style={{ backgroundColor: c.value }}
              >
                {isSelected && (
                  <svg
                    className="absolute inset-0 m-auto w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={LIGHT_SHIRT_VALUES.has(c.value) ? "#0a0a0a" : "#ffffff"}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
        {selectedColors.length > 0 && (
          <p className="text-xs text-muted mt-2">
            {selectedColors.length} color{selectedColors.length !== 1 ? "s" : ""} selected:{" "}
            {selectedColors
              .map((hex) => SHIRT_COLORS.find((sc) => sc.value === hex)?.name)
              .filter(Boolean)
              .join(", ")}
          </p>
        )}
      </div>

      {/* Custom Design Toggle */}
      <div className="border-t border-border pt-5">
        <label className="flex items-center gap-3 cursor-pointer select-none">
          <div
            className={`relative w-10 h-6 rounded-full transition-colors duration-200 ${
              customDesignEnabled ? "bg-dark" : "bg-border"
            }`}
            onClick={() => setCustomDesignEnabled((prev) => !prev)}
          >
            <div
              className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                customDesignEnabled ? "translate-x-5" : "translate-x-1"
              }`}
            />
          </div>
          <div>
            <span className="text-sm font-semibold text-primary">Custom Design</span>
            <p className="text-xs text-muted">Add text and graphics to the shirt</p>
          </div>
        </label>
      </div>

      {/* Custom Design Section */}
      {customDesignEnabled && selectedColors.length > 0 && (
        <div className="border border-border rounded-2xl p-5 space-y-5 bg-bg/50">
          {/* Front / Back toggle */}
          <div className="flex justify-center gap-1">
            {(selectedGarmentConfig?.sides ?? ["front", "back"]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => { setActiveSide(s); setSelectedTextId(null); if (designFileRef.current) designFileRef.current.value = ""; }}
                className={`px-5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer ${
                  activeSide === s
                    ? "bg-dark text-white"
                    : "bg-card text-muted hover:text-primary border border-border"
                }`}
              >
                {s === "front" ? "Front" : "Back"}
              </button>
            ))}
          </div>

          {/* Shirt Editor Preview */}
          <div className="flex justify-center bg-surface rounded-xl p-6">
            <ShirtEditor
              shirtColor={previewShirtColor}
              imageData={currentDesign.imageData || undefined}
              imagePos={currentDesign.imagePos}
              onImagePosChange={(pos) => setCurrentDesign((prev) => ({ ...prev, imagePos: pos }))}
              textItems={visibleTextItems}
              onTextItemPosChange={(id, pos) => updateTextItem(id, { pos })}
              selectedTextId={selectedTextId}
              onSelect={handleSelect}
              onDeselect={handleDeselect}
              side={activeSide}
              garmentType={(category && category in GARMENT_CONFIGS) ? category as GarmentType : "shirt"}
              className="w-full max-w-[240px]"
            />
          </div>

          {/* Preview color switcher */}
          {selectedColors.length > 1 && (
            <div>
              <label className="block text-xs font-heading font-semibold uppercase tracking-widest text-primary mb-2">
                Preview Color
              </label>
              <div className="flex flex-wrap gap-2">
                {selectedColors.map((hex) => {
                  const sc = SHIRT_COLORS.find((c) => c.value === hex);
                  return (
                    <button
                      key={hex}
                      type="button"
                      onClick={() => {
                        setSelectedColors((prev) => [hex, ...prev.filter((c) => c !== hex)]);
                        handleShirtColorChange(hex);
                      }}
                      title={sc?.name}
                      className={`w-7 h-7 rounded-full border-2 transition-all duration-200 cursor-pointer ${
                        hex === previewShirtColor
                          ? "border-primary scale-110 ring-2 ring-primary/20"
                          : "border-border hover:border-muted"
                      }`}
                      style={{ backgroundColor: hex }}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Design Image Upload */}
          <div>
            <label className="block text-xs font-heading font-semibold uppercase tracking-widest text-primary mb-2">
              Design Image ({activeSide})
            </label>
            {currentDesign.imageData ? (
              <div className="flex items-center gap-3 bg-card rounded-lg px-4 py-3 border border-border">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-muted shrink-0">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="M21 15l-5-5L5 21" />
                </svg>
                <span className="text-sm text-primary truncate flex-1">{currentDesign.imageName || "Uploaded image"}</span>
                <button
                  type="button"
                  onClick={clearDesignImage}
                  className="text-muted hover:text-primary transition-colors duration-200 cursor-pointer shrink-0"
                  aria-label="Remove image"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M6 6l12 12M6 18L18 6" />
                  </svg>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => designFileRef.current?.click()}
                className="w-full border border-dashed border-border rounded-lg px-4 py-5 text-center hover:border-muted transition-colors duration-200 cursor-pointer"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="mx-auto text-muted mb-1.5">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <p className="text-sm text-muted">Click to upload a design image</p>
                <p className="text-xs text-muted/60 mt-0.5">PNG, JPG, SVG</p>
              </button>
            )}
            <input
              ref={designFileRef}
              type="file"
              accept="image/*"
              onChange={handleDesignImageUpload}
              className="hidden"
            />
          </div>

          {/* ── Text Fields ── */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-heading font-semibold uppercase tracking-widest text-primary">
                Design Text ({activeSide})
              </label>
              <button
                type="button"
                onClick={addTextField}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-dark text-white hover:bg-dark/80 transition-colors duration-200 cursor-pointer"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Add Text
              </button>
            </div>

            {currentDesign.textItems.length === 0 ? (
              <p className="text-xs text-muted">No text added yet. Click &ldquo;Add Text&rdquo; to start.</p>
            ) : (
              <div className="space-y-2">
                {currentDesign.textItems.map((item, idx) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedTextId(item.id)}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 transition-all duration-200 cursor-pointer ${
                      selectedTextId === item.id
                        ? "border-primary bg-surface ring-1 ring-primary/20"
                        : "border-border hover:border-muted"
                    }`}
                  >
                    <span className="text-[10px] text-muted w-5 shrink-0">#{idx + 1}</span>
                    <textarea
                      value={item.text}
                      onChange={(e) => updateTextItem(item.id, { text: e.target.value })}
                      onClick={(e) => { e.stopPropagation(); setSelectedTextId(item.id); }}
                      onFocus={() => setSelectedTextId(item.id)}
                      placeholder="Enter text..."
                      rows={1}
                      onInput={(e) => { const t = e.target as HTMLTextAreaElement; t.style.height = "auto"; t.style.height = t.scrollHeight + "px"; }}
                      className="flex-1 bg-transparent text-sm text-primary placeholder:text-muted/50 focus:outline-none resize-none leading-snug"
                    />
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); removeTextField(item.id); }}
                      className="text-muted hover:text-red-500 transition-colors duration-200 cursor-pointer shrink-0"
                      aria-label="Remove text"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                        <path d="M6 6l12 12M6 18L18 6" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Selected Text Styling ── */}
          {selectedTextItem && (
            <>
              {/* Text Color */}
              <div>
                <label className="block text-xs font-heading font-semibold uppercase tracking-widest text-primary mb-2">
                  Text Color
                </label>
                <div className="flex flex-wrap gap-2">
                  {currentTextColors.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => updateTextItem(selectedTextItem.id, { textColor: c.value })}
                      title={c.name}
                      className={`w-8 h-8 rounded-full border-2 transition-all duration-200 cursor-pointer ${
                        selectedTextItem.textColor === c.value
                          ? "border-primary scale-110 ring-2 ring-primary/20"
                          : "border-border hover:border-muted"
                      }`}
                      style={{ backgroundColor: c.value }}
                    />
                  ))}
                </div>
                <p className="text-xs text-muted mt-2">
                  {currentTextColors.find((c) => c.value === selectedTextItem.textColor)?.name}
                </p>
              </div>

              {/* Font family */}
              <div>
                <label className="block text-xs font-heading font-semibold uppercase tracking-widest text-primary mb-2">
                  Font
                </label>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {FONT_GROUPS.map((g, i) => (
                    <button
                      key={g.label}
                      type="button"
                      onClick={() => setCurrentDesign((prev) => ({ ...prev, fontGroupIdx: i }))}
                      className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all duration-200 cursor-pointer ${
                        currentDesign.fontGroupIdx === i
                          ? "bg-dark text-white"
                          : "bg-card text-muted hover:text-primary border border-border"
                      }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {FONT_GROUPS[currentDesign.fontGroupIdx].fonts.map((f) => (
                    <button
                      key={f.value}
                      type="button"
                      onClick={() => updateTextItem(selectedTextItem.id, { fontFamily: f.value })}
                      className={`px-3 py-2 rounded-lg border text-sm truncate transition-all duration-200 cursor-pointer ${
                        selectedTextItem.fontFamily === f.value
                          ? "border-primary bg-dark text-white"
                          : "border-border bg-card text-primary hover:border-muted"
                      }`}
                      style={{ fontFamily: f.value }}
                    >
                      {f.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Size */}
              <div>
                <label className="block text-xs font-heading font-semibold uppercase tracking-widest text-primary mb-2">
                  Text Size <span className="text-muted font-normal">({selectedTextItem.fontSize}px)</span>
                </label>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted w-6 text-right">{FONT_SIZE_MIN}</span>
                  <input
                    type="range"
                    min={FONT_SIZE_MIN}
                    max={FONT_SIZE_MAX}
                    value={selectedTextItem.fontSize}
                    onChange={(e) => updateTextItem(selectedTextItem.id, { fontSize: Number(e.target.value) })}
                    className="flex-1 accent-dark cursor-pointer"
                  />
                  <span className="text-xs text-muted w-6">{FONT_SIZE_MAX}</span>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Per-color image uploads (only when custom design is OFF) */}
      {!customDesignEnabled && selectedColors.length > 0 && (
        <div>
          <label className="block text-xs font-heading font-semibold uppercase tracking-widest text-primary mb-2">
            Color Images *
          </label>
          <p className="text-xs text-muted mb-3">Upload a product image for each selected color</p>
          <div className="space-y-3">
            {selectedColors.map((hex) => {
              const shirtColor = SHIRT_COLORS.find((sc) => sc.value === hex);
              const entry = colorImages[hex];
              const imageUrl = entry?.preview || entry?.existingUrl;

              return (
                <div
                  key={hex}
                  className="bg-bg border border-border rounded-xl p-4 space-y-3"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="w-8 h-8 rounded-full border border-border shrink-0"
                      style={{ backgroundColor: hex }}
                    />
                    <span className="text-sm font-medium text-primary">
                      {shirtColor?.name ?? hex}
                    </span>
                  </div>

                  {imageUrl ? (
                    <div className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imageUrl}
                        alt={`${shirtColor?.name || "Color"} preview`}
                        className="w-20 h-20 object-cover rounded-lg border border-border"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (entry?.preview) URL.revokeObjectURL(entry.preview);
                          setColorImages((prev) => ({
                            ...prev,
                            [hex]: { file: null, preview: "", existingUrl: undefined },
                          }));
                        }}
                        className="text-xs text-muted hover:text-red-500 underline underline-offset-2 transition-colors duration-200 cursor-pointer"
                      >
                        Remove image
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileRefs.current[hex]?.click()}
                      className="w-full border border-dashed border-border rounded-lg py-4 text-center text-sm text-muted hover:border-muted transition-colors duration-200 cursor-pointer"
                    >
                      <svg className="w-5 h-5 mx-auto mb-1 text-muted/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                      </svg>
                      Upload image for {shirtColor?.name ?? "this color"}
                    </button>
                  )}
                  <input
                    ref={(el) => { fileRefs.current[hex] = el; }}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleColorImage(hex, file);
                      e.target.value = "";
                    }}
                    className="hidden"
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

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

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={loading}
          className="bg-dark text-white font-heading font-semibold text-sm px-8 py-3.5 rounded-lg hover:bg-dark/80 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {loading
            ? isEditing ? "Saving..." : "Adding..."
            : isEditing ? "Save Changes" : "Add Product"}
        </button>
        {isEditing && onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="font-heading font-semibold text-sm px-8 py-3.5 rounded-lg border border-border text-muted hover:text-primary hover:border-primary transition-colors duration-200 cursor-pointer"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
