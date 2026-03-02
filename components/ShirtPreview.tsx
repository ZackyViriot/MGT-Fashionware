"use client";

import { forwardRef, useRef, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import type { ElementPosition, TextItem } from "@/utils/cart-context";
import type { ShirtSide } from "@/constants/shirt-config";
import type { GarmentType } from "@/constants/garment-types";

export type { ShirtPreviewCanvasHandle } from "./ShirtPreviewCanvas";
import type { ShirtPreviewCanvasHandle } from "./ShirtPreviewCanvas";

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
  garmentType?: GarmentType;
  className?: string;
}

const DEFAULT_IMAGE_POS: ElementPosition = { x: 100, y: 110, scale: 1 };

const ShirtPreview = forwardRef<ShirtPreviewCanvasHandle, ShirtPreviewProps>(
  function ShirtPreview({ className = "", imagePos, imageData, garmentType = "shirt", ...rest }, ref) {
    const ip = imagePos ?? DEFAULT_IMAGE_POS;

    return (
      <div className={className}>
        <ShirtPreviewCanvas
          ref={ref}
          {...rest}
          imageData={imageData}
          imagePos={ip}
          garmentType={garmentType}
        />
      </div>
    );
  }
);

export default ShirtPreview;
