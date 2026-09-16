"use client";

import { useActionState } from "react";
import { changePassword } from "@/app/min-profil/actions";

const inputClass =
  "h-12 w-full rounded-xl border border-divider bg-white px-3 text-base text-ink outline-none transition-colors focus:border-ink";

export function PasswordChangeForm() {
  const [state, formAction, pending] = useActionState(changePassword, undefined);

  return (
    <form action={formAction} className="mt-4 space-y-4">
      <label className="block">
        <span className="mb-1.5 block text-sm font-bold text-ink">Nuvarande lösenord</span>
        <input name="currentPassword" type="password" autoComplete="current-password" required className={inputClass} />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-bold text-ink">Nytt lösenord</span>
        <input name="newPassword" type="password" autoComplete="new-password" required minLength={8} className={inputClass} />
        <span className="mt-1 block text-xs text-ink-subtle">Minst 8 tecken, en bokstav och en siffra.</span>
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-bold text-ink">Upprepa nytt lösenord</span>
        <input name="newPasswordRepeat" type="password" autoComplete="new-password" required minLength={8} className={inputClass} />
      </label>

      {state?.error ? (
        <p role="alert" aria-live="polite" className="rounded-xl bg-rink-line-red px-3 py-2.5 text-sm font-semibold text-signal">
          {state.error}
        </p>
      ) : null}
      {state?.success ? (
        <p role="status" aria-live="polite" className="rounded-xl bg-rink-crease px-3 py-2.5 text-sm font-semibold text-success">
          {state.success}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="h-12 w-full rounded-xl bg-ink px-5 text-base font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
      >
        {pending ? "Sparar…" : "Byt lösenord"}
      </button>
    </form>
  );
}
