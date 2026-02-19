"use client";

import { useState, useRef } from "react";
import ShirtEditor from "@/components/ShirtEditor";
import { useCart } from "@/utils/cart-context";
import type { ElementPosition } from "@/utils/cart-context";
import { SHIRT_COLORS } from "@/constants/shirt-colors";
import { FONT_GROUPS, FONT_SIZE_MIN, FONT_SIZE_MAX, FONT_SIZE_DEFAULT, getTextColors } from "@/constants/design-config";

const SIZE_CATEGORIES = [
  { label: "Unisex", sizes: ["XS", "S", "M", "L", "XL", "XXL", "3XL"] },
  { label: "Women", sizes: ["XS", "S", "M", "L", "XL", "XXL"] },
];

const DEFAULT_IMAGE_POS: ElementPosition = { x: 100, y: 110, scale: 1 };
const DEFAULT_TEXT_POS: ElementPosition = { x: 100, y: 185, scale: 1 };
const DEFAULT_TEXT_ONLY_POS: ElementPosition = { x: 100, y: 130, scale: 1 };

export default function CustomDesignerPage() {
  const { addItem } = useCart();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [shirtColor, setShirtColor] = useState(SHIRT_COLORS[0].value);
  const [customText, setCustomText] = useState("");
  const [textColor, setTextColor] = useState(getTextColors(SHIRT_COLORS[0].value)[0].value);
  const [fontFamily, setFontFamily] = useState(FONT_GROUPS[0].fonts[0].value);
  const [textSizeNum, setTextSizeNum] = useState(FONT_SIZE_DEFAULT);
  const [imageData, setImageData] = useState("");
  const [imageName, setImageName] = useState("");
  const [imagePos, setImagePos] = useState<ElementPosition>(DEFAULT_IMAGE_POS);
  const [textPos, setTextPos] = useState<ElementPosition>(DEFAULT_TEXT_POS);
  const [sizeCategory, setSizeCategory] = useState(0);
  const [size, setSize] = useState("M");
  const [added, setAdded] = useState(false);
  const [fontGroupIdx, setFontGroupIdx] = useState(0);

  const currentTextColors = getTextColors(shirtColor);
  const hasText = customText.trim().length > 0;
  const hasImage = imageData.length > 0;
  const canAdd = hasText || hasImage;

  function handleShirtColorChange(color: string) {
    setShirtColor(color);
    const newOptions = getTextColors(color);
    if (!newOptions.find((c) => c.value === textColor)) {
      setTextColor(newOptions[0].value);
    }
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    const img = new Image();
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
      setImageData(compressed);
      setImageName(file.name);
      setImagePos(DEFAULT_IMAGE_POS);
      if (!hasText) setTextPos(DEFAULT_TEXT_POS);
      URL.revokeObjectURL(img.src);
    };
    img.src = URL.createObjectURL(file);
  }

  function clearImage() {
    setImageData("");
    setImageName("");
    setImagePos(DEFAULT_IMAGE_POS);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (!hasImage) setTextPos(DEFAULT_TEXT_ONLY_POS);
  }

  function handleAddToCart() {
    const sizeLabel = sizeCategory === 1 ? `W-${size}` : size;
    addItem({
      productId: `custom-${Date.now()}`,
      name: "Custom Shirt",
      price: 30,
      image: "",
      color: SHIRT_COLORS.find((c) => c.value === shirtColor)?.name || shirtColor,
      size: sizeLabel,
      isCustom: true,
      customDesign: {
        shirtColor,
        text: hasText ? customText : undefined,
        textColor: hasText ? textColor : undefined,
        fontSize: hasText ? textSizeNum : undefined,
        fontFamily: hasText ? fontFamily : undefined,
        imageData: hasImage ? imageData : undefined,
        imagePos: hasImage ? imagePos : undefined,
        textPos: hasText ? textPos : undefined,
      },
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  const effectiveTextPos = hasText
    ? textPos
    : hasImage
      ? DEFAULT_TEXT_POS
      : DEFAULT_TEXT_ONLY_POS;

  return (
    <section className="px-6 py-10">
      <div className="max-w-6xl mx-auto">
        <h1 className="font-heading font-bold text-2xl md:text-3xl mb-1">
          Design Your Shirt
        </h1>
        <p className="text-muted text-sm mb-8">
          Add text, an image, or both — drag and resize to position your design.
        </p>

        <div className="grid lg:grid-cols-2 gap-10">
          {/* Left — Interactive Editor */}
          <div className="flex items-center justify-center bg-surface rounded-2xl p-8 lg:sticky lg:top-20 lg:self-start">
            <ShirtEditor
              shirtColor={shirtColor}
              text={customText || undefined}
              textColor={textColor}
              fontFamily={fontFamily}
              fontSize={textSizeNum}
              imageData={imageData || undefined}
              imagePos={imagePos}
              textPos={effectiveTextPos}
              onImagePosChange={setImagePos}
              onTextPosChange={setTextPos}
              className="w-full max-w-sm"
            />
          </div>

          {/* Right — Controls */}
          <div className="space-y-8">
            {/* ── Shirt Color ── */}
            <div>
              <label className="block text-sm font-semibold mb-3">Shirt Color</label>
              <div className="flex flex-wrap gap-2">
                {SHIRT_COLORS.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => handleShirtColorChange(c.value)}
                    title={c.name}
                    className={`w-8 h-8 rounded-full border-2 transition-all duration-200 cursor-pointer ${
                      shirtColor === c.value
                        ? "border-primary scale-110 ring-2 ring-primary/20"
                        : "border-border hover:border-muted"
                    }`}
                    style={{ backgroundColor: c.value }}
                  />
                ))}
              </div>
              <p className="text-xs text-muted mt-2">
                {SHIRT_COLORS.find((c) => c.value === shirtColor)?.name}
              </p>
            </div>

            {/* ── Image Upload ── */}
            <div>
              <label className="block text-sm font-semibold mb-3">Image</label>
              {imageData ? (
                <div className="flex items-center gap-3 bg-surface rounded-lg px-4 py-3 border border-border">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-muted shrink-0">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <path d="M21 15l-5-5L5 21" />
                  </svg>
                  <span className="text-sm text-primary truncate flex-1">{imageName}</span>
                  <button
                    onClick={clearImage}
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
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-border rounded-lg px-4 py-6 text-center hover:border-muted transition-colors duration-200 cursor-pointer"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="mx-auto text-muted mb-1.5">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  <p className="text-sm text-muted">Click to upload</p>
                  <p className="text-xs text-muted/60 mt-0.5">PNG, JPG, SVG — any size</p>
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>

            {/* ── Custom Text ── */}
            <div>
              <label className="block text-sm font-semibold mb-3">Text</label>
              <input
                type="text"
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder="Enter your text..."
                maxLength={14}
                className="w-full bg-surface rounded-lg px-4 py-3 text-sm text-primary placeholder:text-muted/50 border border-border focus:border-primary focus:outline-none transition-colors duration-200"
              />
              <p className="text-xs text-muted mt-1">{customText.length}/14 characters</p>
            </div>

            {/* ── Text styling (visible when text entered) ── */}
            {hasText && (
              <>
                {/* Text Color */}
                <div>
                  <label className="block text-sm font-semibold mb-3">Text Color</label>
                  <div className="flex flex-wrap gap-2">
                    {currentTextColors.map((c) => (
                      <button
                        key={c.value}
                        onClick={() => setTextColor(c.value)}
                        title={c.name}
                        className={`w-8 h-8 rounded-full border-2 transition-all duration-200 cursor-pointer ${
                          textColor === c.value
                            ? "border-primary scale-110 ring-2 ring-primary/20"
                            : "border-border hover:border-muted"
                        }`}
                        style={{ backgroundColor: c.value }}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-muted mt-2">
                    {currentTextColors.find((c) => c.value === textColor)?.name}
                  </p>
                </div>

                {/* Font family — grouped tabs */}
                <div>
                  <label className="block text-sm font-semibold mb-3">Font</label>
                  {/* Group tabs */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {FONT_GROUPS.map((g, i) => (
                      <button
                        key={g.label}
                        onClick={() => setFontGroupIdx(i)}
                        className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all duration-200 cursor-pointer ${
                          fontGroupIdx === i
                            ? "bg-dark text-white"
                            : "bg-surface text-muted hover:text-primary border border-border"
                        }`}
                      >
                        {g.label}
                      </button>
                    ))}
                  </div>
                  {/* Font buttons */}
                  <div className="grid grid-cols-2 gap-1.5">
                    {FONT_GROUPS[fontGroupIdx].fonts.map((f) => (
                      <button
                        key={f.value}
                        onClick={() => setFontFamily(f.value)}
                        className={`px-3 py-2 rounded-lg border text-sm truncate transition-all duration-200 cursor-pointer ${
                          fontFamily === f.value
                            ? "border-primary bg-dark text-white"
                            : "border-border bg-surface text-primary hover:border-muted"
                        }`}
                        style={{ fontFamily: f.value }}
                      >
                        {f.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Font Size — slider */}
                <div>
                  <label className="block text-sm font-semibold mb-3">
                    Text Size <span className="text-muted font-normal">({textSizeNum}px)</span>
                  </label>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted w-6 text-right">{FONT_SIZE_MIN}</span>
                    <input
                      type="range"
                      min={FONT_SIZE_MIN}
                      max={FONT_SIZE_MAX}
                      value={textSizeNum}
                      onChange={(e) => setTextSizeNum(Number(e.target.value))}
                      className="flex-1 accent-dark cursor-pointer"
                    />
                    <span className="text-xs text-muted w-6">{FONT_SIZE_MAX}</span>
                  </div>
                </div>
              </>
            )}

            {/* ── Size ── */}
            <div>
              <label className="block text-sm font-semibold mb-3">Size</label>
              <div className="flex gap-2 mb-3">
                {SIZE_CATEGORIES.map((cat, i) => (
                  <button
                    key={cat.label}
                    onClick={() => {
                      setSizeCategory(i);
                      setSize(cat.sizes.includes(size) ? size : "M");
                    }}
                    className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer ${
                      sizeCategory === i
                        ? "bg-dark text-white"
                        : "bg-surface text-muted hover:text-primary border border-border"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {SIZE_CATEGORIES[sizeCategory].sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    className={`px-5 py-2.5 rounded-lg border text-sm font-medium transition-all duration-200 cursor-pointer ${
                      size === s
                        ? "border-primary bg-dark text-white"
                        : "border-border bg-surface text-primary hover:border-muted"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Price + Add to Cart ── */}
            <div className="border-t border-border pt-6 space-y-4">
              <span className="font-heading font-bold text-2xl">$30.00</span>
              <button
                onClick={handleAddToCart}
                disabled={!canAdd}
                className={`w-full font-heading font-semibold text-sm py-4 rounded-full transition-all duration-200 cursor-pointer ${
                  !canAdd
                    ? "bg-muted/20 text-muted cursor-not-allowed"
                    : added
                      ? "bg-emerald-600 text-white"
                      : "bg-dark text-white hover:bg-dark/80"
                }`}
              >
                {added ? "Added to Cart!" : "Add to Cart"}
              </button>
              {!canAdd && (
                <p className="text-xs text-muted text-center">
                  Add text or an image to continue
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
