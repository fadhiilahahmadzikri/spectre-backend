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
    
    const [eyeState, setEyeState] = useState({ x: 0, y: 0, yaw: 0, pitch: 0 });
    const [internalExpr, setInternalExpr] = useState(config.expression);
    const [glitchActive, setGlitchActive] = useState(false); 
    const bouncePhysicsRef = useRef({ value: 0, velocity: 0 });
    const isIndicatorRef = useRef(false);

    const color1Rgb = hexToRgb(config.layers[0].hex);
    const color2Rgb = hexToRgb(config.layers[1].hex);
    const auraColor1 = `${color1Rgb.r}, ${color1Rgb.g}, ${color1Rgb.b}`;
    const auraColor2 = `${color2Rgb.r}, ${color2Rgb.g}, ${color2Rgb.b}`;

    // Update isIndicatorRef secara real-time
    useEffect(() => {
        isIndicatorRef.current = internalExpr.endsWith('_static') || internalExpr.endsWith('_anticipate');
    }, [internalExpr]);

    // --- LOGIKA STATE MACHINE & LOOPING TRANFORMASI ---
    useEffect(() => {
        let timeout1, timeout2, timeout3, timeout4, timeout5, intervalShuffle;
        let isCancelled = false;

        const runIndicatorSequence = (type) => {
            if (isCancelled) return;

            // 1. Fase Antisipasi Masuk (Mata menabrak di tengah & berputar)
            setInternalExpr(`${type}_anticipate`);

            timeout1 = setTimeout(() => {
                if (isCancelled) return;
                
                // 2. Fase Indikator Statis (Meledak menjadi Checklist/Silang)
                setInternalExpr(`${type}_static`);
                bouncePhysicsRef.current.velocity = -0.7; // Tendangan squash sinkron

                timeout2 = setTimeout(() => {
                    if (isCancelled) return;
                    
                    // 3. Mulai memanaskan Glitch untuk MEMBUYARKAN bentuk
                    setGlitchActive(true); 
                    bouncePhysicsRef.current.velocity = -0.15; // Getaran awal
                    
                    timeout4 = setTimeout(() => {
                        if (isCancelled) return;
                        
                        // 4. Morphing kembali ke mata normal TEPAT SAAT GLITCH MEMUNCAK
                        setInternalExpr('normal');
                        bouncePhysicsRef.current.velocity = -0.45; 
                        
                        // Matikan glitch setelah morphing selesai membaur (transisi tertutup glitch)
                        timeout5 = setTimeout(() => { 
                            if (!isCancelled) setGlitchActive(false); 
                        }, 350); 

                        // 5. Ulangi siklus setelah 5 detik
                        timeout3 = setTimeout(() => {
                            if (isCancelled) return;
                            runIndicatorSequence(type);
                        }, 5000); 
                    }, 150); // Tahan wujud indikator dalam glitch selama 150ms sebelum membelah
                }, 3000); // Tahan wujud Checklist/Silang
            }, 600); // Tahan fase antisipasi tabrakan
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
            setGlitchActive(false); // Pastikan glitch mati
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

    // --- LOGIKA MATA MELIRIK & TRIGGER BOUNCE KECIL ---
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
                // Menekan tubuhnya mengempis kuat ke bawah saat tabrakan mata
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

            // KALKULASI MOTION BLUR DARI VELOCITY
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

    // --- LOGIKA BENTUK MATA ---
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
                // TABRAKAN: Mata bergerak ke tengah, berputar, menyusut
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
                    clipPath = 'polygon(14% 44%, 0 65%, 50% 100%, 100% 16%, 80% 0%, 43% 62%)'; // Checklist
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
                    clipPath = 'polygon(20% 0%, 0% 20%, 30% 50%, 0% 80%, 20% 100%, 50% 70%, 80% 100%, 100% 80%, 70% 50%, 100% 20%, 80% 0%, 50% 30%)'; // Silang
                    scale = 'scale(calc(1.4 * var(--ebs, 1)))'; w = '22%'; h = '22%';
                    x = '0%'; y = '0%'; rotation = '-720deg'; 
                }
                transitionStr = 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)';
                break;
            default: // normal
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
                /* Glitch liar yang membesar dan nge-blur untuk MEMBUYARKAN transisi */
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
            
            {/* --- 1. SPHERE BODY DROPLET --- */}
            <div style={{
                position: 'absolute',
                width: size * config.baseRadiusScale * 2,
                height: size * config.baseRadiusScale * 2,
                borderRadius: '50%',
                backgroundColor: 'rgba(12, 10, 20, 0.7)',
                filter: 'blur(var(--mb, 0px))', // MOTION BLUR EFEK PANTULAN
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

            {/* --- 2. KANVAS AURA --- */}
            <canvas ref={canvasRef} className="pointer-events-none" style={{ display: 'block', filter: 'blur(1px) saturate(1.2)', position: 'absolute', zIndex: 10 }} />

            {/* --- 3. WRAPPER UTAMA MATA & SIMBOL --- */}
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
                    {/* BENTUK UTAMA (Mata / Checklist) */}
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

                    {/* LAYER GLITCH 1 (Warna Pink Neon, Normal Blend Mode agar TERTINDIH DI ATAS putih) */}
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
                                    clipPath: props.clipPath, transformOrigin: 'center 70%', opacity: 1 // Solid agar menutupi wujud asli
                                }} />
                            </div>
                        );
                    })}

                    {/* LAYER GLITCH 2 (Warna Indigo, Normal Blend Mode) */}
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
                                    clipPath: props.clipPath, transformOrigin: 'center 70%', opacity: 1 // Solid agar menutupi wujud asli
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

    const updateGlobal = (key, value) => {
        setConfig(prev => ({ 
            ...prev, 
            [key]: key === 'expression' ? value : Number(value) 
        }));
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#07070a] overflow-hidden relative font-sans">
            <button onClick={() => setDrawerOpen(!drawerOpen)} className="absolute top-6 left-6 z-50 flex items-center gap-2 bg-white/10 hover:bg-white/20 transition-colors px-4 py-2.5 rounded-full backdrop-blur-md border border-white/10 text-white/90 text-sm font-medium tracking-wide">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                {drawerOpen ? 'Tutup Config' : 'Buka Config'}
            </button>

            <div className={`absolute top-0 left-0 h-full w-[360px] bg-black/60 backdrop-blur-2xl border-r border-white/10 z-40 p-6 overflow-y-auto transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="mt-16 flex flex-col gap-8">
                    <div className="flex flex-col gap-4">
                        <div className="text-white/40 text-[10px] uppercase tracking-[0.2em] font-bold border-b border-white/10 pb-2">Global Settings</div>
                        <div className="flex flex-col gap-2">
                            <label className="text-xs text-white/70 flex justify-between"><span>Ekspresi & Status Looping</span></label>
                            <select value={config.expression} onChange={(e) => updateGlobal('expression', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-white/90 text-sm focus:outline-none focus:border-indigo-500 cursor-pointer">
                                <optgroup label="Emosi Dasar">
                                    <option value="normal" className="bg-[#07070a]">Normal</option>
                                    <option value="senang" className="bg-[#07070a]">Senang (Bintang & Lompat)</option>
                                    <option value="sedih" className="bg-[#07070a]">Sedih (Nunduk & Geleng)</option>
                                    <option value="marah" className="bg-[#07070a]">Marah (Bergetar Emosi)</option>
                                    <option value="kaget" className="bg-[#07070a]">Kaget (Melotot Melayang)</option>
                                    <option value="ngantuk" className="bg-[#07070a]">Ngantuk (Gepeng & Lambat)</option>
                                    <option value="lengkungan" className="bg-[#07070a]">Lengkungan (U U)</option>
                                </optgroup>
                                <optgroup label="Indikator Animasi Looping">
                                    <option value="berhasil" className="bg-[#091e0f] font-bold text-emerald-300">✅ Siklus Berhasil (Checklist)</option>
                                    <option value="gagal" className="bg-[#240a0e] font-bold text-rose-300">❌ Siklus Gagal (Silang)</option>
                                </optgroup>
                                <optgroup label="Automasi">
                                    <option value="shuffle" className="bg-[#1a103c] font-bold text-indigo-300">✨ Shuffle (Auto Morph Nature)</option>
                                </optgroup>
                            </select>
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-xs text-white/70 flex justify-between"><span>Global Speed</span><span className="font-mono">{config.globalSpeed.toFixed(1)}x</span></label>
                            <input type="range" min="0.1" max="3" step="0.1" value={config.globalSpeed} onChange={(e) => updateGlobal('globalSpeed', e.target.value)} className="accent-indigo-500" />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-xs text-white/70 flex justify-between"><span>Radius Lingkaran</span><span className="font-mono">{Math.round(config.baseRadiusScale * 100)}%</span></label>
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
                                <div className="flex flex-col gap-2"><label className="text-[10px] text-white/60">Blur Radius</label><input type="range" min="0" max="100" value={layer.blur} onChange={(e) => updateLayer(layer.id, 'blur', e.target.value)} className="accent-pink-500" /></div>
                                <div className="flex flex-col gap-2"><label className="text-[10px] text-white/60">Garis / Width</label><input type="range" min="1" max="20" value={layer.width} onChange={(e) => updateLayer(layer.id, 'width', e.target.value)} className="accent-pink-500" /></div>
                                <div className="flex flex-col gap-2"><label className="text-[10px] text-white/60">Wave 1 Amp</label><input type="range" min="0" max="30" value={layer.amp1} onChange={(e) => updateLayer(layer.id, 'amp1', e.target.value)} className="accent-orange-500" /></div>
                                <div className="flex flex-col gap-2"><label className="text-[10px] text-white/60">Wave 2 Amp</label><input type="range" min="0" max="30" value={layer.amp2} onChange={(e) => updateLayer(layer.id, 'amp2', e.target.value)} className="accent-orange-500" /></div>
                                <div className="flex flex-col gap-2"><label className="text-[10px] text-white/60">Wave 1 Speed</label><input type="range" min="-0.1" max="0.1" step="0.005" value={layer.s1} onChange={(e) => updateLayer(layer.id, 's1', e.target.value)} className="accent-blue-500" /></div>
                                <div className="flex flex-col gap-2"><label className="text-[10px] text-white/60">Wave 2 Speed</label><input type="range" min="-0.1" max="0.1" step="0.005" value={layer.s2} onChange={(e) => updateLayer(layer.id, 's2', e.target.value)} className="accent-blue-500" /></div>
                            </div>
                        </div>
                    ))}
                    <div className="h-10"></div> 
                </div>
            </div>

            <div className="relative flex flex-col items-center justify-center transition-all duration-500" style={{ transform: drawerOpen ? 'translateX(100px)' : 'translateX(0px)' }}>
                <div className="absolute w-[250px] h-[250px] bg-indigo-600/10 rounded-full blur-[80px]" />
                <AuraRing size={450} config={config} />
                <div className="absolute bottom-10 text-white/70 font-medium tracking-tight text-sm" style={{ letterSpacing: '-0.02em' }}>ANALYZING</div>
            </div>
        </div>
    );
}