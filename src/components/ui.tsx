import { ReactNode } from "react";

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
        tone === "heading" ? "tracking-[0.2em] text-signal" : "tracking-[0.18em] text-ink-subtle"
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
    tone === "success" ? "text-success" : tone === "signal" ? "text-signal" : "text-ink-subtle";
  return (
    <span className={`text-xs font-bold uppercase tracking-[0.06em] ${toneClass}`}>
      {children}
    </span>
  );
}

export function ResponseToggle({
  formAction,
  idField,
  idValue,
  going,
  goingLabel = "JAG SPELAR",
  notGoingLabel = "NEJ",
}: {
  formAction: (formData: FormData) => void;
  idField: string;
  idValue: string;
  going: boolean;
  goingLabel?: string;
  notGoingLabel?: string;
}) {
  return (
    <div className="inline-flex h-11 overflow-hidden rounded-full border-2 border-ink">
      <form action={formAction} className="contents">
        <input type="hidden" name={idField} value={idValue} />
        <input type="hidden" name="status" value="GOING" />
        <button
          type="submit"
          className={`flex h-full items-center px-[22px] text-sm font-bold uppercase tracking-wide ${
            going ? "bg-ink text-white" : "bg-transparent text-ink"
          }`}
        >
          {goingLabel}
        </button>
      </form>
      <form action={formAction} className="contents">
        <input type="hidden" name={idField} value={idValue} />
        <input type="hidden" name="status" value="NOT_GOING" />
        <button
          type="submit"
          className={`flex h-full items-center px-[22px] text-sm font-bold uppercase tracking-wide ${
            !going ? "bg-ink text-white" : "bg-transparent text-ink"
          }`}
        >
          {notGoingLabel}
        </button>
      </form>
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-divider ${className}`} />;
}
