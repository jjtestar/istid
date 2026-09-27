"use client";

import Link from "next/link";
import { useActionState } from "react";
import { resetPassword } from "@/app/aterstall-losenord/actions";

const inputClass = "h-12 w-full rounded-xl border border-divider bg-white px-3 text-base text-ink outline-none transition-colors focus:border-ink";

export function ResetPasswordForm() {
  const [state, formAction, pending] = useActionState(resetPassword, undefined);

  if (state?.success) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-base font-bold text-ink">Lösenordet är återställt.</p>
        <Link href="/login" className="inline-block h-12 rounded-xl bg-ink px-5 text-base font-bold leading-[3rem] text-white">
          Logga in
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <label className="block">
        <span className="mb-1.5 block text-sm font-bold text-ink">E-post</span>
        <input name="email" type="email" autoComplete="email" required className={inputClass} />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-bold text-ink">Kod från din admin</span>
        <input
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]{6}"
          maxLength={6}
          required
          className={`${inputClass} text-center text-xl font-bold tracking-[0.35em]`}
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-bold text-ink">Nytt lösenord</span>
        <input name="password" type="password" autoComplete="new-password" required minLength={8} className={inputClass} />
        <span className="mt-1 block text-xs text-ink-subtle">Minst 8 tecken, en bokstav och en siffra.</span>
      </label>
      {state?.error ? (
        <p role="alert" aria-live="polite" className="rounded-xl bg-rink-line-red px-3 py-2.5 text-sm font-semibold text-signal">
          {state.error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="h-12 w-full rounded-xl bg-ink px-5 text-base font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
      >
        {pending ? "Sparar…" : "Byt lösenord"}
      </button>
      <p className="text-center text-sm text-ink-muted">
        Kom du på lösenordet?{" "}
        <Link href="/login" className="font-bold text-ink underline underline-offset-4">
          Logga in
        </Link>
      </p>
    </form>
  );
}
