"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { saveLineupPlan } from "@/app/admin/actions";
import { DEFENSE_PAIRS, DEFENSE_SLOTS, FORWARD_LINES, FORWARD_SLOTS, GOALIE_SLOTS, LineupData, emptyLineup } from "@/lib/lineup";

const selectClass = "h-11 w-full min-w-0 rounded-xl border border-divider bg-white px-2 text-sm outline-none focus:border-ink";

function PlayerSelect({
  value,
  onChange,
  roster,
  label,
}: {
  value: string | null;
  onChange: (value: string | null) => void;
  roster: { id: string; name: string; jerseyNo: number | null }[];
  label: string;
}) {
  return (
    <select aria-label={label} value={value ?? ""} onChange={(e) => onChange(e.target.value || null)} className={selectClass}>
      <option value="">– tom –</option>
      {roster.map((p) => (
        <option key={p.id} value={p.id}>
          {p.jerseyNo !== null ? `#${p.jerseyNo} ` : ""}{p.name}
        </option>
      ))}
    </select>
  );
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
            <PlayerSelect key={index} label={`Målvakt ${index + 1}`} value={lineup.goalies[index]} onChange={(v) => setGoalie(index, v)} roster={roster} />
          ))}
        </div>
      </div>

      {state?.error ? <p role="alert" className="rounded-xl bg-rink-line-red px-3 py-2.5 text-sm font-semibold text-signal">{state.error}</p> : null}
      {state?.success ? <p role="status" className="rounded-xl bg-rink-crease px-3 py-2.5 text-sm font-semibold text-success">{state.success}</p> : null}
      <button type="submit" disabled={pending} className="h-11 w-full rounded-xl bg-ink font-bold text-white disabled:opacity-60">
        {pending ? "Sparar…" : "Spara lagindelning"}
      </button>
    </form>
  );
}
