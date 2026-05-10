import type { CSSProperties, ReactNode } from "react";
import { PHASES } from "../../model/constants";
import type { Phase } from "../../model/types";

interface IrisShellProps {
  phase: Phase;
  children: ReactNode;
}

interface ShellGeometry {
  width: number;
  height: number;
  borderRadius: number;
  className: string;
}

function resolveShellGeometry(phase: Phase): ShellGeometry {
  const isSquare = phase === PHASES.LOADING || phase === PHASES.SEARCHING;
  const isMorphing = phase === PHASES.MORPHING;

  if (isMorphing) {
    return {
      width: 260,
      height: 260,
      borderRadius: 130,
      className: "iris-shell is-square glass-blue",
    };
  }
  if (isSquare) {
    return {
      width: 320,
      height: 320,
      borderRadius: 44,
      className: "iris-shell is-square glass-blue",
    };
  }
  return {
    width: 260,
    height: 260,
    borderRadius: 130,
    className: "iris-shell is-circle",
  };
}

export function IrisShell({ phase, children }: IrisShellProps) {
  const { width, height, borderRadius, className } = resolveShellGeometry(phase);

  const style: CSSProperties = {
    width,
    height,
    borderRadius,
  };

  return (
    <div className={`${className} flex items-center justify-center relative`} style={style}>
      {children}
    </div>
  );
}
