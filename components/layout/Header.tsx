"use client";

import { useI18n } from "@/components/i18n/LanguageProvider";
import { Button } from "@/components/ui/button";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { LANGUAGE_LABELS, LANGUAGES } from "@/lib/i18n";
import { Nav } from "./Nav";

export function Header() {
  const { language, setLanguage, t } = useI18n();

  return (
    <header className="sticky top-0 z-40 border-b border-app-border bg-white/95 text-app-text backdrop-blur-xl">
      <div className="section-wrap flex h-16 items-center justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 text-white">
            <MaterialIcon name="apartment" className="text-[18px]" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-[20px] font-semibold leading-none tracking-[-0.02em] text-brand-600">
              Qala AI
            </p>
            <span className="hidden text-[12px] font-medium leading-none tracking-[0.04em] text-app-textSoft sm:inline">
              {t("app.subtitle")}
            </span>
          </div>
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
            <a href="/report">{t("nav.report")}</a>
          </Button>
        </div>
      </div>

      <div className="border-t border-app-border bg-white md:hidden">
        <div className="section-wrap flex h-14 items-center justify-between">
          <p className="text-[13px] font-medium text-app-textSoft">{t("app.subtitle")}</p>
          <Button asChild variant="unstyled" size="unstyled" className="btn-primary min-h-[40px] px-4 py-2 text-[14px]">
            <a href="/report">{t("nav.report")}</a>
          </Button>
        </div>
      </div>
    </header>
  );
}
