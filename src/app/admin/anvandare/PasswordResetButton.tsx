"use client";

import { useActionState } from "react";
import { createPasswordReset } from "@/app/admin/anvandare/actions";

export function PasswordResetButton({ userId }: { userId: string }) {
  const [state, action, pending] = useActionState(createPasswordReset, undefined);

  return (
    <div className="w-full">
      <form action={action}>
        <input type="hidden" name="userId" value={userId} />
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl border border-divider px-3 py-2 text-xs font-bold disabled:opacity-60"
        >
          {pending ? "Skapar…" : "Återställ lösenord"}
        </button>
      </form>
      {state?.error ? (
        <p role="alert" className="mt-2 rounded-xl bg-rink-line-red px-3 py-2 text-xs font-semibold text-signal">
          {state.error}
        </p>
      ) : null}
      {state?.reset ? (
        <div className="mt-2 rounded-xl border-2 border-signal bg-white p-4" aria-live="polite">
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-signal">
            Visa koden nu – den sparas inte i klartext
          </p>
          <p className="my-3 text-center text-3xl font-bold tracking-[0.28em] text-ink">{state.reset.code}</p>
          <p className="text-sm text-ink-muted">
            {state.reset.name}
            <br />
            {state.reset.email}
            <br />
            Giltig i 24 timmar · används på /aterstall
          </p>
        </div>
      ) : null}
    </div>
  );
}
