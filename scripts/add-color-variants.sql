-- Add color_variants JSONB column to products table
-- Each variant: { "color": "Black", "hex": "#000000", "image": "https://..." }
ALTER TABLE products
ADD COLUMN IF NOT EXISTS color_variants jsonb DEFAULT '[]'::jsonb;
