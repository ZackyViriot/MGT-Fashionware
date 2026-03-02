import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email?.trim() || !email.includes("@")) {
      return NextResponse.json(
        { error: "Invalid email address." },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const { error } = await supabase
      .from("newsletter_subscribers")
      .insert({ email: email.trim().toLowerCase() });

    if (error) {
      // Postgres unique violation — treat as silent success to avoid email enumeration
      if (error.code === "23505") {
        return NextResponse.json({ success: true });
      }
      console.error("Newsletter insert error:", error.message);
      return NextResponse.json(
        { error: "Failed to subscribe." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
