import { useEffect, useRef, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { GlassDrawer, GlassDrawerHeader } from "@/shared/ui/GlassDrawer";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { FaceIDGlyph, ArrowRightIcon } from "@/shared/icons";
import { MODE_REGISTER } from "../../model/constants";
import type { ScanMode, ScanResult } from "../../model/types";
import { type ConfigDraft } from "../../model/config-draft";
import { scan } from "@/shared/lib/copy";

export type { ConfigDraft };
export { CONFIG_DRAFT_DEFAULT } from "../../model/config-draft";

interface ConfigPanelProps {
  open: boolean;
  onClose: () => void;
  currentConfig: ConfigDraft;
  onApply: (next: ConfigDraft) => void;
  mode: ScanMode;
  apiKeyMasked: string;
  externalUserId: string;
  result: ScanResult | null;
  onOpenAnalysis: () => void;
  onReset?: () => void;
}

function hasChanged(a: ConfigDraft, b: ConfigDraft): boolean {
  return a.fas !== b.fas || a.requirePose !== b.requirePose || a.showPreview !== b.showPreview || a.redirectUrl !== b.redirectUrl || a.detailMode !== b.detailMode || a.benchmarkMode !== b.benchmarkMode;
}

export function ConfigPanel(props: ConfigPanelProps) {
  return (
    <GlassDrawer
      open={props.open}
      onClose={props.onClose}
      title="Scanner settings"
      description="Configure identity session and scan behavior"
    >
      <GlassDrawerHeader
        icon={<FaceIDGlyph size={20} />}
        title="Settings"
        subtitle="Spectre Face ID"
        onClose={props.onClose}
      />
      <ConfigPanelBody {...props} />
    </GlassDrawer>
  );
}

function ConfigPanelBody({
  onClose,
  currentConfig,
  onApply,
  mode,
  apiKeyMasked,
  externalUserId,
  result,
  onOpenAnalysis,
  onReset,
  open,
}: ConfigPanelProps) {
  const [draft, setDraft] = useState<ConfigDraft>(currentConfig);
  const wasOpenRef = useRef(open);

  useEffect(() => {
    if (open && !wasOpenRef.current) {
      queueMicrotask(() => setDraft(currentConfig));
    }
    wasOpenRef.current = open;
  }, [open, currentConfig]);

  const changed = hasChanged(draft, currentConfig);

  return (
    <div className="overflow-y-auto px-6 py-5 flex flex-col gap-6 pb-10">
        {result?.detail && (
          <Section label="Last analysis">
            <Button
              type="button"
              variant="ghost-glass"
              onClick={() => {
                onClose();
                onOpenAnalysis();
              }}
            >
              Open category breakdown
              <ArrowRightIcon size={16} data-icon="inline-end" />
            </Button>
          </Section>
        )}

        <Section label="Session">
          <div className="rounded-[14px] border border-[color:var(--separator)] bg-[color:var(--surface)] p-3 flex flex-col gap-2">
            <Row label="API key" value={apiKeyMasked} />
            <Row label="External user id" value={externalUserId} truncate />
          </div>
          <MLCoreTag />
        </Section>

        <Section label="Mode (auto)">
          <div className="flex items-center gap-3 p-3 rounded-xl border border-[color:var(--separator)] bg-[color:var(--surface)]">
            <div
              className={`mode-indicator-dot ${mode === MODE_REGISTER ? "is-register" : "is-verify"}`}
            />
            <div className="text-[13px] text-[color:var(--label-primary)] font-medium tracking-[-0.01em]">
              {mode === MODE_REGISTER ? "Enrollment" : "Verification"}
            </div>
          </div>
        </Section>

        <Section label="Scan behavior">
          <div className="flex flex-col gap-3">
            <SettingRow
              title={scan.config.livenessCheck}
              description={scan.config.livenessCheckDescription}
              checked={draft.fas}
              onChange={(fas) => setDraft((d) => ({ ...d, fas }))}
            />
            <SettingRow
              title={scan.config.requireHeadRotation}
              description={scan.config.requireHeadRotationDescription}
              checked={draft.requirePose}
              onChange={(requirePose) => setDraft((d) => ({ ...d, requirePose }))}
            />
            <SettingRow
              title={scan.config.showPreview}
              description={scan.config.showPreviewDescription}
              checked={draft.showPreview}
              onChange={(showPreview) => setDraft((d) => ({ ...d, showPreview }))}
            />
            <SettingRow
              title="Detail mode"
              description="Pause final animation and reveal full inference matrix (probabilities, timings, model metadata) before continuing."
              checked={draft.detailMode}
              onChange={(detailMode) => setDraft((d) => ({ ...d, detailMode }))}
            />
            <BenchmarkModeRow
              checked={draft.benchmarkMode}
              onChange={(benchmarkMode) => setDraft((d) => ({ ...d, benchmarkMode }))}
            />
          </div>
        </Section>

        <Section label="Redirect URL">
          <input
            type="url"
            value={draft.redirectUrl}
            onChange={(e) => setDraft((d) => ({ ...d, redirectUrl: e.target.value }))}
            placeholder="https://example.com/callback"
            className="input-mono w-full"
          />
          <span className="kbd-mono text-[10px] mt-1">URL tujuan setelah verifikasi berhasil</span>
        </Section>

        <Section label="Actions">
          <div className="flex flex-col gap-2">
            <Button
              type="button"
              variant="primary-glass"
              disabled={!changed}
              onClick={() => onApply(draft)}
            >
              {scan.config.applyChanges}
            </Button>
            {onReset && (
              <Button type="button" variant="ghost-glass" onClick={onReset}>
                {scan.config.resetScanner}
              </Button>
            )}
          </div>
        </Section>
      </div>
  );
}

interface SectionProps {
  label: string;
  children: ReactNode;
}

function Section({ label, children }: SectionProps) {
  return (
    <section className="flex flex-col gap-2">
      <div className="eyebrow">{label}</div>
      {children}
    </section>
  );
}

interface RowProps {
  label: string;
  value: string;
  truncate?: boolean;
}

function Row({ label, value, truncate }: RowProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="kbd-mono text-[10px]">{label}</span>
      <code
        className={`kbd-mono text-[color:var(--label-primary)] ${truncate ? "truncate max-w-[60%]" : ""}`}
      >
        {value}
      </code>
    </div>
  );
}

