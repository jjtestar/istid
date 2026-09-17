import Link from "next/link";
import { CalendarIcon, ChevronIcon, PaymentIcon, ProfileIcon, UsersIcon } from "@/components/icons";
import { PageHeader } from "@/components/PageHeader";
import { InstallAppButton } from "@/components/PwaProvider";
import { Card, Eyebrow } from "@/components/ui";
import { signOut } from "@/lib/auth";
import { getCurrentUser } from "@/lib/current-user";
import { normalizeTheme } from "@/lib/theme";

const cards = [
  { href: "/min-profil", label: "Min profil", icon: ProfileIcon, badge: "bg-ink" },
  { href: "/kalender", label: "Kalender", icon: CalendarIcon, badge: "bg-ink" },
  { href: "/lag", label: "Laget", icon: UsersIcon, badge: "bg-success" },
  { href: "/betalningar", label: "Betalningar", icon: PaymentIcon, badge: "bg-signal" },
];

export default async function MorePage() {
  const user = await getCurrentUser();
  const isAdmin = user.role === "ADMIN" || user.isSuperAdmin;
  const activeTheme = normalizeTheme(user.theme) === "mint" ? "Mörk" : "Ljus";

  return (
    <div>
      <PageHeader title="Mer" />
      <main className="space-y-7 px-5 pb-10">
        <section>
          <Eyebrow>Genvägar</Eyebrow>
          <div className="mt-3 grid grid-cols-2 gap-3 md:gap-4">
            {cards.map(({ href, label, icon: Icon, badge }) => (
              <Link key={href} href={href} className="flex min-h-32 flex-col justify-between gap-4 rounded-2xl border border-divider bg-white/[0.92] p-5 backdrop-blur-[2px] transition-colors hover:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink">
                <span className={`inline-flex h-11 w-11 items-center justify-center rounded-full text-white ${badge}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <span className="text-base font-bold text-ink">{label}</span>
              </Link>
            ))}
          </div>
        </section>

        {isAdmin ? (
          <section>
            <Eyebrow>{user.isSuperAdmin ? "Huvudadmin" : "Admin"}</Eyebrow>
            <Card className="mt-3 overflow-hidden">
              <Link href="/admin" className="flex min-h-14 items-center justify-between gap-3 px-4 py-3 font-bold text-ink">
                Administration <ChevronIcon className="h-5 w-5 text-ink-subtle" />
              </Link>
            </Card>
          </section>
        ) : null}

        <section>
          <Eyebrow>Inställningar</Eyebrow>
          <Card className="mt-3 overflow-hidden">
            <Link href="/mer/teman" className="flex min-h-14 items-center justify-between gap-3 px-4 py-3 text-ink">
              <div><p className="font-bold">Teman</p><p className="text-xs text-ink-subtle">{activeTheme}</p></div>
              <ChevronIcon className="h-5 w-5 text-ink-subtle" />
            </Link>
            <div className="flex min-h-14 items-center justify-between gap-3 border-t border-divider px-4 py-3">
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
