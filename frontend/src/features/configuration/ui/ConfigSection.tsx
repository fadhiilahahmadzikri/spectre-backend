import { Switch } from "@/components/ui/switch";
import type { ConfigItem, ConfigDraft } from "../model/types";

interface ConfigSectionProps {
  items: ConfigItem[];
  draft: ConfigDraft;
  onChange: (key: string, value: string) => void;
}

export function ConfigSection({ items, draft, onChange }: ConfigSectionProps) {
  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => (
        <ConfigField
          key={item.key}
          item={item}
          value={draft[item.key] ?? item.value}
          onChange={(v) => onChange(item.key, v)}
        />
      ))}
    </div>
  );
}

function ConfigField({ item, value, onChange }: { item: ConfigItem; value: string; onChange: (v: string) => void }) {
  if (item.data_type === "bool") {
    return (
      <label className="flex items-center justify-between gap-3 p-3 rounded-[14px] border border-[color:var(--separator)] bg-white/[0.02]">
        <div className="flex flex-col min-w-0">
          <span className="text-[13px] text-[color:var(--label-primary)] font-medium tracking-[-0.01em]">{formatLabel(item.key)}</span>
          <span className="kbd-mono text-[10px] mt-0.5">{item.description}</span>
        </div>
        <Switch checked={value.toLowerCase() === "true"} onCheckedChange={(c) => onChange(String(c))} />
      </label>
    );
  }

  return (
    <div className="flex flex-col gap-2 p-3 rounded-[14px] border border-[color:var(--separator)] bg-white/[0.02]">
      <div className="flex items-center justify-between">
        <span className="text-[13px] text-[color:var(--label-primary)] font-medium tracking-[-0.01em]">{formatLabel(item.key)}</span>
        <span className="kbd-mono text-[9px] uppercase">{item.data_type}</span>
      </div>
      <input
        type={item.data_type === "int" || item.data_type === "float" ? "number" : "text"}
        step={item.data_type === "float" ? "0.01" : undefined}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input-mono"
      />
      <span className="kbd-mono text-[10px]">{item.description}</span>
    </div>
  );
}

function formatLabel(key: string): string {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
