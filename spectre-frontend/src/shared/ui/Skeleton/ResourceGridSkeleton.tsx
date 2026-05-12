import { Skeleton } from "@/components/ui/skeleton";

interface ResourceGridSkeletonProps {
  count?: number;
  className?: string;
}

/**
 * Grid of card-shaped skeletons that match the `.glass` resource card
 * (`rounded-[var(--radius-card)] min-h-[132px] p-5`). Shape:
 *
 *   ┌──────────────────────┐
 *   │ [●] ▬▬▬▬▬▬▬          │
 *   │     ▬▬▬▬             │
 *   │                      │
 *   │ [▬▬▬▬▬]  [▬▬]       │
 *   └──────────────────────┘
 */
export function ResourceGridSkeleton({
  count = 8,
  className,
}: ResourceGridSkeletonProps) {
  return (
    <div
      className={
        className ??
        "grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      }
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="glass rounded-[var(--radius-card,18px)] min-h-[132px] p-5 flex flex-col gap-3"
        >
          <div className="flex items-center gap-3">
            <Skeleton className="size-10 rounded-[12px] shrink-0" />
            <div className="flex flex-col gap-1.5 flex-1">
              <Skeleton className="h-3.5 w-[60%] rounded" />
              <Skeleton className="h-3 w-[40%] rounded" />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-auto">
            <Skeleton className="h-7 flex-1 rounded-[var(--radius-field,14px)]" />
            <Skeleton className="size-7 rounded-full shrink-0" />
            <Skeleton className="size-7 rounded-full shrink-0" />
          </div>
        </div>
      ))}
    </div>
  );
}
