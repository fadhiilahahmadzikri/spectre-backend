import { afterEach, describe, expect, it, vi } from "vitest";
import {
  abortableRequest,
  HttpError,
  isAbortError,
} from "../abortable-request";

function mockResponse(init: {
  status?: number;
  body?: unknown;
  ok?: boolean;
}): Response {
  const status = init.status ?? 200;
  const body = init.body === undefined ? null : JSON.stringify(init.body);
  return new Response(body, {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("abortableRequest", () => {
  it("serializes plain objects as JSON body", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(mockResponse({ body: { ok: true } }));

    await abortableRequest<{ ok: boolean }>("/x", {
      method: "POST",
      body: { hello: "world" },
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      "/x",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ hello: "world" }),
      }),
    );
  });

  it("forwards AbortSignal into fetch", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(mockResponse({ body: {} }));
    const controller = new AbortController();

    await abortableRequest("/x", { signal: controller.signal });

    expect(fetchSpy).toHaveBeenCalledWith(
      "/x",
      expect.objectContaining({ signal: controller.signal }),
    );
  });

  it("returns undefined on 204 No Content", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, { status: 204 }),
    );
    const out = await abortableRequest<undefined>("/x");
    expect(out).toBeUndefined();
  });

  it("throws HttpError carrying the status and detail on non-2xx", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      mockResponse({ status: 400, body: { detail: "Bad name" } }),
    );

    await expect(abortableRequest("/x")).rejects.toMatchObject({
      name: "HttpError",
      status: 400,
      message: "Bad name",
    });
  });

  it("unwraps nested detail.message shape", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      mockResponse({ status: 422, body: { detail: { message: "Validation failed" } } }),
    );

    try {
      await abortableRequest("/x");
    } catch (e) {
      expect(e).toBeInstanceOf(HttpError);
      expect((e as HttpError).message).toBe("Validation failed");
    }
  });

  it("passes through AbortError so callers can detect cancellation", async () => {
    const abortErr = new DOMException("Aborted", "AbortError");
    vi.spyOn(globalThis, "fetch").mockRejectedValue(abortErr);

    try {
      await abortableRequest("/x");
      expect.fail("should have thrown");
    } catch (err) {
      expect(isAbortError(err)).toBe(true);
    }
  });
});
