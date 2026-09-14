import { redirect } from "next/navigation";
import { RegistrationForm } from "@/app/registrera/RegistrationForm";
import { Card, Eyebrow } from "@/components/ui";
import { auth } from "@/lib/auth";

export default async function RegistrationPage() {
  const session = await auth();
  if (session?.user) redirect("/");

  return (
    <main className="flex flex-1 items-center px-5 py-10">
      <div className="w-full">
        <div className="mb-7">
          <div className="mb-3 flex items-center gap-3">
            <span className="h-1.5 w-10 rounded-full bg-signal" aria-hidden="true" />
            <Eyebrow>Femtekedjan</Eyebrow>
          </div>
          <h1 className="page-title">Skapa ditt konto</h1>
          <p className="mt-2 body-copy text-ink-muted">
            Du behöver den personliga PIN-kod du fått av lagets administratör.
          </p>
        </div>
        <Card className="p-5"><RegistrationForm /></Card>
      </div>
    </main>
  );
}
