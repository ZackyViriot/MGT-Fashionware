import { useState, useEffect, type RefObject } from "react";

export function useContainerSize(ref: RefObject<HTMLDivElement | null>, aspectRatio: number = 1.2) {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const measure = () => {
      const w = el.clientWidth;
      setSize({ width: w, height: w * aspectRatio });
    };

    measure();

    const observer = new ResizeObserver(() => measure());
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, aspectRatio]);

  return size;
}
