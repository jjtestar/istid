import { respondToMatch, respondToTraining } from "@/app/actions";
import { PageHeader } from "@/components/PageHeader";
import { Badge, Card, DarkCard, Eyebrow, PrimaryButton } from "@/components/ui";
import { BellIcon, UsersIcon } from "@/components/icons";
import { getCurrentUserWithTeam } from "@/lib/current-user";
import { formatDateHeader, formatTime } from "@/lib/format";
import { getDashboardData } from "@/lib/queries";

export default async function Home() {
  const { user, team } = await getCurrentUserWithTeam();

  if (!team) {
    return (
      <div className="px-5 py-10 text-center text-muted">
        Inget lag hittades. Kör <code>npm run db:seed</code> för att skapa exempeldata.
      </div>
    );
  }

  const { nextTraining, nextMatch } = await getDashboardData(user.id, team.id);
  const matchRegistered = (nextMatch?.registrations.length ?? 0) > 0;
  const trainingRegistered = (nextTraining?.registrations.length ?? 0) > 0;

  return (
    <div>
      <PageHeader
        title="Istid."
        right={
          <span className="flex h-10 w-10 items-center justify-center rounded-full border border-border">
            <BellIcon className="h-5 w-5" />
          </span>
        }
      />

      <div className="space-y-4 px-5 pb-8">
        <DarkCard>
          <Eyebrow tone="light">
            {team.name} · {team.season}
          </Eyebrow>
          <h2 className="mt-1 text-3xl font-bold">Hej, {user.name}</h2>
          <p className="mt-1 text-white/60">Redo för nästa match?</p>
        </DarkCard>

        {nextMatch && (
          <Card>
            <div className="flex items-start justify-between">
              <Eyebrow>Nästa match</Eyebrow>
              <Badge tone="outline">{team.name}</Badge>
            </div>
            <h3 className="mt-2 text-xl font-bold">
              {nextMatch.isHome ? "Hemma" : "Borta"} vs {nextMatch.opponent}
            </h3>
            <p className="mt-1 text-sm text-muted">
              {formatDateHeader(nextMatch.startsAt)} · {formatTime(nextMatch.startsAt)}
            </p>
            <p className="text-sm text-muted">{nextMatch.location}</p>

            <div className="mt-4">
              {matchRegistered ? (
                <Badge tone="success">Anmäld</Badge>
              ) : (
                <form action={respondToMatch}>
                  <input type="hidden" name="matchId" value={nextMatch.id} />
                  <input type="hidden" name="status" value="GOING" />
                  <PrimaryButton type="submit">Jag är tillgänglig</PrimaryButton>
                </form>
              )}
            </div>
            <p className="mt-3 flex items-center gap-2 text-xs text-muted">
              <UsersIcon className="h-4 w-4" />
              Truppen bekräftas av ledaren
            </p>
          </Card>
        )}

        {nextTraining && (
          <Card>
            <div className="flex items-start justify-between">
              <Eyebrow>Nästa träning</Eyebrow>
              <Badge tone="outline">{team.name}</Badge>
            </div>
            <h3 className="mt-2 text-xl font-bold">Träning</h3>
            <p className="mt-1 text-sm text-muted">
              {formatDateHeader(nextTraining.startsAt)} · {formatTime(nextTraining.startsAt)}
            </p>
            <p className="text-sm text-muted">{nextTraining.location}</p>

            <div className="mt-4">
              {trainingRegistered ? (
                <Badge tone="success">Anmäld</Badge>
              ) : (
                <form action={respondToTraining}>
                  <input type="hidden" name="trainingId" value={nextTraining.id} />
                  <input type="hidden" name="status" value="GOING" />
                  <PrimaryButton type="submit">Anmäl mig</PrimaryButton>
                </form>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
