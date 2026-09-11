import { redirect } from "next/navigation";
import { LoginForm } from "@/app/login/LoginForm";
import { Card, Eyebrow } from "@/components/ui";
import { auth } from "@/lib/auth";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/");

  return (
    <main className="flex min-h-dvh items-center px-5 py-10">
      <div className="w-full">
        <div className="mb-7">
          <div className="mb-3 flex items-center gap-3">
            <span className="h-1.5 w-10 rounded-full bg-signal" aria-hidden="true" />
            <Eyebrow tone="heading">Istid</Eyebrow>
          </div>
          <h1 className="text-[32px] font-bold leading-tight tracking-tight text-ink">
            Välkommen tillbaka
          </h1>
          <p className="mt-2 text-base leading-6 text-ink-muted">
            Logga in för att komma till laget.
          </p>
        </div>

        <Card className="p-5">
          <LoginForm />
        </Card>
      </div>
    </main>
  );
}
