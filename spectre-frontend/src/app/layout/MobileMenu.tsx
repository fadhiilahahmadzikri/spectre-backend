import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, ScanLine, AppWindow, LogOut, LayoutDashboard, Settings2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/store";
import { useMediaQuery, MEDIA_MOBILE } from "@/shared/hooks/use-media-query";
import { FaceIDGlyph } from "@/shared/icons";
import { useConfigUi } from "@/features/configuration";

export function MobileMenu() {
  const isMobile = useMediaQuery(MEDIA_MOBILE);
  const [open, setOpen] = useState(false);
  const openDialog = useConfigUi((s) => s.openDialog);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  if (!isMobile) return null;

  function handleNav(path: string) {
    setOpen(false);
    setTimeout(() => navigate(path), 160);
  }

  function handleLogout() {
    setOpen(false);
    logout();
    setTimeout(() => navigate("/login"), 160);
  }

  function handleOpenConfig() {
    setOpen(false);
    setTimeout(() => openDialog(), 200);
  }

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <button type="button" className="icon-btn" aria-label="Open menu">
            <Menu size={16} />
          </button>
        </SheetTrigger>
        <SheetContent
          side="right"
          className="glass-strong border-none p-0 w-[280px] sm:max-w-[280px] [&>button]:top-4 [&>button]:right-4"
        >
          <SheetTitle className="sr-only">Navigation menu</SheetTitle>
          <SheetDescription className="sr-only">Main application navigation</SheetDescription>

          <div className="flex flex-col h-full">
            <div className="px-5 pt-5 pb-4 flex items-center gap-2 border-b border-[color:var(--separator)]">
              <FaceIDGlyph size={20} />
              <span className="face-title text-[14px]">Spectre</span>
            </div>

            {user?.email && (
              <div className="px-5 py-4 border-b border-[color:var(--separator)]">
                <div className="user-chip max-w-full">
                  <span className="ring-dot" />
                  <span>{user.email}</span>
                </div>
              </div>
            )}

            <nav className="flex flex-col p-3 gap-1">
              <MobileNavItem icon={<LayoutDashboard size={16} />} label="Dashboard" onClick={() => handleNav("/app")} />
              <MobileNavItem icon={<AppWindow size={16} />} label="Applications" onClick={() => handleNav("/app/applications")} />
              <MobileNavItem icon={<ScanLine size={16} />} label="Face scan" onClick={() => handleNav("/app/scan")} />
              {user?.role === "admin" && (
                <MobileNavItem icon={<Settings2 size={16} />} label="Configuration" onClick={handleOpenConfig} />
              )}
              {user?.role === "admin" && (
                <MobileNavItem icon={<AppWindow size={16} />} label="Monitoring" onClick={() => handleNav("/app/admin/monitoring")} />
              )}
            </nav>

            <div className="mt-auto p-5 flex flex-col gap-4 border-t border-[color:var(--separator)]">
              <Button type="button" variant="ghost-glass" onClick={handleLogout}>
                <LogOut data-icon="inline-start" />
                Log out
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* ConfigDialog is mounted once at the AppHeader level; we simply
          trigger the shared store here. */}
    </>
  );
}

interface MobileNavItemProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}

function MobileNavItem({ icon, label, onClick }: MobileNavItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-3 px-3 py-2.5 rounded-[12px] hover:bg-white/[0.04] active:bg-white/[0.08] transition-colors text-left text-[14px] text-[color:var(--label-primary)]"
    >
      <span className="text-[color:var(--label-secondary)]">{icon}</span>
      <span className="flex-1">{label}</span>
    </button>
  );
}
