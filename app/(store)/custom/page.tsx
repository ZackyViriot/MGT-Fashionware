import Link from "next/link";
import { getEnabledCategories } from "@/hooks/category-settings-server";
import { GARMENT_CONFIGS, type GarmentType } from "@/constants/garment-types";

export default async function CustomLandingPage() {
  const enabledCategories = await getEnabledCategories();

  return (
    <section className="px-6 py-10">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="font-heading font-bold text-2xl md:text-3xl">
            Custom Designer
          </h1>
          <p className="text-muted text-sm mt-2">
            Choose a garment type to start designing your custom piece.
          </p>
        </div>

        {enabledCategories.length === 0 ? (
          <div className="text-center py-16">
            <svg className="w-16 h-16 mx-auto text-muted/20 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round">
              <path d="M20.38 3.46L16 2 12 3.5 8 2 3.62 3.46a2 2 0 00-1.34 1.93l.38 12.32A2 2 0 004.62 19.7L12 22l7.38-2.3a2 2 0 001.96-1.99l.38-12.32a2 2 0 00-1.34-1.93z" />
              <path d="M12 22V3.5" />
            </svg>
            <p className="text-muted text-sm">
              Custom designs are not available right now. Check back soon!
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {enabledCategories.map((type) => {
              const config = GARMENT_CONFIGS[type];
              return (
                <Link
                  key={type}
                  href={`/custom/${type}`}
                  className="group bg-surface border border-border rounded-2xl p-6 hover:border-primary/30 hover:shadow-lg transition-all duration-200"
                >
                  <div className="flex items-center justify-center h-32 mb-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={config.sideConfigs.front.imagePath}
                      alt={config.label}
                      className="h-full w-auto object-contain invert opacity-20 group-hover:opacity-30 transition-opacity duration-200"
                    />
                  </div>
                  <h2 className="font-heading font-bold text-lg text-primary">
                    {config.label}
                  </h2>
                  <p className="text-xs text-muted mt-1">
                    {config.description}
                  </p>
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                    <span className="font-heading font-bold text-primary">
                      ${config.basePrice}.00
                    </span>
                    <span className="text-xs text-muted">
                      {config.sides.length === 1 ? "Front only" : "Front & Back"}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
