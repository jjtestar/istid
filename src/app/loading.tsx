import { Skeleton } from "@/components/ui";

export default function Loading() {
  return (
    <div className="flex flex-1 flex-col gap-3.5 px-5 pt-3.5">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-4 w-16" />
      </div>
      <div className="flex flex-col items-center gap-3 pt-10">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-11 w-48 rounded-full" />
      </div>
      <div className="mt-auto space-y-3 pb-4">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
}
