import { PageHeader } from "@/components/PageHeader";
import { Skeleton } from "@/components/ui";

export default function Loading() {
  return (
    <div>
      <PageHeader title="Lag" />
      <div className="space-y-4 px-5 pb-8">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-60" />
      </div>
    </div>
  );
}
