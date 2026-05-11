import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import type { ConfigItem, ConfigDraft } from "../model/types";

interface ConfigSectionProps {
  items: ConfigItem[];
  draft: ConfigDraft;
  onChange: (key: string, value: string) => void;
}

function formatLabel(key: string): string {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function ConfigSection({ items, draft, onChange }: ConfigSectionProps) {
  return (
    <FieldGroup>
      {items.map((item) => (
        <ConfigField
          key={item.key}
          item={item}
          value={draft[item.key] ?? item.value}
          onChange={(v) => onChange(item.key, v)}
        />
      ))}
    </FieldGroup>
  );
}

interface ConfigFieldProps {
  item: ConfigItem;
  value: string;
  onChange: (v: string) => void;
}

function ConfigField({ item, value, onChange }: ConfigFieldProps) {
  const label = formatLabel(item.key);

  if (item.data_type === "bool") {
    return (
      <Field
        orientation="horizontal"
        className="rounded-[var(--radius-field)] border border-[color:var(--separator)] bg-white/[0.02] p-3"
      >
        <FieldContent>
          <FieldLabel htmlFor={`cfg-${item.key}`}>{label}</FieldLabel>
          {item.description && (
            <FieldDescription>{item.description}</FieldDescription>
          )}
        </FieldContent>
        <Switch
          id={`cfg-${item.key}`}
          checked={value.toLowerCase() === "true"}
          onCheckedChange={(c) => onChange(String(c))}
        />
      </Field>
    );
  }

  const isNumeric = item.data_type === "int" || item.data_type === "float";

  return (
    <Field className="rounded-[var(--radius-field)] border border-[color:var(--separator)] bg-white/[0.02] p-3">
      <div className="flex items-center justify-between w-full">
        <FieldLabel htmlFor={`cfg-${item.key}`}>{label}</FieldLabel>
        <span className="kbd-mono text-[9px] uppercase">{item.data_type}</span>
      </div>
      <Input
        id={`cfg-${item.key}`}
        type={isNumeric ? "number" : "text"}
        step={item.data_type === "float" ? "0.01" : undefined}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input-mono"
      />
      {item.description && (
        <FieldDescription>{item.description}</FieldDescription>
      )}
    </Field>
  );
}
