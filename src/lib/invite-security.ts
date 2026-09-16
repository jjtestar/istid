import { createHmac, randomInt } from "node:crypto";

/**
 * PINs are generated with 8 digits (10^8 combinations). Six-digit codes handed
 * out before that change are still accepted so invitations already in people's
 * hands keep working until they expire.
 */
const PIN_DIGITS = 8;
const LEGACY_PIN_DIGITS = 6;

export type HashPurpose =
  | "invite"
  | "password-reset"
  | "registration-attempt"
  | "login-attempt"
  | "password-reset-attempt"
  | "password-change-attempt"
  | "ip-attempt";

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value) throw new Error("AUTH_SECRET måste vara konfigurerad.");
  return value;
}

export function normalizeEmail(value: string) {
  return value.trim().toLocaleLowerCase("sv-SE");
}

export function normalizePin(value: string) {
  return value.replace(/\D/g, "");
}

export function isValidPinShape(pin: string) {
  return pin.length === PIN_DIGITS || pin.length === LEGACY_PIN_DIGITS;
}

/** A fresh PIN from a cryptographically secure source. */
export function generatePin() {
  return String(randomInt(0, 10 ** PIN_DIGITS)).padStart(PIN_DIGITS, "0");
}

export function secureHash(value: string, purpose: HashPurpose) {
  return createHmac("sha256", secret()).update(`${purpose}:${value}`).digest("hex");
}
