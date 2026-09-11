import { PageHeader } from "@/components/PageHeader";
import { Card, Skeleton } from "@/components/ui";

export default function Loading() {
  return (
    <div>
      <PageHeader title="Statistik" />
      <div className="space-y-4 px-5 pb-8">
        <Card className="p-4">
          <Skeleton className="h-14 w-full" />
        </Card>
        <div className="grid grid-cols-4 gap-2">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
        <Card className="p-4">
          <Skeleton className="h-20 w-full" />
        </Card>
        <Card className="p-4">
          <Skeleton className="h-28 w-full" />
        </Card>
      </div>
    </div>
  );
}
