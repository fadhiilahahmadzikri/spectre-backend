import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCopyToClipboard } from "../use-copy-to-clipboard";

describe("useCopyToClipboard", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("flips `copied` to true after successful copy and resets after timeout", async () => {
    const { result } = renderHook(() => useCopyToClipboard(1000));

    expect(result.current.copied).toBe(false);

    await act(async () => {
      await result.current.copy("secret");
    });
    expect(result.current.copied).toBe(true);

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.copied).toBe(false);
  });

  it("returns false when clipboard API rejects", async () => {
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockRejectedValue(new Error("not allowed")),
      },
    });
    const { result } = renderHook(() => useCopyToClipboard());
    const ok = await act(async () => result.current.copy("x"));
    expect(ok).toBe(false);
    expect(result.current.copied).toBe(false);
  });

  it("clears the reset timer on unmount", async () => {
    const clearSpy = vi.spyOn(globalThis, "clearTimeout");
    const { result, unmount } = renderHook(() => useCopyToClipboard(2000));
    await act(async () => {
      await result.current.copy("x");
    });
    unmount();
    expect(clearSpy).toHaveBeenCalled();
  });
});
