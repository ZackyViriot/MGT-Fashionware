"use client";

import { useState, useRef } from "react";
import ShirtEditor from "@/components/ShirtEditor";
import { useCart } from "@/utils/cart-context";
import type { ElementPosition, TextItem } from "@/utils/cart-context";
import { SHIRT_COLORS } from "@/constants/shirt-colors";
import {
  FONT_GROUPS,
  FONT_SIZE_MIN,
  FONT_SIZE_MAX,
  FONT_SIZE_DEFAULT,
  getTextColors,
} from "@/constants/design-config";
import {
  GARMENT_CONFIGS,
  type GarmentType,
  type GarmentSide,
} from "@/constants/garment-types";

interface Props {
  garmentType: GarmentType;
}

const DEFAULT_IMAGE_POS: ElementPosition = { x: 100, y: 110, scale: 1 };
const DEFAULT_TEXT_POS: ElementPosition = { x: 100, y: 130, scale: 1 };

let nextTextId = 1;
function makeTextId() {
  return `t-${nextTextId++}-${Date.now()}`;
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

export default function GarmentDesigner({ garmentType }: Props) {
  const config = GARMENT_CONFIGS[garmentType];
  const { addItem } = useCart();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [shirtColor, setShirtColor] = useState(SHIRT_COLORS[0].value);
  const [activeSide, setActiveSide] = useState<GarmentSide>(config.sides[0]);
  const [frontDesign, setFrontDesign] = useState<SideState>(defaultSideState);
  const [backDesign, setBackDesign] = useState<SideState>(defaultSideState);
  const [sizeCategory, setSizeCategory] = useState(0);
  const [size, setSize] = useState(config.sizeCategories[0].sizes[1] ?? config.sizeCategories[0].sizes[0]);
  const [added, setAdded] = useState(false);
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);

  const current = activeSide === "front" ? frontDesign : backDesign;
  const setCurrent = activeSide === "front" ? setFrontDesign : setBackDesign;

  const currentTextColors = getTextColors(shirtColor);
  const hasImage = current.imageData.length > 0;
  const selectedTextItem =
    current.textItems.find((t) => t.id === selectedTextId) ?? null;

  const frontHasContent =
    frontDesign.textItems.length > 0 || frontDesign.imageData.length > 0;
  const backHasContent =
    backDesign.textItems.length > 0 || backDesign.imageData.length > 0;
  const canAdd = frontHasContent || backHasContent;

  // Dynamic pricing: base price includes 1 element, +$2.50 per additional
  const EXTRA_ELEMENT_PRICE = 2.5;
  const totalElements =
    (frontDesign.imageData ? 1 : 0) +
    frontDesign.textItems.length +
    (backDesign.imageData ? 1 : 0) +
    backDesign.textItems.length;
  const extraElements = Math.max(0, totalElements - 1);
  const dynamicPrice = config.basePrice + extraElements * EXTRA_ELEMENT_PRICE;

  function handleShirtColorChange(color: string) {
    setShirtColor(color);
    const newOptions = getTextColors(color);
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
      setCurrent((prev) => ({
        ...prev,
        imageData: compressed,
        imageName: file.name,
        imagePos: DEFAULT_IMAGE_POS,
      }));
      URL.revokeObjectURL(img.src);
    };
    img.src = URL.createObjectURL(file);
  }

  function clearImage() {
    setCurrent((prev) => ({
      ...prev,
      imageData: "",
      imageName: "",
      imagePos: DEFAULT_IMAGE_POS,
    }));
    if (fileInputRef.current) fileInputRef.current.value = "";
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
    setCurrent((prev) => ({
      ...prev,
      textItems: [...prev.textItems, newItem],
    }));
    setSelectedTextId(id);
  }

  function removeTextField(id: string) {
    setCurrent((prev) => ({
      ...prev,
      textItems: prev.textItems.filter((t) => t.id !== id),
    }));
    if (selectedTextId === id) setSelectedTextId(null);
  }

  function updateTextItem(id: string, updates: Partial<TextItem>) {
    setCurrent((prev) => ({
      ...prev,
      textItems: prev.textItems.map((t) =>
        t.id === id ? { ...t, ...updates } : t
      ),
    }));
  }

  function handleSelect(type: "image" | "text", id?: string) {
    setSelectedTextId(type === "text" && id ? id : null);
  }

  function handleDeselect() {
    setSelectedTextId(null);
  }

  async function handleAddToCart() {
    const cat = config.sizeCategories[sizeCategory];
    const sizeLabel = cat.label === "Women" ? `W-${size}` : size;

    const buildSide = (s: SideState) => {
      const hasTexts = s.textItems.length > 0;
      const hasImg = s.imageData.length > 0;
      if (!hasTexts && !hasImg) return undefined;
      return {
        imageData: hasImg ? s.imageData : undefined,
        imagePos: hasImg ? s.imagePos : undefined,
        textItems: hasTexts ? s.textItems : undefined,
      };
    };

    const frontData = buildSide(frontDesign);
    const backData = buildSide(backDesign);

    addItem({
      productId: `custom-${garmentType}-${Date.now()}`,
      name: `Custom ${config.label}`,
      price: dynamicPrice,
      image: "",
      color:
        SHIRT_COLORS.find((c) => c.value === shirtColor)?.name || shirtColor,
      size: sizeLabel,
      isCustom: true,
      customDesign: {
        shirtColor,
        garmentType,
        front: frontData,
        back: backData,
      },
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  // Filter out empty text items for the canvas (don't render blank nodes)
  const visibleTextItems = current.textItems.filter(
    (t) => t.text.trim().length > 0
  );

  return (
    <section className="px-6 py-10">
      <div className="max-w-6xl mx-auto">
        <h1 className="font-heading font-bold text-2xl md:text-3xl mb-1">
          Design Your {config.label}
        </h1>
        <p className="text-muted text-sm mb-8">
          Add text, an image, or both — drag and resize to position your design.
        </p>

        <div className="grid lg:grid-cols-2 gap-10">
          {/* Left — Interactive Editor */}
          <div className="bg-surface rounded-2xl p-8 lg:sticky lg:top-20 lg:self-start">
            {config.sides.length > 1 && (
              <div className="flex justify-center gap-1 mb-6">
                {config.sides.map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      setActiveSide(s);
                      setSelectedTextId(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className={`px-5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer ${
                      activeSide === s
                        ? "bg-dark text-white"
                        : "bg-bg text-muted hover:text-primary border border-border"
                    }`}
                  >
                    {s === "front" ? "Front" : "Back"}
                  </button>
                ))}
              </div>
            )}
            <div className="flex items-center justify-center">
              <ShirtEditor
                shirtColor={shirtColor}
                imageData={current.imageData || undefined}
                imagePos={current.imagePos}
                onImagePosChange={(pos) =>
                  setCurrent((prev) => ({ ...prev, imagePos: pos }))
                }
                textItems={visibleTextItems}
                onTextItemPosChange={(id, pos) =>
                  updateTextItem(id, { pos })
                }
                selectedTextId={selectedTextId}
                onSelect={handleSelect}
                onDeselect={handleDeselect}
                side={activeSide}
                garmentType={garmentType}
                className="w-full max-w-sm"
              />
            </div>
          </div>

          {/* Right — Controls */}
          <div className="space-y-8">
            {/* -- Color -- */}
            <div>
              <label className="block text-sm font-semibold mb-3">Color</label>
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

            {/* -- Image Upload -- */}
            <div>
              <label className="block text-sm font-semibold mb-3">
                Image ({activeSide})
              </label>
              {current.imageData ? (
                <div className="flex items-center gap-3 bg-surface rounded-lg px-4 py-3 border border-border">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    className="text-muted shrink-0"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <path d="M21 15l-5-5L5 21" />
                  </svg>
                  <span className="text-sm text-primary truncate flex-1">
                    {current.imageName}
                  </span>
                  <button
                    onClick={clearImage}
                    className="text-muted hover:text-primary transition-colors duration-200 cursor-pointer shrink-0"
                    aria-label="Remove image"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    >
                      <path d="M6 6l12 12M6 18L18 6" />
                    </svg>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-border rounded-lg px-4 py-6 text-center hover:border-muted transition-colors duration-200 cursor-pointer"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    className="mx-auto text-muted mb-1.5"
                  >
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  <p className="text-sm text-muted">Click to upload</p>
                  <p className="text-xs text-muted/60 mt-0.5">
                    PNG, JPG, SVG — any size
                  </p>
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

            {/* -- Text Fields -- */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-semibold">
                  Text ({activeSide})
                </label>
                <button
                  onClick={addTextField}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-dark text-white hover:bg-dark/80 transition-colors duration-200 cursor-pointer"
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  >
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  Add Text
                </button>
              </div>

              {current.textItems.length === 0 ? (
                <p className="text-xs text-muted">
                  No text added yet. Click &ldquo;Add Text&rdquo; to start.
                </p>
              ) : (
                <div className="space-y-2">
                  {current.textItems.map((item, idx) => (
                    <div
                      key={item.id}
                      onClick={() => setSelectedTextId(item.id)}
                      className={`flex items-center gap-2 rounded-lg border px-3 py-2 transition-all duration-200 cursor-pointer ${
                        selectedTextId === item.id
                          ? "border-primary bg-surface ring-1 ring-primary/20"
                          : "border-border hover:border-muted"
                      }`}
                    >
                      <span className="text-[10px] text-muted w-5 shrink-0">
                        #{idx + 1}
                      </span>
                      <input
                        type="text"
                        value={item.text}
                        onChange={(e) =>
                          updateTextItem(item.id, { text: e.target.value })
                        }
                        onClick={(e) => { e.stopPropagation(); setSelectedTextId(item.id); }}
                        onFocus={() => setSelectedTextId(item.id)}
                        placeholder="Enter text..."
                        maxLength={14}
                        className="flex-1 bg-transparent text-sm text-primary placeholder:text-muted/50 focus:outline-none"
                      />
                      <span className="text-[10px] text-muted shrink-0">
                        {item.text.length}/14
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeTextField(item.id);
                        }}
                        className="text-muted hover:text-red-500 transition-colors duration-200 cursor-pointer shrink-0"
                        aria-label="Remove text"
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        >
                          <path d="M6 6l12 12M6 18L18 6" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* -- Selected Text Styling -- */}
            {selectedTextItem && (
              <>
                {/* Text Color */}
                <div>
                  <label className="block text-sm font-semibold mb-3">
                    Text Color
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {currentTextColors.map((c) => (
                      <button
                        key={c.value}
                        onClick={() =>
                          updateTextItem(selectedTextItem.id, {
                            textColor: c.value,
                          })
                        }
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
                    {
                      currentTextColors.find(
                        (c) => c.value === selectedTextItem.textColor
                      )?.name
                    }
                  </p>
                </div>

                {/* Font family */}
                <div>
                  <label className="block text-sm font-semibold mb-3">
                    Font
                  </label>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {FONT_GROUPS.map((g, i) => (
                      <button
                        key={g.label}
                        onClick={() =>
                          setCurrent((prev) => ({ ...prev, fontGroupIdx: i }))
                        }
                        className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all duration-200 cursor-pointer ${
                          current.fontGroupIdx === i
                            ? "bg-dark text-white"
                            : "bg-surface text-muted hover:text-primary border border-border"
                        }`}
                      >
                        {g.label}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {FONT_GROUPS[current.fontGroupIdx].fonts.map((f) => (
                      <button
                        key={f.value}
                        onClick={() =>
                          updateTextItem(selectedTextItem.id, {
                            fontFamily: f.value,
                          })
                        }
                        className={`px-3 py-2 rounded-lg border text-sm truncate transition-all duration-200 cursor-pointer ${
                          selectedTextItem.fontFamily === f.value
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

                {/* Font Size */}
                <div>
                  <label className="block text-sm font-semibold mb-3">
                    Text Size{" "}
                    <span className="text-muted font-normal">
                      ({selectedTextItem.fontSize}px)
                    </span>
                  </label>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted w-6 text-right">
                      {FONT_SIZE_MIN}
                    </span>
                    <input
                      type="range"
                      min={FONT_SIZE_MIN}
                      max={FONT_SIZE_MAX}
                      value={selectedTextItem.fontSize}
                      onChange={(e) =>
                        updateTextItem(selectedTextItem.id, {
                          fontSize: Number(e.target.value),
                        })
                      }
                      className="flex-1 accent-dark cursor-pointer"
                    />
                    <span className="text-xs text-muted w-6">
                      {FONT_SIZE_MAX}
                    </span>
                  </div>
                </div>
              </>
            )}

            {/* -- Size -- */}
            <div>
              <label className="block text-sm font-semibold mb-3">Size</label>
              {config.sizeCategories.length > 1 && (
                <div className="flex gap-2 mb-3">
                  {config.sizeCategories.map((cat, i) => (
                    <button
                      key={cat.label}
                      onClick={() => {
                        setSizeCategory(i);
                        setSize(cat.sizes.includes(size) ? size : cat.sizes[1] ?? cat.sizes[0]);
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
              )}
              <div className="flex flex-wrap gap-2">
                {config.sizeCategories[sizeCategory].sizes.map((s) => (
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

            {/* -- Price + Add to Cart -- */}
            <div className="border-t border-border pt-6 space-y-4">
              <div>
                <span className="font-heading font-bold text-2xl">
                  ${dynamicPrice.toFixed(2)}
                </span>
                {extraElements > 0 && (
                  <p className="text-xs text-muted mt-1">
                    ${config.basePrice}.00 base + {extraElements} extra {extraElements === 1 ? "element" : "elements"} &times; ${EXTRA_ELEMENT_PRICE.toFixed(2)}
                  </p>
                )}
              </div>
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
