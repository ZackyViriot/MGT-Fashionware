export interface ShirtColor {
  name: string;
  value: string;
}

export const SHIRT_COLORS: ShirtColor[] = [
  // Neutrals
  { name: "Black", value: "#0a0a0a" },
  { name: "White", value: "#ffffff" },
  { name: "Charcoal", value: "#374151" },
  { name: "Gray", value: "#6b7280" },
  { name: "Silver", value: "#9ca3af" },
  { name: "Slate", value: "#64748b" },
  { name: "Cream", value: "#fef3c7" },
  { name: "Sand", value: "#d2b48c" },
  { name: "Khaki", value: "#bdb76b" },
  // Blues
  { name: "Navy", value: "#1e3a5f" },
  { name: "Royal Blue", value: "#1d4ed8" },
  { name: "Sky Blue", value: "#38bdf8" },
  { name: "Teal", value: "#0d9488" },
  { name: "Cyan", value: "#06b6d4" },
  // Reds / Pinks
  { name: "Red", value: "#b91c1c" },
  { name: "Burgundy", value: "#7f1d1d" },
  { name: "Coral", value: "#f87171" },
  { name: "Hot Pink", value: "#ec4899" },
  { name: "Rose", value: "#fda4af" },
  // Greens
  { name: "Forest Green", value: "#166534" },
  { name: "Olive", value: "#4d7c0f" },
  { name: "Sage", value: "#86efac" },
  { name: "Mint", value: "#6ee7b7" },
  // Purples
  { name: "Purple", value: "#7c3aed" },
  { name: "Lavender", value: "#c4b5fd" },
  { name: "Plum", value: "#581c87" },
  // Yellows / Oranges
  { name: "Mustard", value: "#ca8a04" },
  { name: "Gold", value: "#eab308" },
  { name: "Orange", value: "#ea580c" },
  { name: "Peach", value: "#fdba74" },
];

export const LIGHT_SHIRT_VALUES = new Set([
  "#ffffff", "#fef3c7", "#d2b48c", "#bdb76b", "#38bdf8",
  "#f87171", "#fda4af", "#86efac", "#6ee7b7", "#c4b5fd",
  "#fdba74", "#9ca3af",
]);

// Aliases — colors work for all garment types
export { SHIRT_COLORS as GARMENT_COLORS };
export type { ShirtColor as GarmentColor };
