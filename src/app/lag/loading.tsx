import { PageHeader } from "@/components/PageHeader";
import { Card, Skeleton } from "@/components/ui";

export default function Loading() {
  return (
    <div>
      <PageHeader title="Lag" />
      <div className="space-y-4 px-5 pb-8">
        <Card className="p-4">
          <Skeleton className="h-16 w-full" />
        </Card>
        <Card className="space-y-3 p-4">
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
        </Card>
      </div>
    </div>
  );
}
