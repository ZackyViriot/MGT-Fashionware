"use no memo";
"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { Stage, Layer, Image as KImage, Text as KText, Group, Transformer } from "react-konva";
import type Konva from "konva";
import type { ElementPosition, TextItem } from "@/utils/cart-context";
import { type ShirtSide } from "@/constants/shirt-config";
import { type GarmentType, GARMENT_CONFIGS } from "@/constants/garment-types";
import { useShirtImage } from "@/hooks/use-shirt-image";
import { useContainerSize } from "@/hooks/use-container-size";

interface Props {
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
}

const IMAGE_BASE = 90;

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

export default function ShirtEditorCanvas({
  shirtColor,
  imageData,
  imagePos,
  onImagePosChange,
  textItems,
  onTextItemPosChange,
  selectedTextId,
  onSelect,
  onDeselect,
  side = "front",
  garmentType = "shirt",
}: Props) {
  const config = GARMENT_CONFIGS[garmentType];
  const { logicalWidth, logicalHeight } = config;

  const containerRef = useRef<HTMLDivElement>(null);
  const { width, height } = useContainerSize(containerRef, logicalHeight / logicalWidth);
  const scaleX = width / logicalWidth;
  const scaleY = height / logicalHeight;

  const { image: shirtImage } = useShirtImage(side, shirtColor, garmentType);
  const [designImage, setDesignImage] = useState<HTMLImageElement | null>(null);
  const [selected, setSelected] = useState<{ type: "image" | "text"; id?: string } | null>(null);

  const imageRef = useRef<Konva.Image>(null);
  const textRefs = useRef<Record<string, Konva.Text | null>>({});
  const trRef = useRef<Konva.Transformer>(null);

  const callbacksRef = useRef({ onImagePosChange, onTextItemPosChange });
  callbacksRef.current = { onImagePosChange, onTextItemPosChange };

  const printArea = config.sideConfigs[side].printArea;

  const imgW = IMAGE_BASE * imagePos.scale;
  const imgH = IMAGE_BASE * imagePos.scale;

  // Sync internal selection with parent
  useEffect(() => {
    if (selectedTextId) {
      setSelected({ type: "text", id: selectedTextId });
    }
  }, [selectedTextId]);

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

    if (selected?.type === "image" && imageRef.current) {
      tr.nodes([imageRef.current]);
    } else if (selected?.type === "text" && selected.id && textRefs.current[selected.id]) {
      tr.nodes([textRefs.current[selected.id]!]);
    } else {
      tr.nodes([]);
    }
    tr.getLayer()?.batchDraw();
  }, [selected]);

  // Clear selection when side changes
  useEffect(() => {
    setSelected(null);
  }, [side]);

  const dragBound = useCallback(
    (pos: { x: number; y: number }) => ({
      x: clamp(pos.x, printArea.x * scaleX, (printArea.x + printArea.width) * scaleX),
      y: clamp(pos.y, printArea.y * scaleY, (printArea.y + printArea.height) * scaleY),
    }),
    [printArea, scaleX, scaleY]
  );

  const onImageDragEnd = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target;
    callbacksRef.current.onImagePosChange({
      x: node.x() / scaleX,
      y: node.y() / scaleY,
      scale: imagePos.scale,
    });
  }, [scaleX, scaleY, imagePos.scale]);

  const onTextDragEnd = useCallback((id: string) => (e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target;
    const item = textItems.find((t) => t.id === id);
    callbacksRef.current.onTextItemPosChange(id, {
      x: node.x() / scaleX,
      y: node.y() / scaleY,
      scale: item?.pos.scale ?? 1,
    });
  }, [scaleX, scaleY, textItems]);

  const onImageTransformEnd = useCallback((e: Konva.KonvaEventObject<Event>) => {
    const node = e.target as Konva.Image;
    const newScaleX = node.scaleX();
    const newScale = imagePos.scale * newScaleX;
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

  const onTextTransformEnd = useCallback((id: string) => (e: Konva.KonvaEventObject<Event>) => {
    const node = e.target as Konva.Text;
    const item = textItems.find((t) => t.id === id);
    const prevScale = item?.pos.scale ?? 1;
    const newScaleX = node.scaleX();
    const newScale = prevScale * newScaleX;
    node.scaleX(1);
    node.scaleY(1);
    const newFontSize = (item?.fontSize ?? 24) * newScale;
    node.fontSize(newFontSize);
    node.offsetX(node.width() / 2);
    node.offsetY(node.height() / 2);
    callbacksRef.current.onTextItemPosChange(id, {
      x: node.x() / scaleX,
      y: node.y() / scaleY,
      scale: newScale,
    });
  }, [scaleX, scaleY, textItems]);

  const onStageClick = useCallback((e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (e.target === e.target.getStage()) {
      setSelected(null);
      onDeselect();
    }
  }, [onDeselect]);

  const hasContent = imageData || textItems.length > 0;

  return (
    <div ref={containerRef} style={{ width: "100%", aspectRatio: `${logicalWidth}/${logicalHeight}` }}>
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
                width={logicalWidth * scaleX}
                height={logicalHeight * scaleY}
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
                  dragBoundFunc={dragBound}
                  onClick={() => { setSelected({ type: "image" }); onSelect("image"); }}
                  onTap={() => { setSelected({ type: "image" }); onSelect("image"); }}
                  onDragEnd={onImageDragEnd}
                  onTransformEnd={onImageTransformEnd}
                />
              )}

              {/* Multiple user text items */}
              {textItems.map((item) => {
                const scaledFontSize = item.fontSize * item.pos.scale;
                return (
                  <KText
                    key={item.id}
                    text={item.text}
                    x={item.pos.x * scaleX}
                    y={item.pos.y * scaleY}
                    fontSize={scaledFontSize * scaleX}
                    fontFamily={item.fontFamily}
                    fill={item.textColor}
                    fontStyle="600"
                    align="center"
                    verticalAlign="middle"
                    draggable
                    dragBoundFunc={dragBound}
                    onClick={() => { setSelected({ type: "text", id: item.id }); onSelect("text", item.id); }}
                    onTap={() => { setSelected({ type: "text", id: item.id }); onSelect("text", item.id); }}
                    onDragEnd={onTextDragEnd(item.id)}
                    onTransformEnd={onTextTransformEnd(item.id)}
                    ref={(node: Konva.Text | null) => {
                      textRefs.current[item.id] = node;
                      if (node) {
                        node.offsetX(node.width() / 2);
                        node.offsetY(node.height() / 2);
                      }
                    }}
                  />
                );
              })}
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
            {hasContent && !selected && (
              <KText
                text="Click to select · Drag to move · Corners to resize"
                x={0}
                y={(logicalHeight - 8) * scaleY}
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
