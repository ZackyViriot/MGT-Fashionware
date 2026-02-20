import { getAllCategorySettings } from "@/hooks/category-settings-server";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import CategoryToggles from "./CategoryToggles";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin");

  const settings = await getAllCategorySettings();

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-heading font-bold mb-1">Settings</h1>
      <p className="text-muted text-sm mb-8">
        Manage store categories and feature visibility.
      </p>

      <div className="bg-card border border-border rounded-2xl p-6">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted mb-4">
          Custom Design Categories
        </h2>
        <p className="text-xs text-muted mb-6">
          Toggle categories on or off to control which garment types customers can customize in the store.
        </p>
        <CategoryToggles initialSettings={settings} />
      </div>
    </div>
  );
}
