import { LIGHT_SHIRT_VALUES } from "./shirt-colors";

export const FONT_GROUPS = [
  {
    label: "Sans Serif",
    fonts: [
      { name: "Sora", value: "Sora, sans-serif" },
      { name: "DM Sans", value: "DM Sans, sans-serif" },
      { name: "Poppins", value: "Poppins, sans-serif" },
      { name: "Montserrat", value: "Montserrat, sans-serif" },
      { name: "Raleway", value: "Raleway, sans-serif" },
      { name: "Oswald", value: "Oswald, sans-serif" },
      { name: "Anton", value: "Anton, sans-serif" },
      { name: "Archivo Black", value: "Archivo Black, sans-serif" },
    ],
  },
  {
    label: "Serif",
    fonts: [
      { name: "Georgia", value: "Georgia, serif" },
      { name: "Playfair", value: "Playfair Display, serif" },
      { name: "Abril Fatface", value: "Abril Fatface, serif" },
    ],
  },
  {
    label: "Display",
    fonts: [
      { name: "Bebas Neue", value: "Bebas Neue, sans-serif" },
      { name: "Righteous", value: "Righteous, sans-serif" },
      { name: "Orbitron", value: "Orbitron, sans-serif" },
      { name: "Press Start", value: "Press Start 2P, monospace" },
      { name: "Permanent Marker", value: "Permanent Marker, cursive" },
      { name: "Lobster", value: "Lobster, cursive" },
    ],
  },
  {
    label: "Script",
    fonts: [
      { name: "Pacifico", value: "Pacifico, cursive" },
      { name: "Dancing Script", value: "Dancing Script, cursive" },
      { name: "Sacramento", value: "Sacramento, cursive" },
      { name: "Satisfy", value: "Satisfy, cursive" },
    ],
  },
  {
    label: "Mono",
    fonts: [
      { name: "Roboto Mono", value: "Roboto Mono, monospace" },
      { name: "System Mono", value: "monospace" },
    ],
  },
];

export const FONT_SIZE_MIN = 10;
export const FONT_SIZE_MAX = 48;
export const FONT_SIZE_DEFAULT = 24;

export function getTextColors(shirtColor: string) {
  if (LIGHT_SHIRT_VALUES.has(shirtColor)) {
    return [
      { name: "Black", value: "#0a0a0a" },
      { name: "Navy", value: "#1e3a5f" },
      { name: "Charcoal", value: "#374151" },
      { name: "Red", value: "#b91c1c" },
      { name: "Forest Green", value: "#166534" },
      { name: "Burgundy", value: "#7f1d1d" },
      { name: "Purple", value: "#7c3aed" },
      { name: "Royal Blue", value: "#1d4ed8" },
      { name: "Plum", value: "#581c87" },
      { name: "Orange", value: "#ea580c" },
    ];
  }
  return [
    { name: "White", value: "#ffffff" },
    { name: "Cream", value: "#fef3c7" },
    { name: "Gold", value: "#facc15" },
    { name: "Cyan", value: "#22d3ee" },
    { name: "Pink", value: "#f472b6" },
    { name: "Red", value: "#ef4444" },
    { name: "Lime", value: "#a3e635" },
    { name: "Sky Blue", value: "#38bdf8" },
    { name: "Peach", value: "#fdba74" },
    { name: "Lavender", value: "#c4b5fd" },
  ];
}
