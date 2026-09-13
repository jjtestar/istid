"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { updateSeasonParticipation } from "@/app/actions";

type TrainingDay = "TUESDAY" | "THURSDAY" | "SATURDAY";
type Participation = "yes" | "no" | "";
type ParticipationType = "TRAINING_AND_MATCHES" | "TRAINING_ONLY";

type SavedSelection = {
  participation: Exclude<Participation, "">;
  participationType: ParticipationType;
  selectedDays: TrainingDay[];
};

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
  const initialParticipation: Participation =
    initialPlaying === true ? "yes" : initialPlaying === false ? "no" : "";
  const initialParticipationType: ParticipationType =
    initialParticipatesInMatches === false ? "TRAINING_ONLY" : "TRAINING_AND_MATCHES";
  const defaultTrainingDays =
    initialTrainingDays.length > 0 ? initialTrainingDays : trainingDays.map((day) => day.value);
  const [participation, setParticipation] = useState<Participation>(
    initialParticipation,
  );
  const [participationType, setParticipationType] = useState<ParticipationType>(
    initialParticipationType,
  );
  const [selectedDays, setSelectedDays] = useState<TrainingDay[]>(defaultTrainingDays);
  const [savedSelection, setSavedSelection] = useState<SavedSelection | null>(() =>
    initialParticipation === ""
      ? null
      : {
          participation: initialParticipation,
          participationType: initialParticipationType,
          selectedDays: defaultTrainingDays,
        },
  );
  const [editing, setEditing] = useState(initialParticipation === "");

  function toggleDay(day: TrainingDay) {
    setSelectedDays((current) =>
      current.includes(day) ? current.filter((candidate) => candidate !== day) : [...current, day],
    );
  }

  const missingTrainingDay = participation === "yes" && selectedDays.length === 0;

  async function saveParticipation(formData: FormData) {
    const saved = await updateSeasonParticipation(formData);
    if (!saved || participation === "") return;

    setSavedSelection({ participation, participationType, selectedDays });
    setEditing(false);
  }

  function editSelection() {
    if (savedSelection) {
      setParticipation(savedSelection.participation);
      setParticipationType(savedSelection.participationType);
      setSelectedDays(savedSelection.selectedDays);
    }
    setEditing(true);
  }

  function cancelEditing() {
    if (!savedSelection) return;
    setParticipation(savedSelection.participation);
    setParticipationType(savedSelection.participationType);
    setSelectedDays(savedSelection.selectedDays);
    setEditing(false);
  }

  if (!editing && savedSelection) {
    const selectedTrainingDays = trainingDays.filter((day) =>
      savedSelection.selectedDays.includes(day.value),
    );

    return (
      <div className="mt-4" aria-live="polite">
        <div className="rounded-xl border border-ink bg-rink-crease p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.1em] text-ink-subtle">
                Ditt val
              </span>
              <h3 className="mt-1 text-lg font-bold text-ink">
                {savedSelection.participation === "yes" ? "Jag är med" : "Jag är inte med"}
              </h3>
            </div>
            <span className="rounded-full bg-ink px-2.5 py-1 text-xs font-bold text-white">Sparat</span>
          </div>

          {savedSelection.participation === "yes" ? (
            <dl className="mt-4 space-y-3 border-t border-divider pt-4 text-sm">
              <div>
                <dt className="font-bold text-ink">Deltagande</dt>
                <dd className="text-ink-subtle">
                  {savedSelection.participationType === "TRAINING_AND_MATCHES"
                    ? "Träningar och matcher"
                    : "Bara träningar"}
                </dd>
              </div>
              <div>
                <dt className="font-bold text-ink">Träningsdagar</dt>
                <dd className="mt-2 flex flex-wrap gap-2">
                  {selectedTrainingDays.map((day) => (
                    <span
                      key={day.value}
                      className="rounded-full border border-divider bg-white px-3 py-1 text-sm font-semibold text-ink"
                    >
                      {day.label}
                    </span>
                  ))}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="mt-3 text-sm text-ink-subtle">
              Du är inte anmäld till träningar eller matcher den här säsongen.
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={editSelection}
          className="mt-3 h-12 w-full rounded-xl border border-ink bg-white px-5 text-base font-bold text-ink transition-colors hover:bg-rink-crease"
        >
          Ändra mitt val
        </button>
      </div>
    );
  }

  return (
    <form action={saveParticipation} className="mt-4 space-y-5">
      <fieldset>
        <legend className="sr-only">Deltar du under säsongen?</legend>
        <div className="grid gap-2">
          <label
            className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-base font-semibold text-ink ${
              participation === "yes"
                ? "border-ink bg-rink-crease"
                : "border-divider bg-white"
            }`}
          >
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
          <label
            className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-base font-semibold text-ink ${
              participation === "no"
                ? "border-signal bg-rink-line-red"
                : "border-divider bg-white"
            }`}
          >
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
              <label
                className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm font-semibold text-ink ${
                  participationType === "TRAINING_AND_MATCHES"
                    ? "border-ink bg-rink-crease"
                    : "border-divider bg-white"
                }`}
              >
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
              <label
                className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm font-semibold text-ink ${
                  participationType === "TRAINING_ONLY"
                    ? "border-ink bg-rink-crease"
                    : "border-divider bg-white"
                }`}
              >
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

      <div className="grid gap-2">
        <SaveButton disabled={participation === "" || missingTrainingDay} />
        {savedSelection ? (
          <button
            type="button"
            onClick={cancelEditing}
            className="h-11 w-full rounded-xl px-5 text-sm font-bold text-ink-subtle transition-colors hover:bg-divider/40"
          >
            Avbryt
          </button>
        ) : null}
      </div>
      <p className="text-center text-xs text-ink-subtle">Du kan ändra ditt val när som helst.</p>
    </form>
  );
}
