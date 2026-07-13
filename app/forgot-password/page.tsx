import { ForgotPasswordForm } from "@/components/forgot-password-form";

export const dynamic = "force-dynamic";

export default function ForgotPasswordPage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <ForgotPasswordForm />
    </main>
  );
}
