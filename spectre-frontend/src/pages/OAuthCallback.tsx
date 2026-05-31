import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuthStore } from "@/lib/store";
import { AppShell } from "@/app/layout/AppShell";
import { FaceIDGlyph } from "@/shared/icons";
import { Button } from "@/components/ui/button";

export function OAuthCallback() {
  const [params] = useSearchParams();
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();

  const token = params.get("access_token");
  const refresh = params.get("refresh_token");
  const hasCredentials = !!(token && refresh);

  // Ref so the side-effects fire exactly once even under StrictMode's
  // double-invocation.
  const dispatched = useRef(false);

  useEffect(() => {
    if (dispatched.current) return;
    if (!hasCredentials) return;
    dispatched.current = true;

    setAuth({
      access_token: token,
      refresh_token: refresh,
      user: {
        id: params.get("user_id") ?? "",
        email: params.get("email") ?? "",
        display_name: params.get("display_name") ?? "",
        role: params.get("role") ?? "user",
      },
    });
    navigate("/app", { replace: true });
  }, [hasCredentials, token, refresh, params, setAuth, navigate]);

  if (!hasCredentials) {
    return (
      <AppShell>
        <div className="app-content items-center justify-center">
          <div className="glass-strong w-full max-w-[380px] rounded-[var(--radius-card-strong)] p-8 flex flex-col items-center gap-5 text-center">
            <FaceIDGlyph size={44} />
            <div className="flex flex-col gap-1">
              <h1 className="face-title text-[20px]">Sign-in failed</h1>
              <p className="face-helper text-[12.5px] max-w-[300px]">
                We couldn&apos;t complete your sign-in. Please try again.
              </p>
            </div>
            <Button
              type="button"
              variant="primary-glass"
              size="inline"
              onClick={() => navigate("/login", { replace: true })}
              className="!px-6"
            >
              Return to sign-in
            </Button>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="app-content items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="gate-spinner" />
          <span className="kbd-mono">Completing sign-in...</span>
        </div>
      </div>
    </AppShell>
  );
}
