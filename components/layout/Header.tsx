"use client";

import Link from "next/link";
import { UserButton, useUser } from "@clerk/nextjs";
import { LogoMark } from "@/components/brand/LogoMark";
import { useI18n } from "@/components/i18n/LanguageProvider";
import { Button } from "@/components/ui/button";
import { LANGUAGE_LABELS, LANGUAGES } from "@/lib/i18n";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { Nav } from "./Nav";

export function Header() {
  const { language, setLanguage, t } = useI18n();
  const { isSignedIn } = useUser();

  return (
    <header className="sticky top-0 z-40 border-b border-app-border bg-white/95 text-app-text backdrop-blur-xl">
      <div className="section-wrap flex h-16 items-center justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <Link href="/" className="group flex min-w-0 items-center gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-brand-100 bg-brand-50 text-brand-600 shadow-sm transition group-hover:text-brand-700">
              <LogoMark className="h-7 w-7" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-[20px] font-semibold leading-none tracking-[-0.02em] text-brand-600">
                Qala AI
              </p>
              <span className="hidden text-[12px] font-medium leading-none tracking-[0.04em] text-app-textSoft sm:inline">
                {t("app.subtitle")}
              </span>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <Nav />
          <div className="hidden rounded-full bg-app-surfaceStrong p-1 sm:inline-flex">
            {LANGUAGES.map((item) => (
              <Button
                variant="unstyled"
                size="unstyled"
                key={item}
                type="button"
                onClick={() => setLanguage(item)}
                className={`rounded-full px-3 py-2 text-[12px] font-semibold leading-none transition active:scale-95 ${
                  language === item ? "bg-white text-app-text" : "text-app-textSoft hover:text-app-text"
                }`}
                aria-pressed={language === item}
              >
                {LANGUAGE_LABELS[item]}
              </Button>
            ))}
          </div>
          <Button asChild variant="unstyled" size="unstyled" className="btn-primary hidden md:inline-flex">
            <Link href="/report">{t("nav.report")}</Link>
          </Button>
          {!isSignedIn ? (
            <Button asChild variant="unstyled" size="unstyled" className="btn-secondary hidden min-h-10 px-4 py-2 md:inline-flex">
              <Link href="/sign-in">Войти</Link>
            </Button>
          ) : null}
          {isSignedIn ? <UserButton /> : null}
        </div>
      </div>

      <div className="border-t border-app-border bg-white md:hidden">
        <div className="section-wrap flex h-14 items-center justify-between">
          <p className="text-[13px] font-medium text-app-textSoft">{t("app.subtitle")}</p>
          <Button asChild variant="unstyled" size="unstyled" className="btn-primary min-h-[40px] px-4 py-2 text-[14px]">
            <Link href="/report">{t("nav.report")}</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
