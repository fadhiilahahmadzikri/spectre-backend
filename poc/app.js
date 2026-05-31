const { useState, useEffect, useRef, useCallback, useMemo } = React;
const Motion = window.Motion || {};
const motion = Motion.motion;
const AnimatePresence = Motion.AnimatePresence;

const Config = {
    API_KEY: "spk_d602c7bc949464b18c0fafc1c3c5d4f048bf2a524acad217",
    API_URL: "https://thewhitenigs-spectre-backend.hf.space/api/v1/faces",
    REDIRECT_ON_AUTH: "https://www.youtube.com/shorts/USp-MU89SvE",
    REDIRECT_DELAY: 5,
    BRIGHTNESS_THRESHOLD: 55,
    BRIGHTNESS_INTERVAL: 120,
    MEDIAPIPE_SCRIPTS: [
        'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js',
        'https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js',
        'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js',
        'https://cdn.jsdelivr.net/npm/apexcharts',
        'https://cdn.jsdelivr.net/npm/zod@3.23.8/lib/index.umd.js'
    ],
    CLASSES: ["fake_mannequin", "fake_mask", "fake_papercut", "fake_printed", "fake_screen", "realperson"],
    CLASS_LABELS: {
        fake_mannequin: "Mannequin",
        fake_mask: "Mask",
        fake_papercut: "Paper Cut",
        fake_printed: "Printed",
        fake_screen: "Screen",
        realperson: "Real Person"
    },
    MODE_REGISTER: 'register',
    MODE_AUTHENTICATE: 'authenticate',
};

const PHASES = {
    USER_ID: 'USER_ID',
    LOADING: 'LOADING',
    SEARCHING: 'SEARCHING',
    MORPHING: 'MORPHING',
    SCANNING: 'SCANNING',
    PREVIEW: 'PREVIEW',
    CAPTURING: 'CAPTURING',
    ANALYZING: 'ANALYZING',
    COMPLETE: 'COMPLETE',
    FAILED: 'FAILED',
};

const NUM_SEGMENTS = 60;
const ANGLE_STEP = 360 / NUM_SEGMENTS;
const RADIUS_INNER = 135;
const RADIUS_OUTER = 155;
const CENTER = 200;
const VIDEO_DISPLAY_SIZE = 400;

const ACTIVE_PHASES = new Set([PHASES.CAPTURING, PHASES.ANALYZING]);
const TERMINAL_PHASES = new Set([PHASES.COMPLETE, PHASES.FAILED]);
const CANVAS_PHASES = new Set([PHASES.SEARCHING, PHASES.MORPHING, PHASES.SCANNING, PHASES.CAPTURING, PHASES.PREVIEW, PHASES.ANALYZING]);
const VIGNETTE_PHASES = new Set([PHASES.SCANNING, PHASES.CAPTURING, PHASES.PREVIEW, PHASES.ANALYZING, PHASES.COMPLETE, PHASES.FAILED]);

const IQA = {
    NO_FACE: 'NO_FACE',
    NOT_CENTERED: 'NOT_CENTERED',
    LOW_LIGHT: 'LOW_LIGHT',
    TOO_FAR: 'TOO_FAR',
    TOO_CLOSE: 'TOO_CLOSE',
    BAD_POSE: 'BAD_POSE',
    EYES_CLOSED: 'EYES_CLOSED',
    BLURRY: 'BLURRY',
    READY: 'READY',
};

const IQA_FEEDBACK = {
    [IQA.NO_FACE]: { p: 1, text: 'Posisikan wajah di dalam bingkai', kind: 'active' },
    [IQA.NOT_CENTERED]: { p: 1.5, text: 'Geser wajah tepat ke tengah lingkaran', kind: 'warn' },
    [IQA.LOW_LIGHT]: { p: 2, text: 'Pencahayaan kurang — cari tempat terang', kind: 'warn' },
    [IQA.EYES_CLOSED]: { p: 3, text: 'Buka kedua mata Anda', kind: 'warn' },
    [IQA.BAD_POSE]: { p: 4, text: 'Hadapkan wajah lurus ke kamera', kind: 'warn' },
    [IQA.TOO_FAR]: { p: 5, text: 'Dekatkan wajah ke kamera', kind: 'warn' },
    [IQA.TOO_CLOSE]: { p: 6, text: 'Jauhkan sedikit dari kamera', kind: 'warn' },
    [IQA.BLURRY]: { p: 7, text: 'Tahan posisi — kamera sedang menyesuaikan fokus', kind: 'warn' },
    [IQA.READY]: { p: 99, text: 'Wajah terdeteksi', kind: 'ok' },
};

const IQA_THRESHOLDS = {
    FACE_AREA_MIN: 0.025,
    FACE_AREA_MAX: 0.45,
    CENTER_TOLERANCE: 0.15,
    YAW_MAX: 0.035,
    PITCH_MAX: 0.04,
    EAR_MIN: 0.18,
    BLUR_LAPLACIAN_MIN: 25,
    BLUR_DELTA_MAX: 180,
    BLUR_WINDOW_SIZE: 8,
    READY_FRAMES: 45,
    FAIL_FRAMES: 15,
    MSG_COOLDOWN_MS: 400,
};

let iqaSchemaCache = null;
let iqaSchemaNoPoseCache = null;

function getIqaSchema(ignorePose) {
    if (!window.Zod) return null;
    const z = window.Zod.z;

    if (ignorePose && iqaSchemaNoPoseCache) return iqaSchemaNoPoseCache;
    if (!ignorePose && iqaSchemaCache) return iqaSchemaCache;

    const schema = z.object({
        hasFace: z.boolean().refine(v => v === true, { message: IQA.NO_FACE }),
        centerDist: z.number().max(IQA_THRESHOLDS.CENTER_TOLERANCE, { message: IQA.NOT_CENTERED }),
        luminance: z.number().min(Config.BRIGHTNESS_THRESHOLD, { message: IQA.LOW_LIGHT }),
        blur: z.number().min(IQA_THRESHOLDS.BLUR_LAPLACIAN_MIN, { message: IQA.BLURRY }),
        blurDelta: z.number().max(IQA_THRESHOLDS.BLUR_DELTA_MAX, { message: IQA.BLURRY }),
        faceArea: z.number()
            .min(IQA_THRESHOLDS.FACE_AREA_MIN, { message: IQA.TOO_FAR })
            .max(IQA_THRESHOLDS.FACE_AREA_MAX, { message: IQA.TOO_CLOSE }),
        ear: z.number().min(IQA_THRESHOLDS.EAR_MIN, { message: IQA.EYES_CLOSED }),
    });

    const schemaWithPose = schema.extend({
        yaw: z.number().max(IQA_THRESHOLDS.YAW_MAX, { message: IQA.BAD_POSE }),
        pitch: z.number().max(IQA_THRESHOLDS.PITCH_MAX, { message: IQA.BAD_POSE }),
    });

    iqaSchemaCache = schemaWithPose;
    iqaSchemaNoPoseCache = schema;

    return ignorePose ? iqaSchemaNoPoseCache : iqaSchemaCache;
}

function computeIQA(landmarks, lum, blurLevel, blurDelta = 0, ignorePose = false) {
    const hasFace = !!landmarks && landmarks.length >= 400;
    
    if (!window.Zod || !hasFace) {
        return { state: IQA.NO_FACE, fails: [IQA.NO_FACE] };
    }

    const leftEar = landmarks[234];
    const rightEar = landmarks[454];
    const top = landmarks[10];
    const bottom = landmarks[152];
    const nose = landmarks[1];
    
    const cx = (leftEar.x + rightEar.x) / 2;
    const cy = (top.y + bottom.y) / 2;
    const centerDist = Math.hypot(cx - 0.5, cy - 0.5);

    if (centerDist > 0.35) {
        return { state: IQA.NO_FACE, fails: [IQA.NO_FACE] };
    }

    const faceW = Math.abs(rightEar.x - leftEar.x);
    const faceH = Math.abs(bottom.y - top.y);
    const faceArea = faceW * faceH;

    const yaw = Math.abs(nose.x - cx);
    const pitch = Math.abs(nose.y - cy) - (faceH * 0.05);

    const earL = computeEAR(landmarks, [33, 160, 158, 133, 153, 144]);
    const earR = computeEAR(landmarks, [362, 385, 387, 263, 373, 380]);
    const ear = (earL + earR) / 2;

    const metrics = {
        hasFace: true,
        centerDist,
        luminance: lum ?? 0,
        blur: blurLevel ?? 0,
        blurDelta: blurDelta ?? 0,
        faceArea,
        yaw,
        pitch,
        ear
    };

    const schema = getIqaSchema(ignorePose);
    if (!schema) return { state: IQA.NO_FACE, fails: [IQA.NO_FACE] };

    const result = schema.safeParse(metrics);

    if (!result.success) {
        const fails = result.error.errors.map(e => e.message);
        const uniqueFails = [...new Set(fails)];
        uniqueFails.sort((a, b) => IQA_FEEDBACK[a].p - IQA_FEEDBACK[b].p);
        
        return { state: uniqueFails[0], fails: uniqueFails };
    }

    return { state: IQA.READY, fails: [] };
}

function computeEAR(landmarks, idx) {
    const p = idx.map(i => landmarks[i]);
    const vertical1 = Math.hypot(p[1].x - p[5].x, p[1].y - p[5].y);
    const vertical2 = Math.hypot(p[2].x - p[4].x, p[2].y - p[4].y);
    const horizontal = Math.hypot(p[0].x - p[3].x, p[0].y - p[3].y);
    return (vertical1 + vertical2) / (2.0 * horizontal + 1e-6);
}

function notify(message, type = 'info') {
    const palette = {
        success: 'rgba(255,255,255,0.95)',
        error: 'rgba(248,113,113,0.95)',
        warning: 'rgba(251,191,36,0.95)',
        info: 'rgba(160,200,255,0.95)',
    };
    const colors = {
        success: '#000',
        error: '#fff',
        warning: '#0b0b0d',
        info: '#0b0b0d',
    };
    Toastify({
        text: message,
        duration: 2400,
        gravity: 'top',
        position: 'center',
        style: { background: palette[type] || palette.info, color: colors[type] || '#000', borderRadius: '12px', fontWeight: '500', fontSize: '13px' }
    }).showToast();
}

function useScriptLoader(sources) {
    const [allLoaded, setAllLoaded] = useState(false);
    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            for (const src of sources) {
                if (document.querySelector(`script[src="${src}"]`)) continue;
                await new Promise((resolve, reject) => {
                    const el = document.createElement('script');
                    el.src = src;
                    el.crossOrigin = 'anonymous';
                    el.onload = resolve;
                    el.onerror = reject;
                    document.head.appendChild(el);
                });
            }
            if (!cancelled) {
                setAllLoaded(true);
                console.log("[System] All CDNs loaded successfully. Zod object available:", !!window.Zod);
            }
        };
        load().catch((err) => console.error('Script load failed', err));
        return () => { cancelled = true; };
    }, []);
    return allLoaded;
}

function useGlitchOpacity(active) {
    const [opacity, setOpacity] = useState(0.85);
    const frameRef = useRef(null);
    useEffect(() => {
        if (!active) { setOpacity(0.85); return; }
        let lastEventTime = 0;
        let eventEndTime = 0;
        let inGlitch = false;
        const animate = (timestamp) => {
            if (!inGlitch && timestamp - lastEventTime > 1200 + Math.random() * 2800) {
                inGlitch = true;
                lastEventTime = timestamp;
                eventEndTime = timestamp + 50 + Math.random() * 160;
                setOpacity(0.05 + Math.random() * 0.2);
            } else if (inGlitch && timestamp >= eventEndTime) {
                inGlitch = false;
                setOpacity(0.78 + Math.random() * 0.18);
            }
            frameRef.current = requestAnimationFrame(animate);
        };
        frameRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(frameRef.current);
    }, [active]);
    return opacity;
}

function useFaceMesh({ videoRef, canvasRef, scriptsLoaded, phaseRef, iqaStateRef, onFaceFrame, onHeadMove }) {
    const [cameraReady, setCameraReady] = useState(false);
    const cameraRef = useRef(null);
    const meshRef = useRef(null);
    const onFaceFrameRef = useRef(onFaceFrame);
    const onHeadMoveRef = useRef(onHeadMove);

    useEffect(() => { onFaceFrameRef.current = onFaceFrame; }, [onFaceFrame]);
    useEffect(() => { onHeadMoveRef.current = onHeadMove; }, [onHeadMove]);

    useEffect(() => {
        if (!scriptsLoaded || !videoRef.current || !canvasRef.current) return;

        let active = true;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        const mesh = new window.FaceMesh({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
        });

        mesh.setOptions({
            maxNumFaces: 1,
            refineLandmarks: false,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5,
        });

        mesh.onResults((results) => {
            if (!active) return;
            const videoEl = videoRef.current;
            if (!videoEl) return;
            const videoW = videoEl.videoWidth || 640;
            const videoH = videoEl.videoHeight || 480;

            const coverScale = Math.max(VIDEO_DISPLAY_SIZE / videoW, VIDEO_DISPLAY_SIZE / videoH);
            const scaledW = Math.round(videoW * coverScale);
            const scaledH = Math.round(videoH * coverScale);

            canvas.width = scaledW;
            canvas.height = scaledH;
            canvas.style.width = `${scaledW}px`;
            canvas.style.height = `${scaledH}px`;
            ctx.clearRect(0, 0, scaledW, scaledH);

            const landmarks = results.multiFaceLandmarks?.[0] || null;
            const currentPhase = phaseRef?.current;

            if (landmarks && window.FACEMESH_TESSELATION) {
                const state = iqaStateRef?.current;
                
                if (currentPhase !== PHASES.CAPTURING && currentPhase !== PHASES.PREVIEW && currentPhase !== PHASES.ANALYZING && currentPhase !== PHASES.COMPLETE && currentPhase !== PHASES.FAILED) {
                    let meshColor = 'rgba(255,255,255,0.22)';
                    
                    if (state === IQA.READY) {
                        meshColor = 'rgba(52,211,153,0.45)';
                    } else if (state === IQA.NO_FACE) {
                        meshColor = 'rgba(248,113,113,0.55)';
                    } else if (state !== undefined) {
                        meshColor = 'rgba(251,191,36,0.65)';
                    }

                    window.drawConnectors(ctx, landmarks, window.FACEMESH_TESSELATION, {
                        color: meshColor,
                        lineWidth: 0.55,
                    });
                }
            }

            if (currentPhase === PHASES.SEARCHING || currentPhase === PHASES.MORPHING || currentPhase === PHASES.SCANNING) {
                onFaceFrameRef.current(landmarks);
            }
            if (currentPhase === PHASES.SCANNING && landmarks) {
                onHeadMoveRef.current(landmarks);
            }
        });

        meshRef.current = mesh;

        const camera = new window.Camera(videoRef.current, {
            onFrame: async () => {
                if (videoRef.current && active) {
                    try { await mesh.send({ image: videoRef.current }); } catch (_) { }
                }
            },
            width: 640,
            height: 480,
        });

        cameraRef.current = camera;
        camera.start()
            .then(() => { if (active) setCameraReady(true); })
            .catch((err) => {
                console.error('Camera error', err);
                notify('Akses kamera ditolak atau tidak tersedia.', 'error');
            });

        return () => {
            active = false;
            try { cameraRef.current?.stop(); } catch (_) { }
            try { meshRef.current?.close(); } catch (_) { }
            cameraRef.current = null;
            meshRef.current = null;
        };
    }, [scriptsLoaded]);

    return cameraReady;
}

