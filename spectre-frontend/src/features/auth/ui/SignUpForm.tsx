import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
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
import { PasswordStrengthMeter } from "./PasswordStrengthMeter";

const signUpSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string()
    .min(8, "At least 8 characters")
    .regex(/[A-Z]/, "At least one uppercase letter")
    .regex(/[a-z]/, "At least one lowercase letter")
    .regex(/[0-9]/, "At least one number")
    .regex(/[^A-Za-z0-9]/, "At least one special character")
    .refine((pw) => !/\s/.test(pw), "No spaces allowed"),
});

export function SignUpForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const setMode = useAuthUi((s) => s.setMode);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    
    // Validate with Zod
    const result = signUpSchema.safeParse({ name, email, password });
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        if (issue.path[0]) errors[issue.path[0] as string] = issue.message;
      });
      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    try {
      await api.register({ email, password, display_name: name || undefined });
      notify.success("Account created", {
        description: "You can now log in with your credentials.",
      });
      setMode("signin");
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
          <Field data-invalid={!!fieldErrors.name || undefined}>
            <FieldLabel htmlFor="signup-name">Display name</FieldLabel>
            <Input
              id="signup-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              className="input-mono"
            />
            {fieldErrors.name && (
              <FieldDescription data-invalid className="text-[color:var(--danger)] font-mono text-[10px]">
                {fieldErrors.name}
              </FieldDescription>
            )}
          </Field>
          <Field data-invalid={!!fieldErrors.email || !!error || undefined}>
            <FieldLabel htmlFor="signup-email">Email</FieldLabel>
            <Input
              id="signup-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              aria-invalid={!!fieldErrors.email || !!error || undefined}
              className="input-mono"
            />
            {fieldErrors.email && (
              <FieldDescription data-invalid className="text-[color:var(--danger)] font-mono text-[10px]">
                {fieldErrors.email}
              </FieldDescription>
            )}
          </Field>
          <Field data-invalid={!!fieldErrors.password || !!error || undefined}>
            <FieldLabel htmlFor="signup-password">
              Password
            </FieldLabel>
            <Input
              id="signup-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
              aria-invalid={!!fieldErrors.password || !!error || undefined}
              className="input-mono"
            />
            
            <PasswordStrengthMeter password={password} />

            {(fieldErrors.password || error) && (
              <FieldDescription data-invalid className="text-[color:var(--danger)] font-mono text-[10px] mt-2">
                {fieldErrors.password || error}
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

