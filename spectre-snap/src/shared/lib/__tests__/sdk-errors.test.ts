import { describe, expect, it } from "vitest";
import { normalizeErrorEnvelope } from "../sdk-errors";

describe("normalizeErrorEnvelope", () => {
  it("reads the public backend error envelope", () => {
    const envelope = normalizeErrorEnvelope(
      401,
      {
        success: false,
        error: {
          code: "INVALID_API_KEY",
          message: "API key has expired.",
          details: { reason: "expired" },
        },
        request_id: "req_123",
        timestamp: "2026-06-03T00:00:00Z",
      },
      "Unauthorized",
    );

    expect(envelope).toEqual({
      code: "INVALID_API_KEY",
      message: "API key has expired.",
      details: { reason: "expired" },
      request_id: "req_123",
      timestamp: "2026-06-03T00:00:00Z",
    });
  });

  it("keeps compatibility with legacy detail payloads", () => {
    const envelope = normalizeErrorEnvelope(
      400,
      {
        detail: {
          error_code: "VALIDATION_ERROR",
          message: "Invalid base64 image data.",
        },
      },
      "Bad Request",
    );

    expect(envelope.code).toBe("VALIDATION_ERROR");
    expect(envelope.message).toBe("Invalid base64 image data.");
  });
});
