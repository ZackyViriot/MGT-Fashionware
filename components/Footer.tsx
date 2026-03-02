"use client";

import { useState } from "react";
import Link from "next/link";

export default function Footer() {
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterStatus, setNewsletterStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");

  async function handleNewsletter(e: React.FormEvent) {
    e.preventDefault();
    setNewsletterStatus("submitting");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newsletterEmail }),
      });
      if (res.ok) {
        setNewsletterStatus("success");
        setNewsletterEmail("");
      } else {
        setNewsletterStatus("error");
      }
    } catch {
      setNewsletterStatus("error");
    }
  }

  return (
    <footer>
      {/* Newsletter Card */}
      <section className="py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-surface rounded-2xl p-10 md:p-14 text-center">
            <h3 className="font-heading font-bold text-2xl text-primary">Stay in the Loop</h3>
            <p className="text-muted mt-3 text-sm">
              New arrivals, stories behind the pieces, and exclusive offers.
            </p>
            {newsletterStatus === "success" ? (
              <p className="mt-6 text-sm text-emerald-600 font-medium">
                You&apos;re subscribed! Thanks for joining.
              </p>
            ) : (
              <form onSubmit={handleNewsletter} className="mt-6 flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <input
                  type="email"
                  required
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="flex-1 bg-white rounded-full px-5 py-3 text-sm text-primary placeholder:text-muted/50 border border-border focus:border-primary focus:outline-none transition-colors duration-200"
                />
                <button
                  type="submit"
                  disabled={newsletterStatus === "submitting"}
                  className="bg-dark text-white font-heading font-semibold text-sm px-6 py-3 rounded-full hover:bg-dark/80 transition-colors duration-200 cursor-pointer whitespace-nowrap disabled:opacity-50"
                >
                  {newsletterStatus === "submitting" ? "Subscribing..." : "Subscribe"}
                </button>
              </form>
            )}
            {newsletterStatus === "error" && (
              <p className="mt-2 text-xs text-red-500">Something went wrong. Please try again.</p>
            )}
          </div>
        </div>
      </section>

      {/* Main footer */}
      <div className="bg-dark">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
            <div className="col-span-2 md:col-span-1">
              <span className="font-heading font-bold text-xl text-white">MGT</span>
              <p className="text-white/35 text-sm mt-4 leading-relaxed">
                An independent shop for those who value character over trend.
                Curated vintage-inspired pieces, made to last.
              </p>
            </div>

            <div>
              <h3 className="font-heading font-semibold text-xs uppercase tracking-widest text-white/50 mb-4">
                Shop
              </h3>
              <ul className="space-y-2.5">
                <li>
                  <Link href="/men" className="text-sm text-white/35 hover:text-white transition-colors duration-200">
                    Men&apos;s Collection
                  </Link>
                </li>
                <li>
                  <Link href="/women" className="text-sm text-white/35 hover:text-white transition-colors duration-200">
                    Women&apos;s Collection
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-heading font-semibold text-xs uppercase tracking-widest text-white/50 mb-4">
                Company
              </h3>
              <ul className="space-y-2.5">
                <li><Link href="/about" className="text-sm text-white/35 hover:text-white transition-colors duration-200">Our Story</Link></li>
                <li><Link href="/contact" className="text-sm text-white/35 hover:text-white transition-colors duration-200">Contact</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-heading font-semibold text-xs uppercase tracking-widest text-white/50 mb-4">
                Help
              </h3>
              <ul className="space-y-2.5">
                <li><Link href="/shipping-returns" className="text-sm text-white/35 hover:text-white transition-colors duration-200">Shipping &amp; Returns</Link></li>
                <li><Link href="/size-guide" className="text-sm text-white/35 hover:text-white transition-colors duration-200">Size Guide</Link></li>
                <li><Link href="/faq" className="text-sm text-white/35 hover:text-white transition-colors duration-200">FAQ</Link></li>
              </ul>
            </div>
          </div>

          <div className="mt-14 pt-8 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-xs text-white/20">
              &copy; {new Date().getFullYear()} MGT Fashion. All rights reserved.
            </p>
            <div className="flex gap-6">
              <Link href="/privacy" className="text-xs text-white/20 hover:text-white/40 transition-colors duration-200">Privacy</Link>
              <Link href="/terms" className="text-xs text-white/20 hover:text-white/40 transition-colors duration-200">Terms</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
