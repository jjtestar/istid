"use client";

export function TeamFilterSelect({ teams, selectedTeamId }: { teams: { id: string; label: string }[]; selectedTeamId: string }) {
  return (
    <select
      name="lag"
      defaultValue={selectedTeamId}
      className="h-11 w-full rounded-xl border border-divider bg-white px-3 text-base outline-none focus:border-ink"
      onChange={(e) => e.currentTarget.form?.requestSubmit()}
    >
      <option value="">Alla lag</option>
      {teams.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
    </select>
  );
}
