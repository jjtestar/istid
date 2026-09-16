"use server";

import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { signIn } from "@/lib/auth";
import { normalizeEmail } from "@/lib/invite-security";
import { guardAttempts, RATE_LIMIT_MESSAGE } from "@/lib/rate-limit";
import { safeCallbackUrl } from "@/lib/safe-redirect";

export async function authenticate(
  _previousState: string | undefined,
  formData: FormData,
): Promise<string | undefined> {
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const destination = safeCallbackUrl(String(formData.get("callbackUrl") ?? "/"));
  const attempts = await guardAttempts("login", email);

  if (attempts.blocked) return RATE_LIMIT_MESSAGE;

  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      await attempts.fail();
      return "Fel e-postadress eller lösenord.";
    }
    throw error;
  }

  await attempts.succeed();
  redirect(destination);
}
