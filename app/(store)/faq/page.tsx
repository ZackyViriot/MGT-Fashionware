import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Frequently asked questions about MGT Fashion — shipping, returns, sizing, custom designs, and more.",
};

const faqs = [
  {
    q: "How long does shipping take?",
    a: "Standard shipping takes 5–7 business days within the US. Free shipping on orders over $100.",
  },
  {
    q: "What is your return policy?",
    a: "We accept returns within 30 days of delivery for unworn, unwashed items in original condition. Custom-designed items are final sale.",
  },
  {
    q: "How do I find my size?",
    a: "Check our Size Guide page for detailed measurements across all garment types. When in doubt, size up — our pieces are designed for a comfortable fit.",
  },
  {
    q: "Can I customize any garment?",
    a: "You can customize any garment type available in our Custom Designer. Choose your base garment, add text, upload images, and pick your colors.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept all major credit cards, debit cards, and Apple Pay through our secure Stripe checkout.",
  },
  {
    q: "Do you ship internationally?",
    a: "Currently we only ship within the United States. International shipping is coming soon.",
  },
  {
    q: "How do I track my order?",
    a: "Once your order ships, you'll receive a confirmation email with tracking information. You can also check your order status on the order confirmation page.",
  },
  {
    q: "Is free shipping available?",
    a: "Yes! Orders over $100 qualify for free standard shipping.",
  },
];

export default function FAQPage() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: { "@type": "Answer", text: faq.a },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <section className="px-6 py-16">
        <div className="max-w-3xl mx-auto">
        <h1 className="font-heading font-bold text-3xl md:text-4xl tracking-tight mb-3">FAQ</h1>
        <p className="text-sm text-muted mb-10">Answers to commonly asked questions.</p>

        <div className="space-y-0 divide-y divide-border">
          {faqs.map((faq, i) => (
            <details key={i} className="group py-5">
              <summary className="flex items-center justify-between cursor-pointer list-none">
                <span className="text-sm font-semibold text-primary pr-4">{faq.q}</span>
                <svg
                  className="w-4 h-4 text-muted shrink-0 transition-transform duration-200 group-open:rotate-45"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </summary>
              <p className="text-sm text-muted leading-relaxed mt-3">{faq.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
    </>
  );
}
