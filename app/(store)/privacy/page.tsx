import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "MGT Fashion privacy policy — how we collect, use, and protect your information.",
};

export default function PrivacyPage() {
  return (
    <section className="px-6 py-16">
      <div className="max-w-3xl mx-auto">
        <h1 className="font-heading font-bold text-3xl md:text-4xl tracking-tight mb-10">Privacy Policy</h1>

        <div className="space-y-8 text-sm text-muted leading-relaxed">
          <div>
            <h2 className="font-heading font-bold text-lg text-primary mb-3">Information We Collect</h2>
            <p>When you make a purchase or interact with our site, we may collect:</p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Name, email address, and phone number</li>
              <li>Shipping and billing address</li>
              <li>Order history and preferences</li>
              <li>Device and browser information (via cookies)</li>
            </ul>
          </div>

          <div>
            <h2 className="font-heading font-bold text-lg text-primary mb-3">How We Use Your Information</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>Process and fulfill your orders</li>
              <li>Send order confirmations and shipping updates</li>
              <li>Improve our website and customer experience</li>
              <li>Send promotional emails (only with your consent)</li>
            </ul>
          </div>

          <div>
            <h2 className="font-heading font-bold text-lg text-primary mb-3">Data Security</h2>
            <p>We use industry-standard encryption and security measures to protect your personal information. Payment processing is handled securely by Stripe — we never store your credit card details.</p>
          </div>

          <div>
            <h2 className="font-heading font-bold text-lg text-primary mb-3">Third-Party Services</h2>
            <p>We use trusted third-party services including Stripe (payments) and Supabase (data storage). These services have their own privacy policies governing how they handle your data.</p>
          </div>

          <div>
            <h2 className="font-heading font-bold text-lg text-primary mb-3">Your Rights</h2>
            <p>You may request access to, correction of, or deletion of your personal data at any time by contacting us at <span className="font-medium text-primary">support@mgtfashion.com</span>.</p>
          </div>

          <div>
            <h2 className="font-heading font-bold text-lg text-primary mb-3">Updates</h2>
            <p>We may update this policy from time to time. Changes will be posted on this page.</p>
          </div>

          <p className="text-xs text-muted/60 pt-4">Last updated: February 2026</p>
        </div>
      </div>
    </section>
  );
}
