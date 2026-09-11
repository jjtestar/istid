"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarIcon, ChartIcon, HomeIcon, UsersIcon } from "@/components/icons";

const tabs = [
  { href: "/", label: "Hem", icon: HomeIcon },
  { href: "/kalender", label: "Kalender", icon: CalendarIcon },
  { href: "/lag", label: "Lag", icon: UsersIcon },
  { href: "/statistik", label: "Statistik", icon: ChartIcon },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="sticky bottom-0 z-10 border-t-[3px] border-ink bg-surface">
      <div className="mx-auto flex w-full max-w-md">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center gap-1 px-[10px] pb-6 pt-3 text-[11.5px] font-semibold uppercase tracking-[0.08em] ${
                active ? "text-ink" : "text-ink-subtle"
              }`}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
