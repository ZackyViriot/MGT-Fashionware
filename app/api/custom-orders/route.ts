import { createClient } from "@/utils/supabase/server";
import { uploadBase64Image } from "@/utils/upload-image";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const supabase = await createClient();

    const {
      shirtColor,
      shirtColorName,
      size,
      front,
      back,
    } = body;

    // Upload front image if present (base64 → storage)
    let frontImageUrl: string | null = null;
    if (front?.imageData) {
      frontImageUrl = await uploadBase64Image(front.imageData, "front");
    }

    // Upload back image if present
    let backImageUrl: string | null = null;
    if (back?.imageData) {
      backImageUrl = await uploadBase64Image(back.imageData, "back");
    }

    // Build text items JSON (strip only what we need)
    const frontTextItems = front?.textItems?.map((t: { text: string; textColor: string; fontSize: number; fontFamily: string; pos: object }) => ({
      text: t.text,
      textColor: t.textColor,
      fontSize: t.fontSize,
      fontFamily: t.fontFamily,
      pos: t.pos,
    })) || null;

    const backTextItems = back?.textItems?.map((t: { text: string; textColor: string; fontSize: number; fontFamily: string; pos: object }) => ({
      text: t.text,
      textColor: t.textColor,
      fontSize: t.fontSize,
      fontFamily: t.fontFamily,
      pos: t.pos,
    })) || null;

    const { error } = await supabase.from("custom_orders").insert({
      shirt_color: shirtColor,
      shirt_color_name: shirtColorName || null,
      size,
      // Legacy single-text fields (null for multi-text orders)
      front_text: front?.text || null,
      front_text_color: front?.textColor || null,
      front_font_family: front?.fontFamily || null,
      front_font_size: front?.fontSize || null,
      front_image_url: frontImageUrl,
      front_image_pos: front?.imagePos || null,
      front_text_pos: front?.textPos || null,
      // Multi-text fields
      front_text_items: frontTextItems,
      back_text: back?.text || null,
      back_text_color: back?.textColor || null,
      back_font_family: back?.fontFamily || null,
      back_font_size: back?.fontSize || null,
      back_image_url: backImageUrl,
      back_image_pos: back?.imagePos || null,
      back_text_pos: back?.textPos || null,
      back_text_items: backTextItems,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

