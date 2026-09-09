import { PageHeader } from "@/components/PageHeader";
import { Skeleton } from "@/components/ui";

export default function Loading() {
  return (
    <div>
      <PageHeader title="Istid." />
      <div className="space-y-4 px-5 pb-8">
        <Skeleton className="h-28" />
        <Skeleton className="h-40" />
        <Skeleton className="h-32" />
      </div>
    </div>
  );
}
