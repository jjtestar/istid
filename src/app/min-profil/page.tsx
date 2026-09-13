import { updateProfile } from "@/app/actions";
import { PageHeader } from "@/components/PageHeader";
import { PlayerDetailsForm } from "@/components/PlayerDetailsForm";
import { SeasonParticipationForm } from "@/components/SeasonParticipationForm";
import { Card, Eyebrow } from "@/components/ui";
import { signOut } from "@/lib/auth";
import { getCurrentUserWithTeam } from "@/lib/current-user";
import Link from "next/link";

export default async function MinProfilPage() {
  const { user, team, membership } = await getCurrentUserWithTeam();

  return (
    <div>
      <PageHeader title="Min profil" />
      <main className="space-y-6 px-5 pb-10">
        <Card className="p-5">
          <Eyebrow>Personuppgifter</Eyebrow>
          <form action={updateProfile} className="mt-4 space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-sm font-bold text-ink">Namn</span>
              <input
                name="name"
                type="text"
                required
                maxLength={80}
                defaultValue={user.name ?? ""}
                className="h-12 w-full rounded-xl border border-divider bg-white px-3 text-base text-ink outline-none focus:border-ink"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-bold text-ink">E-post</span>
              <input
                type="email"
                value={user.email}
                readOnly
                className="h-12 w-full rounded-xl border border-divider bg-divider/30 px-3 text-base text-ink-subtle outline-none"
              />
              <span className="mt-1.5 block text-[13px] text-ink-subtle">E-postadressen används för inloggning.</span>
            </label>

            <button type="submit" className="h-12 w-full rounded-xl bg-ink px-5 text-base font-bold text-white transition-opacity hover:opacity-90">
              Spara namn
            </button>
          </form>
        </Card>

        <Card className="p-5">
          <Eyebrow>Spelaruppgifter</Eyebrow>
          <h2 className="mt-1 section-title">Din spelarprofil</h2>
          {team ? <p className="mt-1 text-sm text-ink-subtle">{team.name}</p> : null}
          <PlayerDetailsForm
            key={membership?.id ?? user.id}
            initialHeightCm={user.heightCm}
            initialWeightKg={user.weightKg}
            initialStickSide={user.stickSide}
            initialJerseyNo={membership?.jerseyNo ?? null}
            position={membership?.position ?? null}
            hasTeam={Boolean(team && membership)}
          />
        </Card>

        {team && membership ? (
          <Card className="p-5">
            <Eyebrow>Säsongen {team.season}</Eyebrow>
            <h2 className="mt-1 section-title">Hur deltar du den här säsongen?</h2>
            <p className="mt-2 text-sm leading-6 text-ink-subtle">
              Ange om du deltar i matcher och vilka fasta träningsdagar som fungerar.
            </p>
            <SeasonParticipationForm
              key={membership.id}
              initialPlaying={membership.playingThisSeason}
              initialParticipatesInMatches={membership.participatesInMatches}
              initialTrainingDays={membership.trainingDays}
            />
          </Card>
        ) : null}

        <Card className="p-5">
          <Eyebrow>Integritet</Eyebrow>
          <h2 className="mt-1 section-title">Dina uppgifter och rättigheter</h2>
          <p className="mt-2 text-sm leading-6 text-ink-subtle">
            Se hur Istid använder dina personuppgifter, hämta en kopia eller kontakta oss om
            rättelse och radering.
          </p>
          <Link
            href="/integritet"
            className="mt-4 flex h-12 w-full items-center justify-center rounded-xl border border-ink bg-white px-5 text-base font-bold text-ink transition-colors hover:bg-rink-crease"
          >
            Integritet &amp; mina uppgifter
          </Link>
        </Card>

        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <button
            type="submit"
            className="h-12 w-full rounded-xl border border-divider bg-white/90 px-5 text-base font-bold text-signal transition-colors hover:bg-rink-line-red"
          >
            Logga ut
          </button>
        </form>
      </main>
    </div>
  );
}
