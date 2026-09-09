import { PageHeader } from "@/components/PageHeader";
import { Card, Eyebrow } from "@/components/ui";
import { getCurrentUser } from "@/lib/current-user";
import { getTeamRoster, getUserTeam } from "@/lib/queries";

export default async function LagPage() {
  const user = await getCurrentUser();
  const team = await getUserTeam(user.id);

  if (!team) {
    return (
      <div className="px-5 py-10 text-center text-muted">
        Inget lag hittades. Kör <code>npm run db:seed</code> för att skapa exempeldata.
      </div>
    );
  }

  const roster = await getTeamRoster(team.id);

  return (
    <div>
      <PageHeader title="Lag" />

      <div className="space-y-4 px-5 pb-8">
        <Eyebrow>
          {team.name} · {team.season}
        </Eyebrow>

        <Card className="divide-y divide-border p-0">
          {roster.map((member) => (
            <div key={member.id} className="flex items-center gap-4 px-5 py-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ink text-sm font-bold text-white">
                {member.jerseyNo ?? "–"}
              </span>
              <div>
                <div className="font-semibold">{member.user.name}</div>
                {member.position && (
                  <div className="text-sm text-muted">{member.position}</div>
                )}
              </div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
