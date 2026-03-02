import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us",
  description: "Learn about MGT Fashion — our story, mission, and commitment to vintage-inspired streetwear.",
};

export default function AboutPage() {
  return (
    <section className="px-6 py-16">
      <div className="max-w-3xl mx-auto">
        <h1 className="font-heading font-bold text-3xl md:text-4xl tracking-tight mb-6">Our Story</h1>
        <div className="space-y-6 text-sm text-muted leading-relaxed">
          <p>
            MGT Fashion was born from a simple idea: great style shouldn&apos;t follow trends — it should outlast them. We curate vintage-inspired streetwear and independent fashion for people who value character, quality, and self-expression.
          </p>
          <p>
            Every piece in our collection is chosen with intention. We work with independent designers and source unique garments that blend timeless aesthetics with modern comfort. From graphic tees to custom-designed hoodies, each item tells a story.
          </p>
          <h2 className="font-heading font-bold text-xl text-primary pt-4">Our Mission</h2>
          <p>
            To make distinctive, high-quality fashion accessible to everyone. We believe that what you wear is an extension of who you are, and we&apos;re here to help you express that — without compromise.
          </p>
          <h2 className="font-heading font-bold text-xl text-primary pt-4">Our Values</h2>
          <ul className="list-disc list-inside space-y-2">
            <li><span className="font-medium text-primary">Quality First</span> — We never sacrifice craftsmanship for cost.</li>
            <li><span className="font-medium text-primary">Individual Expression</span> — Fashion should be personal, not prescribed.</li>
            <li><span className="font-medium text-primary">Sustainability</span> — We prioritize lasting pieces over fast fashion.</li>
            <li><span className="font-medium text-primary">Community</span> — We support independent designers and small creators.</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
