import { ReactNode } from "react";

export function Eyebrow({ children, tone = "muted" }: { children: ReactNode; tone?: "muted" | "accent" | "light" }) {
  const toneClass =
    tone === "accent" ? "text-accent" : tone === "light" ? "text-white/60" : "text-muted";
  return (
    <span className={`text-xs font-semibold uppercase tracking-widest ${toneClass}`}>
      {children}
    </span>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-border bg-surface p-5 ${className}`}>
      {children}
    </div>
  );
}

export function DarkCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl bg-ink p-5 text-white ${className}`}>{children}</div>
  );
}

export function Badge({
  children,
  tone = "outline",
}: {
  children: ReactNode;
  tone?: "success" | "outline" | "accent" | "outline-light";
}) {
  const toneClass = {
    success: "bg-success-bg text-success",
    outline: "border border-border text-ink",
    accent: "bg-accent text-accent-foreground",
    "outline-light": "border border-white/25 text-white",
  }[tone];

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${toneClass}`}
    >
      {children}
    </span>
  );
}

export function StatTile({ value, label, emphasis = false }: { value: string | number; label: string; emphasis?: boolean }) {
  return (
    <div className="rounded-2xl bg-ink px-4 py-5 text-center">
      <div className={`text-3xl font-bold ${emphasis ? "text-accent" : "text-white"}`}>{value}</div>
      <div className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-white/50">
        {label}
      </div>
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-black/5 ${className}`} />;
}

export function PrimaryButton({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className="flex h-12 w-full items-center justify-center rounded-xl bg-accent text-sm font-bold uppercase tracking-wide text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
    >
      {children}
    </button>
  );
}
