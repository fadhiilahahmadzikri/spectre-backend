import { useState } from "react";
import { Activity, Cpu, Gauge, CheckCircle2, AlertTriangle, Sparkles } from "lucide-react";
import { GlassDialog, GlassDialogHeader, GlassDialogBody, GlassDialogFooter } from "@/shared/ui/GlassDialog";
import { Button } from "@/components/ui/button";
import type { InferenceDiagnostics, BenchmarkApiResponse } from "../../model/types";

interface Props {
  open: boolean;
  diagnostics: InferenceDiagnostics | null;
  benchmark: BenchmarkApiResponse | null;
  onContinue: () => void;
}

const OUTCOME_LABEL: Record<string, { text: string; tone: "ok" | "warn" | "err" }> = {
  auth_success: { text: "Authenticated", tone: "ok" },
  registered: { text: "Registered", tone: "ok" },
  auth_rejected: { text: "Rejected", tone: "warn" },
  spoof_detected: { text: "Spoof Detected", tone: "err" },
  profile_not_found: { text: "Profile Not Found", tone: "warn" },
  ml_bypassed: { text: "ML Bypassed", tone: "warn" },
  failed: { text: "Failed", tone: "err" },
};

export function DiagnosticInterceptor({ open, diagnostics, benchmark, onContinue }: Props) {
  const hasBoth = diagnostics !== null && benchmark !== null;
  const [tab, setTab] = useState<"detail" | "benchmark">("detail");
  if (!diagnostics && !benchmark) return null;
  const activeTab = hasBoth ? tab : diagnostics ? "detail" : "benchmark";

  return (
    <GlassDialog open={open} onOpenChange={() => {}} size="lg" showClose={false} className="h-[88vh]">
      <GlassDialogHeader
        align="left"
        icon={activeTab === "detail" ? <Activity size={20} /> : <Sparkles size={20} />}
        title="Inference Analysis"
        description="Review before continuing to the result animation."
      />
      <GlassDialogBody>
        {hasBoth && (
          <div className="flex gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06] mb-4 shrink-0">
            <TabBtn active={tab === "detail"} onClick={() => setTab("detail")} icon={<Activity size={12} />} label="Model Detail" />
            <TabBtn active={tab === "benchmark"} onClick={() => setTab("benchmark")} icon={<Sparkles size={12} />} label={`Benchmark (${benchmark!.participating_models.length})`} />
          </div>
        )}
        {activeTab === "detail" && diagnostics && <DetailTab d={diagnostics} />}
        {activeTab === "benchmark" && benchmark && <BenchmarkTab r={benchmark} />}
      </GlassDialogBody>
      <GlassDialogFooter>
        <Button type="button" variant="primary-glass" onClick={onContinue}>Continue</Button>
      </GlassDialogFooter>
    </GlassDialog>
  );
}

function TabBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button onClick={onClick} className={`flex-1 text-[11px] font-medium px-3 py-1.5 rounded-lg transition-all inline-flex items-center justify-center gap-1.5 ${active ? "bg-white/[0.08] text-white" : "text-[color:var(--label-tertiary)] hover:text-white"}`}>
      {icon}{label}
    </button>
  );
}

function DetailTab({ d }: { d: InferenceDiagnostics }) {
  const o = OUTCOME_LABEL[d.outcome] ?? { text: d.outcome, tone: "warn" as const };
  return (
    <div className="flex flex-col gap-3">
      <div className={`flex items-center gap-2 p-3 rounded-lg ${o.tone === "ok" ? "bg-emerald-500/10 border border-emerald-500/30" : o.tone === "err" ? "bg-red-500/10 border border-red-500/30" : "bg-amber-500/10 border border-amber-500/30"}`}>
        {o.tone === "ok" ? <CheckCircle2 size={16} className="text-emerald-400" /> : <AlertTriangle size={16} className={o.tone === "err" ? "text-red-400" : "text-amber-400"} />}
        <span className="text-[12px] font-semibold text-white">{o.text}</span>
        {d.reason && <span className="text-[10px] text-[color:var(--label-tertiary)] ml-2">{d.reason}</span>}
      </div>
      {d.model && <Sec icon={<Cpu size={12} />} label="Model"><KV k="ID" v={d.model.model_id} /><KV k="Version" v={d.model.version} /><KV k="TTA" v={d.model.used_tta ? "yes" : "no"} /></Sec>}
      {d.fas && (
        <Sec icon={<Activity size={12} />} label="FAS Matrix">
          {d.fas.probabilities.map((p, i) => <ProbBar key={d.fas!.classes[i]} cls={d.fas!.classes[i]} prob={p} isTop={i === d.fas!.predicted_index} />)}
          <div className="flex gap-1.5 flex-wrap mt-2">
            <Ch l={d.fas.predicted_class} /><Ch l={`${(d.fas.confidence*100).toFixed(1)}%`} t={d.fas.is_live?"ok":"err"} /><Ch l={`thr: ${(d.fas.threshold_used*100).toFixed(0)}%`} />
          </div>
        </Sec>
      )}
      {d.embedding && <Sec icon={<Cpu size={12} />} label="Embedding"><KV k="Provider" v={d.embedding.provider} />{d.embedding.similarity_score!=null&&<KV k="Similarity" v={`${(d.embedding.similarity_score*100).toFixed(2)}%`} />}{d.embedding.match!=null&&<KV k="Match" v={d.embedding.match?"yes":"no"} />}</Sec>}
      <Sec icon={<Gauge size={12} />} label="Timings"><KV k="FAS" v={`${d.timings.fas_inference_ms}ms`} /><KV k="Embedding" v={`${d.timings.embedding_extraction_ms}ms`} /><KV k="Total" v={`${d.timings.total_ms}ms`} /></Sec>
      <details className="rounded-lg border border-white/[0.06] p-2"><summary className="cursor-pointer text-[9px] font-semibold text-[color:var(--label-tertiary)] uppercase">Raw JSON</summary><pre className="kbd-mono text-[9px] text-[color:var(--label-tertiary)] mt-1 overflow-auto max-h-32">{JSON.stringify(d,null,2)}</pre></details>
    </div>
  );
}

