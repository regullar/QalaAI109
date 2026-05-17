import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <main className="section-wrap section-band flex min-h-[calc(100vh-12rem)] items-center justify-center">
      <SignUp signInUrl="/sign-in" fallbackRedirectUrl="/dashboard" />
    </main>
  );
}
