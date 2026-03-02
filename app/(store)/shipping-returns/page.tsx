import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shipping & Returns",
  description: "MGT Fashion shipping rates, delivery timelines, and return policy.",
};

export default function ShippingReturnsPage() {
  return (
    <section className="px-6 py-16">
      <div className="max-w-3xl mx-auto">
        <h1 className="font-heading font-bold text-3xl md:text-4xl tracking-tight mb-10">Shipping &amp; Returns</h1>

        <div className="space-y-10">
          <div>
            <h2 className="font-heading font-bold text-xl text-primary mb-4">Shipping</h2>
            <div className="space-y-4 text-sm text-muted leading-relaxed">
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-surface">
                      <th className="text-left px-4 py-3 font-semibold text-primary text-xs uppercase tracking-wider">Method</th>
                      <th className="text-left px-4 py-3 font-semibold text-primary text-xs uppercase tracking-wider">Delivery</th>
                      <th className="text-left px-4 py-3 font-semibold text-primary text-xs uppercase tracking-wider">Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-border">
                      <td className="px-4 py-3 font-medium text-primary">Standard</td>
                      <td className="px-4 py-3 text-muted">5–7 business days</td>
                      <td className="px-4 py-3 text-muted">$9.99 (free over $100)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>We currently ship within the United States only. Orders are processed within 1–2 business days.</p>
              <p>You&apos;ll receive a shipping confirmation email with tracking information once your order ships.</p>
            </div>
          </div>

          <div>
            <h2 className="font-heading font-bold text-xl text-primary mb-4">Returns</h2>
            <div className="space-y-4 text-sm text-muted leading-relaxed">
              <p>We want you to love your purchase. If something isn&apos;t right, we&apos;re here to help.</p>
              <ul className="list-disc list-inside space-y-2">
                <li>Returns accepted within <span className="font-medium text-primary">30 days</span> of delivery.</li>
                <li>Items must be unworn, unwashed, and in original condition with tags attached.</li>
                <li><span className="font-medium text-primary">Custom-designed items are final sale</span> and cannot be returned.</li>
                <li>Return shipping is the responsibility of the customer.</li>
                <li>Refunds are processed within 5–7 business days after we receive the return.</li>
              </ul>
              <p>To start a return, email us at <span className="font-medium text-primary">support@mgtfashion.com</span> with your order number.</p>
            </div>
          </div>

          <div>
            <h2 className="font-heading font-bold text-xl text-primary mb-4">Exchanges</h2>
            <div className="space-y-4 text-sm text-muted leading-relaxed">
              <p>Need a different size? We offer free exchanges on non-custom items. Contact us and we&apos;ll get you sorted.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
