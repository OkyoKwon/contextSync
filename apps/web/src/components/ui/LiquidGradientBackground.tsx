import { useRef, useEffect } from 'react';
import {
  WebGLRenderer,
  Scene,
  PerspectiveCamera,
  PlaneGeometry,
  ShaderMaterial,
  Mesh,
  Texture,
  Vector2,
} from 'three';

// --- TouchTexture: offscreen canvas tracking mouse trails for distortion ---

class TouchTexture {
  private readonly size = 64;
  private readonly maxAge = 120;
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  readonly texture: Texture;
  private trail: Array<{
    readonly x: number;
    readonly y: number;
    readonly age: number;
    readonly force: number;
  }> = [];

  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.size;
    this.canvas.height = this.size;
    this.ctx = this.canvas.getContext('2d')!;
    this.texture = new Texture(this.canvas);
    this.clear();
  }

  clear() {
    this.ctx.fillStyle = 'black';
    this.ctx.fillRect(0, 0, this.size, this.size);
  }

  addTouch(point: { x: number; y: number }) {
    const force = 0;
    this.trail = [...this.trail, { x: point.x, y: point.y, age: 0, force }];
  }

  update() {
    this.clear();
    this.trail = this.trail
      .map((p) => ({ ...p, age: p.age + 1, force: Math.min(p.force + 0.02, 1) }))
      .filter((p) => p.age < this.maxAge);

    for (const point of this.trail) {
      const intensity = 1 - point.age / this.maxAge;
      const radius = this.size * 0.15 * intensity;
      const px = point.x * this.size;
      const py = (1 - point.y) * this.size;

      const gradient = this.ctx.createRadialGradient(px, py, 0, px, py, radius);
      const alpha = Math.floor(255 * intensity * point.force);
      gradient.addColorStop(0, `rgba(255, 255, 255, ${alpha / 255})`);
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

      this.ctx.beginPath();
      this.ctx.fillStyle = gradient;
      this.ctx.arc(px, py, radius, 0, Math.PI * 2);
      this.ctx.fill();
    }

    this.texture.needsUpdate = true;
  }

  dispose() {
    this.texture.dispose();
  }
}

