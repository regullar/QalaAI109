"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/components/i18n/LanguageProvider";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import type { TranslationKey } from "@/lib/i18n";

const navItems: Array<{ href: string; label: TranslationKey; icon: string }> = [
  { href: "/", label: "nav.home", icon: "home" },
  { href: "/report", label: "nav.report", icon: "edit_square" },
  { href: "/map", label: "nav.map", icon: "map" },
  { href: "/dashboard", label: "nav.dashboard", icon: "account_circle" }
];

export function Nav() {
  const { t } = useI18n();
  const pathname = usePathname();

  return (
    <nav className="hidden md:block" aria-label="Primary navigation">
      <ul className="flex max-w-full items-center gap-1 overflow-x-auto rounded-full bg-app-surfaceStrong p-1">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : item.href === "/admin"
                ? pathname === "/admin"
                : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <li key={item.href}>
              <Link
                className={`inline-flex min-h-[40px] items-center gap-2 rounded-full px-4 whitespace-nowrap text-[13px] font-medium leading-none transition ${
                  isActive ? "bg-white text-app-text" : "text-app-textSoft hover:text-app-text"
                }`}
                href={item.href}
              >
                <MaterialIcon name={item.icon} className="text-[16px]" />
                {t(item.label)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
