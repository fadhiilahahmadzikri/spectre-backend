import { useEffect, useMemo, useRef, useState } from "react";

const videoLoaders = import.meta.glob<{ default: string }>(
  "/src/shared/video/*.mp4",
);

const videoKeys = Object.keys(videoLoaders).sort();

interface VideoShowcaseProps {
  title?: string;
  subtitle?: string;
  description?: string;
}

export function VideoShowcase({
  title = "Spectre",
  subtitle = "Facial authentication, reimagined.",
  description = "Liveness-aware face recognition with real-time anti-spoofing. Built for modern identity flows — privacy-preserving, on-device mesh, server-grade verification.",
}: VideoShowcaseProps) {
  const [index, setIndex] = useState(0);
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const loaders = useMemo(() => videoKeys.map((k) => videoLoaders[k]), []);
  const total = loaders.length;

  useEffect(() => {
    if (total === 0) return;
    let cancelled = false;
    loaders[index % total]().then((mod) => {
      if (!cancelled) setCurrentUrl(mod.default);
    });
    return () => {
      cancelled = true;
    };
  }, [index, loaders, total]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !currentUrl) return;
    const advance = () => setIndex((i) => (i + 1) % Math.max(total, 1));
    video.addEventListener("ended", advance);
    video.play().catch(() => {});
    return () => video.removeEventListener("ended", advance);
  }, [currentUrl, total]);

  return (
    <div
      className="relative h-full w-full overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse 120% 80% at 50% 40%, rgba(60, 90, 160, 0.35) 0%, rgba(10, 14, 30, 0.95) 70%), #07090f",
      }}
    >
      {currentUrl && (
        <video
          ref={videoRef}
          key={currentUrl}
          src={currentUrl}
          autoPlay
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.25) 55%, rgba(0,0,0,0.85) 100%)",
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 40%, rgba(140, 180, 255, 0.12) 0%, transparent 72%)",
        }}
      />

      <div className="relative z-10 h-full flex flex-col justify-end p-8 md:p-12 gap-4">
        <div className="flex items-center gap-2 face-helper text-[12px]">
          <span className="inline-flex items-center justify-center relative w-2 h-2">
            <span
              className="absolute inset-0 rounded-full bg-[color:var(--sys-green)]"
              style={{ animation: "pulseDot 1.6s ease-in-out infinite" }}
            />
            <span className="relative w-1.5 h-1.5 rounded-full bg-[color:var(--sys-green)] shadow-[0_0_10px_rgba(52,199,89,0.7)]" />
          </span>
          {total > 0 ? "Live liveness demo" : "Demo"}
        </div>
        <h2 className="face-title text-[28px] md:text-[34px] leading-[1.08] max-w-[480px]">
          {subtitle}
        </h2>
        <p className="face-helper text-[13px] max-w-[460px]">{description}</p>
        <div className="inline-flex items-center gap-2 text-[11px] text-[color:var(--label-tertiary)] font-mono pt-2">
          <span>{title}</span>
          <span>·</span>
          <span>Face ID infrastructure</span>
        </div>
      </div>
    </div>
  );
}
