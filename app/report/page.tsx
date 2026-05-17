import { LocalizedText } from "@/components/i18n/LocalizedText";
import { LocalizedValue } from "@/components/i18n/LocalizedValue";
import { ComplaintForm } from "@/components/report/ComplaintForm";

export default function ReportPage() {
  return (
    <div className="section-wrap section-band space-y-8">
      <section className="max-w-4xl">
        <div>
          <p className="eyebrow">
            <LocalizedValue ru="Обращение жителя" kk="Тұрғын өтініші" />
          </p>
          <h1 className="display-title mt-3">
            <LocalizedText id="report.title" />
          </h1>
          <p className="section-copy mt-5 max-w-3xl">
            <LocalizedText id="report.copy" />
          </p>
        </div>
      </section>
      <ComplaintForm />
    </div>
  );
}
