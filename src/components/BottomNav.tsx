"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType } from "react";
import { CalendarIcon, ChartIcon, CheckIcon, HomeIcon, MenuIcon, PaymentIcon, ProfileIcon, UsersIcon } from "@/components/icons";

const mobileTabs = [
  { href: "/", label: "Hem", icon: HomeIcon },
  { href: "/anmalan", label: "Anmälan", icon: CheckIcon },
  { href: "/statistik", label: "Statistik", icon: ChartIcon },
  { href: "/mer", label: "Mer", icon: MenuIcon, related: ["/mer", "/kalender", "/lag", "/betalningar", "/min-profil", "/admin"] },
];

type NavLink = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  related?: string[];
};

// Grouped so the sidebar reads as two short lists instead of one long one.
const desktopGroups: { label: string | null; links: NavLink[] }[] = [
  {
    label: null,
    links: [
      { href: "/", label: "Hem", icon: HomeIcon },
      { href: "/anmalan", label: "Anmälan", icon: CheckIcon },
      { href: "/statistik", label: "Statistik", icon: ChartIcon },
      { href: "/kalender", label: "Kalender", icon: CalendarIcon },
      { href: "/lag", label: "Laget", icon: UsersIcon },
    ],
  },
  {
    label: "Konto",
    links: [
      { href: "/betalningar", label: "Betalningar", icon: PaymentIcon },
      { href: "/min-profil", label: "Min profil", icon: ProfileIcon },
      { href: "/mer", label: "Mer", icon: MenuIcon, related: ["/admin"] },
    ],
  },
];

function isActive(pathname: string, href: string, related: string[] = []) {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href) || related.some((path) => pathname.startsWith(path));
}

export function BottomNav() {
  const pathname = usePathname();
  if (["/login", "/registrera", "/valkommen", "/integritet"].some((path) => pathname.startsWith(path))) return null;

  return (
    <>
      <aside className="desktop-navigation fixed inset-y-0 left-0 z-20 hidden w-60 flex-col border-r border-divider bg-white/95 px-4 py-7 backdrop-blur md:flex">
        <Link
          href="/"
          className="mb-8 flex items-center gap-3 rounded-xl px-2 py-1 transition-colors hover:bg-rink-crease focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          <Image src="/pwa/skate-192.png" width={42} height={42} alt="" className="rounded-xl" />
          <span className="text-xl font-bold tracking-tight text-ink">Femtekedjan</span>
        </Link>
        <nav className="flex flex-col gap-7" aria-label="Huvudmeny">
          {desktopGroups.map(({ label, links }) => (
            <div key={label ?? "main"} className="space-y-1">
              {label ? (
                <p className="px-3 pb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-ink-subtle">{label}</p>
              ) : null}
              {links.map(({ href, label: linkLabel, icon: Icon, related }) => {
                const active = isActive(pathname, href, related);
                return (
                  <Link
                    key={href}
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={`flex min-h-12 items-center gap-3 rounded-xl px-3 font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${active ? "bg-ink text-white" : "text-ink-muted hover:bg-rink-crease hover:text-ink"}`}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <span>{linkLabel}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
        <p className="mt-auto border-t border-divider px-3 pt-4 text-xs font-semibold text-ink-subtle">
          Femtekedjan · 2026/27
        </p>
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
