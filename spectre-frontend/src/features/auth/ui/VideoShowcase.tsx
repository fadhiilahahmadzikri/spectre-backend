import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const videoLoaders = import.meta.glob<{ default: string }>("/src/shared/video/*.mp4");
const videoKeys = Object.keys(videoLoaders).sort();

const CONTEXTS = [
  { tag: "Real person detection", headline: "Facial authentication,\nreimagined.", description: "Liveness-aware face recognition with real-time anti-spoofing." },
  { tag: "Spoof detection", headline: "Anti-spoofing\nthat actually works.", description: "Detects masks, printouts, screens, and mannequins in real-time." },
  { tag: "Live verification", headline: "Verify identity\nin seconds.", description: "On-device mesh analysis with server-grade confidence scoring." },
  { tag: "Biometric security", headline: "Privacy-first\nbiometric layer.", description: "No images stored. Embeddings are encrypted and ephemeral." },
  { tag: "Face authentication", headline: "Built for modern\nidentity flows.", description: "Drop-in API for registration, authentication, and liveness checks." },
  { tag: "Enterprise ready", headline: "Production-grade\ninfrastructure.", description: "Scalable, observable, and designed for high-throughput workloads." },
];

export function VideoShowcase() {
  const [index, setIndex] = useState(0);
  const [urls, setUrls] = useState<(string | null)[]>(() => videoKeys.map(() => null));
  const activeRef = useRef<HTMLVideoElement | null>(null);
  const bufferRef = useRef<HTMLVideoElement | null>(null);
  const [activeSlot, setActiveSlot] = useState<0 | 1>(0);

  const total = videoKeys.length;
  const loaders = useMemo(() => videoKeys.map((k) => videoLoaders[k]), []);
  const ctx = CONTEXTS[index % CONTEXTS.length];

  // Preload all videos
  useEffect(() => {
    loaders.forEach((loader, i) => {
      loader().then((mod) => setUrls((prev) => { const next = [...prev]; next[i] = mod.default; return next; }));
    });
  }, [loaders]);

  // Handle video end: load next into buffer, crossfade
  useEffect(() => {
    const video = activeSlot === 0 ? activeRef.current : bufferRef.current;
    if (!video) return;

    const currentUrl = urls[index % total];
    if (!currentUrl) return;

    video.src = currentUrl;
    video.play().catch(() => {});

    const advance = () => {
      const nextIndex = (index + 1) % Math.max(total, 1);
      const nextUrl = urls[nextIndex % total];
      const nextVideo = activeSlot === 0 ? bufferRef.current : activeRef.current;

      if (nextVideo && nextUrl) {
        nextVideo.src = nextUrl;
        nextVideo.play().catch(() => {});
      }

      setActiveSlot((s) => (s === 0 ? 1 : 0) as 0 | 1);
      setIndex(nextIndex);
    };

    video.addEventListener("ended", advance);
    return () => video.removeEventListener("ended", advance);
  }, [index, urls, total, activeSlot]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#07090f]">
      {/* Two stacked videos for crossfade */}
      <video
        ref={activeRef}
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000"
        style={{ opacity: activeSlot === 0 ? 1 : 0 }}
      />
      <video
        ref={bufferRef}
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000"
        style={{ opacity: activeSlot === 1 ? 1 : 0 }}
      />

      {/* Gradient overlay for readability */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.15) 40%, rgba(0,0,0,0.82) 100%)" }}
      />

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-end p-8 md:p-12 gap-3">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col gap-3"
          >
            <div className="flex items-center gap-2 text-[12px] text-[color:var(--label-secondary)]">
              <span className="inline-flex items-center justify-center relative w-2 h-2">
                <span className="absolute inset-0 rounded-full bg-[color:var(--sys-green)]" style={{ animation: "pulseDot 1.6s ease-in-out infinite" }} />
                <span className="relative w-1.5 h-1.5 rounded-full bg-[color:var(--sys-green)] shadow-[0_0_8px_rgba(52,199,89,0.6)]" />
              </span>
              {ctx.tag}
            </div>
            <h2 className="face-title text-[28px] md:text-[34px] leading-[1.08] max-w-[480px] whitespace-pre-line">
              {ctx.headline}
            </h2>
            <p className="face-helper text-[13px] max-w-[420px]">{ctx.description}</p>
          </motion.div>
        </AnimatePresence>

        <div className="inline-flex items-center gap-2 text-[11px] text-[color:var(--label-tertiary)] font-mono pt-3">
          <span>Spectre</span>
          <span>·</span>
          <span>Face ID infrastructure</span>
        </div>
      </div>
    </div>
  );
}
