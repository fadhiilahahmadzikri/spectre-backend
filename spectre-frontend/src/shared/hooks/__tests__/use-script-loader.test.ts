import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useScriptLoader } from "../use-script-loader";

describe("useScriptLoader", () => {
  beforeEach(() => {
    document.head.querySelectorAll("script").forEach((s) => s.remove());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns true once every source has been loaded", async () => {
    const appendSpy = vi
      .spyOn(document.head, "appendChild")
      .mockImplementation(((node: Node) => {
        queueMicrotask(() => {
          (node as HTMLScriptElement).onload?.(new Event("load"));
        });
        return node;
      }) as typeof document.head.appendChild);

    const { result } = renderHook(() =>
      useScriptLoader(["https://example.com/a.js", "https://example.com/b.js"]),
    );

    expect(result.current).toBe(false);
    await waitFor(() => expect(result.current).toBe(true));
    expect(appendSpy).toHaveBeenCalled();
  });

  it("skips sources that already exist in the DOM", async () => {
    const existing = document.createElement("script");
    existing.src = "https://example.com/existing.js";
    document.head.appendChild(existing);

    const appendSpy = vi.spyOn(document.head, "appendChild");

    const { result } = renderHook(() => useScriptLoader(["https://example.com/existing.js"]));

    await waitFor(() => expect(result.current).toBe(true));
    expect(appendSpy).not.toHaveBeenCalled();
  });

  it("does not flip loaded to true after unmount", async () => {
    const pending: Array<() => void> = [];
    vi.spyOn(document.head, "appendChild").mockImplementation(((node: Node) => {
      pending.push(() => (node as HTMLScriptElement).onload?.(new Event("load")));
      return node;
    }) as typeof document.head.appendChild);

    const { result, unmount } = renderHook(() =>
      useScriptLoader(["https://example.com/slow.js"]),
    );

    expect(result.current).toBe(false);
    unmount();
    await act(async () => {
      pending.forEach((resolve) => resolve());
      await Promise.resolve();
    });

    expect(result.current).toBe(false);
  });
});
