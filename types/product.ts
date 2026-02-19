export interface ColorVariant {
  color: string;
  hex: string;
  image: string;
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
  created_at: string;
}
