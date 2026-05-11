import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
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
      notify.success("Account created", {
        description: "Check your inbox for the OTP.",
      });
      navigate("/verify-email", { state: { email } });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-[360px] flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="face-title text-[26px]">Create your account</h1>
        <p className="face-helper text-[13px]">
          Join Spectre in under a minute.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="signup-name">Display name</FieldLabel>
            <Input
              id="signup-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              className="input-mono"
            />
          </Field>
          <Field data-invalid={!!error || undefined}>
            <FieldLabel htmlFor="signup-email">Email</FieldLabel>
            <Input
              id="signup-email"
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
            <FieldLabel htmlFor="signup-password">
              Password (min 8 chars)
            </FieldLabel>
            <Input
              id="signup-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
              minLength={8}
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
            {loading ? "Creating…" : "Create account"}
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
