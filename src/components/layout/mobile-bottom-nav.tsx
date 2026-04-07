"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type MobileNavItem = {
  href: string;
  label: string;
  /** Match only exact path (e.g. home). Otherwise prefix match. */
  match?: "exact" | "prefix";
};

const MAIN_NAV: MobileNavItem[] = [
  { href: "/", label: "Главная", match: "exact" },
  { href: "/glucose", label: "Глюкоза", match: "prefix" },
  { href: "/meals", label: "Еда", match: "prefix" },
  { href: "/food", label: "Продукты", match: "prefix" },
  { href: "/settings", label: "Настройки", match: "prefix" },
];

function isNavActive(pathname: string, item: MobileNavItem): boolean {
  if (item.match === "exact") {
    return pathname === item.href;
  }
  if (pathname === item.href) {
    return true;
  }
  return pathname.startsWith(`${item.href}/`);
}

export function MobileBottomNav({ items = MAIN_NAV }: { items?: MobileNavItem[] }) {
  const rawPath = usePathname();
  /** Normalize so home `exact` match works if hook ever returns empty. */
  const pathname = rawPath && rawPath.length > 0 ? rawPath : "/";

  return (
    <nav
      aria-label="Основные разделы"
      className="pointer-events-auto fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-black/95 pb-[env(safe-area-inset-bottom,0px)] backdrop-blur-md"
    >
      <div className="mx-auto grid max-w-md grid-cols-5 gap-0.5 px-1 pt-2">
        {items.map((item) => {
          const active = isNavActive(pathname, item);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={[
                "flex min-h-[3.25rem] flex-col items-center justify-center rounded-2xl px-1 py-2.5 text-center text-[clamp(0.625rem,2.6vw,0.8125rem)] leading-tight transition-colors duration-150",
                active
                  ? "bg-white font-semibold text-black shadow-sm ring-1 ring-white/25"
                  : "font-medium text-white/45 hover:bg-white/[0.06] hover:text-white/80 active:bg-white/[0.08]",
              ].join(" ")}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
