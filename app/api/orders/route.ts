import { createClient } from "@/utils/supabase/server";
import { uploadBase64Image } from "@/utils/upload-image";
import { NextResponse } from "next/server";

interface TextItemInput {
  text: string;
  textColor: string;
  fontSize: number;
  fontFamily: string;
  pos: { x: number; y: number; scale: number };
}

interface LineItemInput {
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
  frontTextItems?: TextItemInput[] | null;
  backImageData?: string | null;
  backImagePos?: { x: number; y: number; scale: number } | null;
  backTextItems?: TextItemInput[] | null;
}

interface OrderInput {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  shippingCity: string;
  shippingState: string;
  shippingZip: string;
  items: LineItemInput[];
}

export async function POST(request: Request) {
  try {
    const body: OrderInput = await request.json();
    const supabase = await createClient();

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

    // Validate required fields
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

    // Process items: upload custom design images, build clean line items
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

        // Debug: log what custom data we received
        console.log("[Order API] Custom item received:", {
          productId: item.productId,
          shirtColor: item.shirtColor,
          hasFrontImageData: !!item.frontImageData,
          frontImageDataLength: item.frontImageData?.length ?? 0,
          frontImageDataPrefix: item.frontImageData?.substring(0, 50) ?? "null",
          frontTextItemsCount: item.frontTextItems?.length ?? 0,
          hasBackImageData: !!item.backImageData,
          backTextItemsCount: item.backTextItems?.length ?? 0,
        });

        // Upload front image
        let frontImageUrl: string | null = null;
        if (item.frontImageData) {
          frontImageUrl = await uploadBase64Image(
            item.frontImageData,
            `order-front-${item.productId}`
          );
          console.log("[Order API] Front image upload result:", frontImageUrl ? "SUCCESS" : "FAILED");
        }

        // Upload back image
        let backImageUrl: string | null = null;
        if (item.backImageData) {
          backImageUrl = await uploadBase64Image(
            item.backImageData,
            `order-back-${item.productId}`
          );
          console.log("[Order API] Back image upload result:", backImageUrl ? "SUCCESS" : "FAILED");
        }

        // Build front side data
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

        // Build back side data
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

        const result = {
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
        console.log("[Order API] Processed item customDesign:", JSON.stringify(result.customDesign, null, 2));
        return result;
      })
    );

    // Recalculate totals server-side
    const subtotal = processedItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const shippingCost = subtotal >= 100 ? 0 : 9.99;
    const total = subtotal + shippingCost;

    const { data, error } = await supabase
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
        items: processedItems,
      })
      .select("id")
      .single();

    if (error) {
      console.error("Order insert error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, orderId: data.id });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
