"use client";

import { useActionState } from "react";
import { createPasswordResetCode } from "@/app/admin/anvandare/actions";

/** Issues a one-time password-reset code for a locked-out player. Shown once, never stored in plaintext. */
export function ResetCodeButton({ userId }: { userId: string }) {
  const [state, formAction, pending] = useActionState(createPasswordResetCode, undefined);
  return (
    <div>
      <form action={formAction}>
        <input type="hidden" name="userId" value={userId} />
        <button type="submit" disabled={pending} className="rounded-xl border border-divider px-3 py-2 text-xs font-bold">
          {pending ? "Skapar…" : "Återställningskod"}
        </button>
      </form>
      {state?.error ? (
        <p role="alert" className="mt-1 text-xs font-semibold text-signal">
          {state.error}
        </p>
      ) : null}
      {state?.code ? (
        <div className="mt-2 rounded-xl border-2 border-signal bg-white p-3" aria-live="polite">
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-signal">Visa koden nu – den sparas inte i klartext</p>
          <p className="my-2 text-center text-2xl font-bold tracking-[0.28em] text-ink">{state.code}</p>
          <p className="text-xs text-ink-muted">Giltig i 24 timmar. Spelaren anger den på /aterstall-losenord.</p>
        </div>
      ) : null}
    </div>
  );
}
