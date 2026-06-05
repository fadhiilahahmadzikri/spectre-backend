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

export interface ApplicationMutationInput {
  name: string;
  webhook_url?: string | null;
}

export interface UpdateApplicationInput {
  id: string;
  name: string;
  webhook_url?: string | null;
}

type ApplicationMutationPayload = {
  name: string;
  webhook_url?: string | null;
};

function toApplicationPayload(
  input: ApplicationMutationInput,
): ApplicationMutationPayload {
  const payload: ApplicationMutationPayload = { name: input.name };
  if (input.webhook_url !== undefined) {
    payload.webhook_url = input.webhook_url;
  }
  return payload;
}

function webhookOptimisticPatch(webhookUrl: string | null | undefined) {
  if (webhookUrl === undefined) return {};
  return {
    webhook_url: webhookUrl,
    has_webhook: Boolean(webhookUrl),
  };
}

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
    UpdateApplicationInput,
    ApplicationsCache
  >({
    queryKey: ["apps"],
    mutationFn: ({ id, name, webhook_url }) =>
      api.updateApp(id, toApplicationPayload({ name, webhook_url })),
    applyOptimistic: (cache, { id, name, webhook_url }) =>
      cache && {
        ...cache,
        data: cache.data.map((a) =>
          a.id === id
            ? {
                ...a,
                name,
                ...webhookOptimisticPatch(webhook_url),
                pending: true,
              }
            : a,
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
    ApplicationMutationInput,
    ApplicationsCache
  >({
    queryKey: ["apps"],
    mutationFn: (input) => api.createApp(toApplicationPayload(input)),
    applyOptimistic: (cache, { name, webhook_url }) => {
      if (!cache) return cache;
      const tempId = `temp-${crypto.randomUUID()}`;
      const stub: PendingApplication = {
        id: tempId,
        name,
        ...webhookOptimisticPatch(webhook_url),
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
