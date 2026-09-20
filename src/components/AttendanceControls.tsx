"use client";

import { useEffect, useOptimistic, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import {
  ABSENCE_REASONS,
  ABSENCE_REASON_LABELS,
  RSVP_NETWORK_ERROR,
  type RsvpAction,
  type RsvpStatus,
} from "@/lib/rsvp";

type LineupPlayer = {
  id: string;
  name: string;
  jerseyNo: number | null;
  position: string | null;
  status: RsvpStatus;
  absenceReason: string | null;
};

type Rsvp = { status: RsvpStatus; absenceReason: string | null };

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
                    {ABSENCE_REASON_LABELS[player.absenceReason] ?? player.absenceReason}
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
  currentUserId,
  status,
  absenceReason,
  lineup,
}: {
  formAction: RsvpAction;
  idField: string;
  idValue: string;
  currentUserId: string;
  status: RsvpStatus;
  absenceReason: string | null;
  lineup: LineupPlayer[];
}) {
  // The server value is the source of truth; `rsvp` is it plus any answer that
  // is still in flight, so the segmented control settles on the tap instead of
  // waiting a full roundtrip for the page to re-render.
  const [rsvp, applyRsvp] = useOptimistic<Rsvp, Rsvp>(
    { status, absenceReason },
    (_current, next) => next,
  );
  const [isSaving, startSaving] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showReasons, setShowReasons] = useState(false);
  const [showLineup, setShowLineup] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const lineupTitleId = `lineup-title-${idValue}`;
  const lineupDialogId = `lineup-dialog-${idValue}`;
  const reasonsId = `reasons-${idValue}`;

  // Everyone else comes from the server; only the current player's row can be
  // ahead of it, so the modal never contradicts the button that opened it.
  const effectiveLineup = lineup.map((player) =>
    player.id === currentUserId
      ? { ...player, status: rsvp.status, absenceReason: rsvp.absenceReason }
      : player,
  );
  const going = effectiveLineup.filter((player) => player.status === "GOING");
  const notGoing = effectiveLineup.filter((player) => player.status === "NOT_GOING");
  const unanswered = effectiveLineup.filter((player) => !player.status || player.status === "MAYBE");

  // "Kommer inte" needs a reason before anything can be saved, so a tap on it
  // only arms the choice. Showing that as its own state is what keeps the user
  // from thinking the button failed to register.
  const awaitingReason = showReasons && rsvp.status !== "NOT_GOING";

  function save(next: Rsvp) {
    setError(null);
    startSaving(async () => {
      applyRsvp(next);
      const formData = new FormData();
      formData.set(idField, idValue);
      formData.set("status", next.status ?? "");
      if (next.absenceReason) formData.set("absenceReason", next.absenceReason);

      try {
        const result = await formAction(formData);
        if (!result?.ok) setError(result?.error ?? RSVP_NETWORK_ERROR);
      } catch {
        setError(RSVP_NETWORK_ERROR);
      }
    });
  }

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

  const segmentClass = (selected: boolean) =>
    `min-h-11 px-2 text-[13px] font-bold uppercase tracking-wide transition-colors disabled:cursor-progress ${
      selected ? "bg-ink text-white" : "bg-transparent text-ink"
    }`;

  return (
    <div className="w-full" aria-busy={isSaving}>
      <div className="grid min-h-11 grid-cols-3 overflow-hidden rounded-xl border-2 border-ink">
        <button
          type="button"
          disabled={isSaving}
          aria-pressed={rsvp.status === "GOING"}
          onClick={() => {
            setShowReasons(false);
            setShowLineup(false);
            if (rsvp.status !== "GOING") save({ status: "GOING", absenceReason: null });
          }}
          className={`${segmentClass(rsvp.status === "GOING")} border-r border-ink`}
        >
          Kommer
        </button>

        <button
          type="button"
          disabled={isSaving}
          aria-pressed={rsvp.status === "NOT_GOING"}
          aria-expanded={showReasons}
          aria-controls={reasonsId}
          onClick={() => {
            setShowReasons((visible) => !visible);
            setShowLineup(false);
            setError(null);
          }}
          className={`${segmentClass(rsvp.status === "NOT_GOING")} border-r border-ink ${
            awaitingReason ? "ring-2 ring-inset ring-signal" : ""
          }`}
        >
          Kommer inte
        </button>

        <button
          type="button"
          aria-expanded={showLineup}
          aria-controls={lineupDialogId}
          aria-label="Laguppställning"
          onClick={() => {
            setShowLineup((visible) => !visible);
            setShowReasons(false);
          }}
          className={segmentClass(showLineup)}
        >
          Lag
        </button>
      </div>

      <p role="status" aria-live="polite" className="sr-only">
        {isSaving
          ? "Sparar ditt svar."
          : rsvp.status === "GOING"
            ? "Du är anmäld."
            : rsvp.status === "NOT_GOING"
              ? `Du har svarat nej${rsvp.absenceReason ? `: ${ABSENCE_REASON_LABELS[rsvp.absenceReason] ?? rsvp.absenceReason}` : ""}.`
              : "Du har inte svarat än."}
      </p>

      {isSaving ? (
        <p className="mt-2 text-xs font-semibold uppercase tracking-[0.08em] text-ink-subtle">Sparar…</p>
      ) : error ? (
        <p className="mt-2 text-xs font-semibold text-signal">{error}</p>
      ) : null}

      {showReasons && (
        <div id={reasonsId} className="mt-3 rounded-xl border border-divider bg-white/80 p-3">
          <fieldset disabled={isSaving}>
            <legend className="px-1 text-sm font-bold text-ink">Varför kommer du inte?</legend>
            {awaitingReason ? (
              <p className="px-1 pt-1 text-xs text-ink-subtle">Välj en anledning så sparas ditt svar.</p>
            ) : null}
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {ABSENCE_REASONS.map((reason) => (
                <button
                  key={reason.value}
                  type="button"
                  aria-pressed={rsvp.status === "NOT_GOING" && rsvp.absenceReason === reason.value}
                  onClick={() => save({ status: "NOT_GOING", absenceReason: reason.value })}
                  className={`min-h-11 rounded-lg border px-3 py-2.5 text-sm font-semibold transition-colors disabled:cursor-progress ${
                    rsvp.status === "NOT_GOING" && rsvp.absenceReason === reason.value
                      ? "border-ink bg-ink text-white"
                      : "border-divider bg-white text-ink hover:border-ink"
                  }`}
                >
                  {reason.label}
                </button>
              ))}
            </div>
          </fieldset>
        </div>
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
              id={lineupDialogId}
              role="dialog"
              aria-modal="true"
              aria-labelledby={lineupTitleId}
              className="max-h-[85dvh] w-full max-w-md overflow-y-auto rounded-2xl border border-divider bg-white p-5 shadow-[0_24px_80px_rgb(5_25_45_/_0.35)]"
              onMouseDown={(event) => event.stopPropagation()}
            >
              <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-divider bg-white pb-4">
                <div>
                  <h3 id={lineupTitleId} className="section-title">Laguppställning</h3>
                  <p className="mt-0.5 text-sm text-ink-subtle">{effectiveLineup.length} spelare</p>
                </div>
                <button
                  ref={closeButtonRef}
                  type="button"
                  aria-label="Stäng laguppställning"
                  onClick={() => setShowLineup(false)}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-divider text-2xl leading-none text-ink transition-colors hover:bg-divider/50"
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
