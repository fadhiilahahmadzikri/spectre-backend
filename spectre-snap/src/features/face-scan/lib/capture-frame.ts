const CAPTURE_SIZE = 400;
const CAPTURE_QUALITY = 0.95;

export function captureBase64FromVideo(video: HTMLVideoElement): string | null {
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  if (!vw || !vh) return null;

  const canvas = document.createElement("canvas");
  canvas.width = CAPTURE_SIZE;
  canvas.height = CAPTURE_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const size = Math.min(vw, vh);
  const sx = (vw - size) / 2;
  const sy = (vh - size) / 2;

  ctx.drawImage(video, sx, sy, size, size, 0, 0, CAPTURE_SIZE, CAPTURE_SIZE);

  const dataUrl = canvas.toDataURL("image/jpeg", CAPTURE_QUALITY);
  return dataUrl.split(",")[1] ?? null;
}
