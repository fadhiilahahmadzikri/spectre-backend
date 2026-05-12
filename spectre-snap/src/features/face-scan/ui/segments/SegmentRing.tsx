import { PHASES, SCAN_GEOMETRY } from "../../model/constants";
import type { IqaState, Phase } from "../../model/types";
import { resolveSegmentPalette } from "./palette";

interface SegmentRingProps {
  phase: Phase;
  iqaState: IqaState;
  activeSegments: ReadonlySet<number>;
  revealedSegments: number;
}

const { NUM_SEGMENTS, ANGLE_STEP, RADIUS_INNER, RADIUS_OUTER, CENTER } = SCAN_GEOMETRY;

function resolveStroke(
  isActive: boolean,
  isRevealed: boolean,
  phase: Phase,
  palette: ReturnType<typeof resolveSegmentPalette>,
): string {
  let stroke = palette.segBase;
  if (isRevealed) stroke = palette.segReveal;
  if (isActive || phase === PHASES.COMPLETE || phase === PHASES.FAILED) {
    stroke = palette.segActive;
  }
  if (
    !isRevealed &&
    !isActive &&
    phase !== PHASES.SCANNING &&
    phase !== PHASES.COMPLETE &&
    phase !== PHASES.FAILED
  ) {
    stroke = "transparent";
  }
  return stroke;
}

export function SegmentRing({
  phase,
  iqaState,
  activeSegments,
  revealedSegments,
}: SegmentRingProps) {
  const palette = resolveSegmentPalette(phase, iqaState);

  return (
    <svg
      className="absolute inset-0 w-full h-full z-30 pointer-events-none"
      viewBox="0 0 400 400"
    >
      {Array.from({ length: NUM_SEGMENTS }).map((_, i) => {
        const isActive = activeSegments.has(i);
        const isRevealed = i < revealedSegments;
        const angleRad = (i * ANGLE_STEP - 90) * (Math.PI / 180);
        const x1 = CENTER + RADIUS_INNER * Math.cos(angleRad);
        const y1 = CENTER + RADIUS_INNER * Math.sin(angleRad);
        const x2 = CENTER + RADIUS_OUTER * Math.cos(angleRad);
        const y2 = CENTER + RADIUS_OUTER * Math.sin(angleRad);

        const stroke = resolveStroke(isActive, isRevealed, phase, palette);
        const strokeWidth =
          isActive || phase === PHASES.COMPLETE || phase === PHASES.FAILED ? 5 : 4;

        return (
          <line
            key={`seg-${i}`}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            style={{ transition: "all 280ms ease-out" }}
          />
        );
      })}
    </svg>
  );
}
