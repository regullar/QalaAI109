import { DashboardClient } from "@/components/dashboard/DashboardClient";
import { getCurrentUserEmail, requireAppUser } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import type { Complaint } from "@/types/complaint";

async function loadMyComplaints(userId: string) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("complaints")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    throw new Error(error.message);
  }

  return (data || []) as Complaint[];
}

export default async function DashboardPage() {
  const appUser = await requireAppUser();
  const [email, complaints] = await Promise.all([getCurrentUserEmail(), loadMyComplaints(appUser.id)]);

  return (
    <DashboardClient
      email={email}
      userId={appUser.id}
      role={appUser.role}
      phone={appUser.phone || ""}
      complaints={complaints}
    />
  );
}
