import { useEffect, useRef } from "react";
import type { AuraLayerConfig } from "../../model/types";
import { hexToRgb } from "../../lib/hex-utils";

interface AuraCanvasProps {
  size: number;
  layers: AuraLayerConfig[];
  baseRadiusScale: number;
  onFrame?: () => void;
  timeSpeed: number;
}

const PADDING_MULTIPLIER = 1.2;

export function AuraCanvas({
  size,
  layers,
  baseRadiusScale,
  onFrame,
  timeSpeed,
}: AuraCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const onFrameRef = useRef(onFrame);

  useEffect(() => {
    onFrameRef.current = onFrame;
  }, [onFrame]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const actualSize = size * PADDING_MULTIPLIER;
    canvas.width = actualSize * dpr;
    canvas.height = actualSize * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(dpr, dpr);

    const cx = actualSize / 2;
    const cy = actualSize / 2;
    let time = 0;
    let frameId = 0;

    const render = () => {
      time += timeSpeed;
      onFrameRef.current?.();

      ctx.clearRect(0, 0, actualSize, actualSize);
      ctx.globalCompositeOperation = "lighter";
      const baseRadius = actualSize * baseRadiusScale;

      for (const layer of layers) {
        const rgb = hexToRgb(layer.hex);
        ctx.beginPath();
        for (let i = 0; i <= 360; i++) {
          const angle = (i * Math.PI) / 180;
          const noise1 = Math.sin(layer.w1 * angle + time * layer.s1);
          const noise2 = Math.cos(layer.w2 * angle - time * layer.s2);
          const r = baseRadius + layer.amp1 * noise1 + layer.amp2 * noise2;
          const x = cx + r * Math.cos(angle);
          const y = cy + r * Math.sin(angle);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();

        ctx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15)`;
        ctx.lineWidth = layer.width * 4;
        ctx.shadowBlur = layer.blur * 1.5;
        ctx.shadowColor = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
        ctx.stroke();

        ctx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.45)`;
        ctx.lineWidth = layer.width;
        ctx.shadowBlur = layer.blur * 0.6;
        ctx.stroke();
      }

      frameId = requestAnimationFrame(render);
    };

    frameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(frameId);
  }, [size, layers, baseRadiusScale, timeSpeed]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none"
      style={{
        display: "block",
        filter: "blur(1px) saturate(1.2)",
        position: "absolute",
        zIndex: 10,
      }}
    />
  );
}
