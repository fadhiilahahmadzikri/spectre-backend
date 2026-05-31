import { Outlet } from "react-router-dom";
import { AppShell } from "@/app/layout/AppShell";
import { AppHeader } from "@/app/layout/AppHeader";

export function Layout() {
  return (
    <AppShell>
      <AppHeader />
      <main className="app-content max-w-6xl mx-auto w-full px-4 md:px-6 pt-10 md:pt-14 pb-16">
        <Outlet />
      </main>
    </AppShell>
  );
}
