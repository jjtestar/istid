import { updateProfile } from "@/app/actions";
import { PageHeader } from "@/components/PageHeader";
import { Card, Eyebrow } from "@/components/ui";
import { getCurrentUserWithTeam } from "@/lib/current-user";

export default async function MinProfilPage() {
  const { user, team, membership } = await getCurrentUserWithTeam();

  return (
    <div>
      <PageHeader title="Min profil" />
      <main className="space-y-4 px-5 pb-8">
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

            {team && membership ? (
              <div className="border-t border-divider pt-4">
                <Eyebrow>{team.name}</Eyebrow>
                <div className="mt-3 grid grid-cols-[0.75fr_1.25fr] gap-3">
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
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-bold text-ink">Position</span>
                    <select
                      name="position"
                      defaultValue={membership.position ?? ""}
                      className="h-12 w-full rounded-xl border border-divider bg-white px-3 text-base text-ink outline-none focus:border-ink"
                    >
                      <option value="">Välj position</option>
                      <option value="Forward">Forward</option>
                      <option value="Back">Back</option>
                      <option value="Målvakt">Målvakt</option>
                    </select>
                  </label>
                </div>
              </div>
            ) : null}

            <button type="submit" className="h-12 w-full rounded-xl bg-ink px-5 text-base font-bold text-white transition-opacity hover:opacity-90">
              Spara profil
            </button>
          </form>
        </Card>
      </main>
    </div>
  );
}
