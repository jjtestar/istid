import { LineupData } from "@/lib/lineup";

function Names({ ids, namesById }: { ids: (string | null)[]; namesById: Map<string, string> }) {
  const names = ids.map((id) => (id ? namesById.get(id) ?? "?" : null)).filter((n): n is string => n !== null);
  if (names.length === 0) return <span className="text-ink-subtle">–</span>;
  return <>{names.join(" · ")}</>;
}

export function LineupView({ data, namesById }: { data: LineupData; namesById: Map<string, string> }) {
  const forwardLines = data.forwardLines.filter((line) => line.some((id) => id !== null));
  const defensePairs = data.defensePairs.filter((pair) => pair.some((id) => id !== null));
  const goalies = data.goalies.filter((id): id is string => id !== null);

  if (forwardLines.length === 0 && defensePairs.length === 0 && goalies.length === 0) return null;

  return (
    <div className="mt-3 space-y-2 rounded-xl border border-divider bg-white/70 p-3 text-sm">
      <p className="text-xs font-bold uppercase tracking-[0.08em] text-ink-subtle">Lagindelning</p>
      {forwardLines.map((line, i) => (
        <p key={`f${i}`}><span className="font-bold">Kedja {i + 1}:</span> <Names ids={line} namesById={namesById} /></p>
      ))}
      {defensePairs.map((pair, i) => (
        <p key={`d${i}`}><span className="font-bold">Backpar {i + 1}:</span> <Names ids={pair} namesById={namesById} /></p>
      ))}
      {goalies.length > 0 ? <p><span className="font-bold">Målvakt:</span> <Names ids={goalies} namesById={namesById} /></p> : null}
    </div>
  );
}
