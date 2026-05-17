import { ComplaintPublicDetails } from "@/components/complaint/ComplaintPublicDetails";
import { LocalizedText } from "@/components/i18n/LocalizedText";
import { Card } from "@/components/ui/card";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import type { Complaint, StatusLog } from "@/types/complaint";

type ComplaintPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ComplaintDetailsPage({ params }: ComplaintPageProps) {
  const { id } = await params;
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);

  try {
    const supabase = getSupabaseAdminClient();
    const complaintQuery = isUuid
      ? supabase.from("complaints").select("*").eq("id", id).maybeSingle()
      : supabase.from("complaints").select("*").eq("public_id", id).maybeSingle();

    const { data: complaint, error } = await complaintQuery;

    if (error) {
      return (
        <Card asChild>
          <section className="mx-auto max-w-5xl rounded-[var(--radius)] border border-red-200 bg-red-50 p-8">
            <h1 className="text-2xl font-bold text-red-900"><LocalizedText id="complaint.loadFailed" /></h1>
            <p className="mt-2 text-sm text-red-800">{error.message}</p>
          </section>
        </Card>
      );
    }

    if (!complaint) {
      return (
        <Card asChild>
          <section className="page-panel">
            <h1 className="text-2xl font-bold text-app-text"><LocalizedText id="complaint.notFound" /></h1>
            <p className="mt-3 text-app-textMuted"><LocalizedText id="complaint.notFoundCopy" /></p>
          </section>
        </Card>
      );
    }

    const typedComplaint = complaint as Complaint;
    const { data: statusLogs } = await supabase
      .from("status_logs")
      .select("*")
      .eq("complaint_id", typedComplaint.id)
      .order("created_at", { ascending: true });

    return <ComplaintPublicDetails complaint={typedComplaint} logs={(statusLogs || []) as StatusLog[]} />;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error.";

    return (
      <Card asChild>
        <section className="mx-auto max-w-5xl rounded-[var(--radius)] border border-red-200 bg-red-50 p-8">
          <h1 className="text-2xl font-bold text-red-900"><LocalizedText id="complaint.configIssue" /></h1>
          <p className="mt-2 text-sm text-red-800">{message}</p>
        </section>
      </Card>
    );
  }
}
