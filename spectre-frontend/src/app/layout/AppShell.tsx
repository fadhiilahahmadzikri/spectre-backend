import type { ReactNode } from "react";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="app-shell">
      <div className="bg-aura" />
      <div className="bg-gradient-bottom" />
      {children}
    </div>
  );
}
