export interface ColorVariant {
  color: string;
  hex: string;
  image: string;
}

export interface SideDesign {
  text?: string;
  textColor?: string;
  fontSize?: number;
  fontFamily?: string;
  imageData?: string;
  imagePos?: { x: number; y: number; scale: number };
  textPos?: { x: number; y: number; scale: number };
}

export interface ProductDesign {
  front?: SideDesign;
  back?: SideDesign;
  // Legacy flat fields kept for backward compat reads
  text?: string;
  textColor?: string;
  fontSize?: number;
  fontFamily?: string;
  imageData?: string;
  imagePos?: { x: number; y: number; scale: number };
  textPos?: { x: number; y: number; scale: number };
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  images: string[];
  color_variants: ColorVariant[] | null;
  category: string | null;
  gender: string | null;
  sizes: string[];
  custom_design: ProductDesign | null;
  created_at: string;
}
