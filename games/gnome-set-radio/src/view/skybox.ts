import * as THREE from 'three';
import type { GsrLevelDoc } from '../levels/schema';

export interface RegionalSkybox {
  group: THREE.Group;
  update(t: number, beatPulse: number, hype: number): void;
  dispose(): void;
}

const SKY_VERT = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const SKY_FRAG = /* glsl */ `
  uniform float uTime;
  uniform float uBeat;
  uniform float uHype;
  uniform vec3 uTop;
  uniform vec3 uMid;
  uniform vec3 uBot;
  uniform vec3 uRibbonA;
  uniform vec3 uRibbonB;
  uniform vec3 uSunColor;
  varying vec3 vDir;

  float hash(vec3 p) {
    return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453);
  }

  float ribbon(float y, float az, float yc, float w, float ph) {
    float wave = yc + 0.08 * sin(az * 3.0 + ph + uTime * 0.22);
    float q = (y - wave) / w;
    return exp(-q * q) * (0.55 + 0.45 * sin(az * 6.0 - uTime * 0.45 + ph));
  }

  void main() {
    vec3 d = normalize(vDir);
    float y = d.y;

    vec3 c;
    if (y >= 0.0) {
      c = y < 0.28
        ? mix(uBot, uMid, y / 0.28)
        : mix(uMid, uTop, clamp((y - 0.28) / 0.72, 0.0, 1.0));
    } else {
      c = mix(uBot, uTop * 0.45, clamp(-y / 0.65, 0.0, 1.0));
    }

    // Twinkling stars in upper dome
    vec3 g = d * 150.0;
    float r = hash(floor(g));
    float core = 1.0 - smoothstep(0.0, 0.32, length(fract(g) - 0.5));
    float star = step(0.985, r) * core * (0.65 + 0.35 * sin(uTime * 2.2 + r * 60.0));
    c += vec3(1.0, 0.96, 0.9) * star * smoothstep(0.18, 0.45, y);

    // Beat-reactive Aether aurora ribbons
    float az = atan(d.z, d.x);
    float amp = 0.6 + 0.65 * uHype + 0.35 * uBeat;
    float up = smoothstep(0.05, 0.28, y);
    c += (uRibbonA * ribbon(y, az, 0.44, 0.065, 0.0) + uRibbonB * ribbon(y, az, 0.56, 0.055, 2.3)) * 0.85 * amp * up;

    // Aether Sun / Broadcast Moon + concentric radio wave rings
    vec3 sunDir = normalize(vec3(0.32, 0.22, -0.92));
    float a = 1.0 - dot(d, sunDir);
    float disc = 1.0 - smoothstep(0.0032, 0.0042, a);
    float halo = exp(-a * 32.0) * 0.85 + exp(-a * 5.0) * 0.28;
    float radioRing = sin(sqrt(max(0.0, a)) * 75.0 - uTime * 3.2) * 0.5 + 0.5;
    float ringMask = exp(-a * 12.0) * (0.25 + 0.45 * uBeat);
    c = mix(c, vec3(1.0, 0.97, 0.88), disc);
    c += uSunColor * (halo + radioRing * ringMask * 0.35);

    gl_FragColor = vec4(c, 1.0);
  }
`;

interface SkyThemeColors {
  top: string;
  mid: string;
  bot: string;
  ribbonA: string;
  ribbonB: string;
  sun: string;
}

const THEMES: Record<'velvet' | 'bongo' | 'kiln' | 'birdbath', SkyThemeColors> = {
  velvet: { top: '#240942', mid: '#80208c', bot: '#ff7ac8', ribbonA: '#00e5ff', ribbonB: '#ff4ecd', sun: '#ffd740' },
  bongo: { top: '#1d072e', mid: '#8f2e1c', bot: '#ff9100', ribbonA: '#ffd740', ribbonB: '#ff4ecd', sun: '#ffb74d' },
  kiln: { top: '#15061e', mid: '#6e1919', bot: '#ff4f1f', ribbonA: '#76ff03', ribbonB: '#ff6d00', sun: '#ffd740' },
  birdbath: { top: '#091438', mid: '#2f328c', bot: '#ff52d9', ribbonA: '#00e5ff', ribbonB: '#69f0ae', sun: '#b8f2ff' },
};

