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
    <nav className="sticky bottom-0 z-10 border-t border-border bg-surface/95 backdrop-blur">
      <div className="mx-auto flex max-w-3xl">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center gap-1 py-3 text-[11px] font-semibold ${
                active ? "text-accent" : "text-muted"
              }`}
            >
              <Icon />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
