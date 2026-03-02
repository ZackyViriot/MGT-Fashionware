"use no memo";
"use client";

import { useRef, useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { Stage, Layer, Image as KImage, Text as KText, Group } from "react-konva";
import type Konva from "konva";
import type { ElementPosition, TextItem } from "@/utils/cart-context";
import { type ShirtSide } from "@/constants/shirt-config";
import { type GarmentType, GARMENT_CONFIGS } from "@/constants/garment-types";
import { useShirtImage } from "@/hooks/use-shirt-image";
import { useContainerSize } from "@/hooks/use-container-size";

export interface ShirtPreviewCanvasHandle {
  toDataURL: (pixelRatio?: number) => string | null;
  /** Capture ONLY the design elements on a transparent background (no shirt).
   *  Used as the mask for AI generation so the design is preserved pixel-for-pixel. */
  toMaskDataURL: (pixelRatio?: number) => string | null;
}

interface Props {
  shirtColor: string;
  // Legacy single-text props (backward compat)
  text?: string;
  textColor?: string;
  fontFamily?: string;
  fontSize?: number;
  textPos?: ElementPosition;
  // Multi-text
  textItems?: TextItem[];
  // Image
  imageData?: string;
  imagePos: ElementPosition;
  side?: ShirtSide;
  garmentType?: GarmentType;
}

const IMAGE_BASE = 90;

const ShirtPreviewCanvas = forwardRef<ShirtPreviewCanvasHandle, Props>(function ShirtPreviewCanvas({
  shirtColor,
  text,
  textColor = "#ffffff",
  fontFamily = "sans-serif",
  fontSize = 24,
  textPos,
  textItems,
  imageData,
  imagePos,
  side = "front",
  garmentType = "shirt",
}, ref) {
  const config = GARMENT_CONFIGS[garmentType];
  const { logicalWidth, logicalHeight } = config;

  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const shirtImageRef = useRef<Konva.Image>(null);
  const { width, height } = useContainerSize(containerRef, logicalHeight / logicalWidth);
  const scaleX = width / logicalWidth;
  const scaleY = height / logicalHeight;

  useImperativeHandle(ref, () => ({
    toDataURL: (pixelRatio?: number) => {
      return stageRef.current?.toDataURL({ pixelRatio: pixelRatio ?? 2 }) ?? null;
    },
    toMaskDataURL: (pixelRatio?: number) => {
      const stage = stageRef.current;
      const shirtNode = shirtImageRef.current;
      if (!stage) return null;

      // Hide the shirt template so only design elements remain on transparent bg
      if (shirtNode) shirtNode.hide();
      const dataUrl = stage.toDataURL({ pixelRatio: pixelRatio ?? 4 });
      if (shirtNode) shirtNode.show();

      // The captured image has colored design elements on a transparent background.
      // For the OpenAI mask: transparent = edit, opaque = keep.
      // The design pixels are opaque → kept. Everything else is transparent → edited.
      // This is EXACTLY what we need — no conversion required.
      return dataUrl;
    },
  }));

  const { image: shirtImage } = useShirtImage(side, shirtColor, garmentType);
  const [designImage, setDesignImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!imageData) {
      setDesignImage(null);
      return;
    }
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => setDesignImage(img);
    img.src = imageData;
  }, [imageData]);

  const printArea = config.sideConfigs[side].printArea;

  const aspectRatio = designImage ? designImage.naturalWidth / designImage.naturalHeight : 1;
  const imgW = IMAGE_BASE * imagePos.scale * (aspectRatio >= 1 ? 1 : aspectRatio);
  const imgH = IMAGE_BASE * imagePos.scale * (aspectRatio >= 1 ? 1 / aspectRatio : 1);

  // Build the list of text items to render
  const resolvedTextItems: TextItem[] = textItems && textItems.length > 0
    ? textItems
    : text
      ? [{
          id: "legacy",
          text,
          textColor,
          fontSize,
          fontFamily,
          pos: textPos ?? { x: 100, y: 130, scale: 1 },
        }]
      : [];

  // Fixed-width text box for deterministic centering via align="center".
  // Multiplied by scaleX because we manually scale all coordinates.
  const textBoxW = logicalWidth * 10 * scaleX;

  return (
    <div ref={containerRef} style={{ width: "100%", aspectRatio: `${logicalWidth}/${logicalHeight}` }}>
      {width > 0 && (
        <Stage
          ref={stageRef}
          width={width}
          height={height}
          listening={false}
        >
          <Layer>
            {shirtImage && (
              <KImage
                ref={shirtImageRef}
                image={shirtImage}
                x={0}
                y={0}
                width={logicalWidth * scaleX}
                height={logicalHeight * scaleY}
              />
            )}

            <Group
              clipFunc={(ctx) => {
                ctx.rect(
                  printArea.x * scaleX,
                  printArea.y * scaleY,
                  printArea.width * scaleX,
                  printArea.height * scaleY,
                );
              }}
            >
              {designImage && (
                <KImage
                  image={designImage}
                  x={imagePos.x * scaleX}
                  y={imagePos.y * scaleY}
                  width={imgW * scaleX}
                  height={imgH * scaleY}
                  offsetX={(imgW * scaleX) / 2}
                  offsetY={(imgH * scaleY) / 2}
                  rotation={imagePos.rotation ?? 0}
                />
              )}

              {resolvedTextItems.map((item) => {
                const scaledFontSize = item.fontSize * item.pos.scale;
                const lineCount = item.text.split("\n").length;
                return (
                  <KText
                    key={item.id}
                    text={item.text}
                    x={item.pos.x * scaleX}
                    y={item.pos.y * scaleY}
                    width={textBoxW}
                    fontSize={scaledFontSize * scaleX}
                    fontFamily={item.fontFamily}
                    fill={item.textColor}
                    fontStyle="600"
                    align="center"
                    offsetX={textBoxW / 2}
                    offsetY={(scaledFontSize * scaleX * lineCount) / 2}
                    rotation={item.pos.rotation ?? 0}
                  />
                );
              })}
            </Group>
          </Layer>
        </Stage>
      )}
    </div>
  );
});

export default ShirtPreviewCanvas;
