import { useState, useEffect, useRef, FormEvent } from 'react';
import { Asterisk, Eye, EyeOff } from 'lucide-react';
import { SpectreAuthModal } from '@thewhitenigs/spectre-snap';

export default function App() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSpectreOpen, setIsSpectreOpen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl') || (canvas.getContext('experimental-webgl') as WebGLRenderingContext | null);
    if (!gl) return;

    const vsSource = `
      attribute vec4 a_position;
      void main() {
        gl_Position = a_position;
      }
    `;

    const fsSource = `
      precision highp float;
      uniform vec2 u_resolution;
      uniform float u_time;

      vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
      vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

      float snoise(vec3 v) {
        const vec2 C = vec2(1.0/6.0, 1.0/3.0);
        const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
        vec3 i = floor(v + dot(v, C.yyy));
        vec3 x0 = v - i + dot(i, C.xxx);
        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 i1 = min(g.xyz, l.zxy);
        vec3 i2 = max(g.xyz, l.zxy);
        vec3 x1 = x0 - i1 + C.xxx;
        vec3 x2 = x0 - i2 + C.yyy;
        vec3 x3 = x0 - D.yyy;
        i = mod289(i);
        vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
        float n_ = 0.142857142857;
        vec3 ns = n_ * D.wyz - D.xzx;
        vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
        vec4 x_ = floor(j * ns.z);
        vec4 y_ = floor(j - 7.0 * x_);
        vec4 x = x_ * ns.x + ns.yyyy;
        vec4 y = y_ * ns.x + ns.yyyy;
        vec4 h = 1.0 - abs(x) - abs(y);
        vec4 b0 = vec4(x.xy, y.xy);
        vec4 b1 = vec4(x.zw, y.zw);
        vec4 s0 = floor(b0) * 2.0 + 1.0;
        vec4 s1 = floor(b1) * 2.0 + 1.0;
        vec4 sh = -step(h, vec4(0.0));
        vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
        vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
        vec3 p0 = vec3(a0.xy, h.x);
        vec3 p1 = vec3(a0.zw, h.y);
        vec3 p2 = vec3(a1.xy, h.z);
        vec3 p3 = vec3(a1.zw, h.w);
        vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
        p0 *= norm.x;
        p1 *= norm.y;
        p2 *= norm.z;
        p3 *= norm.w;
        vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
        m = m * m;
        return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
      }

      float random(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
      }

      void main() {
        vec2 uv = gl_FragCoord.xy / u_resolution.xy;
        vec2 p = uv * 2.0 - 1.0;
        p.x *= u_resolution.x / u_resolution.y;

        float t = u_time * 0.3;

        vec3 noisePos = vec3(p.x * 1.5, p.y * 1.5, t * 0.5);
        float n1 = snoise(noisePos);
        float n2 = snoise(noisePos + vec3(2.0, -1.0, t * 0.2));

        vec3 bg = vec3(0.96, 0.96, 0.98);
        vec3 pink = vec3(0.95, 0.3, 0.6);
        vec3 blue = vec3(0.1, 0.3, 0.9);

        float d = length(p + vec2(n1 * 0.2, n2 * 0.3));

        vec3 col = bg;

        float pinkMix = smoothstep(1.0, -0.2, d + n1 * 0.5 - p.x * 0.5);
        float blueMix = smoothstep(1.1, -0.1, d + n2 * 0.5 + p.y * 0.5 + p.x * 0.2);

        col = mix(col, pink, pinkMix * 0.7);
        col = mix(col, blue, blueMix * 0.8);

        vec2 grainCoord = floor(gl_FragCoord.xy * 0.5);
        float grain = random(grainCoord + fract(u_time));
        col += (grain - 0.5) * 0.08;

        gl_FragColor = vec4(col, 1.0);
      }
    `;

    const loadShader = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      return shader;
    };

    const vertexShader = loadShader(gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl.FRAGMENT_SHADER, fsSource);

    const program = gl.createProgram();
    if (!program || !vertexShader || !fragmentShader) return;

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.useProgram(program);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1.0, -1.0,
       1.0, -1.0,
      -1.0,  1.0,
       1.0,  1.0,
    ]), gl.STATIC_DRAW);

    const positionAttributeLocation = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

    const timeLocation = gl.getUniformLocation(program, "u_time");
    const resolutionLocation = gl.getUniformLocation(program, "u_resolution");

    let animationFrameId: number;
    let lastTime = 0;
    let dynamicTime = 0;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        let width, height;

        if (entry.devicePixelContentBoxSize) {
          width = entry.devicePixelContentBoxSize[0].inlineSize;
          height = entry.devicePixelContentBoxSize[0].blockSize;
        } else if (entry.contentBoxSize) {
          width = Math.floor(entry.contentBoxSize[0].inlineSize);
          height = Math.floor(entry.contentBoxSize[0].blockSize);
        } else {
          width = Math.floor(entry.contentRect.width);
          height = Math.floor(entry.contentRect.height);
        }

        if (width > 0 && height > 0 && (canvas.width !== width || canvas.height !== height)) {
          canvas.width = width;
          canvas.height = height;
          gl.viewport(0, 0, width, height);
          gl.uniform2f(resolutionLocation, width, height);
        }
      }
    });

    try {
      resizeObserver.observe(canvas, { box: 'device-pixel-content-box' });
    } catch {
      resizeObserver.observe(canvas, { box: 'content-box' });
    }

    const render = (time: number) => {
      const deltaTime = (time - lastTime) * 0.001 || 0.016;
      lastTime = time;
      dynamicTime += deltaTime;

      gl.uniform1f(timeLocation, dynamicTime);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      resizeObserver.disconnect();
      cancelAnimationFrame(animationFrameId);
      gl.deleteProgram(program);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#f4f7fb] flex items-center justify-center p-4 font-sans">
      <div className="bg-white rounded-[2rem] shadow-sm w-full max-w-[1000px] grid grid-cols-1 md:grid-cols-2 p-3 overflow-hidden">

        <div className="relative w-full rounded-[1.5rem] p-8 md:p-10 flex flex-col justify-between overflow-hidden min-h-[500px]">
          <canvas
            ref={canvasRef}
            className="absolute inset-0 z-0 pointer-events-none"
            style={{ display: 'block', width: '100%', height: '100%' }}
          />

          <div className="relative z-10 text-white">
            <Asterisk className="w-10 h-10 stroke-[3]" />
          </div>

          <div className="relative z-10 text-white mt-auto">
            <p className="text-sm font-medium mb-3 opacity-90">You can easily</p>
            <h1 className="text-3xl md:text-[2.5rem] font-bold leading-[1.1] tracking-tight">
              Get access your personal hub for clarity and productivity
            </h1>
          </div>
        </div>

        <div className="w-full p-8 md:px-14 md:py-12 flex flex-col justify-center">
          <Asterisk className="w-8 h-8 text-[#4338ca] mb-6 stroke-[3]" />

          <h2 className="text-[2rem] font-bold text-gray-900 mb-3 tracking-tight">Create an account</h2>

          <p className="text-[#6b7280] text-sm mb-8 leading-relaxed pr-4">
            Access your tasks, notes, and projects anytime, anywhere - and keep everything flowing in one place.
          </p>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-gray-900">
                Your email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="farazhaidet786@gmail.com"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4338ca]/20 focus:border-[#4338ca] transition-all text-sm text-gray-900 placeholder-gray-400 font-medium"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-gray-900">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4338ca]/20 focus:border-[#4338ca] transition-all text-sm text-gray-900 placeholder-gray-400 tracking-widest font-medium"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-[#4f46e5] hover:bg-[#4338ca] text-white font-semibold py-3.5 rounded-xl transition-all shadow-[0_4px_14px_0_rgba(79,70,229,0.39)] hover:shadow-[0_6px_20px_rgba(79,70,229,0.23)] text-sm"
            >
              Get Started
            </button>
          </form>

          <div className="mt-8 relative flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative bg-white px-4 text-xs text-gray-400 font-medium">
              or continue with
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={() => setIsSpectreOpen(true)}
              className="flex-1 flex items-center justify-center py-2.5 bg-[#f3f4f6] hover:bg-gray-200 rounded-lg transition-colors"
            >
              <img src="/logo.svg" alt="Spectre" className="w-5 h-5" />
            </button>
            <button type="button" className="flex-1 flex items-center justify-center py-2.5 bg-[#f3f4f6] hover:bg-gray-200 rounded-lg transition-colors">
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            </button>
            <button type="button" className="flex-1 flex items-center justify-center py-2.5 bg-[#f3f4f6] hover:bg-gray-200 rounded-lg transition-colors">
              <svg className="w-5 h-5 text-[#1877F2]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </button>
          </div>

          <p className="mt-8 text-center text-sm text-gray-500 font-medium">
            Don't have an account? <a href="#" className="text-[#4f46e5] hover:underline font-semibold">Sign up</a>
          </p>
        </div>
      </div>

      <SpectreAuthModal
        open={isSpectreOpen}
        onOpenChange={setIsSpectreOpen}
        userId={email || 'anonymous'}
        mode="auto"
        onSuccess={(result) => {
          console.log('Spectre Authentication Successful:', result);
          setIsSpectreOpen(false);
          // Add your post-authentication logic here (e.g., redirect to dashboard)
        }}
        onFailed={(reason) => {
          console.error('Spectre Authentication Failed:', reason);
        }}
      />
    </div>
  );
}