function useBrightness({ videoRef, enabled, intervalMs = Config.BRIGHTNESS_INTERVAL }) {
    const [lum, setLum] = useState(0);
    const samplerRef = useRef(null);
    useEffect(() => {
        if (!enabled) { setLum(0); return; }
        const sampler = document.createElement('canvas');
        sampler.width = 24;
        sampler.height = 24;
        const sctx = sampler.getContext('2d', { willReadFrequently: true });
        samplerRef.current = sampler;
        let cancelled = false;
        const tick = () => {
            if (cancelled) return;
            const v = videoRef.current;
            if (v && v.readyState >= 2 && v.videoWidth > 0) {
                try {
                    sctx.drawImage(v, 0, 0, 24, 24);
                    const data = sctx.getImageData(0, 0, 24, 24).data;
                    let sum = 0;
                    for (let i = 0; i < data.length; i += 4) {
                        sum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
                    }
                    setLum(sum / (24 * 24));
                } catch (_) { }
            }
        };
        const id = setInterval(tick, intervalMs);
        tick();
        return () => { cancelled = true; clearInterval(id); samplerRef.current = null; };
    }, [enabled, intervalMs]);
    return lum;
}

function useBlurMetrics({ videoRef, landmarks, enabled, intervalMs = 60 }) {
    const [blurLevel, setBlurLevel] = useState(0);
    const [blurDelta, setBlurDelta] = useState(0);
    const windowRef = useRef([]);
    const samplerRef = useRef(null);
    const landmarksRef = useRef(landmarks);

    useEffect(() => {
        landmarksRef.current = landmarks;
    }, [landmarks]);

    useEffect(() => {
        if (!enabled) {
            setBlurLevel(0);
            setBlurDelta(0);
            windowRef.current = [];
            return;
        }
        const sampler = document.createElement('canvas');
        const size = 64;
        sampler.width = size;
        sampler.height = size;
        const sctx = sampler.getContext('2d', { willReadFrequently: true });
        samplerRef.current = sampler;
        let cancelled = false;

        const tick = () => {
            if (cancelled) return;
            const v = videoRef.current;
            const lms = landmarksRef.current;

            if (v && v.readyState >= 2 && v.videoWidth > 0 && lms && lms.length > 0) {
                try {
                    const faceLeft = lms[234]?.x || 0;
                    const faceRight = lms[454]?.x || 1;
                    const faceTop = lms[10]?.y || 0;
                    const faceBottom = lms[152]?.y || 1;

                    const sx = Math.max(0, faceLeft * v.videoWidth);
                    const sy = Math.max(0, faceTop * v.videoHeight);
                    const sw = Math.min(v.videoWidth - sx, (faceRight - faceLeft) * v.videoWidth);
                    const sh = Math.min(v.videoHeight - sy, (faceBottom - faceTop) * v.videoHeight);

                    if (sw <= 0 || sh <= 0) return;

                    sctx.drawImage(v, sx, sy, sw, sh, 0, 0, size, size);
                    
                    const data = sctx.getImageData(0, 0, size, size).data;
                    let sum = 0, sumSq = 0, count = 0;
                    for (let y = 1; y < size - 1; y++) {
                        for (let x = 1; x < size - 1; x++) {
                            const i = (y * size + x) * 4;
                            const top = ((y - 1) * size + x) * 4;
                            const bottom = ((y + 1) * size + x) * 4;
                            const left = (y * size + (x - 1)) * 4;
                            const right = (y * size + (x + 1)) * 4;

                            const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
                            const grayTop = 0.299 * data[top] + 0.587 * data[top + 1] + 0.114 * data[top + 2];
                            const grayBottom = 0.299 * data[bottom] + 0.587 * data[bottom + 1] + 0.114 * data[bottom + 2];
                            const grayLeft = 0.299 * data[left] + 0.587 * data[left + 1] + 0.114 * data[left + 2];
                            const grayRight = 0.299 * data[right] + 0.587 * data[right + 1] + 0.114 * data[right + 2];

                            const laplacian = -4 * gray + grayTop + grayBottom + grayLeft + grayRight;
                            sum += laplacian;
                            sumSq += laplacian * laplacian;
                            count++;
                        }
                    }
                    const mean = sum / count;
                    const variance = (sumSq / count) - (mean * mean);

                    const win = windowRef.current;
                    win.push(variance);
                    if (win.length > IQA_THRESHOLDS.BLUR_WINDOW_SIZE) win.shift();

                    const winMean = win.reduce((a, b) => a + b, 0) / win.length;
                    const delta = win.length >= 2
                        ? Math.max(...win) - Math.min(...win)
                        : 0;

                    setBlurLevel(winMean);
                    setBlurDelta(delta);
                } catch (_) { }
            } else {
                setBlurLevel(0);
                setBlurDelta(0);
            }
        };
        const id = setInterval(tick, intervalMs);
        tick();
        return () => { cancelled = true; clearInterval(id); windowRef.current = []; samplerRef.current = null; };
    }, [enabled, intervalMs]);

    return { blurLevel, blurDelta };
}

function useIQA({ landmarks, lum, blurLevel, blurDelta = 0, enabled, ignorePose = false }) {
    const [iqaState, setIqaState] = useState(IQA.NO_FACE);
    const [iqaMessage, setIqaMessage] = useState(IQA_FEEDBACK[IQA.NO_FACE]);
    const consecutiveRef = useRef({ state: IQA.NO_FACE, count: 0 });
    const confirmedRef = useRef(IQA.NO_FACE);
    const lastMsgTimeRef = useRef(0);

    const instantResult = enabled 
        ? computeIQA(landmarks, lum, blurLevel, blurDelta, ignorePose) 
        : { state: IQA.NO_FACE, fails: [IQA.NO_FACE] };

    useEffect(() => {
        if (!enabled) {
            setIqaState(IQA.NO_FACE);
            setIqaMessage(IQA_FEEDBACK[IQA.NO_FACE]);
            consecutiveRef.current = { state: IQA.NO_FACE, count: 0 };
            confirmedRef.current = IQA.NO_FACE;
            return;
        }

        const candidate = instantResult.state;
        const tracker = consecutiveRef.current;

        if (candidate === tracker.state) {
            tracker.count++;
        } else {
            tracker.state = candidate;
            tracker.count = 1;
        }

        const threshold = candidate === IQA.READY
            ? IQA_THRESHOLDS.READY_FRAMES
            : IQA_THRESHOLDS.FAIL_FRAMES;

        if (candidate === IQA.READY && tracker.count < threshold) {
            const now = Date.now();
            const cooldownOk = now - lastMsgTimeRef.current >= IQA_THRESHOLDS.MSG_COOLDOWN_MS;
            if (cooldownOk) {
                lastMsgTimeRef.current = now;
                setIqaMessage({ p: 98, text: 'Memastikan stabilitas frame...', kind: 'info' });
            }
        }

        if (tracker.count >= threshold && confirmedRef.current !== candidate) {
            confirmedRef.current = candidate;
            setIqaState(candidate);

            const now = Date.now();
            const cooldownOk = now - lastMsgTimeRef.current >= IQA_THRESHOLDS.MSG_COOLDOWN_MS;
            if (cooldownOk || candidate !== IQA.READY) {
                lastMsgTimeRef.current = now;
                setIqaMessage(IQA_FEEDBACK[candidate]);
            }
        }
    }, [landmarks, lum, blurLevel, blurDelta, enabled]);

    return { iqaState, iqaMessage, instantFails: instantResult.fails };
}

function captureBase64FromVideo(video) {
    const vw = video.videoWidth;
    const vh = video.videoHeight;
    if (!vw || !vh) return null;

    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');

    const size = Math.min(vw, vh);
    const sx = (vw - size) / 2;
    const sy = (vh - size) / 2;

    ctx.drawImage(video, sx, sy, size, size, 0, 0, 400, 400);

    const fullDataUri = canvas.toDataURL('image/jpeg', 0.95);
    return fullDataUri.split(',')[1];
}

class FaceAPIClient {
    constructor() {
        this.headers = {
            'X-API-Key': Config.API_KEY,
            'Content-Type': 'application/json',
        };
    }

    async _fetch(endpoint, options = {}) {
        try {
            const res = await fetch(`${Config.API_URL}${endpoint}`, { ...options, headers: this.headers });
            const data = res.status !== 204 ? await res.json() : null;
            return { ok: res.ok, status: res.status, data };
        } catch (err) {
            return { ok: false, status: 500, data: { error: { message: 'Connection refused or network error.' } } };
        }
    }

    _payload(userId, image, fas) {
        return {
            external_user_id: userId,
            image,
            metadata: { source: 'web_ui', bypass_fas: !fas }
        };
    }

    register(userId, image, fas) { return this._fetch('/register', { method: 'POST', body: JSON.stringify(this._payload(userId, image, fas)) }); }
    authenticate(userId, image, fas) { return this._fetch('/authenticate', { method: 'POST', body: JSON.stringify(this._payload(userId, image, fas)) }); }
    history() { return this._fetch(''); }
    purgeUser(userId) { return this._fetch(`/${userId}`, { method: 'DELETE' }); }
    purgeAll() { return this._fetch('', { method: 'DELETE' }); }
    async lookupUser(userId) {
        const res = await this._fetch('');
        if (res.ok && res.data?.profiles) {
            return { exists: res.data.profiles.some(p => p.external_user_id === userId) };
        }
        return { exists: false };
    }
}

const apiClient = new FaceAPIClient();

function FaceIDGlyph({ size = 28 }) {
    return (
        <img src="assets/logo/LOGO.svg" width={size} height={size} alt="Logo" style={{ objectFit: 'contain' }} />
    );
}
function MoreVertIcon({ size = 18 }) {
    return (
        <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor">
            <circle cx="12" cy="5" r="1.5" />
            <circle cx="12" cy="12" r="1.5" />
            <circle cx="12" cy="19" r="1.5" />
        </svg>
    );
}

function CloseIcon({ size = 16 }) {
    return (
        <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
        </svg>
    );
}

function RefreshIcon({ size = 14 }) {
    return (
        <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
            <path d="M21 3v5h-5" />
            <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
            <path d="M3 21v-5h5" />
        </svg>
    );
}

function ArrowRightIcon({ size = 16 }) {
    return (
        <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
        </svg>
    );
}

function RadialChartCDN({ value, label, color }) {
    const chartRef = useRef(null);
    const chartInstance = useRef(null);
    const pct = Math.max(0, Math.min(100, value * 100));

    useEffect(() => {
        if (!window.ApexCharts || !chartRef.current) return;

        const options = {
            series: [pct],
            chart: {
                type: 'radialBar',
                height: 140,
                sparkline: { enabled: true },
                animations: { enabled: true, easing: 'easeinout', speed: 800 }
            },
            plotOptions: {
                radialBar: {
                    hollow: { size: '55%' },
                    track: { background: 'rgba(255,255,255,0.08)', strokeWidth: '100%' },
                    dataLabels: {
                        name: { show: false },
                        value: { offsetY: 5, color: '#fff', fontSize: '13px', fontWeight: 600, fontFamily: 'Share Tech Mono', formatter: function (val) { return val.toFixed(1) + "%" } }
                    }
                }
            },
            fill: { colors: [color] },
            stroke: { lineCap: 'round' }
        };

        if (!chartInstance.current) {
            chartInstance.current = new window.ApexCharts(chartRef.current, options);
            chartInstance.current.render();
        } else {
            chartInstance.current.updateOptions(options);
        }

        return () => {
            if (chartInstance.current) {
                chartInstance.current.destroy();
                chartInstance.current = null;
            }
        }
    }, [pct, color]);

    return (
        <div className="flex flex-col items-center gap-1 p-3 bg-white/[0.03] rounded-2xl border border-white/[0.05]">
            <div ref={chartRef} className="w-[90px] h-[90px] flex items-center justify-center"></div>
            <span className="text-[11px] text-white/70 font-mono text-center tracking-tight leading-tight w-full truncate px-1 mt-1">{label}</span>
        </div>
    );
}

