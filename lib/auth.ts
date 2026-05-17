import "server-only";

import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

export type UserRole = "user" | "admin";

export type AppUser = {
  id: string;
  role: UserRole;
  phone: string | null;
  created_at: string;
};

export class AppSetupError extends Error {
  code: "missing_users_table";

  constructor(message: string, code: "missing_users_table" = "missing_users_table") {
    super(message);
    this.name = "AppSetupError";
    this.code = code;
  }
}

function isMissingUsersTableMessage(message: string) {
  const normalized = message.toLowerCase();
  return normalized.includes("public.users") && normalized.includes("schema cache");
}

function toAppSetupError(error: { message: string }) {
  if (isMissingUsersTableMessage(error.message)) {
    return new AppSetupError(
      "Supabase table `public.users` is missing. Run the SQL from `supabase-schema.sql` in your Supabase project, then refresh the app."
    );
  }

  return new Error(error.message);
}

export async function ensureAppUser(userId: string): Promise<AppUser> {
  const supabase = getSupabaseAdminClient();
  const { data: existing, error: findError } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (findError) {
    throw toAppSetupError(findError);
  }

  if (existing) {
    return existing as AppUser;
  }

  const { data: created, error: createError } = await supabase
    .from("users")
    .insert({ id: userId, role: "user" })
    .select("*")
    .single();

  if (createError && isMissingUsersTableMessage(createError.message)) {
    throw toAppSetupError(createError);
  }

  if (!createError && created) {
    return created as AppUser;
  }

  const { data: racedUser, error: racedError } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (racedError || !racedUser) {
    const message = createError?.message || racedError?.message || "Failed to create user profile.";
    throw toAppSetupError({ message });
  }

  return racedUser as AppUser;
}

export async function getSignedInAppUser(): Promise<AppUser | null> {
  const { userId } = await auth();
  if (!userId) return null;
  return ensureAppUser(userId);
}

export async function requireAppUser(): Promise<AppUser> {
  const { userId, redirectToSignIn } = await auth();
  if (!userId) {
    return redirectToSignIn() as never;
  }
  try {
    return await ensureAppUser(userId);
  } catch (error) {
    if (error instanceof AppSetupError) {
      redirect("/setup-required");
    }
    throw error;
  }
}

export async function requireAdminUser(): Promise<AppUser> {
  const user = await requireAppUser();
  if (user.role !== "admin") {
    redirect("/dashboard");
  }
  return user;
}

export async function getCurrentUserEmail() {
  const user = await currentUser();
  return user?.primaryEmailAddress?.emailAddress || user?.emailAddresses[0]?.emailAddress || "";
}
