import * as THREE from 'three';
import { getArchipelagoNode } from '../data/archipelago';
import { LEVEL_ORDER, type GsrLevelId } from '../levels/loader';
import type { GsrLevelDoc } from '../levels/schema';
import { buildDistantWorldDiorama } from './distantWorlds';
import { buildTransitCableCurve, getNeighborIslandPos } from './transitGates';

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

    float az = atan(d.z, d.x);

    // Pop-art halftone dot banding across lower/mid horizon
    float dotMask = smoothstep(-0.12, 0.04, y) * (1.0 - smoothstep(0.18, 0.38, y));
    float dots = step(0.58, sin(az * 90.0) * sin(y * 140.0));
    vec3 dotTint = mix(uRibbonA, uRibbonB, smoothstep(-0.12, 0.38, y));
    c = mix(c, dotTint, dots * dotMask * 0.12 * (0.5 + 0.5 * uHype));

    // Beat-reactive zig-zag / waveform horizon band
    float zig = 0.07 + 0.032 * abs(fract(az * 3.82 + uTime * 0.15) * 2.0 - 1.0) + 0.02 * uBeat * sin(az * 18.0);
    float wq = (y - zig) / 0.018;
    float waveBand = exp(-wq * wq);
    vec3 waveCol = mix(uRibbonA, uRibbonB, 0.5 + 0.5 * sin(az * 4.0 + uTime));
    c = mix(c, waveCol * 1.12, clamp(waveBand * (0.55 + 0.35 * uBeat + 0.15 * uHype), 0.0, 0.92));

    // Beat-reactive Aether aurora ribbons
    float amp = 0.6 + 0.65 * uHype + 0.35 * uBeat;
    float up = smoothstep(0.05, 0.28, y);
    c += (uRibbonA * ribbon(y, az, 0.44, 0.065, 0.0) + uRibbonB * ribbon(y, az, 0.56, 0.055, 2.3)) * 0.85 * amp * up;

    // Aether Sun / Broadcast Moon + comic speed-ray sunburst + concentric radio wave rings
    vec3 sunDir = normalize(vec3(0.32, 0.22, -0.92));
    float a = 1.0 - dot(d, sunDir);
    vec3 right = normalize(cross(vec3(0.0, 1.0, 0.0), sunDir));
    vec3 upVec = cross(sunDir, right);
    float sunAng = atan(dot(d, upVec), dot(d, right));
    float rays = smoothstep(0.35, 0.9, sin(sunAng * 16.0 - uTime * 1.4));
    float sunburst = rays * exp(-a * 4.5) * (0.2 + 0.35 * uBeat + 0.35 * uHype);
    float disc = 1.0 - smoothstep(0.0032, 0.0042, a);
    float halo = exp(-a * 32.0) * 0.85 + exp(-a * 5.0) * 0.28;
    float radioRing = sin(sqrt(max(0.0, a)) * 75.0 - uTime * 3.2) * 0.5 + 0.5;
    float ringMask = exp(-a * 12.0) * (0.25 + 0.45 * uBeat);
    c += uSunColor * sunburst;
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

type SkyThemeKey = 'velvet' | 'bongo' | 'kiln' | 'birdbath' | 'mulch' | 'mall' | 'citadel' | 'subsoil' | 'zenith';

const THEMES: Record<SkyThemeKey, SkyThemeColors> = {
  velvet: { top: '#240942', mid: '#80208c', bot: '#ff7ac8', ribbonA: '#00e5ff', ribbonB: '#ff4ecd', sun: '#ffd740' },
  bongo: { top: '#1d072e', mid: '#8f2e1c', bot: '#ff9100', ribbonA: '#ffd740', ribbonB: '#ff4ecd', sun: '#ffb74d' },
  kiln: { top: '#15061e', mid: '#6e1919', bot: '#ff4f1f', ribbonA: '#76ff03', ribbonB: '#ff6d00', sun: '#ffd740' },
  birdbath: { top: '#091438', mid: '#2f328c', bot: '#ff52d9', ribbonA: '#00e5ff', ribbonB: '#69f0ae', sun: '#b8f2ff' },
  mulch: { top: '#14051c', mid: '#4b114d', bot: '#ff5252', ribbonA: '#ff5252', ribbonB: '#ffd740', sun: '#00e5ff' },
  mall: { top: '#1c1238', mid: '#6a3c82', bot: '#4dd0e1', ribbonA: '#4dd0e1', ribbonB: '#ff8a80', sun: '#fff59d' },
  citadel: { top: '#14261c', mid: '#2e7d32', bot: '#ffd740', ribbonA: '#ffd740', ribbonB: '#69f0ae', sun: '#ffffff' },
  subsoil: { top: '#0d061c', mid: '#27154f', bot: '#7c4dff', ribbonA: '#7c4dff', ribbonB: '#ffab40', sun: '#ffab40' },
  zenith: { top: '#07070c', mid: '#262636', bot: '#dcd6f7', ribbonA: '#ffd740', ribbonB: '#ffffff', sun: '#ffd740' },
};

const AREA_THEME_ORDER: readonly SkyThemeKey[] = [
  'velvet', 'bongo', 'kiln', 'birdbath', 'mulch', 'mall', 'citadel', 'subsoil', 'zenith',
];

