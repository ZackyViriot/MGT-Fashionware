"use no memo";
"use client";

import { useRef, useState, useEffect } from "react";
import { Stage, Layer, Image as KImage, Text as KText, Group } from "react-konva";
import type { ElementPosition } from "@/utils/cart-context";
import { SHIRT_CONFIG, LOGICAL_WIDTH, LOGICAL_HEIGHT, type ShirtSide } from "@/constants/shirt-config";
import { useShirtImage } from "@/hooks/use-shirt-image";
import { useContainerSize } from "@/hooks/use-container-size";

interface Props {
  shirtColor: string;
  text?: string;
  textColor?: string;
  fontFamily?: string;
  fontSize?: number;
  imageData?: string;
  imagePos: ElementPosition;
  textPos: ElementPosition;
  side?: ShirtSide;
}

const IMAGE_BASE = 90;

export default function ShirtPreviewCanvas({
  shirtColor,
  text,
  textColor = "#ffffff",
  fontFamily = "sans-serif",
  fontSize = 24,
  imageData,
  imagePos,
  textPos,
  side = "front",
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { width, height } = useContainerSize(containerRef);
  const scaleX = width / LOGICAL_WIDTH;
  const scaleY = height / LOGICAL_HEIGHT;

  const { image: shirtImage } = useShirtImage(side, shirtColor);
  const [designImage, setDesignImage] = useState<HTMLImageElement | null>(null);

  // Load user's uploaded image
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
  const displayText = text || "";

  const imgW = IMAGE_BASE * imagePos.scale;
  const imgH = IMAGE_BASE * imagePos.scale;
  const scaledFontSize = fontSize * textPos.scale;

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
            {/* Tinted shirt background */}
            {shirtImage && (
              <KImage
                image={shirtImage}
                x={0}
                y={0}
                width={LOGICAL_WIDTH}
                height={LOGICAL_HEIGHT}
              />
            )}

            {/* Clipped design area */}
            <Group
              clipFunc={(ctx) => {
                ctx.rect(printArea.x, printArea.y, printArea.width, printArea.height);
              }}
            >
              {/* User design image */}
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

              {/* User text */}
              {displayText && (
                <KText
                  text={displayText}
                  x={textPos.x}
                  y={textPos.y}
                  fontSize={scaledFontSize}
                  fontFamily={fontFamily}
                  fill={textColor}
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
              )}
            </Group>
          </Layer>
        </Stage>
      )}
    </div>
  );
}
