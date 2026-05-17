"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { UserButton, useUser } from "@clerk/nextjs";
import { LogoMark } from "@/components/brand/LogoMark";
import { useI18n } from "@/components/i18n/LanguageProvider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { LANGUAGE_LABELS, LANGUAGES } from "@/lib/i18n";
import { isNavItemActive, Nav, navItems } from "./Nav";

export function Header() {
  const pathname = usePathname();
  const { language, setLanguage, t } = useI18n();
  const { isSignedIn } = useUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-app-border bg-white/95 text-app-text backdrop-blur-xl">
      <div className="section-wrap flex min-h-16 items-center justify-between gap-3 py-3 sm:py-2">
        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          <Link href="/" className="group flex min-w-0 items-center gap-3 sm:gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-brand-100 bg-brand-50 text-brand-600 shadow-sm transition group-hover:text-brand-700">
              <LogoMark className="h-7 w-7" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-[18px] font-semibold leading-none tracking-[-0.02em] text-brand-600 sm:text-[20px]">
                Qala AI
              </p>
              <span className="hidden text-[12px] font-medium leading-none tracking-[0.04em] text-app-textSoft sm:inline">
                {t("app.subtitle")}
              </span>
            </div>
          </Link>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
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

          <Button asChild variant="unstyled" size="unstyled" className="btn-primary hidden min-[460px]:inline-flex md:inline-flex">
            <Link href="/report">{t("nav.report")}</Link>
          </Button>

          {!isSignedIn ? (
            <Button asChild variant="unstyled" size="unstyled" className="btn-secondary hidden min-h-10 px-4 py-2 md:inline-flex">
              <Link href="/sign-in">Р’РѕР№С‚Рё</Link>
            </Button>
          ) : null}

          <Dialog open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <DialogTrigger asChild>
              <Button
                variant="unstyled"
                size="unstyled"
                type="button"
                className="inline-flex min-h-[42px] min-w-[42px] items-center justify-center rounded-full border border-app-border bg-app-surfaceStrong text-app-text md:hidden"
                aria-label="Open navigation menu"
              >
                <MaterialIcon name="menu" className="text-[20px]" />
              </Button>
            </DialogTrigger>
            <DialogContent className="top-auto bottom-0 left-0 right-0 grid max-w-none translate-x-0 translate-y-0 gap-0 rounded-t-[28px] rounded-b-none p-0 sm:max-w-none">
              <DialogHeader className="border-b border-app-border px-5 pb-4 pt-5 text-left">
                <DialogTitle className="text-base font-semibold text-app-text">Qala AI</DialogTitle>
                <DialogDescription className="mt-1 text-sm leading-6 text-app-textMuted">
                  {t("app.subtitle")}
                </DialogDescription>
              </DialogHeader>

              <div className="px-4 py-4">
                <nav aria-label="Mobile navigation">
                  <ul className="space-y-2">
                    {navItems.map((item) => {
                      const isActive = isNavItemActive(pathname, item.href);

                      return (
                        <li key={item.href}>
                          <DialogClose asChild>
                            <Link
                              href={item.href}
                              className={`flex min-h-[52px] items-center justify-between rounded-[18px] px-4 py-3 text-sm font-semibold transition ${
                                isActive ? "bg-app-dark text-white" : "bg-app-surfaceMuted text-app-text"
                              }`}
                            >
                              <span className="inline-flex items-center gap-3">
                                <MaterialIcon name={item.icon} className="text-[18px]" />
                                {t(item.label)}
                              </span>
                              <MaterialIcon name="chevron_right" className="text-[18px]" />
                            </Link>
                          </DialogClose>
                        </li>
                      );
                    })}
                  </ul>
                </nav>

                <div className="mt-5">
                  <p className="px-1 text-[12px] font-semibold uppercase tracking-[0.08em] text-app-textMuted">
                    Язык
                  </p>
                  <div className="mt-2 grid grid-cols-2 gap-2 rounded-[20px] bg-app-surfaceMuted p-2">
                    {LANGUAGES.map((item) => (
                      <Button
                        variant="unstyled"
                        size="unstyled"
                        key={item}
                        type="button"
                        onClick={() => setLanguage(item)}
                        className={`min-h-[44px] rounded-[16px] px-4 py-2 text-sm font-semibold transition ${
                          language === item ? "bg-white text-app-text shadow-sm" : "text-app-textSoft"
                        }`}
                        aria-pressed={language === item}
                      >
                        {LANGUAGE_LABELS[item]}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="mt-5 flex flex-col gap-2">
                  <DialogClose asChild>
                    <Button asChild variant="unstyled" size="unstyled" className="btn-primary w-full">
                      <Link href="/report">{t("nav.report")}</Link>
                    </Button>
                  </DialogClose>
                  {!isSignedIn ? (
                    <DialogClose asChild>
                      <Button asChild variant="unstyled" size="unstyled" className="btn-secondary w-full">
                        <Link href="/sign-in">Р’РѕР№С‚Рё</Link>
                      </Button>
                    </DialogClose>
                  ) : null}
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {isSignedIn ? <UserButton /> : null}
        </div>
      </div>
    </header>
  );
}
