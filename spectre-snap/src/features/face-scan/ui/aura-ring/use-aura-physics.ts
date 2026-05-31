import { useEffect, useRef, useState, type MutableRefObject } from "react";
import type { AuraExpression } from "../../model/types";

export interface EyeState {
  x: number;
  y: number;
  yaw: number;
  pitch: number;
}

interface BouncePhysics {
  value: number;
  velocity: number;
}

interface UseAuraPhysicsOptions {
  expression: AuraExpression;
  globalSpeed: number;
}

interface UseAuraPhysicsResult {
  eyeState: EyeState;
  updateFrame: (containerEl: HTMLElement | null) => void;
  bounceRef: MutableRefObject<BouncePhysics>;
}

const SPRING_STIFFNESS = 0.08;
const SPRING_DAMPING = 0.75;

export function useAuraPhysics({
  expression,
  globalSpeed,
}: UseAuraPhysicsOptions): UseAuraPhysicsResult {
  const [eyeState, setEyeState] = useState<EyeState>({ x: 0, y: 0, yaw: 0, pitch: 0 });
  const bounceRef = useRef<BouncePhysics>({ value: 0, velocity: 0 });
  const timeRef = useRef(0);
  const isIndicatorRef = useRef(false);

  useEffect(() => {
    isIndicatorRef.current = expression.endsWith("_static") || expression.endsWith("_anticipate");
  }, [expression]);

  useEffect(() => {
    let timerId: ReturnType<typeof setTimeout> | null = null;

    const moveEyes = () => {
      if (isIndicatorRef.current) {
        setEyeState({ x: 0, y: 0, yaw: 0, pitch: 0 });
      } else {
        const isCenter = Math.random() > 0.65;
        if (isCenter) {
          setEyeState({ x: 0, y: 0, yaw: 0, pitch: 0 });
        } else {
          const newX = (Math.random() - 0.5) * 30;
          const newY = (Math.random() - 0.5) * 20;
          setEyeState({ x: newX, y: newY, yaw: newX * 2.2, pitch: newY * -2.2 });
        }
        bounceRef.current.velocity -= 0.12 + Math.random() * 0.08;
      }
      timerId = setTimeout(moveEyes, 1200 + Math.random() * 2000);
    };

    timerId = setTimeout(moveEyes, 1000);
    return () => { if (timerId !== null) clearTimeout(timerId); };
  }, []);

  const updateFrame = (containerEl: HTMLElement | null) => {
    timeRef.current += globalSpeed;
    const time = timeRef.current;

    const bounce = bounceRef.current;
    bounce.velocity += (0 - bounce.value) * SPRING_STIFFNESS;
    bounce.velocity *= SPRING_DAMPING;
    bounce.value += bounce.velocity;

    let ex = 0;
    let ey = 0;
    let esx = 1;
    let esy = 1;
    const baseBounce = bounce.value;

    const isAnticipate = expression.endsWith("_anticipate");
    const isStatic = expression.endsWith("_static");

    if (expression === "sedih") {
      ex = Math.sin(time * 0.03) * 6;
      esy = 1 - Math.abs(Math.sin(time * 0.02)) * 0.03;
      esx = 1 + Math.abs(Math.sin(time * 0.02)) * 0.015;
    } else if (expression === "senang") {
      ey = Math.abs(Math.sin(time * 0.06)) * -25;
      esy = 1 + Math.sin(time * 0.12) * 0.04;
    } else if (isAnticipate) {
      ey = 18;
      esy = 0.82;
      esx = 1.18;
    } else if (isStatic) {
      ey = 0;
      esy = 1;
      esx = 1;
    }

    esx += baseBounce * 0.3;
    esy -= baseBounce * 0.3;
    ey += baseBounce * 45;

    const motionBlur = Math.min(Math.abs(bounce.velocity) * 18, 5);

    if (containerEl) {
      containerEl.style.setProperty("--ex", `${ex}px`);
      containerEl.style.setProperty("--ey", `${ey}px`);
      containerEl.style.setProperty("--esx", esx.toFixed(4));
      containerEl.style.setProperty("--esy", esy.toFixed(4));
      containerEl.style.setProperty("--mb", `${motionBlur.toFixed(2)}px`);
    }
  };

  return { eyeState, updateFrame, bounceRef };
}
