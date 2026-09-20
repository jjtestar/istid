import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/app/login/LoginForm";
import { InstallAppButton } from "@/components/PwaProvider";
import { Card, Eyebrow } from "@/components/ui";
import { auth, signOut } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function LoginPage() {
  const session = await auth();
  // The proxy only checks that a session token exists, so a cookie can outlive
  // the access it was issued for. Bouncing such a session to "/" would send it
  // straight back here, so the account is verified before redirecting, and the
  // stale session is offered a way out.
  const account = session?.user?.email
    ? await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { isActive: true, accessApproved: true },
      })
    : null;
  const accessRevoked = Boolean(session?.user) && !(account?.isActive && account.accessApproved);
  if (session?.user && !accessRevoked) redirect("/");

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

        {accessRevoked ? (
          <Card className="mb-4 border-2 border-signal p-4">
            <p className="text-sm font-bold text-ink">Ditt konto är inte aktivt längre.</p>
            <p className="mt-1 text-sm text-ink-muted">
              Kontakta en administratör om det inte stämmer.
            </p>
            <form action={async () => { "use server"; await signOut({ redirectTo: "/login" }); }}>
              <button type="submit" className="mt-3 min-h-11 font-bold text-signal underline underline-offset-4">
                Logga ut
              </button>
            </form>
          </Card>
        ) : null}

        <Card className="p-5">
          <LoginForm />
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
