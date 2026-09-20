"use client";

import { useMemo, useState } from "react";
import { JERSEY_NUMBERS } from "@/lib/player";

export type TakenJersey = { number: number; name: string };

/**
 * Rutnät över alla tröjnummer där lagets upptagna nummer är utslagna och visar
 * vem som bär dem. Värdet skickas med formuläret via ett dolt fält, så
 * komponenten fungerar i både välkomstformuläret och profilsidan.
 */
export function JerseyNumberPicker({
  name = "jerseyNo",
  takenJerseys,
  value,
  onChange,
  emptyLabel = "Inget nummer än",
}: {
  name?: string;
  takenJerseys: TakenJersey[];
  value: number | null;
  onChange: (value: number | null) => void;
  emptyLabel?: string;
}) {
  const [showAll, setShowAll] = useState(false);
  const takenByNumber = useMemo(
    () => new Map(takenJerseys.map((jersey) => [jersey.number, jersey.name])),
    [takenJerseys],
  );
  const freeNumbers = useMemo(
    () => JERSEY_NUMBERS.filter((number) => !takenByNumber.has(number)),
    [takenByNumber],
  );
  const visibleNumbers = showAll ? JERSEY_NUMBERS : freeNumbers;

  return (
    <div>
      <input type="hidden" name={name} value={value === null ? "" : String(value)} />
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-bold text-ink" aria-live="polite">
          {value === null ? emptyLabel : `Valt nummer: #${value}`}
        </p>
        {value === null ? null : (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="min-h-11 rounded-lg px-2 text-sm font-bold text-signal underline underline-offset-4"
          >
            Rensa
          </button>
        )}
      </div>
      <p className="mt-1 text-[13px] leading-5 text-ink-subtle">
        {freeNumbers.length} av {JERSEY_NUMBERS.length} nummer är lediga i laget.
        {takenJerseys.length > 0 ? " Upptagna nummer går inte att välja." : ""}
      </p>

      <div
        role="group"
        aria-label="Välj tröjnummer"
        className="mt-3 grid max-h-64 grid-cols-6 gap-1.5 overflow-y-auto rounded-xl border border-divider bg-white p-2 sm:grid-cols-10"
      >
        {visibleNumbers.map((number) => {
          const takenBy = takenByNumber.get(number);
          const selected = value === number;

          return (
            <button
              key={number}
              type="button"
              disabled={Boolean(takenBy)}
              aria-pressed={selected}
              title={takenBy ? `#${number} bärs av ${takenBy}` : `Välj nummer ${number}`}
              onClick={() => onChange(selected ? null : number)}
              className={`flex h-11 items-center justify-center rounded-lg border text-sm font-bold transition-colors ${
                takenBy
                  ? "cursor-not-allowed border-divider bg-divider/40 text-ink-subtle line-through"
                  : selected
                    ? "border-ink bg-ink text-white"
                    : "border-divider bg-white text-ink hover:bg-rink-crease"
              }`}
            >
              {number}
            </button>
          );
        })}
      </div>

      {takenJerseys.length > 0 ? (
        <button
          type="button"
          onClick={() => setShowAll((current) => !current)}
          className="mt-2 min-h-11 text-sm font-bold text-ink underline underline-offset-4"
        >
          {showAll ? "Visa bara lediga nummer" : "Visa även upptagna nummer"}
        </button>
      ) : null}
    </div>
  );
}
