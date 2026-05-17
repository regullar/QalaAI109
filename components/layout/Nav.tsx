"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/components/i18n/LanguageProvider";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import type { TranslationKey } from "@/lib/i18n";

export const navItems: Array<{ href: string; label: TranslationKey; icon: string }> = [
  { href: "/", label: "nav.home", icon: "home" },
  { href: "/report", label: "nav.report", icon: "edit_square" },
  { href: "/map", label: "nav.map", icon: "map" },
  { href: "/dashboard", label: "nav.dashboard", icon: "account_circle" }
];

export function isNavItemActive(pathname: string, href: string) {
  return href === "/"
    ? pathname === "/"
    : href === "/admin"
      ? pathname === "/admin"
      : pathname === href || pathname.startsWith(`${href}/`);
}

export function Nav() {
  const { t } = useI18n();
  const pathname = usePathname();

  return (
    <nav className="hidden md:block fade-in" aria-label="Primary navigation">
      <ul className="flex max-w-full items-center gap-1 overflow-x-auto rounded-full bg-app-surfaceStrong p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
        {navItems.map((item) => {
          const isActive = isNavItemActive(pathname, item.href);

          return (
            <li key={item.href}>
              <Link
                className={`group interactive-pill inline-flex min-h-[40px] items-center gap-2 rounded-full px-3.5 whitespace-nowrap text-[13px] font-medium leading-none lg:px-4 ${
                  isActive
                    ? "bg-white text-app-text shadow-[0_10px_24px_-18px_rgba(10,11,13,0.4)]"
                    : "text-app-textSoft hover:bg-white/70 hover:text-app-text"
                }`}
                href={item.href}
              >
                <MaterialIcon
                  name={item.icon}
                  className={`text-[16px] transition-transform duration-300 ease-[var(--motion-smooth)] ${
                    isActive ? "" : "group-hover:translate-x-[1px]"
                  }`}
                />
                <span className="transition-transform duration-300 ease-[var(--motion-smooth)] group-hover:translate-x-[1px]">
                  {t(item.label)}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
