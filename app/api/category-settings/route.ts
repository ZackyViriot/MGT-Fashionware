import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("category_settings")
    .select("*")
    .order("category");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ settings: data });
}

export async function PATCH(request: Request) {
  const supabase = await createClient();

  // Check auth
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { category, enabled } = body;

  if (!category || typeof enabled !== "boolean") {
    return NextResponse.json({ error: "category and enabled are required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("category_settings")
    .update({ enabled, updated_at: new Date().toISOString() })
    .eq("category", category);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
