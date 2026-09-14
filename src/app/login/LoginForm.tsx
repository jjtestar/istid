"use client";

import { useActionState } from "react";
import { authenticate } from "@/app/login/actions";

export function LoginForm() {
  const [errorMessage, formAction, pending] = useActionState(authenticate, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <label className="block">
        <span className="mb-1.5 block text-sm font-bold text-ink">E-post (användarnamn)</span>
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          autoFocus
          className="h-12 w-full rounded-xl border border-divider bg-white px-3 text-base text-ink outline-none transition-colors focus:border-ink"
        />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-sm font-bold text-ink">Lösenord</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          minLength={8}
          className="h-12 w-full rounded-xl border border-divider bg-white px-3 text-base text-ink outline-none transition-colors focus:border-ink"
        />
      </label>

      {errorMessage ? (
        <p role="alert" aria-live="polite" className="rounded-xl bg-rink-line-red px-3 py-2.5 text-sm font-semibold text-signal">
          {errorMessage}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="h-12 w-full rounded-xl bg-ink px-5 text-base font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
      >
        {pending ? "Loggar in…" : "Logga in"}
      </button>
    </form>
  );
}
