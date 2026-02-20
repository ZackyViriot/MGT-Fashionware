"use client";

import { useEffect } from "react";
import { useCart } from "@/utils/cart-context";

export default function ClearCartOnMount() {
  const { clearCart } = useCart();

  useEffect(() => {
    clearCart();
  }, [clearCart]);

  return null;
}
