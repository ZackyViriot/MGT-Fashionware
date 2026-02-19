"use client";

import Link from "next/link";
import { useState, useCallback } from "react";
import { useCart } from "@/utils/cart-context";
import CartDrawer from "./CartDrawer";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const { totalItems } = useCart();

  const closeCart = useCallback(() => setCartOpen(false), []);

  return (
    <>
      <header className="sticky top-0 z-50 bg-bg/90 backdrop-blur-md border-b border-border">
        <nav className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-14">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
              className="lg:hidden text-primary"
            >
              {mobileOpen ? (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M6 6l12 12M6 18L18 6" />
                </svg>
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M4 7h16M4 12h16M4 17h16" />
                </svg>
              )}
            </button>

            <Link href="/" className="font-heading font-bold text-xl tracking-tight text-primary">
              MGT
            </Link>

            <div className="hidden lg:flex items-center gap-8">
              <Link href="/" className="text-sm text-muted hover:text-primary transition-colors duration-200">
                Home
              </Link>
              <Link href="/men" className="text-sm text-muted hover:text-primary transition-colors duration-200">
                Men
              </Link>
              <Link href="/women" className="text-sm text-muted hover:text-primary transition-colors duration-200">
                Women
              </Link>
              <Link href="/custom" className="text-sm text-muted hover:text-primary transition-colors duration-200">
                Custom
              </Link>
              <Link href="/admin" className="text-sm text-muted hover:text-primary transition-colors duration-200">
                Admin
              </Link>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                aria-label="Search"
                className="text-muted hover:text-primary transition-colors duration-200"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <circle cx="11" cy="11" r="7" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
              </button>
              <button
                onClick={() => setCartOpen(true)}
                aria-label="Cart"
                className="relative text-muted hover:text-primary transition-colors duration-200 cursor-pointer"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0" />
                </svg>
                {totalItems > 0 && (
                  <span className="absolute -top-2 -right-2 w-4.5 h-4.5 bg-dark text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                    {totalItems > 99 ? "99+" : totalItems}
                  </span>
                )}
              </button>
            </div>
          </div>

          {searchOpen && (
            <div className="py-3 border-t border-border animate-slide-down">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Search products..."
                  autoFocus
                  className="flex-1 bg-surface rounded-lg px-4 py-2.5 text-sm text-primary placeholder:text-muted/50 border border-border focus:border-primary focus:outline-none transition-colors duration-200"
                />
                <button
                  onClick={() => setSearchOpen(false)}
                  aria-label="Close search"
                  className="text-muted hover:text-primary transition-colors duration-200"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M6 6l12 12M6 18L18 6" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </nav>

        {mobileOpen && (
          <div className="lg:hidden bg-bg border-t border-border px-6 py-5 space-y-1 animate-slide-down">
            <Link href="/" onClick={() => setMobileOpen(false)} className="block text-lg text-primary py-2">Home</Link>
            <Link href="/men" onClick={() => setMobileOpen(false)} className="block text-lg text-primary py-2">Men</Link>
            <Link href="/women" onClick={() => setMobileOpen(false)} className="block text-lg text-primary py-2">Women</Link>
            <Link href="/custom" onClick={() => setMobileOpen(false)} className="block text-lg text-primary py-2">Custom</Link>
            <Link href="/admin" onClick={() => setMobileOpen(false)} className="block text-lg text-primary py-2">Admin</Link>
          </div>
        )}
      </header>

      <CartDrawer open={cartOpen} onClose={closeCart} />
    </>
  );
}
