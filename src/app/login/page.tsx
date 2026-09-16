import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/app/login/LoginForm";
import { InstallAppButton } from "@/components/PwaProvider";
import { Card, Eyebrow } from "@/components/ui";
import { findActiveSessionUser } from "@/lib/current-user";
import { safeCallbackUrl } from "@/lib/safe-redirect";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ orsak?: string | string[]; callbackUrl?: string | string[] }>;
}) {
  // Deliberately not "is there a session" but "is there a usable account":
  // a blocked user still holds a valid token, and bouncing them to "/" would
  // just bounce them straight back here.
  const user = await findActiveSessionUser();
  if (user) redirect("/");

  const params = await searchParams;
  const blocked = params.orsak === "sparrad";
  const callbackUrl = safeCallbackUrl(
    typeof params.callbackUrl === "string" ? params.callbackUrl : null,
  );

  return (
    <main className="flex flex-1 items-center px-5 py-10">
      <div className="w-full">
        <div className="mb-7">
          <div className="mb-3 flex items-center gap-3">
            <span className="h-1.5 w-10 rounded-full bg-signal" aria-hidden="true" />
            <Eyebrow>Femtekedjan</Eyebrow>
          </div>
          <h1 className="page-title">
            Välkommen tillbaka
          </h1>
          <p className="mt-2 body-copy text-ink-muted">
            Logga in för att komma till laget.
          </p>
        </div>

        {blocked ? (
          <p
            role="status"
            className="mb-4 rounded-xl bg-rink-line-red px-3 py-2.5 text-sm font-semibold text-signal"
          >
            Ditt konto är spärrat eller borttaget. Kontakta lagets administratör.
          </p>
        ) : null}

        <Card className="p-5">
          <LoginForm callbackUrl={callbackUrl} />
        </Card>
        <p className="mt-5 text-center text-sm text-ink-muted">
          Har du fått en PIN-kod?{" "}
          <Link href="/registrera" className="font-bold text-ink underline underline-offset-4">
            Skapa konto
          </Link>
        </p>
        <div className="mt-4 flex justify-center"><InstallAppButton /></div>
      </div>
    </main>
  );
}
