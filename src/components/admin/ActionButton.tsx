"use client";

import { useActionState } from "react";

type ActionState = { error?: string; success?: string } | undefined;

/**
 * A single-button admin action (toggle access, change role, …) with visible
 * pending/error/success feedback — unlike a raw `<form action={fn}>`, which
 * fails or no-ops silently when the server rejects the change.
 */
export function ActionButton({
  action,
  fields,
  label,
  className,
  disabled,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState> | ActionState;
  fields: Record<string, string>;
  label: string;
  className: string;
  disabled?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  return (
    <div>
      <form action={formAction}>
        {Object.entries(fields).map(([key, value]) => (
          <input key={key} type="hidden" name={key} value={value} />
        ))}
        <button type="submit" disabled={disabled || pending} className={className}>
          {pending ? "…" : label}
        </button>
      </form>
      {state?.error ? (
        <p role="alert" className="mt-1 text-xs font-semibold text-signal">
          {state.error}
        </p>
      ) : null}
      {state?.success ? (
        <p role="status" className="mt-1 text-xs font-semibold text-success">
          {state.success}
        </p>
      ) : null}
    </div>
  );
}
