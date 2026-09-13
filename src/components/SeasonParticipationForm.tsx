"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { updateSeasonParticipation } from "@/app/actions";

type TrainingDay = "TUESDAY" | "THURSDAY" | "SATURDAY";
type Participation = "yes" | "no" | "";
type ParticipationType = "TRAINING_AND_MATCHES" | "TRAINING_ONLY";

const trainingDays: { value: TrainingDay; label: string; detail: string }[] = [
  { value: "TUESDAY", label: "Tisdag", detail: "Fast träning" },
  { value: "THURSDAY", label: "Torsdag", detail: "Fast träning" },
  { value: "SATURDAY", label: "Lördag", detail: "Fast träning" },
];

function SaveButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="h-12 w-full rounded-xl bg-ink px-5 text-base font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45"
    >
      {pending ? "Sparar…" : "Spara mitt säsongsval"}
    </button>
  );
}

export function SeasonParticipationForm({
  initialPlaying,
  initialParticipatesInMatches,
  initialTrainingDays,
}: {
  initialPlaying: boolean | null;
  initialParticipatesInMatches: boolean | null;
  initialTrainingDays: TrainingDay[];
}) {
  const [participation, setParticipation] = useState<Participation>(
    initialPlaying === true ? "yes" : initialPlaying === false ? "no" : "",
  );
  const [participationType, setParticipationType] = useState<ParticipationType>(
    initialParticipatesInMatches === false ? "TRAINING_ONLY" : "TRAINING_AND_MATCHES",
  );
  const [selectedDays, setSelectedDays] = useState<TrainingDay[]>(
    initialTrainingDays.length > 0 ? initialTrainingDays : trainingDays.map((day) => day.value),
  );

  function toggleDay(day: TrainingDay) {
    setSelectedDays((current) =>
      current.includes(day) ? current.filter((candidate) => candidate !== day) : [...current, day],
    );
  }

  const missingTrainingDay = participation === "yes" && selectedDays.length === 0;

  return (
    <form action={updateSeasonParticipation} className="mt-4 space-y-5">
      <fieldset>
        <legend className="sr-only">Deltar du under säsongen?</legend>
        <div className="grid gap-2">
          <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-divider bg-white px-4 py-3 text-base font-semibold text-ink has-[:checked]:border-ink has-[:checked]:bg-rink-crease">
            <input
              type="radio"
              name="playingThisSeason"
              value="yes"
              required
              checked={participation === "yes"}
              onChange={() => setParticipation("yes")}
              className="h-5 w-5 accent-ink"
            />
            Jag är med
          </label>
          <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-divider bg-white px-4 py-3 text-base font-semibold text-ink has-[:checked]:border-signal has-[:checked]:bg-rink-line-red">
            <input
              type="radio"
              name="playingThisSeason"
              value="no"
              required
              checked={participation === "no"}
              onChange={() => setParticipation("no")}
              className="h-5 w-5 accent-signal"
            />
            Jag är inte med
          </label>
        </div>
      </fieldset>

      {participation === "yes" ? (
        <div className="space-y-5 border-t border-divider pt-5">
          <fieldset>
            <legend className="text-sm font-bold text-ink">Vad är du med på?</legend>
            <div className="mt-2 grid gap-2">
              <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-divider bg-white px-4 py-3 text-sm font-semibold text-ink has-[:checked]:border-ink has-[:checked]:bg-rink-crease">
                <input
                  type="radio"
                  name="participationType"
                  value="TRAINING_AND_MATCHES"
                  required
                  checked={participationType === "TRAINING_AND_MATCHES"}
                  onChange={() => setParticipationType("TRAINING_AND_MATCHES")}
                  className="h-5 w-5 accent-ink"
                />
                Träningar och matcher
              </label>
              <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-divider bg-white px-4 py-3 text-sm font-semibold text-ink has-[:checked]:border-ink has-[:checked]:bg-rink-crease">
                <input
                  type="radio"
                  name="participationType"
                  value="TRAINING_ONLY"
                  required
                  checked={participationType === "TRAINING_ONLY"}
                  onChange={() => setParticipationType("TRAINING_ONLY")}
                  className="h-5 w-5 accent-ink"
                />
                Bara träningar
              </label>
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-sm font-bold text-ink">Vilka dagar kan du träna?</legend>
            <p className="mt-1 text-[13px] text-ink-subtle">Välj minst en av lagets fasta dagar.</p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {trainingDays.map((day) => (
                <label
                  key={day.value}
                  className="flex min-h-16 cursor-pointer flex-col items-center justify-center rounded-xl border border-divider bg-white px-2 py-2 text-center has-[:checked]:border-ink has-[:checked]:bg-rink-crease has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ink"
                >
                  <input
                    type="checkbox"
                    name="trainingDays"
                    value={day.value}
                    checked={selectedDays.includes(day.value)}
                    onChange={() => toggleDay(day.value)}
                    className="sr-only"
                  />
                  <span className="text-sm font-bold text-ink">{day.label}</span>
                  <span className="text-[11px] text-ink-subtle">{day.detail}</span>
                </label>
              ))}
            </div>
            {missingTrainingDay ? (
              <p className="mt-2 text-sm font-semibold text-signal" role="alert">
                Välj minst en träningsdag.
              </p>
            ) : null}
          </fieldset>
        </div>
      ) : null}

      <SaveButton disabled={participation === "" || missingTrainingDay} />
      <p className="text-center text-xs text-ink-subtle">Du kan ändra ditt val när som helst.</p>
    </form>
  );
}