export function createRegionalSkybox(doc: GsrLevelDoc): RegionalSkybox {
  const group = new THREE.Group();
  const disposables: { dispose(): void }[] = [];
  const track = <T extends { dispose(): void }>(x: T): T => {
    disposables.push(x);
    return x;
  };

  const themeKey: SkyThemeKey = doc.data.skyTheme ?? AREA_THEME_ORDER[doc.data.areaNumber - 1] ?? 'velvet';
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
    } else if (themeKey === 'mulch' && i % 2 === 1) {
      const crt = new THREE.Mesh(track(new THREE.BoxGeometry(9, 10, 8)), track(new THREE.MeshStandardMaterial({ color: '#1b1428', emissive: '#ff5252', emissiveIntensity: 0.35 })));
      crt.position.y = 7;
      holder.add(crt);
    } else if (themeKey === 'mall' && i % 2 === 1) {
      const dome = new THREE.Mesh(track(new THREE.CylinderGeometry(10, 11, 2.2, 16)), track(new THREE.MeshStandardMaterial({ color: '#4dd0e1', emissive: '#ff8a80', emissiveIntensity: 0.3, transparent: true, opacity: 0.65 })));
      dome.position.y = 6;
      holder.add(dome);
    } else if (themeKey === 'citadel' && i % 2 === 1) {
      const spire = new THREE.Mesh(track(new THREE.ConeGeometry(5, 14, 6)), track(new THREE.MeshStandardMaterial({ color: '#2e7d32', emissive: '#ffd740', emissiveIntensity: 0.3 })));
      spire.position.y = 8;
      holder.add(spire);
    } else if (themeKey === 'subsoil' && i % 2 === 1) {
      const dish = new THREE.Mesh(track(new THREE.CylinderGeometry(8, 2, 5, 12)), track(new THREE.MeshStandardMaterial({ color: '#1a1030', emissive: '#7c4dff', emissiveIntensity: 0.45 })));
      dish.rotation.z = 0.45;
      dish.position.y = 8;
      holder.add(dish);
    } else if (themeKey === 'zenith' && i % 2 === 1) {
      const vinyl = new THREE.Mesh(track(new THREE.CylinderGeometry(8.5, 8.5, 0.5, 22)), track(new THREE.MeshStandardMaterial({ color: '#f4f4f0', emissive: '#ffd740', emissiveIntensity: 0.3 })));
      vinyl.rotation.x = 0.4;
      vinyl.position.y = 8.5;
      holder.add(vinyl);
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

  // Connected neighbor world dioramas (N+1, N-1, express links) + sweeping sky-ladder arc (N+1 -> N+2 -> N+3)
  const curIdx = LEVEL_ORDER.indexOf(doc.id as GsrLevelId);
  const archNode = getArchipelagoNode(doc.id as GsrLevelId);

  const addLeyLineSkyCable = (fromPos: THREE.Vector3, toPos: THREE.Vector3, color: string) => {
    const start = new THREE.Vector3(fromPos.x, fromPos.y + 1.5, fromPos.z);
    const end = new THREE.Vector3(toPos.x, toPos.y + 1.5, toPos.z);
    const mid = start.clone().lerp(end, 0.5);
    mid.y += Math.max(12, Math.abs(end.y - start.y) * 0.45);
    const curve = new THREE.CatmullRomCurve3([start, mid, end]);
    const mat = track(new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.72 }));
    group.add(new THREE.Mesh(track(new THREE.TubeGeometry(curve, 28, 0.3, 6, false)), mat));
  };

  if (archNode) {
    for (let i = 0; i < archNode.links.length; i++) {
      const link = archNode.links[i]!;
      const target = getArchipelagoNode(link.targetId);
      const nPos = getNeighborIslandPos(link);

      const nHolder = buildDistantWorldDiorama(target, track);
      nHolder.position.copy(nPos);
      nHolder.rotation.y = Math.atan2(-nPos.x, -nPos.z);

      group.add(nHolder);
      floaters.push({ obj: nHolder, baseY: nPos.y, phase: i * 1.7 + 0.5, spin: 0.04 });

      // Sweeping transit cable from the island's physical Transit Gate to the neighbor diorama
      const linkCurve = buildTransitCableCurve(link);
      const linkMat = track(new THREE.MeshBasicMaterial({ color: link.color, transparent: true, opacity: 0.72 }));
      group.add(new THREE.Mesh(track(new THREE.TubeGeometry(linkCurve, 28, 0.28, 6, false)), linkMat));
    }

    // Sweeping sky-ladder arc for upcoming worlds N+2 and N+3 extending past N+1
    const next1Id = curIdx >= 0 ? LEVEL_ORDER[curIdx + 1] : undefined;
    const primaryNextLink = next1Id ? archNode.links.find((l) => l.targetId === next1Id) : undefined;
    if (primaryNextLink) {
      let prevPos = getNeighborIslandPos(primaryNextLink);
      const arcSteps = [
        { offset: 2, dist: 205, elevAboveBase: 42, bearingOffset: 0.26, scale: 1.25 },
        { offset: 3, dist: 265, elevAboveBase: 72, bearingOffset: 0.52, scale: 1.45 },
      ] as const;

      for (const step of arcSteps) {
        const nextId = LEVEL_ORDER[curIdx + step.offset];
        if (!nextId) break;
        const targetNode = getArchipelagoNode(nextId);
        const bearing = primaryNextLink.vistaBearing + step.bearingOffset;
        const pos = new THREE.Vector3(
          Math.cos(bearing) * step.dist,
          18 + step.elevAboveBase,
          Math.sin(bearing) * step.dist,
        );

        const diorama = buildDistantWorldDiorama(targetNode, track);
        diorama.position.copy(pos);
        diorama.scale.setScalar(step.scale);
        diorama.rotation.y = Math.atan2(-pos.x, -pos.z);

        group.add(diorama);
        floaters.push({ obj: diorama, baseY: pos.y, phase: step.offset * 1.9 + 0.8, spin: 0.04 });

        addLeyLineSkyCable(prevPos, pos, targetNode.color);
        prevPos = pos;
      }
    }
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
