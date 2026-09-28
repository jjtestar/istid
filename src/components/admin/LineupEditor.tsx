"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { saveLineupPlan } from "@/app/admin/actions";
import { RinkLineup } from "@/components/RinkLineup";
import { DEFENSE_PAIRS, DEFENSE_SLOTS, FORWARD_LINES, FORWARD_SLOTS, GOALIE_SLOTS, LineupData, emptyLineup } from "@/lib/lineup";

const selectClass = "h-11 w-full min-w-0 rounded-xl border border-divider bg-white px-2 text-sm outline-none focus:border-ink";

function PlayerSelect({
  value,
  onChange,
  roster,
  label,
  duplicate,
}: {
  value: string | null;
  onChange: (value: string | null) => void;
  roster: { id: string; name: string; jerseyNo: number | null }[];
  label: string;
  duplicate: boolean;
}) {
  return (
    <select
      aria-label={label}
      aria-invalid={duplicate}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value || null)}
      className={`${selectClass} ${duplicate ? "border-signal bg-rink-line-red/40" : ""}`}
    >
      <option value="">– tom –</option>
      {roster.map((p) => (
        <option key={p.id} value={p.id}>
          {p.jerseyNo !== null ? `#${p.jerseyNo} ` : ""}{p.name}
        </option>
      ))}
    </select>
  );
}

/** Ids placed in more than one slot — a lineup can't be saved with a duplicate. */
function duplicatePlayerIds(lineup: LineupData) {
  const placed = [...lineup.forwardLines.flat(), ...lineup.defensePairs.flat(), ...lineup.goalies].filter(
    (id): id is string => id !== null,
  );
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const id of placed) {
    if (seen.has(id)) duplicates.add(id);
    seen.add(id);
  }
  return duplicates;
}

export function LineupEditor({
  activityRef,
  roster,
  initialData,
}: {
  activityRef: string;
  roster: { id: string; name: string; jerseyNo: number | null }[];
  initialData: LineupData | null;
}) {
  const [lineup, setLineup] = useState<LineupData>(initialData ?? emptyLineup());
  const [state, formAction, pending] = useActionState(saveLineupPlan, undefined);
  const dataInputRef = useRef<HTMLInputElement>(null);
  const duplicateIds = duplicatePlayerIds(lineup);
  const hasDuplicates = duplicateIds.size > 0;
  const playersById = useMemo(() => new Map(roster.map((p) => [p.id, { name: p.name, jerseyNo: p.jerseyNo }])), [roster]);

  useEffect(() => {
    if (dataInputRef.current) dataInputRef.current.value = JSON.stringify(lineup);
  }, [lineup]);

  function setForward(lineIndex: number, slotIndex: number, userId: string | null) {
    setLineup((prev) => {
      const forwardLines = prev.forwardLines.map((line, i) => (i === lineIndex ? line.map((v, j) => (j === slotIndex ? userId : v)) : line));
      return { ...prev, forwardLines };
    });
  }
  function setDefense(pairIndex: number, slotIndex: number, userId: string | null) {
    setLineup((prev) => {
      const defensePairs = prev.defensePairs.map((pair, i) => (i === pairIndex ? pair.map((v, j) => (j === slotIndex ? userId : v)) : pair));
      return { ...prev, defensePairs };
    });
  }
  function setGoalie(index: number, userId: string | null) {
    setLineup((prev) => ({ ...prev, goalies: prev.goalies.map((v, i) => (i === index ? userId : v)) }));
  }

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="activity" value={activityRef} />
      <input ref={dataInputRef} type="hidden" name="data" defaultValue={JSON.stringify(lineup)} />

      <RinkLineup
        forwardLines={lineup.forwardLines}
        defensePairs={lineup.defensePairs}
        goalies={lineup.goalies}
        playersById={playersById}
        duplicateIds={duplicateIds}
      />

      <div>
        <p className="text-xs font-bold uppercase tracking-[0.08em] text-ink-subtle">Kedjor</p>
        <div className="mt-2 space-y-2">
          {Array.from({ length: FORWARD_LINES }, (_, lineIndex) => (
            <div key={lineIndex} className="grid grid-cols-[1.5rem_repeat(3,minmax(0,1fr))] items-center gap-2">
              <span className="text-xs font-bold text-ink-subtle">{lineIndex + 1}.</span>
              {Array.from({ length: FORWARD_SLOTS }, (_, slotIndex) => (
                <PlayerSelect
                  key={slotIndex}
                  label={`Kedja ${lineIndex + 1}, plats ${slotIndex + 1}`}
                  value={lineup.forwardLines[lineIndex][slotIndex]}
                  onChange={(v) => setForward(lineIndex, slotIndex, v)}
                  roster={roster}
                  duplicate={Boolean(lineup.forwardLines[lineIndex][slotIndex] && duplicateIds.has(lineup.forwardLines[lineIndex][slotIndex]!))}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-bold uppercase tracking-[0.08em] text-ink-subtle">Backpar</p>
        <div className="mt-2 space-y-2">
          {Array.from({ length: DEFENSE_PAIRS }, (_, pairIndex) => (
            <div key={pairIndex} className="grid grid-cols-[1.5rem_repeat(2,minmax(0,1fr))] items-center gap-2">
              <span className="text-xs font-bold text-ink-subtle">{pairIndex + 1}.</span>
              {Array.from({ length: DEFENSE_SLOTS }, (_, slotIndex) => (
                <PlayerSelect
                  key={slotIndex}
                  label={`Backpar ${pairIndex + 1}, plats ${slotIndex + 1}`}
                  value={lineup.defensePairs[pairIndex][slotIndex]}
                  onChange={(v) => setDefense(pairIndex, slotIndex, v)}
                  roster={roster}
                  duplicate={Boolean(lineup.defensePairs[pairIndex][slotIndex] && duplicateIds.has(lineup.defensePairs[pairIndex][slotIndex]!))}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-bold uppercase tracking-[0.08em] text-ink-subtle">Målvakter</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {Array.from({ length: GOALIE_SLOTS }, (_, index) => (
            <PlayerSelect
              key={index}
              label={`Målvakt ${index + 1}`}
              value={lineup.goalies[index]}
              onChange={(v) => setGoalie(index, v)}
              roster={roster}
              duplicate={Boolean(lineup.goalies[index] && duplicateIds.has(lineup.goalies[index]!))}
            />
          ))}
        </div>
      </div>

      {hasDuplicates ? (
        <p role="alert" className="rounded-xl bg-rink-line-red px-3 py-2.5 text-sm font-semibold text-signal">
          En spelare kan bara stå på en plats. Ta bort dubbletten markerad i rött ovan.
        </p>
      ) : null}
      {state?.error ? <p role="alert" className="rounded-xl bg-rink-line-red px-3 py-2.5 text-sm font-semibold text-signal">{state.error}</p> : null}
      {state?.success ? <p role="status" className="rounded-xl bg-rink-crease px-3 py-2.5 text-sm font-semibold text-success">{state.success}</p> : null}
      <button type="submit" disabled={pending || hasDuplicates} className="h-11 w-full rounded-xl bg-ink font-bold text-white disabled:opacity-60">
        {pending ? "Sparar…" : "Spara lagindelning"}
      </button>
    </form>
  );
}
