type Slot = string | null;
export type RinkPlayer = { name: string; jerseyNo: number | null };

const MARKER_R = 16;
const ROW_H = 58;
const GOALIE_BAND_H = 64;
const BLUE_LINE_GAP = 34;
const TOP_PAD = 26;
const WIDTH = 280;
const MARGIN = 36;

function slotX(index: number, count: number, margin = MARGIN) {
  const usable = WIDTH - margin * 2;
  return count <= 1 ? WIDTH / 2 : margin + (usable * (index + 0.5)) / count;
}

/** Short label under a marker: last name if there is one, otherwise the whole name, capped so it never overlaps its neighbours. */
function shortLabel(name: string) {
  const parts = name.trim().split(/\s+/);
  const label = parts.length > 1 ? parts[parts.length - 1] : parts[0];
  return label.length > 9 ? `${label.slice(0, 8)}…` : label;
}

function Marker({
  id,
  x,
  y,
  playersById,
  duplicate,
}: {
  id: Slot;
  x: number;
  y: number;
  playersById: Map<string, RinkPlayer>;
  duplicate: boolean;
}) {
  const player = id ? playersById.get(id) : undefined;
  if (!id || !player) {
    return <circle cx={x} cy={y} r={MARKER_R} className="fill-none stroke-divider" strokeWidth={1.5} strokeDasharray="3 3" />;
  }
  const content = player.jerseyNo !== null ? String(player.jerseyNo) : player.name.charAt(0).toUpperCase();
  return (
    <g>
      <circle
        cx={x}
        cy={y}
        r={MARKER_R}
        strokeWidth={2}
        className={duplicate ? "fill-rink-line-red stroke-signal" : "fill-surface stroke-ink"}
      />
      <text x={x} y={y} textAnchor="middle" dominantBaseline="central" className={`text-[11px] font-bold ${duplicate ? "fill-signal" : "fill-ink"}`}>
        {content}
      </text>
      <text x={x} y={y + MARKER_R + 12} textAnchor="middle" className="fill-ink-subtle text-[9px] font-semibold">
        {shortLabel(player.name)}
      </text>
    </g>
  );
}

/**
 * Lagindelningen ritad som ett ispass: målvakt i kassen, backpar framför målet,
 * kedjor upp mot anfallszonen — samma rumsliga logik som en riktig laguppställning
 * på is, istället för en textlista. Tar emot rader med tomma platser kvar (`null`)
 * så både adminredigeraren (alla platser synliga) och spelarvyn (bara ifyllda
 * rader) kan återanvända samma komponent.
 */
export function RinkLineup({
  forwardLines,
  defensePairs,
  goalies,
  playersById,
  duplicateIds,
}: {
  forwardLines: Slot[][];
  defensePairs: Slot[][];
  goalies: Slot[];
  playersById: Map<string, RinkPlayer>;
  duplicateIds?: Set<string>;
}) {
  if (forwardLines.length === 0 && defensePairs.length === 0 && goalies.length === 0) return null;

  const height = TOP_PAD + forwardLines.length * ROW_H + BLUE_LINE_GAP + defensePairs.length * ROW_H + GOALIE_BAND_H;
  const goalTopY = height - GOALIE_BAND_H;
  const goalLineY = height - GOALIE_BAND_H * 0.55;
  const blueLineY = goalTopY - defensePairs.length * ROW_H - BLUE_LINE_GAP / 2;
  const forwardZoneTop = goalTopY - defensePairs.length * ROW_H - BLUE_LINE_GAP;

  const isDup = (id: Slot) => Boolean(id && duplicateIds?.has(id));

  return (
    <svg viewBox={`0 0 ${WIDTH} ${height}`} className="mx-auto w-full max-w-xs" role="img" aria-hidden="true">
      <rect x={1} y={1} width={WIDTH - 2} height={height - 2} rx={20} className="fill-rink-board stroke-divider" strokeWidth={1.5} />

      {/* Anfallszonens kant, avskuren mot mittzonen */}
      <line x1={10} y1={8} x2={WIDTH - 10} y2={8} className="stroke-rink-line-red" strokeWidth={4} strokeLinecap="round" />

      {/* Blålinjen */}
      <line x1={6} y1={blueLineY} x2={WIDTH - 6} y2={blueLineY} className="stroke-rink-line-blue" strokeWidth={4} strokeLinecap="round" />

      {/* Tekningscirklar i försvarszonen */}
      {defensePairs.length > 0 ? (
        <>
          <circle cx={WIDTH * 0.26} cy={(blueLineY + goalTopY) / 2} r={24} className="fill-none stroke-rink-circle-red" strokeWidth={2} />
          <circle cx={WIDTH * 0.74} cy={(blueLineY + goalTopY) / 2} r={24} className="fill-none stroke-rink-circle-red" strokeWidth={2} />
        </>
      ) : null}

      {/* Målgård och mållinje */}
      <rect x={WIDTH / 2 - 34} y={goalLineY - 44} width={68} height={44} rx={14} className="fill-rink-crease stroke-rink-goalline" strokeWidth={1.5} />
      <line x1={WIDTH / 2 - 34} y1={goalLineY} x2={WIDTH / 2 + 34} y2={goalLineY} className="stroke-rink-goalline" strokeWidth={4} strokeLinecap="round" />

      {forwardLines.map((line, lineIndex) => {
        const y = forwardZoneTop - lineIndex * ROW_H - ROW_H / 2;
        return line.map((id, slotIndex) => (
          <Marker key={`f${lineIndex}-${slotIndex}`} id={id} x={slotX(slotIndex, line.length)} y={y} playersById={playersById} duplicate={isDup(id)} />
        ));
      })}

      {defensePairs.map((pair, pairIndex) => {
        const y = goalTopY - pairIndex * ROW_H - ROW_H / 2;
        return pair.map((id, slotIndex) => (
          <Marker key={`d${pairIndex}-${slotIndex}`} id={id} x={slotX(slotIndex, pair.length)} y={y} playersById={playersById} duplicate={isDup(id)} />
        ));
      })}

      {goalies.map((id, index) => (
        <Marker
          key={`g${index}`}
          id={id}
          x={WIDTH / 2 + (index - (goalies.length - 1) / 2) * 38}
          y={goalLineY - 20}
          playersById={playersById}
          duplicate={isDup(id)}
        />
      ))}
    </svg>
  );
}
