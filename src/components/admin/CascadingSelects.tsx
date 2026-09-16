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

const HIGHLIGHT_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "GOAL", label: "Mål" },
  { value: "SAVE", label: "Räddning" },
  { value: "BLOOPER", label: "Tavlan" },
  { value: "OTHER", label: "Övrigt" },
];

/**
 * Lag → (valfri aktivitet + klipptyp + taggade spelare per roll), allt filtrerat
 * på samma lagval. Används för highlight-formuläret där ett klipp kan taggas
 * med målskytt(ar), assist och/eller målvakt ur det valda lagets trupp.
 */
export function TeamHighlightFields({
  teams,
  activities,
  players,
}: {
  teams: Team[];
  activities: ActivityOption[];
  players: ScopedItem[];
}) {
  const [teamId, setTeamId] = useState(teams[0]?.id ?? "");
  const filteredActivities = activities.filter((a) => a.teamId === teamId);
  const filteredPlayers = players.filter((p) => p.teamId === teamId);
  const multi = `${field} h-auto min-h-[6.5rem] py-2`;

  return (
    <>
      <select aria-label="Lag" name="teamId" value={teamId} onChange={(e) => setTeamId(e.target.value)} className={field}>
        {teams.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
      </select>
      <select name="activity" className={field} defaultValue="">
        <option value="">Ingen specifik aktivitet</option>
        {filteredActivities.map((a) => (
          <option key={`${a.kind}:${a.id}`} value={`${a.kind}:${a.id}`}>
            {a.kind === "training" ? "Träning" : "Match"} · {a.label}
          </option>
        ))}
      </select>
      <label className="block text-sm font-bold text-ink-subtle lg:col-span-2">
        Typ av klipp
        <select name="type" defaultValue="GOAL" className={`${field} mt-1`}>
          {HIGHLIGHT_TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </label>
      <label className="block text-sm font-bold text-ink-subtle">
        Målskytt(ar)
        <select name="scorers" multiple className={`${multi} mt-1`}>
          {filteredPlayers.length === 0
            ? <option value="" disabled>Inga spelare i valt lag</option>
            : filteredPlayers.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
        </select>
      </label>
      <label className="block text-sm font-bold text-ink-subtle">
        Assist
        <select name="assists" multiple className={`${multi} mt-1`}>
          {filteredPlayers.length === 0
            ? <option value="" disabled>Inga spelare i valt lag</option>
            : filteredPlayers.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
        </select>
      </label>
      <label className="block text-sm font-bold text-ink-subtle">
        Målvakt
        <select name="goalkeepers" multiple className={`${multi} mt-1`}>
          {filteredPlayers.length === 0
            ? <option value="" disabled>Inga spelare i valt lag</option>
            : filteredPlayers.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
        </select>
      </label>
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
