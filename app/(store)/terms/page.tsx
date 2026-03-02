import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "MGT Fashion terms of service — the rules and guidelines for using our website and services.",
};

export default function TermsPage() {
  return (
    <section className="px-6 py-16">
      <div className="max-w-3xl mx-auto">
        <h1 className="font-heading font-bold text-3xl md:text-4xl tracking-tight mb-10">Terms of Service</h1>

        <div className="space-y-8 text-sm text-muted leading-relaxed">
          <div>
            <h2 className="font-heading font-bold text-lg text-primary mb-3">Agreement</h2>
            <p>By accessing and using MGT Fashion (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;), you agree to these Terms of Service. If you do not agree, please do not use our website.</p>
          </div>

          <div>
            <h2 className="font-heading font-bold text-lg text-primary mb-3">Products &amp; Pricing</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>All prices are listed in US dollars and are subject to change without notice.</li>
              <li>We reserve the right to limit quantities or refuse any order.</li>
              <li>Product images are for illustration purposes and may vary slightly from the actual product.</li>
            </ul>
          </div>

          <div>
            <h2 className="font-heading font-bold text-lg text-primary mb-3">Custom Designs</h2>
            <p>When using our custom designer, you agree that:</p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>You own or have the right to use any images or text you upload.</li>
              <li>Custom items are made to order and are final sale — no returns or exchanges.</li>
              <li>We reserve the right to decline orders containing offensive or copyrighted material.</li>
            </ul>
          </div>

          <div>
            <h2 className="font-heading font-bold text-lg text-primary mb-3">Intellectual Property</h2>
            <p>All content on this site — including logos, images, text, and designs — is the property of MGT Fashion and is protected by copyright law. You may not reproduce, distribute, or use our content without written permission.</p>
          </div>

          <div>
            <h2 className="font-heading font-bold text-lg text-primary mb-3">Limitation of Liability</h2>
            <p>MGT Fashion is not liable for any indirect, incidental, or consequential damages arising from the use of our website or products. Our liability is limited to the amount you paid for the product in question.</p>
          </div>

          <div>
            <h2 className="font-heading font-bold text-lg text-primary mb-3">Changes</h2>
            <p>We may update these terms at any time. Continued use of the site after changes constitutes acceptance of the new terms.</p>
          </div>

          <p className="text-xs text-muted/60 pt-4">Last updated: February 2026</p>
        </div>
      </div>
    </section>
  );
}
