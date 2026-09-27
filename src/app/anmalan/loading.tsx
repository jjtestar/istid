import { PageHeader } from "@/components/PageHeader";
import { Card, Skeleton } from "@/components/ui";

export default function Loading() {
  return (
    <div>
      <PageHeader title="Anmälan" />
      <div className="space-y-3 px-5 pb-8">
        {Array.from({ length: 4 }, (_, i) => (
          <Card key={i} className="flex items-center gap-3 p-4">
            <Skeleton className="h-12 w-12 shrink-0 rounded-xl" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
