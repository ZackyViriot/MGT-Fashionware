import { stripe } from "@/utils/stripe";
import { NextResponse } from "next/server";

interface CheckoutItem {
  productId: string;
  name: string;
  price: number;
  color: string;
  size: string;
  quantity: number;
  image: string;
  isCustom?: boolean;
  garmentType?: string;
  shirtColor?: string | null;
  frontImageData?: string | null;
  frontImagePos?: { x: number; y: number; scale: number } | null;
  frontTextItems?: Array<{
    text: string;
    textColor: string;
    fontSize: number;
    fontFamily: string;
    pos: { x: number; y: number; scale: number };
  }> | null;
  backImageData?: string | null;
  backImagePos?: { x: number; y: number; scale: number } | null;
  backTextItems?: Array<{
    text: string;
    textColor: string;
    fontSize: number;
    fontFamily: string;
    pos: { x: number; y: number; scale: number };
  }> | null;
}

interface CheckoutInput {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  shippingCity: string;
  shippingState: string;
  shippingZip: string;
  items: CheckoutItem[];
}

export async function POST(request: Request) {
  try {
    const body: CheckoutInput = await request.json();
    const {
      customerName,
      customerEmail,
      customerPhone,
      shippingAddress,
      shippingCity,
      shippingState,
      shippingZip,
      items,
    } = body;

    if (
      !customerName?.trim() ||
      !customerEmail?.trim() ||
      !customerPhone?.trim() ||
      !shippingAddress?.trim() ||
      !shippingCity?.trim() ||
      !shippingState?.trim() ||
      !shippingZip?.trim()
    ) {
      return NextResponse.json(
        { error: "All customer and shipping fields are required" },
        { status: 400 }
      );
    }

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: "At least one item is required" },
        { status: 400 }
      );
    }

    // Calculate subtotal and shipping server-side
    const subtotal = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const shippingCost = subtotal >= 100 ? 0 : 9.99;

    // Build Stripe line items
    const lineItems = items.map((item) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: item.isCustom
            ? `Custom ${item.garmentType || "Shirt"} - ${item.color} / ${item.size}`
            : `${item.name} - ${item.color} / ${item.size}`,
          ...(item.image && !item.image.startsWith("data:")
            ? { images: [item.image] }
            : {}),
        },
        unit_amount: Math.round(item.price * 100), // Stripe uses cents
      },
      quantity: item.quantity,
    }));

    // Add shipping as a line item if not free
    if (shippingCost > 0) {
      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: {
            name: "Shipping",
          },
          unit_amount: Math.round(shippingCost * 100),
        },
        quantity: 1,
      });
    }

    const origin = request.headers.get("origin") || "http://localhost:3000";

    // Store the full order data in metadata so the webhook can create the order
    // Stripe metadata values must be strings and max 500 chars each, so we store
    // customer/shipping info directly and the items as a JSON string in metadata.
    // For large carts, we truncate the items JSON — the webhook will handle this.
    const itemsForMeta = items.map((item) => ({
      productId: item.productId,
      name: item.name,
      price: item.price,
      color: item.color,
      size: item.size,
      quantity: item.quantity,
      image: item.image,
      isCustom: item.isCustom || false,
      garmentType: item.garmentType,
      shirtColor: item.shirtColor,
      // Include custom design positioning data (not base64 images — too large)
      frontImagePos: item.frontImagePos,
      frontTextItems: item.frontTextItems,
      backImagePos: item.backImagePos,
      backTextItems: item.backTextItems,
      // Flag whether original had image data so webhook knows to look for uploaded URLs
      hasFrontImage: !!item.frontImageData,
      hasBackImage: !!item.backImageData,
    }));

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      customer_email: customerEmail.trim(),
      success_url: `${origin}/order-confirmation/{CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout`,
      metadata: {
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        customerPhone: customerPhone.trim(),
        shippingAddress: shippingAddress.trim(),
        shippingCity: shippingCity.trim(),
        shippingState: shippingState.trim(),
        shippingZip: shippingZip.trim(),
        subtotal: subtotal.toFixed(2),
        shippingCost: shippingCost.toFixed(2),
        itemsJson: JSON.stringify(itemsForMeta),
      },
    });

    // Also upload any custom design images now (before payment) so we have the
    // URLs ready when the webhook fires. We store the image URLs alongside the
    // session so the webhook can retrieve them.
    // We handle this by storing a pending order with the images pre-uploaded.
    // The simplest approach: upload images now, store a pending order in Supabase,
    // and have the webhook just update the payment status.

    // Upload custom design images and build processed items
    const { uploadBase64Image } = await import("@/utils/upload-image");

    const processedItems = await Promise.all(
      items.map(async (item) => {
        if (!item.isCustom) {
          return {
            productId: item.productId,
            name: item.name,
            price: item.price,
            color: item.color,
            size: item.size,
            quantity: item.quantity,
            image: item.image,
            isCustom: false,
            customDesign: null,
          };
        }

        let frontImageUrl: string | null = null;
        if (item.frontImageData) {
          frontImageUrl = await uploadBase64Image(
            item.frontImageData,
            `order-front-${item.productId}`
          );
        }

        let backImageUrl: string | null = null;
        if (item.backImageData) {
          backImageUrl = await uploadBase64Image(
            item.backImageData,
            `order-back-${item.productId}`
          );
        }

        const hasFront =
          frontImageUrl || (item.frontTextItems && item.frontTextItems.length > 0);
        const front = hasFront
          ? {
              imageUrl: frontImageUrl,
              imagePos: frontImageUrl ? item.frontImagePos ?? null : null,
              textItems:
                item.frontTextItems?.map((t) => ({
                  text: t.text,
                  textColor: t.textColor,
                  fontSize: t.fontSize,
                  fontFamily: t.fontFamily,
                  pos: t.pos,
                })) ?? null,
            }
          : null;

        const hasBack =
          backImageUrl || (item.backTextItems && item.backTextItems.length > 0);
        const back = hasBack
          ? {
              imageUrl: backImageUrl,
              imagePos: backImageUrl ? item.backImagePos ?? null : null,
              textItems:
                item.backTextItems?.map((t) => ({
                  text: t.text,
                  textColor: t.textColor,
                  fontSize: t.fontSize,
                  fontFamily: t.fontFamily,
                  pos: t.pos,
                })) ?? null,
            }
          : null;

        return {
          productId: item.productId,
          name: item.name,
          price: item.price,
          color: item.color,
          size: item.size,
          quantity: item.quantity,
          image: item.image,
          isCustom: true,
          garmentType: item.garmentType ?? undefined,
          shirtColor: item.shirtColor ?? null,
          customDesign: front || back ? { front, back } : null,
        };
      })
    );

    // Create a pending order in Supabase with payment_status = 'unpaid'
    const { createClient } = await import("@/utils/supabase/server");
    const supabase = await createClient();

    const total = subtotal + shippingCost;

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        customer_name: customerName.trim(),
        customer_email: customerEmail.trim(),
        customer_phone: customerPhone.trim(),
        shipping_address: shippingAddress.trim(),
        shipping_city: shippingCity.trim(),
        shipping_state: shippingState.trim(),
        shipping_zip: shippingZip.trim(),
        subtotal: parseFloat(subtotal.toFixed(2)),
        shipping_cost: parseFloat(shippingCost.toFixed(2)),
        total: parseFloat(total.toFixed(2)),
        status: "pending",
        payment_status: "unpaid",
        stripe_session_id: session.id,
        items: processedItems,
      })
      .select("id")
      .single();

    if (orderError) {
      console.error("Order insert error:", orderError.message);
      return NextResponse.json(
        { error: "Failed to create order" },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: session.url, orderId: order.id });
  } catch (err) {
    console.error("Checkout error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
