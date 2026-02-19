"use client";

import dynamic from "next/dynamic";
import type { ElementPosition, TextItem } from "@/utils/cart-context";
import type { ShirtSide } from "@/constants/shirt-config";

const ShirtPreviewCanvas = dynamic(() => import("./ShirtPreviewCanvas"), {
  ssr: false,
  loading: () => (
    <div className="w-full aspect-[200/240] bg-surface rounded-xl animate-pulse" />
  ),
});

interface ShirtPreviewProps {
  shirtColor: string;
  // Legacy single-text props
  text?: string;
  textColor?: string;
  fontFamily?: string;
  fontSize?: number;
  textPos?: ElementPosition;
  // Multi-text
  textItems?: TextItem[];
  // Image
  imageData?: string;
  imagePos?: ElementPosition;
  side?: ShirtSide;
  className?: string;
}

const DEFAULT_IMAGE_POS: ElementPosition = { x: 100, y: 110, scale: 1 };

export default function ShirtPreview({
  className = "",
  imagePos,
  imageData,
  ...rest
}: ShirtPreviewProps) {
  const ip = imagePos ?? DEFAULT_IMAGE_POS;

  return (
    <div className={className}>
      <ShirtPreviewCanvas
        {...rest}
        imageData={imageData}
        imagePos={ip}
      />
    </div>
  );
}
