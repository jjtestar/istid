import { ReactNode } from "react";

export function PageHeader({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-5 pb-4 pt-6 md:px-8 md:pt-8">
      <h1 className="page-title">{title}</h1>
      {right}
    </div>
  );
}
