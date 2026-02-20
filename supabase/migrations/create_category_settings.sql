CREATE TABLE IF NOT EXISTS category_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  category text UNIQUE NOT NULL,
  enabled boolean DEFAULT true NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Seed with all garment types enabled
INSERT INTO category_settings (category, enabled) VALUES
  ('shirt', true),
  ('hoodie', true),
  ('longsleeve', true),
  ('hat', true),
  ('pants', true)
ON CONFLICT (category) DO NOTHING;

-- RLS: public SELECT, authenticated UPDATE
ALTER TABLE category_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read category settings"
  ON category_settings FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users can update category settings"
  ON category_settings FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
