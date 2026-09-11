"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type RsvpStatus = "GOING" | "NOT_GOING" | "MAYBE" | null;

type LineupPlayer = {
  id: string;
  name: string;
  jerseyNo: number | null;
  position: string | null;
  status: RsvpStatus;
  absenceReason: string | null;
};

const REASONS = [
  { value: "TIRED", label: "Trött" },
  { value: "SICK", label: "Sjuk" },
  { value: "VACATION", label: "Semester" },
  { value: "OTHER", label: "Annat" },
] as const;

const REASON_LABELS = Object.fromEntries(REASONS.map((reason) => [reason.value, reason.label]));

function PlayerList({ players, emptyText }: { players: LineupPlayer[]; emptyText: string }) {
  if (players.length === 0) {
    return <p className="py-2 text-sm text-ink-subtle">{emptyText}</p>;
  }

  return (
    <ul className="divide-y divide-divider">
      {players.map((player) => (
        <li key={player.id} className="flex items-center gap-3 py-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-divider/70 text-xs font-bold text-ink-muted">
            {player.jerseyNo ?? "–"}
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-ink">{player.name}</div>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-ink-subtle">
              <span>{player.position ?? "Position saknas"}</span>
              {player.status === "NOT_GOING" && player.absenceReason && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="font-semibold text-signal">
                    {REASON_LABELS[player.absenceReason] ?? player.absenceReason}
                  </span>
                </>
              )}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function AttendanceControls({
  formAction,
  idField,
  idValue,
  status,
  absenceReason,
  lineup,
}: {
  formAction: (formData: FormData) => void | Promise<void>;
  idField: string;
  idValue: string;
  status: RsvpStatus;
  absenceReason: string | null;
  lineup: LineupPlayer[];
}) {
  const [showReasons, setShowReasons] = useState(status === "NOT_GOING");
  const [showLineup, setShowLineup] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const going = lineup.filter((player) => player.status === "GOING");
  const notGoing = lineup.filter((player) => player.status === "NOT_GOING");
  const unanswered = lineup.filter((player) => !player.status || player.status === "MAYBE");
  const lineupTitleId = `lineup-title-${idValue}`;

  useEffect(() => {
    if (!showLineup) return;

    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShowLineup(false);
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", closeOnEscape);
    closeButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
      previousFocus?.focus();
    };
  }, [showLineup]);

  return (
    <div className="w-full">
      <div className="grid min-h-11 grid-cols-3 overflow-hidden rounded-xl border-2 border-ink">
        <form action={formAction} className="contents" onSubmit={() => setShowReasons(false)}>
          <input type="hidden" name={idField} value={idValue} />
          <input type="hidden" name="status" value="GOING" />
          <button
            type="submit"
            aria-pressed={status === "GOING"}
            className={`min-h-11 border-r border-ink px-2 text-[13px] font-bold uppercase tracking-wide transition-colors ${
              status === "GOING" ? "bg-ink text-white" : "bg-transparent text-ink"
            }`}
          >
            Kommer
          </button>
        </form>

        <button
          type="button"
          aria-expanded={showReasons}
          onClick={() => {
            setShowReasons((visible) => !visible);
            setShowLineup(false);
          }}
          className={`min-h-11 border-r border-ink px-2 text-[13px] font-bold uppercase tracking-wide transition-colors ${
            status === "NOT_GOING" ? "bg-ink text-white" : "bg-transparent text-ink"
          }`}
        >
          Kommer inte
        </button>

        <button
          type="button"
          aria-expanded={showLineup}
          aria-controls={lineupTitleId}
          onClick={() => {
            setShowLineup((visible) => !visible);
            setShowReasons(false);
          }}
          className={`min-h-11 px-2 text-[12px] font-bold uppercase tracking-[0.04em] transition-colors ${
            showLineup ? "bg-ink text-white" : "bg-transparent text-ink"
          }`}
        >
          Laguppställning
        </button>
      </div>

      {showReasons && (
        <form action={formAction} className="mt-3 rounded-xl border border-divider bg-white/80 p-3">
          <input type="hidden" name={idField} value={idValue} />
          <input type="hidden" name="status" value="NOT_GOING" />
          <fieldset>
            <legend className="px-1 text-sm font-bold text-ink">Varför kommer du inte?</legend>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {REASONS.map((reason) => (
                <button
                  key={reason.value}
                  type="submit"
                  name="absenceReason"
                  value={reason.value}
                  className={`rounded-lg border px-3 py-2.5 text-sm font-semibold transition-colors ${
                    absenceReason === reason.value
                      ? "border-ink bg-ink text-white"
                      : "border-divider bg-white text-ink hover:border-ink"
                  }`}
                >
                  {reason.label}
                </button>
              ))}
            </div>
          </fieldset>
        </form>
      )}

      {showLineup &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/55 p-4 backdrop-blur-sm"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setShowLineup(false);
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby={lineupTitleId}
              className="max-h-[85dvh] w-full max-w-md overflow-y-auto rounded-2xl border border-divider bg-white p-5 shadow-[0_24px_80px_rgb(5_25_45_/_0.35)]"
              onMouseDown={(event) => event.stopPropagation()}
            >
              <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-divider bg-white pb-4">
                <div>
                  <h3 id={lineupTitleId} className="text-xl font-bold text-ink">Laguppställning</h3>
                  <p className="mt-0.5 text-sm text-ink-subtle">{lineup.length} spelare</p>
                </div>
                <button
                  ref={closeButtonRef}
                  type="button"
                  aria-label="Stäng laguppställning"
                  onClick={() => setShowLineup(false)}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-divider text-2xl leading-none text-ink transition-colors hover:bg-divider/50"
                >
                  ×
                </button>
              </div>

              <section className="py-4">
                <h4 className="text-sm font-bold uppercase tracking-[0.08em] text-success">
                  Kommer <span className="text-ink-subtle">({going.length})</span>
                </h4>
                <PlayerList players={going} emptyText="Ingen har tackat ja än." />
              </section>
              <section className="border-t border-divider py-4">
                <h4 className="text-sm font-bold uppercase tracking-[0.08em] text-signal">
                  Kommer inte <span className="text-ink-subtle">({notGoing.length})</span>
                </h4>
                <PlayerList players={notGoing} emptyText="Ingen har tackat nej." />
              </section>
              <section className="border-t border-divider pt-4">
                <h4 className="text-sm font-bold uppercase tracking-[0.08em] text-ink-subtle">
                  Ej svarat <span>({unanswered.length})</span>
                </h4>
                <PlayerList players={unanswered} emptyText="Alla har svarat." />
              </section>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
