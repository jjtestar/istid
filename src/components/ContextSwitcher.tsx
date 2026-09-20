"use client";

import { useEffect, useState } from "react";
import { changeAppContext } from "@/app/actions";

type TeamOption = { name: string; slug: string };

export function ContextSwitcher({
  teams,
  seasons,
  selectedTeamSlug,
  selectedSeason,
  showSeason = true,
}: {
  teams: TeamOption[];
  seasons: string[];
  selectedTeamSlug: string;
  selectedSeason: string;
  showSeason?: boolean;
}) {
  const [teamValue, setTeamValue] = useState(selectedTeamSlug);
  const [seasonValue, setSeasonValue] = useState(selectedSeason);

  useEffect(() => setTeamValue(selectedTeamSlug), [selectedTeamSlug]);
  useEffect(() => setSeasonValue(selectedSeason), [selectedSeason]);

  async function submitContext(formData: FormData) {
    await changeAppContext(formData);
    window.location.reload();
  }

  // A select with a single option is just noise: players who belong to one team
  // only get the season picker, and if there is nothing at all to pick between
  // the whole card disappears.
  const showTeam = teams.length > 1;
  const showSeasonSelect = showSeason && seasons.length > 1;

  if (!showTeam && !showSeasonSelect) return null;

  const label = showTeam && showSeasonSelect ? "Välj: Lag och Säsong" : showTeam ? "Välj lag" : "Välj säsong";

  return (
    <form
      action={submitContext}
      className={`${showTeam && showSeasonSelect ? "grid grid-cols-[minmax(0,1.35fr)_minmax(0,0.75fr)]" : ""} gap-2 rounded-2xl border border-divider bg-white/[0.92] p-2 backdrop-blur-[2px]`}
    >
      <div className={`${showTeam && showSeasonSelect ? "col-span-2" : ""} flex items-center gap-2 px-1 pt-1`}>
        <span className="h-4 w-1 rounded-full bg-signal" aria-hidden="true" />
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-ink-subtle">{label}</p>
      </div>
      {showTeam ? (
        <label className="min-w-0">
          <span className="sr-only">Lag</span>
          <select
            aria-label="Lag"
            className="h-11 w-full rounded-xl border border-divider bg-white px-3 text-[15px] font-bold text-ink outline-none focus:border-ink"
            value={teamValue}
            name="teamSlug"
            onChange={(event) => {
              setTeamValue(event.currentTarget.value);
              event.currentTarget.form?.requestSubmit();
            }}
          >
            {teams.map((team) => (
              <option key={team.slug} value={team.slug}>
                {team.name}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <input type="hidden" name="teamSlug" value={teamValue} />
      )}
      {showSeasonSelect ? (
        <label className="min-w-0">
          <span className="sr-only">Säsong</span>
          <select
            aria-label="Säsong"
            className="h-11 w-full rounded-xl border border-divider bg-white px-3 text-[15px] font-bold text-ink outline-none focus:border-ink"
            value={seasonValue}
            name="season"
            onChange={(event) => {
              setSeasonValue(event.currentTarget.value);
              event.currentTarget.form?.requestSubmit();
            }}
          >
            {seasons.map((season) => (
              <option key={season} value={season}>
                {season}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <input type="hidden" name="season" value={seasonValue} />
      )}
    </form>
  );
}
