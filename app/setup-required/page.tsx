import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SetupRequiredPage() {
  return (
    <section className="section-wrap section-band">
      <Card className="soft-card mx-auto max-w-3xl p-8">
        <p className="eyebrow">Setup required</p>
        <h1 className="mt-3 text-3xl font-bold text-app-text">Missing Supabase table: `public.users`</h1>
        <p className="mt-4 text-sm leading-7 text-app-textMuted">
          The Clerk + RBAC layer is enabled, but the `users` table has not been created in Supabase yet.
          Apply the SQL from `supabase-schema.sql`, then refresh this page.
        </p>
        <div className="mt-6 rounded-[var(--radius)] border border-app-border bg-app-surfaceMuted p-4 text-sm text-app-text">
          Recommended next step: open your Supabase SQL editor and run the contents of `supabase-schema.sql`.
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild variant="unstyled" size="unstyled" className="btn-primary min-h-10 px-4 py-2">
            <Link href="/dashboard">Try again</Link>
          </Button>
          <Button asChild variant="unstyled" size="unstyled" className="btn-secondary min-h-10 px-4 py-2">
            <Link href="/">Back to home</Link>
          </Button>
        </div>
      </Card>
    </section>
  );
}
