"use client";

export function SeasonSwitcher({ seasons, selectedSeason }: { seasons: string[]; selectedSeason: string }) {
  return (
    <form
      action="/kalender"
      method="get"
      className="flex items-center gap-2 rounded-2xl border border-divider bg-white/[0.92] p-2 backdrop-blur-[2px]"
    >
      <div className="flex items-center gap-2 px-1">
        <span className="h-4 w-1 rounded-full bg-signal" aria-hidden="true" />
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-ink-subtle">Säsong</p>
      </div>
      <label className="min-w-0 flex-1">
        <span className="sr-only">Säsong</span>
        <select
          aria-label="Säsong"
          name="sasong"
          defaultValue={selectedSeason}
          className="h-11 w-full rounded-xl border border-divider bg-white px-3 text-[15px] font-bold text-ink outline-none focus:border-ink"
          onChange={(event) => event.currentTarget.form?.requestSubmit()}
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
