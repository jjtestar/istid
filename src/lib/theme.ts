import { findActiveSessionUser } from "@/lib/current-user";

export const APP_THEMES = ["classic", "mint"] as const;
export type AppTheme = (typeof APP_THEMES)[number];

export function normalizeTheme(value: string | null | undefined): AppTheme {
  return APP_THEMES.includes(value as AppTheme) ? (value as AppTheme) : "classic";
}

/**
 * Reuses the render-pass-memoised account lookup, so the root layout doesn't
 * add a second user query on top of the one the page itself makes.
 */
export async function getThemePreference(): Promise<AppTheme> {
  const user = await findActiveSessionUser();
  return normalizeTheme(user?.theme);
}