// --- GLSL Shaders ---

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform float uTime;
  uniform vec2 uResolution;
  uniform sampler2D uTouchTexture;
  varying vec2 vUv;

  // Simplex-style noise
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                       -0.577350269189626, 0.024390243902439);
    vec2 i = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
      + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy),
      dot(x12.zw, x12.zw)), 0.0);
    m = m * m;
    m = m * m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  void main() {
    vec2 uv = vUv;
    float aspect = uResolution.x / uResolution.y;
    vec2 uvAspect = vec2(uv.x * aspect, uv.y);

    // Touch distortion
    vec4 touch = texture2D(uTouchTexture, uv);
    float distortion = touch.r * 0.08;
    vec2 distortedUv = uv + vec2(
      snoise(uvAspect * 3.0 + uTime * 0.15) * distortion,
      snoise(uvAspect * 3.0 + uTime * 0.15 + 100.0) * distortion
    );

    // Animated gradient centers
    float t = uTime * 0.08;

    // Blue accent blob
    vec2 c1 = vec2(0.5 + sin(t * 1.1) * 0.3, 0.5 + cos(t * 0.9) * 0.3);
    float d1 = length(distortedUv - c1);
    vec3 col1 = vec3(0.231, 0.510, 0.965); // #3B82F6 blue

    // Dark navy blob
    vec2 c2 = vec2(0.3 + cos(t * 0.7) * 0.25, 0.7 + sin(t * 1.3) * 0.2);
    float d2 = length(distortedUv - c2);
    vec3 col2 = vec3(0.059, 0.090, 0.165); // #0F172A dark navy

    // Deep dark blob
    vec2 c3 = vec2(0.7 + sin(t * 0.8) * 0.2, 0.3 + cos(t * 1.1) * 0.25);
    float d3 = length(distortedUv - c3);
    vec3 col3 = vec3(0.078, 0.078, 0.078); // #141414 near-black

    // Subtle blue-purple blob
    vec2 c4 = vec2(0.5 + cos(t * 1.4) * 0.35, 0.5 + sin(t * 0.6) * 0.35);
    float d4 = length(distortedUv - c4);
    vec3 col4 = vec3(0.161, 0.290, 0.580); // muted blue

    // Dark accent blob
    vec2 c5 = vec2(0.4 + sin(t * 0.5) * 0.3, 0.6 + cos(t * 1.0) * 0.25);
    float d5 = length(distortedUv - c5);
    vec3 col5 = vec3(0.039, 0.055, 0.110); // very dark blue

    // Center glow blob
    vec2 c6 = vec2(0.5 + cos(t * 0.9) * 0.15, 0.5 + sin(t * 1.2) * 0.15);
    float d6 = length(distortedUv - c6);
    vec3 col6 = vec3(0.180, 0.400, 0.850); // lighter blue accent

    // Blend with smoothstep
    float spread = 0.45;
    float w1 = 1.0 - smoothstep(0.0, spread, d1);
    float w2 = 1.0 - smoothstep(0.0, spread, d2);
    float w3 = 1.0 - smoothstep(0.0, spread, d3);
    float w4 = 1.0 - smoothstep(0.0, spread * 0.8, d4);
    float w5 = 1.0 - smoothstep(0.0, spread, d5);
    float w6 = 1.0 - smoothstep(0.0, spread * 0.6, d6);

    vec3 base = vec3(0.055, 0.065, 0.100); // dark blue-gray base
    vec3 color = base;
    float totalWeight = w1 + w2 + w3 + w4 + w5 + w6 + 0.001;
    color = (col1 * w1 + col2 * w2 + col3 * w3 + col4 * w4 + col5 * w5 + col6 * w6 + base * 0.001) / totalWeight;

    // Rotating radial overlay for depth
    float angle = atan(distortedUv.y - 0.5, distortedUv.x - 0.5) + t * 0.3;
    float radial = 0.5 + 0.5 * sin(angle * 3.0 + snoise(uvAspect * 2.0 + t) * 2.0);
    color = mix(color, color * 1.15, radial * 0.15);

    // Film grain
    float grain = fract(sin(dot(uv * uTime, vec2(12.9898, 78.233))) * 43758.5453);
    color += (grain - 0.5) * 0.04;

    // Slight vignette
    float vignette = 1.0 - length(uv - 0.5) * 0.6;
    color *= vignette;

    gl_FragColor = vec4(color, 1.0);
  }
`;

// --- React Component ---

interface LiquidGradientBackgroundProps {
  readonly className?: string;
}

export function LiquidGradientBackground({ className }: LiquidGradientBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let renderer: WebGLRenderer;
    let rafId: number;

    try {
      renderer = new WebGLRenderer({ alpha: false, antialias: false });
    } catch {
      // WebGL not available — graceful fallback
      container.style.background = 'linear-gradient(135deg, #0F172A 0%, #141414 50%, #1e293b 100%)';
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    const scene = new Scene();
    const camera = new PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      100,
    );
    camera.position.z = 1;

    const touchTexture = new TouchTexture();

    const uniforms = {
      uTime: { value: 0 },
      uResolution: { value: new Vector2(container.clientWidth, container.clientHeight) },
      uTouchTexture: { value: touchTexture.texture },
    };

    const geometry = new PlaneGeometry(2, 2);
    const material = new ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms,
    });
    const mesh = new Mesh(geometry, material);
    scene.add(mesh);

    // Mouse/touch interaction
    const handlePointer = (clientX: number, clientY: number) => {
      const rect = container.getBoundingClientRect();
      const x = (clientX - rect.left) / rect.width;
      const y = (clientY - rect.top) / rect.height;
      touchTexture.addTouch({ x, y });
    };

    const onMouseMove = (e: MouseEvent) => handlePointer(e.clientX, e.clientY);
    const onTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (touch) {
        handlePointer(touch.clientX, touch.clientY);
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('touchmove', onTouchMove, { passive: true });

    // Resize
    const onResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      uniforms.uResolution.value.set(w, h);
    };
    window.addEventListener('resize', onResize);

    // Animation loop
    const startTime = performance.now();
    const animate = () => {
      uniforms.uTime.value = (performance.now() - startTime) * 0.001;
      touchTexture.update();
      renderer.render(scene, camera);
      rafId = requestAnimationFrame(animate);
    };
    rafId = requestAnimationFrame(animate);

    // Cleanup
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('resize', onResize);
      geometry.dispose();
      material.dispose();
      touchTexture.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={containerRef} className={className} />;
}
