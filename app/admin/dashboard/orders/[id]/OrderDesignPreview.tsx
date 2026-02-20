"use client";

import ShirtPreview from "@/components/ShirtPreview";
import type { OrderDesignSide } from "@/types/order";
import { GARMENT_CONFIGS, isValidGarmentType, type GarmentType } from "@/constants/garment-types";

interface Props {
  shirtColor: string;
  front?: OrderDesignSide | null;
  back?: OrderDesignSide | null;
  garmentType?: string;
}

export default function OrderDesignPreview({ shirtColor, front, back, garmentType }: Props) {
  const hasFront = !!(front?.imageUrl || front?.textItems?.length);
  const hasBack = !!(back?.imageUrl || back?.textItems?.length);

  if (!hasFront && !hasBack) return null;

  return (
    <div className="space-y-4">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted">
        {`${GARMENT_CONFIGS[isValidGarmentType(garmentType ?? "") ? garmentType as GarmentType : "shirt"].label} Preview`}
      </p>

      <div className={`grid gap-4 ${hasFront && hasBack ? "grid-cols-2" : "grid-cols-1 max-w-[280px]"}`}>
        {hasFront && front && (
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted mb-1.5 text-center">
              Front
            </p>
            <div className="rounded-xl overflow-hidden border border-border bg-surface">
              <ShirtPreview
                shirtColor={shirtColor}
                side="front"
                garmentType={isValidGarmentType(garmentType ?? "") ? garmentType as GarmentType : "shirt"}
                imageData={front.imageUrl ?? undefined}
                imagePos={front.imagePos ?? undefined}
                textItems={
                  front.textItems?.map((t, i) => ({
                    id: `f-${i}`,
                    text: t.text,
                    textColor: t.textColor,
                    fontSize: t.fontSize,
                    fontFamily: t.fontFamily,
                    pos: t.pos,
                  })) ?? undefined
                }
              />
            </div>
          </div>
        )}

        {hasBack && back && (
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted mb-1.5 text-center">
              Back
            </p>
            <div className="rounded-xl overflow-hidden border border-border bg-surface">
              <ShirtPreview
                shirtColor={shirtColor}
                side="back"
                garmentType={isValidGarmentType(garmentType ?? "") ? garmentType as GarmentType : "shirt"}
                imageData={back.imageUrl ?? undefined}
                imagePos={back.imagePos ?? undefined}
                textItems={
                  back.textItems?.map((t, i) => ({
                    id: `b-${i}`,
                    text: t.text,
                    textColor: t.textColor,
                    fontSize: t.fontSize,
                    fontFamily: t.fontFamily,
                    pos: t.pos,
                  })) ?? undefined
                }
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
