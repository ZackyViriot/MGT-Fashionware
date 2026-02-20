"use client";

import { useState } from "react";
import { GARMENT_CONFIGS, type GarmentType } from "@/constants/garment-types";
import type { CategorySetting } from "@/hooks/use-category-settings";

interface Props {
  initialSettings: CategorySetting[];
}

export default function CategoryToggles({ initialSettings }: Props) {
  const [settings, setSettings] = useState(initialSettings);
  const [updating, setUpdating] = useState<string | null>(null);

  async function toggle(category: string, currentEnabled: boolean) {
    setUpdating(category);
    const newEnabled = !currentEnabled;

    // Optimistic update
    setSettings((prev) =>
      prev.map((s) =>
        s.category === category ? { ...s, enabled: newEnabled } : s
      )
    );

    try {
      const res = await fetch("/api/category-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, enabled: newEnabled }),
      });

      if (!res.ok) {
        // Revert on failure
        setSettings((prev) =>
          prev.map((s) =>
            s.category === category ? { ...s, enabled: currentEnabled } : s
          )
        );
      }
    } catch {
      // Revert on error
      setSettings((prev) =>
        prev.map((s) =>
          s.category === category ? { ...s, enabled: currentEnabled } : s
        )
      );
    }
    setUpdating(null);
  }

  return (
    <div className="space-y-3">
      {settings.map((setting) => {
        const config = GARMENT_CONFIGS[setting.category as GarmentType];
        if (!config) return null;
        const isUpdating = updating === setting.category;

        return (
          <div
            key={setting.category}
            className="flex items-center justify-between py-3 px-4 rounded-xl border border-border hover:border-muted transition-colors duration-200"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-primary">{config.label}</p>
              <p className="text-xs text-muted mt-0.5">{config.description}</p>
              <p className="text-xs text-muted mt-0.5">
                Base price: ${config.basePrice} &middot;{" "}
                {config.sides.length === 1 ? "Front only" : "Front & Back"}
              </p>
            </div>
            <button
              onClick={() => toggle(setting.category, setting.enabled)}
              disabled={isUpdating}
              className={`relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0 ml-4 cursor-pointer ${
                setting.enabled ? "bg-emerald-500" : "bg-border"
              } ${isUpdating ? "opacity-50" : ""}`}
            >
              <div
                className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                  setting.enabled ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        );
      })}

      {settings.length === 0 && (
        <div className="text-center py-8">
          <p className="text-sm text-muted">
            No category settings found. Run the database migration to create the category_settings table.
          </p>
        </div>
      )}
    </div>
  );
}
