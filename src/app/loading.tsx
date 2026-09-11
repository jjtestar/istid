import { PageHeader } from "@/components/PageHeader";
import { Card, Skeleton } from "@/components/ui";

export default function Loading() {
  return (
    <div>
      <PageHeader title="Hem" />
      <div className="space-y-4 px-5 pb-8">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Card className="space-y-4 p-4">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-11 w-48" />
        </Card>
        <Card className="space-y-4 p-4">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-11 w-48" />
        </Card>
      </div>
    </div>
  );
}
