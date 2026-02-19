"use client";

import dynamic from "next/dynamic";
import type { ElementPosition } from "@/utils/cart-context";
import type { ShirtSide } from "@/constants/shirt-config";

const ShirtPreviewCanvas = dynamic(() => import("./ShirtPreviewCanvas"), {
  ssr: false,
  loading: () => (
    <div className="w-full aspect-[200/240] bg-surface rounded-xl animate-pulse" />
  ),
});

interface ShirtPreviewProps {
  shirtColor: string;
  text?: string;
  textColor?: string;
  fontFamily?: string;
  fontSize?: number;
  imageData?: string;
  imagePos?: ElementPosition;
  textPos?: ElementPosition;
  side?: ShirtSide;
  className?: string;
}

const DEFAULT_IMAGE_POS: ElementPosition = { x: 100, y: 110, scale: 1 };
const DEFAULT_TEXT_POS: ElementPosition = { x: 100, y: 185, scale: 1 };
const DEFAULT_TEXT_ONLY_POS: ElementPosition = { x: 100, y: 130, scale: 1 };

export default function ShirtPreview({
  className = "",
  imagePos,
  textPos,
  imageData,
  ...rest
}: ShirtPreviewProps) {
  const ip = imagePos ?? DEFAULT_IMAGE_POS;
  const tp = textPos ?? (imageData ? DEFAULT_TEXT_POS : DEFAULT_TEXT_ONLY_POS);

  return (
    <div className={className}>
      <ShirtPreviewCanvas
        {...rest}
        imageData={imageData}
        imagePos={ip}
        textPos={tp}
      />
    </div>
  );
}
