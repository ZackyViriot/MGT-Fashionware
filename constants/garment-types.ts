export type GarmentType = "shirt" | "hoodie" | "longsleeve" | "hat" | "pants";
export type GarmentSide = "front" | "back";

export interface PrintArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface GarmentConfig {
  type: GarmentType;
  label: string;
  sides: GarmentSide[];
  sideConfigs: Record<string, { imagePath: string; printArea: PrintArea }>;
  logicalWidth: number;
  logicalHeight: number;
  basePrice: number;
  sizeCategories: Array<{ label: string; sizes: string[] }>;
  description: string;
}

export const GARMENT_CONFIGS: Record<GarmentType, GarmentConfig> = {
  shirt: {
    type: "shirt",
    label: "Shirt",
    sides: ["front", "back"],
    sideConfigs: {
      front: {
        imagePath: "/garments/shirt/front.png",
        printArea: { x: 0, y: 0, width: 200, height: 240 },
      },
      back: {
        imagePath: "/garments/shirt/back.png",
        printArea: { x: 0, y: 0, width: 200, height: 240 },
      },
    },
    logicalWidth: 200,
    logicalHeight: 240,
    basePrice: 30,
    sizeCategories: [
      { label: "Unisex", sizes: ["XS", "S", "M", "L", "XL", "XXL", "3XL"] },
      { label: "Women", sizes: ["XS", "S", "M", "L", "XL", "XXL"] },
    ],
    description: "Classic custom t-shirt with front and back printing.",
  },
  hoodie: {
    type: "hoodie",
    label: "Hoodie",
    sides: ["front", "back"],
    sideConfigs: {
      front: {
        imagePath: "/garments/hoodie/front.png",
        printArea: { x: 20, y: 30, width: 160, height: 180 },
      },
      back: {
        imagePath: "/garments/hoodie/back.png",
        printArea: { x: 20, y: 20, width: 160, height: 200 },
      },
    },
    logicalWidth: 200,
    logicalHeight: 260,
    basePrice: 45,
    sizeCategories: [
      { label: "Unisex", sizes: ["S", "M", "L", "XL", "XXL", "3XL"] },
    ],
    description: "Premium hoodie with front and back custom printing.",
  },
  longsleeve: {
    type: "longsleeve",
    label: "Long Sleeve",
    sides: ["front", "back"],
    sideConfigs: {
      front: {
        imagePath: "/garments/longsleeve/front.png",
        printArea: { x: 10, y: 10, width: 180, height: 220 },
      },
      back: {
        imagePath: "/garments/longsleeve/back.png",
        printArea: { x: 10, y: 10, width: 180, height: 220 },
      },
    },
    logicalWidth: 200,
    logicalHeight: 260,
    basePrice: 35,
    sizeCategories: [
      { label: "Unisex", sizes: ["XS", "S", "M", "L", "XL", "XXL", "3XL"] },
      { label: "Women", sizes: ["XS", "S", "M", "L", "XL", "XXL"] },
    ],
    description: "Custom long sleeve tee with front and back printing.",
  },
  hat: {
    type: "hat",
    label: "Hat",
    sides: ["front"],
    sideConfigs: {
      front: {
        imagePath: "/garments/hat/front.png",
        printArea: { x: 30, y: 20, width: 140, height: 100 },
      },
    },
    logicalWidth: 200,
    logicalHeight: 160,
    basePrice: 25,
    sizeCategories: [
      { label: "Standard", sizes: ["S/M", "L/XL", "One Size"] },
    ],
    description: "Custom hat with front panel printing.",
  },
  pants: {
    type: "pants",
    label: "Pants",
    sides: ["front", "back"],
    sideConfigs: {
      front: {
        imagePath: "/garments/pants/front.png",
        printArea: { x: 30, y: 10, width: 140, height: 250 },
      },
      back: {
        imagePath: "/garments/pants/back.png",
        printArea: { x: 30, y: 10, width: 140, height: 250 },
      },
    },
    logicalWidth: 200,
    logicalHeight: 300,
    basePrice: 40,
    sizeCategories: [
      { label: "Standard", sizes: ["S", "M", "L", "XL", "XXL"] },
    ],
    description: "Custom pants/sweats with front and back printing.",
  },
};

export const GARMENT_TYPES = Object.keys(GARMENT_CONFIGS) as GarmentType[];

export function isValidGarmentType(value: string): value is GarmentType {
  return value in GARMENT_CONFIGS;
}
