"use client";

import { useState, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import type { Product, ProductDesign, ModelImageSet } from "@/types/product";
import type { ElementPosition, TextItem } from "@/utils/cart-context";
import { SHIRT_COLORS } from "@/constants/shirt-colors";
import { LIGHT_SHIRT_VALUES } from "@/constants/shirt-colors";
import { FONT_GROUPS, FONT_SIZE_MIN, FONT_SIZE_MAX, FONT_SIZE_DEFAULT, getTextColors } from "@/constants/design-config";
import { normalizeDesign, sideHasContent } from "@/utils/design-helpers";
import { GARMENT_CONFIGS, GARMENT_TYPES, type GarmentType, type GarmentSide } from "@/constants/garment-types";
import ShirtEditor from "@/components/ShirtEditor";
import type { ShirtPreviewCanvasHandle } from "@/components/ShirtPreviewCanvas";

const ShirtPreviewCanvas = dynamic(() => import("@/components/ShirtPreviewCanvas"), {
  ssr: false,
});

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

// ── Multi-photo state types ──
interface ModelPhotoEntry {
  url: string;
  side: "front" | "back";
  variationIndex: number;
}

type GeneratedModelImagesState = Record<string, ModelPhotoEntry[]>; // keyed by hex

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

  // ── Multi-photo generation state ──
  const [generatedModelImages, setGeneratedModelImages] = useState<GeneratedModelImagesState>(() => {
    if (!editProduct?.color_variants) return {};
    const state: GeneratedModelImagesState = {};
    for (const v of editProduct.color_variants) {
      const match = SHIRT_COLORS.find((sc) => sc.name === v.color);
      const hex = match?.value ?? v.hex;
      const entries: ModelPhotoEntry[] = [];
      if (v.modelImages) {
        v.modelImages.front.forEach((url, i) => entries.push({ url, side: "front", variationIndex: i }));
        v.modelImages.back.forEach((url, i) => entries.push({ url, side: "back", variationIndex: i }));
      } else if (v.image && editProduct.custom_design) {
        entries.push({ url: v.image, side: "front", variationIndex: 0 });
      }
      if (entries.length > 0) state[hex] = entries;
    }
    return state;
  });
  const [generatingKeys, setGeneratingKeys] = useState<Set<string>>(new Set());

  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const designFileRef = useRef<HTMLInputElement>(null);
  const snapshotFrontRef = useRef<ShirtPreviewCanvasHandle>(null);
  const snapshotBackRef = useRef<ShirtPreviewCanvasHandle>(null);
  const router = useRouter();
  const supabase = createClient();

  const selectedGarmentConfig = (category && category in GARMENT_CONFIGS)
    ? GARMENT_CONFIGS[category as GarmentType]
    : null;

  const garmentSides = selectedGarmentConfig?.sides ?? ["front", "back"];
  const availableSizes = getSizesForGenders(genderSelections);
  const previewShirtColor = selectedColors[0] ?? "#0a0a0a";
  const currentTextColors = getTextColors(previewShirtColor);
  const hasDesignImage = currentDesign.imageData.length > 0;
  const selectedTextItem = currentDesign.textItems.find((t) => t.id === selectedTextId) ?? null;

  const fHasContent = frontDesign.textItems.length > 0 || frontDesign.imageData.length > 0;
  const bHasContent = backDesign.textItems.length > 0 || backDesign.imageData.length > 0;
  const hasFrontSide = fHasContent && garmentSides.includes("front");
  const hasBackSide = bHasContent && garmentSides.includes("back");

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

  // ── Multi-photo generation ──
  // Strategy: OpenAI generates a model in a BLANK shirt → we composite the
  // exact design on top using displacement mapping + multiply blend mode.
  // This preserves the design pixel-perfectly while making it look naturally
  // printed on the fabric (wrinkles, shadows, lighting all come through).

  // Overlay zones: where the design gets placed on the 1024×1024 AI photo.
  const OVERLAY_ZONES: Record<string, Record<string, { x: number; y: number; w: number; h: number }>> = {
    shirt:      { front: { x: 300, y: 230, w: 420, h: 500 }, back: { x: 300, y: 210, w: 420, h: 500 } },
    hoodie:     { front: { x: 290, y: 260, w: 440, h: 490 }, back: { x: 290, y: 240, w: 440, h: 510 } },
    longsleeve: { front: { x: 300, y: 230, w: 420, h: 510 }, back: { x: 300, y: 210, w: 420, h: 510 } },
    hat:        { front: { x: 340, y: 120, w: 340, h: 250 }, back: { x: 340, y: 120, w: 340, h: 250 } },
    pants:      { front: { x: 320, y: 200, w: 380, h: 600 }, back: { x: 320, y: 200, w: 380, h: 600 } },
  };

  function loadImg(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  /**
   * Extract a grayscale displacement map from the shirt area of a blank photo.
   * Light areas = fabric peaks, dark areas = fabric valleys.
   * Used to warp design pixels so they follow fabric wrinkles.
   */
  function extractDisplacementMap(
    ctx: CanvasRenderingContext2D,
    zone: { x: number; y: number; w: number; h: number },
  ): { dispMap: Float32Array; shadeMap: Float32Array } {
    const imageData = ctx.getImageData(zone.x, zone.y, zone.w, zone.h);
    const data = imageData.data;
    const pixelCount = zone.w * zone.h;
    const dispMap = new Float32Array(pixelCount);
    const shadeMap = new Float32Array(pixelCount);

    // Pass 1: find luminance range
    let minLum = 255, maxLum = 0;
    for (let i = 0; i < data.length; i += 4) {
      const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      if (lum < minLum) minLum = lum;
      if (lum > maxLum) maxLum = lum;
    }
    const range = maxLum - minLum || 1;

    // Pass 2: normalize to 0–1
    for (let p = 0; p < pixelCount; p++) {
      const i = p * 4;
      const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      const normalized = (lum - minLum) / range;
      dispMap[p] = normalized;
      shadeMap[p] = normalized;
    }

    return { dispMap, shadeMap };
  }

  /**
   * Apply displacement mapping to the design, then composite it onto the blank
   * photo using the "multiply" blend mode for realistic fabric interaction.
   *
   * Displacement: warps design pixels to follow fabric wrinkles.
   * Multiply blend: design picks up shadows/highlights from the fabric.
   */
  async function compositeWithDisplacement(
    blankPhotoUrl: string,
    designDataUrl: string,
    side: "front" | "back",
  ): Promise<string | null> {
    try {
      const [photo, design] = await Promise.all([loadImg(blankPhotoUrl), loadImg(designDataUrl)]);

      const W = photo.naturalWidth;   // 1024
      const H = photo.naturalHeight;  // 1024

      // Main canvas with the blank photo
      const canvas = document.createElement("canvas");
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(photo, 0, 0);

      // Get the overlay zone for this garment/side
      const garment = (category && category in GARMENT_CONFIGS) ? category : "shirt";
      const zones = OVERLAY_ZONES[garment] ?? OVERLAY_ZONES.shirt;
      const zone = zones[side] ?? zones.front;

      // Calculate design dimensions within zone (maintain aspect ratio)
      const designAspect = design.naturalWidth / design.naturalHeight;
      const zoneAspect = zone.w / zone.h;
      let drawW: number, drawH: number;
      if (designAspect > zoneAspect) {
        drawW = zone.w;
        drawH = zone.w / designAspect;
      } else {
        drawH = zone.h;
        drawW = zone.h * designAspect;
      }
      const drawX = zone.x + (zone.w - drawW) / 2;
      const drawY = zone.y + (zone.h - drawH) / 2;

      // ── Step 1: Extract displacement map from the blank photo's shirt area ──
      const { dispMap, shadeMap } = extractDisplacementMap(ctx, {
        x: Math.round(drawX),
        y: Math.round(drawY),
        w: Math.round(drawW),
        h: Math.round(drawH),
      });

      // ── Step 2: Draw design to a temp canvas at the exact overlay size ──
      const designCanvas = document.createElement("canvas");
      const dW = Math.round(drawW);
      const dH = Math.round(drawH);
      designCanvas.width = dW;
      designCanvas.height = dH;
      const dCtx = designCanvas.getContext("2d")!;
      dCtx.drawImage(design, 0, 0, dW, dH);
      const designData = dCtx.getImageData(0, 0, dW, dH);

      // ── Step 3: Apply displacement — warp design pixels following fabric ──
      const DISP_STRENGTH = 3; // subtle fabric feel without distorting design
      const SHADE_STRENGTH = 0.15; // minimal shading to preserve design colors
      const outputData = dCtx.createImageData(dW, dH);

      for (let y = 0; y < dH; y++) {
        for (let x = 0; x < dW; x++) {
          const i = y * dW + x;
          const idx = i * 4;

          // Skip transparent pixels
          if (designData.data[idx + 3] < 5) {
            outputData.data[idx + 3] = 0;
            continue;
          }

          // Calculate displaced source coordinates
          const disp = dispMap[i] ?? 0.5;
          const offsetX = (disp - 0.5) * DISP_STRENGTH;
          const offsetY = (disp - 0.5) * DISP_STRENGTH;

          let srcX = Math.max(0, Math.min(dW - 1, x + offsetX));
          let srcY = Math.max(0, Math.min(dH - 1, y + offsetY));

          // Bilinear interpolation for smooth warping
          const x0 = Math.floor(srcX);
          const x1 = Math.min(x0 + 1, dW - 1);
          const y0 = Math.floor(srcY);
          const y1 = Math.min(y0 + 1, dH - 1);
          const xf = srcX - x0;
          const yf = srcY - y0;

          const i00 = (y0 * dW + x0) * 4;
          const i10 = (y0 * dW + x1) * 4;
          const i01 = (y1 * dW + x0) * 4;
          const i11 = (y1 * dW + x1) * 4;

          // Apply fabric shading — darken design in valleys, keep bright on peaks
          const shade = 1 - (1 - (shadeMap[i] ?? 1)) * SHADE_STRENGTH;

          for (let c = 0; c < 3; c++) {
            const v = (1 - xf) * (1 - yf) * designData.data[i00 + c]
                    + xf * (1 - yf) * designData.data[i10 + c]
                    + (1 - xf) * yf * designData.data[i01 + c]
                    + xf * yf * designData.data[i11 + c];
            outputData.data[idx + c] = Math.min(255, Math.max(0, Math.round(v * shade)));
          }

          // Alpha: interpolate and keep
          outputData.data[idx + 3] = Math.round(
            (1 - xf) * (1 - yf) * designData.data[i00 + 3]
            + xf * (1 - yf) * designData.data[i10 + 3]
            + (1 - xf) * yf * designData.data[i01 + 3]
            + xf * yf * designData.data[i11 + 3]
          );
        }
      }

      dCtx.putImageData(outputData, 0, 0);

      // ── Step 4: Composite displaced design onto blank photo ──
      // Use source-over to preserve original design colors exactly
      ctx.globalCompositeOperation = "source-over";
      ctx.drawImage(designCanvas, Math.round(drawX), Math.round(drawY));

      // ── Step 5: Upload final composite to Supabase ──
      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Canvas toBlob failed"))), "image/png")
      );

      const fileName = `ai-comp-${Date.now()}-${Math.random().toString(36).slice(2)}.png`;
      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(fileName, blob, { contentType: "image/png", upsert: false });

      if (uploadError) return null;

      const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(fileName);
      return urlData.publicUrl;
    } catch (e) {
      console.error("Composite error:", e);
      return null;
    }
  }

  /** Call API to generate a blank garment photo (model in plain shirt, no design) */
  async function generateBlankPhoto(
    side: "front" | "back",
    variationIndex: number,
    hex: string,
  ): Promise<{ blankUrl: string; side: "front" | "back"; variationIndex: number } | null> {
    const colorName = SHIRT_COLORS.find((sc) => sc.value === hex)?.name ?? "unknown";
    const garmentTypeVal = (category && category in GARMENT_CONFIGS) ? category : "shirt";

    let genderLabel: string;
    if (genderSelections.includes("Men") && genderSelections.includes("Women")) {
      genderLabel = variationIndex % 2 === 0 ? "male" : "female";
    } else {
      genderLabel = genderSelections.length > 0 ? genderSelections[0].toLowerCase() : "male";
      if (genderLabel === "men") genderLabel = "male";
      if (genderLabel === "women") genderLabel = "female";
    }

    const res = await fetch("/api/generate-model-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        colorName,
        garmentType: garmentTypeVal,
        productName: name || undefined,
        gender: genderLabel,
        side,
        variationIndex,
      }),
    });

    const data = await res.json();
    if (!res.ok) return null;
    return { blankUrl: data.imageUrl, side, variationIndex };
  }

  /** Recolor a blank garment photo to a different color (same model, still blank) */
  async function recolorBlank(
    blankUrl: string,
    targetHex: string,
  ): Promise<string | null> {
    const targetColorName = SHIRT_COLORS.find((sc) => sc.value === targetHex)?.name ?? "unknown";
    const garmentTypeVal = (category && category in GARMENT_CONFIGS) ? category : "shirt";

    const res = await fetch("/api/generate-model-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        referenceImage: blankUrl,
        targetColorName,
        garmentType: garmentTypeVal,
      }),
    });

    const data = await res.json();
    if (!res.ok) return null;
    return data.imageUrl;
  }

  async function handleGenerateAllPhotos() {
    setMessage(null);

    type Job = { side: "front" | "back"; variationIndex: number };
    const jobs: Job[] = [];
    if (hasFrontSide) {
      jobs.push({ side: "front", variationIndex: 0 });
      jobs.push({ side: "front", variationIndex: 1 });
    }
    if (hasBackSide) {
      jobs.push({ side: "back", variationIndex: 0 });
      jobs.push({ side: "back", variationIndex: 1 });
    }

    if (jobs.length === 0) {
      setMessage({ type: "error", text: "Add content to at least one side before generating." });
      return;
    }

    const primaryHex = selectedColors[0];
    const otherColors = selectedColors.slice(1);

    // Build full key set for progress tracking
    const allKeys = new Set<string>();
    for (const j of jobs) {
      allKeys.add(`${primaryHex}-${j.side}-${j.variationIndex}`);
      for (const hex of otherColors) {
        allKeys.add(`${hex}-${j.side}-${j.variationIndex}`);
      }
    }
    setGeneratingKeys(allKeys);

    // ── Step 1: Generate BLANK garment photos for primary color ──
    const blankResults = await Promise.allSettled(
      jobs.map((j) => generateBlankPhoto(j.side, j.variationIndex, primaryHex))
    );

    const blankEntries = blankResults
      .map((r) => (r.status === "fulfilled" ? r.value : null))
      .filter((v): v is NonNullable<typeof v> => v !== null);

    if (blankEntries.length === 0) {
      setMessage({ type: "error", text: "Failed to generate any photos. Please try again." });
      setGeneratingKeys(new Set());
      return;
    }

    // ── Step 2: Composite design onto each blank using displacement + multiply ──
    const primaryEntries: ModelPhotoEntry[] = [];
    for (const blank of blankEntries) {
      const canvasRef = blank.side === "front" ? snapshotFrontRef : snapshotBackRef;
      const designOverlay = canvasRef.current?.toMaskDataURL(4);
      if (!designOverlay) continue;

      const compositedUrl = await compositeWithDisplacement(blank.blankUrl, designOverlay, blank.side);
      if (compositedUrl) {
        primaryEntries.push({ url: compositedUrl, side: blank.side, variationIndex: blank.variationIndex });
      }
    }

    if (primaryEntries.length > 0) {
      setGeneratedModelImages((prev) => ({
        ...prev,
        [primaryHex]: [...(prev[primaryHex] ?? []), ...primaryEntries],
      }));
    }

    // Remove primary keys from progress
    for (const j of jobs) allKeys.delete(`${primaryHex}-${j.side}-${j.variationIndex}`);
    setGeneratingKeys(new Set(allKeys));

    // ── Step 3: For other colors, recolor blank photos then composite same design ──
    for (const hex of otherColors) {
      const recolorEntries: ModelPhotoEntry[] = [];

      const recolorResults = await Promise.allSettled(
        blankEntries.map(async (blank) => {
          const recoloredBlankUrl = await recolorBlank(blank.blankUrl, hex);
          if (!recoloredBlankUrl) return null;

          const canvasRef = blank.side === "front" ? snapshotFrontRef : snapshotBackRef;
          const designOverlay = canvasRef.current?.toMaskDataURL(4);
          if (!designOverlay) return null;

          const compositedUrl = await compositeWithDisplacement(recoloredBlankUrl, designOverlay, blank.side);
          if (!compositedUrl) return null;

          return { url: compositedUrl, side: blank.side, variationIndex: blank.variationIndex } as ModelPhotoEntry;
        })
      );

      for (const r of recolorResults) {
        if (r.status === "fulfilled" && r.value) {
          recolorEntries.push(r.value);
        }
      }

      if (recolorEntries.length > 0) {
        setGeneratedModelImages((prev) => ({
          ...prev,
          [hex]: [...(prev[hex] ?? []), ...recolorEntries],
        }));
      }

      for (const j of jobs) allKeys.delete(`${hex}-${j.side}-${j.variationIndex}`);
      setGeneratingKeys(new Set(allKeys));
    }

    setGeneratingKeys(new Set());
  }

  async function handleGenerateOneMore(side: "front" | "back") {
    const existing = (generatedModelImages[previewShirtColor] ?? []).filter((e) => e.side === side);
    const nextIdx = existing.length;
    const key = `${previewShirtColor}-${side}-${nextIdx}`;

    setGeneratingKeys((prev) => new Set(prev).add(key));

    const blank = await generateBlankPhoto(side, nextIdx, previewShirtColor);
    if (blank) {
      const canvasRef = side === "front" ? snapshotFrontRef : snapshotBackRef;
      const designOverlay = canvasRef.current?.toMaskDataURL(4);
      if (designOverlay) {
        const compositedUrl = await compositeWithDisplacement(blank.blankUrl, designOverlay, side);
        if (compositedUrl) {
          setGeneratedModelImages((prev) => ({
            ...prev,
            [previewShirtColor]: [...(prev[previewShirtColor] ?? []), { url: compositedUrl, side, variationIndex: nextIdx }],
          }));
        } else {
          setMessage({ type: "error", text: `Failed to composite ${side} photo.` });
        }
      }
    } else {
      setMessage({ type: "error", text: `Failed to generate ${side} photo.` });
    }

    setGeneratingKeys((prev) => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  }

  function removePhoto(hex: string, url: string) {
    setGeneratedModelImages((prev) => {
      const entries = (prev[hex] ?? []).filter((e) => e.url !== url);
      if (entries.length === 0) {
        const next = { ...prev };
        delete next[hex];
        return next;
      }
      return { ...prev, [hex]: entries };
    });
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

    const colorVariants: { color: string; hex: string; image: string; modelImages?: ModelImageSet }[] = [];
    const allImageUrls: string[] = [];

    if (customDesignEnabled) {
      const fContent = frontDesign.textItems.length > 0 || frontDesign.imageData.length > 0;
      const bContent = backDesign.textItems.length > 0 || backDesign.imageData.length > 0;

      if (!fContent && !bContent) {
        setMessage({ type: "error", text: "Add text or an image to the custom design." });
        setLoading(false);
        return;
      }

      for (const hex of selectedColors) {
        const colorName = SHIRT_COLORS.find((sc) => sc.value === hex)?.name ?? "";
        const entries = generatedModelImages[hex] ?? [];
        const frontUrls = entries.filter((e) => e.side === "front").map((e) => e.url);
        const backUrls = entries.filter((e) => e.side === "back").map((e) => e.url);
        const heroImage = frontUrls[0] ?? backUrls[0] ?? "";

        const modelImages: ModelImageSet = { front: frontUrls, back: backUrls };
        colorVariants.push({ color: colorName, hex, image: heroImage, modelImages });

        for (const url of [...frontUrls, ...backUrls]) {
          allImageUrls.push(url);
        }
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
      // Orphan cleanup: collect all old URLs
      const oldUrls = new Set<string>();
      for (const url of editProduct!.images ?? []) oldUrls.add(url);
      for (const v of editProduct!.color_variants ?? []) {
        if (v.image) oldUrls.add(v.image);
        if (v.modelImages) {
          for (const url of v.modelImages.front) oldUrls.add(url);
          for (const url of v.modelImages.back) oldUrls.add(url);
        }
      }
      const newUrls = new Set(allImageUrls);
      const orphanedUrls = [...oldUrls].filter((url) => !newUrls.has(url));

      if (orphanedUrls.length > 0) {
        const orphanedPaths = orphanedUrls.map((url) => {
          const parts = url.split("/product-images/");
          return parts[parts.length - 1];
        });
        await supabase.storage.from("product-images").remove(orphanedPaths);
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
      setGeneratedModelImages({});
      setLoading(false);
      router.refresh();
    }
  }

  const visibleFrontTextItems = frontDesign.textItems.filter((t) => t.text.trim().length > 0);
  const visibleBackTextItems = backDesign.textItems.filter((t) => t.text.trim().length > 0);
  const visibleTextItems = currentDesign.textItems.filter((t) => t.text.trim().length > 0);

  const isGenerating = generatingKeys.size > 0;
  const currentPhotos = generatedModelImages[previewShirtColor] ?? [];
  const currentFrontPhotos = currentPhotos.filter((e) => e.side === "front");
  const currentBackPhotos = currentPhotos.filter((e) => e.side === "back");
  const totalPhotosAllColors = Object.values(generatedModelImages).reduce((sum, arr) => sum + arr.length, 0);

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

          {/* Hidden off-screen canvases for snapshot capture — one per side */}
          <div style={{ position: "absolute", left: "-9999px", top: 0, width: 400, pointerEvents: "none" }} aria-hidden>
            <ShirtPreviewCanvas
              ref={snapshotFrontRef}
              shirtColor={previewShirtColor}
              imageData={frontDesign.imageData || undefined}
              imagePos={frontDesign.imagePos}
              textItems={visibleFrontTextItems}
              side="front"
              garmentType={(category && category in GARMENT_CONFIGS) ? category as GarmentType : "shirt"}
            />
            {garmentSides.includes("back") && (
              <ShirtPreviewCanvas
                ref={snapshotBackRef}
                shirtColor={previewShirtColor}
                imageData={backDesign.imageData || undefined}
                imagePos={backDesign.imagePos}
                textItems={visibleBackTextItems}
                side="back"
                garmentType={(category && category in GARMENT_CONFIGS) ? category as GarmentType : "shirt"}
              />
            )}
          </div>

          {/* ── AI MODEL PHOTOS PANEL ── */}
          <div className="border border-purple-200 rounded-xl p-4 bg-purple-50/50 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-heading font-semibold uppercase tracking-widest text-purple-700">
                AI Model Photos
              </h4>
              {!isGenerating && totalPhotosAllColors > 0 && (
                <span className="text-xs text-purple-500 font-medium">{totalPhotosAllColors} photo{totalPhotosAllColors !== 1 ? "s" : ""} across {Object.keys(generatedModelImages).length} color{Object.keys(generatedModelImages).length !== 1 ? "s" : ""}</span>
              )}
            </div>

            {isGenerating ? (
              /* ── Loading animation — no images shown until fully done ── */
              <div className="flex flex-col items-center py-10 space-y-5">
                {/* Animated dots loader */}
                <div className="relative w-20 h-20">
                  <div className="absolute inset-0 rounded-full border-4 border-purple-200" />
                  <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-500 animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg className="w-8 h-8 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                      <path d="M12 2l2.4 7.4H22l-6 4.6 2.3 7L12 16.4 5.7 21l2.3-7L2 9.4h7.6L12 2z" />
                    </svg>
                  </div>
                </div>
                <div className="text-center space-y-1.5">
                  <p className="text-sm font-semibold text-purple-700">
                    Creating AI model photos...
                  </p>
                  <p className="text-xs text-purple-500">
                    {generatingKeys.size} photo{generatingKeys.size !== 1 ? "s" : ""} remaining across {selectedColors.length} color{selectedColors.length !== 1 ? "s" : ""}
                  </p>
                  <p className="text-[11px] text-muted mt-2">
                    Generating model photos and compositing your design — this may take a minute
                  </p>
                </div>
                {/* Animated progress bar */}
                <div className="w-full max-w-xs h-1.5 bg-purple-100 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500 rounded-full animate-pulse" style={{ width: "100%" }} />
                </div>
              </div>
            ) : (
              /* ── Normal state: generate button + photo grids ── */
              <>
                {/* Generate All button */}
                <button
                  type="button"
                  onClick={handleGenerateAllPhotos}
                  className="w-full border border-dashed border-purple-300 bg-white rounded-lg px-4 py-4 text-center text-sm text-purple-600 hover:border-purple-400 hover:bg-purple-100 transition-colors duration-200 cursor-pointer"
                >
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                      <path d="M12 2l2.4 7.4H22l-6 4.6 2.3 7L12 16.4 5.7 21l2.3-7L2 9.4h7.6L12 2z" />
                    </svg>
                    {totalPhotosAllColors > 0 ? "Regenerate AI Model Photos (All Colors)" : "Generate AI Model Photos (All Colors)"}
                  </span>
                </button>
                <p className="text-xs text-muted">Generates model in blank shirt, then composites your exact design with realistic fabric blending — same model across all {selectedColors.length} color{selectedColors.length !== 1 ? "s" : ""}</p>

                {/* FRONT VIEW section */}
                {hasFrontSide && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                        Front View ({currentFrontPhotos.length})
                      </span>
                      <button
                        type="button"
                        onClick={() => handleGenerateOneMore("front")}
                        className="text-xs text-purple-600 hover:text-purple-800 font-medium transition-colors duration-200 cursor-pointer"
                      >
                        + Add Another
                      </button>
                    </div>
                    {currentFrontPhotos.length > 0 ? (
                      <div className="grid grid-cols-3 gap-2">
                        {currentFrontPhotos.map((entry) => (
                          <div key={entry.url} className="relative group/photo rounded-lg overflow-hidden border border-border">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={entry.url}
                              alt={`Front variation ${entry.variationIndex + 1}`}
                              className="w-full aspect-square object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => removePhoto(previewShirtColor, entry.url)}
                              className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover/photo:opacity-100 transition-opacity duration-200 cursor-pointer hover:bg-red-600"
                              aria-label="Remove photo"
                            >
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                                <path d="M6 6l12 12M6 18L18 6" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted/60">No front photos yet</p>
                    )}
                  </div>
                )}

                {/* BACK VIEW section */}
                {hasBackSide && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                        Back View ({currentBackPhotos.length})
                      </span>
                      <button
                        type="button"
                        onClick={() => handleGenerateOneMore("back")}
                        className="text-xs text-purple-600 hover:text-purple-800 font-medium transition-colors duration-200 cursor-pointer"
                      >
                        + Add Another
                      </button>
                    </div>
                    {currentBackPhotos.length > 0 ? (
                      <div className="grid grid-cols-3 gap-2">
                        {currentBackPhotos.map((entry) => (
                          <div key={entry.url} className="relative group/photo rounded-lg overflow-hidden border border-border">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={entry.url}
                              alt={`Back variation ${entry.variationIndex + 1}`}
                              className="w-full aspect-square object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => removePhoto(previewShirtColor, entry.url)}
                              className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover/photo:opacity-100 transition-opacity duration-200 cursor-pointer hover:bg-red-600"
                              aria-label="Remove photo"
                            >
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                                <path d="M6 6l12 12M6 18L18 6" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted/60">No back photos yet</p>
                    )}
                  </div>
                )}
              </>
            )}
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
                  const photoCount = (generatedModelImages[hex] ?? []).length;
                  return (
                    <button
                      key={hex}
                      type="button"
                      onClick={() => {
                        setSelectedColors((prev) => [hex, ...prev.filter((c) => c !== hex)]);
                        handleShirtColorChange(hex);
                      }}
                      title={`${sc?.name}${photoCount > 0 ? ` (${photoCount} photos)` : ""}`}
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
                      <div className="flex flex-col gap-1.5">
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
                      Upload image
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
