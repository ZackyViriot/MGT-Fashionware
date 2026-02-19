"use no memo";
"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { Stage, Layer, Image as KImage, Text as KText, Group, Transformer } from "react-konva";
import type Konva from "konva";
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
  onImagePosChange: (pos: ElementPosition) => void;
  onTextPosChange: (pos: ElementPosition) => void;
  side?: ShirtSide;
}

const IMAGE_BASE = 90;

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

export default function ShirtEditorCanvas({
  shirtColor,
  text,
  textColor = "#ffffff",
  fontFamily = "sans-serif",
  fontSize = 24,
  imageData,
  imagePos,
  textPos,
  onImagePosChange,
  onTextPosChange,
  side = "front",
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { width, height } = useContainerSize(containerRef);
  const scaleX = width / LOGICAL_WIDTH;
  const scaleY = height / LOGICAL_HEIGHT;

  const { image: shirtImage } = useShirtImage(side, shirtColor);
  const [designImage, setDesignImage] = useState<HTMLImageElement | null>(null);
  const [selected, setSelected] = useState<"image" | "text" | null>(null);

  const imageRef = useRef<Konva.Image>(null);
  const textRef = useRef<Konva.Text>(null);
  const trRef = useRef<Konva.Transformer>(null);

  // Keep latest callbacks in refs
  const callbacksRef = useRef({ onImagePosChange, onTextPosChange });
  callbacksRef.current = { onImagePosChange, onTextPosChange };

  const printArea = SHIRT_CONFIG[side].printArea;
  const displayText = text || "";

  const imgW = IMAGE_BASE * imagePos.scale;
  const imgH = IMAGE_BASE * imagePos.scale;
  const scaledFontSize = fontSize * textPos.scale;

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

  // Attach Transformer to selected node
  useEffect(() => {
    const tr = trRef.current;
    if (!tr) return;

    if (selected === "image" && imageRef.current) {
      tr.nodes([imageRef.current]);
    } else if (selected === "text" && textRef.current) {
      tr.nodes([textRef.current]);
    } else {
      tr.nodes([]);
    }
    tr.getLayer()?.batchDraw();
  }, [selected]);

  // Clear selection when side changes
  useEffect(() => {
    setSelected(null);
  }, [side]);

  // Drag bound function — clamp center position to print area
  const imageDragBound = useCallback(
    (pos: { x: number; y: number }) => {
      return {
        x: clamp(pos.x, printArea.x * scaleX, (printArea.x + printArea.width) * scaleX),
        y: clamp(pos.y, printArea.y * scaleY, (printArea.y + printArea.height) * scaleY),
      };
    },
    [printArea, scaleX, scaleY]
  );

  const textDragBound = useCallback(
    (pos: { x: number; y: number }) => {
      return {
        x: clamp(pos.x, printArea.x * scaleX, (printArea.x + printArea.width) * scaleX),
        y: clamp(pos.y, printArea.y * scaleY, (printArea.y + printArea.height) * scaleY),
      };
    },
    [printArea, scaleX, scaleY]
  );

  // Handle image drag end
  const onImageDragEnd = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target;
    // Positions are in the scaled coordinate space, divide by scale to get logical coords
    callbacksRef.current.onImagePosChange({
      x: node.x() / scaleX,
      y: node.y() / scaleY,
      scale: imagePos.scale,
    });
  }, [scaleX, scaleY, imagePos.scale]);

  // Handle text drag end
  const onTextDragEnd = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target;
    callbacksRef.current.onTextPosChange({
      x: node.x() / scaleX,
      y: node.y() / scaleY,
      scale: textPos.scale,
    });
  }, [scaleX, scaleY, textPos.scale]);

  // Handle transform end (resize via Transformer)
  const onImageTransformEnd = useCallback((e: Konva.KonvaEventObject<Event>) => {
    const node = e.target as Konva.Image;
    const newScaleX = node.scaleX();
    const newScale = imagePos.scale * newScaleX;

    // Reset node scale and update dimensions
    node.scaleX(1);
    node.scaleY(1);

    const newW = IMAGE_BASE * newScale;
    const newH = IMAGE_BASE * newScale;
    node.width(newW);
    node.height(newH);
    node.offsetX(newW / 2);
    node.offsetY(newH / 2);

    callbacksRef.current.onImagePosChange({
      x: node.x() / scaleX,
      y: node.y() / scaleY,
      scale: newScale,
    });
  }, [scaleX, scaleY, imagePos.scale]);

  const onTextTransformEnd = useCallback((e: Konva.KonvaEventObject<Event>) => {
    const node = e.target as Konva.Text;
    const newScaleX = node.scaleX();
    const newScale = textPos.scale * newScaleX;

    // Reset node scale
    node.scaleX(1);
    node.scaleY(1);

    // Update font size with new scale
    const newFontSize = fontSize * newScale;
    node.fontSize(newFontSize);

    // Re-center offsets
    node.offsetX(node.width() / 2);
    node.offsetY(node.height() / 2);

    callbacksRef.current.onTextPosChange({
      x: node.x() / scaleX,
      y: node.y() / scaleY,
      scale: newScale,
    });
  }, [scaleX, scaleY, textPos.scale, fontSize]);

  // Click on stage background clears selection
  const onStageClick = useCallback((e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (e.target === e.target.getStage()) {
      setSelected(null);
    }
  }, []);

  return (
    <div ref={containerRef} style={{ width: "100%", aspectRatio: `${LOGICAL_WIDTH}/${LOGICAL_HEIGHT}` }}>
      {width > 0 && (
        <Stage
          width={width}
          height={height}
          onClick={onStageClick}
          onTap={onStageClick}
          style={{ touchAction: "none" }}
        >
          <Layer>
            {/* Tinted shirt background */}
            {shirtImage && (
              <KImage
                image={shirtImage}
                x={0}
                y={0}
                width={LOGICAL_WIDTH * scaleX}
                height={LOGICAL_HEIGHT * scaleY}
                listening={false}
              />
            )}

            {/* Clipped design area */}
            <Group
              clipFunc={(ctx) => {
                ctx.rect(
                  printArea.x * scaleX,
                  printArea.y * scaleY,
                  printArea.width * scaleX,
                  printArea.height * scaleY
                );
              }}
            >
              {/* User design image */}
              {designImage && (
                <KImage
                  ref={imageRef}
                  image={designImage}
                  x={imagePos.x * scaleX}
                  y={imagePos.y * scaleY}
                  width={imgW * scaleX}
                  height={imgH * scaleY}
                  offsetX={(imgW * scaleX) / 2}
                  offsetY={(imgH * scaleY) / 2}
                  draggable
                  dragBoundFunc={imageDragBound}
                  onClick={() => setSelected("image")}
                  onTap={() => setSelected("image")}
                  onDragEnd={onImageDragEnd}
                  onTransformEnd={onImageTransformEnd}
                />
              )}

              {/* User text */}
              {displayText && (
                <KText
                  text={displayText}
                  x={textPos.x * scaleX}
                  y={textPos.y * scaleY}
                  fontSize={scaledFontSize * scaleX}
                  fontFamily={fontFamily}
                  fill={textColor}
                  fontStyle="600"
                  align="center"
                  verticalAlign="middle"
                  draggable
                  dragBoundFunc={textDragBound}
                  onClick={() => setSelected("text")}
                  onTap={() => setSelected("text")}
                  onDragEnd={onTextDragEnd}
                  onTransformEnd={onTextTransformEnd}
                  ref={(node: Konva.Text | null) => {
                    (textRef as React.MutableRefObject<Konva.Text | null>).current = node;
                    if (node) {
                      node.offsetX(node.width() / 2);
                      node.offsetY(node.height() / 2);
                    }
                  }}
                />
              )}
            </Group>

            {/* Transformer for selected element */}
            <Transformer
              ref={trRef}
              rotateEnabled={false}
              enabledAnchors={["top-left", "top-right", "bottom-left", "bottom-right"]}
              keepRatio={true}
              boundBoxFunc={(oldBox, newBox) => {
                if (Math.abs(newBox.width) < 10 || Math.abs(newBox.height) < 10) {
                  return oldBox;
                }
                return newBox;
              }}
            />
          </Layer>

          {/* Hint text layer */}
          <Layer listening={false}>
            {(imageData || displayText) && !selected && (
              <KText
                text="Click to select · Drag to move · Corners to resize"
                x={0}
                y={(LOGICAL_HEIGHT - 8) * scaleY}
                width={width}
                fontSize={6.5 * scaleX}
                fontFamily="sans-serif"
                fill="#9ca3af"
                align="center"
              />
            )}
          </Layer>
        </Stage>
      )}
    </div>
  );
}
