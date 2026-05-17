import { LocalizedText } from "@/components/i18n/LocalizedText";
import { Card } from "@/components/ui/card";

export default function AdminLoading() {
  return (
    <Card asChild>
      <section className="page-panel">
        <h1 className="text-2xl font-bold text-app-text"><LocalizedText id="loading.admin" /></h1>
      </section>
    </Card>
  );
}
