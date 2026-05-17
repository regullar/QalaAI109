"use client";

import { useI18n } from "@/components/i18n/LanguageProvider";

export function Footer() {
  const { language, t } = useI18n();

  return (
    <footer className="border-t border-app-border bg-white text-app-textMuted">
      <div className="section-wrap py-12">
        <div className="grid gap-10 md:grid-cols-[1.2fr_repeat(2,1fr)]">
          <div>
            <p className="text-[20px] font-semibold tracking-[-0.02em] text-brand-600">Qala AI</p>
            <p className="mt-3 max-w-sm text-[14px] leading-6 text-app-textMuted">{t("app.subtitle")}</p>
          </div>
          <div>
            <p className="text-[14px] font-semibold text-app-text">{language === "kk" ? "Платформа" : "Платформа"}</p>
            <div className="mt-4 space-y-3 text-[14px] text-app-textMuted">
              <a href="/report">{t("nav.report")}</a>
              <a href="/map">{t("nav.map")}</a>
            </div>
          </div>
          <div>
            <p className="text-[14px] font-semibold text-app-text">{language === "kk" ? "Операциялар" : "Операции"}</p>
            <div className="mt-4 space-y-3 text-[14px] text-app-textMuted">
              <a href="/admin">{t("nav.admin")}</a>
              <a href="/admin/analytics">{t("nav.analytics")}</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
