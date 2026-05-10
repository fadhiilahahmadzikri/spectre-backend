import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { getBaseUrl } from "@/lib/config";
import { GoogleIcon } from "@/shared/icons";
import { notify } from "@/shared/lib/notify";
import { useAuthUi } from "../model/auth-ui-store";

export function SignUpForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const setMode = useAuthUi((s) => s.setMode);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.register({ email, password, display_name: name || undefined });
      notify.success("Account created", { description: "Check your inbox for the OTP." });
      navigate("/verify-email", { state: { email } });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      notify.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-[360px] flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="face-title text-[26px]">Create your account</h1>
        <p className="face-helper text-[13px]">Join Spectre in under a minute.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="text"
          placeholder="Display name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input-mono"
          autoComplete="name"
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input-mono"
          autoComplete="email"
          required
        />
        <input
          type="password"
          placeholder="Password (min 8 chars)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input-mono"
          autoComplete="new-password"
          required
          minLength={8}
        />
        {error && (
          <p className="text-[11px] text-[color:var(--danger)] font-mono">{error}</p>
        )}
        <button type="submit" disabled={loading} className="btn-primary mt-1">
          {loading ? "Creating…" : "Create account"}
        </button>
      </form>

      <div className="flex flex-col gap-3">
        <div className="gate-separator" />
        <a
          href={`${getBaseUrl()}/api/v1/auth/oauth/google`}
          className="btn-ghost inline-flex items-center justify-center gap-2"
        >
          <GoogleIcon size={16} />
          Continue with Google
        </a>
      </div>

      <p className="face-helper text-[12px] text-center">
        Already have an account?{" "}
        <button
          type="button"
          onClick={() => setMode("signin")}
          className="text-[color:var(--label-primary)] underline underline-offset-4 hover:opacity-80"
        >
          Sign in
        </button>
      </p>
    </div>
  );
}
