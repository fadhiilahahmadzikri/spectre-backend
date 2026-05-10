import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { FaceIDGlyph, CloseIcon, ArrowRightIcon } from "@/shared/icons";
import { useMediaQuery, MEDIA_MOBILE } from "@/shared/hooks/use-media-query";
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
  return a.fas !== b.fas || a.requirePose !== b.requirePose || a.showPreview !== b.showPreview;
}

export function ConfigPanel(props: ConfigPanelProps) {
  const isMobile = useMediaQuery(MEDIA_MOBILE);
  if (isMobile) return <ConfigDrawerSurface {...props} />;
  return <ConfigSheetSurface {...props} />;
}

function ConfigSheetSurface(props: ConfigPanelProps) {
  return (
    <Sheet open={props.open} onOpenChange={(v) => !v && props.onClose()}>
      <SheetContent
        side="right"
        className="glass-strong border-none p-0 w-[400px] sm:max-w-[420px] [&>button]:top-4 [&>button]:right-4"
      >
        <SheetTitle className="sr-only">Scanner settings</SheetTitle>
        <SheetDescription className="sr-only">
          Configure identity session and scan behavior
        </SheetDescription>
        <ConfigPanelBody {...props} />
      </SheetContent>
    </Sheet>
  );
}

function ConfigDrawerSurface(props: ConfigPanelProps) {
  return (
    <Drawer open={props.open} onOpenChange={(v) => !v && props.onClose()}>
      <DrawerContent className="glass-strong config-drawer border-none !rounded-t-[24px] max-h-[88vh]">
        <DrawerTitle className="sr-only">Scanner settings</DrawerTitle>
        <DrawerDescription className="sr-only">
          Configure identity session and scan behavior
        </DrawerDescription>
        <ConfigPanelBody {...props} />
      </DrawerContent>
    </Drawer>
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
    <div className="flex flex-col h-full">
      <div className="px-6 pt-5 pb-4 flex items-center justify-between border-b border-[color:var(--separator)]">
        <div className="flex items-center gap-2.5">
          <div style={{ color: "rgba(235,235,245,0.75)" }}>
            <FaceIDGlyph size={20} />
          </div>
          <div>
            <div className="face-title text-[15px]">Settings</div>
            <div className="kbd-mono text-[10px] mt-[1px]">Spectre Face ID</div>
          </div>
        </div>
        <button type="button" className="icon-btn" aria-label="Close" onClick={onClose}>
          <CloseIcon />
        </button>
      </div>

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
