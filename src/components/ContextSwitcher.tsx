"use client";

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
  // The selects are uncontrolled on purpose: submitting reloads the whole page,
  // so the server-rendered defaults are always the source of truth and there is
  // no local state to keep in sync with the props.
  async function submitContext(formData: FormData) {
    await changeAppContext(formData);
    window.location.reload();
  }

  return (
    <form
      action={submitContext}
      className={`${showSeason ? "grid grid-cols-[minmax(0,1.35fr)_minmax(0,0.75fr)]" : ""} gap-2 rounded-2xl border border-divider bg-white/[0.92] p-2 backdrop-blur-[2px]`}
    >
      <div className={`${showSeason ? "col-span-2" : ""} flex items-center gap-2 px-1 pt-1`}>
        <span className="h-4 w-1 rounded-full bg-signal" aria-hidden="true" />
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-ink-subtle">
          {showSeason ? "Välj: Lag och Säsong" : "Välj lag"}
        </p>
      </div>
      <label className="min-w-0">
        <span className="sr-only">Lag</span>
        <select
          aria-label="Lag"
          className="h-11 w-full rounded-xl border border-divider bg-white px-3 text-[15px] font-bold text-ink outline-none focus:border-ink"
          defaultValue={selectedTeamSlug}
          name="teamSlug"
          onChange={(event) => event.currentTarget.form?.requestSubmit()}
        >
          {teams.map((team) => (
            <option key={team.slug} value={team.slug}>
              {team.name}
            </option>
          ))}
        </select>
      </label>
      {showSeason ? (
        <label className="min-w-0">
          <span className="sr-only">Säsong</span>
          <select
            aria-label="Säsong"
            className="h-11 w-full rounded-xl border border-divider bg-white px-3 text-[15px] font-bold text-ink outline-none focus:border-ink"
            defaultValue={selectedSeason}
            name="season"
            onChange={(event) => event.currentTarget.form?.requestSubmit()}
          >
            {seasons.map((season) => (
              <option key={season} value={season}>
                {season}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <input type="hidden" name="season" value={selectedSeason} />
      )}
    </form>
  );
}
