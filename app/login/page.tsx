import { LoginForm } from "@/components/login-form";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <LoginForm />
    </main>
  );
}
