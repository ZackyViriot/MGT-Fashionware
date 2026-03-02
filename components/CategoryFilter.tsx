"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { STYLE_CATEGORIES } from "@/constants/style-categories";

export default function CategoryFilter({ current }: { current?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleClick(cat: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (current === cat) {
      params.delete("category");
    } else {
      params.set("category", cat);
    }
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide py-1">
      {STYLE_CATEGORIES.map((cat) => {
        const isActive = current === cat;
        return (
          <button
            key={cat}
            onClick={() => handleClick(cat)}
            className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 cursor-pointer ${
              isActive
                ? "bg-dark text-white border-dark"
                : "bg-transparent text-muted border-border hover:border-primary hover:text-primary"
            }`}
          >
            {cat}
          </button>
        );
      })}
    </div>
  );
}
