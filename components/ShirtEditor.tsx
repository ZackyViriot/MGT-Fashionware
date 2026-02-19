"use client";

import dynamic from "next/dynamic";
import type { ElementPosition } from "@/utils/cart-context";
import type { ShirtSide } from "@/constants/shirt-config";

export type { ElementPosition };

const ShirtEditorCanvas = dynamic(() => import("./ShirtEditorCanvas"), {
  ssr: false,
  loading: () => (
    <div className="w-full aspect-[200/240] bg-surface rounded-xl animate-pulse" />
  ),
});

interface ShirtEditorProps {
  shirtColor: string;
  text?: string;
  textColor?: string;
  fontFamily?: string;
  fontSize?: number;
  imageData?: string;
  imagePos: ElementPosition;
  textPos: ElementPosition;
  onImagePosChange: (pos: ElementPosition) => void;
  onTextPosChange: (pos: ElementPosition) => void;
  side?: ShirtSide;
  className?: string;
}

export default function ShirtEditor({ className = "", ...props }: ShirtEditorProps) {
  return (
    <div className={className}>
      <ShirtEditorCanvas {...props} />
    </div>
  );
}
