import { createAdminClient } from "@/utils/supabase/admin";

export async function uploadBase64Image(
  base64Data: string,
  label: string
): Promise<string | null> {
  try {
    const matches = base64Data.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!matches) return null;

    const ext = matches[1] === "jpeg" ? "jpg" : matches[1];
    const buffer = Buffer.from(matches[2], "base64");
    const path = `${Date.now()}-${label}-${Math.random().toString(36).slice(2)}.${ext}`;

    const supabase = createAdminClient();

    const { error } = await supabase.storage
      .from("custom-designs")
      .upload(path, buffer, {
        contentType: `image/${matches[1]}`,
      });

    if (error) {
      console.error("Upload error:", error.message);
      return null;
    }

    const { data } = supabase.storage.from("custom-designs").getPublicUrl(path);
    return data.publicUrl;
  } catch (err) {
    console.error("Upload exception:", err);
    return null;
  }
}
