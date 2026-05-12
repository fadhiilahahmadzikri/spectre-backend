import { useState } from "react";
import { z } from "zod";
import { FaceIDGlyph } from "@/shared/icons";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FaceApiClient } from "../api/face-client";
import { MODE_AUTHENTICATE, MODE_REGISTER } from "../model/constants";
import type { ScanMode } from "../model/types";
import { scan } from "@/shared/lib/copy";
import { isAbortError } from "@/shared/lib/http";
import { maskKey, scanError } from "../lib/scan-debug";

export interface IdentityGateResolved {
  apiKey: string;
  mode: ScanMode;
}

interface IdentityGateProps {
  externalUserId: string;
  onResolved: (result: IdentityGateResolved) => void;
  onCancel?: () => void;
}

const apiKeySchema = z
  .string()
  .trim()
  .startsWith("spk_", { message: scan.identityGate.invalidKey })
  .min(16, { message: scan.identityGate.tooShort });

export function IdentityGate({
  externalUserId,
  onResolved,
  onCancel,
}: IdentityGateProps) {
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleStart() {
    const parsed = apiKeySchema.safeParse(apiKey);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? scan.identityGate.invalidKey);
      return;
    }

    const key = parsed.data;
    setError("");
    setLoading(true);

    try {
      // A single probe resolves both questions at once: is the key alive
      // (non-2xx throws), and does this (app, user) already own a face
      // profile? The mode the scanner should boot in is a direct function of
      // that answer, so we return both to the caller atomically. No downstream
      // component ever has to guess or flip.
      const client = new FaceApiClient(key);
      const exists = await client.lookupUser(externalUserId);
      const mode: ScanMode = exists ? MODE_AUTHENTICATE : MODE_REGISTER;
      onResolved({ apiKey: key, mode });
    } catch (err) {
      if (isAbortError(err)) return;
      scanError("IdentityGate.lookup failed", {
        apiKey: maskKey(key),
        externalUserId,
        error: err instanceof Error ? err.message : String(err),
      });
      setError(scan.identityGate.invalidKeyServer);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex flex-col items-center justify-center w-full py-10">
      <div className="w-full max-w-[380px] rounded-[24px] p-8 flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <div className="gate-icon-ring">
            <FaceIDGlyph size={28} />
          </div>
          <div>
            <h2 className="face-title text-[18px]">{scan.identityGate.title}</h2>
            <p className="face-helper text-[12px]">
              {scan.identityGate.placeholder}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <input
            type="text"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleStart();
              }
            }}
            placeholder="spk_..."
            className="input-mono"
            autoComplete="off"
            spellCheck={false}
            disabled={loading}
          />
          {error && (
            <Alert variant="destructive" className="py-2 px-3">
              <AlertDescription className="font-mono text-[11px]">
                {error}
              </AlertDescription>
            </Alert>
          )}
          <Button
            type="button"
            variant="primary-glass"
            onClick={handleStart}
            disabled={loading || !apiKey.trim()}
          >
            {loading && <Spinner size="sm" data-icon="inline-start" />}
            {loading ? scan.identityGate.verifying : scan.identityGate.start}
          </Button>
          {onCancel && (
            <Button
              type="button"
              variant="ghost-glass"
              onClick={onCancel}
              disabled={loading}
            >
              {scan.identityGate.cancel}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
