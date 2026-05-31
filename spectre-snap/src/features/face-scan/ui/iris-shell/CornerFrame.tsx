import { motion } from "framer-motion";
import type { CSSProperties } from "react";
import { IQA_STATE, PHASES } from "../../model/constants";
import type { IqaState, Phase } from "../../model/types";

interface CornerFrameProps {
  phase: Phase;
  iqaState: IqaState;
}

const SPRING_TRANSITION = { type: "spring" as const, stiffness: 260, damping: 26, mass: 0.8 };

export function CornerFrame({ phase, iqaState }: CornerFrameProps) {
  const isSearching = phase === PHASES.SEARCHING;
  const isMorphing = phase === PHASES.MORPHING;

  const cornerSize = isMorphing ? 120 : isSearching ? 50 : 120;
  const cornerRadius = isMorphing ? 120 : 18;
  const borderWidth = 2.5;

  let iqaClass = "";
  if (isSearching) {
    if (iqaState === IQA_STATE.READY) iqaClass = "corner-frame-ready";
    else if (iqaState !== IQA_STATE.NO_FACE) iqaClass = "corner-frame-warn";
  }

  const baseStyle: CSSProperties = {
    position: "absolute",
    borderColor: "rgba(255,255,255,0.88)",
    borderStyle: "solid",
  };

  const corners: Array<{ key: string; style: CSSProperties }> = [
    {
      key: "tl",
      style: {
        top: 0,
        left: 0,
        borderTopWidth: borderWidth,
        borderLeftWidth: borderWidth,
        borderTopLeftRadius: cornerRadius,
      },
    },
    {
      key: "tr",
      style: {
        top: 0,
        right: 0,
        borderTopWidth: borderWidth,
        borderRightWidth: borderWidth,
        borderTopRightRadius: cornerRadius,
      },
    },
    {
      key: "bl",
      style: {
        bottom: 0,
        left: 0,
        borderBottomWidth: borderWidth,
        borderLeftWidth: borderWidth,
        borderBottomLeftRadius: cornerRadius,
      },
    },
    {
      key: "br",
      style: {
        bottom: 0,
        right: 0,
        borderBottomWidth: borderWidth,
        borderRightWidth: borderWidth,
        borderBottomRightRadius: cornerRadius,
      },
    },
  ];

  return (
    <>
      {corners.map(({ key, style }) => (
        <motion.div
          key={key}
          className={iqaClass}
          animate={{ width: cornerSize, height: cornerSize }}
          transition={SPRING_TRANSITION}
          style={{ ...baseStyle, ...style }}
        />
      ))}
    </>
  );
}
