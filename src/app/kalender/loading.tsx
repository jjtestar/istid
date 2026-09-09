import { PageHeader } from "@/components/PageHeader";
import { Skeleton } from "@/components/ui";

export default function Loading() {
  return (
    <div>
      <PageHeader title="Kalender" />
      <div className="space-y-4 px-5 pb-8">
        <Skeleton className="h-28" />
        <Skeleton className="h-20" />
        <Skeleton className="h-24" />
        <Skeleton className="h-20" />
      </div>
    </div>
  );
}
