import { ExpandableList } from "@/components/ExpandableList";

const videoUrl = "https://youtu.be/JveRskYHN4U";

// Goal protocol supplied for the example clip. Times are video offsets,
// not match-clock times; the screenshot does not establish a final score.
const goals = [
  { scorer: "Anders Falk", score: "0–1", seconds: 21, assists: ["Peter Arnesson Gyld"] },
  { scorer: "Peter Arnesson Gyld", score: "0–2", seconds: 129, assists: ["Anders Falk"] },
  { scorer: "David Karlsson", score: "1–2", seconds: 603, assists: ["David Simander", "Peter Marcusson"] },
  { scorer: "Jimmie Ölvestad", score: "2–2", seconds: 697, assists: ["Gunnar Dybeck", "Kjell Holmberg"] },
  { scorer: "Gunnar Dybeck", score: "3–2", seconds: 907, assists: ["David Simander"] },
  { scorer: "Stefan Rönnqvist", score: "3–3", seconds: 1244, assists: ["Peter Lundin"] },
  { scorer: "Wilgot Rönnqvist", score: "3–4", seconds: 1626, assists: ["Anders Falk"] },
];

function PlayIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M8 5.5a1 1 0 0 1 1.53-.85l10 6.5a1 1 0 0 1 0 1.7l-10 6.5A1 1 0 0 1 8 18.5z" />
    </svg>
  );
}

export function GoalHighlights() {
  return (
    <div className="mt-4">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-divider pb-3">
        <div>
          <h3 className="text-base font-bold text-ink">Målprotokoll</h3>
          <p className="mt-0.5 text-sm text-ink-subtle">Exempelklipp · {goals.length} mål</p>
        </div>
        <a
          href={videoUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Se hela klippet på YouTube (öppnas i ny flik)"
          className="inline-flex min-h-11 items-center gap-1.5 rounded-lg text-sm font-bold text-signal underline decoration-signal/30 underline-offset-4 hover:decoration-signal focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
        >
          <PlayIcon className="h-4 w-4" />
          Hela klippet
        </a>
      </div>

      <ExpandableList initialCount={3} moreLabel="Visa alla 7 mål" lessLabel="Visa färre mål">
        {goals.map((goal) => {
          const timestamp = `${Math.floor(goal.seconds / 60)}:${String(goal.seconds % 60).padStart(2, "0")}`;
          return (
            <a
              key={goal.seconds}
              href={`${videoUrl}?t=${goal.seconds}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Se målet: ${goal.scorer}, ${goal.score}, ${timestamp} i videon. Öppnas på YouTube i ny flik.`}
              className="group grid grid-cols-[3rem_minmax(0,1fr)_2.75rem] items-center gap-3 rounded-lg border-b border-divider py-4 transition-colors hover:bg-rink-crease focus-visible:bg-rink-crease focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              <span className="flex min-h-11 items-center justify-center rounded-lg bg-ink text-lg font-bold tabular-nums text-white">
                {goal.score}
              </span>
              <span className="min-w-0">
                <span className="block break-words text-base font-bold leading-snug text-ink group-hover:underline group-hover:underline-offset-4">
                  {goal.scorer}
                </span>
                <span className="mt-1 block text-sm leading-snug text-ink-muted">
                  Assist: {goal.assists.join(" · ")}
                </span>
                <span className="mt-1.5 block text-xs tabular-nums text-ink-subtle">{timestamp} i videon</span>
              </span>
              <span className="flex h-11 w-11 items-center justify-center rounded-full border border-signal/20 text-signal transition-colors group-hover:border-signal group-hover:bg-signal group-hover:text-white group-focus-visible:bg-signal group-focus-visible:text-white">
                <PlayIcon className="h-5 w-5" />
              </span>
            </a>
          );
        })}
      </ExpandableList>
      <p className="mt-3 text-xs text-ink-subtle">Målen öppnas direkt i YouTube · ny flik</p>
    </div>
  );
}
