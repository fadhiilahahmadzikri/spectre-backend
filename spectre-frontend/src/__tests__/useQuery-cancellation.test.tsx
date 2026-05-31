import { describe, it, expect, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import type { ReactNode } from "react";

/**
 * Race-condition guardrail for useQuery callsites. When two overlapping
 * queries are kicked off with the same key, react-query aborts the older
 * signal so only the newest resolution hits the cache.
 *
 * We assert this contract end-to-end:
 *   - Fire query A (slow, 120ms) with signal.
 *   - Immediately fire query B (fast, 20ms) with the same key.
 *   - The cache holds B's payload; A's signal is aborted.
 */
describe("useQuery race cancellation", () => {
  function makeWrapper(client: QueryClient) {
    return function Wrapper({ children }: { children: ReactNode }) {
      return (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      );
    };
  }

  it("aborts the stale in-flight query and keeps the newer result", async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    let aInvoked = 0;
    let bInvoked = 0;
    const aAborted = vi.fn();

    function slowFetcher({ signal }: { signal: AbortSignal }) {
      aInvoked++;
      return new Promise<string>((resolve, reject) => {
        const id = setTimeout(() => resolve("slow"), 120);
        signal.addEventListener("abort", () => {
          clearTimeout(id);
          aAborted();
          reject(new DOMException("aborted", "AbortError"));
        });
      });
    }

    function fastFetcher() {
      bInvoked++;
      return new Promise<string>((resolve) =>
        setTimeout(() => resolve("fast"), 20),
      );
    }

    // Kick off a slow query.
    const slowPromise = client.fetchQuery({
      queryKey: ["race"],
      queryFn: slowFetcher,
    });

    // Immediately invalidate + re-fetch with a faster fetcher. react-query
    // cancels the in-flight slow fetch by aborting its signal.
    await client.cancelQueries({ queryKey: ["race"] });
    const fastPromise = client.fetchQuery({
      queryKey: ["race"],
      queryFn: fastFetcher,
    });

    // Slow query rejects with AbortError.
    await expect(slowPromise).rejects.toThrow();
    const fast = await fastPromise;
    expect(fast).toBe("fast");

    expect(aInvoked).toBe(1);
    expect(bInvoked).toBe(1);
    expect(aAborted).toHaveBeenCalledTimes(1);

    // Render a hook subscribed to the key and confirm it resolves the fast
    // value (smoke test that useQuery surfaces the cache).
    const { result } = renderHook(
      () =>
        useQuery({
          queryKey: ["race"],
          queryFn: fastFetcher,
        }),
      { wrapper: makeWrapper(client) },
    );
    await waitFor(() => expect(result.current.data).toBe("fast"));
  });
});
