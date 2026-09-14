export const FORWARD_LINES = 4;
export const FORWARD_SLOTS = 3;
export const DEFENSE_PAIRS = 3;
export const DEFENSE_SLOTS = 2;
export const GOALIE_SLOTS = 2;

export type LineupData = {
  forwardLines: (string | null)[][];
  defensePairs: (string | null)[][];
  goalies: (string | null)[];
};

export function emptyLineup(): LineupData {
  return {
    forwardLines: Array.from({ length: FORWARD_LINES }, () => Array(FORWARD_SLOTS).fill(null)),
    defensePairs: Array.from({ length: DEFENSE_PAIRS }, () => Array(DEFENSE_SLOTS).fill(null)),
    goalies: Array(GOALIE_SLOTS).fill(null),
  };
}

function isSlotGrid(grid: unknown, rows: number, cols: number, rosterIds: Set<string>): grid is (string | null)[][] {
  return (
    Array.isArray(grid) &&
    grid.length === rows &&
    grid.every(
      (row) =>
        Array.isArray(row) &&
        row.length === cols &&
        row.every((cell) => cell === null || (typeof cell === "string" && rosterIds.has(cell))),
    )
  );
}

export function isValidLineupData(data: unknown, rosterIds: Set<string>): data is LineupData {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  return (
    isSlotGrid(d.forwardLines, FORWARD_LINES, FORWARD_SLOTS, rosterIds) &&
    isSlotGrid(d.defensePairs, DEFENSE_PAIRS, DEFENSE_SLOTS, rosterIds) &&
    Array.isArray(d.goalies) &&
    d.goalies.length === GOALIE_SLOTS &&
    d.goalies.every((g) => g === null || (typeof g === "string" && rosterIds.has(g)))
  );
}
