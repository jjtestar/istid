"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

type PlayerOption = {
  userId: string;
  name: string | null;
  jerseyNo: number | null;
};

export function StatisticsPlayerPicker({
  players,
  selectedPlayerId,
  ownPlayerId,
}: {
  players: PlayerOption[];
  selectedPlayerId: string;
  ownPlayerId?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isOwnSelected = Boolean(ownPlayerId && selectedPlayerId === ownPlayerId);

  function selectPlayer(playerId: string) {
    if (!playerId || playerId === selectedPlayerId) return;
    const params = new URLSearchParams({ vy: "spelare", spelare: playerId });
    startTransition(() => router.push(`/statistik?${params.toString()}`, { scroll: false }));
  }

  return (
    <div aria-busy={isPending}>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-x-3">
        <label htmlFor="statistics-player" className="text-sm font-semibold text-ink-muted">
          Välj spelare
        </label>
        {ownPlayerId ? (
          <button
            type="button"
            onClick={() => selectPlayer(ownPlayerId)}
            disabled={isPending || isOwnSelected}
            aria-pressed={isOwnSelected}
            className={`inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${
              isOwnSelected
                ? "text-ink-subtle"
                : "text-ink underline decoration-ink/25 underline-offset-4 hover:bg-rink-crease hover:decoration-ink disabled:opacity-50"
            }`}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true">
              <circle cx="12" cy="8" r="3.5" />
              <path d="M5 20v-1a7 7 0 0 1 14 0v1" />
            </svg>
            Min statistik
          </button>
        ) : null}
      </div>

      <div className="relative">
        <select
          id="statistics-player"
          name="spelare"
          value={selectedPlayerId}
          disabled={isPending || players.length === 0}
          onChange={(event) => selectPlayer(event.currentTarget.value)}
          className="min-h-14 w-full min-w-0 appearance-none rounded-xl border border-ink/20 bg-rink-crease/60 py-3 pl-4 pr-11 text-base font-semibold text-ink transition-colors hover:border-ink/40 focus-visible:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:cursor-wait disabled:opacity-60"
        >
          {players.length === 0 ? <option value="">Inga spelare att visa</option> : null}
          {players.map((player) => (
            <option key={player.userId} value={player.userId}>
              #{player.jerseyNo ?? "–"} {player.name ?? "Okänd spelare"}
              {player.userId === ownPlayerId ? " (du)" : ""}
            </option>
          ))}
        </select>
        <svg className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </div>
      <p role="status" className={isPending ? "mt-2 text-sm text-ink-subtle" : "sr-only"}>
        {isPending ? "Hämtar statistik…" : ""}
      </p>
    </div>
  );
}
