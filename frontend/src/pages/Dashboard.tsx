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

      <section className="flex flex-col gap-3">
        <div className="flex flex-col gap-0.5">
          <h2 className="face-title text-[15px]">Documentation</h2>
          <p className="face-helper text-[12px]">REST API reference for face registration and authentication.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <DocCard
            href={`${base}/docs`}
            icon="https://cdn.jsdelivr.net/gh/swagger-api/swagger-ui@master/dist/favicon-32x32.png"
            title="Swagger UI"
            description="Interactive API explorer"
          />
          <DocCard
            href={`${base}/redoc`}
            icon="https://cdn.redoc.ly/redoc/logo-mini.svg"
            title="ReDoc"
            description="Clean API documentation"
          />
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


interface DocCardProps {
  href: string;
  icon: string;
  title: string;
  description: string;
}

function DocCard({ href, icon, title, description }: DocCardProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="glass-strong hover-glow rounded-[16px] p-4 flex items-center gap-3 cursor-pointer"
    >
      <img src={icon} alt="" width={28} height={28} className="rounded-md shrink-0" />
      <div className="flex flex-col min-w-0">
        <span className="face-title text-[13px]">{title}</span>
        <span className="face-helper text-[11px]">{description}</span>
      </div>
      <ExternalLink size={14} className="shrink-0 text-[color:var(--label-tertiary)] ml-auto" />
    </a>
  );
}
