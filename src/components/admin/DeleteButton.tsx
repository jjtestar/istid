"use client";

import { useActionState, useState } from "react";

type FormState = { error?: string; success?: string } | undefined;

/**
 * Two-step confirmation for irreversible or cascading admin deletes. The
 * button only reveals the real submit control on first click, named for
 * exactly what disappears, so a single stray tap can't remove RSVPs, match
 * stats or a lineup with nothing to undo it.
 */
export function DeleteButton({
  action,
  idField,
  idValue,
  label,
  confirmText,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState> | FormState;
  idField: string;
  idValue: string;
  label: string;
  confirmText: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [state, formAction, pending] = useActionState(action, undefined);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="h-10 w-full rounded-xl border border-signal text-sm font-bold text-signal"
      >
        {label}
      </button>
    );
  }

  return (
    <div className="space-y-2 rounded-xl border border-signal bg-rink-line-red/40 p-3">
      <p className="text-sm font-semibold text-signal">{confirmText}</p>
      {state?.error ? (
        <p role="alert" className="text-sm font-semibold text-signal">
          {state.error}
        </p>
      ) : null}
      <form action={formAction} className="flex gap-2">
        <input type="hidden" name={idField} value={idValue} />
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="h-10 flex-1 rounded-xl border border-divider text-sm font-bold text-ink"
        >
          Avbryt
        </button>
        <button
          type="submit"
          disabled={pending}
          className="h-10 flex-1 rounded-xl bg-signal text-sm font-bold text-white disabled:opacity-60"
        >
          {pending ? "Tar bort…" : "Bekräfta borttagning"}
        </button>
      </form>
    </div>
  );
}
