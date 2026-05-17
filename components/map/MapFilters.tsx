"use client";

import { useI18n } from "@/components/i18n/LanguageProvider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PRIORITY_TRANSLATION_KEYS, STATUS_TRANSLATION_KEYS } from "@/lib/i18n";
import { formatCategory, formatDistrict } from "@/lib/i18n-options";

type MapFiltersValue = {
  district: string;
  category: string;
  status: string;
  priority: string;
  clusterMode: boolean;
};

type MapFiltersProps = {
  values: MapFiltersValue;
  districts: string[];
  categories: string[];
  statuses: string[];
  priorities: string[];
  onChange: (next: MapFiltersValue) => void;
};

function SelectField({
  id,
  label,
  allLabel,
  value,
  options,
  kind = "plain",
  optionLabel,
  onChange
}: {
  id: string;
  label: string;
  allLabel: string;
  value: string;
  options: string[];
  kind?: "status" | "priority" | "district" | "category" | "plain";
  optionLabel: (kind: "status" | "priority" | "district" | "category" | "plain", value: string) => string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid min-w-0 gap-2" htmlFor={id}>
      <span className="eyebrow">{label}</span>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="field w-full min-w-0"
      >
        <option value="all">{allLabel}</option>
        {options.map((item) => (
          <option key={item} value={item}>
            {optionLabel(kind, item)}
          </option>
        ))}
      </select>
    </label>
  );
}

export function MapFilters({
  values,
  districts,
  categories,
  statuses,
  priorities,
  onChange
}: MapFiltersProps) {
  const { language, t } = useI18n();
  const labelForOption = (kind: "status" | "priority" | "district" | "category" | "plain", value: string) => {
    if (kind === "status" && value in STATUS_TRANSLATION_KEYS) {
      return t(STATUS_TRANSLATION_KEYS[value as keyof typeof STATUS_TRANSLATION_KEYS]);
    }
    if (kind === "priority" && value in PRIORITY_TRANSLATION_KEYS) {
      return t(PRIORITY_TRANSLATION_KEYS[value as keyof typeof PRIORITY_TRANSLATION_KEYS]);
    }
    if (kind === "district") return formatDistrict(value, language);
    if (kind === "category") return formatCategory(value, language);
    return value;
  };

  return (
    <Card asChild>
      <section className="soft-card p-4 sm:p-5">
      <div className="grid gap-x-4 gap-y-5 sm:grid-cols-2 2xl:grid-cols-[repeat(4,minmax(0,1fr))_minmax(220px,0.95fr)] 2xl:items-end">
        <SelectField
          id="map-filter-district"
          label={t("common.district")}
          allLabel={t("common.all")}
          value={values.district}
          options={districts}
          kind="district"
          optionLabel={labelForOption}
          onChange={(district) => onChange({ ...values, district })}
        />
        <SelectField
          id="map-filter-category"
          label={t("common.category")}
          allLabel={t("common.all")}
          value={values.category}
          options={categories}
          kind="category"
          optionLabel={labelForOption}
          onChange={(category) => onChange({ ...values, category })}
        />
        <SelectField
          id="map-filter-status"
          label={t("common.status")}
          allLabel={t("common.all")}
          value={values.status}
          options={statuses}
          kind="status"
          optionLabel={labelForOption}
          onChange={(status) => onChange({ ...values, status })}
        />
        <SelectField
          id="map-filter-priority"
          label={t("common.priority")}
          allLabel={t("common.all")}
          value={values.priority}
          options={priorities}
          kind="priority"
          optionLabel={labelForOption}
          onChange={(priority) => onChange({ ...values, priority })}
        />

        <div className="flex items-end sm:col-span-2 2xl:col-span-1">
          <Button
            variant="unstyled"
            size="unstyled"
            type="button"
            onClick={() => onChange({ ...values, clusterMode: !values.clusterMode })}
            className={`min-h-11 w-full rounded-full border px-4 py-2 text-sm font-semibold transition active:scale-95 ${
              values.clusterMode
                ? "border-brand-600 bg-brand-600 text-white"
                : "border-app-surfaceStrong bg-app-surfaceStrong text-app-text"
            }`}
          >
            {values.clusterMode ? t("map.clustersOn") : t("map.clustersOff")}
          </Button>
        </div>
      </div>
      </section>
    </Card>
  );
}
