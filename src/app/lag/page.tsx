import { ExpandableList } from "@/components/ExpandableList";
import { PageHeader } from "@/components/PageHeader";
import { ContextSwitcher } from "@/components/ContextSwitcher";
import { Card, Eyebrow } from "@/components/ui";
import { getCurrentUserWithTeam } from "@/lib/current-user";
import { getTeamRoster } from "@/lib/queries";

const trainingDayLabels = {
  TUESDAY: "tisdag",
  THURSDAY: "torsdag",
  SATURDAY: "lördag",
} as const;

export default async function LagPage() {
  const { team, context } = await getCurrentUserWithTeam();

  if (!team) {
    return (
      <div className="px-5 py-10 text-center text-ink-subtle">
        Inget lag hittades. Kör <code>npm run db:seed</code> för att skapa exempeldata.
      </div>
    );
  }

  const roster = await getTeamRoster(team.id);

  return (
    <div>
      <PageHeader title="Laget" back={{ href: "/mer", label: "Tillbaka till Mer" }} />
      <main className="space-y-6 px-5 pb-10">
        <ContextSwitcher
          teams={context.teams}
          seasons={context.seasons}
          selectedTeamSlug={context.selectedTeamSlug}
          selectedSeason={context.selectedSeason}
        />

        <Card className="p-4">
          <Eyebrow>{team.season}</Eyebrow>
          <h2 className="mt-1 section-title">{team.name}</h2>
          <p className="mt-1 text-sm text-ink-subtle">{roster.length} spelare</p>
        </Card>

        <Card className="overflow-hidden">
          <ExpandableList
            initialCount={8}
            moreLabel="Visa fler spelare"
            lessLabel="Visa färre spelare"
            listClassName="xl:grid xl:grid-cols-2"
          >
            {roster.map((member) => (
              <div
                key={member.id}
                /* The dividers are CSS-driven so they follow the columns: no rule
                   above the first row of either column, and one between them. */
                className="flex items-center gap-3.5 border-t border-divider px-4 py-3.5 first:border-t-0 xl:[&:nth-child(2)]:border-t-0 xl:[&:nth-child(odd)]:border-r"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink text-sm font-bold text-white">
                  {member.jerseyNo ?? "–"}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[15px] font-semibold text-ink">{member.user.name}</div>
                  {member.position ? <div className="text-[13px] text-ink-subtle">{member.position}</div> : null}
                  <div className="mt-0.5 text-[13px] text-ink-subtle">
                    {member.playingThisSeason === true
                      ? member.participatesInMatches === false
                        ? "Bara träningar"
                        : "Träningar och matcher"
                      : member.playingThisSeason === false
                        ? "Spelar inte säsongen"
                        : "Har inte svarat om säsongen"}
                  </div>
                  {member.playingThisSeason === true && member.trainingDays.length > 0 ? (
                    <div className="text-[13px] text-ink-subtle">
                      Tränar {member.trainingDays.map((day) => trainingDayLabels[day]).join(", ")}
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </ExpandableList>
        </Card>

      </main>
    </div>
  );
}
