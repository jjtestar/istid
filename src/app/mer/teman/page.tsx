import Link from "next/link";
import { ChevronIcon } from "@/components/icons";
import { PageHeader } from "@/components/PageHeader";
import { getCurrentUser } from "@/lib/current-user";
import { normalizeTheme, type AppTheme } from "@/lib/theme";
import { setTheme } from "./actions";

const themes: Array<{
  id: AppTheme;
  name: string;
  swatches: string[];
}> = [
  {
    id: "classic",
    name: "Ljus",
    swatches: ["#FFFFFF", "#0D3B66", "#C1121F", "#1B7F5C"],
  },
  {
    id: "mint",
    name: "Mörk",
    swatches: ["#0D1416", "#162223", "#A1E6D4", "#C9A979"],
  },
];

export default async function ThemesPage() {
  const user = await getCurrentUser();
  const selectedTheme = normalizeTheme(user.theme);

  return (
    <div>
      <PageHeader title="Teman" />
      <main className="space-y-5 px-5 pb-10">
        <Link
          href="/mer"
          className="inline-flex items-center gap-1 text-sm font-bold text-ink-muted transition-colors hover:text-ink"
        >
          <ChevronIcon className="h-4 w-4 rotate-180" /> Tillbaka till Mer
        </Link>

        <p className="text-sm text-ink-muted">
          Välj hur Femtekedjan ska se ut. Ditt val sparas på ditt konto och följer med mellan enheter.
        </p>

        <form action={setTheme} className="grid gap-4 md:grid-cols-2">
          {themes.map((theme) => {
            const selected = selectedTheme === theme.id;
            return (
              <button
                key={theme.id}
                type="submit"
                name="theme"
                value={theme.id}
                aria-pressed={selected}
                className={`theme-choice group overflow-hidden border p-1 text-left transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${
                  selected ? "border-ink ring-2 ring-ink/15" : "border-divider hover:border-ink-subtle"
                }`}
              >
                <div
                  className="theme-preview flex h-28 items-center justify-center gap-3 p-4"
                  style={{
                    background: theme.swatches[0],
                    borderRadius: "calc(var(--radius-card) - 4px)",
                  }}
                >
                  {theme.swatches.slice(1).map((swatch, index) => (
                    <span
                      key={index}
                      className="h-10 w-10 rounded-full shadow-sm ring-1 ring-black/10"
                      style={{ background: swatch }}
                    />
                  ))}
                </div>
                <div className="flex items-center justify-between gap-3 px-4 py-4">
                  <p className="font-bold text-ink">{theme.name}</p>
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                      selected ? "border-ink bg-ink" : "border-divider"
                    }`}
                    aria-hidden="true"
                  >
                    {selected ? <span className="h-2 w-2 rounded-full bg-accent" /> : null}
                  </span>
                </div>
              </button>
            );
          })}
        </form>
      </main>
    </div>
  );
}
