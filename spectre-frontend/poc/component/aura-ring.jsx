const { useState, useEffect, useRef } = React;

// --- UTILITY FUNCTIONS ---
function hexToRgb(hex) {
    const bigint = parseInt(hex.replace('#', ''), 16);
    return {
        r: (bigint >> 16) & 255,
        g: (bigint >> 8) & 255,
        b: bigint & 255
    };
}

function rgbToHex(r, g, b) {
    return "#" + (1 << 24 | r << 16 | g << 8 | b).toString(16).padStart(6, '0');
}

// --- DEFAULT CONFIGURATION ---
const DEFAULT_CONFIG = {
    globalSpeed: 1.0,
    baseRadiusScale: 0.35, 
    expression: 'normal', 
    layers: [
        { id: 1, name: 'Outer Indigo', hex: '#5e5ce6', width: 8, blur: 50, w1: 2, w2: 3, amp1: 6, amp2: 5, s1: 0.015, s2: 0.025 },
        { id: 2, name: 'Neon Pink', hex: '#ff2a5f', width: 6, blur: 40, w1: 3, w2: 1, amp1: 4, amp2: 7, s1: -0.02, s2: 0.015 },
        { id: 3, name: 'Core Orange', hex: '#ff6b00', width: 4, blur: 30, w1: 1, w2: 4, amp1: 8, amp2: 4, s1: 0.03, s2: -0.02 },
        { id: 4, name: 'Inner Glow', hex: '#ffffff', width: 2, blur: 20, w1: 2, w2: 2, amp1: 3, amp2: 4, s1: 0.04, s2: -0.03 }
    ]
};

