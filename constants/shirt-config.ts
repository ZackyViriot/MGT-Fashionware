export type ShirtSide = "front" | "back";

export interface PrintArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const LOGICAL_WIDTH = 200;
export const LOGICAL_HEIGHT = 240;

export const SHIRT_CONFIG: Record<
  ShirtSide,
  { imagePath: string; printArea: PrintArea }
> = {
  front: {
    imagePath: "/shirts/front.png",
    printArea: { x: 0, y: 0, width: 200, height: 240 },
  },
  back: {
    imagePath: "/shirts/back.png",
    printArea: { x: 0, y: 0, width: 200, height: 240 },
  },
};
