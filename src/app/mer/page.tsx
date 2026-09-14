import Link from "next/link";
import { CalendarIcon, ChevronIcon, PaymentIcon, ProfileIcon, ShieldIcon, UsersIcon } from "@/components/icons";
import { PageHeader } from "@/components/PageHeader";
import { InstallAppButton } from "@/components/PwaProvider";
import { Card, Eyebrow } from "@/components/ui";
import { signOut } from "@/lib/auth";
import { getCurrentUser } from "@/lib/current-user";

const cards = [
  { href: "/min-profil", label: "Min profil", icon: ProfileIcon, tone: "text-ink" },
  { href: "/kalender", label: "Kalender", icon: CalendarIcon, tone: "text-ink" },
  { href: "/lag", label: "Laget", icon: UsersIcon, tone: "text-success" },
  { href: "/betalningar", label: "Betalningar", icon: PaymentIcon, tone: "text-signal" },
];

export default async function MorePage() {
  const user = await getCurrentUser();
  const isAdmin = user.role === "ADMIN" || user.isSuperAdmin;

  return (
    <div>
      <PageHeader title="Mer" />
      <main className="space-y-7 px-5 pb-10">
        <div className="grid grid-cols-2 gap-3 md:gap-4">
          {cards.map(({ href, label, icon: Icon, tone }) => (
            <Link key={href} href={href} className="flex min-h-36 flex-col justify-between rounded-2xl border border-divider bg-white/95 p-5 transition-colors hover:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink">
              <Icon className={`h-7 w-7 ${tone}`} />
              <span className="text-lg font-bold text-ink">{label}</span>
            </Link>
          ))}
          {isAdmin ? (
            <Link href="/admin" className="col-span-2 flex min-h-28 items-center justify-between rounded-2xl border-2 border-ink bg-ink p-5 text-white transition-opacity hover:opacity-95">
              <span><span className="block text-xs font-bold uppercase tracking-[0.12em] opacity-70">{user.isSuperAdmin ? "Huvudadmin" : "Admin"}</span><span className="mt-1 block text-xl font-bold">Administration</span></span>
              <ShieldIcon className="h-9 w-9" />
            </Link>
          ) : null}
        </div>

        <section>
          <Eyebrow>Inställningar</Eyebrow>
          <Card className="mt-3 overflow-hidden">
            <div className="flex min-h-14 items-center justify-between gap-3 px-4 py-3">
              <div><p className="font-bold text-ink">Installera Femtekedjan</p><p className="text-xs text-ink-subtle">Lägg appen på hemskärmen</p></div>
              <InstallAppButton />
            </div>
            <Link href="/integritet" className="flex min-h-14 items-center justify-between border-t border-divider px-4 py-3 font-bold text-ink">
              Integritet och mina uppgifter <ChevronIcon className="h-5 w-5 text-ink-subtle" />
            </Link>
            <form action={async () => { "use server"; await signOut({ redirectTo: "/login" }); }} className="border-t border-divider">
              <button type="submit" className="flex min-h-14 w-full items-center px-4 py-3 text-left font-bold text-signal">Logga ut</button>
            </form>
          </Card>
        </section>
      </main>
    </div>
  );
}
