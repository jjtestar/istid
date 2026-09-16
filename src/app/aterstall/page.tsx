import { redirect } from "next/navigation";
import { ResetForm } from "@/app/aterstall/ResetForm";
import { Card, Eyebrow } from "@/components/ui";
import { findActiveSessionUser } from "@/lib/current-user";

export default async function ResetPasswordPage() {
  const user = await findActiveSessionUser();
  if (user) redirect("/min-profil");

  return (
    <main className="flex flex-1 items-center px-5 py-10">
      <div className="w-full">
        <div className="mb-7">
          <div className="mb-3 flex items-center gap-3">
            <span className="h-1.5 w-10 rounded-full bg-signal" aria-hidden="true" />
            <Eyebrow>Femtekedjan</Eyebrow>
          </div>
          <h1 className="page-title">Nytt lösenord</h1>
          <p className="mt-2 body-copy text-ink-muted">
            Be lagets administratör om en återställningskod. Den gäller i ett dygn och kan användas
            en gång.
          </p>
        </div>

        <Card className="p-5">
          <ResetForm />
        </Card>
      </div>
    </main>
  );
}
