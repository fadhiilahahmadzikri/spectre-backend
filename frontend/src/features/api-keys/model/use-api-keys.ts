import { useRealisticMutation } from "@/shared/lib/query";
import { api, type ApiKeyRow } from "@/lib/api";
import { useApiKeysUi } from "./api-keys-ui-store";
import { admin } from "@/shared/lib/copy";

export interface PendingApiKey extends ApiKeyRow {
  pending?: boolean;
}

export type ApiKeysCache = { data: PendingApiKey[] };

/**
 * useRevokeApiKey — optimistically marks the matching key as revoked (sets
 * `revoked_at`) and reconciles with the server on success.
 */
export function useRevokeApiKey(appId: string) {
  return useRealisticMutation<
    void,
    Error,
    { keyId: string },
    ApiKeysCache
  >({
    queryKey: ["keys", appId],
    mutationFn: ({ keyId }) => api.revokeKey(appId, keyId),
    applyOptimistic: (cache, { keyId }) =>
      cache && {
        ...cache,
        data: cache.data.map((k) =>
          k.id === keyId
            ? { ...k, revoked_at: new Date().toISOString(), pending: true }
            : k,
        ),
      },
    onSuccessMessage: admin.apiKeys.revoked,
    onErrorMessage: admin.apiKeys.revokedFailed,
  });
}

/**
 * useGenerateApiKey — optimistically prepends a placeholder key with an
 * `spk_…` prefix; on success, writes the full key to the zustand store so
 * the reveal dialog can display it once.
 */
export function useGenerateApiKey(appId: string) {
  const setLastKey = useApiKeysUi((s) => s.setLastKey);

  return useRealisticMutation<
    { id: string; full_key: string; key_prefix: string },
    Error,
    void,
    ApiKeysCache
  >({
    queryKey: ["keys", appId],
    mutationFn: () => api.generateKey(appId),
    applyOptimistic: (cache) => {
      if (!cache) return cache;
      const stub: PendingApiKey = {
        id: `temp-${crypto.randomUUID()}`,
        key_prefix: "spk_…",
        created_at: new Date().toISOString(),
        revoked_at: null,
        pending: true,
      };
      return { ...cache, data: [stub, ...cache.data] };
    },
    onSuccess: (data) => {
      setLastKey(data.full_key);
    },
    onSuccessMessage: admin.apiKeys.generated,
    onErrorMessage: admin.apiKeys.generateFailed,
  });
}
