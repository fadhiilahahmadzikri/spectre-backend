import { Skeleton } from "@/components/ui/skeleton";

interface DashboardCardsSkeletonProps {
  count?: number;
}

/**
 * Card-shaped skeletons matching the Dashboard action card shape
 * (icon + title + description).
 */
export function DashboardCardsSkeleton({
  count = 3,
}: DashboardCardsSkeletonProps) {
  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="glass rounded-[var(--radius-card,18px)] p-6 flex flex-col gap-3 min-h-[140px]"
        >
          <Skeleton className="size-12 rounded-2xl" />
          <Skeleton className="h-4 w-[60%] rounded" />
          <Skeleton className="h-3 w-[85%] rounded" />
        </div>
      ))}
    </div>
  );
}
