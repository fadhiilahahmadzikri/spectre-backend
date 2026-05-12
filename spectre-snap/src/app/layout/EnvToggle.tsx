import { useEffect, useState } from "react";
import { Terminal } from "lucide-react";
import { getBaseUrl, resolveEnvName, type EnvName } from "@/lib/config";
import { useEnvironmentSwitch } from "@/features/configuration/model/useEnvironmentSwitch";
import { admin } from "@/shared/lib/copy";

const HF_LOGO_URL = "https://huggingface.co/front/assets/huggingface_logo-noborder.svg";

interface EnvToggleProps {
  showLabel?: boolean;
}

const LABELS: Record<EnvName, string> = {
  local: admin.layout.envLocal,
  hf: admin.layout.envHf,
};

/**
 * EnvToggle — thin UI over `useEnvironmentSwitch`. The orchestration overlay
 * provides user feedback during the switch; this component just fires the
 * command.
 */
export function EnvToggle({ showLabel = true }: EnvToggleProps) {
  const [env, setEnv] = useState<EnvName>(() => resolveEnvName(getBaseUrl()));
  const { switchTo, isSyncing } = useEnvironmentSwitch();

  useEffect(() => {
    const listener = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      setEnv(resolveEnvName(detail));
    };
    window.addEventListener("spectre:env-change", listener);
    return () => window.removeEventListener("spectre:env-change", listener);
  }, []);

  function toggle() {
    if (isSyncing) return;
    const next: EnvName = env === "hf" ? "local" : "hf";
    void switchTo(next);
  }

  const isHf = env === "hf";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isHf}
      aria-label={admin.layout.envSwitchTo(
        isHf ? admin.layout.envLocal : admin.layout.envHf,
      )}
      onClick={toggle}
      disabled={isSyncing}
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
