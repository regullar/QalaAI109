"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { STATUSES } from "@/lib/constants";
import { PRIORITY_TRANSLATION_KEYS, STATUS_TRANSLATION_KEYS } from "@/lib/i18n";
import { formatCategory, formatDistrict } from "@/lib/i18n-options";
import { formatDateTime } from "@/lib/locale";
import type { Complaint, ComplaintStatus } from "@/types/complaint";
import { useI18n } from "@/components/i18n/LanguageProvider";

type SortOrder = "newest" | "oldest";
type UserRole = "user" | "admin";

type DashboardClientProps = {
  email: string;
  userId: string;
  role: UserRole;
  phone: string;
  complaints: Complaint[];
};

export function DashboardClient({ email, userId, role, phone, complaints }: DashboardClientProps) {
  const { language, t } = useI18n();
  const [phoneValue, setPhoneValue] = useState(phone);
  const [statusFilter, setStatusFilter] = useState<ComplaintStatus | "all">("all");
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const [isSaving, setIsSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  const visibleComplaints = useMemo(() => {
    return complaints
      .filter((item) => statusFilter === "all" || item.status === statusFilter)
      .sort((a, b) => {
        const left = new Date(a.created_at).getTime();
        const right = new Date(b.created_at).getTime();
        return sortOrder === "newest" ? right - left : left - right;
      });
  }, [complaints, sortOrder, statusFilter]);

  const savePhone = async () => {
    setIsSaving(true);
    setProfileMessage(null);
    setProfileError(null);

    try {
      const response = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phoneValue })
      });
      const payload = (await response.json()) as { error?: string; phone?: string | null };

      if (!response.ok) {
        setProfileError(payload.error || "Не удалось сохранить телефон.");
        return;
      }

      setPhoneValue(payload.phone || "");
      setProfileMessage("Телефон сохранен.");
    } catch {
      setProfileError("Не удалось сохранить телефон.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="section-wrap section-band space-y-8">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Личный кабинет</p>
          <h1 className="display-title mt-3">Мои обращения</h1>
        </div>
        {role === "admin" ? (
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="unstyled" size="unstyled" className="btn-secondary min-h-10 px-4 py-2">
              <Link href="/admin">Админ панель</Link>
            </Button>
            <Button asChild variant="unstyled" size="unstyled" className="btn-secondary min-h-10 px-4 py-2">
              <Link href="/admin/analytics">Аналитика</Link>
            </Button>
          </div>
        ) : null}
      </section>

      <section className="grid gap-5 lg:grid-cols-[minmax(280px,0.8fr)_1.2fr]">
        <Card className="soft-card p-6">
          <h2 className="text-lg font-bold text-app-text">Профиль</h2>
          <div className="mt-5 space-y-4">
            <Info label="Email">{email || "-"}</Info>
            <Info label="User ID">{userId}</Info>
            <Info label="Роль">{role === "admin" ? "Admin" : "User"}</Info>
            <label className="grid gap-2" htmlFor="dashboard-phone">
              <span className="label">Телефон</span>
              <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                <Input
                  id="dashboard-phone"
                  className="field"
                  value={phoneValue}
                  onChange={(event) => setPhoneValue(event.target.value)}
                  placeholder="+7"
                />
                <Button
                  variant="unstyled"
                  size="unstyled"
                  type="button"
                  className="btn-primary min-h-12 px-4"
                  onClick={savePhone}
                  disabled={isSaving}
                >
                  <Save size={16} strokeWidth={2} />
                  {isSaving ? "Сохранение" : "Сохранить"}
                </Button>
              </div>
            </label>
          </div>
          {profileMessage ? <p className="mt-4 text-sm font-semibold text-green-700">{profileMessage}</p> : null}
          {profileError ? <p className="mt-4 text-sm font-semibold text-semantic-down">{profileError}</p> : null}
        </Card>

        <Card className="soft-card p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-app-text">Мои жалобы</h2>
              <p className="mt-1 text-sm text-app-textMuted">{visibleComplaints.length} из {complaints.length}</p>
            </div>
            <Button asChild variant="unstyled" size="unstyled" className="btn-primary min-h-10 px-4 py-2">
              <Link href="/report">Создать жалобу</Link>
            </Button>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1" htmlFor="dashboard-status">
              <span className="eyebrow">{t("common.status")}</span>
              <select
                id="dashboard-status"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as ComplaintStatus | "all")}
                className="field"
              >
                <option value="all">{t("common.all")}</option>
                {STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {t(STATUS_TRANSLATION_KEYS[status])}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1" htmlFor="dashboard-sort">
              <span className="eyebrow">Дата</span>
              <select
                id="dashboard-sort"
                value={sortOrder}
                onChange={(event) => setSortOrder(event.target.value as SortOrder)}
                className="field"
              >
                <option value="newest">Сначала новые</option>
                <option value="oldest">Сначала старые</option>
              </select>
            </label>
          </div>

          <div className="mt-5 space-y-3">
            {visibleComplaints.length === 0 ? (
              <div className="rounded-[var(--radius)] border border-app-border bg-app-surfaceMuted p-4 text-sm text-app-textMuted">
                Жалоб по выбранным условиям пока нет.
              </div>
            ) : (
              visibleComplaints.map((complaint) => (
                <article key={complaint.id} className="rounded-[var(--radius)] border border-app-border bg-white p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-base font-bold text-app-text">{complaint.title}</h3>
                      <p className="mt-2 line-clamp-3 text-sm leading-6 text-app-textMuted">
                        {complaint.description || complaint.summary || complaint.raw_text}
                      </p>
                    </div>
                    <span className="rounded-full bg-app-surfaceStrong px-3 py-1 text-xs font-semibold text-app-textMuted">
                      {t(STATUS_TRANSLATION_KEYS[complaint.status])}
                    </span>
                  </div>
                  <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-3">
                    <Info label={t("common.category")}>{formatCategory(complaint.category, language)}</Info>
                    <Info label={t("common.priority")}>{t(PRIORITY_TRANSLATION_KEYS[complaint.priority])}</Info>
                    <Info label={t("common.district")}>{formatDistrict(complaint.district, language)}</Info>
                    <Info label={t("common.address")}>
                      {complaint.location_text || complaint.address_text || "-"}
                    </Info>
                    <Info label="Создано">{formatDateTime(complaint.created_at, language)}</Info>
                  </div>
                </article>
              ))
            )}
          </div>
        </Card>
      </section>
    </div>
  );
}

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="eyebrow">{label}</p>
      <p className="break-words text-sm font-semibold text-app-text">{children}</p>
    </div>
  );
}
