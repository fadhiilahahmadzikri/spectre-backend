import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import {
  QueryClient,
  QueryClientProvider,
  useQueryClient,
} from "@tanstack/react-query";
import { useRealisticMutation } from "../useRealisticMutation";
import { notify } from "@/shared/lib/notify";
import type { ReactNode } from "react";

vi.mock("@/shared/lib/notify", () => ({
  notify: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
    message: vi.fn(),
    dismiss: vi.fn(),
  },
}));

type Item = { id: string; name: string };

function makeWrapper(client: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
  };
}

function setup() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  client.setQueryData<Item[]>(["items"], [{ id: "1", name: "Alpha" }]);
  return { client, wrapper: makeWrapper(client) };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useRealisticMutation", () => {
  it("applies optimistic update synchronously and invalidates on settle", async () => {
    const { client, wrapper } = setup();
    const cancelSpy = vi.spyOn(client, "cancelQueries");
    const invalidateSpy = vi.spyOn(client, "invalidateQueries");

    const { result } = renderHook(
      () =>
        useRealisticMutation<Item, Error, { name: string }, Item[]>({
          queryKey: ["items"],
          mutationFn: async ({ name }) => ({ id: "2", name }),
          applyOptimistic: (cache, { name }) => [
            { id: "temp", name, pending: true } as unknown as Item,
            ...(cache ?? []),
          ],
          onSuccessMessage: "Saved",
        }),
      { wrapper },
    );

    result.current.mutate({ name: "Beta" });

    // Optimistic update is synchronous from the caller's perspective.
    await waitFor(() => {
      const data = client.getQueryData<Item[]>(["items"]);
      expect(data?.[0]?.name).toBe("Beta");
    });

    expect(cancelSpy).toHaveBeenCalledWith({ queryKey: ["items"] });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["items"] });
    expect(notify.success).toHaveBeenCalledWith("Saved");
  });

  it("rolls back to snapshot and toasts error on failure", async () => {
    const { client, wrapper } = setup();

    const { result } = renderHook(
      () =>
        useRealisticMutation<void, Error, { id: string }, Item[]>({
          queryKey: ["items"],
          // Delay the rejection so the optimistic UI state is observable
          // before rollback fires.
          mutationFn: () =>
            new Promise<void>((_, reject) =>
              setTimeout(() => reject(new Error("nope")), 50),
            ),
          applyOptimistic: (cache, { id }) =>
            (cache ?? []).filter((it) => it.id !== id),
          onErrorMessage: "Delete failed",
        }),
      { wrapper },
    );

    result.current.mutate({ id: "1" });

    // Optimistic removal visible first
    await waitFor(() => {
      expect(client.getQueryData<Item[]>(["items"])).toEqual([]);
    });

    // Then rollback after error
    await waitFor(() => {
      expect(client.getQueryData<Item[]>(["items"])).toEqual([
        { id: "1", name: "Alpha" },
      ]);
    });

    expect(notify.error).toHaveBeenCalled();
    expect(notify.success).not.toHaveBeenCalled();
  });

  it("does not fire success toast on error path", async () => {
    const { wrapper } = setup();

    const { result } = renderHook(
      () =>
        useRealisticMutation({
          queryKey: ["items"],
          mutationFn: () => Promise.reject(new Error("boom")),
          onSuccessMessage: "Saved",
          onErrorMessage: "Failed",
        }),
      { wrapper },
    );

    result.current.mutate(undefined as never);
    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(notify.success).not.toHaveBeenCalled();
    expect(notify.error).toHaveBeenCalledWith(
      "Failed",
      expect.objectContaining({ description: "boom" }),
    );
  });

  it("invalidates additional keys passed as invalidateKeys", async () => {
    const { client, wrapper } = setup();
    const invalidateSpy = vi.spyOn(client, "invalidateQueries");

    const { result } = renderHook(
      () =>
        useRealisticMutation({
          queryKey: ["items"],
          mutationFn: async () => ({ ok: true }),
          invalidateKeys: [["related"], ["summary"]],
        }),
      { wrapper },
    );

    result.current.mutate(undefined as never);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["items"] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["related"] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["summary"] });
  });

  it("checks useQueryClient is reachable (sanity)", () => {
    const { client, wrapper } = setup();
    const { result } = renderHook(() => useQueryClient(), { wrapper });
    expect(result.current).toBe(client);
  });
});
