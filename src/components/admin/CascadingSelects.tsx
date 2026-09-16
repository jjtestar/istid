"use client";

import { useState } from "react";

const field = "h-11 w-full rounded-xl border border-divider bg-white px-3 text-base outline-none focus:border-ink";

type Team = { id: string; label: string };
type ScopedItem = { id: string; teamId: string; label: string };

/** Lag → spelare, för formulär som bara behöver en spelare inom ett valt lag (t.ex. betalningar). */
export function TeamPlayerSelect({
  teams,
  players,
  name,
}: {
  teams: Team[];
  players: ScopedItem[];
  name: string;
}) {
  const [teamId, setTeamId] = useState(teams[0]?.id ?? "");
  const filtered = players.filter((p) => p.teamId === teamId);
  return (
    <>
      <select aria-label="Lag" value={teamId} onChange={(e) => setTeamId(e.target.value)} className={field}>
        {teams.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
      </select>
      <select name={name} required className={field}>
        {filtered.length === 0
          ? <option value="">Inga spelare i valt lag</option>
          : filtered.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
      </select>
    </>
  );
}

type ActivityOption = { id: string; teamId: string; label: string; kind: "training" | "match" };

/**
 * Lag → valfri aktivitet (träning ELLER match, eller ingen alls). Skickar ett
 * kombinerat värde "training:<id>" / "match:<id>" / "" i fältet `name` — t.ex.
 * för att koppla en highlight till en specifik träning eller match.
 */
export function TeamOptionalActivitySelect({
  teams,
  activities,
  name,
  teamFieldName = "teamId",
}: {
  teams: Team[];
  activities: ActivityOption[];
  name: string;
  teamFieldName?: string;
}) {
  const [teamId, setTeamId] = useState(teams[0]?.id ?? "");
  const filtered = activities.filter((a) => a.teamId === teamId);
  return (
    <>
      <select aria-label="Lag" name={teamFieldName} value={teamId} onChange={(e) => setTeamId(e.target.value)} className={field}>
        {teams.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
      </select>
      <select name={name} className={field} defaultValue="">
        <option value="">Ingen specifik aktivitet</option>
        {filtered.map((a) => (
          <option key={`${a.kind}:${a.id}`} value={`${a.kind}:${a.id}`}>
            {a.kind === "training" ? "Träning" : "Match"} · {a.label}
          </option>
        ))}
      </select>
    </>
  );
}

const HIGHLIGHT_TYPES = [
  { value: "GOAL", label: "Mål" },
  { value: "SAVE", label: "Räddning" },
  { value: "BLOOPER", label: "Blooper" },
  { value: "OTHER", label: "Övrigt" },
] as const;

function PlayerCheckboxes({ label, name, players }: { label: string; name: string; players: ScopedItem[] }) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-bold uppercase tracking-[0.08em] text-ink-subtle">{label}</p>
      {players.length === 0 ? (
        <p className="text-sm text-ink-subtle">Inga spelare i valt lag</p>
      ) : (
        <div className="grid max-h-40 gap-1.5 overflow-y-auto rounded-xl border border-divider p-2 sm:grid-cols-2">
          {players.map((p) => (
            <label key={p.id} className="flex items-center gap-2 rounded-lg px-2 py-1 text-sm has-[:checked]:bg-rink-crease">
              <input type="checkbox" name={name} value={p.id} className="h-4 w-4" />
              {p.label}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Lag → typ av klipp → (valfri aktivitet + taggade spelare), för att lägga till
 * highlights. Vilka spelarfält som visas beror på vald typ: mål ger målskytt/assist,
 * räddning ger målvakt, medan blooper/övrigt inte kräver några spelare.
 */
export function HighlightFieldsSelect({
  teams,
  activities,
  players,
}: {
  teams: Team[];
  activities: ActivityOption[];
  players: ScopedItem[];
}) {
  const [teamId, setTeamId] = useState(teams[0]?.id ?? "");
  const [type, setType] = useState<(typeof HIGHLIGHT_TYPES)[number]["value"]>("GOAL");
  const filteredActivities = activities.filter((a) => a.teamId === teamId);
  const filteredPlayers = players.filter((p) => p.teamId === teamId);

  return (
    <>
      <select aria-label="Lag" name="teamId" value={teamId} onChange={(e) => setTeamId(e.target.value)} className={field}>
        {teams.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
      </select>
      <select aria-label="Typ av klipp" name="type" value={type} onChange={(e) => setType(e.target.value as typeof type)} className={field}>
        {HIGHLIGHT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
      </select>
      <select name="activity" className={`${field} lg:col-span-2`} defaultValue="">
        <option value="">Ingen specifik aktivitet</option>
        {filteredActivities.map((a) => (
          <option key={`${a.kind}:${a.id}`} value={`${a.kind}:${a.id}`}>
            {a.kind === "training" ? "Träning" : "Match"} · {a.label}
          </option>
        ))}
      </select>
      {type === "GOAL" ? (
        <div className="grid gap-3 lg:col-span-2 sm:grid-cols-2">
          <PlayerCheckboxes label="Målskytt" name="scorerIds" players={filteredPlayers} />
          <PlayerCheckboxes label="Assist" name="assistIds" players={filteredPlayers} />
        </div>
      ) : null}
      {type === "SAVE" ? (
        <div className="lg:col-span-2">
          <PlayerCheckboxes label="Målvakt" name="goalkeeperIds" players={filteredPlayers} />
        </div>
      ) : null}
    </>
  );
}

/** Lag → (aktivitet + spelare), där båda listorna filtreras av samma lagval (t.ex. matchstatistik/närvaro). */
export function TeamActivityPlayerSelect({
  teams,
  activities,
  players,
  activityName,
  activityLabel,
  playerName = "userId",
}: {
  teams: Team[];
  activities: ScopedItem[];
  players: ScopedItem[];
  activityName: string;
  activityLabel: string;
  playerName?: string;
}) {
  const [teamId, setTeamId] = useState(teams[0]?.id ?? "");
  const filteredActivities = activities.filter((a) => a.teamId === teamId);
  const filteredPlayers = players.filter((p) => p.teamId === teamId);
  return (
    <>
      <select aria-label="Lag" value={teamId} onChange={(e) => setTeamId(e.target.value)} className={field}>
        {teams.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
      </select>
      <select name={activityName} required className={field}>
        {filteredActivities.length === 0
          ? <option value="">{`Inga ${activityLabel} i valt lag`}</option>
          : filteredActivities.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
      </select>
      <select name={playerName} required className={field}>
        {filteredPlayers.length === 0
          ? <option value="">Inga spelare i valt lag</option>
          : filteredPlayers.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
      </select>
    </>
  );
}