// --- CUTE 3D SPHERE CHARACTER COMPONENT ---
function AuraRing({ size = 450, config }) {
    const containerRef = useRef(null);
    const canvasRef = useRef(null);
    
    // State Translasi & Rotasi 3D Mata
    const [eyeState, setEyeState] = useState({ x: 0, y: 0, yaw: 0, pitch: 0 });

    // Physics Engine untuk animasi bounce lirik mata
    const bouncePhysicsRef = useRef({ value: 0, velocity: 0 });

    // Tarik warna untuk disatukan dengan body
    const color1Rgb = hexToRgb(config.layers[0].hex);
    const color2Rgb = hexToRgb(config.layers[1].hex);
    const auraColor1 = `${color1Rgb.r}, ${color1Rgb.g}, ${color1Rgb.b}`;
    const auraColor2 = `${color2Rgb.r}, ${color2Rgb.g}, ${color2Rgb.b}`;

    // --- LOGIKA MELIRIK & TRIGGER BOUNCE MUNGIL ---
    useEffect(() => {
        let timer;
        const moveEyes = () => {
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
            
            // Lompatan refleks saat bola mata melirik
            bouncePhysicsRef.current.velocity -= (0.12 + Math.random() * 0.08);

            timer = setTimeout(moveEyes, 1200 + Math.random() * 2000);
        };
        
        timer = setTimeout(moveEyes, 1000);
        return () => clearTimeout(timer);
    }, []);

    // --- RENDER LOOP KANVAS & EMOTION PHYSICS ENGINE ---
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

            // 1. HITUNGAN LOMPATAN MATA (SPRING BOUNCE)
            const stiffness = 0.08; 
            const damping = 0.75;   
            
            bouncePhysicsRef.current.velocity += (0 - bouncePhysicsRef.current.value) * stiffness;
            bouncePhysicsRef.current.velocity *= damping;
            bouncePhysicsRef.current.value += bouncePhysicsRef.current.velocity;
            
            // 2. HITUNGAN GERAKAN TUBUH BERDASARKAN EKSPRESI (EMOTION KINETICS)
            let ex = 0; // Emotion Geser X
            let ey = 0; // Emotion Geser Y
            let esx = 1; // Emotion Scale X
            let esy = 1; // Emotion Scale Y
            let baseBounce = bouncePhysicsRef.current.value;

            if (config.expression === 'sedih') {
                // Geleng-geleng kepala lemas
                ex = Math.sin(time * 0.03) * 6; 
                // Menghela napas (kembang-kempis berat)
                esy = 1 - (Math.abs(Math.sin(time * 0.02)) * 0.03); 
                esx = 1 + (Math.abs(Math.sin(time * 0.02)) * 0.015);
            } else if (config.expression === 'senang') {
                // Lompat-lompat riang gembira
                ey = Math.abs(Math.sin(time * 0.06)) * -25;
                // Goyang jelly saat melompat
                esy = 1 + Math.sin(time * 0.12) * 0.04; 
            }

            // Gabungkan Base Bounce (lirik mata) dengan Emotion Kinetics
            esx += baseBounce * 0.25;
            esy -= baseBounce * 0.25;
            ey += baseBounce * 35;

            // Tembak Variabel CSS ke Container
            if (containerRef.current) {
                containerRef.current.style.setProperty('--ex', `${ex}px`);
                containerRef.current.style.setProperty('--ey', `${ey}px`);
                containerRef.current.style.setProperty('--esx', esx.toFixed(4));
                containerRef.current.style.setProperty('--esy', esy.toFixed(4));
            }

            // --- RENDER AURA ---
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
    }, [size, config]);

    // --- LOGIKA HELPER BENTUK & POSISI MATA ---
    const getEyeProps = (side) => {
        const isLeft = side === 'left';
        let rotation = '0deg';
        let bg = '#fff';
        let bw = '0px';
        let bc = 'transparent';
        let br = '50px';
        let translateY = '0%';
        let scale = 'scale(1)';
        let clipPath = 'none';
        let w = '7.5%';
        let h = '20%';

        switch(config.expression) {
            case 'senang':
                bg = '#fff';
                br = '0'; // Border radius dihilangkan agar ujung bintang tajam
                // Rumus polygon untuk bentuk Bintang
                clipPath = 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)';
                scale = 'scale(1.1)'; 
                w = '16%'; // Mata dilebarkan agar bintangnya kotak & proporsional
                h = '16%';
                translateY = '-5%'; // Sedikit naik
                break;
            case 'lengkungan':
                bg = 'transparent';
                bw = '0 0 8px 0'; 
                bc = '#fff';
                br = '50%';
                translateY = '-15%';
                w = '10%';
                h = '10%';
                scale = 'scale(1.2, 0.9)'; // Sedikit ditarik kesamping
                break;
            case 'sedih':
                rotation = isLeft ? '20deg' : '-20deg'; // Puppy Eyes miring
                bg = '#fff';
                br = '50px';
                scale = 'scale(0.8, 0.35)'; // Matanya menguncup/memipih ekstrem
                translateY = '40%'; // Nunduk ke bawah
                break;
            default: // normal
                break;
        }

        return { rotation, bg, bw, bc, br, translateY, scale, clipPath, w, h };
    };

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
            // Transformasi kinetik tubuh secara keseluruhan
            transform: `
                translate(var(--ex), var(--ey)) 
                scale(var(--esx), var(--esy))
            `
        }}>
            <style>{`
                @keyframes eye-blink {
                    0%, 4%, 100% { transform: scaleY(1); }
                    2% { transform: scaleY(0.1); }
                }
            `}</style>
            
            {/* --- 1. SPHERE BODY DROPLET --- */}
            <div style={{
                position: 'absolute',
                width: size * config.baseRadiusScale * 2,
                height: size * config.baseRadiusScale * 2,
                borderRadius: '50%',
                backgroundColor: 'rgba(12, 10, 20, 0.7)',
                boxShadow: `
                    inset ${-15 + eyeState.x * 1.8}px ${-15 + eyeState.y * 1.8}px 40px rgba(0, 0, 0, 0.95),
                    inset ${-25 + eyeState.x * 2.2}px ${-25 + eyeState.y * 2.2}px 25px rgba(0, 0, 0, 0.8),
                    inset ${15 - eyeState.x * 1.5}px ${15 - eyeState.y * 1.5}px 35px rgba(${auraColor2}, 0.4),
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
                    transform: `rotate(-40deg) translate(${eyeState.x * 0.2}px, ${eyeState.y * 0.2}px)`,
                    transition: 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    pointerEvents: 'none'
                }} />
            </div>

            {/* --- 2. KANVAS AURA --- */}
            <canvas
                ref={canvasRef}
                className="pointer-events-none"
                style={{ 
                    display: 'block', 
                    filter: 'blur(1px) saturate(1.2)',
                    position: 'absolute',
                    zIndex: 10 
                }}
            />

            {/* --- 3. WRAPPER UTAMA MATA --- */}
            <div style={{
                position: 'absolute',
                inset: 0,
                zIndex: 20,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transform: `
                    perspective(350px) 
                    translate(${eyeState.x}%, ${eyeState.y}%) 
                    rotateX(${eyeState.pitch}deg) 
                    rotateY(${eyeState.yaw}deg) 
                    rotateZ(-6deg)
                `,
                transition: 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
                pointerEvents: 'none'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12%', 
                    width: '100%',
                    height: '100%',
                    // Mata mengikuti delay momentum agar terasa seperti jelly
                    transform: `translate(calc(var(--ex) * 0.5), calc(var(--ey) * 0.3))`
                }}>
                    {/* DYNAMIC EYE RENDERER */}
                    {['left', 'right'].map(side => {
                        const { rotation, bg, bw, bc, br, translateY, scale, clipPath, w, h } = getEyeProps(side);
                        return (
                            <div key={side} style={{
                                width: w, 
                                height: h, 
                                transform: `rotate(${rotation}) translateY(${translateY}) ${scale}`,
                                transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
                                // Menyimpan filter drop-shadow di parent menjaga glow tidak terpotong oleh clip-path anak
                                filter: 'drop-shadow(0 0 6px rgba(255,255,255,0.8))'
                            }}>
                                <div style={{
                                    width: '100%', 
                                    height: '100%',
                                    backgroundColor: bg,
                                    borderRadius: br,
                                    borderWidth: bw,
                                    borderStyle: 'solid',
                                    borderColor: bc,
                                    clipPath: clipPath,
                                    animation: 'eye-blink 4s infinite',
                                    transformOrigin: 'center 70%',
                                    transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
                                }} />
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

// --- MAIN PREVIEW APP ---
export default function App() {
    const [config, setConfig] = useState(DEFAULT_CONFIG);
    const [drawerOpen, setDrawerOpen] = useState(false);

    const updateLayer = (id, key, value) => {
        setConfig(prev => ({
            ...prev,
            layers: prev.layers.map(l => l.id === id ? { ...l, [key]: Number(value) || value } : l)
        }));
    };

    // Fix Bug NaN: Memastikan kata text tidak diubah jadi Angka paksa
    const updateGlobal = (key, value) => {
        setConfig(prev => ({ 
            ...prev, 
            [key]: key === 'expression' ? value : Number(value) 
        }));
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#07070a] overflow-hidden relative font-sans">
            
            <button 
                onClick={() => setDrawerOpen(!drawerOpen)}
                className="absolute top-6 left-6 z-50 flex items-center gap-2 bg-white/10 hover:bg-white/20 transition-colors px-4 py-2.5 rounded-full backdrop-blur-md border border-white/10 text-white/90 text-sm font-medium tracking-wide"
            >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3"></circle>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                </svg>
                {drawerOpen ? 'Tutup Config' : 'Buka Config'}
            </button>

            <div 
                className={`absolute top-0 left-0 h-full w-[360px] bg-black/60 backdrop-blur-2xl border-r border-white/10 z-40 p-6 overflow-y-auto transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}`}
            >
                <div className="mt-16 flex flex-col gap-8">
                    
                    <div className="flex flex-col gap-4">
                        <div className="text-white/40 text-[10px] uppercase tracking-[0.2em] font-bold border-b border-white/10 pb-2">Global Settings</div>
                        
                        <div className="flex flex-col gap-2">
                            <label className="text-xs text-white/70 flex justify-between">
                                <span>Ekspresi Wajah</span>
                            </label>
                            <select 
                                value={config.expression} 
                                onChange={(e) => updateGlobal('expression', e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-white/90 text-sm focus:outline-none focus:border-indigo-500 cursor-pointer"
                            >
                                <option value="normal" className="bg-[#07070a]">Normal</option>
                                <option value="senang" className="bg-[#07070a]">Senang (Bintang & Lompat)</option>
                                <option value="sedih" className="bg-[#07070a]">Sedih (Nunduk & Geleng)</option>
                                <option value="lengkungan" className="bg-[#07070a]">Lengkungan (U U)</option>
                            </select>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-xs text-white/70 flex justify-between">
                                <span>Global Speed</span>
                                <span className="font-mono">{config.globalSpeed.toFixed(1)}x</span>
                            </label>
                            <input type="range" min="0.1" max="3" step="0.1" value={config.globalSpeed} onChange={(e) => updateGlobal('globalSpeed', e.target.value)} className="accent-indigo-500" />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-xs text-white/70 flex justify-between">
                                <span>Radius Lingkaran</span>
                                <span className="font-mono">{Math.round(config.baseRadiusScale * 100)}%</span>
                            </label>
                            <input type="range" min="0.1" max="0.5" step="0.01" value={config.baseRadiusScale} onChange={(e) => updateGlobal('baseRadiusScale', e.target.value)} className="accent-indigo-500" />
                        </div>
                    </div>

                    {config.layers.map((layer) => (
                        <div key={layer.id} className="flex flex-col gap-4 bg-white/[0.02] p-4 rounded-2xl border border-white/5">
                            <div className="text-white/40 text-[10px] uppercase tracking-[0.2em] font-bold flex items-center justify-between">
                                <span>Layer {layer.id}: {layer.name}</span>
                                <input type="color" value={layer.hex} onChange={(e) => updateLayer(layer.id, 'hex', e.target.value)} className="w-6 h-6 rounded cursor-pointer bg-transparent border-0 p-0" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] text-white/60">Blur Radius</label>
                                    <input type="range" min="0" max="100" value={layer.blur} onChange={(e) => updateLayer(layer.id, 'blur', e.target.value)} className="accent-pink-500" />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] text-white/60">Garis / Width</label>
                                    <input type="range" min="1" max="20" value={layer.width} onChange={(e) => updateLayer(layer.id, 'width', e.target.value)} className="accent-pink-500" />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] text-white/60">Wave 1 Amp</label>
                                    <input type="range" min="0" max="30" value={layer.amp1} onChange={(e) => updateLayer(layer.id, 'amp1', e.target.value)} className="accent-orange-500" />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] text-white/60">Wave 2 Amp</label>
                                    <input type="range" min="0" max="30" value={layer.amp2} onChange={(e) => updateLayer(layer.id, 'amp2', e.target.value)} className="accent-orange-500" />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] text-white/60">Wave 1 Speed</label>
                                    <input type="range" min="-0.1" max="0.1" step="0.005" value={layer.s1} onChange={(e) => updateLayer(layer.id, 's1', e.target.value)} className="accent-blue-500" />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] text-white/60">Wave 2 Speed</label>
                                    <input type="range" min="-0.1" max="0.1" step="0.005" value={layer.s2} onChange={(e) => updateLayer(layer.id, 's2', e.target.value)} className="accent-blue-500" />
                                </div>
                            </div>
                        </div>
                    ))}
                    <div className="h-10"></div> 
                </div>
            </div>

            <div className="relative flex flex-col items-center justify-center transition-all duration-500" style={{ transform: drawerOpen ? 'translateX(100px)' : 'translateX(0px)' }}>
                
                <div className="absolute w-[300px] h-[300px] bg-indigo-600/15 rounded-full blur-[90px]" />
                
                <AuraRing size={450} config={config} />
                
                <div className="absolute -bottom-6 text-white/50 font-medium tracking-tight text-sm" style={{ letterSpacing: '0.1em' }}>
                    ANALYZING
                </div>
            </div>
            
        </div>
    );
}