function SystemOverlayScreen({ visible, icon, title, subtitle, spinner }) {
    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="absolute inset-0 z-[100] flex flex-col items-center justify-center"
                    style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
                >
                    {spinner ? <div className="gate-spinner mb-4" /> : icon}
                    <div className="text-white text-[16px] font-semibold mt-2 text-center" style={{ letterSpacing: '-0.01em' }}>{title}</div>
                    {subtitle && <div className="text-white/60 text-[13px] mt-1.5 text-center">{subtitle}</div>}
                </motion.div>
            )}
        </AnimatePresence>
    );
}

function CornerFrame({ phase, iqaState }) {
    const isSearching = phase === PHASES.SEARCHING;
    const isMorphing = phase === PHASES.MORPHING;

    const cornerSize = isMorphing ? 120 : isSearching ? 50 : 120;
    const cornerRadius = isMorphing ? 120 : 18;
    const borderWidth = 2.5;

    let iqaClass = '';
    if (isSearching) {
        if (iqaState === IQA.READY) iqaClass = 'corner-frame-ready';
        else if (iqaState !== IQA.NO_FACE) iqaClass = 'corner-frame-warn';
    }

    const springTransition = { type: 'spring', stiffness: 260, damping: 26, mass: 0.8 };

    const makeCorner = (positionStyle) => (
        <motion.div
            className={iqaClass}
            animate={{ width: cornerSize, height: cornerSize }}
            transition={springTransition}
            style={{
                position: 'absolute',
                borderColor: 'rgba(255,255,255,0.88)',
                borderStyle: 'solid',
                ...positionStyle,
            }}
        />
    );

    return (
        <>
            {makeCorner({ top: 0, left: 0, borderTopWidth: borderWidth, borderLeftWidth: borderWidth, borderTopLeftRadius: cornerRadius })}
            {makeCorner({ top: 0, right: 0, borderTopWidth: borderWidth, borderRightWidth: borderWidth, borderTopRightRadius: cornerRadius })}
            {makeCorner({ bottom: 0, left: 0, borderBottomWidth: borderWidth, borderLeftWidth: borderWidth, borderBottomLeftRadius: cornerRadius })}
            {makeCorner({ bottom: 0, right: 0, borderBottomWidth: borderWidth, borderRightWidth: borderWidth, borderBottomRightRadius: cornerRadius })}
        </>
    );
}

