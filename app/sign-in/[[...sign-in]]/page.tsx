import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="section-wrap section-band flex min-h-[calc(100vh-12rem)] items-center justify-center">
      <SignIn signUpUrl="/sign-up" fallbackRedirectUrl="/dashboard" />
    </main>
  );
}
