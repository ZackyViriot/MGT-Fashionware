import { useState, useEffect, type RefObject } from "react";
import { LOGICAL_WIDTH, LOGICAL_HEIGHT } from "@/constants/shirt-config";

const ASPECT = LOGICAL_HEIGHT / LOGICAL_WIDTH; // 1.2

export function useContainerSize(ref: RefObject<HTMLDivElement | null>) {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const measure = () => {
      const w = el.clientWidth;
      setSize({ width: w, height: w * ASPECT });
    };

    measure();

    const observer = new ResizeObserver(() => measure());
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);

  return size;
}
