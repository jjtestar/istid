"use client";

import { ReactNode } from "react";
import { useActionState } from "react";

export type FormState = { error?: string; success?: string } | undefined;

export function AdminForm({
  action,
  children,
  submitLabel,
  pendingLabel,
  className = "space-y-3",
  submitClassName = "h-11 w-full rounded-xl bg-ink font-bold text-white disabled:opacity-60",
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState> | FormState;
  children: ReactNode;
  submitLabel: string;
  pendingLabel?: string;
  className?: string;
  submitClassName?: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  return (
    <form action={formAction} className={className}>
      {children}
      {state?.error ? (
        <p role="alert" className="rounded-xl bg-rink-line-red px-3 py-2.5 text-sm font-semibold text-signal">
          {state.error}
        </p>
      ) : null}
      {state?.success ? (
        <p role="status" className="rounded-xl bg-rink-crease px-3 py-2.5 text-sm font-semibold text-success">
          {state.success}
        </p>
      ) : null}
      <button type="submit" disabled={pending} className={submitClassName}>
        {pending ? (pendingLabel ?? "Sparar…") : submitLabel}
      </button>
    </form>
  );
}
