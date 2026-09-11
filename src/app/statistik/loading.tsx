import { PageHeader } from "@/components/PageHeader";
import { Skeleton } from "@/components/ui";

export default function Loading() {
  return (
    <div>
      <PageHeader title="Statistik" />
      <div className="px-5 pb-8">
        <Skeleton className="h-4 w-40" />
        <div className="mt-5 grid grid-cols-4 gap-2">
          <Skeleton className="h-14" />
          <Skeleton className="h-14" />
          <Skeleton className="h-14" />
          <Skeleton className="h-14" />
        </div>
        <Skeleton className="mt-6 h-16 w-full" />
        <Skeleton className="mt-6 h-24 w-full" />
      </div>
    </div>
  );
}
