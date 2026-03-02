import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Complete your MGT Fashion order.",
};

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
