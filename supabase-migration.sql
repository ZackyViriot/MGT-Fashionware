-- Run this in your Supabase SQL editor to create the custom_orders table

create table if not exists custom_orders (
  id uuid default gen_random_uuid() primary key,
  shirt_color text not null,
  shirt_color_name text,
  size text not null,

  -- Front design
  front_text text,
  front_text_color text,
  front_font_family text,
  front_font_size integer,
  front_image_url text,
  front_image_pos jsonb,
  front_text_pos jsonb,
  front_text_items jsonb,

  -- Back design
  back_text text,
  back_text_color text,
  back_font_family text,
  back_font_size integer,
  back_image_url text,
  back_image_pos jsonb,
  back_text_pos jsonb,
  back_text_items jsonb,

  status text default 'pending' not null,
  created_at timestamptz default now() not null
);

-- Allow inserts from anon (customers placing orders)
alter table custom_orders enable row level security;

create policy "Anyone can insert custom orders"
  on custom_orders for insert
  with check (true);

-- Only authenticated admins can read orders
create policy "Authenticated users can read custom orders"
  on custom_orders for select
  using (auth.role() = 'authenticated');

-- Authenticated users can update order status
create policy "Authenticated users can update custom orders"
  on custom_orders for update
  using (auth.role() = 'authenticated');

-- Create a storage bucket for custom design images (if not exists)
-- Run this separately if needed:
-- insert into storage.buckets (id, name, public) values ('custom-designs', 'custom-designs', true);
