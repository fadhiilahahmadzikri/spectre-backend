import { getBaseUrl } from "@/lib/config";
import { Link } from "react-router-dom";
import { ScanLine, AppWindow, ExternalLink, BookOpen } from "lucide-react";
import { useAuthStore } from "@/lib/store";

export function Dashboard() {
  const base = getBaseUrl();
  const user = useAuthStore((s) => s.user);
  const displayName = user?.display_name || user?.email?.split("@")[0] || "there";

  return (
    <div className="w-full flex flex-col gap-10 pb-16">
      <div className="flex flex-col gap-1.5">
        <p className="face-helper text-[13px]">Welcome back, {displayName}.</p>
        <h1 className="page-title">Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <ActionCard
          to="/scan"
          icon={<ScanLine size={22} />}
          title="Start face scan"
          description="Paste an API key and verify identity."
        />
        <ActionCard
          to="/applications"
          icon={<AppWindow size={22} />}
          title="Applications"
          description="Manage your registered apps."
        />
        <ActionCard
          href={`${base}/docs`}
          icon={<BookOpen size={22} />}
          title="API reference"
          description="Explore endpoints & authentication."
          external
        />
      </div>

      <section className="glass rounded-[20px] p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <h2 className="face-title text-[15px]">Documentation links</h2>
            <p className="face-helper text-[12px]">
              Read the full REST reference for registering and authenticating faces.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <a
            href={`${base}/docs`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] bg-[color:var(--fill-tertiary)] border border-[color:var(--poc-border)] text-[12px] hover:bg-[color:var(--fill-primary)] transition-colors"
          >
            Swagger UI
            <ExternalLink size={12} />
          </a>
          <a
            href={`${base}/redoc`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] bg-[color:var(--fill-tertiary)] border border-[color:var(--poc-border)] text-[12px] hover:bg-[color:var(--fill-primary)] transition-colors"
          >
            ReDoc
            <ExternalLink size={12} />
          </a>
        </div>
      </section>
    </div>
  );
}

interface ActionCardProps {
  to?: string;
  href?: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  external?: boolean;
}

function ActionCard({ to, href, icon, title, description, external }: ActionCardProps) {
  const content = (
    <>
      <div className="gate-icon-ring shrink-0">
        <span className="text-[color:var(--label-primary)]">{icon}</span>
      </div>
      <div className="flex flex-col min-w-0">
        <div className="face-title text-[15px]">{title}</div>
        <p className="face-helper text-[12px]">{description}</p>
      </div>
    </>
  );

  const className =
    "glass-strong hover-glow rounded-[20px] p-5 flex items-center gap-4 cursor-pointer";

  if (href) {
    return (
      <a
        href={href}
        target={external ? "_blank" : undefined}
        rel={external ? "noreferrer" : undefined}
        className={className}
      >
        {content}
      </a>
    );
  }

  return (
    <Link to={to!} className={className}>
      {content}
    </Link>
  );
}
