"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarIcon,
  ChartIcon,
  CheckIcon,
  HomeIcon,
  ProfileIcon,
  UsersIcon,
} from "@/components/icons";

const tabs = [
  { href: "/", label: "Hem", icon: HomeIcon },
  { href: "/anmalan", label: "Anmälan", icon: CheckIcon },
  { href: "/kalender", label: "Kalender", icon: CalendarIcon },
  { href: "/lag", label: "Laget", icon: UsersIcon },
  { href: "/statistik", label: "Statistik", icon: ChartIcon },
  { href: "/min-profil", label: "Min profil", icon: ProfileIcon },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="sticky bottom-0 z-10 border-t-[3px] border-ink bg-surface" aria-label="Huvudmeny">
      <div className="mx-auto grid w-full max-w-md grid-cols-6">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex min-w-0 flex-col items-center gap-1 px-0.5 pb-5 pt-3 text-xs font-semibold tracking-tight ${
                active ? "text-ink" : "text-ink-subtle"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="whitespace-nowrap">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
