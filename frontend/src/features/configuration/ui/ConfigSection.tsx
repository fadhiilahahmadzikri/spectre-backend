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

  if (item.key === "benchmark_models") {
    return <BenchmarkModelsField item={item} value={value} onChange={onChange} />;
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
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between px-1">
        <span className="text-[12px] font-medium text-[color:var(--label-primary)]">
          Active FAS Model
        </span>
        {data && (
          <span className="kbd-mono text-[9px] text-[color:var(--label-tertiary)]">
            {data.loaded_count} loaded
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-1.5">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="rounded-lg border border-white/[0.06] px-3 py-2.5 animate-pulse"
            >
              <div className="flex items-center gap-3">
                <div className="size-3.5 rounded-full bg-white/[0.06]" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-32 rounded bg-white/[0.06]" />
                  <div className="h-2.5 w-56 rounded bg-white/[0.04]" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : data ? (
        <div className="flex flex-col gap-1.5">
          {data.models.map((model) => {
            const isSelected = value === model.model_id;
            return (
              <label
                key={model.model_id}
                className={[
                  "relative flex items-center gap-3 rounded-lg px-3 py-2.5 cursor-pointer transition-all",
                  isSelected
                    ? "border border-indigo-500/60 bg-indigo-500/[0.08]"
                    : "border border-white/[0.06] hover:bg-white/[0.03]",
                  !model.is_loaded && "opacity-40 pointer-events-none",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <input
                  type="radio"
                  name="active_fas_model"
                  value={model.model_id}
                  checked={isSelected}
                  onChange={() => onChange(model.model_id)}
                  disabled={!model.is_loaded}
                  className="sr-only"
                />
                <div
                  className={[
                    "shrink-0 size-3.5 rounded-full border flex items-center justify-center transition-all",
                    isSelected
                      ? "border-indigo-400 bg-indigo-500"
                      : "border-white/20 bg-transparent",
                  ].join(" ")}
                >
                  {isSelected && (
                    <div className="size-1.5 rounded-full bg-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={[
                        "text-[13px] font-medium",
                        isSelected
                          ? "text-white"
                          : "text-[color:var(--label-secondary)]",
                      ].join(" ")}
                    >
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
                    {isSelected && (
                      <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold uppercase tracking-wider">
                        Active
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
            );
          })}
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
        <p className="text-[11px] text-[color:var(--label-tertiary)] px-1">
          {item.description}
        </p>
      )}
    </div>
  );
}



function BenchmarkModelsField({
  item,
  value,
  onChange,
}: ConfigFieldProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-fas-models"],
    queryFn: ({ signal }) => api.getFasModels({ signal }),
    staleTime: 30_000,
  });

  let selected: string[] = [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) selected = parsed.filter((x) => typeof x === "string");
  } catch {
    selected = [];
  }

  const toggle = (modelId: string) => {
    const next = selected.includes(modelId)
      ? selected.filter((m) => m !== modelId)
      : [...selected, modelId];
    onChange(JSON.stringify(next));
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between px-1">
        <span className="text-[12px] font-medium text-[color:var(--label-primary)]">
          Benchmark Models
        </span>
        <span className="kbd-mono text-[9px] text-[color:var(--label-tertiary)]">
          {selected.length} selected
        </span>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-1.5">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="rounded-lg border border-white/[0.06] px-3 py-2.5 animate-pulse"
            >
              <div className="flex items-center gap-3">
                <div className="size-3.5 rounded bg-white/[0.06]" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-32 rounded bg-white/[0.06]" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : data ? (
        <div className="flex flex-col gap-1.5">
          {data.models.map((model) => {
            const checked = selected.includes(model.model_id);
            return (
              <label
                key={model.model_id}
                className={[
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 cursor-pointer transition-all",
                  checked
                    ? "border border-indigo-500/60 bg-indigo-500/[0.08]"
                    : "border border-white/[0.06] hover:bg-white/[0.03]",
                  !model.is_loaded && "opacity-40 pointer-events-none",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(model.model_id)}
                  disabled={!model.is_loaded}
                  className="sr-only"
                />
                <div
                  className={[
                    "shrink-0 size-3.5 rounded border flex items-center justify-center transition-all",
                    checked
                      ? "border-indigo-400 bg-indigo-500"
                      : "border-white/20 bg-transparent",
                  ].join(" ")}
                >
                  {checked && (
                    <svg className="size-2.5 text-white" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-medium text-[color:var(--label-primary)]">
                      {model.model_id}
                    </span>
                    <span className="kbd-mono text-[9px] text-[color:var(--label-tertiary)]">
                      v{model.version}
                    </span>
                    {!model.is_loaded && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 font-medium">
                        FAILED
                      </span>
                    )}
                  </div>
                </div>
              </label>
            );
          })}
        </div>
      ) : (
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="input-mono"
        />
      )}

      {item.description && (
        <p className="text-[11px] text-[color:var(--label-tertiary)] px-1">
          {item.description}
        </p>
      )}
    </div>
  );
}
