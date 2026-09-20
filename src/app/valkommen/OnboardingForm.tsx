"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { JerseyNumberPicker, type TakenJersey } from "@/components/JerseyNumberPicker";
import { completeOnboarding, type OnboardingField, type OnboardingState } from "@/app/valkommen/actions";
import {
  HEIGHT_MAX,
  HEIGHT_MIN,
  isValidPhone,
  PLAYER_POSITIONS,
  TRAINING_DAYS,
  TRAINING_DAY_LABELS,
  WEIGHT_MAX,
  WEIGHT_MIN,
  type TrainingDayValue,
} from "@/lib/player";

type Participation = "yes" | "no" | "";
type ParticipationType = "TRAINING_AND_MATCHES" | "TRAINING_ONLY";

const inputClass =
  "h-12 w-full rounded-xl border border-divider bg-white px-3 text-base text-ink outline-none transition-colors focus:border-ink";

const fieldStep: Record<OnboardingField, number> = {
  phone: 0,
  emergencyContact: 0,
  heightCm: 1,
  weightKg: 1,
  stickSide: 1,
  preferredPosition: 1,
  jerseyNo: 2,
  season: 3,
};

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <span className="mt-1 block text-sm font-semibold text-signal">{message}</span>;
}

function OptionCard({
  checked,
  children,
  ...input
}: {
  checked: boolean;
  children: React.ReactNode;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label
      className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-base font-semibold text-ink ${
        checked ? "border-ink bg-rink-crease" : "border-divider bg-white"
      }`}
    >
      <input type="radio" checked={checked} className="h-5 w-5 accent-ink" {...input} />
      {children}
    </label>
  );
}

export function OnboardingForm({
  firstName,
  teamName,
  season,
  asksForSeason,
  takenJerseys,
  hasTeam,
}: {
  firstName: string;
  teamName: string | null;
  season: string | null;
  asksForSeason: boolean;
  takenJerseys: TakenJersey[];
  hasTeam: boolean;
}) {
  const [state, formAction, pending] = useActionState<OnboardingState, FormData>(
    completeOnboarding,
    undefined,
  );
  const [step, setStep] = useState(0);
  const [stepError, setStepError] = useState("");

  const [phone, setPhone] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [stickSide, setStickSide] = useState<"LEFT" | "RIGHT" | "">("");
  const [preferredPosition, setPreferredPosition] = useState("");
  const [jerseyNo, setJerseyNo] = useState<number | null>(null);
  const [participation, setParticipation] = useState<Participation>("");
  const [participationType, setParticipationType] =
    useState<ParticipationType>("TRAINING_AND_MATCHES");
  const [trainingDays, setTrainingDays] = useState<TrainingDayValue[]>([...TRAINING_DAYS]);

  const steps = [
    { title: "Kontaktuppgifter", label: "Kontakt" },
    { title: "Din spelarprofil", label: "Profil" },
    { title: "Välj tröjnummer", label: "Nummer" },
    ...(asksForSeason ? [{ title: `Säsongen ${season}`, label: "Säsong" }] : []),
  ];
  const lastStep = steps.length - 1;

  // Serverns fältfel hör hemma i ett visst steg – hoppa dit så att spelaren ser
  // vad som behöver rättas i stället för att fastna på sista sidan. Justeras
  // under renderingen i stället för i en effekt, vilket React rekommenderar när
  // ett tillstånd ska följa en ändrad prop eller ett nytt actionsvar.
  const [handledState, setHandledState] = useState(state);
  if (state !== handledState) {
    setHandledState(state);
    const failing = Object.keys(state?.fieldErrors ?? {}) as OnboardingField[];
    if (failing.length > 0) setStep(Math.min(...failing.map((field) => fieldStep[field])));
  }

  function validateStep(candidate: number) {
    if (candidate === 0 && !isValidPhone(phone)) {
      return "Ange ett telefonnummer så att laget kan nå dig.";
    }
    if (candidate === 1) {
      if (!stickSide) return "Välj vänster eller höger fattning.";
      if (!preferredPosition) return "Välj vilken position du helst spelar.";
    }
    if (candidate === 3) {
      if (participation === "") return "Svara om du är med den här säsongen.";
      if (participation === "yes" && trainingDays.length === 0) return "Välj minst en träningsdag.";
    }
    return "";
  }

  function goNext() {
    const error = validateStep(step);
    setStepError(error);
    if (error) return;
    setStepError("");
    setStep((current) => Math.min(current + 1, lastStep));
  }

  function goBack() {
    setStepError("");
    setStep((current) => Math.max(current - 1, 0));
  }

  function toggleTrainingDay(day: TrainingDayValue) {
    setTrainingDays((current) =>
      current.includes(day) ? current.filter((candidate) => candidate !== day) : [...current, day],
    );
  }

  const blockingStep = steps.findIndex((_, index) => validateStep(index) !== "");
  const canSubmit = blockingStep === -1;

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <ol className="flex gap-1.5" aria-label="Steg i formuläret">
          {steps.map((item, index) => (
            <li key={item.label} className="flex-1">
              <span
                aria-current={index === step ? "step" : undefined}
                className={`block h-1.5 rounded-full ${index <= step ? "bg-signal" : "bg-divider"}`}
              />
              <span
                className={`mt-1.5 block text-[11px] font-bold uppercase tracking-[0.06em] ${
                  index === step ? "text-ink" : "text-ink-subtle"
                }`}
              >
                {item.label}
              </span>
            </li>
          ))}
        </ol>
        <h2 className="mt-4 section-title">{steps[step].title}</h2>
      </div>

      <div hidden={step !== 0} className="space-y-4">
        <p className="body-copy text-ink-muted">
          Hej {firstName}! Vi behöver några uppgifter innan du kommer in i appen.
          {teamName ? ` Du är inbjuden till ${teamName}.` : ""}
        </p>
        <label className="block">
          <span className="mb-1.5 block text-sm font-bold text-ink">Telefonnummer</span>
          <input
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            className={inputClass}
          />
          <span className="mt-1 block text-xs text-ink-subtle">
            Används av ledare och lagkamrater för kallelser och snabba besked.
          </span>
          <FieldError message={state?.fieldErrors?.phone} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-bold text-ink">
            Anhörig vid olycka <span className="font-semibold text-ink-subtle">(frivilligt)</span>
          </span>
          <input
            name="emergencyContact"
            maxLength={120}
            placeholder="Namn och telefonnummer"
            value={emergencyContact}
            onChange={(event) => setEmergencyContact(event.target.value)}
            className={inputClass}
          />
          <FieldError message={state?.fieldErrors?.emergencyContact} />
        </label>
      </div>

      <div hidden={step !== 1} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1.5 block text-sm font-bold text-ink">
              Längd <span className="font-semibold text-ink-subtle">(frivilligt)</span>
            </span>
            <div className="relative">
              <input
                name="heightCm"
                type="number"
                inputMode="numeric"
                min={HEIGHT_MIN}
                max={HEIGHT_MAX}
                value={heightCm}
                onChange={(event) => setHeightCm(event.target.value)}
                className={`${inputClass} pr-11`}
              />
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-ink-subtle">
                cm
              </span>
            </div>
            <FieldError message={state?.fieldErrors?.heightCm} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-bold text-ink">
              Vikt <span className="font-semibold text-ink-subtle">(frivilligt)</span>
            </span>
            <div className="relative">
              <input
                name="weightKg"
                type="number"
                inputMode="decimal"
                step="0.1"
                min={WEIGHT_MIN}
                max={WEIGHT_MAX}
                value={weightKg}
                onChange={(event) => setWeightKg(event.target.value)}
                className={`${inputClass} pr-11`}
              />
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-ink-subtle">
                kg
              </span>
            </div>
            <FieldError message={state?.fieldErrors?.weightKg} />
          </label>
        </div>

        <fieldset>
          <legend className="text-sm font-bold text-ink">Fattning</legend>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <OptionCard
              name="stickSide"
              value="LEFT"
              checked={stickSide === "LEFT"}
              onChange={() => setStickSide("LEFT")}
            >
              Vänster
            </OptionCard>
            <OptionCard
              name="stickSide"
              value="RIGHT"
              checked={stickSide === "RIGHT"}
              onChange={() => setStickSide("RIGHT")}
            >
              Höger
            </OptionCard>
          </div>
          <FieldError message={state?.fieldErrors?.stickSide} />
        </fieldset>

        <fieldset>
          <legend className="text-sm font-bold text-ink">Position du helst spelar</legend>
          <p className="mt-1 text-[13px] text-ink-subtle">
            Ledarna ser ditt önskemål och sätter den position du spelar i laget.
          </p>
          <div className="mt-2 grid gap-2">
            {PLAYER_POSITIONS.map((position) => (
              <OptionCard
                key={position}
                name="preferredPosition"
                value={position}
                checked={preferredPosition === position}
                onChange={() => setPreferredPosition(position)}
              >
                {position}
              </OptionCard>
            ))}
          </div>
          <FieldError message={state?.fieldErrors?.preferredPosition} />
        </fieldset>
      </div>

      <div hidden={step !== 2} className="space-y-3">
        {hasTeam ? (
          <>
            <p className="body-copy text-ink-muted">
              Välj ett ledigt nummer. Du kan byta senare under Min profil om numret blir ledigt.
            </p>
            <JerseyNumberPicker
              takenJerseys={takenJerseys}
              value={jerseyNo}
              onChange={setJerseyNo}
              emptyLabel="Inget nummer valt än"
            />
            <FieldError message={state?.fieldErrors?.jerseyNo} />
          </>
        ) : (
          <p className="body-copy text-ink-muted">
            Du är ännu inte kopplad till något lag, så tröjnummer väljs när en administratör
            lagt till dig.
          </p>
        )}
      </div>

      {asksForSeason ? (
        <div hidden={step !== 3} className="space-y-4">
          <p className="body-copy text-ink-muted">
            Berätta hur du är med säsongen {season}. Svaret styr vilka kallelser du får.
          </p>
          <fieldset>
            <legend className="sr-only">Deltar du under säsongen?</legend>
            <div className="grid gap-2">
              <OptionCard
                name="playingThisSeason"
                value="yes"
                checked={participation === "yes"}
                onChange={() => setParticipation("yes")}
              >
                Jag är med
              </OptionCard>
              <OptionCard
                name="playingThisSeason"
                value="no"
                checked={participation === "no"}
                onChange={() => setParticipation("no")}
              >
                Jag är inte med den här säsongen
              </OptionCard>
            </div>
          </fieldset>

          {participation === "yes" ? (
            <div className="space-y-4 border-t border-divider pt-4">
              <fieldset>
                <legend className="text-sm font-bold text-ink">Vad är du med på?</legend>
                <div className="mt-2 grid gap-2">
                  <OptionCard
                    name="participationType"
                    value="TRAINING_AND_MATCHES"
                    checked={participationType === "TRAINING_AND_MATCHES"}
                    onChange={() => setParticipationType("TRAINING_AND_MATCHES")}
                  >
                    Träningar och matcher
                  </OptionCard>
                  <OptionCard
                    name="participationType"
                    value="TRAINING_ONLY"
                    checked={participationType === "TRAINING_ONLY"}
                    onChange={() => setParticipationType("TRAINING_ONLY")}
                  >
                    Bara träningar
                  </OptionCard>
                </div>
              </fieldset>

              <fieldset>
                <legend className="text-sm font-bold text-ink">Vilka dagar kan du träna?</legend>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {TRAINING_DAYS.map((day) => (
                    <label
                      key={day}
                      className="flex min-h-14 cursor-pointer items-center justify-center rounded-xl border border-divider bg-white px-2 text-center text-sm font-bold text-ink has-[:checked]:border-ink has-[:checked]:bg-rink-crease has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ink"
                    >
                      <input
                        type="checkbox"
                        name="trainingDays"
                        value={day}
                        checked={trainingDays.includes(day)}
                        onChange={() => toggleTrainingDay(day)}
                        className="sr-only"
                      />
                      {TRAINING_DAY_LABELS[day]}
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>
          ) : null}
          <FieldError message={state?.fieldErrors?.season} />
        </div>
      ) : null}

      {stepError ? (
        <p role="alert" className="rounded-xl bg-rink-line-red px-3 py-2.5 text-sm font-semibold text-signal">
          {stepError}
        </p>
      ) : null}
      {state?.error ? (
        <p role="alert" aria-live="polite" className="rounded-xl bg-rink-line-red px-3 py-2.5 text-sm font-semibold text-signal">
          {state.error}
        </p>
      ) : null}

      <div className="grid gap-2">
        {step === lastStep ? (
          <button
            type="submit"
            disabled={pending || !canSubmit}
            className="h-12 w-full rounded-xl bg-ink px-5 text-base font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45"
          >
            {pending ? "Sparar…" : "Klar – ta mig till appen"}
          </button>
        ) : (
          <button
            type="button"
            onClick={goNext}
            className="h-12 w-full rounded-xl bg-ink px-5 text-base font-bold text-white transition-opacity hover:opacity-90"
          >
            Fortsätt
          </button>
        )}
        {step > 0 ? (
          <button
            type="button"
            onClick={goBack}
            className="h-11 w-full rounded-xl px-5 text-sm font-bold text-ink-subtle transition-colors hover:bg-divider/40"
          >
            Tillbaka
          </button>
        ) : null}
      </div>

      <p className="text-center text-xs leading-5 text-ink-subtle">
        Uppgifterna används för lagadministration och går att ändra under Min profil. Läs mer i{" "}
        <Link href="/integritet" className="font-bold underline underline-offset-2">
          integritetspolicyn
        </Link>
        .
      </p>
    </form>
  );
}
