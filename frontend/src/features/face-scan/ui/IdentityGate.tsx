import { useState } from "react";
import { z } from "zod";
import { FaceIDGlyph } from "@/shared/icons";
import { Spinner } from "@/components/ui/spinner";
import { FaceApiClient } from "../api/face-client";

export interface IdentityGateResolved {
  apiKey: string;
}

interface IdentityGateProps {
  onResolved: (result: IdentityGateResolved) => void;
  externalUserId: string;
  onCancel?: () => void;
}

const apiKeySchema = z
  .string()
  .trim()
  .startsWith("spk_", { message: "Kunci harus diawali dengan 'spk_'" })
  .min(16, { message: "Kunci API terlalu pendek" });

export function IdentityGate({ onResolved, externalUserId, onCancel }: IdentityGateProps) {
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleStart() {
    const parsed = apiKeySchema.safeParse(apiKey);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Kunci tidak valid");
      return;
    }

    setError("");
    setLoading(true);
    try {
      const client = new FaceApiClient(parsed.data);
      const valid = await client.validate();
      if (!valid) {
        setError("API Key tidak valid atau server tidak tersedia");
        return;
      }
      onResolved({ apiKey: parsed.data });
    } catch {
      setError("API Key tidak valid atau server tidak tersedia");
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
            <h2 className="face-title text-[18px]">Face Scan</h2>
            <p className="face-helper text-[12px]">Paste API Key yang sudah di-generate</p>
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
          />
          {error && (
            <p className="text-[11px] text-[color:var(--danger)] font-mono">{error}</p>
          )}
          <button
            type="button"
            onClick={handleStart}
            disabled={loading || !apiKey.trim()}
            className="btn-primary inline-flex items-center justify-center gap-2"
          >
            {loading && <Spinner size="sm" />}
            {loading ? "Memverifikasi..." : "Mulai Face Scan"}
          </button>
          {onCancel && (
            <button type="button" className="btn-ghost" onClick={onCancel}>
              Batal
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
