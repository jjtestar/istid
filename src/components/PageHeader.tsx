import Link from "next/link";
import { ReactNode } from "react";
import { ChevronIcon } from "@/components/icons";

export function PageHeader({
  title,
  right,
  back,
}: {
  title: string;
  right?: ReactNode;
  back?: { href: string; label?: string };
}) {
  return (
    <div className="px-5 pb-4 pt-6 md:px-8 md:pb-6 md:pt-10">
      {back ? (
        <Link
          href={back.href}
          className="mb-2 inline-flex items-center gap-1 text-sm font-bold text-ink-muted transition-colors hover:text-ink"
        >
          <ChevronIcon direction="left" className="h-4 w-4" /> {back.label ?? "Tillbaka"}
        </Link>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <h1 className="page-title">{title}</h1>
        {right}
      </div>
    </div>
  );
}