function AnimatedStatusIcon({ 
    type = 'success', 
    size = 82, 
    color, 
    ringColor, 
    circleFill = 'none', 
    strokeWidth = 4.5,
    style = {} 
}) {
    const isSuccess = type === 'success';
    const defaultColor = isSuccess ? '#34d399' : '#f87171';
    const defaultRingColor = isSuccess ? 'rgba(52,211,153,0.35)' : 'rgba(248,113,113,0.35)';
    
    const finalColor = color || defaultColor;
    const finalRingColor = ringColor || defaultRingColor;

    return (
        <svg width={size} height={size} viewBox="0 0 100 100" style={style}>
            <circle 
                cx="50" cy="50" r="44" 
                fill={circleFill} 
                stroke={finalRingColor} 
                strokeWidth={circleFill === 'none' ? 2.5 : 3} 
                className="checkmark-ring" 
            />
            {isSuccess ? (
                <path d="M30 52 L45 67 L72 36" fill="none" stroke={finalColor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className="checkmark-tick" />
            ) : (
                <>
                    <path d="M34 34 L66 66" fill="none" stroke={finalColor} strokeWidth={strokeWidth} strokeLinecap="round" className="checkmark-tick" />
                    <path d="M66 34 L34 66" fill="none" stroke={finalColor} strokeWidth={strokeWidth} strokeLinecap="round" className="checkmark-tick" style={{ animationDelay: '0.15s' }} />
                </>
            )}
        </svg>
    );
}

function ChecklistOverlay({ kind }) {
    if (kind === 'success') {
        return (
            <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
                <motion.div
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                    className="flex flex-col items-center gap-3 drop-shadow-2xl"
                >
                    <AnimatedStatusIcon 
                        type="success" 
                        size={100} 
                        circleFill="rgba(52,211,153,0.15)" 
                        strokeWidth={5} 
                        style={{ filter: 'drop-shadow(0px 8px 16px rgba(0,0,0,0.4))' }} 
                    />
                    <div className="text-white text-base font-semibold tracking-tight" style={{ letterSpacing: '-0.01em', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
                        Identitas Terverifikasi
                    </div>
                </motion.div>
            </div>
        );
    }
    if (kind === 'spoof' || kind === 'error') {
        return (
            <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
                <motion.div
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                    className="flex flex-col items-center gap-3 drop-shadow-2xl"
                >
                    <AnimatedStatusIcon 
                        type="error" 
                        size={100} 
                        circleFill="rgba(248,113,113,0.15)" 
                        strokeWidth={5} 
                        style={{ filter: 'drop-shadow(0px 8px 16px rgba(0,0,0,0.4))' }} 
                    />
                    <div className="text-white text-base font-semibold tracking-tight" style={{ color: '#ff9090', letterSpacing: '-0.01em', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
                        {kind === 'spoof' ? 'Spoofing Terdeteksi' : 'Tidak Dikenali'}
                    </div>
                </motion.div>
            </div>
        );
    }
    return null;
}

function ProgressiveLog({ log, visible }) {
    return (
        <div
            className="log-replacement-container"
            style={{ transition: 'opacity 300ms ease', opacity: visible ? 1 : 0 }}
        >
            <AnimatePresence mode="wait" initial={false}>
                {log && (
                    <motion.div
                        key={log.id}
                        initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
                        animate={{
                            opacity: log.fading ? 0.45 : 1,
                            y: 0,
                            filter: 'blur(0px)',
                            x: (log.kind === 'warn' || log.kind === 'err') ? [-4, 4, -2, 2, 0] : 0
                        }}
                        exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
                        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                        className={`log-entry ${log.kind ? `is-${log.kind}` : ''}`}
                    >
                        <span className="dot" />
                        <span>{log.text}</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function ResultPanel({ result, onReset, redirectIn }) {
    if (!result) return null;
    return (
        <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 22 }}
            transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col gap-3 mx-auto w-full max-w-[420px]"
        >
            <div className="flex gap-2 items-center">
                <button className="btn-ghost flex-1" onClick={onReset}>Pindai Ulang</button>
                {typeof redirectIn === 'number' && (
                    <div className="flex-1 flex items-center justify-center kbd-mono">
                        Mengalihkan {redirectIn}s
                    </div>
                )}
            </div>
        </motion.div>
    );
}

function HistoryTable({ rows, loading }) {
    if (loading) {
        return <div className="kbd-mono text-center py-6">Memuat...</div>;
    }
    if (!rows.length) {
        return <div className="kbd-mono text-center py-6">Database kosong</div>;
    }
    return (
        <div className="rounded-2xl overflow-hidden border border-white/[0.07]">
            <table className="w-full text-left text-sm">
                <thead className="bg-white/[0.03]">
                    <tr>
                        <th className="px-4 py-2.5 text-[10px] tracking-widest uppercase font-mono" style={{ color: 'rgba(235,235,245,0.4)' }}>User ID</th>
                        <th className="px-4 py-2.5 text-[10px] tracking-widest uppercase font-mono" style={{ color: 'rgba(235,235,245,0.4)' }}>Created</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((r) => (
                        <tr key={r.external_user_id + r.created_at} className="history-row">
                            <td className="px-4 py-2.5 font-mono text-xs" style={{ color: 'rgba(255,255,255,0.90)' }}>{r.external_user_id}</td>
                            <td className="px-4 py-2.5 font-mono text-[11px]" style={{ color: 'rgba(235,235,245,0.45)' }}>{new Date(r.created_at).toLocaleString()}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function IOSAlert({ config, onClose }) {
    if (!config) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="absolute inset-0 bg-black/40"
            />
            <motion.div
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="ios-alert-box relative z-10 w-[270px] flex flex-col overflow-hidden"
            >
                <div className="pt-[18px] pb-4 px-4 flex flex-col items-center gap-1">
                    <div className="text-[17px] font-semibold text-white text-center leading-tight tracking-[-0.022em]">
                        {config.title}
                    </div>
                    {config.message && (
                        <div className="text-[13px] text-[rgba(235,235,245,0.6)] text-center leading-[1.3] tracking-[-0.008em]">
                            {config.message}
                        </div>
                    )}
                </div>
                <div className="flex border-t border-[rgba(84,84,88,0.65)] h-[44px]">
                    {config.actions.map((action, i) => (
                        <button
                            key={i}
                            className={`flex-1 flex items-center justify-center text-[17px] active:bg-[rgba(255,255,255,0.1)] transition-colors
                                ${i > 0 ? 'border-l border-[rgba(84,84,88,0.65)]' : ''}
                                ${action.style === 'destructive' ? 'text-[#FF453A]' : 'text-[#0A84FF]'}
                                ${action.style === 'cancel' ? 'font-semibold' : 'font-normal'}
                            `}
                            style={{ letterSpacing: '-0.022em' }}
                            onClick={() => {
                                action.onClick();
                                onClose();
                            }}
                        >
                            {action.label}
                        </button>
                    ))}
                </div>
            </motion.div>
        </div>
    );
}

function PreviewModal({ open, base64Data, onRetake, onSubmit }) {
    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    className="fixed inset-0 z-[80] flex items-center justify-center p-6"
                    style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(16px)' }}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                >
                    <motion.div
                        className="glass-strong flex flex-col w-full max-w-[340px] overflow-hidden"
                        style={{ borderRadius: 28 }}
                        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                        transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                    >
                        <div className="p-6 flex flex-col items-center gap-3">
                            <div className="text-white text-[17px] font-semibold tracking-tight">Preview Gambar</div>
                            <div className="text-white/60 text-[13px] text-center leading-[1.4]">
                                Ini adalah payload mentah aktual yang akan diverifikasi oleh AI.
                            </div>
                            <div className="relative w-[200px] h-[200px] rounded-2xl overflow-hidden border border-white/10 mt-3 shadow-2xl flex items-center justify-center bg-black/50">
                                {base64Data ? (
                                    <img src={`data:image/jpeg;base64,${base64Data}`} className="w-full h-full object-cover" alt="Captured payload" />
                                ) : (
                                    <div className="gate-spinner" />
                                )}
                            </div>
                        </div>
                        <div className="flex border-t border-[rgba(255,255,255,0.08)]">
                            <button className="flex-1 py-[18px] text-[15px] text-white/70 hover:bg-white/5 active:bg-white/10 transition-colors font-medium" onClick={onRetake}>Ambil Ulang</button>
                            <div className="w-[1px] bg-[rgba(255,255,255,0.08)]" />
                            <button className="flex-1 py-[18px] text-[15px] text-[#0A84FF] hover:bg-white/5 active:bg-white/10 transition-colors font-semibold tracking-tight" onClick={onSubmit}>Kirim ke Server</button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

function AnalysisDrawer({ open, onClose, result }) {
    if (!result || !result.detail || !result.summary) return null;

    const classMapping = [
        { key: 'realperson', label: 'Real Person', color: '#10b981' },
        { key: 'fake_mask', label: 'Mask', color: '#f43f5e' },
        { key: 'fake_mannequin', label: 'Mannequin', color: '#f59e0b' },
        { key: 'fake_papercut', label: 'Paper Cut', color: '#3b82f6' },
        { key: 'fake_printed', label: 'Printed', color: '#8b5cf6' },
        { key: 'fake_screen', label: 'Screen', color: '#f97316' },
    ];

    return (
        <>
            <AnimatePresence>
                {open && (
                    <motion.div
                        key="scrim-analysis"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.22 }}
                        onClick={onClose}
                        className="fixed inset-0 z-50"
                        style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
                    />
                )}
            </AnimatePresence>
            <AnimatePresence>
                {open && (
                    <motion.div
                        key="drawer-analysis"
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', stiffness: 310, damping: 34, mass: 0.75 }}
                        className="glass-strong config-drawer fixed bottom-0 z-[60] flex flex-col"
                        style={{ borderRadius: '24px 24px 0 0', maxHeight: '88vh' }}
                    >
                        <div className="drawer-handle" />
                        <div className="px-6 pt-1 pb-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(84,84,88,0.45)' }}>
                            <div className="flex items-center gap-2.5">
                                <div style={{ color: 'rgba(235,235,245,0.75)' }}>
                                    <FaceIDGlyph size={20} />
                                </div>
                                <div>
                                    <div className="face-title text-[15px]">Liveness Analysis</div>
                                    <div className="kbd-mono" style={{ fontSize: 10, marginTop: 1 }}>Rincian Kategori Spoofing</div>
                                </div>
                            </div>
                            <button className="icon-btn" onClick={onClose}><CloseIcon /></button>
                        </div>

                        <div className="overflow-y-auto px-6 py-6 flex flex-col gap-8">

                            <section className="flex flex-col gap-3">
                                <div className="text-[11px] font-mono font-bold uppercase tracking-[0.15em] border-b border-[rgba(255,255,255,0.1)] pb-2 flex items-center justify-between" style={{ color: '#0ea5e9' }}>
                                    <span>[ Ringkasan ] Aggregat</span>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <RadialChartCDN
                                        label="Live (Wajah Asli)"
                                        value={result.summary.live || 0}
                                        color="#10b981"
                                    />
                                    <RadialChartCDN
                                        label="Spoof (Serangan)"
                                        value={result.summary.spoof || 0}
                                        color="#f43f5e"
                                    />
                                </div>
                            </section>

                            <section className="flex flex-col gap-3">
                                <div className="text-[11px] font-mono font-bold uppercase tracking-[0.15em] border-b border-[rgba(255,255,255,0.1)] pb-2 flex items-center justify-between" style={{ color: '#0ea5e9' }}>
                                    <span>[ Distribusi ] 6 Kelas</span>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    {classMapping.map(cls => (
                                        <RadialChartCDN
                                            key={cls.key}
                                            label={cls.label}
                                            value={result.detail[cls.key] || 0}
                                            color={cls.color}
                                        />
                                    ))}
                                </div>
                            </section>

                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

function ConfigDrawer({ open, onClose, currentConfig, onApply, mode, result, onOpenAnalysis }) {

    const [draft, setDraft] = useState({ userId: '', fas: true, requirePose: true, showPreview: false });

    const [purgeId, setPurgeId] = useState('');
    const [history, setHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [alertConfig, setAlertConfig] = useState(null);

    const hasChanges = currentConfig && (
        draft.userId !== currentConfig.userId ||
        draft.fas !== currentConfig.fas ||
        draft.requirePose !== currentConfig.requirePose ||
        draft.showPreview !== currentConfig.showPreview
    );

    useEffect(() => {
        if (currentConfig) {
            setDraft({
                userId: currentConfig.userId,
                fas: currentConfig.fas,
                requirePose: currentConfig.requirePose,
                showPreview: currentConfig.showPreview
            });
        }
    }, [currentConfig?.userId, currentConfig?.fas, currentConfig?.requirePose, currentConfig?.showPreview, open]);

    const loadHistory = useCallback(async () => {
        setHistoryLoading(true);
        const res = await apiClient.history();
        setHistoryLoading(false);
        if (res.ok && res.status === 200) {
            setHistory(res.data?.profiles || []);
        } else {
            setHistory([]);
            notify(`Gagal memuat riwayat (${res.status})`, 'error');
        }
    }, []);

    useEffect(() => { if (open) loadHistory(); }, [open, loadHistory]);

    const handlePurgeOne = async () => {
        const id = purgeId.trim();
        if (!id) { notify('Masukkan User ID', 'warning'); return; }
        const res = await apiClient.purgeUser(id);
        if (res.ok && res.status === 204) {
            notify(`User ${id} dihapus`, 'success');
            setPurgeId('');
            loadHistory();
        } else {
            notify(`Gagal: ${res.data?.error?.message || 'Error tidak diketahui'}`, 'error');
        }
    };

    const handlePurgeAll = async () => {
        const confirmed = await new Promise((resolve) => {
            setAlertConfig({
                title: "Hapus Semua Data",
                message: "Tindakan ini tidak dapat dibatalkan. Semua data wajah akan dihapus dari sistem.",
                actions: [
                    { label: "Batal", onClick: () => resolve(false), style: 'cancel' },
                    { label: "Hapus", onClick: () => resolve(true), style: 'destructive' }
                ]
            });
        });
        if (!confirmed) return;

        const res = await apiClient.purgeAll();
        if (res.ok && res.status === 200) {
            notify(`Berhasil menghapus ${res.data?.purged_count || 0} data`, 'success');
            loadHistory();
        } else {
            notify(`Gagal: ${res.data?.error?.message || 'Error'}`, 'error');
        }
    };

    const handleApply = () => {
        const trimmedId = draft.userId.trim();
        if (!trimmedId) { notify('User ID tidak boleh kosong', 'warning'); return; }
        onApply({
            userId: trimmedId,
            fas: draft.fas,
            requirePose: draft.requirePose,
            showPreview: draft.showPreview
        });
    };

    return (
        <>
            <AnimatePresence>
                {open && (
                    <motion.div
                        key="scrim"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.22 }}
                        onClick={onClose}
                        className="fixed inset-0 z-40"
                        style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
                    />
                )}
            </AnimatePresence>
            <AnimatePresence>
                {open && (
                    <motion.div
                        key="drawer"
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', stiffness: 310, damping: 34, mass: 0.75 }}
                        className="glass-strong config-drawer fixed bottom-0 z-50 flex flex-col"
                        style={{ borderRadius: '24px 24px 0 0', maxHeight: '88vh' }}
                    >
                        <div className="drawer-handle" />
                        <div className="px-6 pt-1 pb-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(84,84,88,0.45)' }}>
                            <div className="flex items-center gap-2.5">
                                <div style={{ color: 'rgba(235,235,245,0.75)' }}>
                                    <FaceIDGlyph size={20} />
                                </div>
                                <div>
                                    <div className="face-title text-[15px]">Pengaturan</div>
                                    <div className="kbd-mono" style={{ fontSize: 10, marginTop: 1 }}>Spectre Face ID</div>
                                </div>
                            </div>
                            <button className="icon-btn" onClick={onClose}><CloseIcon /></button>
                        </div>

                        <div className="overflow-y-auto px-6 py-5 flex flex-col gap-6 pb-24">

                            {result && result.detail && (
                                <section className="flex flex-col gap-2">
                                    <div className="section-label">Hasil Analisis Terakhir</div>
                                    <button
                                        className="btn-primary flex items-center justify-center gap-2 w-full !bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] hover:!bg-[rgba(255,255,255,0.1)] transition-colors"
                                        onClick={() => {
                                            onClose();
                                            onOpenAnalysis();
                                        }}
                                    >
                                        Buka Rincian Kategorial <ArrowRightIcon size={16} />
                                    </button>
                                </section>
                            )}

                            <section className="flex flex-col gap-2">
                                <div className="section-label">Active User</div>
                                <input
                                    type="text"
                                    value={draft.userId}
                                    onChange={(e) => setDraft({ ...draft, userId: e.target.value })}
                                    placeholder="external_user_id"
                                    className="input-mono"
                                />
                            </section>

                            <section className="flex flex-col gap-2">
                                <div className="section-label">Mode Active (Otomatis)</div>
                                <div className="flex items-center gap-3 p-3 rounded-xl" style={{ border: '1px solid rgba(84,84,88,0.35)', background: 'rgba(255,255,255,0.02)' }}>
                                    <div className={`mode-indicator-dot ${mode === Config.MODE_REGISTER ? 'is-register' : 'is-verify'}`} />
                                    <div>
                                        <div className="text-sm font-semibold" style={{ color: '#fff', letterSpacing: '-0.01em' }}>
                                            {mode === Config.MODE_REGISTER ? 'Enrollment' : 'Verification'}
                                        </div>
                                        <div className="kbd-mono" style={{ marginTop: 1, fontSize: 10 }}>Ditentukan otomatis berdasarkan User ID</div>
                                    </div>
                                </div>
                            </section>

                            <section className="flex flex-col gap-2">
                                <div className="section-label">Security Layer & Developer Flow</div>
                                <div className="flex flex-col gap-3">
                                    <div className="flex items-center justify-between p-4 rounded-2xl" style={{ border: '1px solid rgba(84,84,88,0.35)', background: 'rgba(255,255,255,0.02)' }}>
                                        <div>
                                            <div className="text-sm font-semibold" style={{ color: '#fff', letterSpacing: '-0.01em' }}>FAS Protection</div>
                                            <div className="kbd-mono" style={{ marginTop: 2 }}>Anti-spoofing analysis</div>
                                        </div>
                                        <div className={`toggle-switch ${draft.fas ? 'on' : ''}`} onClick={() => setDraft(prev => ({ ...prev, fas: !prev.fas }))} />
                                    </div>

                                    <div className="flex items-center justify-between p-4 rounded-2xl" style={{ border: '1px solid rgba(84,84,88,0.35)', background: 'rgba(255,255,255,0.02)' }}>
                                        <div>
                                            <div className="text-sm font-semibold" style={{ color: '#fff', letterSpacing: '-0.01em' }}>Wajibkan Putar Kepala</div>
                                            <div className="kbd-mono" style={{ marginTop: 2 }}>Aktifkan Liveness Pose</div>
                                        </div>
                                        <div className={`toggle-switch ${draft.requirePose ? 'on' : ''}`} onClick={() => setDraft(prev => ({ ...prev, requirePose: !prev.requirePose }))} />
                                    </div>

                                    <div className="flex items-center justify-between p-4 rounded-2xl" style={{ border: '1px solid rgba(84,84,88,0.35)', background: 'rgba(255,255,255,0.02)' }}>
                                        <div>
                                            <div className="text-sm font-semibold" style={{ color: '#fff', letterSpacing: '-0.01em' }}>Tampilkan Preview Gambar</div>
                                            <div className="kbd-mono" style={{ marginTop: 2 }}>Verifikasi payload sebelum API</div>
                                        </div>
                                        <div className={`toggle-switch ${draft.showPreview ? 'on' : ''}`} onClick={() => setDraft(prev => ({ ...prev, showPreview: !prev.showPreview }))} />
                                    </div>
                                </div>
                            </section>

                            <AnimatePresence>
                                {hasChanges && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="pt-2"
                                    >
                                        <button
                                            className="btn-primary w-full"
                                            onClick={handleApply}
                                        >
                                            Terapkan Perubahan
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <section className="flex flex-col gap-2 border-t border-[rgba(255,255,255,0.1)] pt-6 mt-2">
                                <div className="section-label">Database History</div>
                                <div className="max-h-56 overflow-y-auto">
                                    <HistoryTable rows={history} loading={historyLoading} />
                                </div>
                                <div className="flex gap-2 mt-1">
                                    <input
                                        type="text"
                                        placeholder="User ID untuk dihapus"
                                        value={purgeId}
                                        onChange={(e) => setPurgeId(e.target.value)}
                                        className="input-mono flex-1"
                                    />
                                    <button className="btn-danger-soft" onClick={handlePurgeOne}>Hapus</button>
                                </div>
                                <button className="btn-danger-soft w-full" onClick={handlePurgeAll}>Purge Semua Data</button>
                            </section>

                            <div className="kbd-mono text-center pb-4" style={{ opacity: 0.45, fontSize: 10 }}>{Config.API_URL}</div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {alertConfig && (
                    <IOSAlert config={alertConfig} onClose={() => setAlertConfig(null)} />
                )}
            </AnimatePresence>
        </>
    );
}

function IdentityGate({ onResolved }) {
    const [value, setValue] = useState('');
    const [gatePhase, setGatePhase] = useState('form');
    const [submitting, setSubmitting] = useState(false);
    const inputRef = useRef(null);
    const abortRef = useRef(null);

    useEffect(() => { if (gatePhase === 'form') inputRef.current?.focus(); }, [gatePhase]);

    useEffect(() => () => { if (abortRef.current) abortRef.current.abort = true; }, []);

    const submit = async () => {
        const trimmed = value.trim();
        if (!trimmed) { notify('Masukkan External User ID', 'warning'); return; }
        if (submitting) return;
        setSubmitting(true);

        if (abortRef.current) abortRef.current.abort = true;
        const ticket = { abort: false };
        abortRef.current = ticket;

        setGatePhase('loading');

        try {
            const res = await apiClient.lookupUser(trimmed);
            if (ticket.abort) return;

            if (res.exists) {
                setGatePhase('found');
                notify('Pengguna ditemukan', 'success');
                setTimeout(() => {
                    if (!ticket.abort) onResolved(trimmed, Config.MODE_AUTHENTICATE);
                }, 1800);
            } else {
                setGatePhase('not-found');
                notify('Pengguna baru — memulai pendaftaran', 'info');
                setTimeout(() => {
                    if (!ticket.abort) onResolved(trimmed, Config.MODE_REGISTER);
                }, 1200);
            }
        } catch (err) {
            if (ticket.abort) return;
            notify('Gagal memeriksa pengguna', 'error');
            setGatePhase('form');
            setSubmitting(false);
        }
    };

    return (
        <div className="app-shell flex items-center justify-center px-6" style={{ minHeight: '100dvh' }}>
            <div className="bg-aura" />
            <div className="bg-gradient-bottom" />

            <AnimatePresence mode="wait">
                {gatePhase === 'form' && (
                    <motion.div
                        key="gate-form"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12, filter: 'blur(8px)' }}
                        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                        className="glass-strong flex flex-col w-full z-10"
                        style={{ maxWidth: 390, borderRadius: 28, padding: '32px 28px 28px', gap: 0 }}
                    >
                        <div className="flex flex-col items-center" style={{ gap: 10, marginBottom: 32 }}>
                            <div className="gate-icon-ring">
                                <div style={{ color: 'rgba(255,255,255,0.80)' }}>
                                    <FaceIDGlyph size={34} />
                                </div>
                            </div>
                            <div style={{ marginTop: 8 }}>
                                <div className="face-title text-center" style={{ fontSize: 22, marginBottom: 6 }}>Spectre</div>
                                <div className="face-helper text-center" style={{ fontSize: 14, maxWidth: 280, margin: '0 auto', lineHeight: 1.5 }}>
                                    Masukkan External User ID untuk memulai pendaftaran atau verifikasi
                                </div>
                            </div>
                        </div>

                        <div className="gate-separator" style={{ marginBottom: 24 }} />

                        <div className="flex flex-col" style={{ gap: 8, marginBottom: 16 }}>
                            <div className="section-label">External User ID</div>
                            <input
                                ref={inputRef}
                                type="text"
                                value={value}
                                onChange={(e) => setValue(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && submit()}
                                placeholder="cth. demo_user_1"
                                className="input-mono"
                            />
                        </div>

                        <button
                            className="btn-primary inline-flex items-center justify-center gap-2"
                            onClick={submit}
                            style={{ marginBottom: 16 }}
                        >
                            Lanjutkan <ArrowRightIcon />
                        </button>

                        <div className="kbd-mono text-center" style={{ opacity: 0.4, fontSize: 11 }}>
                            Sistem akan menentukan mode secara otomatis
                        </div>
                    </motion.div>
                )}

                {gatePhase === 'loading' && (
                    <motion.div
                        key="gate-loading"
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.96, filter: 'blur(6px)' }}
                        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                        className="flex flex-col items-center z-10"
                        style={{ gap: 24 }}
                    >
                        <div className="gate-spinner" />
                        <div className="flex flex-col items-center" style={{ gap: 6 }}>
                            <div className="face-title text-center" style={{ fontSize: 16 }}>Memverifikasi</div>
                            <div className="face-helper text-center" style={{ fontSize: 13, opacity: 0.7 }}>
                                Memeriksa status pengguna...
                            </div>
                        </div>
                    </motion.div>
                )}

                {gatePhase === 'found' && (
                    <motion.div
                        key="gate-found"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.04, filter: 'blur(10px)' }}
                        transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
                        className="flex flex-col items-center z-10"
                        style={{ gap: 16 }}
                    >
                        <AnimatedStatusIcon 
                            type="success" 
                            size={82} 
                            color="#ffffff"
                            ringColor="rgba(255,255,255,0.90)"
                        />
                        <div className="face-title text-center" style={{ fontSize: 17 }}>Pengguna Ditemukan</div>
                        <div className="face-helper text-center" style={{ fontSize: 13, opacity: 0.7 }}>
                            Melanjutkan ke verifikasi wajah
                        </div>
                    </motion.div>
                )}

                {gatePhase === 'not-found' && (
                    <motion.div
                        key="gate-notfound"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.04, filter: 'blur(10px)' }}
                        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                        className="flex flex-col items-center z-10"
                        style={{ gap: 16 }}
                    >
                        <div className="gate-icon-ring">
                            <div style={{ color: 'rgba(255,255,255,0.80)' }}>
                                <FaceIDGlyph size={34} />
                            </div>
                        </div>
                        <div className="face-title text-center" style={{ fontSize: 17 }}>Pengguna Baru</div>
                        <div className="face-helper text-center" style={{ fontSize: 13, opacity: 0.7 }}>
                            Memulai pendaftaran wajah
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function hexToRgb(hex) {
    const bigint = parseInt(hex.replace('#', ''), 16);
    return {
        r: (bigint >> 16) & 255,
        g: (bigint >> 8) & 255,
        b: bigint & 255
    };
}

function AuraRing({ size = 450, config }) {
    const containerRef = useRef(null);
    const canvasRef = useRef(null);
    
    const [eyeState, setEyeState] = useState({ x: 0, y: 0, yaw: 0, pitch: 0 });
    const [internalExpr, setInternalExpr] = useState(config.expression);
    const [glitchActive, setGlitchActive] = useState(false); 
    const bouncePhysicsRef = useRef({ value: 0, velocity: 0 });
    const isIndicatorRef = useRef(false);

    const color1Rgb = hexToRgb(config.layers[0].hex);
    const color2Rgb = hexToRgb(config.layers[1].hex);
    const auraColor1 = `${color1Rgb.r}, ${color1Rgb.g}, ${color1Rgb.b}`;
    const auraColor2 = `${color2Rgb.r}, ${color2Rgb.g}, ${color2Rgb.b}`;

    useEffect(() => {
        isIndicatorRef.current = internalExpr.endsWith('_static') || internalExpr.endsWith('_anticipate');
    }, [internalExpr]);

    useEffect(() => {
        let timeout1, timeout2, timeout3, timeout4, timeout5, intervalShuffle;
        let isCancelled = false;

        const runIndicatorSequence = (type) => {
            if (isCancelled) return;

            setInternalExpr(`${type}_anticipate`);

            timeout1 = setTimeout(() => {
                if (isCancelled) return;
                
                setInternalExpr(`${type}_static`);
                bouncePhysicsRef.current.velocity = -0.7;

                timeout2 = setTimeout(() => {
                    if (isCancelled) return;
                    
                    setGlitchActive(true); 
                    bouncePhysicsRef.current.velocity = -0.15;
                    
                    timeout4 = setTimeout(() => {
                        if (isCancelled) return;
                        
                        setInternalExpr('normal');
                        bouncePhysicsRef.current.velocity = -0.45;
                        
                        timeout5 = setTimeout(() => { 
                            if (!isCancelled) setGlitchActive(false); 
                        }, 350); 

                        timeout3 = setTimeout(() => {
                            if (isCancelled) return;
                            runIndicatorSequence(type);
                        }, 5000); 
                    }, 150);
                }, 3000);
            }, 600);
        };

        if (config.expression === 'berhasil' || config.expression === 'gagal') {
            runIndicatorSequence(config.expression);
        } else if (config.expression === 'shuffle') {
            const expressions = ['normal', 'senang', 'sedih', 'marah', 'kaget', 'ngantuk', 'lengkungan'];
            setInternalExpr(expressions[Math.floor(Math.random() * expressions.length)]);
            intervalShuffle = setInterval(() => {
                setInternalExpr(prev => {
                    let next;
                    do { next = expressions[Math.floor(Math.random() * expressions.length)]; } while (next === prev); 
                    return next;
                });
            }, 3500); 
        } else {
            setInternalExpr(config.expression);
            setGlitchActive(false);
        }

        return () => {
            isCancelled = true;
            clearTimeout(timeout1);
            clearTimeout(timeout2);
            clearTimeout(timeout3);
            clearTimeout(timeout4);
            clearTimeout(timeout5);
            clearInterval(intervalShuffle);
        };
    }, [config.expression]);

    useEffect(() => {
        let timer;
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
                    const newYaw = newX * 2.2; 
                    const newPitch = newY * -2.2; 
                    setEyeState({ x: newX, y: newY, yaw: newYaw, pitch: newPitch });
                }
                bouncePhysicsRef.current.velocity -= (0.12 + Math.random() * 0.08);
            }
            timer = setTimeout(moveEyes, 1200 + Math.random() * 2000);
        };
        
        timer = setTimeout(moveEyes, 1000);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let animationFrameId;
        let time = 0;

        const dpr = window.devicePixelRatio || 1;
        const paddingMultiplier = 1.2; 
        const actualSize = size * paddingMultiplier;

        canvas.width = actualSize * dpr;
        canvas.height = actualSize * dpr;
        canvas.style.width = `${size}px`;
        canvas.style.height = `${size}px`;
        ctx.scale(dpr, dpr);

        const cx = actualSize / 2;
        const cy = actualSize / 2;

        const render = () => {
            time += 1 * config.globalSpeed;

            const stiffness = 0.08; 
            const damping = 0.75;   
            bouncePhysicsRef.current.velocity += (0 - bouncePhysicsRef.current.value) * stiffness;
            bouncePhysicsRef.current.velocity *= damping;
            bouncePhysicsRef.current.value += bouncePhysicsRef.current.velocity;
            
            let ex = 0; 
            let ey = 0; 
            let esx = 1; 
            let esy = 1; 
            let baseBounce = bouncePhysicsRef.current.value;
            let eyeBreathingScale = 1; 

            const isAnticipate = internalExpr.endsWith('_anticipate');
            const isStatic = internalExpr.endsWith('_static');

            if (internalExpr === 'sedih') {
                ex = Math.sin(time * 0.03) * 6; 
                esy = 1 - (Math.abs(Math.sin(time * 0.02)) * 0.03); 
                esx = 1 + (Math.abs(Math.sin(time * 0.02)) * 0.015);
            } else if (internalExpr === 'senang') {
                ey = Math.abs(Math.sin(time * 0.06)) * -25;
                esy = 1 + Math.sin(time * 0.12) * 0.04; 
            } else if (internalExpr === 'marah') {
                ex = Math.sin(time * 0.8) * 4; 
                ey = Math.cos(time * 0.7) * 2;
                esy = 0.96; esx = 1.04;
            } else if (internalExpr === 'kaget') {
                esy = 1.15 + Math.sin(time * 0.05) * 0.015; 
                esx = 0.85; ey = -20 + Math.sin(time * 0.05) * 3;
            } else if (internalExpr === 'ngantuk') {
                esy = 0.85 - (Math.abs(Math.sin(time * 0.01)) * 0.04); 
                esx = 1.15 + (Math.abs(Math.sin(time * 0.01)) * 0.04); ey = 15; 
            } else if (isAnticipate) {
                ey = 18; esy = 0.82; esx = 1.18;
            } else if (isStatic) {
                ey = 0; esy = 1; esx = 1;
            }

            if (config.expression === 'shuffle') {
                const natureWobbleX = Math.sin(time * 0.02) * 0.06;
                const natureWobbleY = Math.cos(time * 0.015) * 0.06;
                esx += natureWobbleX; esy += natureWobbleY;
            }

            esx += baseBounce * 0.3;
            esy -= baseBounce * 0.3;
            ey += baseBounce * 45;

            let currentVelocity = Math.abs(bouncePhysicsRef.current.velocity);
            let motionBlur = Math.min(currentVelocity * 18, 5); 

            if (containerRef.current) {
                containerRef.current.style.setProperty('--ex', `${ex}px`);
                containerRef.current.style.setProperty('--ey', `${ey}px`);
                containerRef.current.style.setProperty('--esx', esx.toFixed(4));
                containerRef.current.style.setProperty('--esy', esy.toFixed(4));
                containerRef.current.style.setProperty('--ebs', eyeBreathingScale.toFixed(4)); 
                containerRef.current.style.setProperty('--mb', `${motionBlur.toFixed(2)}px`); 
            }

            ctx.clearRect(0, 0, actualSize, actualSize);
            ctx.globalCompositeOperation = 'lighter';
            const baseRadius = actualSize * config.baseRadiusScale;

            config.layers.forEach((layer) => {
                const rgb = hexToRgb(layer.hex);
                ctx.beginPath();
                for (let i = 0; i <= 360; i++) {
                    const angle = (i * Math.PI) / 180;
                    const noise1 = Math.sin(layer.w1 * angle + time * layer.s1);
                    const noise2 = Math.cos(layer.w2 * angle - time * layer.s2);
                    const r = baseRadius + (layer.amp1 * noise1) + (layer.amp2 * noise2);
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
            });

            animationFrameId = requestAnimationFrame(render);
        };

        render();

        return () => cancelAnimationFrame(animationFrameId);
    }, [size, config, internalExpr]);

    const getEyeProps = (side) => {
        const isLeft = side === 'left';
        
        let rotation = '0deg';
        let bg = '#fff';
        let bw = '0px';
        let bc = 'transparent';
        let br = '50px';
        
        let x = isLeft ? '-10%' : '10%'; 
        let y = '0%'; 
        
        let scale = 'scale(1)';
        let clipPath = 'none';
        let w = '7.5%';
        let h = '20%';
        let opacity = '1';
        let transitionStr = 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)';

        switch(internalExpr) {
            case 'senang':
                bg = '#fff'; br = '0'; 
                clipPath = 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)'; 
                scale = 'scale(1.1)'; w = '16%'; h = '16%';
                x = isLeft ? '-12%' : '12%'; y = '-2%'; 
                break;
            case 'lengkungan':
                bg = 'transparent'; bw = '0 0 8px 0'; bc = '#fff'; br = '50%';
                y = '-6%'; w = '10%'; h = '10%'; scale = 'scale(1.2, 0.9)'; 
                break;
            case 'sedih':
                rotation = isLeft ? '-20deg' : '20deg'; 
                scale = 'scale(0.8, 0.35)'; y = '10%'; 
                break;
            case 'marah':
                rotation = isLeft ? '30deg' : '-30deg'; 
                scale = 'scale(0.9, 0.4)'; y = '2%'; 
                break;
            case 'kaget':
                bg = 'transparent'; bw = '4px'; bc = '#fff'; br = '50%'; 
                w = '12%'; h = '12%'; scale = 'scale(1.2, 1.2)';
                x = isLeft ? '-12%' : '12%'; y = '-8%'; 
                break;
            case 'ngantuk':
                rotation = isLeft ? '-3deg' : '3deg'; 
                scale = 'scale(1.3, 0.1)'; y = '10%'; 
                break;
                
            case 'berhasil_anticipate':
            case 'gagal_anticipate':
                x = '0%'; y = '0%'; 
                rotation = isLeft ? '360deg' : '-360deg'; 
                scale = 'scale(0.5)'; w = '12%'; h = '12%'; br = '50%';
                transitionStr = 'all 0.6s cubic-bezier(0.5, 0, 0.2, 1)'; 
                break;
            case 'berhasil_static':
                if (isLeft) {
                    scale = 'scale(0)'; x = '0%'; opacity = '0'; rotation = '360deg';
                } else {
                    bg = '#fff'; br = '0';
                    clipPath = 'polygon(14% 44%, 0 65%, 50% 100%, 100% 16%, 80% 0%, 43% 62%)';
                    scale = 'scale(calc(1.5 * var(--ebs, 1)))'; w = '22%'; h = '22%';
                    x = '0%'; y = '0%'; rotation = '720deg'; 
                }
                transitionStr = 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)';
                break;
            case 'gagal_static':
                if (isLeft) {
                    scale = 'scale(0)'; x = '0%'; opacity = '0'; rotation = '-360deg';
                } else {
                    bg = '#fff'; br = '0';
                    clipPath = 'polygon(20% 0%, 0% 20%, 30% 50%, 0% 80%, 20% 100%, 50% 70%, 80% 100%, 100% 80%, 70% 50%, 100% 20%, 80% 0%, 50% 30%)';
                    scale = 'scale(calc(1.4 * var(--ebs, 1)))'; w = '22%'; h = '22%';
                    x = '0%'; y = '0%'; rotation = '-720deg'; 
                }
                transitionStr = 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)';
                break;
            default:
                break;
        }

        return { rotation, bg, bw, bc, br, x, y, scale, clipPath, w, h, opacity, transitionStr };
    };

    const isIndicatorStatic = internalExpr.endsWith('_static') || internalExpr.endsWith('_anticipate');
    const effX = isIndicatorStatic ? 0 : eyeState.x;
    const effY = isIndicatorStatic ? 0 : eyeState.y;
    const effPitch = isIndicatorStatic ? 0 : eyeState.pitch;
    const effYaw = isIndicatorStatic ? 0 : eyeState.yaw;
    const effZ = isIndicatorStatic ? 0 : -6;

    return (
        <div ref={containerRef} style={{ 
            position: 'relative', 
            width: size, 
            height: size,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            '--ex': '0px', 
            '--ey': '0px', 
            '--esx': '1', 
            '--esy': '1', 
            transform: `
                translate(var(--ex), var(--ey)) 
                scale(var(--esx), var(--esy))
            `,
            transition: 'transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)' 
        }}>
            <style>{`
                @keyframes eye-blink {
                    0%, 4%, 100% { transform: scaleY(1); }
                    2% { transform: scaleY(0.1); }
                }
                @keyframes cyber-glitch-1 {
                    0% { translate: 0px 0px; clip-path: inset(20% 0 80% 0); scale: 1.2; filter: blur(2px); }
                    20% { translate: -12px 6px; clip-path: inset(60% 0 10% 0); scale: 1.1; filter: blur(5px); }
                    40% { translate: 12px -6px; clip-path: inset(40% 0 50% 0); scale: 1.3; filter: blur(1px); }
                    60% { translate: -16px -4px; clip-path: inset(80% 0 5% 0); scale: 1.1; filter: blur(4px); }
                    80% { translate: 8px 12px; clip-path: inset(10% 0 70% 0); scale: 1.4; filter: blur(0px); }
                    100% { translate: -8px -8px; clip-path: inset(30% 0 50% 0); scale: 1.2; filter: blur(3px); }
                }
                @keyframes cyber-glitch-2 {
                    0% { translate: 0px 0px; clip-path: inset(10% 0 60% 0); scale: 1.1; filter: blur(4px); }
                    20% { translate: 12px -6px; clip-path: inset(80% 0 5% 0); scale: 1.4; filter: blur(0px); }
                    40% { translate: -12px 6px; clip-path: inset(30% 0 20% 0); scale: 1.2; filter: blur(5px); }
                    60% { translate: 16px 4px; clip-path: inset(70% 0 10% 0); scale: 1.1; filter: blur(1px); }
                    80% { translate: -8px -12px; clip-path: inset(5% 0 80% 0); scale: 1.3; filter: blur(3px); }
                    100% { translate: 8px 8px; clip-path: inset(50% 0 30% 0); scale: 1.2; filter: blur(2px); }
                }
                @keyframes cyber-glitch-main {
                    0% { translate: 0px 0px; filter: drop-shadow(0 0 15px rgba(255,255,255,1)) blur(3px); scale: 1.05; }
                    25% { translate: -4px 2px; filter: drop-shadow(0 0 25px rgba(255,255,255,1)) blur(6px); scale: 1.1; }
                    50% { translate: 4px -2px; filter: drop-shadow(0 0 10px rgba(255,255,255,1)) blur(2px); scale: 1.05; }
                    75% { translate: -4px -2px; filter: drop-shadow(0 0 30px rgba(255,255,255,1)) blur(7px); scale: 1.15; }
                    100% { translate: 4px 2px; filter: drop-shadow(0 0 15px rgba(255,255,255,1)) blur(3px); scale: 1.1; }
                }
            `}</style>
            
            <div style={{
                position: 'absolute',
                width: size * config.baseRadiusScale * 2,
                height: size * config.baseRadiusScale * 2,
                borderRadius: '50%',
                backgroundColor: 'rgba(12, 10, 20, 0.7)',
                filter: 'blur(var(--mb, 0px))',
                boxShadow: `
                    inset ${-15 + effX * 1.8}px ${-15 + effY * 1.8}px 40px rgba(0, 0, 0, 0.95),
                    inset ${-25 + effX * 2.2}px ${-25 + effY * 2.2}px 25px rgba(0, 0, 0, 0.8),
                    inset ${15 - effX * 1.5}px ${15 - effY * 1.5}px 35px rgba(${auraColor2}, 0.4),
                    inset 0 0 55px rgba(${auraColor1}, 0.5),
                    0 0 30px rgba(${auraColor1}, 0.3)
                `,
                backdropFilter: 'blur(8px)', 
                transition: 'box-shadow 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
                zIndex: 5, 
            }}>
                <div style={{
                    position: 'absolute',
                    top: '12%',
                    left: '18%',
                    width: '45%',
                    height: '28%',
                    background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 65%)',
                    borderRadius: '50%',
                    transform: `rotate(-40deg) translate(${effX * 0.2}px, ${effY * 0.2}px)`,
                    transition: 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    pointerEvents: 'none'
                }} />
            </div>

            <canvas ref={canvasRef} className="pointer-events-none" style={{ display: 'block', filter: 'blur(1px) saturate(1.2)', position: 'absolute', zIndex: 10 }} />

            <div style={{
                position: 'absolute',
                inset: 0,
                zIndex: 20,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transform: `
                    perspective(350px) 
                    translate(${effX}%, ${effY}%) 
                    rotateX(${effPitch}deg) 
                    rotateY(${effYaw}deg) 
                    rotateZ(${effZ}deg)
                `,
                transition: 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
                pointerEvents: 'none'
            }}>
                <div style={{
                    position: 'relative',
                    width: '100%',
                    height: '100%',
                    transform: `translate(calc(var(--ex) * 0.5), calc(var(--ey) * 0.3))`
                }}>
                    {['left', 'right'].map(side => {
                        const { rotation, bg, bw, bc, br, x, y, scale, clipPath, w, h, opacity, transitionStr } = getEyeProps(side);
                        return (
                            <div key={`main-${side}`} style={{
                                position: 'absolute', top: '50%', left: '50%',
                                width: w, height: h, marginLeft: x, marginTop: y, opacity: opacity,
                                transform: `translate(-50%, -50%) rotate(${rotation}) ${scale}`,
                                transition: transitionStr,
                                filter: glitchActive ? 'none' : 'blur(var(--mb, 0px)) drop-shadow(0 0 6px rgba(255,255,255,0.8))',
                                animation: glitchActive ? 'cyber-glitch-main 0.1s infinite' : 'none'
                            }}>
                                <div style={{
                                    width: '100%', height: '100%', backgroundColor: bg, borderRadius: br, borderWidth: bw, borderStyle: 'solid', borderColor: bc,
                                    clipPath: clipPath, transformOrigin: 'center 70%', transition: transitionStr,
                                    animation: (!isIndicatorStatic && !glitchActive) ? 'eye-blink 4s infinite' : 'none',
                                }} />
                            </div>
                        );
                    })}

                    {glitchActive && ['left', 'right'].map(side => {
                        const props = getEyeProps(side);
                        return (
                            <div key={`glitch1-${side}`} style={{
                                position: 'absolute', top: '50%', left: '50%',
                                width: props.w, height: props.h, marginLeft: props.x, marginTop: props.y, opacity: props.opacity,
                                transform: `translate(-50%, -50%) rotate(${props.rotation}) ${props.scale}`,
                                mixBlendMode: 'normal', 
                                animation: 'cyber-glitch-1 0.15s infinite linear alternate-reverse'
                            }}>
                                <div style={{
                                    width: '100%', height: '100%', backgroundColor: config.layers[1].hex, borderRadius: props.br, borderWidth: props.bw, borderStyle: 'solid', borderColor: props.bc,
                                    clipPath: props.clipPath, transformOrigin: 'center 70%', opacity: 1
                                }} />
                            </div>
                        );
                    })}

                    {glitchActive && ['left', 'right'].map(side => {
                        const props = getEyeProps(side);
                        return (
                            <div key={`glitch2-${side}`} style={{
                                position: 'absolute', top: '50%', left: '50%',
                                width: props.w, height: props.h, marginLeft: props.x, marginTop: props.y, opacity: props.opacity,
                                transform: `translate(-50%, -50%) rotate(${props.rotation}) ${props.scale}`,
                                mixBlendMode: 'normal', 
                                animation: 'cyber-glitch-2 0.2s infinite linear alternate'
                            }}>
                                <div style={{
                                    width: '100%', height: '100%', backgroundColor: config.layers[0].hex, borderRadius: props.br, borderWidth: props.bw, borderStyle: 'solid', borderColor: props.bc,
                                    clipPath: props.clipPath, transformOrigin: 'center 70%', opacity: 1
                                }} />
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

function ScannerView({ userId, mode, fas, requirePose, showPreview, onChangeUserId, onChangeMode, onToggleFas, onToggleRequirePose, onTogglePreview }) {
    const [phase, setPhaseState] = useState(PHASES.LOADING);
    const [activeSegments, setActiveSegments] = useState(new Set());
    const [revealedSegments, setRevealedSegments] = useState(0);
    const [currentLog, setCurrentLog] = useState(null);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [analysisOpen, setAnalysisOpen] = useState(false);
    const [result, setResult] = useState(null);
    const [redirectIn, setRedirectIn] = useState(null);
    const [isConfiguring, setIsConfiguring] = useState(false);
    const [draftCapture, setDraftCapture] = useState(null);

    const phaseRef = useRef(PHASES.LOADING);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const revealIntervalRef = useRef(null);
    const captureGuardRef = useRef(false);
    const redirectTimerRef = useRef(null);
    const captureTimerRef = useRef(null);
    const logIdRef = useRef(0);
    const logTimeoutRef = useRef(null);
    const requestEpochRef = useRef(0);
    const inflightRef = useRef(false);

    const [currentLandmarks, setCurrentLandmarks] = useState(null);
    const avatarControls = Motion.useAnimation();

    const scriptsLoaded = useScriptLoader(Config.MEDIAPIPE_SCRIPTS);
    const glitchOpacity = useGlitchOpacity(phase === PHASES.SCANNING || phase === PHASES.CAPTURING || phase === PHASES.PREVIEW || phase === PHASES.ANALYZING);
    const lum = useBrightness({ videoRef, enabled: phase === PHASES.SEARCHING || phase === PHASES.MORPHING || phase === PHASES.SCANNING });
    const { blurLevel, blurDelta } = useBlurMetrics({ videoRef, landmarks: currentLandmarks, enabled: phase === PHASES.SEARCHING || phase === PHASES.MORPHING || phase === PHASES.SCANNING || phase === PHASES.CAPTURING });

    const { iqaState, iqaMessage, instantFails } = useIQA({
        landmarks: currentLandmarks,
        lum,
        blurLevel,
        blurDelta,
        enabled: phase === PHASES.SEARCHING || phase === PHASES.MORPHING || phase === PHASES.SCANNING || phase === PHASES.CAPTURING,
        ignorePose: phase === PHASES.SCANNING || phase === PHASES.CAPTURING
    });
    
    const instantFailsRef = useRef(instantFails);
    const lastIqaLogRef = useRef({ text: '', kind: '' });
    const iqaStateRef = useRef(IQA.NO_FACE);

    useEffect(() => { iqaStateRef.current = iqaState; }, [iqaState]);
    useEffect(() => { instantFailsRef.current = instantFails; }, [instantFails]);

    const setPhase = useCallback((next) => {
        phaseRef.current = next;
        setPhaseState(next);
    }, []);

    const showLog = useCallback((text, kind) => {
        const id = ++logIdRef.current;
        setCurrentLog({ id, text, kind, fading: false });

        if (logTimeoutRef.current) {
            clearTimeout(logTimeoutRef.current.fade);
            clearTimeout(logTimeoutRef.current.remove);
            logTimeoutRef.current = null;
        }

        if (kind === 'ok' || kind === 'info') {
            const fade = setTimeout(() => {
                setCurrentLog(prev => prev?.id === id ? { ...prev, fading: true } : prev);
            }, 2400);
            const remove = setTimeout(() => {
                setCurrentLog(prev => prev?.id === id ? null : prev);
            }, 4000);
            logTimeoutRef.current = { fade, remove };
        }
    }, []);

    const cancelRedirect = useCallback(() => {
        clearInterval(redirectTimerRef.current);
        redirectTimerRef.current = null;
        setRedirectIn(null);
    }, []);

    const handleReset = useCallback(() => {
        cancelRedirect();
        clearInterval(revealIntervalRef.current);
        requestEpochRef.current++;
        inflightRef.current = false;
        captureGuardRef.current = false;
        if (logTimeoutRef.current) {
            clearTimeout(logTimeoutRef.current.fade);
            clearTimeout(logTimeoutRef.current.remove);
            logTimeoutRef.current = null;
        }
        if (captureTimerRef.current) {
            clearTimeout(captureTimerRef.current);
            captureTimerRef.current = null;
        }
        setCurrentLog(null);
        setAnalysisOpen(false);
        lastIqaLogRef.current = { text: '', kind: '' };
        setCurrentLandmarks(null);
        setActiveSegments(new Set());
        setRevealedSegments(0);
        setResult(null);
        setDraftCapture(null);
        setPhase(PHASES.LOADING);

        setTimeout(() => {
            if (phaseRef.current === PHASES.LOADING) {
                setPhase(PHASES.SEARCHING);
            }
        }, 50);
    }, [cancelRedirect, setPhase]);

    useEffect(() => {
        const p = phaseRef.current;
        const isEligibleForAutoReset = p === PHASES.MORPHING || p === PHASES.SCANNING || p === PHASES.CAPTURING;
        if (isEligibleForAutoReset && iqaState === IQA.NO_FACE) {
            handleReset();
        }
    }, [iqaState, handleReset]);

    const handleFaceFrame = useCallback((landmarks) => {
        const p = phaseRef.current;
        if (p !== PHASES.SEARCHING && p !== PHASES.MORPHING && p !== PHASES.SCANNING && p !== PHASES.CAPTURING) {
            setCurrentLandmarks(null);
            return;
        }
        setCurrentLandmarks(landmarks || null);
    }, []);

    const startRedirect = useCallback(() => {
        let seconds = Config.REDIRECT_DELAY;
        setRedirectIn(seconds);
        clearInterval(redirectTimerRef.current);
        redirectTimerRef.current = setInterval(() => {
            seconds--;
            setRedirectIn(seconds);
            if (seconds <= 0) {
                clearInterval(redirectTimerRef.current);
                redirectTimerRef.current = null;
                setRedirectIn(null);
                window.location.href = Config.REDIRECT_ON_AUTH;
            }
        }, 1000);
    }, []);

    const executeApiSubmission = useCallback(async (b64) => {
        if (inflightRef.current) return;
        inflightRef.current = true;
        const epoch = requestEpochRef.current;

        setPhase(PHASES.ANALYZING);
        showLog('Enkripsi & Kompresi data...', 'active');
        await new Promise((r) => setTimeout(r, 300));
        
        if (requestEpochRef.current !== epoch) { inflightRef.current = false; return; }

        showLog('Gambar diambil', 'ok');
        showLog(mode === Config.MODE_REGISTER ? 'Mendaftarkan wajah ke API...' : 'Memverifikasi identitas ke API...', 'active');

        const apiCall = mode === Config.MODE_REGISTER
            ? apiClient.register(userId, b64, fas)
            : apiClient.authenticate(userId, b64, fas);
        
        const response = await apiCall;
        
        if (requestEpochRef.current !== epoch) { 
            inflightRef.current = false; 
            return; 
        }

        const { ok, status, data } = response;

        if (ok && (status === 200 || status === 202)) {
            showLog('Autentikasi Berhasil', 'ok');
            const probs = data?.metrics;
            const summary = parseSummary(probs);
            const detail = parseDetail(probs);
            const baseLabel = mode === Config.MODE_REGISTER ? 'Pendaftaran berhasil' : 'Identitas terverifikasi';
            const label = fas ? baseLabel : `${baseLabel} (FAS off)`;
            
            setResult({ verdict: 'ok', label, summary, detail });
            setPhase(PHASES.COMPLETE);

            if (mode === Config.MODE_AUTHENTICATE) startRedirect();
            if (mode === Config.MODE_REGISTER) {
                setTimeout(() => {
                    if (requestEpochRef.current === epoch) {
                        onChangeMode(Config.MODE_AUTHENTICATE);
                        showLog('Masuk ke mode Verifikasi', 'ok');
                    }
                }, 2800);
            }
        } else {
            const err = data?.error || {};
            const code = err.code || 'UNKNOWN';
            const msg = err.message || 'Terjadi kesalahan';
            const details = err.details || {};
            
            showLog(`API Server: ${code}`, 'err');

            if (code === 'LIVENESS_CHECK_FAILED') {
                const probs = details.probabilities;
                const conf = details.confidence || 0.0;
                const spoofCls = details.spoof_class || 'unknown';
                let summary, detail;
                if (probs && probs.length === 6) {
                    summary = parseSummary(probs);
                    detail = parseDetail(probs);
                } else {
                    summary = spoofCls === 'realperson' ? { live: conf, spoof: 1.0 - conf } : { live: 1.0 - conf, spoof: conf };
                    detail = null;
                }
                showLog(`Spoofing: ${msg}`, 'err');
                setResult({ verdict: 'spoof', label: 'SPOOF', summary, detail });
                setPhase(PHASES.FAILED);

                if (detail) {
                    setTimeout(() => { if (requestEpochRef.current === epoch) setAnalysisOpen(true); }, 1800);
                }
            } else if (code === 'FACE_MATCH_FAILED') {
                const sim = details.similarity_score || 0.0;
                showLog(`Tidak cocok (${sim.toFixed(2)})`, 'err');
                setResult({ verdict: 'warn', label: 'TIDAK COCOK', summary: { live: 0, spoof: 0 }, detail: null });
                setPhase(PHASES.FAILED);
            } else {
                showLog(`${code}: ${msg}`, 'err');
                setResult({ verdict: 'warn', label: 'ERROR', summary: { live: 0, spoof: 0 }, detail: null });
                setPhase(PHASES.FAILED);
            }
        }
        inflightRef.current = false;
    }, [fas, mode, onChangeMode, showLog, setPhase, userId, startRedirect]);

    const processCapture = useCallback(async () => {
        if (inflightRef.current) return;
        inflightRef.current = true;
        const epoch = requestEpochRef.current;
        const video = videoRef.current;
        
        if (!video) {
            captureGuardRef.current = false;
            inflightRef.current = false;
            return;
        }

        showLog('Menyiapkan data biometrik...', 'active');
        await new Promise((r) => setTimeout(r, 450));
        
        if (requestEpochRef.current !== epoch) { inflightRef.current = false; return; }
        
        showLog('Memproses frame mentah...', 'active');
        const b64 = captureBase64FromVideo(video);
        
        if (!b64) {
            showLog('Gagal memproses frame video', 'err');
            captureGuardRef.current = false;
            inflightRef.current = false;
            setPhase(PHASES.FAILED);
            return;
        }

        inflightRef.current = false;

        if (showPreview) {
            setDraftCapture(b64);
            setPhase(PHASES.PREVIEW);
        } else {
            executeApiSubmission(b64);
        }
    }, [showLog, setPhase, showPreview, executeApiSubmission]);

    const scheduleCapture = useCallback((delayMs = 1500) => {
        if (captureGuardRef.current) return;
        captureGuardRef.current = true;

        showLog('Memproses bingkai... Tahan posisi wajah Anda', 'active');

        const attemptCapture = () => {
            if (phaseRef.current === PHASES.LOADING || phaseRef.current === PHASES.FAILED) {
                captureGuardRef.current = false;
                return;
            }

            if (instantFailsRef.current.length > 0) {
                const fails = instantFailsRef.current;
                let warnMsg = 'Menunggu posisi ideal...';
                
                if (fails.includes(IQA.BLURRY)) warnMsg = 'Kamera sedang fokus... Tahan posisi';
                else if (fails.includes(IQA.TOO_CLOSE)) warnMsg = 'Terlalu dekat dengan kamera... Mundur sedikit';
                else if (fails.includes(IQA.LOW_LIGHT)) warnMsg = 'Pencahayaan kurang baik...';
                
                showLog(warnMsg, 'warn');
                captureTimerRef.current = setTimeout(attemptCapture, 500);
                return;
            }

            setPhase(PHASES.CAPTURING);
            queueMicrotask(() => processCapture());
        };

        captureTimerRef.current = setTimeout(attemptCapture, delayMs);
    }, [showLog, setPhase, processCapture]);

    useEffect(() => {
        if (phase !== PHASES.SEARCHING) return;
        if (iqaState === IQA.READY) {
            setPhase(PHASES.MORPHING);
            setTimeout(() => {
                let current = 0;
                clearInterval(revealIntervalRef.current);
                revealIntervalRef.current = setInterval(() => {
                    current += 2;
                    if (current >= NUM_SEGMENTS) {
                        clearInterval(revealIntervalRef.current);
                        setRevealedSegments(NUM_SEGMENTS);
                    } else {
                        setRevealedSegments(current);
                    }
                }, 14);
            }, 420);

            setTimeout(() => {
                if (phaseRef.current === PHASES.MORPHING) {
                    if (requirePose) {
                        setPhase(PHASES.SCANNING);
                    } else {
                        const allSegs = new Set(Array.from({ length: NUM_SEGMENTS }, (_, i) => i));
                        setActiveSegments(allSegs);
                        scheduleCapture(1500);
                    }
                }
            }, 1150);
        }
    }, [iqaState, phase, setPhase, requirePose, scheduleCapture]);

    const handleHeadMove = useCallback((landmarks) => {
        if (phaseRef.current !== PHASES.SCANNING) return;
        const nose = landmarks[1];
        const leftCheek = landmarks[234];
        const rightCheek = landmarks[454];
        const forehead = landmarks[10];
        const chin = landmarks[152];
        const cx = (leftCheek.x + rightCheek.x) / 2;
        const cy = (forehead.y + chin.y) / 2;
        
        const faceW = Math.abs(rightCheek.x - leftCheek.x);
        const faceH = Math.abs(chin.y - forehead.y);

        const dx = cx - nose.x;
        const dyY = nose.y - cy;
        const dyZ = chin.z - forehead.z;
        const dy = dyY * 0.5 + dyZ * 0.5;

        const normDx = dx / (faceW || 1);
        const normDy = dy / (faceH || 1);

        if (Math.hypot(normDx, normDy) < 0.055) return;
        
        const rawAngle = Math.atan2(normDy, normDx) * (180 / Math.PI);
        const angle = ((rawAngle + 360 + 90) % 360);
        const targetSegment = Math.floor(angle / ANGLE_STEP);
        
        setActiveSegments((prev) => {
            const next = new Set(prev);
            for (let offset = -2; offset <= 2; offset++) {
                next.add((targetSegment + offset + NUM_SEGMENTS) % NUM_SEGMENTS);
            }
            if (next.size >= NUM_SEGMENTS - 2 && !captureGuardRef.current) {
                scheduleCapture(500);
            }
            return next;
        });
    }, [scheduleCapture]);

    const cameraReady = useFaceMesh({
        videoRef,
        canvasRef,
        scriptsLoaded,
        phaseRef,
        iqaStateRef,
        onFaceFrame: handleFaceFrame,
        onHeadMove: handleHeadMove,
    });

    useEffect(() => {
        if (cameraReady && phaseRef.current === PHASES.LOADING && !isConfiguring) {
            setPhase(PHASES.SEARCHING);
        }
    }, [cameraReady, setPhase, isConfiguring]);

    useEffect(() => {
        const isIqaPhase = phase === PHASES.SEARCHING || phase === PHASES.SCANNING || phase === PHASES.MORPHING;
        if (!isIqaPhase) {
            lastIqaLogRef.current = { text: '', kind: '' };
            return;
        }

        let currentText = iqaMessage.text;
        let currentKind = iqaMessage.kind;

        if (iqaState === IQA.READY) {
            if (phase === PHASES.SCANNING) {
                if (!captureGuardRef.current) {
                    currentText = 'Putar kepala Anda perlahan';
                    currentKind = 'active';
                } else {
                    currentText = 'Memproses bingkai... Tahan posisi wajah Anda';
                    currentKind = 'active';
                }
            } else {
                if (!captureGuardRef.current) {
                    currentText = 'Wajah terdeteksi';
                    currentKind = 'ok';
                }
            }
        } else if (iqaState === IQA.NO_FACE && phase !== PHASES.SEARCHING) {
            currentText = 'Wajah hilang dari bingkai';
            currentKind = 'warn';
        }

        if (currentText && (lastIqaLogRef.current.text !== currentText || lastIqaLogRef.current.kind !== currentKind)) {
            showLog(currentText, currentKind);
            lastIqaLogRef.current = { text: currentText, kind: currentKind };
        }
    }, [iqaState, iqaMessage, phase, showLog]);

    useEffect(() => {
        if (phase === PHASES.SEARCHING || phase === PHASES.MORPHING || phase === PHASES.SCANNING) {
            if (iqaState !== IQA.NO_FACE && iqaState !== IQA.READY) {
                avatarControls.start({
                    x: [-8, 8, -5, 5, -2, 2, 0],
                    filter: ['blur(0px)', 'blur(3px)', 'blur(0px)', 'blur(1px)', 'blur(0px)', 'blur(0px)', 'blur(0px)'],
                    scale: 1,
                    transition: { 
                        x: { repeat: Infinity, repeatDelay: 1.2, duration: 0.4 },
                        filter: { repeat: Infinity, repeatDelay: 1.2, duration: 0.4 },
                        scale: { duration: 0.3 }
                    }
                });
            } else if (iqaState === IQA.NO_FACE && phase === PHASES.SCANNING) {
                avatarControls.start({
                    x: [-12, 12, -8, 8, -4, 4, 0],
                    filter: ['blur(0px)', 'blur(4px)', 'blur(0px)', 'blur(2px)', 'blur(0px)', 'blur(0px)', 'blur(0px)'],
                    scale: 1,
                    transition: { 
                        x: { repeat: Infinity, repeatDelay: 1.0, duration: 0.5 },
                        filter: { repeat: Infinity, repeatDelay: 1.0, duration: 0.5 },
                        scale: { duration: 0.3 }
                    }
                });
            } else if (iqaState === IQA.READY) {
                avatarControls.start({
                    scale: [1, 1.025, 1],
                    x: 0,
                    filter: 'blur(0px)',
                    transition: {
                        scale: { repeat: Infinity, duration: 1.5, ease: "easeInOut" },
                        x: { duration: 0.3 },
                        filter: { duration: 0.3 }
                    }
                });
            } else {
                avatarControls.start({ x: 0, scale: 1, filter: 'blur(0px)', transition: { duration: 0.3 } });
            }
        } else {
            avatarControls.start({ x: 0, scale: 1, filter: 'blur(0px)', transition: { duration: 0.3 } });
        }
    }, [iqaState, phase, avatarControls]);

    useEffect(() => () => {
        clearInterval(revealIntervalRef.current);
        clearInterval(redirectTimerRef.current);
        if (logTimeoutRef.current) {
            clearTimeout(logTimeoutRef.current.fade);
            clearTimeout(logTimeoutRef.current.remove);
        }
        if (captureTimerRef.current) clearTimeout(captureTimerRef.current);
    }, []);

    const initialModeRef = useRef(true);
    useEffect(() => {
        if (initialModeRef.current) { initialModeRef.current = false; return; }
        handleReset();
    }, [mode, handleReset]);

    const isSquare = phase === PHASES.LOADING || phase === PHASES.SEARCHING;
    const isMorphing = phase === PHASES.MORPHING;
    const isCircle = !isSquare && !isMorphing;
    const showSegments = (isMorphing || isCircle) && phase !== PHASES.ANALYZING && phase !== PHASES.COMPLETE && phase !== PHASES.FAILED;

    const showVignette = VIGNETTE_PHASES.has(phase);
    const showCanvas = CANVAS_PHASES.has(phase);
    const isBusy = ACTIVE_PHASES.has(phase);
    const isTerminal = TERMINAL_PHASES.has(phase);
    const showModeToggle = !isBusy && !isTerminal && phase !== PHASES.PREVIEW;
    const showLogs = !isTerminal && phase !== PHASES.PREVIEW;

    const mascotConfig = useMemo(() => {
        const expr = phase === PHASES.COMPLETE ? 'berhasil' : phase === PHASES.FAILED ? 'gagal' : 'normal';
        return {
            globalSpeed: 1.0,
            baseRadiusScale: 0.35,
            expression: expr,
            layers: [
                { id: 1, name: 'Outer Indigo', hex: '#5e5ce6', width: 8, blur: 50, w1: 2, w2: 3, amp1: 6, amp2: 5, s1: 0.015, s2: 0.025 },
                { id: 2, name: 'Neon Pink', hex: '#ff2a5f', width: 6, blur: 40, w1: 3, w2: 1, amp1: 4, amp2: 7, s1: -0.02, s2: 0.015 },
                { id: 3, name: 'Core Orange', hex: '#ff6b00', width: 4, blur: 30, w1: 1, w2: 4, amp1: 8, amp2: 4, s1: 0.03, s2: -0.02 },
                { id: 4, name: 'Inner Glow', hex: '#ffffff', width: 2, blur: 20, w1: 2, w2: 2, amp1: 3, amp2: 4, s1: 0.04, s2: -0.03 }
            ]
        };
    }, [phase]);

    const statusText = useMemo(() => {
        if (phase === PHASES.ANALYZING) return 'Memproses data biometrik...';
        if (phase === PHASES.COMPLETE) return 'Identitas Terverifikasi';
        if (phase === PHASES.FAILED) {
            if (result?.verdict === 'spoof') return 'Spoofing Terdeteksi';
            if (result?.verdict === 'warn') return 'Tidak Dikenali';
            return 'Verifikasi Gagal';
        }
        return '';
    }, [phase, result]);

    const irisShellClass = useMemo(() => {
        const base = 'iris-shell flex items-center justify-center relative';
        if (isMorphing) return `${base} glass-blue is-square`;
        if (isSquare) return `${base} glass-blue is-square w-[320px] h-[320px] rounded-[44px]`;
        return `${base} is-circle w-[260px] h-[260px] rounded-[130px]`;
    }, [isSquare, isMorphing]);

    let dynamicFrameColor = 'rgba(255,255,255,0.88)';
    let segBase = 'rgba(255,255,255,0.12)';
    let segReveal = 'rgba(255,255,255,0.3)';
    let segActive = '#ffffff';

    if (phase === PHASES.COMPLETE) {
        dynamicFrameColor = 'rgba(52,211,153,1)';
        segBase = 'rgba(52,211,153,0.5)';
        segReveal = 'rgba(52,211,153,0.8)';
        segActive = 'rgba(52,211,153,1)';
    } else if (phase === PHASES.FAILED) {
        dynamicFrameColor = 'rgba(248,113,113,1)';
        segBase = 'rgba(248,113,113,0.5)';
        segReveal = 'rgba(248,113,113,0.8)';
        segActive = 'rgba(248,113,113,1)';
    } else if (phase === PHASES.CAPTURING || phase === PHASES.PREVIEW || phase === PHASES.ANALYZING) {
        dynamicFrameColor = 'rgba(52,211,153,0.95)';
        segBase = 'rgba(52,211,153,0.2)';
        segReveal = 'rgba(52,211,153,0.5)';
        segActive = '#ffffff';
    } else if (phase === PHASES.SEARCHING || phase === PHASES.MORPHING || phase === PHASES.SCANNING) {
        if (iqaState === IQA.NO_FACE) {
            dynamicFrameColor = 'rgba(255,255,255,0.4)';
            if (phase === PHASES.SCANNING) {
                dynamicFrameColor = 'rgba(248,113,113,0.85)';
                segBase = 'rgba(248,113,113,0.25)';
                segReveal = 'rgba(248,113,113,0.5)';
                segActive = 'rgba(248,113,113,0.95)';
            }
        } else if (iqaState === IQA.READY) {
            dynamicFrameColor = 'rgba(52,211,153,0.95)';
            segBase = 'rgba(52,211,153,0.2)';
            segReveal = 'rgba(52,211,153,0.5)';
            segActive = 'rgba(52,211,153,0.95)';
        } else {
            dynamicFrameColor = 'rgba(251,191,36,0.95)';
            segBase = 'rgba(251,191,36,0.25)';
            segReveal = 'rgba(251,191,36,0.6)';
            segActive = 'rgba(251,191,36,0.95)';
        }
    }

    const headerOpacity = (isBusy || phase === PHASES.PREVIEW) ? 0.55 : 1;

    return (
        <div className="app-shell relative">
            <div className="bg-aura" />
            <div className="bg-gradient-bottom" />

            <SystemOverlayScreen
                visible={isConfiguring}
                spinner={true}
                title="Sinkronisasi Config"
                subtitle="Menerapkan perubahan..."
            />

            <motion.header
                className="scanning-header"
                animate={{ opacity: headerOpacity }}
                transition={{ duration: 0.4, ease: 'easeInOut' }}
            >
                <div className="w-10" />
                <div className="scanning-center-brand">
                    <div style={{ color: 'rgba(255,255,255,0.80)' }}>
                        <FaceIDGlyph size={20} />
                    </div>
                    <div className="face-title" style={{ fontSize: 12 }}>Spectre</div>
                </div>
                <button className="icon-btn" onClick={() => setDrawerOpen(true)} aria-label="Pengaturan">
                    <MoreVertIcon />
                </button>
            </motion.header>

            <AnimatePresence>
                {showModeToggle && (
                    <motion.div
                        key="mode-badge"
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                        className="mode-toggle-row"
                        style={{ top: 88 }}
                    >
                        <div className={`mode-indicator ${mode === Config.MODE_REGISTER ? 'is-register' : 'is-verify'}`}>
                            {mode === Config.MODE_REGISTER ? 'Enrollment' : 'Verification'}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="absolute inset-0 flex flex-col items-center z-10" style={{ paddingTop: '18vh' }}>
                <motion.div
                    animate={avatarControls}
                    style={{ transformOrigin: 'center center' }}
                    className="relative w-[400px] h-[400px] flex items-center justify-center"
                >
                    <div className="absolute inset-0 z-20 flex items-center justify-center">
                        <div
                            className={irisShellClass}
                            style={isMorphing ? { width: 260, height: 260, borderRadius: 130 } : undefined}
                        >
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className={`absolute object-cover transition-all duration-1000 ${(!cameraReady || isConfiguring)
                                    ? 'opacity-0'
                                    : (phase === PHASES.ANALYZING || phase === PHASES.PREVIEW || phase === PHASES.COMPLETE || phase === PHASES.FAILED)
                                        ? 'blur-[6px] opacity-100'
                                        : 'blur-[0px] opacity-100'
                                    }`}
                                style={{
                                    width: `${VIDEO_DISPLAY_SIZE}px`,
                                    height: `${VIDEO_DISPLAY_SIZE}px`,
                                    maxWidth: 'none',
                                    top: '50%',
                                    left: '50%',
                                    transform: 'translate(-50%, -50%) scale(-1, 1)',
                                }}
                            />
                            <AnimatePresence>
                                {phase === PHASES.CAPTURING && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: [0, 1, 0] }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.4, times: [0, 0.15, 1] }}
                                        className="absolute inset-0 bg-white z-[60] pointer-events-none"
                                        style={{ borderRadius: isSquare ? 44 : 130 }}
                                    />
                                )}
                            </AnimatePresence>
                            <canvas
                                ref={canvasRef}
                                style={{
                                    position: 'absolute',
                                    maxWidth: 'none',
                                    top: '50%',
                                    left: '50%',
                                    transform: 'translate(-50%, -50%) scale(-1, 1)',
                                    opacity: (showCanvas && !isConfiguring) ? glitchOpacity : 0,
                                    transition: 'opacity 0.04s linear',
                                    pointerEvents: 'none',
                                }}
                            />
                            <div
                                className="pointer-events-none"
                                style={{
                                    position: 'absolute',
                                    inset: 0,
                                    margin: 'auto',
                                    width: isCircle ? 260 : 240,
                                    height: isCircle ? 260 : 240,
                                    opacity: (phase === PHASES.SEARCHING || phase === PHASES.MORPHING) && !isConfiguring ? 1 : 0,
                                    transition: 'opacity 250ms ease',
                                }}
                            >
                                <CornerFrame phase={phase} iqaState={iqaState} />
                            </div>
                            <div className={`scrim-vignette ${(showVignette && !isConfiguring) ? 'show' : ''}`} />
                        </div>
                    </div>

                    <div 
                        className={`absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-none transition-opacity duration-700`}
                        style={{ opacity: (phase === PHASES.ANALYZING || phase === PHASES.COMPLETE || phase === PHASES.FAILED) && !isConfiguring ? 1 : 0 }}
                    >
                        {(phase === PHASES.ANALYZING || phase === PHASES.COMPLETE || phase === PHASES.FAILED) && (
                            <AuraRing size={480} config={mascotConfig} />
                        )}
                        {statusText && (
                            <div className="my-5 text-white/80 font-medium tracking-tight text-sm mt-4" style={{ letterSpacing: '-0.02em' }}>
                                {statusText}
                            </div>
                        )}
                    </div>

                    <svg
                        className={`absolute w-full h-full z-30 pointer-events-none transition-opacity duration-700`}
                        style={{ opacity: (showSegments && !isConfiguring) ? 1 : 0 }}
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

                            let stroke = segBase;
                            if (isRevealed) stroke = segReveal;
                            if (isActive || phase === PHASES.COMPLETE || phase === PHASES.FAILED) stroke = segActive;

                            if (!isRevealed && !isActive && phase !== PHASES.SCANNING && phase !== PHASES.COMPLETE && phase !== PHASES.FAILED) {
                                stroke = 'transparent';
                            }

                            return (
                                <line
                                    key={`seg-${i}`}
                                    x1={x1} y1={y1} x2={x2} y2={y2}
                                    stroke={stroke}
                                    strokeWidth={isActive || phase === PHASES.COMPLETE || phase === PHASES.FAILED ? 5 : 4}
                                    strokeLinecap="round"
                                    style={{ transition: 'all 280ms ease-out' }}
                                />
                            );
                        })}
                    </svg>

                </motion.div>
                <ProgressiveLog log={currentLog} visible={showLogs && !isConfiguring}/>
            </div>

            <PreviewModal 
                open={phase === PHASES.PREVIEW} 
                base64Data={draftCapture} 
                onRetake={handleReset} 
                onSubmit={() => executeApiSubmission(draftCapture)} 
            />

            <AnimatePresence>
                {isTerminal && result && (
                    <motion.div
                        key="result"
                        initial={{ opacity: 0, y: 32 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 32 }}
                        transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute left-0 right-0 px-5 z-30"
                        style={{ bottom: 24 }}
                    >
                        <ResultPanel result={result} onReset={handleReset} redirectIn={redirectIn} />
                    </motion.div>
                )}
            </AnimatePresence>

            <ConfigDrawer
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                currentConfig={{ userId, fas, requirePose, showPreview }}
                onApply={async (newConfig) => {
                    setDrawerOpen(false);
                    setIsConfiguring(true);
                    handleReset();

                    try {
                        if (newConfig.userId !== userId) {
                            const res = await apiClient.lookupUser(newConfig.userId);
                            const newMode = res.exists ? Config.MODE_AUTHENTICATE : Config.MODE_REGISTER;
                            onChangeUserId(newConfig.userId);
                            onChangeMode(newMode);
                        }
                    } catch (err) {
                        onChangeUserId(newConfig.userId);
                    } finally {
                        onToggleFas(newConfig.fas);
                        onToggleRequirePose(newConfig.requirePose);
                        onTogglePreview(newConfig.showPreview);
                        setTimeout(() => setIsConfiguring(false), 800);
                    }
                }}
                mode={mode}
                result={result}
                onOpenAnalysis={() => setAnalysisOpen(true)}
            />

            <AnalysisDrawer
                open={analysisOpen}
                onClose={() => setAnalysisOpen(false)}
                result={result}
            />
        </div>
    );
}

function parseSummary(probs) {
    if (probs && probs.length === 6) {
        const live = parseFloat(probs[5]);
        return { live, spoof: 1.0 - live };
    }
    return { live: 1.0, spoof: 0.0 };
}

function parseDetail(probs) {
    if (probs && probs.length === 6) {
        return Config.CLASSES.reduce((acc, cls, i) => { acc[cls] = parseFloat(probs[i]); return acc; }, {});
    }
    return null;
}

function App() {
    const [userId, setUserId] = useState('');
    const [mode, setMode] = useState(Config.MODE_REGISTER);
    const [fas, setFas] = useState(true);
    const [requirePose, setRequirePose] = useState(true);
    const [showPreview, setShowPreview] = useState(false);

    const handleGateResolved = useCallback((id, resolvedMode) => {
        setUserId(id);
        setMode(resolvedMode);
    }, []);

    if (!userId) {
        return <IdentityGate onResolved={handleGateResolved} />;
    }
    return (
        <ScannerView
            userId={userId}
            mode={mode}
            fas={fas}
            requirePose={requirePose}
            showPreview={showPreview}
            onChangeUserId={setUserId}
            onChangeMode={setMode}
            onToggleFas={setFas}
            onToggleRequirePose={setRequirePose}
            onTogglePreview={setShowPreview}
        />
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);