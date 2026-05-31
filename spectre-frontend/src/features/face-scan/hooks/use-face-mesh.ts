import { useEffect, useRef, useState, type RefObject, type MutableRefObject } from "react";
import { IQA_STATE, PHASES, SCAN_GEOMETRY } from "../model/constants";
import type { IqaState, Landmark, Phase } from "../model/types";
import type {
  CameraInstance,
  FaceMeshInstance,
  FaceMeshResults,
} from "./mediapipe-types";

const MESH_COLOR_DEFAULT = "rgba(255,255,255,0.22)";
const MESH_COLOR_READY = "rgba(52,211,153,0.45)";
const MESH_COLOR_NO_FACE = "rgba(248,113,113,0.55)";
const MESH_COLOR_WARN = "rgba(251,191,36,0.65)";

const HIDE_MESH_PHASES: ReadonlySet<Phase> = new Set<Phase>([
  PHASES.CAPTURING,
  PHASES.PREVIEW,
  PHASES.ANALYZING,
  PHASES.COMPLETE,
  PHASES.FAILED,
]);

const DISPATCH_LANDMARK_PHASES: ReadonlySet<Phase> = new Set<Phase>([
  PHASES.SEARCHING,
  PHASES.MORPHING,
  PHASES.SCANNING,
]);

function resolveMeshColor(state: IqaState | undefined): string {
  if (state === IQA_STATE.READY) return MESH_COLOR_READY;
  if (state === IQA_STATE.NO_FACE) return MESH_COLOR_NO_FACE;
  if (state === undefined) return MESH_COLOR_DEFAULT;
  return MESH_COLOR_WARN;
}

export interface UseFaceMeshOptions {
  videoRef: RefObject<HTMLVideoElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  scriptsLoaded: boolean;
  phaseRef: MutableRefObject<Phase>;
  iqaStateRef: MutableRefObject<IqaState>;
  onFaceFrame: (landmarks: Landmark[] | null) => void;
  onHeadMove: (landmarks: Landmark[]) => void;
  onCameraError?: (err: unknown) => void;
}

export function useFaceMesh({
  videoRef,
  canvasRef,
  scriptsLoaded,
  phaseRef,
  iqaStateRef,
  onFaceFrame,
  onHeadMove,
  onCameraError,
}: UseFaceMeshOptions): boolean {
  const [cameraReady, setCameraReady] = useState(false);
  const cameraRef = useRef<CameraInstance | null>(null);
  const meshRef = useRef<FaceMeshInstance | null>(null);
  const onFaceFrameRef = useRef(onFaceFrame);
  const onHeadMoveRef = useRef(onHeadMove);
  const onCameraErrorRef = useRef(onCameraError);

  useEffect(() => {
    onFaceFrameRef.current = onFaceFrame;
  }, [onFaceFrame]);

  useEffect(() => {
    onHeadMoveRef.current = onHeadMove;
  }, [onHeadMove]);

  useEffect(() => {
    onCameraErrorRef.current = onCameraError;
  }, [onCameraError]);

  useEffect(() => {
    if (!scriptsLoaded) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    if (!window.FaceMesh || !window.Camera) return;

    let active = true;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const mesh = new window.FaceMesh({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
    });
    mesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: false,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    mesh.onResults((results: FaceMeshResults) => {
      if (!active) return;

      const videoEl = videoRef.current;
      if (!videoEl) return;
      const videoW = videoEl.videoWidth || 640;
      const videoH = videoEl.videoHeight || 480;

      const coverScale = Math.max(
        SCAN_GEOMETRY.VIDEO_DISPLAY_SIZE / videoW,
        SCAN_GEOMETRY.VIDEO_DISPLAY_SIZE / videoH,
      );
      const scaledW = Math.round(videoW * coverScale);
      const scaledH = Math.round(videoH * coverScale);

      canvas.width = scaledW;
      canvas.height = scaledH;
      canvas.style.width = `${scaledW}px`;
      canvas.style.height = `${scaledH}px`;
      ctx.clearRect(0, 0, scaledW, scaledH);

      const landmarks = results.multiFaceLandmarks?.[0] ?? null;
      const currentPhase = phaseRef.current;

      if (
        landmarks &&
        window.drawConnectors &&
        window.FACEMESH_TESSELATION &&
        !HIDE_MESH_PHASES.has(currentPhase)
      ) {
        const meshColor = resolveMeshColor(iqaStateRef.current);
        window.drawConnectors(ctx, landmarks, window.FACEMESH_TESSELATION, {
          color: meshColor,
          lineWidth: 0.55,
        });
      }

      if (DISPATCH_LANDMARK_PHASES.has(currentPhase)) {
        onFaceFrameRef.current(landmarks);
      }
      if (currentPhase === PHASES.SCANNING && landmarks) {
        onHeadMoveRef.current(landmarks);
      }
    });

    meshRef.current = mesh;

    const camera = new window.Camera(video, {
      onFrame: async () => {
        if (!active || !videoRef.current) return;
        try {
          await mesh.send({ image: videoRef.current });
        } catch {
          /* swallow transient send errors */
        }
      },
      width: 640,
      height: 480,
    });

    cameraRef.current = camera;
    camera
      .start()
      .then(() => {
        if (active) setCameraReady(true);
      })
      .catch((err) => {
        onCameraErrorRef.current?.(err);
      });

    return () => {
      active = false;
      cameraRef.current?.stop().catch(() => {});
      meshRef.current?.close().catch(() => {});
      cameraRef.current = null;
      meshRef.current = null;
    };
  }, [scriptsLoaded, videoRef, canvasRef, phaseRef, iqaStateRef]);

  return cameraReady;
}
