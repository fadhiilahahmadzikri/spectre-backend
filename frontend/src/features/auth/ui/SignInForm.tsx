import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { getBaseUrl } from "@/lib/config";
import { GoogleIcon } from "@/shared/icons";
import { notify } from "@/shared/lib/notify";
import { useAuthUi } from "../model/auth-ui-store";

export function SignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();
  const setMode = useAuthUi((s) => s.setMode);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await api.login({ email, password });
      setAuth(data);
      notify.success("Signed in", { description: data.user.email });
      navigate("/");
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
        <h1 className="face-title text-[26px]">Sign in to Spectre</h1>
        <p className="face-helper text-[13px]">Enter your credentials to continue.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
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
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input-mono"
          autoComplete="current-password"
          required
        />
        {error && (
          <p className="text-[11px] text-[color:var(--danger)] font-mono">{error}</p>
        )}
        <button type="submit" disabled={loading} className="btn-primary mt-1">
          {loading ? "Signing in…" : "Sign in"}
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
        No account?{" "}
        <button
          type="button"
          onClick={() => setMode("signup")}
          className="text-[color:var(--label-primary)] underline underline-offset-4 hover:opacity-80"
        >
          Create one
        </button>
      </p>
    </div>
  );
}
