import Image from "next/image";
import { OnboardingForm } from "@/app/valkommen/OnboardingForm";
import { Card, Eyebrow } from "@/components/ui";
import { DEFAULT_SEASON } from "@/lib/current-user";
import { getOnboardingContext } from "@/lib/onboarding";

export const metadata = { title: "Välkommen · Femtekedjan" };

export default async function ValkommenPage() {
  const { user, membership, takenJerseys } = await getOnboardingContext();
  const firstName = (user.name ?? "").trim().split(" ")[0] || "spelare";

  return (
    <main className="flex flex-1 items-center px-5 py-8">
      <div className="w-full">
        <div className="mb-6 flex items-center gap-3">
          <Image src="/pwa/skate-192.png" width={44} height={44} alt="" className="rounded-xl" />
          <div>
            <Eyebrow>Femtekedjan</Eyebrow>
            <h1 className="page-title">Välkommen till laget</h1>
          </div>
        </div>
        <Card className="p-5">
          <OnboardingForm
            firstName={firstName}
            teamName={membership?.team.name ?? null}
            season={membership?.team.season ?? null}
            asksForSeason={membership?.team.season === DEFAULT_SEASON}
            takenJerseys={takenJerseys}
            hasTeam={Boolean(membership)}
          />
        </Card>
      </div>
    </main>
  );
}
