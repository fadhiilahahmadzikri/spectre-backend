import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuthStore } from "@/lib/store";

export function GuestRoute({ children }: { children: ReactNode }) {
  const token = useAuthStore((s) => s.accessToken);
  if (token) return <Navigate to="/app" replace />;
  return <>{children}</>;
}
