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
      className={`rounded-2xl border border-divider bg-white/[0.92] shadow-[0_8px_24px_rgb(13_59_102_/_0.07)] backdrop-blur-[2px] ${className}`}
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
  return (
    <span
      className={`text-[11.5px] font-bold uppercase ${
        tone === "heading"
          ? "tracking-[0.2em] text-signal"
          : "tracking-[0.18em] text-ink-subtle"
      }`}
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
