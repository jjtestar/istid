import { LineupData } from "@/lib/lineup";
import { RinkLineup, RinkPlayer } from "@/components/RinkLineup";

function Names({ ids, playersById }: { ids: (string | null)[]; playersById: Map<string, RinkPlayer> }) {
  const names = ids.map((id) => (id ? playersById.get(id)?.name ?? "?" : null)).filter((n): n is string => n !== null);
  if (names.length === 0) return <span className="text-ink-subtle">–</span>;
  return <>{names.join(" · ")}</>;
}

export function LineupView({ data, playersById }: { data: LineupData; playersById: Map<string, RinkPlayer> }) {
  const forwardLines = data.forwardLines.filter((line) => line.some((id) => id !== null));
  const defensePairs = data.defensePairs.filter((pair) => pair.some((id) => id !== null));
  const goalies = data.goalies.filter((id): id is string => id !== null);

  if (forwardLines.length === 0 && defensePairs.length === 0 && goalies.length === 0) return null;

  return (
    <div className="mt-3 space-y-3 rounded-xl border border-divider bg-white/70 p-3 text-sm">
      <p className="text-xs font-bold uppercase tracking-[0.08em] text-ink-subtle">Lagindelning</p>
      <RinkLineup forwardLines={forwardLines} defensePairs={defensePairs} goalies={goalies} playersById={playersById} />
      <div className="space-y-2">
        {forwardLines.map((line, i) => (
          <p key={`f${i}`}><span className="font-bold">Kedja {i + 1}:</span> <Names ids={line} playersById={playersById} /></p>
        ))}
        {defensePairs.map((pair, i) => (
          <p key={`d${i}`}><span className="font-bold">Backpar {i + 1}:</span> <Names ids={pair} playersById={playersById} /></p>
        ))}
        {goalies.length > 0 ? <p><span className="font-bold">Målvakt:</span> <Names ids={goalies} playersById={playersById} /></p> : null}
      </div>
    </div>
  );
}
