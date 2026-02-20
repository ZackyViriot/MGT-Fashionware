"use client";

import { useState, useEffect } from "react";
import type { GarmentType } from "@/constants/garment-types";

export interface CategorySetting {
  id: string;
  category: string;
  enabled: boolean;
  updated_at: string;
}

/** Client-side hook: fetches and caches enabled categories */
export function useCategorySettings() {
  const [settings, setSettings] = useState<CategorySetting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/category-settings")
      .then((res) => res.json())
      .then((data) => {
        setSettings(data.settings ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const enabledCategories = settings
    .filter((s) => s.enabled)
    .map((s) => s.category as GarmentType);

  return { settings, enabledCategories, loading };
}
