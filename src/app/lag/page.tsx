import { PageHeader } from "@/components/PageHeader";
import { ContextSwitcher } from "@/components/ContextSwitcher";
import { Card, Eyebrow } from "@/components/ui";
import { getCurrentUserWithTeam } from "@/lib/current-user";
import { getTeamRoster } from "@/lib/queries";

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
      <PageHeader title="Laget" />
      <main className="space-y-4 px-5 pb-8">
        <ContextSwitcher
          teams={context.teams}
          seasons={context.seasons}
          selectedTeamSlug={context.selectedTeamSlug}
          selectedSeason={context.selectedSeason}
        />

        <Card className="p-4">
          <Eyebrow>{team.season}</Eyebrow>
          <h2 className="mt-1 text-xl font-bold text-ink">{team.name}</h2>
          <p className="mt-1 text-sm text-ink-subtle">{roster.length} spelare</p>
        </Card>

        <Card className="overflow-hidden">
          {roster.map((member, index) => (
            <div
              key={member.id}
              className={`flex items-center gap-3.5 px-4 py-3.5 ${index === 0 ? "" : "border-t border-divider"}`}
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink text-sm font-bold text-white">
                {member.jerseyNo ?? "–"}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[15px] font-semibold text-ink">{member.user.name}</div>
                {member.position ? <div className="text-[13px] text-ink-subtle">{member.position}</div> : null}
              </div>
            </div>
          ))}
        </Card>
      </main>
    </div>
  );
}
