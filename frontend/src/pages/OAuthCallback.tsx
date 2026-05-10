import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuthStore } from "@/lib/store";
import { AppShell } from "@/app/layout/AppShell";

export function OAuthCallback() {
  const [params] = useSearchParams();
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();

  useEffect(() => {
    const token = params.get("access_token");
    const refresh = params.get("refresh_token");
    const email = params.get("email");
    const userId = params.get("user_id");
    const displayName = params.get("display_name");

    if (token && refresh) {
      setAuth({
        access_token: token,
        refresh_token: refresh,
        user: {
          id: userId ?? "",
          email: email ?? "",
          display_name: displayName ?? "",
        },
      });
      navigate("/", { replace: true });
    } else {
      navigate("/login", { replace: true });
    }
  }, [params, setAuth, navigate]);

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
