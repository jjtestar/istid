"use client";

import Link from "next/link";
import { useActionState } from "react";
import { registerUser } from "@/app/registrera/actions";

const inputClass = "h-12 w-full rounded-xl border border-divider bg-white px-3 text-base text-ink outline-none transition-colors focus:border-ink";

export function RegistrationForm() {
  const [state, formAction, pending] = useActionState(registerUser, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <label className="block">
        <span className="mb-1.5 block text-sm font-bold text-ink">Namn</span>
        <input name="name" autoComplete="name" required minLength={2} maxLength={80} className={inputClass} />
        {state?.fieldErrors?.name ? <span className="mt-1 block text-sm text-signal">{state.fieldErrors.name}</span> : null}
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-bold text-ink">E-post</span>
        <input name="email" type="email" autoComplete="email" required className={inputClass} />
        {state?.fieldErrors?.email ? <span className="mt-1 block text-sm text-signal">{state.fieldErrors.email}</span> : null}
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-bold text-ink">Välj lösenord</span>
        <input name="password" type="password" autoComplete="new-password" required minLength={8} className={inputClass} />
        <span className="mt-1 block text-xs text-ink-subtle">Minst 8 tecken, en bokstav och en siffra.</span>
        {state?.fieldErrors?.password ? <span className="mt-1 block text-sm text-signal">{state.fieldErrors.password}</span> : null}
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-bold text-ink">Din PIN-kod</span>
        <input name="pin" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}|[0-9]{8}" minLength={6} maxLength={8} required className={`${inputClass} text-center text-xl font-bold tracking-[0.35em]`} />
        {state?.fieldErrors?.pin ? <span className="mt-1 block text-sm text-signal">{state.fieldErrors.pin}</span> : null}
      </label>
      <label className="flex items-start gap-3 rounded-xl border border-divider bg-rink-crease p-3">
        <input name="ageConfirmed" value="yes" type="checkbox" required className="mt-1 h-5 w-5 accent-signal" />
        <span className="text-sm leading-5 text-ink">Jag bekräftar att jag är minst 18 år och accepterar <Link href="/integritet" className="font-bold underline">integritetspolicyn</Link>.</span>
      </label>
      {state?.fieldErrors?.age ? <p className="text-sm text-signal">{state.fieldErrors.age}</p> : null}
      {state?.error ? <p role="alert" aria-live="polite" className="rounded-xl bg-rink-line-red px-3 py-2.5 text-sm font-semibold text-signal">{state.error}</p> : null}
      <button type="submit" disabled={pending} className="h-12 w-full rounded-xl bg-ink px-5 text-base font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-60">
        {pending ? "Skapar konto…" : "Skapa konto"}
      </button>
      <p className="text-center text-sm text-ink-muted">
        Har du redan ett konto? <Link href="/login" className="font-bold text-ink underline underline-offset-4">Logga in</Link>
      </p>
    </form>
  );
}
