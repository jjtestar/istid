"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarIcon, ChartIcon, CheckIcon, HomeIcon, MenuIcon, PaymentIcon, ProfileIcon, UsersIcon } from "@/components/icons";

const mobileTabs = [
  { href: "/", label: "Hem", icon: HomeIcon },
  { href: "/anmalan", label: "Anmälan", icon: CheckIcon },
  { href: "/statistik", label: "Statistik", icon: ChartIcon },
  { href: "/mer", label: "Mer", icon: MenuIcon, related: ["/mer", "/kalender", "/lag", "/betalningar", "/min-profil", "/admin"] },
];

const desktopLinks = [
  { href: "/", label: "Hem", icon: HomeIcon },
  { href: "/anmalan", label: "Anmälan", icon: CheckIcon },
  { href: "/statistik", label: "Statistik", icon: ChartIcon },
  { href: "/kalender", label: "Kalender", icon: CalendarIcon },
  { href: "/lag", label: "Laget", icon: UsersIcon },
  { href: "/betalningar", label: "Betalningar", icon: PaymentIcon },
  { href: "/min-profil", label: "Min profil", icon: ProfileIcon },
  { href: "/mer", label: "Mer", icon: MenuIcon, related: ["/admin"] },
];

function isActive(pathname: string, href: string, related: string[] = []) {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href) || related.some((path) => pathname.startsWith(path));
}

export function BottomNav() {
  const pathname = usePathname();
  if (["/login", "/registrera", "/integritet"].some((path) => pathname.startsWith(path))) return null;

  return (
    <>
      <aside className="desktop-navigation fixed inset-y-0 left-0 z-20 hidden w-60 border-r border-divider bg-white/95 px-4 py-6 backdrop-blur md:flex md:flex-col">
        <Link href="/" className="mb-8 flex items-center gap-3 px-2">
          <Image src="/pwa/skate-192.png" width={42} height={42} alt="" className="rounded-xl" />
          <span className="text-xl font-bold tracking-tight text-ink">Femtekedjan</span>
        </Link>
        <nav className="space-y-1" aria-label="Huvudmeny">
          {desktopLinks.map(({ href, label, icon: Icon, related }) => {
            const active = isActive(pathname, href, related);
            return <Link key={href} href={href} aria-current={active ? "page" : undefined} className={`flex min-h-12 items-center gap-3 rounded-xl px-3 font-bold transition-colors ${active ? "bg-ink text-white" : "text-ink-muted hover:bg-rink-crease hover:text-ink"}`}><Icon className="h-5 w-5" /><span>{label}</span></Link>;
          })}
        </nav>
        <p className="mt-auto px-3 text-xs font-semibold text-ink-subtle">Femtekedjan · 2026/27</p>
      </aside>

      <nav className="app-bottom-nav sticky bottom-0 z-20 border-t-[3px] border-ink bg-surface md:hidden" aria-label="Huvudmeny">
        <div className="mx-auto grid w-full max-w-md grid-cols-4">
          {mobileTabs.map(({ href, label, icon: Icon, related }) => {
            const active = isActive(pathname, href, related);
            return <Link key={href} href={href} aria-current={active ? "page" : undefined} className={`flex min-w-0 flex-col items-center gap-1 px-1 pb-4 pt-3 text-xs font-semibold ${active ? "text-ink" : "text-ink-subtle"}`}><Icon className="h-5 w-5" /><span>{label}</span></Link>;
          })}
        </div>
      </nav>
    </>
  );
}
