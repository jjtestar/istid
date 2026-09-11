"use client";

import { useState } from "react";

type RsvpStatus = "GOING" | "NOT_GOING" | "MAYBE" | null;

type LineupPlayer = {
  id: string;
  name: string;
  jerseyNo: number | null;
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
        <li key={player.id} className="flex items-center gap-3 py-2.5 text-sm">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-divider/70 text-xs font-bold text-ink-muted">
            {player.jerseyNo ?? "–"}
          </span>
          <span className="min-w-0 flex-1 truncate font-semibold text-ink">{player.name}</span>
          {player.status === "NOT_GOING" && player.absenceReason && (
            <span className="text-xs font-medium text-ink-subtle">
              {REASON_LABELS[player.absenceReason] ?? player.absenceReason}
            </span>
          )}
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
  const going = lineup.filter((player) => player.status === "GOING");
  const notGoing = lineup.filter((player) => player.status === "NOT_GOING");
  const unanswered = lineup.filter((player) => !player.status || player.status === "MAYBE");

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

      {showLineup && (
        <div className="mt-3 rounded-xl border border-divider bg-white/90 p-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <section>
              <h4 className="text-xs font-bold uppercase tracking-[0.08em] text-success">
                Kommer · {going.length}
              </h4>
              <PlayerList players={going} emptyText="Ingen har tackat ja än." />
            </section>
            <section>
              <h4 className="text-xs font-bold uppercase tracking-[0.08em] text-signal">
                Kommer inte · {notGoing.length}
              </h4>
              <PlayerList players={notGoing} emptyText="Ingen har tackat nej." />
            </section>
            <section>
              <h4 className="text-xs font-bold uppercase tracking-[0.08em] text-ink-subtle">
                Ej svarat · {unanswered.length}
              </h4>
              <PlayerList players={unanswered} emptyText="Alla har svarat." />
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
