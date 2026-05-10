import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { AppShell } from "@/app/layout/AppShell";
import { FaceIDGlyph } from "@/shared/icons";

export function VerifyEmail() {
  const location = useLocation();
  const email = (location.state as { email?: string } | null)?.email ?? "";
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.verifyEmail({ email, otp_code: otp });
      setSuccess("Email verified. Redirecting to sign-in...");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setError("");
    try {
      await api.resendOtp({ email });
      setSuccess("OTP resent to " + email);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <AppShell>
      <div className="app-content items-center justify-center">
        <div className="glass-strong w-full max-w-[380px] rounded-[24px] p-8 flex flex-col gap-6">
          <div className="flex flex-col items-center gap-3">
            <FaceIDGlyph size={44} />
            <h1 className="face-title text-[20px]">Verify your email</h1>
            <p className="face-helper text-[12px] text-center">
              Enter the OTP sent to <strong className="text-[color:var(--label-primary)]">{email}</strong>
            </p>
          </div>

          <form onSubmit={handleVerify} className="flex flex-col gap-3">
            <input
              type="text"
              placeholder="000000"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="input-mono text-center tracking-[0.5em] text-[18px]"
              maxLength={6}
              required
              inputMode="numeric"
            />
            {error && (
              <p className="text-[11px] text-[color:var(--danger)] font-mono">{error}</p>
            )}
            {success && (
              <p className="text-[11px] text-[color:var(--sys-green)] font-mono">{success}</p>
            )}
            <button type="submit" disabled={loading} className="btn-primary mt-1">
              {loading ? "Verifying..." : "Verify"}
            </button>
          </form>

          <button
            type="button"
            className="kbd-mono hover:text-[color:var(--label-primary)] transition-colors"
            onClick={handleResend}
          >
            Resend OTP
          </button>
        </div>
      </div>
    </AppShell>
  );
}
