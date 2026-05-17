import { ComplaintTable } from "@/components/admin/ComplaintTable";
import { LocalizedText } from "@/components/i18n/LocalizedText";
import { LocalizedValue } from "@/components/i18n/LocalizedValue";
import { requireAdminUser } from "@/lib/auth";
import { buildComplaintClusters, getClusterKey } from "@/lib/cluster";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import type { Complaint, StatusLog } from "@/types/complaint";

type AdminComplaint = Complaint & {
  cluster_key: string;
  cluster_count: number;
  similar_public_ids: string[];
};

async function loadAdminData(): Promise<{
  complaints: AdminComplaint[];
  logsByComplaintId: Record<string, StatusLog[]>;
  error: string | null;
}> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return {
      complaints: [],
      logsByComplaintId: {},
      error: "Supabase environment variables are not configured."
    };
  }

  try {
    const supabase = getSupabaseAdminClient();
    const { data: complaintsData, error: complaintsError } = await supabase
      .from("complaints")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);

    if (complaintsError) {
      return { complaints: [], logsByComplaintId: {}, error: complaintsError.message };
    }

    const complaints = (complaintsData || []) as Complaint[];
    const clusterByKey = new Map(buildComplaintClusters(complaints).map((cluster) => [cluster.key, cluster]));

    const adminComplaints: AdminComplaint[] = complaints.map((complaint) => {
      const key = getClusterKey(complaint);
      const clusterInfo = clusterByKey.get(key);
      return {
        ...complaint,
        cluster_key: key,
        cluster_count: clusterInfo?.count || 1,
        similar_public_ids: (clusterInfo?.complaints || [complaint])
          .map((item) => item.public_id)
          .filter((item) => item !== complaint.public_id)
      };
    });

    const complaintIds = complaints.map((item) => item.id);
    if (complaintIds.length === 0) {
      return { complaints: adminComplaints, logsByComplaintId: {}, error: null };
    }

    const { data: logsData, error: logsError } = await supabase
      .from("status_logs")
      .select("*")
      .in("complaint_id", complaintIds)
      .order("created_at", { ascending: true });

    if (logsError) {
      return { complaints: adminComplaints, logsByComplaintId: {}, error: logsError.message };
    }

    const logsByComplaintId: Record<string, StatusLog[]> = {};
    for (const log of (logsData || []) as StatusLog[]) {
      if (!logsByComplaintId[log.complaint_id]) logsByComplaintId[log.complaint_id] = [];
      logsByComplaintId[log.complaint_id].push(log);
    }

    return { complaints: adminComplaints, logsByComplaintId, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error.";
    return { complaints: [], logsByComplaintId: {}, error: message };
  }
}

export default async function AdminPage() {
  await requireAdminUser();
  const { complaints, logsByComplaintId, error } = await loadAdminData();

  return (
    <section className="section-wrap section-band space-y-8">
      <div className="max-w-4xl">
        <div>
          <p className="eyebrow">
            <LocalizedValue ru="Очередь оператора" kk="Оператор кезегі" />
          </p>
          <h1 className="display-title mt-3">
            <LocalizedText id="admin.title" />
          </h1>
          <p className="section-copy mt-5 max-w-3xl">
            <LocalizedText id="admin.copy" />
          </p>
        </div>
      </div>

      {error ? (
        <div className="rounded-[var(--radius)] border border-[#F0C7CC] bg-[#FFF5F6] p-4 text-sm text-semantic-down">
          <LocalizedText id="admin.loadFailed" />: {error}
        </div>
      ) : null}

      <ComplaintTable initialComplaints={complaints} initialLogsByComplaintId={logsByComplaintId} />
    </section>
  );
}
