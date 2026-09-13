import { updateMemberPosition } from "@/app/actions";
import { ExpandableList } from "@/components/ExpandableList";
import { PageHeader } from "@/components/PageHeader";
import { ContextSwitcher } from "@/components/ContextSwitcher";
import { Card, Eyebrow } from "@/components/ui";
import { getCurrentUserWithTeam } from "@/lib/current-user";
import { getTeamRoster } from "@/lib/queries";

export default async function LagPage() {
  const { user, team, context } = await getCurrentUserWithTeam();

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
          <ExpandableList initialCount={8} moreLabel="Visa fler spelare" lessLabel="Visa färre spelare">
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
                  <div className="mt-0.5 text-[13px] text-ink-subtle">
                    {member.playingThisSeason === true
                      ? "Spelar säsongen"
                      : member.playingThisSeason === false
                        ? "Spelar inte säsongen"
                        : "Har inte svarat om säsongen"}
                  </div>
                </div>
              </div>
            ))}
          </ExpandableList>
        </Card>

        {user.role === "ADMIN" ? (
          <Card className="overflow-hidden">
            <div className="border-b border-divider px-4 py-4">
              <Eyebrow>Admin</Eyebrow>
              <h2 className="mt-1 section-title">Spelarpositioner</h2>
            </div>
            {roster.map((member, index) => (
              <form
                action={updateMemberPosition}
                key={member.id}
                className={`grid grid-cols-[1fr_auto] items-end gap-3 px-4 py-3.5 ${index === 0 ? "" : "border-t border-divider"}`}
              >
                <input type="hidden" name="membershipId" value={member.id} />
                <label className="min-w-0">
                  <span className="mb-1.5 block truncate text-sm font-bold text-ink">{member.user.name}</span>
                  <select
                    name="position"
                    defaultValue={member.position ?? ""}
                    aria-label={`Position för ${member.user.name ?? "spelare"}`}
                    className="h-11 w-full rounded-xl border border-divider bg-white px-3 text-base text-ink outline-none focus:border-ink"
                  >
                    <option value="">Ingen position</option>
                    <option value="Forward">Forward</option>
                    <option value="Back">Back</option>
                    <option value="Målvakt">Målvakt</option>
                  </select>
                </label>
                <button type="submit" className="h-11 rounded-xl bg-ink px-4 text-sm font-bold text-white transition-opacity hover:opacity-90">
                  Spara
                </button>
              </form>
            ))}
          </Card>
        ) : null}
      </main>
    </div>
  );
}
