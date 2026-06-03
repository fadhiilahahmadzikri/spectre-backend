import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { getBaseUrl } from "@/lib/config";
import { GoogleIcon } from "@/shared/icons";
import { notify } from "@/shared/lib/notify";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
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
      notify.success("Signed in", {
        description: (
          <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
            {data.user.email}
            <span style={{
              display: "inline-block",
              width: "7px",
              height: "7px",
              borderRadius: "50%",
              backgroundColor: "var(--sys-green)",
              flexShrink: 0,
            }} />
          </span>
        ),
      });
      navigate("/app");
    } catch (err) {
      // Inline error below the form is enough feedback; no duplicate toast
      // (per UX feedback plan: AP-10 redundant multi-channel errors).
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-[360px] flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="face-title text-[26px]">Sign in to Spectre</h1>
        <p className="face-helper text-[13px]">
          Enter your credentials to continue.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <FieldGroup>
          <Field data-invalid={!!error || undefined}>
            <FieldLabel htmlFor="signin-email">Email</FieldLabel>
            <Input
              id="signin-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              aria-invalid={!!error || undefined}
              className="input-mono"
            />
          </Field>
          <Field data-invalid={!!error || undefined}>
            <FieldLabel htmlFor="signin-password">Password</FieldLabel>
            <Input
              id="signin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              aria-invalid={!!error || undefined}
              className="input-mono"
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
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </FieldGroup>
      </form>

      <div className="flex flex-col gap-3">
        <div className="gate-separator" />
        <Button asChild variant="ghost-glass">
          <a href={`${getBaseUrl()}/api/v1/auth/oauth/google`}>
            <GoogleIcon size={16} data-icon="inline-start" />
            Continue with Google
          </a>
        </Button>
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
