import { useState, useEffect } from "react";
import { SHIRT_CONFIG, type ShirtSide } from "@/constants/shirt-config";

// Module-level caches
const imageCache = new Map<string, HTMLImageElement>();
const tintCache = new Map<string, HTMLCanvasElement>();
const CACHE_MAX = 15;

function loadImage(src: string): Promise<HTMLImageElement> {
  const cached = imageCache.get(src);
  if (cached) return Promise.resolve(cached);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imageCache.set(src, img);
      resolve(img);
    };
    img.onerror = reject;
    img.src = src;
  });
}

function tintShirtImage(img: HTMLImageElement, color: string): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = img.width;
  c.height = img.height;
  const ctx = c.getContext("2d")!;

  // Step 1: fill with the target shirt color
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, c.width, c.height);

  // Step 2: multiply blend — tints the white shirt with the fill color
  ctx.globalCompositeOperation = "multiply";
  ctx.drawImage(img, 0, 0);

  // Step 3: clip to the shirt silhouette using the original alpha channel
  ctx.globalCompositeOperation = "destination-in";
  ctx.drawImage(img, 0, 0);

  return c;
}

function evictOldest() {
  if (tintCache.size >= CACHE_MAX) {
    const firstKey = tintCache.keys().next().value;
    if (firstKey) tintCache.delete(firstKey);
  }
}

export function useShirtImage(side: ShirtSide, color: string) {
  const [image, setImage] = useState<HTMLCanvasElement | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const key = `${side}::${color}`;
    const cached = tintCache.get(key);
    if (cached) {
      setImage(cached);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    loadImage(SHIRT_CONFIG[side].imagePath)
      .then((img) => {
        if (cancelled) return;
        evictOldest();
        const tinted = tintShirtImage(img, color);
        tintCache.set(key, tinted);
        setImage(tinted);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [side, color]);

  return { image, loading };
}
