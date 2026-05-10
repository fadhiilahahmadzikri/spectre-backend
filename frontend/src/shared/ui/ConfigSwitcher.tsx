import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { notify } from "@/shared/lib/notify";
import { useOrchestrationStore } from "@/lib/store";

export interface ConfigOption {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
}

interface ConfigSwitcherProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  options: ConfigOption[];
  activeId: string;
  onChange: (id: string) => Promise<void>;
}

export function ConfigSwitcher({
  title,
  description,
  icon,
  options,
  activeId,
  onChange,
}: ConfigSwitcherProps) {
  const { addLog, isSyncing, setSyncing } = useOrchestrationStore();
  const [internalSyncingId, setInternalSyncingId] = useState<string | null>(null);

  const handleSwitch = async (option: ConfigOption) => {
    if (option.id === activeId || isSyncing) return;

    setInternalSyncingId(option.id);
    setSyncing(true);
    addLog(`User requested switch to ${option.label}`, "info");
    
    notify.info(`Switching ${title}`, {
      description: `Synchronizing environment to ${option.label}...`,
      duration: 3000,
    });

    try {
      await onChange(option.id);
      notify.success(`${title} Synchronized`, {
        description: `Successfully switched to ${option.label}.`,
        duration: 3000,
      });
    } catch (err) {
      addLog(`Critical: Synchronization failed for ${option.label}`, "error");
      notify.error(`Synchronization Failed`, {
        description: `Failed to switch to ${option.label}. Reverting.`,
        duration: 4000,
      });
      throw err;
    } finally {
      setInternalSyncingId(null);
      setSyncing(false);
    }
  };

  return (
    <div className="glass-strong rounded-[20px] p-6 flex flex-col gap-6 shadow-sm border border-white/5">
      <div className="flex items-center gap-3 border-b border-[color:var(--border-secondary)] pb-4">
        <div className="p-2 rounded-lg bg-[color:var(--bg-secondary)] text-[color:var(--label-secondary)]">
          {icon}
        </div>
        <div>
          <h2 className="face-title text-lg">{title}</h2>
          <p className="face-helper text-xs">{description}</p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {options.map((option) => {
          const isActive = activeId === option.id;
          const isSyncingOption = internalSyncingId === option.id;

          return (
            <button
              key={option.id}
              onClick={() => handleSwitch(option)}
              disabled={isSyncing}
              className={`relative flex items-center justify-between p-4 rounded-xl border text-left transition-all duration-200 ${
                isActive 
                  ? "bg-[color:var(--fill-primary)] border-[color:var(--border-primary)] shadow-sm" 
                  : "bg-transparent border-transparent hover:bg-[color:var(--bg-secondary)]"
              } ${isSyncing && !isSyncingOption ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-full ${isActive ? "bg-[color:var(--bg-primary)] text-blue-500" : "bg-[color:var(--bg-secondary)] text-[color:var(--label-secondary)]"}`}>
                  {option.icon}
                </div>
                <div className="flex flex-col">
                  <span className={`font-medium text-sm ${isActive ? "text-[color:var(--label-primary)]" : "text-[color:var(--label-secondary)]"}`}>
                    {option.label}
                  </span>
                  <span className="text-xs font-mono text-[color:var(--label-tertiary)]">
                    {option.description}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-center w-6 h-6">
                {isSyncingOption ? (
                  <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                ) : isActive ? (
                  <Check className="w-5 h-5 text-green-500" />
                ) : null}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
