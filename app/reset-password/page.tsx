import { ResetPasswordForm } from "@/components/reset-password-form";

export const dynamic = "force-dynamic";

export default function ResetPasswordPage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <ResetPasswordForm />
    </main>
  );
}