export function createRegionalSkybox(doc: GsrLevelDoc): RegionalSkybox {
  const group = new THREE.Group();
  const disposables: { dispose(): void }[] = [];
  const track = <T extends { dispose(): void }>(x: T): T => {
    disposables.push(x);
    return x;
  };

  const themeKey = doc.data.skyTheme ?? (doc.data.areaNumber === 2 ? 'bongo' : doc.data.areaNumber === 3 ? 'kiln' : doc.data.areaNumber === 4 ? 'birdbath' : 'velvet');
  const pal = THEMES[themeKey];

  const uniforms = {
    uTime: { value: 0 },
    uBeat: { value: 0 },
    uHype: { value: 0.3 },
    uTop: { value: new THREE.Color(pal.top) },
    uMid: { value: new THREE.Color(pal.mid) },
    uBot: { value: new THREE.Color(pal.bot) },
    uRibbonA: { value: new THREE.Color(pal.ribbonA) },
    uRibbonB: { value: new THREE.Color(pal.ribbonB) },
    uSunColor: { value: new THREE.Color(pal.sun) },
  };

  const skyGeo = track(new THREE.SphereGeometry(340, 32, 20));
  const skyMat = track(
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms,
      vertexShader: SKY_VERT,
      fragmentShader: SKY_FRAG,
    }),
  );
  const skyMesh = new THREE.Mesh(skyGeo, skyMat);
  skyMesh.renderOrder = -1;
  skyMesh.frustumCulled = false;
  group.add(skyMesh);

  // Floating horizon vista landmarks outside the island (r = 115..200m)
  const floaters: { obj: THREE.Object3D; baseY: number; phase: number; spin: number }[] = [];
  const islandGeo = track(new THREE.ConeGeometry(12, 16, 7));
  islandGeo.rotateX(Math.PI);
  const islandMat = track(new THREE.MeshStandardMaterial({ color: '#241738', roughness: 0.9 }));
  const capMat = track(new THREE.MeshStandardMaterial({ color: pal.bot, emissive: pal.mid, emissiveIntensity: 0.35, roughness: 0.7 }));
  const capGeo = track(new THREE.CylinderGeometry(12.2, 12.2, 1.4, 7));
  const ringMat = track(new THREE.MeshBasicMaterial({ color: pal.ribbonA, transparent: true, opacity: 0.55 }));
  const ringGeo = track(new THREE.TorusGeometry(14, 0.35, 8, 28));

  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2 + 0.3;
    const dist = 128 + (i % 3) * 26;
    const baseY = 14 + (i % 4) * 11;
    const holder = new THREE.Group();
    holder.position.set(Math.cos(angle) * dist, baseY, Math.sin(angle) * dist);

    const body = new THREE.Mesh(islandGeo, islandMat);
    body.position.y = -8.5;
    holder.add(body);
    const cap = new THREE.Mesh(capGeo, capMat);
    cap.position.y = 0.2;
    holder.add(cap);

    if (i % 2 === 0) {
      const halo = new THREE.Mesh(ringGeo, ringMat);
      halo.rotation.x = Math.PI / 2 + (i % 3) * 0.2;
      halo.position.y = 4;
      holder.add(halo);
    }

    // Regional landmark accent
    if (themeKey === 'velvet' && i % 2 === 1) {
      const vinyl = new THREE.Mesh(track(new THREE.CylinderGeometry(7, 7, 0.4, 20)), track(new THREE.MeshStandardMaterial({ color: '#140c24', roughness: 0.4 })));
      vinyl.rotation.z = 0.35;
      vinyl.position.y = 9;
      holder.add(vinyl);
    } else if (themeKey === 'kiln' && i % 2 === 1) {
      const stack = new THREE.Mesh(track(new THREE.CylinderGeometry(2.8, 3.6, 18, 10)), track(new THREE.MeshStandardMaterial({ color: '#2b1e24', emissive: '#ff4f1f', emissiveIntensity: 0.3 })));
      stack.position.y = 9.5;
      holder.add(stack);
    } else if (themeKey === 'birdbath' && i % 2 === 1) {
      const bowl = new THREE.Mesh(track(new THREE.CylinderGeometry(9, 4, 4, 14)), track(new THREE.MeshStandardMaterial({ color: '#243a6b', emissive: '#00e5ff', emissiveIntensity: 0.35 })));
      bowl.position.y = 7;
      holder.add(bowl);
    }

    group.add(holder);
    floaters.push({ obj: holder, baseY, phase: i * 1.1, spin: (i % 2 === 0 ? 1 : -1) * 0.08 });
  }

  // Overhead ley-line sky arcs connecting distant islands
  const arcMat = track(new THREE.MeshBasicMaterial({ color: pal.ribbonB, transparent: true, opacity: 0.45 }));
  for (let i = 0; i < 4; i++) {
    const a0 = (i / 4) * Math.PI * 2;
    const a1 = a0 + Math.PI * 0.48;
    const r = 135;
    const pts = [
      new THREE.Vector3(Math.cos(a0) * r, 18, Math.sin(a0) * r),
      new THREE.Vector3(Math.cos((a0 + a1) * 0.5) * (r * 0.88), 46 + i * 5, Math.sin((a0 + a1) * 0.5) * (r * 0.88)),
      new THREE.Vector3(Math.cos(a1) * r, 22, Math.sin(a1) * r),
    ];
    const curve = new THREE.CatmullRomCurve3(pts);
    const arcGeo = track(new THREE.TubeGeometry(curve, 24, 0.35, 6, false));
    group.add(new THREE.Mesh(arcGeo, arcMat));
  }

  return {
    group,
    update(t, beatPulse, hype) {
      uniforms.uTime.value = t;
      uniforms.uBeat.value = beatPulse;
      uniforms.uHype.value = hype;
      for (const f of floaters) {
        f.obj.position.y = f.baseY + Math.sin(t * 0.45 + f.phase) * 2.2;
        f.obj.rotation.y += f.spin * 0.008;
      }
    },
    dispose() {
      for (const d of disposables) d.dispose();
    },
  };
}
