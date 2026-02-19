"use client";

import { useState, useRef, useCallback, useId } from "react";
import type { ElementPosition } from "@/utils/cart-context";

export type { ElementPosition };

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
  className?: string;
}

const IMAGE_BASE = 90;
const HANDLE = 7;
const BOUNDS = { minX: 42, maxX: 158, minY: 56, maxY: 218 };

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

type DragState = {
  kind: "move" | "resize";
  element: "image" | "text";
  startSvgX: number;
  startSvgY: number;
  startPos: ElementPosition;
  startDist: number;
};

export default function ShirtEditor({
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
  className = "",
}: ShirtEditorProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const clipId = useId();
  const [selected, setSelected] = useState<"image" | "text" | null>(null);
  const dragRef = useRef<DragState | null>(null);

  // Keep latest setters in refs so window listeners don't go stale
  const settersRef = useRef({ onImagePosChange, onTextPosChange });
  settersRef.current = { onImagePosChange, onTextPosChange };

  const displayText = text || "";
  const baseFontSize = fontSize;

  // Image computed rect
  const imgW = IMAGE_BASE * imagePos.scale;
  const imgH = IMAGE_BASE * imagePos.scale;
  const imgX = imagePos.x - imgW / 2;
  const imgY = imagePos.y - imgH / 2;

  // Text computed rect (approximate)
  const scaledFont = baseFontSize * textPos.scale;
  const textW = Math.max(displayText.length * scaledFont * 0.6, 24);
  const textH = Math.max(scaledFont * 1.3, 18);
  const textRX = textPos.x - textW / 2;
  const textRY = textPos.y - textH / 2;

  const clientToSvg = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current!;
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    return pt.matrixTransform(svg.getScreenCTM()!.inverse());
  }, []);

  function corners(x: number, y: number, w: number, h: number) {
    return [
      { cx: x, cy: y },
      { cx: x + w, cy: y },
      { cx: x + w, cy: y + h },
      { cx: x, cy: y + h },
    ];
  }

  // ---- Drag logic using window listeners ----
  const startDrag = useCallback(
    (e: React.PointerEvent, element: "image" | "text", kind: "move" | "resize") => {
      e.stopPropagation();
      e.preventDefault();
      const svgPt = clientToSvg(e.clientX, e.clientY);
      const pos = element === "image" ? imagePos : textPos;

      setSelected(element);

      const startDist = Math.hypot(svgPt.x - pos.x, svgPt.y - pos.y) || 1;

      dragRef.current = {
        kind,
        element,
        startSvgX: svgPt.x,
        startSvgY: svgPt.y,
        startPos: { ...pos },
        startDist,
      };

      const onMove = (me: PointerEvent) => {
        const drag = dragRef.current;
        if (!drag) return;
        me.preventDefault();
        const pt = clientToSvg(me.clientX, me.clientY);
        const setter =
          drag.element === "image"
            ? settersRef.current.onImagePosChange
            : settersRef.current.onTextPosChange;

        if (drag.kind === "move") {
          setter({
            ...drag.startPos,
            x: clamp(drag.startPos.x + pt.x - drag.startSvgX, BOUNDS.minX, BOUNDS.maxX),
            y: clamp(drag.startPos.y + pt.y - drag.startSvgY, BOUNDS.minY, BOUNDS.maxY),
          });
        } else {
          const dist = Math.hypot(pt.x - drag.startPos.x, pt.y - drag.startPos.y) || 1;
          const newScale = Math.max(0.25, Math.min(3, drag.startPos.scale * (dist / drag.startDist)));
          setter({ ...drag.startPos, scale: newScale });
        }
      };

      const onUp = () => {
        dragRef.current = null;
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [clientToSvg, imagePos, textPos]
  );

  const onBgDown = useCallback((e: React.PointerEvent) => {
    const tag = (e.target as Element).tagName;
    if (tag === "svg" || tag === "path") setSelected(null);
  }, []);

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 200 240"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} touch-none select-none`}
      onPointerDown={onBgDown}
    >
      <defs>
        <clipPath id={clipId}>
          <path d="M40 55 L160 55 L160 210 C160 218 154 224 146 224 L54 224 C46 224 40 218 40 210 Z" />
        </clipPath>
      </defs>

      {/* T-shirt silhouette */}
      <path
        d="M60 30 L40 38 L10 60 L30 80 L40 72 L40 210 C40 218 46 224 54 224 L146 224 C154 224 160 218 160 210 L160 72 L170 80 L190 60 L160 38 L140 30 C138 44 126 54 100 54 C74 54 62 44 60 30 Z"
        fill={shirtColor}
        stroke="#00000020"
        strokeWidth="1"
      />
      <path
        d="M60 30 C62 44 74 54 100 54 C126 54 138 44 140 30"
        fill="none"
        stroke="#00000015"
        strokeWidth="1.5"
      />

      {/* ---- IMAGE LAYER ---- */}
      {imageData && (
        <g>
          <image
            href={imageData}
            x={imgX}
            y={imgY}
            width={imgW}
            height={imgH}
            preserveAspectRatio="xMidYMid slice"
            clipPath={`url(#${clipId})`}
            style={{ cursor: "move" }}
            onPointerDown={(e) => startDrag(e, "image", "move")}
          />
          {selected === "image" && (
            <>
              <rect
                x={imgX}
                y={imgY}
                width={imgW}
                height={imgH}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="1.2"
                strokeDasharray="4 2"
              />
              {corners(imgX, imgY, imgW, imgH).map((h, i) => (
                <rect
                  key={i}
                  x={h.cx - HANDLE / 2}
                  y={h.cy - HANDLE / 2}
                  width={HANDLE}
                  height={HANDLE}
                  rx="1.5"
                  fill="white"
                  stroke="#3b82f6"
                  strokeWidth="1"
                  style={{ cursor: "nwse-resize" }}
                  onPointerDown={(e) => startDrag(e, "image", "resize")}
                />
              ))}
            </>
          )}
        </g>
      )}

      {/* ---- TEXT LAYER ---- */}
      {displayText && (
        <g>
          {/* Invisible hit area */}
          <rect
            x={textRX}
            y={textRY}
            width={textW}
            height={textH}
            fill="transparent"
            style={{ cursor: "move" }}
            onPointerDown={(e) => startDrag(e, "text", "move")}
          />
          <text
            x={textPos.x}
            y={textPos.y}
            textAnchor="middle"
            dominantBaseline="central"
            fill={textColor}
            fontFamily={fontFamily}
            fontSize={scaledFont}
            fontWeight="600"
            style={{ cursor: "move", userSelect: "none", pointerEvents: "none" }}
          >
            {displayText}
          </text>
          {selected === "text" && (
            <>
              <rect
                x={textRX}
                y={textRY}
                width={textW}
                height={textH}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="1.2"
                strokeDasharray="4 2"
              />
              {corners(textRX, textRY, textW, textH).map((h, i) => (
                <rect
                  key={i}
                  x={h.cx - HANDLE / 2}
                  y={h.cy - HANDLE / 2}
                  width={HANDLE}
                  height={HANDLE}
                  rx="1.5"
                  fill="white"
                  stroke="#3b82f6"
                  strokeWidth="1"
                  style={{ cursor: "nwse-resize" }}
                  onPointerDown={(e) => startDrag(e, "text", "resize")}
                />
              ))}
            </>
          )}
        </g>
      )}

      {/* Hint text */}
      {(imageData || displayText) && !selected && (
        <text
          x="100"
          y="234"
          textAnchor="middle"
          fontSize="6.5"
          fill="#9ca3af"
          fontFamily="sans-serif"
        >
          Click to select · Drag to move · Corners to resize
        </text>
      )}
    </svg>
  );
}
