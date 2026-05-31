import {
  GlassDrawer,
  GlassDrawerHeader,
} from "@/shared/ui/GlassDrawer";
import { FaceIDGlyph } from "@/shared/icons";
import { RadialChart } from "../result/RadialChart";
import type { FAS_CLASSES } from "../../model/constants";
import type { ScanResult } from "../../model/types";
import { scan } from "@/shared/lib/copy";

interface AnalysisDrawerProps {
  open: boolean;
  onClose: () => void;
  result: ScanResult | null;
}

type FasClass = (typeof FAS_CLASSES)[number];

const CLASS_COLORS: Record<FasClass, string> = {
  realperson: "#10b981",
  fake_mask: "#f43f5e",
  fake_mannequin: "#f59e0b",
  fake_papercut: "#3b82f6",
  fake_printed: "#8b5cf6",
  fake_screen: "#f97316",
};

const CLASS_LABELS: Record<FasClass, string> = {
  realperson: scan.analysis.realPerson,
  fake_mask: scan.analysis.mask,
  fake_mannequin: scan.analysis.mannequin,
  fake_papercut: scan.analysis.paperCut,
  fake_printed: scan.analysis.printed,
  fake_screen: scan.analysis.screen,
};

const CLASS_ORDER: readonly FasClass[] = [
  "realperson",
  "fake_mask",
  "fake_mannequin",
  "fake_papercut",
  "fake_printed",
  "fake_screen",
];

export function AnalysisDrawer({ open, onClose, result }: AnalysisDrawerProps) {
  const hasResult = !!result?.detail && !!result?.summary;

  return (
    <GlassDrawer
      open={open}
      onClose={onClose}
      title={scan.analysis.title}
      description={scan.analysis.subtitle}
    >
      <GlassDrawerHeader
        icon={<FaceIDGlyph size={20} />}
        title={scan.analysis.title}
        subtitle={scan.analysis.subtitle}
        onClose={onClose}
      />

      <div className="overflow-y-auto px-6 py-6 flex flex-col gap-8">
        {hasResult && result && (
          <>
            <section className="flex flex-col gap-3">
              <div className="text-[11px] font-mono font-bold uppercase tracking-[0.15em] border-b border-[rgba(255,255,255,0.1)] pb-2 text-[#0ea5e9]">
                {scan.analysis.aggregateSummary}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <RadialChart
                  label={scan.analysis.live}
                  value={result.summary.live ?? 0}
                  color="#10b981"
                />
                <RadialChart
                  label={scan.analysis.spoof}
                  value={result.summary.spoof ?? 0}
                  color="#f43f5e"
                />
              </div>
            </section>

            <section className="flex flex-col gap-3">
              <div className="text-[11px] font-mono font-bold uppercase tracking-[0.15em] border-b border-[rgba(255,255,255,0.1)] pb-2 text-[#0ea5e9]">
                {scan.analysis.classDistribution}
              </div>
              <div className="grid grid-cols-2 gap-4">
                {CLASS_ORDER.map((key) => (
                  <RadialChart
                    key={key}
                    label={CLASS_LABELS[key]}
                    value={result.detail?.[key] ?? 0}
                    color={CLASS_COLORS[key]}
                  />
                ))}
              </div>
            </section>
          </>
        )}
        {!hasResult && (
          <p className="kbd-mono text-center py-6">{scan.analysis.empty}</p>
        )}
      </div>
    </GlassDrawer>
  );
}
