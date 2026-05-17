"use client";

import Link from "next/link";
import { LogoMark } from "@/components/brand/LogoMark";
import { useI18n } from "@/components/i18n/LanguageProvider";

export function Footer() {
  const { language, t } = useI18n();

  return (
    <footer className="border-t border-app-border bg-white text-app-textMuted">
      <div className="section-wrap py-10 sm:py-12">
        <div className="grid gap-8 md:grid-cols-[1.2fr_repeat(2,1fr)]">
          <div>
            <Link href="/" className="inline-flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-app-border bg-app-surfaceMuted text-app-text">
                <LogoMark className="h-6 w-6" />
              </span>
              <span className="text-[20px] font-semibold tracking-[-0.02em] text-brand-600">Qala AI</span>
            </Link>
            <p className="mt-3 max-w-sm text-[14px] leading-6 text-app-textMuted">{t("app.subtitle")}</p>
          </div>
          <div>
            <p className="text-[14px] font-semibold text-app-text">{language === "kk" ? "Платформа" : "Платформа"}</p>
            <div className="mt-3 space-y-2.5 text-[14px] text-app-textMuted">
              <a href="/report">{t("nav.report")}</a>
              <a href="/map">{t("nav.map")}</a>
            </div>
          </div>
          <div>
            <p className="text-[14px] font-semibold text-app-text">{language === "kk" ? "Операциялар" : "Операции"}</p>
            <div className="mt-3 space-y-2.5 text-[14px] text-app-textMuted">
              <a href="/admin">{t("nav.admin")}</a>
              <a href="/admin/analytics">{t("nav.analytics")}</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
