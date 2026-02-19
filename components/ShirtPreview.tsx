import { useId } from "react";
import type { ElementPosition } from "@/utils/cart-context";

interface ShirtPreviewProps {
  shirtColor: string;
  text?: string;
  textColor?: string;
  fontFamily?: string;
  fontSize?: number;
  imageData?: string;
  imagePos?: ElementPosition;
  textPos?: ElementPosition;
  className?: string;
}

const IMAGE_BASE = 90;

export default function ShirtPreview({
  shirtColor,
  text,
  textColor = "#ffffff",
  fontFamily = "sans-serif",
  fontSize = 24,
  imageData,
  imagePos,
  textPos,
  className = "",
}: ShirtPreviewProps) {
  const clipId = useId();
  const displayText = text || "";

  const ip = imagePos ?? { x: 100, y: 110, scale: 1 };
  const imgW = IMAGE_BASE * ip.scale;
  const imgH = IMAGE_BASE * ip.scale;

  const tp = textPos ?? { x: 100, y: imageData ? 185 : 130, scale: 1 };
  const scaledFontSize = fontSize * tp.scale;

  return (
    <svg
      viewBox="0 0 200 240"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <clipPath id={clipId}>
          <path d="M40 55 L160 55 L160 210 C160 218 154 224 146 224 L54 224 C46 224 40 218 40 210 Z" />
        </clipPath>
      </defs>

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

      {imageData && (
        <image
          href={imageData}
          x={ip.x - imgW / 2}
          y={ip.y - imgH / 2}
          width={imgW}
          height={imgH}
          preserveAspectRatio="xMidYMid slice"
          clipPath={`url(#${clipId})`}
        />
      )}

      {displayText && (
        <text
          x={tp.x}
          y={tp.y}
          textAnchor="middle"
          dominantBaseline="central"
          fill={textColor}
          fontFamily={fontFamily}
          fontSize={scaledFontSize}
          fontWeight="600"
        >
          {displayText}
        </text>
      )}
    </svg>
  );
}
