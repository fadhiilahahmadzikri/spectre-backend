import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/lib/store";
import { FaceIDGlyph } from "@/shared/icons";
import { ScanLine, LogOut } from "lucide-react";
import { EnvToggle } from "./EnvToggle";
import { MobileMenu } from "./MobileMenu";

export function AppHeader() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  return (
    <header className="w-full sticky top-0 z-30">
      <div className="glass-strong h-[60px] px-4 md:px-6 flex items-center justify-between gap-4 rounded-none border-x-0 border-t-0">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2 text-[color:var(--label-primary)]">
            <FaceIDGlyph size={22} />
            <span className="face-title text-[14px]">Spectre</span>
          </Link>
          <nav className="hidden md:flex items-center gap-5">
            <Link
              to="/"
              className="text-[13px] text-[color:var(--label-secondary)] hover:text-[color:var(--label-primary)] transition-colors"
            >
              Dashboard
            </Link>
            <Link
              to="/applications"
              className="text-[13px] text-[color:var(--label-secondary)] hover:text-[color:var(--label-primary)] transition-colors"
            >
              Applications
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="hidden md:inline-flex">
            <EnvToggle />
          </div>

          {user?.email && (
            <div className="user-chip hidden lg:inline-flex">
              <span className="ring-dot" />
              <span>{user.email}</span>
            </div>
          )}

          <button
            type="button"
            className="icon-btn hidden md:inline-flex"
            aria-label="Start face scan"
            onClick={() => navigate("/scan")}
          >
            <ScanLine size={16} />
          </button>

          <button
            type="button"
            className="icon-btn hidden md:inline-flex"
            aria-label="Log out"
            onClick={() => {
              logout();
              navigate("/login");
            }}
          >
            <LogOut size={14} />
          </button>

          <MobileMenu />
        </div>
      </div>
    </header>
  );
}
