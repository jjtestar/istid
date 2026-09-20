import { ReactNode } from "react";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`card-surface rounded-2xl border border-divider bg-white/[0.92] backdrop-blur-[2px] ${className}`}
    >
      {children}
    </section>
  );
}

export function Eyebrow({
  children,
  tone = "label",
}: {
  children: ReactNode;
  tone?: "label" | "heading";
}) {
  if (tone === "heading") {
    return <h2 className="section-title text-signal">{children}</h2>;
  }

  return (
    <span
      className="text-xs font-bold uppercase tracking-[0.12em] text-ink-subtle"
    >
      {children}
    </span>
  );
}

export function StatusLabel({
  children,
  tone,
}: {
  children: ReactNode;
  tone: "success" | "signal" | "muted";
}) {
  const toneClass =
    tone === "success"
      ? "text-success"
      : tone === "signal"
        ? "text-signal"
        : "text-ink-subtle";
  return (
    <span className={`text-xs font-bold uppercase tracking-[0.06em] ${toneClass}`}>
      {children}
    </span>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-divider ${className}`} />;
}
