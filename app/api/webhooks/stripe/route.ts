import { stripe } from "@/utils/stripe";
import { createAdminClient } from "@/utils/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  // If no webhook secret is configured, skip signature verification (dev mode)
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not set — rejecting webhook");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 400 }
    );
  }

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json(
      { error: "Webhook signature verification failed" },
      { status: 400 }
    );
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const sessionId = session.id;
    const paymentIntentId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id ?? null;

    const supabase = createAdminClient();

    // Update the pending order to mark it as paid
    const { error } = await supabase
      .from("orders")
      .update({
        payment_status: "paid",
        stripe_payment_intent_id: paymentIntentId,
        status: "processing",
      })
      .eq("stripe_session_id", sessionId);

    if (error) {
      console.error("Failed to update order payment status:", error.message);
      return NextResponse.json(
        { error: "Failed to update order" },
        { status: 500 }
      );
    }

    console.log(`Order paid: session=${sessionId}, pi=${paymentIntentId}`);
  }

  return NextResponse.json({ received: true });
}
