import { useRealisticMutation } from "@/shared/lib/query";
import { api, type Application, type Pagination } from "@/lib/api";
import { admin } from "@/shared/lib/copy";

/** An Application row that may carry client-side pending/tombstone flags
 *  while a Realistic mutation is in-flight. */
export interface PendingApplication extends Application {
  pending?: boolean;
  tombstone?: boolean;
}

export type ApplicationsCache = {
  data: PendingApplication[];
  pagination: Pagination;
};

/**
 * Realistic-UI hooks for the Applications CRUD surface. Each one:
 *
 *   1. applies an optimistic cache transform on `onMutate`
 *   2. snapshots the previous cache so `onError` can roll back
 *   3. invalidates the `["apps"]` query on `onSettled`
 *   4. fires the success/error toast after reconciliation
 *
 * All toasts route through the admin English copy catalog.
 */

export function useUpdateApplication() {
  return useRealisticMutation<
    Application,
    Error,
    { id: string; name: string },
    ApplicationsCache
  >({
    queryKey: ["apps"],
    mutationFn: ({ id, name }) => api.updateApp(id, { name }),
    applyOptimistic: (cache, { id, name }) =>
      cache && {
        ...cache,
        data: cache.data.map((a) =>
          a.id === id ? { ...a, name, pending: true } : a,
        ),
      },
    onSuccessMessage: admin.applications.updated,
    onErrorMessage: admin.applications.updateFailed,
  });
}

export function useDeleteApplication() {
  return useRealisticMutation<void, Error, { id: string }, ApplicationsCache>({
    queryKey: ["apps"],
    mutationFn: ({ id }) => api.deleteApp(id),
    applyOptimistic: (cache, { id }) =>
      cache && {
        ...cache,
        data: cache.data.filter((a) => a.id !== id),
      },
    onSuccessMessage: admin.applications.removed,
    onErrorMessage: admin.applications.removeFailed,
  });
}

export function useCreateApplication() {
  return useRealisticMutation<
    Application,
    Error,
    { name: string },
    ApplicationsCache
  >({
    queryKey: ["apps"],
    mutationFn: ({ name }) => api.createApp({ name }),
    applyOptimistic: (cache, { name }) => {
      if (!cache) return cache;
      const tempId = `temp-${crypto.randomUUID()}`;
      const stub: PendingApplication = {
        id: tempId,
        name,
        created_at: new Date().toISOString(),
        pending: true,
      };
      return {
        ...cache,
        data: [stub, ...cache.data],
      };
    },
    onSuccessMessage: (ctx) =>
      admin.applications.created(ctx.variables.name),
    onErrorMessage: admin.applications.createFailed,
  });
}
