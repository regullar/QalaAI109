import { LocalizedText } from "@/components/i18n/LocalizedText";
import { Card } from "@/components/ui/card";

export default function MapLoading() {
  return (
    <Card asChild>
      <section className="page-panel">
        <h1 className="text-2xl font-bold text-app-text"><LocalizedText id="loading.map" /></h1>
      </section>
    </Card>
  );
}
