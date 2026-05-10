import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Terminal } from "lucide-react";
import { ENV, getBaseUrl, resolveEnvName, setBaseUrl, type EnvName } from "@/lib/config";
import { notify } from "@/shared/lib/notify";

const HF_LOGO_URL = "https://huggingface.co/front/assets/huggingface_logo-noborder.svg";

interface EnvToggleProps {
  showLabel?: boolean;
}

const LABELS: Record<EnvName, string> = {
  local: "Local",
  hf: "HF Space",
};

export function EnvToggle({ showLabel = true }: EnvToggleProps) {
  const qc = useQueryClient();
  const [env, setEnv] = useState<EnvName>(() => resolveEnvName(getBaseUrl()));

  useEffect(() => {
    const listener = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      setEnv(resolveEnvName(detail));
    };
    window.addEventListener("spectre:env-change", listener);
    return () => window.removeEventListener("spectre:env-change", listener);
  }, []);

  function toggle() {
    const next: EnvName = env === "hf" ? "local" : "hf";
    const nextUrl = next === "hf" ? ENV.HF_SPACES : ENV.LOCAL;
    setEnv(next);
    setBaseUrl(nextUrl);
    qc.invalidateQueries();
    notify.success(`Switched to ${LABELS[next]}`, {
      description: nextUrl,
      duration: 2200,
    });
  }

  const isHf = env === "hf";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isHf}
      aria-label={`Switch to ${isHf ? "Local" : "HF Space"} environment`}
      onClick={toggle}
      className="env-toggle"
      data-state={env}
    >
      <span className="env-toggle-track" aria-hidden="true">
        <span className="env-toggle-thumb" />
        <span className="env-toggle-icon env-toggle-icon-local">
          <Terminal size={13} strokeWidth={2.2} />
        </span>
        <span className="env-toggle-icon env-toggle-icon-hf">
          <img src={HF_LOGO_URL} alt="" width={14} height={14} draggable={false} />
        </span>
      </span>
      {showLabel && <span className="env-toggle-label">{LABELS[env]}</span>}
    </button>
  );
}
