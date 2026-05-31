import { Skeleton } from "@/components/ui/skeleton";

interface FormSkeletonProps {
  rows?: number;
  className?: string;
}

/**
 * Stack of field-label + field-input skeletons inside a `.glass` container.
 * Matches the shape of a config panel / settings form.
 */
export function FormSkeleton({ rows = 4, className }: FormSkeletonProps) {
  return (
    <div
      className={
        className ??
        "glass rounded-[var(--radius-card,18px)] p-5 flex flex-col gap-4"
      }
    >
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex flex-col gap-2">
          <Skeleton className="h-3 w-[30%] rounded" />
          <Skeleton className="h-9 w-full rounded-[var(--radius-field,14px)]" />
        </div>
      ))}
    </div>
  );
}
