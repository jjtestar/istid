"use client";

import { useOptimistic, useState, useTransition } from "react";
import { StatusLabel } from "@/components/ui";
import { RSVP_NETWORK_ERROR, type RsvpAction } from "@/lib/rsvp";

/**
 * One-tap "Anmäl mig" for the compact activity rows. Switches to "Anmäld" on
 * the tap rather than after the roundtrip, and cannot be tapped twice while the
 * Server Action is still running.
 */
export function RsvpQuickButton({
  action,
  idField,
  idValue,
  going,
}: {
  action: RsvpAction;
  idField: string;
  idValue: string;
  going: boolean;
}) {
  const [optimisticGoing, applyGoing] = useOptimistic(going, (_current, next: boolean) => next);
  const [isSaving, startSaving] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (optimisticGoing) {
    return (
      <span aria-busy={isSaving} className={isSaving ? "opacity-60" : undefined}>
        <StatusLabel tone="success">Anmäld</StatusLabel>
      </span>
    );
  }

  return (
    <span className="flex flex-col items-end">
      <button
        type="button"
        disabled={isSaving}
        onClick={() => {
          setError(null);
          startSaving(async () => {
            applyGoing(true);
            const formData = new FormData();
            formData.set(idField, idValue);
            formData.set("status", "GOING");
            try {
              const result = await action(formData);
              if (!result?.ok) setError(result?.error ?? RSVP_NETWORK_ERROR);
            } catch {
              setError(RSVP_NETWORK_ERROR);
            }
          });
        }}
        className="min-h-11 min-w-11 rounded-lg px-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
      >
        <StatusLabel tone="signal">Anmäl mig</StatusLabel>
      </button>
      {error ? (
        <span role="alert" className="max-w-[12rem] text-right text-[11px] font-semibold text-signal">
          {error}
        </span>
      ) : null}
    </span>
  );
}
