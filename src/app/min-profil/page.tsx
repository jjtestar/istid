import { updateProfile } from "@/app/actions";
import { PageHeader } from "@/components/PageHeader";
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

            <div className="border-t border-divider pt-4">
              <Eyebrow>Spelaruppgifter</Eyebrow>
              <div className="mt-3 grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-bold text-ink">Längd</span>
                    <div className="relative">
                      <input
                        name="heightCm"
                        type="number"
                        min={80}
                        max={230}
                        inputMode="numeric"
                        defaultValue={user.heightCm ?? ""}
                        className="h-12 w-full rounded-xl border border-divider bg-white px-3 pr-11 text-base text-ink outline-none focus:border-ink"
                      />
                      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-ink-subtle">cm</span>
                    </div>
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-bold text-ink">Vikt</span>
                    <div className="relative">
                      <input
                        name="weightKg"
                        type="number"
                        min={20}
                        max={250}
                        step="0.1"
                        inputMode="decimal"
                        defaultValue={user.weightKg ?? ""}
                        className="h-12 w-full rounded-xl border border-divider bg-white px-3 pr-11 text-base text-ink outline-none focus:border-ink"
                      />
                      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-ink-subtle">kg</span>
                    </div>
                  </label>
                  <label className="col-span-2 block">
                    <span className="mb-1.5 block text-sm font-bold text-ink">Fattning</span>
                    <select
                      name="stickSide"
                      defaultValue={user.stickSide ?? ""}
                      className="h-12 w-full rounded-xl border border-divider bg-white px-3 text-base text-ink outline-none focus:border-ink"
                    >
                      <option value="">Välj fattning</option>
                      <option value="LEFT">Vänster</option>
                      <option value="RIGHT">Höger</option>
                    </select>
                  </label>
              </div>

              {team && membership ? (
                <div className="mt-4 border-t border-divider pt-4">
                  <Eyebrow>{team.name}</Eyebrow>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <label className="block">
                      <span className="mb-1.5 block text-sm font-bold text-ink">Tröjnummer</span>
                      <input
                        name="jerseyNo"
                        type="number"
                        min={0}
                        max={99}
                        defaultValue={membership.jerseyNo ?? ""}
                        className="h-12 w-full rounded-xl border border-divider bg-white px-3 text-base text-ink outline-none focus:border-ink"
                      />
                    </label>
                    <div className="block">
                      <span className="mb-1.5 block text-sm font-bold text-ink">Position</span>
                      <div className="flex h-12 items-center rounded-xl border border-divider bg-divider/30 px-3 text-base text-ink">
                        {membership.position ?? "Inte angiven"}
                      </div>
                      <span className="mt-1.5 block text-[13px] text-ink-subtle">Positionen anges av en admin.</span>
                    </div>
                  </div>
                </div>
                ) : null}
            </div>

            <button type="submit" className="h-12 w-full rounded-xl bg-ink px-5 text-base font-bold text-white transition-opacity hover:opacity-90">
              Spara profil
            </button>
          </form>
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
