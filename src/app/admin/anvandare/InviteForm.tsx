"use client";

import { useActionState } from "react";
import { createInvite } from "@/app/admin/anvandare/actions";

export function InviteForm({ teams }: { teams: { id: string; label: string }[] }) {
  const [state, action, pending] = useActionState(createInvite, undefined);
  return (
    <div>
      <form action={action} className="mt-4 space-y-3">
        <label className="block">
          <span className="mb-1.5 block text-sm font-bold text-ink">Spelarens e-post</span>
          <input name="email" type="email" required className="h-12 w-full rounded-xl border border-divider bg-white px-3 text-base outline-none focus:border-ink" />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-bold text-ink">Lag och säsong</span>
          <select name="teamId" required className="h-12 w-full rounded-xl border border-divider bg-white px-3 text-base outline-none focus:border-ink">
            {teams.map((team) => <option key={team.id} value={team.id}>{team.label}</option>)}
          </select>
        </label>
        {state?.error ? <p role="alert" className="rounded-xl bg-rink-line-red px-3 py-2.5 text-sm font-semibold text-signal">{state.error}</p> : null}
        <button type="submit" disabled={pending} className="h-12 w-full rounded-xl bg-ink px-5 font-bold text-white disabled:opacity-60">
          {pending ? "Skapar…" : "Skapa personlig PIN-kod"}
        </button>
      </form>
      {state?.invite ? (
        <div className="mt-4 rounded-xl border-2 border-signal bg-white p-4" aria-live="polite">
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-signal">Visa koden nu – den sparas inte i klartext</p>
          <p className="my-3 text-center text-3xl font-bold tracking-[0.28em] text-ink">{state.invite.code}</p>
          <p className="text-sm text-ink-muted">{state.invite.email}<br />{state.invite.team}<br />Giltig i 14 dagar</p>
        </div>
      ) : null}
    </div>
  );
}
