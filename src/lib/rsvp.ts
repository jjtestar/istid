/**
 * Shared RSVP vocabulary for the Anmälan flow. Lives outside the `"use server"`
 * action module so client components can import the types and the reason labels
 * without pulling a server bundle into the browser.
 */

export type RsvpStatus = "GOING" | "NOT_GOING" | "MAYBE" | null;

export type RsvpResult = { ok: true } | { ok: false; error: string };

/** A Server Action that records one RSVP, as handed to the client controls. */
export type RsvpAction = (formData: FormData) => Promise<RsvpResult>;

export const ABSENCE_REASONS = [
  { value: "TIRED", label: "Trött" },
  { value: "SICK", label: "Sjuk" },
  { value: "VACATION", label: "Semester" },
  { value: "OTHER", label: "Annat" },
] as const;

export const ABSENCE_REASON_LABELS: Record<string, string> = Object.fromEntries(
  ABSENCE_REASONS.map((reason) => [reason.value, reason.label]),
);

export const RSVP_NETWORK_ERROR = "Kunde inte spara – kontrollera anslutningen och försök igen.";
