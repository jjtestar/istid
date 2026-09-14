import { cache } from "react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const APP_THEMES = ["classic", "mint"] as const;
export type AppTheme = (typeof APP_THEMES)[number];

export function normalizeTheme(value: string | null | undefined): AppTheme {
  return APP_THEMES.includes(value as AppTheme) ? (value as AppTheme) : "classic";
}

export const getThemePreference = cache(async (): Promise<AppTheme> => {
  const session = await auth();
  if (!session?.user?.email) return "classic";

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { theme: true },
  });

  return normalizeTheme(user?.theme);
});
