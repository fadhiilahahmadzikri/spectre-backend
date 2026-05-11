import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { AppShell } from "@/app/layout/AppShell";
import { FaceIDGlyph } from "@/shared/icons";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { notify } from "@/shared/lib/notify";

export function VerifyEmail() {
  const location = useLocation();
  const email = (location.state as { email?: string } | null)?.email ?? "";
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const navigate = useNavigate();

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.verifyEmail({ email, otp_code: otp });
      notify.success("Email verified", {
        description: "Redirecting to sign-in…",
      });
      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (resendLoading) return;
    setError("");
    setResendLoading(true);
    try {
      await api.resendOtp({ email });
      notify.success(`OTP resent to ${email}`);
    } catch (err) {
      notify.error(err instanceof Error ? err.message : String(err));
    } finally {
      setResendLoading(false);
    }
  }

  return (
    <AppShell>
      <div className="app-content items-center justify-center">
        <div className="glass-strong w-full max-w-[380px] rounded-[var(--radius-card-strong)] p-8 flex flex-col gap-6">
          <div className="flex flex-col items-center gap-3">
            <FaceIDGlyph size={44} />
            <h1 className="face-title text-[20px]">Verify your email</h1>
            <p className="face-helper text-[12px] text-center">
              Enter the OTP sent to{" "}
              <strong className="text-[color:var(--label-primary)]">
                {email}
              </strong>
            </p>
          </div>

          <form onSubmit={handleVerify}>
            <FieldGroup>
              <Field data-invalid={!!error || undefined}>
                <FieldLabel htmlFor="verify-otp" className="sr-only">
                  OTP code
                </FieldLabel>
                <Input
                  id="verify-otp"
                  type="text"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="input-mono text-center tracking-[0.5em] text-[18px]"
                  maxLength={6}
                  required
                  inputMode="numeric"
                  aria-invalid={!!error || undefined}
                />
                {error && (
                  <FieldDescription data-invalid className="text-[color:var(--danger)] font-mono">
                    {error}
                  </FieldDescription>
                )}
              </Field>
              <Button
                type="submit"
                variant="primary-glass"
                disabled={loading}
                className="mt-1"
              >
                {loading && <Spinner size="sm" data-icon="inline-start" />}
                {loading ? "Verifying..." : "Verify"}
              </Button>
            </FieldGroup>
          </form>

          <button
            type="button"
            disabled={resendLoading}
            className="kbd-mono hover:text-[color:var(--label-primary)] transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2"
            onClick={handleResend}
          >
            {resendLoading && <Spinner size="sm" data-icon="inline-start" />}
            {resendLoading ? "Resending…" : "Resend OTP"}
          </button>
        </div>
      </div>
    </AppShell>
  );
}
