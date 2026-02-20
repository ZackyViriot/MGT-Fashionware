"use client";

import dynamic from "next/dynamic";
import type { ElementPosition, TextItem } from "@/utils/cart-context";
import type { ShirtSide } from "@/constants/shirt-config";
import type { GarmentType } from "@/constants/garment-types";

export type { ElementPosition, TextItem };

const ShirtEditorCanvas = dynamic(() => import("./ShirtEditorCanvas"), {
  ssr: false,
  loading: () => (
    <div className="w-full aspect-[200/240] bg-surface rounded-xl animate-pulse" />
  ),
});

interface ShirtEditorProps {
  shirtColor: string;
  imageData?: string;
  imagePos: ElementPosition;
  onImagePosChange: (pos: ElementPosition) => void;
  textItems: TextItem[];
  onTextItemPosChange: (id: string, pos: ElementPosition) => void;
  selectedTextId: string | null;
  onSelect: (type: "image" | "text", id?: string) => void;
  onDeselect: () => void;
  side?: ShirtSide;
  garmentType?: GarmentType;
  className?: string;
}

export default function ShirtEditor({ className = "", garmentType = "shirt", ...props }: ShirtEditorProps) {
  return (
    <div className={className}>
      <ShirtEditorCanvas {...props} garmentType={garmentType} />
    </div>
  );
}
