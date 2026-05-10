import { useEffect, useRef, useState, type ReactNode } from "react";
import { GlassDrawer, GlassDrawerHeader } from "@/shared/ui/GlassDrawer";
import { Switch } from "@/components/ui/switch";
import { FaceIDGlyph, ArrowRightIcon } from "@/shared/icons";
import { MODE_REGISTER } from "../../model/constants";
import type { ScanMode, ScanResult } from "../../model/types";
import { type ConfigDraft } from "../../model/config-draft";

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
  return a.fas !== b.fas || a.requirePose !== b.requirePose || a.showPreview !== b.showPreview || a.redirectUrl !== b.redirectUrl;
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
            <button
              type="button"
              className="btn-ghost flex items-center justify-center gap-2"
              onClick={() => {
                onClose();
                onOpenAnalysis();
              }}
            >
              Open category breakdown <ArrowRightIcon size={16} />
            </button>
          </Section>
        )}

        <Section label="Session">
          <div className="rounded-[14px] border border-[color:var(--separator)] bg-white/[0.02] p-3 flex flex-col gap-2">
            <Row label="API key" value={apiKeyMasked} />
            <Row label="External user id" value={externalUserId} truncate />
          </div>
        </Section>

        <Section label="Mode (auto)">
          <div className="flex items-center gap-3 p-3 rounded-xl border border-[color:var(--separator)] bg-white/[0.02]">
            <div
              className={`mode-indicator-dot ${mode === MODE_REGISTER ? "is-register" : "is-verify"}`}
            />
            <div className="text-[13px] text-white font-medium tracking-[-0.01em]">
              {mode === MODE_REGISTER ? "Enrollment" : "Verification"}
            </div>
          </div>
        </Section>

        <Section label="Scan behavior">
          <div className="flex flex-col gap-3">
            <SettingRow
              title="Liveness check"
              description="Verify the capture against server anti-spoofing model."
              checked={draft.fas}
              onChange={(fas) => setDraft((d) => ({ ...d, fas }))}
            />
            <SettingRow
              title="Require head rotation"
              description="Ask the user to rotate their head to fill the segment ring."
              checked={draft.requirePose}
              onChange={(requirePose) => setDraft((d) => ({ ...d, requirePose }))}
            />
            <SettingRow
              title="Show preview"
              description="Review the captured frame before submitting."
              checked={draft.showPreview}
              onChange={(showPreview) => setDraft((d) => ({ ...d, showPreview }))}
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
            <button
              type="button"
              className="btn-primary"
              disabled={!changed}
              onClick={() => onApply(draft)}
            >
              Apply changes
            </button>
            {onReset && (
              <button type="button" className="btn-ghost" onClick={onReset}>
                Reset scanner
              </button>
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
    <label className="flex items-center justify-between gap-3 p-3 rounded-xl border border-[color:var(--separator)] bg-white/[0.02]">
      <div className="flex flex-col min-w-0">
        <span className="text-[13px] text-white font-medium tracking-[-0.01em]">{title}</span>
        <span className="kbd-mono text-[10px] mt-0.5">{description}</span>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  );
}

export { ConfigPanel as ConfigDrawer };
