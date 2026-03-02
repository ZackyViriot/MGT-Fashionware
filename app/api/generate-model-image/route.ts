import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const FRONT_POSES = [
  "standing straight, facing the camera directly, arms relaxed at sides",
  "standing straight, facing the camera directly, one hand slightly on hip",
];

const BACK_POSES = [
  "standing straight with back to the camera, arms relaxed at sides",
  "standing straight with back to the camera, looking slightly to the side",
];

export async function POST(request: Request) {
  try {
    // Auth guard — only authenticated admin users may call this endpoint
    const supabaseAuth = await createClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      colorName,
      garmentType,
      productName,
      gender,
      side = "front",
      variationIndex = 0,
      referenceImage,
      targetColorName,
    } = await request.json();

    const garmentLabel =
      garmentType === "longsleeve" ? "long sleeve shirt" : (garmentType ?? "shirt");

    let prompt: string;
    let response: OpenAI.ImagesResponse;

    if (referenceImage && targetColorName) {
      // ── RECOLOR MODE — change garment color, keep same model ──
      const refResponse = await fetch(referenceImage);
      if (!refResponse.ok) {
        return NextResponse.json(
          { error: "Failed to fetch reference image for recoloring" },
          { status: 500 },
        );
      }
      const refBuffer = Buffer.from(await refResponse.arrayBuffer());
      const imageFile = new File([refBuffer], "reference.png", { type: "image/png" });

      prompt = `Change ONLY the base fabric color of the ${garmentLabel} in this photo to ${targetColorName}. `
        + `CRITICAL: Keep the EXACT same model (same face, same body, same skin tone, same hair), the EXACT same pose, the EXACT same camera angle, and the EXACT same background. `
        + `The ${garmentLabel} must have NO text, NO graphics, NO logos, NO prints — just a plain solid ${targetColorName} ${garmentLabel}. `
        + `Only the fabric color changes. Nothing else changes.`;

      response = await openai.images.edit({
        model: "gpt-image-1",
        image: imageFile,
        prompt,
        size: "1024x1024",
        quality: "high",
      }) as OpenAI.ImagesResponse;
    } else {
      // ── GENERATE MODE — model in a blank garment (no input image) ──
      if (!colorName || !garmentType) {
        return NextResponse.json(
          { error: "colorName and garmentType are required" },
          { status: 400 },
        );
      }

      const genderLabel = gender || "male";
      const poses = side === "back" ? BACK_POSES : FRONT_POSES;
      const poseDesc = poses[variationIndex % poses.length];
      const sideDirection =
        side === "back"
          ? "from behind, showing the back of the garment"
          : "from the front";

      prompt = `Generate a photorealistic fashion studio photo of a ${genderLabel} model wearing a plain solid ${colorName} ${garmentLabel} with absolutely NO text, NO graphics, NO logos, NO prints, NO patterns — just a completely blank ${colorName} ${garmentLabel}. `
        + `The model is ${poseDesc}, photographed ${sideDirection}. `
        + `The ${garmentLabel} chest/torso area must be clearly visible, flat, and unobstructed — no wrinkles, no folds crossing the center, no shadows across the chest. `
        + `Clean white studio background, professional fashion photography, centered composition, upper body shot, flat even lighting on the garment.`;

      // Use images.generate (not images.edit) so no input image is sent —
      // this prevents OpenAI from seeing/altering the design
      response = await openai.images.generate({
        model: "gpt-image-1",
        prompt,
        size: "1024x1024",
        quality: "high",
        n: 1,
      }) as OpenAI.ImagesResponse;
    }

    const resultBase64 = response.data?.[0]?.b64_json;
    if (!resultBase64) {
      return NextResponse.json(
        { error: "No image was generated" },
        { status: 500 },
      );
    }

    // Upload to Supabase storage
    const resultBuffer = Buffer.from(resultBase64, "base64");
    const fileName = `ai-${Date.now()}-${Math.random().toString(36).slice(2)}.png`;

    const supabase = createAdminClient();
    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(fileName, resultBuffer, {
        contentType: "image/png",
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: `Upload failed: ${uploadError.message}` },
        { status: 500 },
      );
    }

    const { data: urlData } = supabase.storage
      .from("product-images")
      .getPublicUrl(fileName);

    return NextResponse.json({ imageUrl: urlData.publicUrl });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("generate-model-image error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
