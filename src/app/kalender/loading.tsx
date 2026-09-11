import { PageHeader } from "@/components/PageHeader";
import { Card, Skeleton } from "@/components/ui";

export default function Loading() {
  return (
    <div>
      <PageHeader title="Kalender" />
      <div className="space-y-5 px-5 pb-8">
        <Card className="space-y-4 p-4">
          <Skeleton className="mx-auto h-5 w-36" />
          <Skeleton className="h-14 w-full" />
        </Card>
        <Skeleton className="h-3 w-24" />
        <Card className="p-4">
          <Skeleton className="h-14 w-full" />
        </Card>
        <Card className="p-4">
          <Skeleton className="h-14 w-full" />
        </Card>
      </div>
    </div>
  );
}
