/**
 * Realistic UI mutation primitive.
 *
 * Implements the reference flow from `.agents/ux-feedback-patterns/SKILL.md`:
 *
 *     1. onMutate        → cancelQueries(queryKey) + snapshot + optimistic setQueryData
 *     2. API call        → runs in the background
 *     3. onError         → setQueryData(snapshot)  +  notify.error
 *     4. onSettled       → invalidateQueries(queryKey)  +  notify.success (if ok)
 *
 * The toast fires in `onSettled` (never `onSuccess`) so the user sees the list
 * already reflect the change before the "Saved" message appears, avoiding
 * AP-02 Premature Success Signal.
 */

import {
  useMutation,
  useQueryClient,
  type QueryKey,
  type UseMutationResult,
} from "@tanstack/react-query";
import { notify } from "@/shared/lib/notify";

export type MessageResolver<TData, TError, TVariables> =
  | string
  | ((ctx: { data?: TData; error?: TError; variables: TVariables }) => string | undefined);

export interface RealisticMutationOptions<TData, TError, TVariables, TCache> {
  /** Primary query key whose cache is optimistically mutated + later invalidated. */
  queryKey: QueryKey;
  /** The network call. */
  mutationFn: (variables: TVariables) => Promise<TData>;
  /** Transform the cached data into its optimistic shape. Called inside onMutate. */
  applyOptimistic?: (
    cache: TCache | undefined,
    variables: TVariables,
  ) => TCache | undefined;
  /** Additional query keys to invalidate in onSettled (e.g. related lists). */
  invalidateKeys?: ReadonlyArray<QueryKey>;
  /** Toast fired in onSettled on success. */
  onSuccessMessage?: MessageResolver<TData, TError, TVariables>;
  /** Toast fired in onError. Receives the raw error for contextual description. */
  onErrorMessage?: MessageResolver<TData, TError, TVariables>;
  /** Escape hatch: extra onSuccess behavior (e.g. navigate, focus, open a dialog). */
  onSuccess?: (data: TData, variables: TVariables) => void;
  /** Escape hatch: extra onError behavior (e.g. re-open a closed dialog). */
  onError?: (error: TError, variables: TVariables, snapshot: TCache | undefined) => void;
}

interface Context<TCache> {
  snapshot: TCache | undefined;
}

function resolveMessage<TData, TError, TVariables>(
  resolver: MessageResolver<TData, TError, TVariables> | undefined,
  ctx: { data?: TData; error?: TError; variables: TVariables },
): string | undefined {
  if (!resolver) return undefined;
  return typeof resolver === "function" ? resolver(ctx) : resolver;
}

export function useRealisticMutation<
  TData = unknown,
  TError = Error,
  TVariables = void,
  TCache = unknown,
>(
  options: RealisticMutationOptions<TData, TError, TVariables, TCache>,
): UseMutationResult<TData, TError, TVariables, Context<TCache>> {
  const queryClient = useQueryClient();
  const {
    queryKey,
    mutationFn,
    applyOptimistic,
    invalidateKeys = [],
    onSuccessMessage,
    onErrorMessage,
    onSuccess,
    onError,
  } = options;

  return useMutation<TData, TError, TVariables, Context<TCache>>({
    mutationFn,

    onMutate: async (variables) => {
      // Cancel any outgoing refetches (F2: prevent stale refetch from
      // overwriting optimistic state mid-flight).
      await queryClient.cancelQueries({ queryKey });

      const snapshot = queryClient.getQueryData<TCache>(queryKey);

      if (applyOptimistic) {
        queryClient.setQueryData<TCache>(queryKey, (old) =>
          applyOptimistic(old, variables),
        );
      }

      return { snapshot };
    },

    onError: (error, variables, ctx) => {
      // Always rollback to the pre-mutation snapshot (AP-07 Silent Failure guard).
      if (ctx) queryClient.setQueryData(queryKey, ctx.snapshot);
      const message = resolveMessage(onErrorMessage, { error, variables });
      if (message) {
        const description = error instanceof Error ? error.message : undefined;
        notify.error(message, description ? { description } : undefined);
      }
      onError?.(error, variables, ctx?.snapshot);
    },

    onSuccess: (data, variables) => {
      onSuccess?.(data, variables);
    },

    onSettled: async (data, error, variables) => {
      // Invalidate AFTER the UI has reconciled. Fires regardless of success/error —
      // either way the canonical server state must take over the optimistic stand-in.
      const keys: ReadonlyArray<QueryKey> = [queryKey, ...invalidateKeys];
      await Promise.all(
        keys.map((key) => queryClient.invalidateQueries({ queryKey: key })),
      );

      if (!error && data !== undefined) {
        const message = resolveMessage(onSuccessMessage, { data, variables });
        if (message) notify.success(message);
      }
    },
  });
}
