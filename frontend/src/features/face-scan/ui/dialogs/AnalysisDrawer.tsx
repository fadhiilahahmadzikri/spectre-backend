import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { FaceIDGlyph, CloseIcon } from "@/shared/icons";
import { RadialChart } from "../result/RadialChart";
import type { FAS_CLASSES } from "../../model/constants";
import type { ScanResult } from "../../model/types";

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
  realperson: "Real Person",
  fake_mask: "Mask",
  fake_mannequin: "Mannequin",
  fake_papercut: "Paper Cut",
  fake_printed: "Printed",
  fake_screen: "Screen",
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
    <Drawer open={open} onOpenChange={(v) => !v && onClose()}>
      <DrawerContent className="glass-strong config-drawer border-none !rounded-t-[24px] max-h-[88vh]">
        <DrawerTitle className="sr-only">Liveness analysis breakdown</DrawerTitle>
        <DrawerDescription className="sr-only">
          Six-class spoofing probability breakdown
        </DrawerDescription>
        <div className="px-6 pt-1 pb-4 flex items-center justify-between border-b border-[rgba(84,84,88,0.45)]">
          <div className="flex items-center gap-2.5">
            <div style={{ color: "rgba(235,235,245,0.75)" }}>
              <FaceIDGlyph size={20} />
            </div>
            <div>
              <div className="face-title text-[15px]">Liveness Analysis</div>
              <div className="kbd-mono text-[10px] mt-[1px]">Rincian Kategori Spoofing</div>
            </div>
          </div>
          <button type="button" className="icon-btn" aria-label="Close" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-6 flex flex-col gap-8">
          {hasResult && result && (
            <>
              <section className="flex flex-col gap-3">
                <div className="text-[11px] font-mono font-bold uppercase tracking-[0.15em] border-b border-[rgba(255,255,255,0.1)] pb-2 text-[#0ea5e9]">
                  [ Ringkasan ] Aggregat
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <RadialChart label="Live (Wajah Asli)" value={result.summary.live ?? 0} color="#10b981" />
                  <RadialChart label="Spoof (Serangan)" value={result.summary.spoof ?? 0} color="#f43f5e" />
                </div>
              </section>

              <section className="flex flex-col gap-3">
                <div className="text-[11px] font-mono font-bold uppercase tracking-[0.15em] border-b border-[rgba(255,255,255,0.1)] pb-2 text-[#0ea5e9]">
                  [ Distribusi ] 6 Kelas
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
            <p className="kbd-mono text-center py-6">
              Belum ada data analisis untuk ditampilkan.
            </p>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
