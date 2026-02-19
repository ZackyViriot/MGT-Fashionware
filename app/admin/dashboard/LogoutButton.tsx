"use client";

import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const supabase = createClient();
  const router = useRouter();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/admin");
  }

  return (
    <button
      onClick={handleLogout}
      className="text-sm text-muted hover:text-primary border border-border px-4 py-2 rounded-lg hover:border-primary transition-colors duration-200 cursor-pointer"
    >
      Sign Out
    </button>
  );
}
