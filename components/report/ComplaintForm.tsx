"use client";

import { useMemo, useRef, useState } from "react";
import { FileUp, Sparkles } from "lucide-react";
import { useI18n } from "@/components/i18n/LanguageProvider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DEMO_LOCATION_PRESETS, DISTRICTS } from "@/lib/constants";
import { formatDistrict } from "@/lib/i18n-options";
import type { AnalyzeComplaintResponse } from "@/types/complaint";
import { AiPreviewCard } from "./AiPreviewCard";
import { ReportLocationPicker } from "./ReportLocationPicker";

type FormState = {
  rawText: string;
  district: string;
  addressText: string;
  latitude: number | null;
  longitude: number | null;
};

function isAnalyzeComplaintResponse(value: unknown): value is AnalyzeComplaintResponse {
  if (!value || typeof value !== "object") return false;
  const data = value as Record<string, unknown>;
  return (
    typeof data.title === "string" &&
    typeof data.category === "string" &&
    typeof data.priority === "string" &&
    typeof data.summary === "string"
  );
}

const initialState: FormState = {
  rawText: "",
  district: DISTRICTS[0],
  addressText: "",
  latitude: null,
  longitude: null
};

export function ComplaintForm() {
  const { language, t } = useI18n();
  const isKazakh = language === "kk";
  const [form, setForm] = useState<FormState>(initialState);
  const [preview, setPreview] = useState<AnalyzeComplaintResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const analyzeRequestRef = useRef(0);
  const descriptionId = "complaint-description";
  const districtId = "complaint-district";
  const demoPointId = "complaint-demo-point";
  const addressId = "complaint-address";

  const canAnalyze = useMemo(() => form.rawText.trim().length > 5, [form.rawText]);
  const canSubmit = useMemo(
    () => form.rawText.trim().length > 5 && !!preview && !isSubmitting,
    [form.rawText, preview, isSubmitting]
  );

  const resetAnalysisState = () => {
    analyzeRequestRef.current += 1;
    setPreview(null);
    setError(null);
    setSuccessMessage(null);
    setIsAnalyzing(false);
  };

  const updateField = (field: keyof FormState, value: string) => {
    resetAnalysisState();
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const applyLocationPreset = (index: string) => {
    const preset = DEMO_LOCATION_PRESETS[Number(index)];
    if (!preset) return;
    resetAnalysisState();
    setForm((prev) => ({
      ...prev,
      district: preset.district,
      addressText: preset.addressText,
      latitude: preset.latitude,
      longitude: preset.longitude
    }));
  };

  const updateLocation = (location: Pick<FormState, "latitude" | "longitude">) => {
    resetAnalysisState();
    setForm((prev) => ({ ...prev, ...location }));
  };

  const onAnalyze = async () => {
    if (!canAnalyze) return;
    const requestId = analyzeRequestRef.current + 1;
    analyzeRequestRef.current = requestId;
    setError(null);
    setIsAnalyzing(true);

    try {
      const response = await fetch("/api/complaints/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: form.rawText,
          district: form.district,
          addressText: form.addressText
        })
      });

      const data = (await response.json()) as unknown;
      if (analyzeRequestRef.current !== requestId) return;

      if (!response.ok || !isAnalyzeComplaintResponse(data)) {
        setPreview(null);
        setError(t("report.analyzeError"));
        return;
      }

      setPreview(data);
    } catch {
      if (analyzeRequestRef.current !== requestId) return;
      setPreview(null);
      setError(t("report.networkAnalyzeError"));
    } finally {
      if (analyzeRequestRef.current === requestId) {
        setIsAnalyzing(false);
      }
    }
  };

  const onSubmit = async () => {
    if (!canSubmit) return;
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawText: form.rawText,
          district: form.district,
          addressText: form.addressText,
          latitude: form.latitude,
          longitude: form.longitude,
          analysis: preview
        })
      });

      const data = (await response.json()) as {
        error?: string;
        message?: string;
      };

      if (!response.ok) {
        setError(data.error || t("report.submitError"));
        return;
      }

      setForm(initialState);
      setPreview(null);
      setSuccessMessage(data.message || "Спасибо! Ваша жалоба принята. Мы уже начали её обработку.");
    } catch {
      setError(t("report.networkSubmitError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const onCancelAnalysis = () => {
    resetAnalysisState();
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
      <Card asChild>
        <section className="soft-card overflow-visible p-6 sm:p-8">
        <div className="grid gap-5">
          <label className="grid gap-2" htmlFor={descriptionId}>
            <span className="label">{t("report.description")}</span>
            <Textarea
              id={descriptionId}
              className="textarea-field"
              placeholder={t("report.placeholder")}
              value={form.rawText}
              rows={6}
              onChange={(event) => updateField("rawText", event.target.value)}
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid min-w-0 gap-2" htmlFor={districtId}>
              <span className="label">{t("common.district")}</span>
              <select
                id={districtId}
                className="field w-full min-w-0"
                value={form.district}
                onChange={(event) => updateField("district", event.target.value)}
              >
                {DISTRICTS.map((district) => (
                  <option key={district} value={district}>
                    {formatDistrict(district, language)}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid min-w-0 gap-2" htmlFor={demoPointId}>
              <span className="label">{t("report.demoPoint")}</span>
              <select
                id={demoPointId}
                className="field w-full min-w-0"
                defaultValue=""
                onChange={(event) => applyLocationPreset(event.target.value)}
              >
                <option value="">{t("report.autoPoint")}</option>
                {DEMO_LOCATION_PRESETS.map((preset, index) => (
                  <option key={preset.addressText} value={index}>
                    {preset.addressText} - {formatDistrict(preset.district, language)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="grid gap-2" htmlFor={addressId}>
            <span className="label">{t("common.address")}</span>
            <Input
              id={addressId}
              className="field w-full min-w-0"
              value={form.addressText}
              onChange={(event) => updateField("addressText", event.target.value)}
              placeholder={isKazakh ? "Нұрсат ш/а, мектеп жанында" : "мкр Нурсат, возле школы"}
            />
          </label>

          <ReportLocationPicker
            district={form.district}
            value={{ latitude: form.latitude, longitude: form.longitude }}
            onChange={updateLocation}
          />

          <div className="flex flex-wrap gap-3 pt-2">
            {!preview ? (
              <Button
                variant="unstyled"
                size="unstyled"
                type="button"
                onClick={onAnalyze}
                disabled={!canAnalyze || isAnalyzing}
                className="btn-primary w-full sm:w-auto"
              >
                <Sparkles size={15} strokeWidth={2} />
                {isAnalyzing ? t("report.analyzing") : t("report.analyze")}
              </Button>
            ) : (
              <>
                <Button
                  variant="unstyled"
                  size="unstyled"
                  type="button"
                  onClick={onSubmit}
                  disabled={!canSubmit}
                  className="btn-primary w-full sm:w-auto"
                >
                  <FileUp size={16} strokeWidth={2} />
                  {isSubmitting ? t("report.submitting") : t("report.submit")}
                </Button>
                <Button
                  variant="unstyled"
                  size="unstyled"
                  type="button"
                  onClick={onCancelAnalysis}
                  disabled={isSubmitting}
                  className="btn-secondary w-full sm:w-auto"
                >
                  {t("report.cancel")}
                </Button>
              </>
            )}
          </div>

          {successMessage ? (
            <div className="rounded-[var(--radius)] border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-800">
              {successMessage}
            </div>
          ) : null}
          {error ? <p className="text-sm text-semantic-down">{error}</p> : null}
          {!preview && !error ? <p className="muted-copy">{t("report.previewHint")}</p> : null}
          {isAnalyzing ? <Card className="soft-card-muted p-4 text-sm text-app-textMuted">{t("report.classifying")}</Card> : null}
        </div>
        </section>
      </Card>

      <div className="space-y-6">
        {preview ? (
          <AiPreviewCard data={preview} />
        ) : (
          <Card asChild>
            <section className="dark-card p-6">
            <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-white">
              {isKazakh ? "AI-талдау" : "AI-анализ"}
            </p>
            <h2 className="mt-4 text-[28px] font-normal tracking-[-0.03em] text-white">
              {isKazakh
                ? "Өтініш операторға жеткенге дейін түсінікті болады"
                : "Заявка становится понятной до передачи оператору"}
            </h2>
            <p className="mt-4 text-[15px] leading-7 text-zinc-300">
              {isKazakh
                ? "Санатты, басымдықты, ауданды, жауапты қызметті, тәуекелдерді және ресми өтініш мәтінін алу үшін талдауды іске қосыңыз."
                : "Запустите анализ, чтобы получить категорию, приоритет, район, ответственную службу, риски и официальный текст обращения."}
            </p>
            </section>
          </Card>
        )}
      </div>
    </div>
  );
}
