import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Order Confirmation",
  description: "Your MGT Fashion order has been received.",
};

export default function OrderConfirmationLayout({ children }: { children: React.ReactNode }) {
  return children;
}
