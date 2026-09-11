/**
 * Decorative ice rink graphic, seen from above, per design_handoff_rinken/README.md §4.
 * Coordinates are relative to a 360×700 reference screen; the SVG scales to fill its
 * container with preserveAspectRatio="none" as the spec allows for other screen sizes.
 */
export function Rink({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 360 700"
      preserveAspectRatio="none"
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
    >
      <rect
        x="14"
        y="46"
        width="332"
        height="580"
        rx="96"
        ry="96"
        fill="none"
        stroke="var(--color-rink-board)"
        strokeWidth="3"
      />
      <rect x="14" y="206" width="332" height="3" fill="var(--color-rink-line-blue)" />
      <rect x="14" y="420" width="332" height="3" fill="var(--color-rink-line-blue)" />
      <rect x="14" y="313" width="332" height="2" fill="var(--color-rink-line-red)" />
      <circle
        cx="180"
        cy="314"
        r="75"
        fill="none"
        stroke="var(--color-rink-line-red)"
        strokeWidth="2"
      />
      <circle cx="180" cy="314" r="6" fill="var(--color-rink-line-red)" />
      <circle
        cx="81"
        cy="165"
        r="37"
        fill="none"
        stroke="var(--color-rink-circle-red)"
        strokeWidth="2"
      />
      <circle
        cx="279"
        cy="165"
        r="37"
        fill="none"
        stroke="var(--color-rink-circle-red)"
        strokeWidth="2"
      />
      <circle
        cx="81"
        cy="467"
        r="37"
        fill="none"
        stroke="var(--color-rink-circle-red)"
        strokeWidth="2"
      />
      <circle
        cx="279"
        cy="467"
        r="37"
        fill="none"
        stroke="var(--color-rink-circle-red)"
        strokeWidth="2"
      />
      <rect x="14" y="92" width="332" height="2" fill="var(--color-rink-goalline)" />
      <rect x="14" y="582" width="332" height="2" fill="var(--color-rink-goalline)" />
      <path d="M137,92 A43,30 0 0,1 223,92 Z" fill="var(--color-rink-crease)" />
      <path d="M137,582 A43,30 0 0,0 223,582 Z" fill="var(--color-rink-crease)" />
    </svg>
  );
}
