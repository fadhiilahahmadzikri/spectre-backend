import { useEffect, useMemo, useRef, useState } from "react";
import { IQA_FEEDBACK, IQA_STATE, IQA_THRESHOLDS } from "../model/constants";
import type { IqaFeedback } from "../model/constants";
import { computeIQA } from "../lib/compute-iqa";
import type { IqaResult, IqaState, Landmark } from "../model/types";

const STABILITY_FEEDBACK: IqaFeedback = {
  p: 98,
  text: "Memastikan stabilitas frame...",
  kind: "active",
};

export interface UseIqaOptions {
  landmarks: readonly Landmark[] | null;
  luminance: number;
  blur: number;
  blurDelta?: number;
  enabled: boolean;
  ignorePose?: boolean;
}

export interface UseIqaResult {
  iqaState: IqaState;
  iqaMessage: IqaFeedback;
  instantFails: IqaState[];
}

export function useIQA({
  landmarks,
  luminance,
  blur,
  blurDelta = 0,
  enabled,
  ignorePose = false,
}: UseIqaOptions): UseIqaResult {
  const [iqaState, setIqaState] = useState<IqaState>(IQA_STATE.NO_FACE);
  const [iqaMessage, setIqaMessage] = useState<IqaFeedback>(IQA_FEEDBACK[IQA_STATE.NO_FACE]);

  const trackerRef = useRef<{ state: IqaState; count: number }>({
    state: IQA_STATE.NO_FACE,
    count: 0,
  });
  const confirmedRef = useRef<IqaState>(IQA_STATE.NO_FACE);
  const lastMsgTimeRef = useRef(0);

  const instantResult: IqaResult = useMemo(
    () =>
      enabled
        ? computeIQA({ landmarks, luminance, blur, blurDelta, ignorePose })
        : { state: IQA_STATE.NO_FACE, fails: [IQA_STATE.NO_FACE] },
    [enabled, landmarks, luminance, blur, blurDelta, ignorePose],
  );

  useEffect(() => {
    if (!enabled) {
      trackerRef.current = { state: IQA_STATE.NO_FACE, count: 0 };
      confirmedRef.current = IQA_STATE.NO_FACE;
      return;
    }

    const candidate = instantResult.state;
    const tracker = trackerRef.current;

    if (candidate === tracker.state) {
      tracker.count++;
    } else {
      tracker.state = candidate;
      tracker.count = 1;
    }

    const threshold =
      candidate === IQA_STATE.READY
        ? IQA_THRESHOLDS.READY_FRAMES
        : IQA_THRESHOLDS.FAIL_FRAMES;

    if (candidate === IQA_STATE.READY && tracker.count < threshold) {
      const now = Date.now();
      if (now - lastMsgTimeRef.current >= IQA_THRESHOLDS.MSG_COOLDOWN_MS) {
        lastMsgTimeRef.current = now;
        setIqaMessage(STABILITY_FEEDBACK);
      }
    }

    if (tracker.count >= threshold && confirmedRef.current !== candidate) {
      confirmedRef.current = candidate;
      setIqaState(candidate);

      const now = Date.now();
      const cooldownOk =
        now - lastMsgTimeRef.current >= IQA_THRESHOLDS.MSG_COOLDOWN_MS;
      if (cooldownOk || candidate !== IQA_STATE.READY) {
        lastMsgTimeRef.current = now;
        setIqaMessage(IQA_FEEDBACK[candidate]);
      }
    }
  }, [enabled, instantResult]);

  return {
    iqaState: enabled ? iqaState : IQA_STATE.NO_FACE,
    iqaMessage: enabled ? iqaMessage : IQA_FEEDBACK[IQA_STATE.NO_FACE],
    instantFails: instantResult.fails,
  };
}
