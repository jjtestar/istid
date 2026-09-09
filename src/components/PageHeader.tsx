import { ReactNode } from "react";

export function PageHeader({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <div className="flex items-center justify-between px-5 pb-4 pt-6">
      <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
      {right}
    </div>
  );
}
