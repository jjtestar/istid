"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/lib/auth";

export async function authenticate(
  _previousState: string | undefined,
  formData: FormData,
): Promise<string | undefined> {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return "Fel e-postadress eller lösenord.";
    }
    throw error;
  }
}
