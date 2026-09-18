"use client";

import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { updateSeasonParticipation } from "@/app/actions";
import { Eyebrow } from "@/components/ui";

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
  season,
  initialPlaying,
  initialParticipatesInMatches,
  initialTrainingDays,
}: {
  season: string;
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
  const [statusMessage, setStatusMessage] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const editButtonRef = useRef<HTMLButtonElement>(null);
  const pendingFocus = useRef<"form" | "edit" | null>(null);

  useEffect(() => {
    if (pendingFocus.current === "form" && editing) {
      formRef.current
        ?.querySelector<HTMLInputElement>('input[name="playingThisSeason"]:checked')
        ?.focus();
      pendingFocus.current = null;
    } else if (pendingFocus.current === "edit" && !editing) {
      editButtonRef.current?.focus();
      pendingFocus.current = null;
    }
  }, [editing]);

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
    setStatusMessage("Ditt säsongsval är sparat.");
    pendingFocus.current = "edit";
    setEditing(false);
  }

  function editSelection() {
    if (savedSelection) {
      setParticipation(savedSelection.participation);
      setParticipationType(savedSelection.participationType);
      setSelectedDays(savedSelection.selectedDays);
    }
    setStatusMessage("");
    pendingFocus.current = "form";
    setEditing(true);
  }

  function cancelEditing() {
    if (!savedSelection) return;
    setParticipation(savedSelection.participation);
    setParticipationType(savedSelection.participationType);
    setSelectedDays(savedSelection.selectedDays);
    pendingFocus.current = "edit";
    setEditing(false);
  }

  if (!editing && savedSelection) {
    const selectedTrainingDays = trainingDays.filter((day) =>
      savedSelection.selectedDays.includes(day.value),
    );
    const dayLabels = selectedTrainingDays.map((day) => day.label.toLocaleLowerCase("sv-SE"));
    const formattedTrainingDays =
      dayLabels.length === 0
        ? ""
        : dayLabels.length === 1
        ? dayLabels[0]
        : `${dayLabels.slice(0, -1).join(", ")} och ${dayLabels.at(-1)}`;
    const trainingDaysSummary =
      formattedTrainingDays.charAt(0).toLocaleUpperCase("sv-SE") + formattedTrainingDays.slice(1);

    return (
      <div>
        <p role="status" aria-live="polite" className="sr-only">{statusMessage}</p>
        <div className="flex items-start justify-between gap-3">
          <div>
            <Eyebrow>Säsongen {season}</Eyebrow>
            <h2 className="mt-1 section-title">Ditt säsongsval</h2>
          </div>
          <button
            type="button"
            ref={editButtonRef}
            onClick={editSelection}
            aria-label="Ändra ditt säsongsval"
            className="min-h-11 min-w-11 shrink-0 rounded-lg px-2 text-sm font-bold text-signal underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            Ändra
          </button>
        </div>
        <dl className="mt-4 overflow-hidden rounded-xl border border-divider bg-divider/20">
          <div className="px-4 py-3">
            <dt className="text-xs font-bold uppercase tracking-[0.08em] text-ink-subtle">Deltar</dt>
            <dd className="mt-1 text-base font-semibold text-ink">
              {savedSelection.participation === "yes"
                ? savedSelection.participationType === "TRAINING_AND_MATCHES"
                  ? "Ja – träningar och matcher"
                  : "Ja – bara träningar"
                : "Nej, inte den här säsongen"}
            </dd>
          </div>
          {savedSelection.participation === "yes" ? (
            <div className="border-t border-divider px-4 py-3">
              <dt className="text-xs font-bold uppercase tracking-[0.08em] text-ink-subtle">Träningsdagar</dt>
              <dd className="mt-1 text-base font-semibold text-ink">{trainingDaysSummary}</dd>
            </div>
          ) : null}
        </dl>
      </div>
    );
  }

  return (
    <div>
      <p role="status" aria-live="polite" className="sr-only">{statusMessage}</p>
      <Eyebrow>Säsongen {season}</Eyebrow>
      <h2 className="mt-1 section-title">Hur deltar du den här säsongen?</h2>
      <p className="mt-2 text-sm leading-6 text-ink-subtle">
        Ange om du deltar i matcher och vilka fasta träningsdagar som fungerar.
      </p>
      <form ref={formRef} action={saveParticipation} className="mt-4 space-y-5">
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
        {savedSelection === null ? (
          <p className="text-center text-xs text-ink-subtle">Du kan ändra ditt val när som helst.</p>
        ) : null}
      </form>
    </div>
  );
}
