import { GARMENT_CONFIGS, type PrintArea } from "./garment-types";
export type { GarmentType, GarmentSide, PrintArea } from "./garment-types";

export type ShirtSide = "front" | "back";

const shirtConfig = GARMENT_CONFIGS.shirt;

export const LOGICAL_WIDTH = shirtConfig.logicalWidth;
export const LOGICAL_HEIGHT = shirtConfig.logicalHeight;

export const SHIRT_CONFIG: Record<
  ShirtSide,
  { imagePath: string; printArea: PrintArea }
> = shirtConfig.sideConfigs as Record<
  ShirtSide,
  { imagePath: string; printArea: PrintArea }
>;
