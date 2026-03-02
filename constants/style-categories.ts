export const STYLE_CATEGORIES = [
  "Sports",
  "Anime",
  "Graphic",
  "Streetwear",
  "Vintage",
  "Minimal",
  "Abstract",
  "Music",
  "Gaming",
  "Nature",
  "Typography",
  "Retro",
] as const;

export type StyleCategory = (typeof STYLE_CATEGORIES)[number];

export function isValidStyleCategory(value: string): value is StyleCategory {
  return (STYLE_CATEGORIES as readonly string[]).includes(value);
}
