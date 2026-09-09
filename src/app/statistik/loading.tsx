import { PageHeader } from "@/components/PageHeader";
import { Skeleton } from "@/components/ui";

export default function Loading() {
  return (
    <div>
      <PageHeader title="Statistik" />
      <div className="space-y-4 px-5 pb-8">
        <Skeleton className="h-20" />
        <div className="grid grid-cols-4 gap-2">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-24" />
        <Skeleton className="h-40" />
      </div>
    </div>
  );
}
