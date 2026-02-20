export type OrderStatus = "pending" | "processing" | "shipped" | "delivered";

export interface OrderTextItem {
  text: string;
  textColor: string;
  fontSize: number;
  fontFamily: string;
  pos: { x: number; y: number; scale: number };
}

export interface OrderDesignSide {
  imageUrl?: string | null;
  imagePos?: { x: number; y: number; scale: number } | null;
  textItems?: OrderTextItem[] | null;
}

export interface OrderLineItem {
  productId: string;
  name: string;
  price: number;
  color: string;
  size: string;
  quantity: number;
  image: string;
  isCustom?: boolean;
  /** @deprecated use customDesign instead */
  customDesignUrl?: string | null;
  shirtColor?: string;
  garmentType?: string;
  customDesign?: {
    front?: OrderDesignSide | null;
    back?: OrderDesignSide | null;
  } | null;
}

export type PaymentStatus = "unpaid" | "paid" | "failed" | "refunded";

export interface Order {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: string;
  shipping_city: string;
  shipping_state: string;
  shipping_zip: string;
  subtotal: number;
  shipping_cost: number;
  total: number;
  status: OrderStatus;
  payment_status: PaymentStatus;
  stripe_session_id: string | null;
  stripe_payment_intent_id: string | null;
  items: OrderLineItem[];
  created_at: string;
  updated_at: string;
}
