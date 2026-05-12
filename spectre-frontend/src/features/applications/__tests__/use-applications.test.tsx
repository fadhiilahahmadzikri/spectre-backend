import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import {
  useCreateApplication,
  useUpdateApplication,
  useDeleteApplication,
  type ApplicationsCache,
  type PendingApplication,
} from "../model/use-applications";
import { api } from "@/lib/api";

// Mock notify so tests don't rely on toast side effects.
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

function makeWrapper(client: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
  };
}

function setup(initial: PendingApplication[] = []) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  const cache: ApplicationsCache = {
    data: initial,
    pagination: { page: 1, page_size: 20, total: initial.length },
  };
  client.setQueryData<ApplicationsCache>(["apps"], cache);
  return { client, wrapper: makeWrapper(client) };
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("useCreateApplication", () => {
  it("optimistically prepends a pending row and reconciles on success", async () => {
    const { client, wrapper } = setup([
      { id: "1", name: "Alpha", created_at: "2025-01-01T00:00:00Z" },
    ]);

    const apiMock = vi
      .spyOn(api, "createApp")
      .mockResolvedValue({
        id: "2",
        name: "Beta",
        created_at: "2025-05-01T00:00:00Z",
      });

    const { result } = renderHook(() => useCreateApplication(), { wrapper });
    result.current.mutate({ name: "Beta" });

    // Optimistic prepend visible immediately with pending flag.
    await waitFor(() => {
      const cache = client.getQueryData<ApplicationsCache>(["apps"]);
      expect(cache?.data[0]?.name).toBe("Beta");
      expect(cache?.data[0]?.pending).toBe(true);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiMock).toHaveBeenCalledWith({ name: "Beta" });
  });
});

describe("useUpdateApplication", () => {
  it("optimistically renames and reconciles on success", async () => {
    const { client, wrapper } = setup([
      { id: "1", name: "Alpha", created_at: "2025-01-01T00:00:00Z" },
    ]);

    vi.spyOn(api, "updateApp").mockResolvedValue({
      id: "1",
      name: "Alpha 2",
      created_at: "2025-01-01T00:00:00Z",
      updated_at: "2025-05-01T00:00:00Z",
    });

    const { result } = renderHook(() => useUpdateApplication(), { wrapper });
    result.current.mutate({ id: "1", name: "Alpha 2" });

    // Optimistic rename visible with pending flag.
    await waitFor(() => {
      const cache = client.getQueryData<ApplicationsCache>(["apps"]);
      expect(cache?.data[0]?.name).toBe("Alpha 2");
      expect(cache?.data[0]?.pending).toBe(true);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});

describe("useDeleteApplication", () => {
  it("optimistically removes and rolls back on error", async () => {
    const { client, wrapper } = setup([
      { id: "1", name: "Alpha", created_at: "2025-01-01T00:00:00Z" },
      { id: "2", name: "Beta", created_at: "2025-01-01T00:00:00Z" },
    ]);

    // Delay the rejection so the optimistic removal state is observable.
    vi.spyOn(api, "deleteApp").mockImplementation(
      () =>
        new Promise<void>((_, reject) =>
          setTimeout(() => reject(new Error("forbidden")), 60),
        ),
    );

    const { result } = renderHook(() => useDeleteApplication(), { wrapper });
    result.current.mutate({ id: "1" });

    // Optimistic removal observable.
    await waitFor(() => {
      const cache = client.getQueryData<ApplicationsCache>(["apps"]);
      expect(cache?.data.find((a) => a.id === "1")).toBeUndefined();
    });

    // Rollback after server rejection.
    await waitFor(() => {
      const cache = client.getQueryData<ApplicationsCache>(["apps"]);
      expect(cache?.data.find((a) => a.id === "1")).toBeDefined();
    });
  });
});
