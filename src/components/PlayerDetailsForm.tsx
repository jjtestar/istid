"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { updatePlayerDetails } from "@/app/actions";

type StickSide = "LEFT" | "RIGHT" | "";

type PlayerDetails = {
  heightCm: string;
  weightKg: string;
  stickSide: StickSide;
  jerseyNo: string;
};

function SaveButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="h-12 w-full rounded-xl bg-ink px-5 text-base font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-45"
    >
      {pending ? "Sparar…" : "Spara spelaruppgifter"}
    </button>
  );
}

function displayValue(value: string, suffix?: string) {
  if (!value) return "Inte angiven";
  return suffix ? `${value.replace(".", ",")} ${suffix}` : value;
}

export function PlayerDetailsForm({
  initialHeightCm,
  initialWeightKg,
  initialStickSide,
  initialJerseyNo,
  position,
  hasTeam,
}: {
  initialHeightCm: number | null;
  initialWeightKg: number | null;
  initialStickSide: "LEFT" | "RIGHT" | null;
  initialJerseyNo: number | null;
  position: string | null;
  hasTeam: boolean;
}) {
  const initialDetails: PlayerDetails = {
    heightCm: initialHeightCm?.toString() ?? "",
    weightKg: initialWeightKg?.toString() ?? "",
    stickSide: initialStickSide ?? "",
    jerseyNo: initialJerseyNo?.toString() ?? "",
  };
  const hasSavedDetails = Object.values(initialDetails).some(Boolean);
  const [details, setDetails] = useState<PlayerDetails>(initialDetails);
  const [savedDetails, setSavedDetails] = useState<PlayerDetails | null>(() =>
    hasSavedDetails ? initialDetails : null,
  );
  const [editing, setEditing] = useState(!hasSavedDetails);

  function updateDetail<Key extends keyof PlayerDetails>(key: Key, value: PlayerDetails[Key]) {
    setDetails((current) => ({ ...current, [key]: value }));
  }

  async function saveDetails(formData: FormData) {
    const saved = await updatePlayerDetails(formData);
    if (!saved) return;

    setSavedDetails(details);
    setEditing(false);
  }

  function editDetails() {
    if (savedDetails) setDetails(savedDetails);
    setEditing(true);
  }

  function cancelEditing() {
    if (!savedDetails) return;
    setDetails(savedDetails);
    setEditing(false);
  }

  if (!editing && savedDetails) {
    return (
      <div className="mt-4" aria-live="polite">
        <div className="rounded-xl border border-ink bg-rink-crease p-4">
          <div className="flex items-start justify-between gap-3">
            <span className="text-xs font-bold uppercase tracking-[0.1em] text-ink-subtle">
              Dina uppgifter
            </span>
            <span className="rounded-full bg-ink px-2.5 py-1 text-xs font-bold text-white">Sparat</span>
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-4 border-t border-divider pt-4 text-sm">
            <div>
              <dt className="font-bold text-ink">Längd</dt>
              <dd className="text-ink-subtle">{displayValue(savedDetails.heightCm, "cm")}</dd>
            </div>
            <div>
              <dt className="font-bold text-ink">Vikt</dt>
              <dd className="text-ink-subtle">{displayValue(savedDetails.weightKg, "kg")}</dd>
            </div>
            <div>
              <dt className="font-bold text-ink">Fattning</dt>
              <dd className="text-ink-subtle">
                {savedDetails.stickSide === "LEFT"
                  ? "Vänster"
                  : savedDetails.stickSide === "RIGHT"
                    ? "Höger"
                    : "Inte angiven"}
              </dd>
            </div>
            <div>
              <dt className="font-bold text-ink">Tröjnummer</dt>
              <dd className="text-ink-subtle">{displayValue(savedDetails.jerseyNo)}</dd>
            </div>
            <div className="col-span-2">
              <dt className="font-bold text-ink">Position</dt>
              <dd className="text-ink-subtle">{position ?? "Inte angiven"}</dd>
            </div>
          </dl>
        </div>
        <button
          type="button"
          onClick={editDetails}
          className="mt-3 h-12 w-full rounded-xl border border-ink bg-white px-5 text-base font-bold text-ink transition-colors hover:bg-rink-crease"
        >
          Ändra spelaruppgifter
        </button>
      </div>
    );
  }

  return (
    <form action={saveDetails} className="mt-4 space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="mb-1.5 block text-sm font-bold text-ink">Längd</span>
          <div className="relative">
            <input
              name="heightCm"
              type="number"
              min={80}
              max={230}
              inputMode="numeric"
              value={details.heightCm}
              onChange={(event) => updateDetail("heightCm", event.target.value)}
              className="h-12 w-full rounded-xl border border-divider bg-white px-3 pr-11 text-base text-ink outline-none focus:border-ink"
            />
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-ink-subtle">
              cm
            </span>
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
              value={details.weightKg}
              onChange={(event) => updateDetail("weightKg", event.target.value)}
              className="h-12 w-full rounded-xl border border-divider bg-white px-3 pr-11 text-base text-ink outline-none focus:border-ink"
            />
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-ink-subtle">
              kg
            </span>
          </div>
        </label>
        <label className="col-span-2 block">
          <span className="mb-1.5 block text-sm font-bold text-ink">Fattning</span>
          <select
            name="stickSide"
            value={details.stickSide}
            onChange={(event) => updateDetail("stickSide", event.target.value as StickSide)}
            className="h-12 w-full rounded-xl border border-divider bg-white px-3 text-base text-ink outline-none focus:border-ink"
          >
            <option value="">Välj fattning</option>
            <option value="LEFT">Vänster</option>
            <option value="RIGHT">Höger</option>
          </select>
        </label>

        {hasTeam ? (
          <label className="block">
            <span className="mb-1.5 block text-sm font-bold text-ink">Tröjnummer</span>
            <input
              name="jerseyNo"
              type="number"
              min={0}
              max={99}
              value={details.jerseyNo}
              onChange={(event) => updateDetail("jerseyNo", event.target.value)}
              className="h-12 w-full rounded-xl border border-divider bg-white px-3 text-base text-ink outline-none focus:border-ink"
            />
          </label>
        ) : null}
        <div className={hasTeam ? "block" : "col-span-2 block"}>
          <span className="mb-1.5 block text-sm font-bold text-ink">Position</span>
          <div className="flex h-12 items-center rounded-xl border border-divider bg-divider/30 px-3 text-base text-ink">
            {position ?? "Inte angiven"}
          </div>
          <span className="mt-1.5 block text-[13px] text-ink-subtle">Positionen anges av en admin.</span>
        </div>
      </div>

      <div className="grid gap-2">
        <SaveButton />
        {savedDetails ? (
          <button
            type="button"
            onClick={cancelEditing}
            className="h-11 w-full rounded-xl px-5 text-sm font-bold text-ink-subtle transition-colors hover:bg-divider/40"
          >
            Avbryt
          </button>
        ) : null}
      </div>
      <p className="text-center text-xs text-ink-subtle">Du kan ändra uppgifterna när som helst.</p>
    </form>
  );
}
