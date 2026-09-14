import { createHmac } from "node:crypto";

function secret() {
  const value = process.env.AUTH_SECRET ?? process.env.DATABASE_URL;
  if (!value) throw new Error("AUTH_SECRET eller DATABASE_URL måste vara konfigurerad.");
  return value;
}

export function normalizeEmail(value: string) {
  return value.trim().toLocaleLowerCase("sv-SE");
}

export function normalizePin(value: string) {
  return value.replace(/\D/g, "");
}

export function secureHash(value: string, purpose: "invite" | "registration-attempt" | "login-attempt") {
  return createHmac("sha256", secret()).update(`${purpose}:${value}`).digest("hex");
}