function BenchmarkTab({ r }: { r: BenchmarkApiResponse }) {
  return (
    <div className="flex flex-col gap-3">
      {r.consensus && (
        <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 flex flex-col gap-2">
          <span className="text-[9px] font-semibold text-[color:var(--label-tertiary)] uppercase">Consensus</span>
          <div className="flex gap-1.5 flex-wrap">
            <Ch l={`live: ${r.consensus.is_live_agreement?"agree":"disagree"}`} t={r.consensus.is_live_agreement?"ok":"warn"} />
            <Ch l={`class: ${r.consensus.predicted_class_agreement?"agree":"disagree"}`} t={r.consensus.predicted_class_agreement?"ok":"warn"} />
            <Ch l={`mean: ${(r.consensus.mean_realperson_prob*100).toFixed(1)}%`} />
          </div>
        </div>
      )}
      {r.results.map((m) => {
        const fas = m.diagnostics?.fas;
        const failed = m.status !== "completed";
        return (
          <div key={m.model_id} className="rounded-lg border border-white/[0.06] bg-white/[0.01] p-3 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2"><Cpu size={12} className="text-[color:var(--label-tertiary)]" /><span className="text-[12px] font-semibold text-white">{m.model_id}</span><span className="kbd-mono text-[9px] text-[color:var(--label-tertiary)]">v{m.version}</span></div>
              {failed?<Ch l="FAILED" t="err" />:fas?.is_live?<Ch l="LIVE" t="ok" />:<Ch l="SPOOF" t="err" />}
            </div>
            {failed?<span className="text-[10px] text-red-400">{m.error}</span>:fas&&(
              <div className="flex flex-col gap-1">{fas.probabilities.map((p,i)=><ProbBar key={fas.classes[i]} cls={fas.classes[i]} prob={p} isTop={i===fas.predicted_index} />)}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ProbBar({ cls, prob, isTop }: { cls: string; prob: number; isTop: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`text-[9px] w-24 ${isTop?"text-white font-medium":"text-[color:var(--label-tertiary)]"}`}>{cls}</span>
      <div className="flex-1 h-1.5 rounded-full bg-white/[0.04] overflow-hidden"><div className={`h-full rounded-full ${cls==="realperson"?"bg-emerald-500/70":"bg-red-500/50"}`} style={{width:`${Math.max(prob*100,0.3)}%`}} /></div>
      <span className="kbd-mono text-[9px] w-12 text-right text-[color:var(--label-tertiary)]">{(prob*100).toFixed(1)}%</span>
    </div>
  );
}

function Sec({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (<section className="rounded-lg border border-white/[0.06] bg-white/[0.01] p-3 flex flex-col gap-1.5"><div className="flex items-center gap-1.5"><span className="text-[color:var(--label-tertiary)]">{icon}</span><span className="text-[9px] font-semibold text-[color:var(--label-secondary)] uppercase tracking-wider">{label}</span></div>{children}</section>);
}

function KV({ k, v }: { k: string; v: string }) {
  return (<div className="flex items-center justify-between text-[11px]"><span className="text-[color:var(--label-tertiary)]">{k}</span><span className="kbd-mono text-[color:var(--label-primary)]">{v}</span></div>);
}

function Ch({ l, t = "default" }: { l: string; t?: "default"|"ok"|"warn"|"err" }) {
  const c = t==="ok"?"bg-emerald-500/10 text-emerald-400":t==="warn"?"bg-amber-500/10 text-amber-400":t==="err"?"bg-red-500/10 text-red-400":"bg-white/[0.05] text-[color:var(--label-secondary)]";
  return <span className={`text-[9px] px-1.5 py-0.5 rounded kbd-mono ${c}`}>{l}</span>;
}
