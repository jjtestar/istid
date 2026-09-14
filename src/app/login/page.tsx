import { redirect } from "next/navigation";
import { LoginForm } from "@/app/login/LoginForm";
import { InstallAppButton } from "@/components/PwaProvider";
import { Card, Eyebrow } from "@/components/ui";
import { auth } from "@/lib/auth";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/");

  return (
    <main className="flex flex-1 items-center px-5 py-10">
      <div className="w-full">
        <div className="mb-7">
          <div className="mb-3 flex items-center gap-3">
            <span className="h-1.5 w-10 rounded-full bg-signal" aria-hidden="true" />
            <Eyebrow>Istid</Eyebrow>
          </div>
          <h1 className="page-title">
            Välkommen tillbaka
          </h1>
          <p className="mt-2 body-copy text-ink-muted">
            Logga in för att komma till laget.
          </p>
        </div>

        <Card className="p-5">
          <LoginForm />
        </Card>
        <div className="mt-4 flex justify-center"><InstallAppButton /></div>
      </div>
    </main>
  );
}
