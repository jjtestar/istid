import type { ReactNode } from "react";

/** Native disclosure keeps server-rendered lists usable without JavaScript. */
export function ExpandableList({
  children,
  initialCount,
  moreLabel,
  lessLabel,
  className = "",
  listClassName,
}: {
  children: ReactNode[];
  initialCount: number;
  moreLabel: string;
  lessLabel: string;
  className?: string;
  /** Wraps the rows themselves, for callers that lay them out (e.g. in columns). */
  listClassName?: string;
}) {
  const remaining = children.slice(initialCount);
  const rows = (items: ReactNode[]) =>
    listClassName ? <div className={listClassName}>{items}</div> : items;

  return (
    <div className={className}>
      {rows(children.slice(0, initialCount))}
      {remaining.length > 0 ? (
        <details className="expandable-list border-t border-divider">
          <summary className="flex min-h-11 cursor-pointer list-none items-center rounded-lg px-3 py-3 text-sm font-bold text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink">
            <span className="expand-label">{moreLabel}</span>
            <span className="collapse-label">{lessLabel}</span>
            <span className="ml-auto pl-3" aria-hidden="true">⌄</span>
          </summary>
          {listClassName ? rows(remaining) : <div className={className}>{remaining}</div>}
        </details>
      ) : null}
    </div>
  );
}
