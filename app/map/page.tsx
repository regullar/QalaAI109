import { LocalizedText } from "@/components/i18n/LocalizedText";
import { LocalizedValue } from "@/components/i18n/LocalizedValue";
import { TwoGisComplaintMap } from "@/components/map/TwoGisComplaintMap";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import type { Complaint } from "@/types/complaint";

async function fetchComplaints(): Promise<{ complaints: Complaint[]; error: string | null }> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { complaints: [], error: "Supabase environment is not configured." };
  }

  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase.from("complaints").select("*").order("created_at", { ascending: false }).limit(500);

    if (error) {
      return { complaints: [], error: error.message };
    }

    return { complaints: (data || []) as Complaint[], error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown database error.";
    return { complaints: [], error: message };
  }
}

export default async function MapPage() {
  const { complaints, error } = await fetchComplaints();

  return (
    <section className="section-wrap section-band space-y-8">
      <div className="max-w-4xl">
        <div>
          <p className="eyebrow">
            <LocalizedValue ru="Живая карта" kk="Тікелей карта" />
          </p>
          <h1 className="display-title mt-3">
            <LocalizedText id="map.title" />
          </h1>
          <p className="section-copy mt-5 max-w-3xl">
            <LocalizedText id="map.copy" />
          </p>
        </div>
      </div>

      <TwoGisComplaintMap complaints={complaints} loadError={error} />
    </section>
  );
}
