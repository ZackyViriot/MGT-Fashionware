"use no memo";
"use client";

import { useRef, useState, useEffect } from "react";
import { Stage, Layer, Image as KImage, Text as KText, Group } from "react-konva";
import type { ElementPosition, TextItem } from "@/utils/cart-context";
import { SHIRT_CONFIG, LOGICAL_WIDTH, LOGICAL_HEIGHT, type ShirtSide } from "@/constants/shirt-config";
import { useShirtImage } from "@/hooks/use-shirt-image";
import { useContainerSize } from "@/hooks/use-container-size";

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
}

const IMAGE_BASE = 90;

export default function ShirtPreviewCanvas({
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
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { width, height } = useContainerSize(containerRef);
  const scaleX = width / LOGICAL_WIDTH;
  const scaleY = height / LOGICAL_HEIGHT;

  const { image: shirtImage } = useShirtImage(side, shirtColor);
  const [designImage, setDesignImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!imageData) {
      setDesignImage(null);
      return;
    }
    const img = new window.Image();
    img.onload = () => setDesignImage(img);
    img.src = imageData;
  }, [imageData]);

  const printArea = SHIRT_CONFIG[side].printArea;

  const imgW = IMAGE_BASE * imagePos.scale;
  const imgH = IMAGE_BASE * imagePos.scale;

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

  return (
    <div ref={containerRef} style={{ width: "100%", aspectRatio: `${LOGICAL_WIDTH}/${LOGICAL_HEIGHT}` }}>
      {width > 0 && (
        <Stage
          width={width}
          height={height}
          scaleX={scaleX}
          scaleY={scaleY}
          listening={false}
        >
          <Layer>
            {shirtImage && (
              <KImage
                image={shirtImage}
                x={0}
                y={0}
                width={LOGICAL_WIDTH}
                height={LOGICAL_HEIGHT}
              />
            )}

            <Group
              clipFunc={(ctx) => {
                ctx.rect(printArea.x, printArea.y, printArea.width, printArea.height);
              }}
            >
              {designImage && (
                <KImage
                  image={designImage}
                  x={imagePos.x}
                  y={imagePos.y}
                  width={imgW}
                  height={imgH}
                  offsetX={imgW / 2}
                  offsetY={imgH / 2}
                />
              )}

              {resolvedTextItems.map((item) => {
                const scaledFontSize = item.fontSize * item.pos.scale;
                return (
                  <KText
                    key={item.id}
                    text={item.text}
                    x={item.pos.x}
                    y={item.pos.y}
                    fontSize={scaledFontSize}
                    fontFamily={item.fontFamily}
                    fill={item.textColor}
                    fontStyle="600"
                    align="center"
                    verticalAlign="middle"
                    offsetX={0}
                    offsetY={0}
                    ref={(node) => {
                      if (node) {
                        node.offsetX(node.width() / 2);
                        node.offsetY(node.height() / 2);
                      }
                    }}
                  />
                );
              })}
            </Group>
          </Layer>
        </Stage>
      )}
    </div>
  );
}
