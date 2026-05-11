import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
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
  if (item.key === "active_fas_model") {
    return <FASModelField item={item} value={value} onChange={onChange} />;
  }

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

function FASModelField({
  item,
  value,
  onChange,
}: ConfigFieldProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-fas-models"],
    queryFn: ({ signal }) => api.getFasModels({ signal }),
    staleTime: 30_000,
  });

  return (
    <Field className="rounded-[var(--radius-field)] border border-[color:var(--separator)] bg-white/[0.02] p-3">
      <div className="flex items-center justify-between w-full">
        <FieldLabel htmlFor="cfg-active_fas_model">Active FAS Model</FieldLabel>
        {isLoading && <Spinner size="sm" />}
        {data && (
          <span className="kbd-mono text-[9px] text-[color:var(--label-tertiary)]">
            {data.loaded_count} loaded
          </span>
        )}
      </div>

      {data ? (
        <div className="flex flex-col gap-1.5 mt-2">
          {data.models.map((model) => (
            <label
              key={model.model_id}
              className={[
                "flex items-center gap-3 rounded-lg border px-3 py-2.5 cursor-pointer transition-all",
                value === model.model_id
                  ? "border-[color:var(--accent)] bg-[color:var(--accent)]/[0.06]"
                  : "border-[color:var(--separator)] bg-white/[0.01] hover:bg-white/[0.03]",
                !model.is_loaded && "opacity-40 pointer-events-none",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <input
                type="radio"
                name="active_fas_model"
                value={model.model_id}
                checked={value === model.model_id}
                onChange={() => onChange(model.model_id)}
                disabled={!model.is_loaded}
                className="accent-[color:var(--accent)] w-3.5 h-3.5"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-medium text-[color:var(--label-primary)]">
                    {model.model_id}
                  </span>
                  <span className="kbd-mono text-[9px] text-[color:var(--label-tertiary)]">
                    v{model.version}
                  </span>
                  {model.supports_tta && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-medium">
                      TTA
                    </span>
                  )}
                  {!model.is_loaded && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 font-medium">
                      FAILED
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[color:var(--label-tertiary)] mt-0.5 truncate">
                  {model.description}
                </p>
                {model.load_error && (
                  <p className="text-[10px] text-red-400 mt-0.5 truncate">
                    {model.load_error}
                  </p>
                )}
              </div>
            </label>
          ))}
        </div>
      ) : (
        <Input
          id="cfg-active_fas_model"
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="input-mono"
        />
      )}

      {item.description && (
        <FieldDescription className="mt-2">{item.description}</FieldDescription>
      )}
    </Field>
  );
}
