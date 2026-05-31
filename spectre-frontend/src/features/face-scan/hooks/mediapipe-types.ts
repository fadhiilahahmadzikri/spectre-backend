import type { Landmark } from "../model/types";

export interface FaceMeshResults {
  multiFaceLandmarks?: Landmark[][];
  image?: HTMLCanvasElement | HTMLVideoElement | HTMLImageElement;
}

export interface FaceMeshOptions {
  maxNumFaces?: number;
  refineLandmarks?: boolean;
  minDetectionConfidence?: number;
  minTrackingConfidence?: number;
}

export interface FaceMeshConstructor {
  new (config: { locateFile: (file: string) => string }): FaceMeshInstance;
}

export interface FaceMeshInstance {
  setOptions(options: FaceMeshOptions): void;
  onResults(handler: (results: FaceMeshResults) => void): void;
  send(input: { image: HTMLVideoElement }): Promise<void>;
  close(): Promise<void>;
}

export interface CameraConstructor {
  new (
    video: HTMLVideoElement,
    options: {
      onFrame: () => Promise<void> | void;
      width: number;
      height: number;
    },
  ): CameraInstance;
}

export interface CameraInstance {
  start(): Promise<void>;
  stop(): Promise<void>;
}

export type DrawConnectorsFn = (
  ctx: CanvasRenderingContext2D,
  landmarks: Landmark[],
  connections: unknown,
  options: { color?: string; lineWidth?: number },
) => void;

declare global {
  interface Window {
    FaceMesh?: FaceMeshConstructor;
    Camera?: CameraConstructor;
    drawConnectors?: DrawConnectorsFn;
    FACEMESH_TESSELATION?: unknown;
  }
}
