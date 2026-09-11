"use client";

import { useEffect, useState } from "react";
import { changeAppContext } from "@/app/actions";

type TeamOption = { name: string; slug: string };

export function ContextSwitcher({
  teams,
  seasons,
  selectedTeamSlug,
  selectedSeason,
}: {
  teams: TeamOption[];
  seasons: string[];
  selectedTeamSlug: string;
  selectedSeason: string;
}) {
  const [teamValue, setTeamValue] = useState(selectedTeamSlug);
  const [seasonValue, setSeasonValue] = useState(selectedSeason);

  useEffect(() => setTeamValue(selectedTeamSlug), [selectedTeamSlug]);
  useEffect(() => setSeasonValue(selectedSeason), [selectedSeason]);

  async function submitContext(formData: FormData) {
    await changeAppContext(formData);
    window.location.reload();
  }

  return (
    <form
      action={submitContext}
      className="grid grid-cols-2 gap-2 rounded-2xl border border-divider bg-white/[0.92] p-2 shadow-[0_8px_24px_rgb(13_59_102_/_0.07)] backdrop-blur-[2px]"
    >
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
    </form>
  );
}