interface SettingRowProps {
  title: string;
  description: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}

function SettingRow({ title, description, checked, onChange }: SettingRowProps) {
  return (
    <label className="flex items-center justify-between gap-3 p-3 rounded-xl border border-[color:var(--separator)] bg-[color:var(--surface)]">
      <div className="flex flex-col min-w-0">
        <span className="text-[13px] text-[color:var(--label-primary)] font-medium tracking-[-0.01em]">{title}</span>
        <span className="kbd-mono text-[10px] mt-0.5">{description}</span>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  );
}

function BenchmarkModeRow({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  const { data } = useQuery({
    queryKey: ["ml-status"],
    queryFn: ({ signal }) => api.getMlStatus({ signal }),
    staleTime: 60_000,
    retry: false,
  });

  if (!data?.benchmark_enabled) return null;

  return (
    <SettingRow
      title="Benchmark mode"
      description={`Run ${data.benchmark_models.length} models side-by-side on the same image for comparison.`}
      checked={checked}
      onChange={onChange}
    />
  );
}

function MLCoreTag() {
  const { data } = useQuery({
    queryKey: ["ml-status"],
    queryFn: ({ signal }) => api.getMlStatus({ signal }),
    staleTime: 60_000,
    retry: false,
  });

  const active = data?.active_model;

  return (
    <div className="flex items-center gap-2 mt-2">
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
        <span className="inline-block size-1.5 rounded-full bg-indigo-400 animate-pulse" />
        <span className="text-[10px] font-semibold text-indigo-300 uppercase tracking-wider">
          ML Core
        </span>
      </div>
      <span className="text-[11px] text-[color:var(--label-secondary)] font-medium">
        {active ? `${active.model_id} v${active.version}` : "loading…"}
      </span>
      {active?.supports_tta && (
        <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-medium">
          TTA
        </span>
      )}
    </div>
  );
}

export { ConfigPanel as ConfigDrawer };
