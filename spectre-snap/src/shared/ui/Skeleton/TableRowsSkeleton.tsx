import { Skeleton } from "@/components/ui/skeleton";

interface TableRowsSkeletonProps {
  count?: number;
  columns?: number;
}

/**
 * Table rows of skeletons matching the heartbeat table row height
 * (`py-3 px-5` per cell). Uses `<tr>`/`<td>` so it can be dropped inside an
 * existing `<tbody>`.
 */
export function TableRowsSkeleton({
  count = 5,
  columns = 4,
}: TableRowsSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, r) => (
        <tr key={r} className={r > 0 ? "border-t border-white/[0.04]" : ""}>
          {Array.from({ length: columns }).map((__, c) => (
            <td key={c} className="px-5 py-3">
              <Skeleton className="h-3 w-[75%] rounded" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
