import { Activity, CheckCircle2, AlertTriangle, Cpu, Sparkles } from "lucide-react";
import {
  GlassDialog,
  GlassDialogHeader,
  GlassDialogBody,
  GlassDialogFooter,
} from "@/shared/ui/GlassDialog";
import { Button } from "@/components/ui/button";
import type { BenchmarkApiResponse, BenchmarkModelResult } from "../../model/types";

interface BenchmarkComparisonProps {
  open: boolean;
  report: BenchmarkApiResponse | null;
  onContinue: () => void;
}

export function BenchmarkComparison({ open, report, onContinue }: BenchmarkComparisonProps) {
  if (!report) return null;

  return (
    <GlassDialog open={open} onOpenChange={() => {}} size="lg" showClose={false} className="h-[88vh]">
      <GlassDialogHeader
        align="left"
        icon={<Sparkles size={20} />}
        title="Model Benchmark Comparison"
        description={`${report.participating_models.length} models ran on the same image. Compare their outputs below.`}
      />

      <GlassDialogBody>
        <div className="flex flex-col gap-4">
          {report.consensus && (
            <div className="rounded-lg border border-[color:var(--separator)] bg-[color:var(--surface)] p-3 flex flex-col gap-2">
              <div className="text-[10px] font-semibold text-[color:var(--label-secondary)] uppercase tracking-wider">
                Consensus
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Chip
                  label={`is_live agreement: ${report.consensus.is_live_agreement ? "yes" : "no"}`}
                  tone={report.consensus.is_live_agreement ? "ok" : "warn"}
                />
                <Chip
                  label={`class agreement: ${report.consensus.predicted_class_agreement ? "yes" : "no"}`}
                  tone={report.consensus.predicted_class_agreement ? "ok" : "warn"}
                />
                <Chip label={`mean realperson: ${(report.consensus.mean_realperson_prob * 100).toFixed(2)}%`} />
                <Chip label={`std: ${(report.consensus.std_realperson_prob * 100).toFixed(2)}%`} />
              </div>
              {!report.consensus.predicted_class_agreement && (
                <div className="text-[11px] text-amber-400">
                  Models disagree on predicted class: {report.consensus.unique_predicted_classes.join(", ")}
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {report.results.map((r) => (
              <ModelResultCard key={r.model_id} result={r} />
            ))}
          </div>

          <details className="rounded-lg border border-[color:var(--separator)] p-3">
            <summary className="cursor-pointer text-[11px] font-semibold text-[color:var(--label-secondary)] uppercase tracking-wider">
              Raw JSON payload
            </summary>
            <pre className="kbd-mono text-[10px] text-[color:var(--label-tertiary)] mt-2 overflow-auto max-h-48">
              {JSON.stringify(report, null, 2)}
            </pre>
          </details>
        </div>
      </GlassDialogBody>

      <GlassDialogFooter>
        <Button type="button" variant="primary-glass" onClick={onContinue}>
          Continue
        </Button>
      </GlassDialogFooter>
    </GlassDialog>
  );
}

function ModelResultCard({ result }: { result: BenchmarkModelResult }) {
  const failed = result.status !== "completed";
  const fas = result.diagnostics?.fas;
  const timings = result.diagnostics?.timings;
  const isLive = fas?.is_live ?? false;
  const toneColor = failed ? "red" : isLive ? "emerald" : "amber";
  const ToneIcon = failed ? AlertTriangle : isLive ? CheckCircle2 : AlertTriangle;

  return (
    <div className={`rounded-lg border border-${toneColor}-500/30 bg-${toneColor}-500/[0.04] p-3 flex flex-col gap-2.5`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Cpu size={14} className="text-[color:var(--label-tertiary)]" />
          <span className="text-[13px] font-semibold text-[color:var(--label-primary)]">{result.model_id}</span>
          <span className="kbd-mono text-[9px] text-[color:var(--label-tertiary)]">
            v{result.version}
          </span>
        </div>
        <ToneIcon size={14} className={`text-${toneColor}-400`} />
      </div>

      {failed ? (
        <div className="text-[11px] text-red-400">
          {result.error ?? "Inference failed"}
        </div>
      ) : fas ? (
        <>
          <div className="flex flex-col gap-1">
            {fas.probabilities.map((p, i) => {
              const cls = fas.classes[i];
              const isTop = i === fas.predicted_index;
              return (
                <div key={cls} className="flex items-center gap-1.5">
                  <span className={`text-[10px] w-24 ${isTop ? "text-[color:var(--label-primary)] font-medium" : "text-[color:var(--label-tertiary)]"}`}>
                    {cls}
                  </span>
                  <div className="flex-1 h-1.5 rounded-full bg-[color:var(--surface)] overflow-hidden">
                    <div
                      className={`h-full rounded-full ${cls === "realperson" ? "bg-emerald-500/70" : "bg-red-500/50"}`}
                      style={{ width: `${Math.max(p * 100, 0.3)}%` }}
                    />
                  </div>
                  <span className={`kbd-mono text-[9px] w-12 text-right ${isTop ? "text-[color:var(--label-primary)]" : "text-[color:var(--label-tertiary)]"}`}>
                    {(p * 100).toFixed(1)}%
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-[color:var(--separator)]">
            <Chip label={fas.predicted_class} />
            <Chip
              label={`${(fas.confidence * 100).toFixed(1)}%`}
              tone={fas.confidence >= fas.threshold_used ? "ok" : "warn"}
            />
            {timings && <Chip label={`${timings.fas_inference_ms}ms`} />}
          </div>
        </>
      ) : (
        <div className="text-[11px] text-[color:var(--label-tertiary)]">No diagnostics</div>
      )}
    </div>
  );
}

function Chip({ label, tone = "default" }: { label: string; tone?: "default" | "ok" | "warn" | "err" }) {
  const color =
    tone === "ok"
      ? "bg-emerald-500/10 text-emerald-400"
      : tone === "warn"
      ? "bg-amber-500/10 text-amber-400"
      : tone === "err"
      ? "bg-red-500/10 text-red-400"
      : "bg-[color:var(--surface)] text-[color:var(--label-secondary)]";
  return <span className={`text-[9px] px-2 py-0.5 rounded kbd-mono ${color}`}>{label}</span>;
}
