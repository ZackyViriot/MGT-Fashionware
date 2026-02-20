import type { ProductDesign, SideDesign } from "@/types/product";
import type { CustomDesign } from "@/utils/cart-context";
import type { GarmentType } from "@/constants/garment-types";

export type { SideDesign };
export type ShirtSide = "front" | "back";

export interface NormalizedDesign {
  front?: SideDesign;
  back?: SideDesign;
}

/** Convert a ProductDesign (possibly legacy flat format) into { front, back }. */
export function normalizeDesign(d: ProductDesign | null | undefined): NormalizedDesign {
  if (!d) return {};

  // New format — has front/back fields
  if (d.front || d.back) {
    return { front: d.front, back: d.back };
  }

  // Legacy flat format — treat as front-only
  const side: SideDesign = {};
  if (d.text) side.text = d.text;
  if (d.textColor) side.textColor = d.textColor;
  if (d.fontSize) side.fontSize = d.fontSize;
  if (d.fontFamily) side.fontFamily = d.fontFamily;
  if (d.imageData) side.imageData = d.imageData;
  if (d.imagePos) side.imagePos = d.imagePos;
  if (d.textPos) side.textPos = d.textPos;

  const hasContent = side.text || side.imageData;
  return hasContent ? { front: side } : {};
}

/** Convert a CustomDesign (cart context, possibly legacy) into { front, back } + shirtColor + garmentType. */
export function normalizeCustomDesign(d: CustomDesign | undefined): {
  shirtColor: string;
  front?: SideDesign;
  back?: SideDesign;
  garmentType: GarmentType;
} {
  if (!d) return { shirtColor: "#0a0a0a", garmentType: "shirt" as GarmentType };

  // New format
  if (d.front || d.back) {
    return { shirtColor: d.shirtColor, front: d.front, back: d.back, garmentType: d.garmentType ?? "shirt" as GarmentType };
  }

  // Legacy flat format
  const side: SideDesign = {};
  if (d.text) side.text = d.text;
  if (d.textColor) side.textColor = d.textColor;
  if (d.fontSize) side.fontSize = d.fontSize;
  if (d.fontFamily) side.fontFamily = d.fontFamily;
  if (d.imageData) side.imageData = d.imageData;
  if (d.imagePos) side.imagePos = d.imagePos;
  if (d.textPos) side.textPos = d.textPos;

  const hasContent = side.text || side.imageData;
  return { shirtColor: d.shirtColor, front: hasContent ? side : undefined, garmentType: "shirt" as GarmentType };
}

/** Check if a side design has any content */
export function sideHasContent(side: SideDesign | undefined): boolean {
  if (!side) return false;
  const hasTextItems = side.textItems && side.textItems.length > 0;
  return !!(side.text?.trim() || side.imageData || hasTextItems);
}
