import { useRealisticMutation } from "@/shared/lib/query";
import { api } from "@/lib/api";
import type { ConfigResponse } from "./types";
import { admin } from "@/shared/lib/copy";

/**
 * useUpdateConfig — Realistic-UI wrapper around `PATCH /admin/config`. The
 * optimistic transform walks the cached categories tree and applies every
 * updated value; the rollback on error restores the original snapshot.
 */
export function useUpdateConfig() {
  return useRealisticMutation<
    ConfigResponse,
    Error,
    Record<string, string>,
    ConfigResponse
  >({
    queryKey: ["admin-config"],
    mutationFn: (updates) => api.updateConfig(updates),
    applyOptimistic: (cache, updates) => {
      if (!cache) return cache;
      return {
        categories: Object.fromEntries(
          Object.entries(cache.categories).map(([cat, items]) => [
            cat,
            items.map((item) =>
              item.key in updates
                ? { ...item, value: updates[item.key] }
                : item,
            ),
          ]),
        ),
      };
    },
    onSuccessMessage: (ctx) => {
      // Only fire the toast when we actually applied at least one change.
      return Object.keys(ctx.variables).length > 0
        ? admin.configDialog.saved
        : undefined;
    },
    onErrorMessage: admin.configDialog.saveFailed,
  });
}
