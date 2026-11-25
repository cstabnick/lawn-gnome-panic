// Three.js 3D renderer for Gnomelock (The Bramble District):
// - Terrain, flatLayer markings (@lawn/depth), non-flush parkour walls & towers (no z-fighting!)
// - Player gnomes via @lawn/gnome + @lawn/prefabs held weapons
// - Creeps with execute-pip HP bars, Soul Acorn Orbs, 5-min Gilded Relic, tracers, clay shatter particles, and 3rd-person camera.
import * as THREE from 'three';
import { flatLayer, LAYER } from '@lawn/depth';
import {
  createGnomeModel,
  getMyGnome,
  onLooksChanged,
  resolveLook,
  type GnomeLook,
  type GnomeModel,
} from '@lawn/gnome';
import { buildHeld, buildPrefab } from '@lawn/prefabs';
import { applyHeroAnimation, createHeroAnimState, triggerCastAnim, triggerShotAnim, type HeroAnimState } from './heroAnim';
import { attachHeroGear, HERO_LOOKS, HERO_SCALES } from './heroModels';
import { VfxSystem } from './particles';
import { TEAM_COLORS, type HeroId, type Team } from './sim/config';
import { HEROES } from './sim/heroes';
import {
  FOUNTAINS,
  groundHeightAt,
  JUNGLE_CAMPS,
  MAP_BOUNDS,
  MAP_WALLS,
  RELIC_ALTAR,
  SHOPS,
  STRUCTURES,
} from './sim/map';
import type { HeroEntity, MatchState, SimEvent } from './sim/world';
import { createBombExplosionVfx, createSpellVfx, type SpellFx } from './spellVfx';

interface Tracer {
  line: THREE.Line;
  ttl: number;
}

interface Particle {
  mesh: THREE.Mesh;
  vx: number;
  vy: number;
  vz: number;
  ttl: number;
}

interface TowerVisual {
  group: THREE.Group;
  shieldMesh: THREE.Mesh;
  beamMesh: THREE.Mesh;
  haloMesh: THREE.Mesh | null;
  hpBarFill: THREE.Mesh;
}

export class GnomelockScene {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene: THREE.Scene;
  readonly camera: THREE.PerspectiveCamera;

  private heroModels = new Map<
    number,
    {
      model: GnomeModel;
      weaponName: string;
      team: Team;
      shieldRing: THREE.Mesh;
      hpGroup: THREE.Group;
      hpFill: THREE.Mesh;
      shieldFill: THREE.Mesh;
      gearUpdate?: (dt: number, t: number) => void;
    }
  >();
  private creepMeshes = new Map<number, { group: THREE.Group; hpGroup: THREE.Group; hpFill: THREE.Mesh; execPip: THREE.Mesh }>();
  private neutralMeshes = new Map<number, { group: THREE.Group; hpGroup: THREE.Group; hpFill: THREE.Mesh }>();
  private orbMeshes = new Map<number, THREE.Group>();
  private turretMeshes = new Map<number, THREE.Group>();
  private zoneMeshes = new Map<number, THREE.Object3D>();
  private towerVisuals = new Map<string, TowerVisual>();
  private relicGroup: THREE.Group;
  private relicCrystal: THREE.Mesh;
  private relicHpGroup: THREE.Group;
  private relicHpFill: THREE.Mesh;
  private tracers: Tracer[] = [];
  private particles: Particle[] = [];
  private spellFx: SpellFx[] = [];
  private heroAnims = new Map<number, HeroAnimState>();
  private skyUniforms = { uTime: { value: 0 } };
  private vfx: VfxSystem;
  private shakeMag = 0;
  private currentFov = 74;
  private camPos = new THREE.Vector3(0, 6, -120);
  private camLook = new THREE.Vector3(0, 3, -100);
  private lastHeroMeta = new Map<number, { userId?: string; characterCode?: string; team: Team; heroId: HeroId }>();
  private muzzleLight: THREE.PointLight;
  private skyMesh!: THREE.Mesh;
  private aetherFloaters: { group: THREE.Object3D; baseY: number; speed: number; phase: number; spinY: number }[] = [];
  private aetherRings: THREE.Mesh[] = [];
  private aimRecoil = 0;
  private lastLocalSlot = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1b2236);
    this.scene.fog = new THREE.Fog(0x1b2236, 75, 195);

    this.camera = new THREE.PerspectiveCamera(74, window.innerWidth / window.innerHeight, 0.15, 340);

    // Lighting: twilight garden + warm Amber Hearth & cool Sapphire Well accents
    const hemi = new THREE.HemisphereLight(0xaec6ff, 0x3b4d2b, 1.05);
    this.scene.add(hemi);

    const sun = new THREE.DirectionalLight(0xffe6c2, 1.35);
    sun.position.set(42, 68, 28);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.near = 10;
    sun.shadow.camera.far = 190;
    sun.shadow.camera.left = -60;
    sun.shadow.camera.right = 60;
    sun.shadow.camera.top = 130;
    sun.shadow.camera.bottom = -130;
    this.scene.add(sun);

    const amberLight = new THREE.PointLight(0xff6b35, 3.5, 45);
    amberLight.position.set(0, 7, -110);
    this.scene.add(amberLight);

    const sapphireLight = new THREE.PointLight(0x3a86ff, 3.5, 45);
    sapphireLight.position.set(0, 7, 110);
    this.scene.add(sapphireLight);

    this.muzzleLight = new THREE.PointLight(0xffd54f, 0, 12);
    this.scene.add(this.muzzleLight);

    this.vfx = new VfxSystem(this.scene);
    this.buildSkybox();
    this.buildAether();
    this.buildArena();
    const relic = this.buildRelicAltar();
    this.relicGroup = relic.group;
    this.relicCrystal = relic.crystal;
    this.relicHpGroup = relic.hpGroup;
    this.relicHpFill = relic.hpFill;

    window.addEventListener('resize', this.onResize);
    onLooksChanged(() => {
      // Rebuild remote hero models when prefetchLooks resolves gear
      for (const [slot] of this.heroModels) {
        if (slot !== 0) this.removeHeroModel(slot);
      }
    });
  }

  private onResize = () => {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  };

  private buildSkybox(): void {
    const geo = new THREE.SphereGeometry(240, 40, 24);
    const mat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      uniforms: this.skyUniforms,
      vertexShader: `
        varying vec3 vDir;
        void main() {
          vDir = normalize(position);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        varying vec3 vDir;
        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
        }
        void main() {
          vec3 d = normalize(vDir);
          float h = clamp(d.y * 0.5 + 0.5, 0.0, 1.0);
          vec3 zenith = vec3(0.05, 0.07, 0.16);
          vec3 mid = vec3(0.14, 0.16, 0.29);
          vec3 horizon = vec3(0.24, 0.20, 0.34);
          vec3 col = mix(horizon, mid, smoothstep(0.45, 0.7, h));
          col = mix(col, zenith, smoothstep(0.65, 0.98, h));

          // Amber (-Z) vs Sapphire (+Z) directional horizon glow
          float horizMask = exp(-abs(d.y) * 5.2);
          float amberSide = smoothstep(0.0, 0.85, -d.z);
          float sapphireSide = smoothstep(0.0, 0.85, d.z);
          col += vec3(0.55, 0.20, 0.08) * horizMask * amberSide;
          col += vec3(0.10, 0.28, 0.62) * horizMask * sapphireSide;

          // Diagonal aether nebula band across the zenith
          float nebula = exp(-abs(d.x * 0.7 + d.z * 0.4 - 0.15) * 3.8) * smoothstep(0.1, 0.7, d.y);
          col += vec3(0.18, 0.10, 0.28) * nebula * 0.85;

          // Shimmering aether aurora ribbons
          if (d.y > 0.06) {
            float wave = sin(d.x * 6.5 + uTime * 0.35 + sin(d.z * 4.0) * 1.4);
            float auroraBand = smoothstep(0.08, 0.35, d.y) * (1.0 - smoothstep(0.38, 0.76, d.y));
            vec3 aurCol = mix(vec3(0.65, 0.25, 0.45), vec3(0.14, 0.58, 0.72), smoothstep(-0.5, 0.5, d.z));
            col += aurCol * pow(max(0.0, wave), 2.0) * auroraBand * 0.42;
          }

          // Drifting twilight cloud ribbons
          if (d.y > 0.02) {
            float c1 = sin(d.x * 5.5 + uTime * 0.08) * cos(d.z * 4.5 - uTime * 0.05);
            float cloudBand = smoothstep(0.04, 0.38, d.y) * (1.0 - smoothstep(0.38, 0.72, d.y));
            col += vec3(0.14, 0.12, 0.22) * max(0.0, c1) * cloudBand * 0.65;
          }

          // Crisp pinpoint twinkling stars
          if (d.y > 0.14) {
            vec2 uv = d.xz / max(0.22, d.y) * 24.0;
            vec2 cell = floor(uv);
            vec2 f = fract(uv) - 0.5;
            float r = hash(cell);
            if (r > 0.92) {
              vec2 jOff = vec2(hash(cell + 13.7) - 0.5, hash(cell + 29.3) - 0.5) * 0.55;
              float star = smoothstep(0.16, 0.02, length(f - jOff));
              float tw = 0.55 + 0.45 * sin(uTime * 2.8 + r * 80.0);
              col += vec3(0.95, 0.92, 1.0) * star * tw * smoothstep(0.14, 0.45, d.y);
            }
          }

          // Crescent moon high in the western sky + soft halo
          vec3 moonDir = normalize(vec3(-0.45, 0.62, -0.35));
          float mDot = dot(d, moonDir);
          float moonHalo = exp(-acos(clamp(mDot, -1.0, 1.0)) * 18.0);
          col += vec3(0.32, 0.28, 0.22) * moonHalo;
          float moonDisc = smoothstep(0.9965, 0.9978, mDot);
          vec3 cutDir = normalize(moonDir + vec3(0.028, 0.022, 0.0));
          float cutDisc = smoothstep(0.9965, 0.9978, dot(d, cutDir));
          float crescent = max(0.0, moonDisc - cutDisc);
          col += vec3(1.0, 0.92, 0.68) * crescent * 1.1;

          gl_FragColor = vec4(col, 1.0);
        }
      `,
    });
    const sky = new THREE.Mesh(geo, mat);
    sky.frustumCulled = false;
    sky.renderOrder = -1000;
    sky.userData.zfightOk = true;
    this.skyMesh = sky;
    this.scene.add(sky);
  }

  private buildAether(): void {
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x3b4254, roughness: 0.9 });
    const mossMat = new THREE.MeshStandardMaterial({ color: 0x3b6344, roughness: 0.85 });

    // 8 floating stylized garden islands / monoliths ringing the distant sky
    for (let i = 0; i < 8; i++) {
      const ang = (i / 8) * Math.PI * 2 + 0.25;
      const rad = 76 + (i % 3) * 18;
      const x = Math.cos(ang) * rad;
      const z = Math.sin(ang) * rad;
      const baseY = 26 + (i % 4) * 8;
      const isAmber = z < 0;
      const crystalCol = isAmber ? 0xff7a3d : 0x4fd8ff;

      const grp = new THREE.Group();
      grp.position.set(x, baseY, z);

      const rock = new THREE.Mesh(new THREE.ConeGeometry(4.2, 6.2, 6), stoneMat);
      rock.rotation.x = Math.PI;
      rock.position.y = -3.2;
      rock.userData.zfightOk = true;

      const turf = new THREE.Mesh(new THREE.CylinderGeometry(4.5, 4.3, 0.7, 6), mossMat);
      turf.position.y = 0.25;
      turf.userData.zfightOk = true;

      const spire = new THREE.Mesh(
        new THREE.OctahedronGeometry(1.15, 0),
        new THREE.MeshBasicMaterial({ color: crystalCol }),
      );
      spire.scale.set(0.8, 1.8, 0.8);
      spire.position.y = 2.6;
      spire.userData.zfightOk = true;

      grp.add(rock, turf, spire);
      this.scene.add(grp);
      this.aetherFloaters.push({ group: grp, baseY, speed: 0.6 + (i % 3) * 0.2, phase: i * 0.9, spinY: 0.08 * (i % 2 === 0 ? 1 : -1) });
    }

    // 2 huge translucent astral rings tilted high in the zenith
    const ringSpecs = [
      { r: 62, tube: 0.35, y: 58, col: 0x74b9ff, rx: 0.42, rz: 0.28 },
      { r: 88, tube: 0.28, y: 72, col: 0xffb347, rx: -0.35, rz: -0.4 },
    ];
    for (const rs of ringSpecs) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(rs.r, rs.tube, 8, 64),
        new THREE.MeshBasicMaterial({ color: rs.col, transparent: true, opacity: 0.22 }),
      );
      ring.position.set(0, rs.y, 0);
      ring.rotation.set(rs.rx, 0, rs.rz);
      ring.userData.zfightOk = true;
      this.scene.add(ring);
      this.aetherRings.push(ring);
    }

    // 18 high-altitude aether lantern wisps drifting around the perimeter
    const wispGeo = new THREE.OctahedronGeometry(0.65, 0);
    for (let i = 0; i < 18; i++) {
      const ang = (i / 18) * Math.PI * 2;
      const rad = 46 + (i % 4) * 8;
      const x = Math.cos(ang) * rad;
      const z = Math.sin(ang) * rad;
      const baseY = 18 + (i % 5) * 5;
      const col = z < 0 ? 0xffd166 : 0x5cc8ff;
      const wisp = new THREE.Mesh(wispGeo, new THREE.MeshBasicMaterial({ color: col }));
      wisp.position.set(x, baseY, z);
      wisp.userData.zfightOk = true;
      this.scene.add(wisp);
      this.aetherFloaters.push({ group: wisp, baseY, speed: 1.1 + (i % 3) * 0.3, phase: i * 1.3, spinY: 1.2 });
    }
  }

  private buildArena(): void {
    // 1. Deformed terrain mesh matching groundHeightAt(x, z) with Amber (-Z) vs Sapphire (+Z) garden themes
    const w = MAP_BOUNDS.maxX - MAP_BOUNDS.minX;
    const d = MAP_BOUNDS.maxZ - MAP_BOUNDS.minZ;
    const geo = new THREE.PlaneGeometry(w, d, 38, 122);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const c = new THREE.Color();
    const cAmber = new THREE.Color();
    const cSapphire = new THREE.Color();

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const y = groundHeightAt(x, z);
      pos.setY(i, y);

      const sideBlend = Math.max(0, Math.min(1, (z + 14) / 28)); // 0 = Amber (-Z), 1 = Sapphire (+Z)
      if (Math.abs(x) < 6.5) {
        cAmber.setHex(0x6b4b3e); // Warm terracotta cobble
        cSapphire.setHex(0x3b4a62); // Cool slate-blue cobble
      } else if (Math.abs(x) > 19 && Math.abs(z) < 46) {
        cAmber.setHex(0x5b6332); // Warm golden-moss terrace
        cSapphire.setHex(0x2a5f58); // Cool teal-moss terrace
      } else {
        cAmber.setHex(0x475229); // Autumn russet turf
        cSapphire.setHex(0x254b42); // Moonlit pine turf
      }
      c.copy(cAmber).lerp(cSapphire, sideBlend);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();

    const groundMat = flatLayer(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.92 }), LAYER.ground);
    const ground = new THREE.Mesh(geo, groundMat);
    ground.receiveShadow = true;
    this.scene.add(ground);

    // 2. Center courtyard ring & lane stripes using @lawn/depth
    const ringGeo = new THREE.RingGeometry(7.2, 8.2, 32);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = flatLayer(new THREE.MeshStandardMaterial({ color: 0xd4a017, roughness: 0.7 }), LAYER.marking);
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.set(0, groundHeightAt(0, 0) + 0.02, 0);
    this.scene.add(ring);

    // Fountain pads
    for (const team of [0, 1] as const) {
      const f = FOUNTAINS[team];
      const fGeo = new THREE.CircleGeometry(f.radius, 24);
      fGeo.rotateX(-Math.PI / 2);
      const fMat = flatLayer(
        new THREE.MeshStandardMaterial({ color: team === 0 ? 0x6b2824 : 0x1e3f6b, roughness: 0.6 }),
        LAYER.area,
      );
      const fMesh = new THREE.Mesh(fGeo, fMat);
      fMesh.position.set(f.x, groundHeightAt(f.x, f.z) + 0.02, f.z);
      this.scene.add(fMesh);
    }

    // Jungle camp pads
    for (const camp of JUNGLE_CAMPS) {
      const cGeo = new THREE.RingGeometry(2.6, 3.3, 20);
      cGeo.rotateX(-Math.PI / 2);
      const cMesh = new THREE.Mesh(
        cGeo,
        flatLayer(new THREE.MeshBasicMaterial({ color: 0x6f8f3a, transparent: true, opacity: 0.45 }), LAYER.area),
      );
      cMesh.position.set(camp.x, groundHeightAt(camp.x, camp.z) + 0.03, camp.z);
      this.scene.add(cMesh);
    }

    // 3. Parkour walls & garden sheds (non-flush trims so zero z-fighting!)
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x7a6958, roughness: 0.85 });
    const trimMat = new THREE.MeshStandardMaterial({ color: 0x4f6d3a, roughness: 0.8 });
    const shedMat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.85 });

    for (const wb of MAP_WALLS) {
      const grp = new THREE.Group();
      grp.position.set(wb.x, wb.y, wb.z);
      const box = new THREE.Mesh(
        new THREE.BoxGeometry(wb.w, wb.h, wb.d),
        wb.kind === 'shed' ? shedMat : wallMat,
      );
      box.position.y = wb.h * 0.5;
      box.castShadow = true;
      box.receiveShadow = true;
      grp.add(box);

      // Proud top cap (+0.14m wider & +0.18m taller, never flush!)
      const cap = new THREE.Mesh(
        new THREE.BoxGeometry(wb.w + 0.24, 0.28, wb.d + 0.24),
        trimMat,
      );
      cap.position.y = wb.h + 0.14;
      cap.castShadow = true;
      grp.add(cap);
      this.scene.add(grp);
    }

    // Shop lanterns
    for (const s of SHOPS) {
      const sy = groundHeightAt(s.x, s.z);
      const post = new THREE.Mesh(
        new THREE.CylinderGeometry(0.14, 0.18, 2.8, 8),
        new THREE.MeshStandardMaterial({ color: 0x3b3d42 }),
      );
      post.position.set(s.x, sy + 1.4, s.z);
      const lamp = new THREE.Mesh(
        new THREE.SphereGeometry(0.35, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xffd166 }),
      );
      lamp.position.set(s.x, sy + 2.95, s.z);
      this.scene.add(post, lamp);
    }

    // 3b. Faction-themed garden props: Amber Hearth (-Z) vs Sapphire Well (+Z)
    const amberBannerSpots: [number, number][] = [
      [-14, -44], [14, -44], [-14, -74], [14, -74], [-22, -58], [22, -58],
    ];
    for (const [bx, bz] of amberBannerSpots) {
      const by = groundHeightAt(bx, bz);
      const ped = new THREE.Mesh(
        new THREE.CylinderGeometry(0.55, 0.72, 0.7, 8),
        new THREE.MeshStandardMaterial({ color: 0x7a4a38, roughness: 0.8 }),
      );
      ped.position.set(bx, by + 0.35, bz);
      const ember = new THREE.Mesh(
        new THREE.SphereGeometry(0.42, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xff6b35 }),
      );
      ember.position.set(bx, by + 0.95, bz);
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, 3.8, 6),
        new THREE.MeshStandardMaterial({ color: 0x4a2c18 }),
      );
      pole.position.set(bx + (bx < 0 ? -1.1 : 1.1), by + 1.9, bz);
      const flag = new THREE.Mesh(
        new THREE.BoxGeometry(0.95, 1.35, 0.08),
        new THREE.MeshStandardMaterial({ color: 0xd93636, roughness: 0.7 }),
      );
      flag.position.set(bx + (bx < 0 ? -0.55 : 0.55), by + 3.05, bz);
      this.scene.add(ped, ember, pole, flag);
    }

    const sapphireBannerSpots: [number, number][] = [
      [-14, 44], [14, 44], [-14, 74], [14, 74], [-22, 58], [22, 58],
    ];
    for (const [bx, bz] of sapphireBannerSpots) {
      const by = groundHeightAt(bx, bz);
      const ped = new THREE.Mesh(
        new THREE.CylinderGeometry(0.52, 0.68, 0.7, 8),
        new THREE.MeshStandardMaterial({ color: 0x45566e, roughness: 0.8 }),
      );
      ped.position.set(bx, by + 0.35, bz);
      const crystal = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.46, 0),
        new THREE.MeshBasicMaterial({ color: 0x4fd8ff }),
      );
      crystal.position.set(bx, by + 1.1, bz);
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, 3.8, 6),
        new THREE.MeshStandardMaterial({ color: 0x26283a }),
      );
      pole.position.set(bx + (bx < 0 ? -1.1 : 1.1), by + 1.9, bz);
      const flag = new THREE.Mesh(
        new THREE.BoxGeometry(0.95, 1.35, 0.08),
        new THREE.MeshStandardMaterial({ color: 0x2f64c9, roughness: 0.7 }),
      );
      flag.position.set(bx + (bx < 0 ? -0.55 : 0.55), by + 3.05, bz);
      this.scene.add(ped, crystal, pole, flag);
    }

    // 3c. Overhead Stone Garden Arches + Hanging Lanterns + Perimeter Mushrooms + Workshop Prefab Props
    for (const az of [-60, -24, 24, 60]) {
      const isAmber = az < 0;
      const col = isAmber ? 0xff6b35 : 0x4fd8ff;
      const ay = groundHeightAt(0, az);
      const arch = new THREE.Group();
      arch.position.set(0, ay, az);
      const colGeo = new THREE.BoxGeometry(1.1, 7.6, 1.1);
      const pL = new THREE.Mesh(colGeo, wallMat);
      pL.position.set(-10.5, 3.8, 0);
      const pR = new THREE.Mesh(colGeo, wallMat);
      pR.position.set(10.5, 3.8, 0);
      const lintel = new THREE.Mesh(new THREE.BoxGeometry(22.6, 0.9, 1.35), trimMat);
      lintel.position.set(0, 8.05, 0);
      const lantern = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.48, 0),
        new THREE.MeshBasicMaterial({ color: col }),
      );
      lantern.position.set(0, 7.0, 0);
      arch.add(pL, pR, lintel, lantern);
      this.scene.add(arch);
    }

    // Perimeter giant garden mushrooms & mossy boulders
    for (let mz = -85; mz <= 85; mz += 28) {
      for (const side of [-1, 1]) {
        const mx = side * 34.5;
        const my = groundHeightAt(mx, mz);
        const capCol = mz < 0 ? 0xc8402e : 0x2f8fd0;
        const stem = new THREE.Mesh(
          new THREE.CylinderGeometry(0.32, 0.48, 1.6, 8),
          new THREE.MeshStandardMaterial({ color: 0xf0e6d0, roughness: 0.8 }),
        );
        stem.position.set(mx, my + 0.8, mz);
        const cap = new THREE.Mesh(
          new THREE.ConeGeometry(1.35, 1.1, 10),
          new THREE.MeshStandardMaterial({ color: capCol, roughness: 0.65 }),
        );
        cap.position.set(mx, my + 2.0, mz);
        this.scene.add(stem, cap);
      }
    }

    // @lawn/prefabs workshop props near mid-lane sheds & base shops
    const propPlacements: { id: string; x: number; z: number; scale: number; rotY?: number }[] = [
      { id: 'wooden-chest', x: -21.2, z: -2.4, scale: 1.4, rotY: 0.5 },
      { id: 'clay-jar', x: -21.0, z: 2.5, scale: 1.5 },
      { id: 'watering-can', x: 21.2, z: -2.4, scale: 1.5, rotY: -0.5 },
      { id: 'torch', x: 21.0, z: 2.6, scale: 1.4 },
      { id: 'wooden-chest', x: -5.5, z: -114, scale: 1.4 },
      { id: 'clay-jar', x: 5.5, z: -114, scale: 1.5 },
      { id: 'wooden-chest', x: -5.5, z: 114, scale: 1.4 },
      { id: 'clay-jar', x: 5.5, z: 114, scale: 1.5 },
    ];
    for (const pp of propPlacements) {
      const m = buildPrefab(pp.id, { scale: pp.scale });
      m.position.set(pp.x, groundHeightAt(pp.x, pp.z), pp.z);
      if (pp.rotY) m.rotation.y = pp.rotY;
      this.scene.add(m);
    }

    // 4. Structures (T1-T3 + Ancient Ceramic Patron)
    for (const st of STRUCTURES) {
      const grp = new THREE.Group();
      const sy = groundHeightAt(st.x, st.z);
      grp.position.set(st.x, sy, st.z);

      const teamCol = TEAM_COLORS[st.team];
      const baseH = st.tier === 4 ? 4.4 : 2.6 + st.tier * 0.65;
      const baseR = st.radius * 0.72;

      const plinth = new THREE.Mesh(
        new THREE.CylinderGeometry(baseR * 0.85, baseR, baseH, 10),
        new THREE.MeshStandardMaterial({ color: 0xd9cbb8, roughness: 0.7 }),
      );
      plinth.position.y = baseH * 0.5;
      plinth.castShadow = true;
      grp.add(plinth);

      // Team ceramic hat cap (proud of plinth)
      const cap = new THREE.Mesh(
        new THREE.ConeGeometry(baseR * 1.15, st.tier === 4 ? 2.4 : 1.5, 10),
        new THREE.MeshStandardMaterial({ color: teamCol, roughness: 0.55 }),
      );
      cap.position.y = baseH + (st.tier === 4 ? 1.2 : 0.75);
      cap.castShadow = true;
      grp.add(cap);

      // Glowing core orb
      const orb = new THREE.Mesh(
        new THREE.SphereGeometry(baseR * 0.45, 10, 10),
        new THREE.MeshBasicMaterial({ color: st.team === 0 ? 0xff9f43 : 0x54a0ff }),
      );
      orb.position.y = baseH + (st.tier === 4 ? 2.6 : 1.7);
      grp.add(orb);

      // Translucent invulnerability shield
      const shieldMesh = new THREE.Mesh(
        new THREE.SphereGeometry(st.radius * 1.45, 14, 12),
        new THREE.MeshBasicMaterial({ color: teamCol, transparent: true, opacity: 0.22, wireframe: true }),
      );
      shieldMesh.position.y = baseH * 0.6;
      grp.add(shieldMesh);

      // Range ring on ground using @lawn/depth
      const rRingGeo = new THREE.RingGeometry(st.range - 0.22, st.range, 36);
      rRingGeo.rotateX(-Math.PI / 2);
      const rRing = new THREE.Mesh(
        rRingGeo,
        flatLayer(new THREE.MeshBasicMaterial({ color: teamCol, transparent: true, opacity: 0.25 }), LAYER.marker),
      );
      rRing.position.y = 0.03;
      grp.add(rRing);

      // Floating HP bar
      const hpBg = new THREE.Mesh(
        new THREE.PlaneGeometry(3.2, 0.34),
        new THREE.MeshBasicMaterial({ color: 0x111111, side: THREE.DoubleSide }),
      );
      hpBg.position.y = baseH + 3.1;
      const hpBarFill = new THREE.Mesh(
        new THREE.PlaneGeometry(3.04, 0.22),
        new THREE.MeshBasicMaterial({ color: teamCol, side: THREE.DoubleSide }),
      );
      hpBarFill.position.set(0, baseH + 3.1, 0.04);
      grp.add(hpBg, hpBarFill);

      // 4 stone buttresses around tower plinth (proud of plinth)
      for (let bi = 0; bi < 4; bi++) {
        const ang = (bi * Math.PI) / 2 + Math.PI / 4;
        const buttress = new THREE.Mesh(
          new THREE.BoxGeometry(0.45, baseH * 0.55, 0.7),
          new THREE.MeshStandardMaterial({ color: 0x7a6958, roughness: 0.85 }),
        );
        buttress.position.set(Math.cos(ang) * baseR * 0.88, baseH * 0.28, Math.sin(ang) * baseR * 0.88);
        buttress.rotation.y = -ang;
        grp.add(buttress);
      }

      // Rotating Patron halo for tier 4
      let haloMesh: THREE.Mesh | null = null;
      if (st.tier === 4) {
        haloMesh = new THREE.Mesh(
          new THREE.TorusGeometry(baseR * 1.4, 0.14, 8, 24),
          new THREE.MeshBasicMaterial({ color: teamCol }),
        );
        haloMesh.position.y = baseH + 2.6;
        grp.add(haloMesh);
      }

      // Tower 3D glowing cylinder beam
      const beamMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.14, 0.14, 1, 8),
        new THREE.MeshBasicMaterial({ color: st.team === 0 ? 0xff7a1a : 0x4fd8ff, transparent: true, opacity: 0.85 }),
      );
      beamMesh.visible = false;
      this.scene.add(beamMesh);

      this.scene.add(grp);
      this.towerVisuals.set(st.id, { group: grp, shieldMesh, beamMesh, haloMesh, hpBarFill });
    }
  }

  private buildRelicAltar(): { group: THREE.Group; crystal: THREE.Mesh; hpGroup: THREE.Group; hpFill: THREE.Mesh } {
    const group = new THREE.Group();
    const gy = groundHeightAt(RELIC_ALTAR.x, RELIC_ALTAR.z);
    group.position.set(RELIC_ALTAR.x, gy, RELIC_ALTAR.z);

    const ped = new THREE.Mesh(
      new THREE.CylinderGeometry(1.4, 1.8, 0.9, 10),
      new THREE.MeshStandardMaterial({ color: 0x5c574f, roughness: 0.8 }),
    );
    ped.position.y = 0.45;
    group.add(ped);

    const crystal = new THREE.Mesh(
      new THREE.OctahedronGeometry(1.15, 0),
      new THREE.MeshStandardMaterial({ color: 0xffd54f, emissive: 0xb8860b, emissiveIntensity: 0.7, roughness: 0.25 }),
    );
    crystal.position.y = 2.3;
    crystal.visible = false;
    group.add(crystal);

    const hpGroup = new THREE.Group();
    hpGroup.position.y = 3.9;
    hpGroup.visible = false;
    const hpBg = new THREE.Mesh(
      new THREE.PlaneGeometry(2.6, 0.26),
      new THREE.MeshBasicMaterial({ color: 0x111111, side: THREE.DoubleSide }),
    );
    hpBg.userData.zfightOk = true;
    const hpFill = new THREE.Mesh(
      new THREE.PlaneGeometry(2.48, 0.18),
      new THREE.MeshBasicMaterial({ color: 0xffd54f, side: THREE.DoubleSide }),
    );
    hpFill.position.z = 0.04;
    hpFill.userData.zfightOk = true;
    hpGroup.add(hpBg, hpFill);
    group.add(hpGroup);

    this.scene.add(group);
    return { group, crystal, hpGroup, hpFill };
  }

  private removeHeroModel(slot: number): void {
    const entry = this.heroModels.get(slot);
    if (!entry) return;
    this.scene.remove(entry.model.object);
    this.heroModels.delete(slot);
  }

  private ensureHeroModel(
    h: HeroEntity,
    localSlot: number,
  ): {
    model: GnomeModel;
    shieldRing: THREE.Mesh;
    hpGroup: THREE.Group;
    hpFill: THREE.Mesh;
    shieldFill: THREE.Mesh;
    gearUpdate?: (dt: number, t: number) => void;
  } {
    const prev = this.lastHeroMeta.get(h.slot);
    if (
      prev &&
      (prev.userId !== h.userId ||
        prev.characterCode !== h.characterCode ||
        prev.team !== h.team ||
        prev.heroId !== h.heroId)
    ) {
      this.removeHeroModel(h.slot);
    }

    let entry = this.heroModels.get(h.slot);
    if (!entry) {
      let baseLook: GnomeLook | null = null;
      if (h.slot === localSlot) {
        baseLook = getMyGnome()?.look ?? null;
      } else if (h.characterCode) {
        baseLook = resolveLook({ id: h.slot, character: h.characterCode, userId: h.userId });
      }
      const look: GnomeLook = {
        ...(baseLook ?? HERO_LOOKS[h.heroId]),
        hat: TEAM_COLORS[h.team],
      };
      const model = createGnomeModel(look, { overrideEquipment: ['hand', 'back'] });
      model.rig.scale.set(...HERO_SCALES[h.heroId]);
      const { update: gearUpdate } = attachHeroGear(model, h.heroId);
      const weaponId = HEROES[h.heroId].weapon.prefabId;
      const held = buildHeld(weaponId);
      held.rotation.x = Math.PI / 2;
      held.position.set(0, -0.22, 0.04);
      model.arms.right.add(held);

      const shieldRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.65, 0.05, 8, 18),
        new THREE.MeshBasicMaterial({ color: 0xffb347 }),
      );
      shieldRing.rotation.x = Math.PI / 2;
      shieldRing.position.y = 0.6;
      shieldRing.visible = false;
      model.object.add(shieldRing);

      // Overhead billboarded hero HP + shield bar
      const hpGroup = new THREE.Group();
      hpGroup.position.y = 1.68;
      const isEnemy = h.team !== (this.lastHeroMeta.get(localSlot)?.team ?? 0);
      const hpBg = new THREE.Mesh(
        new THREE.PlaneGeometry(1.26, 0.18),
        new THREE.MeshBasicMaterial({ color: 0x111520, side: THREE.DoubleSide }),
      );
      hpBg.userData.zfightOk = true;
      const hpFill = new THREE.Mesh(
        new THREE.PlaneGeometry(1.18, 0.11),
        new THREE.MeshBasicMaterial({ color: isEnemy ? 0xff4d6d : 0x2ecc71, side: THREE.DoubleSide }),
      );
      hpFill.position.z = 0.03;
      hpFill.userData.zfightOk = true;
      const shieldFill = new THREE.Mesh(
        new THREE.PlaneGeometry(1.18, 0.05),
        new THREE.MeshBasicMaterial({ color: 0xffd54f, side: THREE.DoubleSide }),
      );
      shieldFill.position.set(0, 0.1, 0.04);
      shieldFill.visible = false;
      shieldFill.userData.zfightOk = true;
      hpGroup.add(hpBg, hpFill, shieldFill);
      hpGroup.visible = h.slot !== localSlot;
      model.object.add(hpGroup);

      this.scene.add(model.object);
      entry = { model, weaponName: weaponId, team: h.team, shieldRing, hpGroup, hpFill, shieldFill, gearUpdate };
      this.heroModels.set(h.slot, entry);
      this.lastHeroMeta.set(h.slot, { userId: h.userId, characterCode: h.characterCode, team: h.team, heroId: h.heroId });
    }
    return entry;
  }

  spawnEvents(events: readonly SimEvent[], state?: MatchState): void {
    const getAnim = (slot: number, heroId: HeroId): HeroAnimState => {
      let a = this.heroAnims.get(slot);
      if (!a) {
        a = createHeroAnimState(heroId);
        this.heroAnims.set(slot, a);
      }
      return a;
    };

    for (const ev of events) {
      if (ev.type === 'shot') {
        const h = state?.heroes[ev.slot];
        const heroId = h?.heroId ?? 'fernwick';
        triggerShotAnim(getAnim(ev.slot, heroId));
        const yaw = h?.yaw ?? 0;
        const rightX = Math.cos(yaw);
        const rightZ = -Math.sin(yaw);
        const mx = ev.ox + rightX * 0.34;
        const my = ev.oy - 0.06;
        const mz = ev.oz + rightZ * 0.34;
        this.muzzleLight.position.set(mx, my + 0.15, mz);
        this.muzzleLight.intensity = 3.6;
        this.vfx.spawnProjectile(heroId, ev.team, mx, my, mz, ev.tx, ev.ty, ev.tz, ev.hitKind);
        if (ev.slot === this.lastLocalSlot) {
          this.shakeMag = Math.max(this.shakeMag, 0.048);
          this.aimRecoil = Math.min(0.055, this.aimRecoil + 0.022);
        }
      } else if (ev.type === 'lastHit') {
        this.vfx.burst(ev.x, ev.y + 0.5, ev.z, 0xffd54f, 12, { speed: 7.5, up: 4.5, scale: 0.9, ttl: 0.45 });
      } else if (ev.type === 'orbConfirm' || ev.type === 'orbDeny') {
        const col = ev.type === 'orbConfirm' ? 0xffd54f : 0xff4d6d;
        this.vfx.burst(ev.x, ev.y, ev.z, col, 12, { speed: 8, up: 4.5 });
      } else if (ev.type === 'heroKill') {
        this.vfx.burst(ev.x, ev.y, ev.z, 0xd9814f, 24, { speed: 10, up: 7, ttl: 0.75 });
        this.vfx.burst(ev.x, ev.y, ev.z, 0xffd54f, 10, { speed: 7, up: 5, ttl: 0.55 });
        this.shakeMag = Math.max(this.shakeMag, 0.18);
      } else if (ev.type === 'towerDown') {
        this.vfx.burst(ev.x, ev.y + 1.5, ev.z, 0xd9cbb8, 28, { speed: 12, up: 9, scale: 1.5, ttl: 0.9 });
        this.vfx.burst(ev.x, ev.y + 1.5, ev.z, 0xff7a1a, 14, { speed: 9, up: 6, ttl: 0.7 });
        this.shakeMag = Math.max(this.shakeMag, 0.3);
      } else if (ev.type === 'moveTech') {
        const h = state?.heroes[ev.slot];
        if (h) {
          const p = h.move.pos;
          const col = ev.kind === 'wallJump' ? 0x8ce99a : ev.kind === 'dash' ? 0x74b9ff : 0xd9cbb8;
          this.vfx.dustPuff(p.x, p.y, p.z, col, 5, 1.8);
        }
      } else if (ev.type === 'dashJump') {
        const h = state?.heroes[ev.slot];
        if (h) {
          this.vfx.dustPuff(h.move.pos.x, h.move.pos.y, h.move.pos.z, 0x74b9ff, 8, 2.4);
        }
      } else if (ev.type === 'ability') {
        triggerCastAnim(getAnim(ev.slot, ev.heroId), ev.heroId, ev.ability);
        this.vfx.burst(ev.x, ev.y + 0.3, ev.z, ev.team === 0 ? 0xffb347 : 0x74b9ff, 6, { speed: 4.5, up: 2.5, scale: 0.65, ttl: 0.28 });
        if (ev.ability === 'X') this.shakeMag = Math.max(this.shakeMag, 0.2);
        this.spellFx.push(
          createSpellVfx(this.scene, this.vfx, ev.heroId, ev.ability, ev.x, ev.y, ev.z, ev.tx, ev.ty, ev.tz),
        );
      } else if (ev.type === 'bombExplode') {
        this.shakeMag = Math.max(this.shakeMag, 0.22);
        this.spellFx.push(createBombExplosionVfx(this.scene, this.vfx, ev.x, ev.y, ev.z, ev.radius));
      }
    }
  }

  sync(state: MatchState, localSlot: number, ads: boolean, dt: number): void {
    this.lastLocalSlot = localSlot;
    this.skyUniforms.uTime.value = state.timeS;
    for (const fl of this.aetherFloaters) {
      fl.group.position.y = fl.baseY + Math.sin(state.timeS * fl.speed + fl.phase) * 1.4;
      fl.group.rotation.y += fl.spinY * dt;
    }
    for (const ring of this.aetherRings) {
      ring.rotation.z += dt * 0.045;
    }
    // 1. Update Heroes
    const localTeamForBars = state.heroes[localSlot]?.team ?? 0;
    for (const h of state.heroes) {
      const entry = this.ensureHeroModel(h, localSlot);
      const { model, shieldRing, hpGroup, hpFill, shieldFill, gearUpdate } = entry;
      if (model.object.visible) gearUpdate?.(dt, state.timeS);
      const visible = h.alive && !(h.stealthTimer > 0 && h.team !== localTeamForBars);
      model.object.visible = visible;
      if (visible) {
        model.update(
          {
            position: new THREE.Vector3(h.move.pos.x, h.move.pos.y, h.move.pos.z),
            velocity: new THREE.Vector3(h.move.vel.x, h.move.vel.y, h.move.vel.z),
            facing: h.yaw + Math.PI, // gnome model faces +Z, gameplay yaw=0 faces -Z
            grounded: h.move.grounded,
            jumpsUsed: h.move.flipTimer > 0 ? 2 : h.move.grounded ? 0 : 1,
          },
          dt,
        );
        // Layered combat, movement, air-strafe banking, and ability-cast animations
        let anim = this.heroAnims.get(h.slot);
        if (!anim) {
          anim = createHeroAnimState(h.heroId);
          this.heroAnims.set(h.slot, anim);
        }
        applyHeroAnimation(model, h, anim, dt, state.timeS);
        shieldRing.visible = h.shield > 0;

        // Update overhead HP bar
        if (h.slot !== localSlot) {
          hpGroup.visible = h.alive;
          hpGroup.lookAt(this.camera.position);
          const frac = Math.max(0.01, Math.min(1, h.hp / h.maxHp));
          hpFill.scale.x = frac;
          hpFill.position.x = -(1 - frac) * 0.59;
          (hpFill.material as THREE.MeshBasicMaterial).color.setHex(
            h.team !== localTeamForBars ? 0xff4d6d : 0x2ecc71,
          );
          if (h.shield > 0) {
            const sFrac = Math.min(1, h.shield / h.maxHp);
            shieldFill.visible = true;
            shieldFill.scale.x = sFrac;
            shieldFill.position.x = -(1 - sFrac) * 0.59;
          } else {
            shieldFill.visible = false;
          }
        } else {
          hpGroup.visible = false;
        }
      }
    }
    this.muzzleLight.intensity = Math.max(0, this.muzzleLight.intensity - dt * 28);

    // 2. Sync Creeps
    const activeCreepIds = new Set<number>();
    for (const cr of state.creeps) {
      activeCreepIds.add(cr.id);
      let cEntry = this.creepMeshes.get(cr.id);
      if (!cEntry) {
        const group = new THREE.Group();
        const scale = cr.kind === 'super' ? 1.35 : cr.kind === 'ranged' ? 0.9 : 1.0;
        const body = new THREE.Mesh(
          new THREE.CylinderGeometry(0.24 * scale, 0.3 * scale, 0.65 * scale, 8),
          new THREE.MeshStandardMaterial({ color: 0xd9cbb8, roughness: 0.8 }),
        );
        body.position.y = 0.32 * scale;
        const hat = new THREE.Mesh(
          new THREE.ConeGeometry(0.32 * scale, 0.45 * scale, 8),
          new THREE.MeshStandardMaterial({ color: TEAM_COLORS[cr.team] }),
        );
        hat.position.y = 0.85 * scale;
        const hpGroup = new THREE.Group();
        hpGroup.position.y = 1.35 * scale;
        const hpBg = new THREE.Mesh(
          new THREE.PlaneGeometry(0.9, 0.12),
          new THREE.MeshBasicMaterial({ color: 0x111111, side: THREE.DoubleSide }),
        );
        hpBg.userData.zfightOk = true;
        const hpFill = new THREE.Mesh(
          new THREE.PlaneGeometry(0.84, 0.08),
          new THREE.MeshBasicMaterial({ color: cr.team === 0 ? 0xff5a5a : 0x4fd8ff, side: THREE.DoubleSide }),
        );
        hpFill.position.set(0, 0, 0.03);
        hpFill.userData.zfightOk = true;
        const execPip = new THREE.Mesh(
          new THREE.PlaneGeometry(0.14, 0.14),
          new THREE.MeshBasicMaterial({ color: 0xffd54f, side: THREE.DoubleSide }),
        );
        execPip.position.set(0, 0.2, 0.03);
        execPip.visible = false;
        execPip.userData.zfightOk = true;
        hpGroup.add(hpBg, hpFill, execPip);
        group.add(body, hat, hpGroup);
        this.scene.add(group);
        cEntry = { group, hpGroup, hpFill, execPip };
        this.creepMeshes.set(cr.id, cEntry);
      }
      cEntry.group.position.set(cr.x, cr.y, cr.z);
      const frac = Math.max(0.01, cr.hp / cr.maxHp);
      cEntry.hpFill.scale.x = frac;
      cEntry.hpGroup.quaternion.copy(this.camera.quaternion);
      cEntry.execPip.visible = cr.hp <= 65; // Last-hit execute indicator!
    }
    for (const [id, entry] of this.creepMeshes) {
      if (!activeCreepIds.has(id)) {
        this.scene.remove(entry.group);
        this.creepMeshes.delete(id);
      }
    }

    // 2b. Sync Neutral Jungle Creeps (Clay Beetles & Moss Golems)
    const activeNeutralIds = new Set<number>();
    for (const n of state.neutrals) {
      activeNeutralIds.add(n.id);
      let nEntry = this.neutralMeshes.get(n.id);
      if (!nEntry) {
        const group = new THREE.Group();
        const isGolem = n.kind === 'golem';
        const body = new THREE.Mesh(
          isGolem ? new THREE.DodecahedronGeometry(0.75, 0) : new THREE.SphereGeometry(0.46, 10, 8),
          new THREE.MeshStandardMaterial({ color: isGolem ? 0x5c7a3b : 0x8b5a2b, roughness: 0.85 }),
        );
        body.position.y = isGolem ? 0.8 : 0.45;
        if (!isGolem) body.scale.set(1.1, 0.75, 1.3);
        const eye1 = new THREE.Mesh(
          new THREE.SphereGeometry(0.09, 6, 6),
          new THREE.MeshBasicMaterial({ color: 0xffd54f }),
        );
        eye1.position.set(-0.2, isGolem ? 0.95 : 0.55, isGolem ? 0.62 : 0.48);
        const eye2 = eye1.clone();
        eye2.position.x = 0.2;
        const hpGroup = new THREE.Group();
        hpGroup.position.y = isGolem ? 1.85 : 1.15;
        const hpBg = new THREE.Mesh(
          new THREE.PlaneGeometry(1.1, 0.14),
          new THREE.MeshBasicMaterial({ color: 0x111111, side: THREE.DoubleSide }),
        );
        hpBg.userData.zfightOk = true;
        const hpFill = new THREE.Mesh(
          new THREE.PlaneGeometry(1.02, 0.09),
          new THREE.MeshBasicMaterial({ color: 0xffa94d, side: THREE.DoubleSide }),
        );
        hpFill.position.z = 0.03;
        hpFill.userData.zfightOk = true;
        hpGroup.add(hpBg, hpFill);
        group.add(body, eye1, eye2, hpGroup);
        this.scene.add(group);
        nEntry = { group, hpGroup, hpFill };
        this.neutralMeshes.set(n.id, nEntry);
      }
      nEntry.group.position.set(n.x, n.y, n.z);
      const nFrac = Math.max(0.01, n.hp / n.maxHp);
      nEntry.hpFill.scale.x = nFrac;
      nEntry.hpGroup.quaternion.copy(this.camera.quaternion);
    }
    for (const [id, entry] of this.neutralMeshes) {
      if (!activeNeutralIds.has(id)) {
        this.scene.remove(entry.group);
        this.neutralMeshes.delete(id);
      }
    }

    // 3. Sync Soul Acorn Orbs
    const activeOrbIds = new Set<number>();
    const localTeam = state.heroes[localSlot]?.team ?? 0;
    for (const orb of state.orbs) {
      activeOrbIds.add(orb.id);
      let grp = this.orbMeshes.get(orb.id);
      if (!grp) {
        grp = new THREE.Group();
        const isOwn = orb.team === localTeam;
        const col = isOwn ? 0xffd54f : 0xff4d6d;
        const sphere = new THREE.Mesh(
          new THREE.SphereGeometry(0.32, 10, 10),
          new THREE.MeshBasicMaterial({ color: col }),
        );
        const halo = new THREE.Mesh(
          new THREE.TorusGeometry(0.45, 0.04, 6, 16),
          new THREE.MeshBasicMaterial({ color: 0xffffff }),
        );
        halo.rotation.x = Math.PI / 2;
        grp.add(sphere, halo);
        this.scene.add(grp);
        this.orbMeshes.set(orb.id, grp);
      }
      grp.position.set(orb.x, orb.y, orb.z);
      grp.rotation.y += dt * 4.5;
    }
    for (const [id, grp] of this.orbMeshes) {
      if (!activeOrbIds.has(id)) {
        this.scene.remove(grp);
        this.orbMeshes.delete(id);
      }
    }

    // 4. Sync Structures & Beams
    for (const st of state.structures) {
      const vis = this.towerVisuals.get(st.id);
      if (!vis) continue;
      vis.group.visible = st.hp > 0;
      vis.shieldMesh.visible = st.invulnerable && st.hp > 0;
      vis.hpBarFill.scale.x = Math.max(0.01, st.hp / st.maxHp);
      vis.beamMesh.visible = false;
      if (vis.haloMesh) vis.haloMesh.rotation.y += dt * 1.4;
      if (st.hp > 0 && st.targetId) {
        let tx = st.x;
        let ty = st.y + 1;
        let tz = st.z;
        let hasBeamTarget = false;
        if (st.targetId.startsWith('hero:')) {
          const slot = Number(st.targetId.split(':')[1]);
          const th = state.heroes[slot];
          if (th && th.alive) {
            tx = th.move.pos.x;
            ty = th.move.pos.y + 0.8;
            tz = th.move.pos.z;
            hasBeamTarget = true;
          }
        } else if (st.targetId.startsWith('creep:')) {
          const cid = Number(st.targetId.split(':')[1]);
          const tc = state.creeps.find((c) => c.id === cid);
          if (tc) {
            tx = tc.x;
            ty = tc.y + 0.5;
            tz = tc.z;
            hasBeamTarget = true;
          }
        }
        if (hasBeamTarget) {
          const start = new THREE.Vector3(st.x, st.y + (st.tier === 4 ? 5.9 : 4.1 + st.tier * 0.65), st.z);
          const end = new THREE.Vector3(tx, ty, tz);
          const dist = Math.max(0.5, start.distanceTo(end));
          vis.beamMesh.visible = true;
          vis.beamMesh.position.copy(start).lerp(end, 0.5);
          vis.beamMesh.scale.set(1, dist, 1);
          vis.beamMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), end.sub(start).normalize());
        }
      }
    }

    // 5. Relic
    this.relicCrystal.visible = state.relic.alive;
    this.relicHpGroup.visible = state.relic.alive;
    if (state.relic.alive) {
      this.relicCrystal.rotation.y += dt * 1.4;
      this.relicCrystal.position.y = 2.3 + Math.sin(state.timeS * 2.5) * 0.25;
      this.relicHpGroup.quaternion.copy(this.camera.quaternion);
      const rFrac = Math.max(0.01, state.relic.hp / state.relic.maxHp);
      this.relicHpFill.scale.x = rFrac;
    }

    // 6. Turrets & Zones
    const activeTurrets = new Set<number>();
    for (const tu of state.turrets) {
      activeTurrets.add(tu.id);
      let m = this.turretMeshes.get(tu.id);
      if (!m) {
        m = new THREE.Group();
        const base = new THREE.Mesh(
          new THREE.CylinderGeometry(0.35, 0.45, 0.55, 8),
          new THREE.MeshStandardMaterial({ color: 0x9a958c }),
        );
        base.position.y = 0.27;
        const head = new THREE.Mesh(
          new THREE.SphereGeometry(0.28, 8, 8),
          new THREE.MeshStandardMaterial({ color: TEAM_COLORS[tu.team] }),
        );
        head.position.y = 0.7;
        m.add(base, head);
        this.scene.add(m);
        this.turretMeshes.set(tu.id, m);
      }
      m.position.set(tu.x, tu.y, tu.z);
    }
    for (const [id, m] of this.turretMeshes) {
      if (!activeTurrets.has(id)) {
        this.scene.remove(m);
        this.turretMeshes.delete(id);
      }
    }

    const activeZones = new Set<number>();
    for (const zn of state.zones) {
      activeZones.add(zn.id);
      let m = this.zoneMeshes.get(zn.id);
      if (!m) {
        if (zn.kind === 'blackhole') {
          const grp = new THREE.Group();
          const core = new THREE.Mesh(
            new THREE.SphereGeometry(1.5, 16, 14),
            new THREE.MeshBasicMaterial({ color: 0x05020c }),
          );
          core.position.y = 1.6;
          const ring1 = new THREE.Mesh(
            new THREE.TorusGeometry(2.7, 0.24, 8, 24),
            new THREE.MeshBasicMaterial({ color: 0xa65cff }),
          );
          ring1.position.y = 1.6;
          ring1.rotation.x = Math.PI / 2.4;
          const ring2 = new THREE.Mesh(
            new THREE.TorusGeometry(3.4, 0.14, 8, 24),
            new THREE.MeshBasicMaterial({ color: 0x4fd8ff }),
          );
          ring2.position.y = 1.6;
          ring2.rotation.x = -Math.PI / 3.0;
          const groundRingGeo = new THREE.RingGeometry(zn.radius - 0.35, zn.radius, 32);
          groundRingGeo.rotateX(-Math.PI / 2);
          const groundRing = new THREE.Mesh(
            groundRingGeo,
            flatLayer(new THREE.MeshBasicMaterial({ color: 0x7d4bb0, transparent: true, opacity: 0.48 }), LAYER.decal),
          );
          groundRing.position.y = 0.04;
          grp.add(core, ring1, ring2, groundRing);
          m = grp;
        } else if (zn.kind === 'bomb') {
          const grp = new THREE.Group();
          const ball = new THREE.Mesh(
            new THREE.SphereGeometry(0.48, 10, 10),
            new THREE.MeshBasicMaterial({ color: 0xff7a1a }),
          );
          ball.position.y = 0.55;
          const ringGeo = new THREE.RingGeometry(zn.radius - 0.25, zn.radius, 24);
          ringGeo.rotateX(-Math.PI / 2);
          const ring = new THREE.Mesh(
            ringGeo,
            flatLayer(new THREE.MeshBasicMaterial({ color: 0xff7a1a, transparent: true, opacity: 0.35 }), LAYER.decal),
          );
          ring.position.y = 0.04;
          grp.add(ball, ring);
          m = grp;
        } else {
          const zGeo = new THREE.CircleGeometry(zn.radius, 24);
          zGeo.rotateX(-Math.PI / 2);
          const col =
            zn.kind === 'root'
              ? 0x4f9a3c
              : zn.kind === 'sap'
                ? 0xff9f43
                : zn.kind === 'spore'
                  ? 0x7cc44f
                  : 0xe0245e;
          m = new THREE.Mesh(
            zGeo,
            flatLayer(new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.35 }), LAYER.decal),
          );
        }
        this.scene.add(m);
        this.zoneMeshes.set(zn.id, m);
      }
      if (zn.kind === 'blackhole') {
        m.position.set(zn.x, zn.y, zn.z);
        m.rotation.y += dt * 4.8;
        if (Math.random() < 0.75) this.vfx.spawnVortexMote(zn.x, zn.y, zn.z, zn.radius);
      } else if (zn.kind === 'bomb') {
        m.position.set(zn.x, zn.y, zn.z);
      } else {
        m.position.set(zn.x, zn.y + 0.04, zn.z);
        if (Math.random() < 0.25) {
          const col = zn.kind === 'sap' ? 0xff9f43 : zn.kind === 'spore' ? 0x7cc44f : 0xff4d6d;
          this.vfx.dustPuff(zn.x + (Math.random() - 0.5) * zn.radius, zn.y, zn.z + (Math.random() - 0.5) * zn.radius, col, 1, 1.5);
        }
      }
    }
    for (const [id, m] of this.zoneMeshes) {
      if (!activeZones.has(id)) {
        this.scene.remove(m);
        this.zoneMeshes.delete(id);
      }
    }

    // 7. Tracers, Particles, VfxSystem & Spell VFX
    this.vfx.update(dt, state.timeS);
    for (let i = this.spellFx.length - 1; i >= 0; i--) {
      const fx = this.spellFx[i];
      fx.ttl -= dt;
      const t = Math.min(1, Math.max(0, 1 - fx.ttl / fx.maxTtl));
      fx.update(t, dt);
      if (fx.ttl <= 0) {
        this.scene.remove(fx.obj);
        this.spellFx.splice(i, 1);
      }
    }
    for (let i = this.tracers.length - 1; i >= 0; i--) {
      this.tracers[i].ttl -= dt;
      if (this.tracers[i].ttl <= 0) {
        this.scene.remove(this.tracers[i].line);
        this.tracers[i].line.geometry.dispose();
        this.tracers.splice(i, 1);
      }
    }
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.ttl -= dt;
      p.vy -= 18 * dt;
      p.mesh.position.x += p.vx * dt;
      p.mesh.position.y += p.vy * dt;
      p.mesh.position.z += p.vz * dt;
      if (p.ttl <= 0) {
        this.scene.remove(p.mesh);
        this.particles.splice(i, 1);
      }
    }

    // 8. Over-the-shoulder 3rd-person camera with dynamic FOV kick & micro-shake
    const local = state.heroes[localSlot];
    if (local) {
      if (local.alive && local.move.sliding && Math.random() < 0.55) {
        this.vfx.dustPuff(local.move.pos.x, local.move.pos.y, local.move.pos.z, 0xd9cbb8, 1, 1.3);
      }
      if (local.alive && local.move.flowTier === 3 && Math.random() < 0.35) {
        this.vfx.dustPuff(local.move.pos.x, local.move.pos.y + 0.4, local.move.pos.z, 0xffd54f, 1, 1.1);
      }
      const spd = Math.hypot(local.move.vel.x, local.move.vel.z);
      const targetFov = ads ? 54 : 74 + Math.min(10, Math.max(0, spd - 9) * 1.1) + (local.move.flowTier === 3 ? 4 : 0);
      this.currentFov += (targetFov - this.currentFov) * Math.min(1, 10 * dt);
      this.camera.fov = this.currentFov;
      this.camera.updateProjectionMatrix();

      const sinY = Math.sin(local.yaw);
      const cosY = Math.cos(local.yaw);
      const fwdX = -sinY;
      const fwdZ = -cosY;
      const rightX = cosY;
      const rightZ = -sinY;
      const cosP = Math.cos(local.pitch);
      const sinP = Math.sin(local.pitch);
      const dirX = fwdX * cosP;
      const dirY = sinP;
      const dirZ = fwdZ * cosP;

      this.aimRecoil = Math.max(0, this.aimRecoil - dt * 0.32);

      const backDist = ads ? 2.4 : 4.2;
      const sideOff = ads ? 0.65 : 0.85;
      const shoulderY = local.move.pos.y + (local.move.sliding ? 1.35 : 1.85) - sinP * 1.6;

      let cx = local.move.pos.x - fwdX * backDist + rightX * sideOff;
      let cz = local.move.pos.z - fwdZ * backDist + rightZ * sideOff;
      cx = Math.max(MAP_BOUNDS.minX + 0.6, Math.min(MAP_BOUNDS.maxX - 0.6, cx));
      cz = Math.max(MAP_BOUNDS.minZ + 0.6, Math.min(MAP_BOUNDS.maxZ - 0.6, cz));
      const cy = Math.max(groundHeightAt(cx, cz) + 0.6, shoulderY);

      this.camPos.lerp(new THREE.Vector3(cx, cy, cz), Math.min(1, 26 * dt));
      const lx = local.move.pos.x + dirX * 30;
      const ly = local.move.pos.y + 0.95 + dirY * 30 + this.aimRecoil * 14;
      const lz = local.move.pos.z + dirZ * 30;
      this.camLook.set(lx, ly, lz);

      this.camera.position.copy(this.camPos);
      if (this.shakeMag > 0.002) {
        this.camera.position.x += (Math.random() - 0.5) * this.shakeMag;
        this.camera.position.y += (Math.random() - 0.5) * this.shakeMag;
        this.shakeMag = Math.max(0, this.shakeMag - dt * 1.1);
      }
      this.camera.lookAt(this.camLook);
    }

    this.skyMesh.position.copy(this.camera.position);
    this.renderer.render(this.scene, this.camera);
  }

  projectToScreen(x: number, y: number, z: number): { sx: number; sy: number; visible: boolean } {
    const v = new THREE.Vector3(x, y, z).project(this.camera);
    const visible = v.z >= -1 && v.z <= 1;
    return {
      sx: (v.x * 0.5 + 0.5) * window.innerWidth,
      sy: (-v.y * 0.5 + 0.5) * window.innerHeight,
      visible,
    };
  }

  dispose(): void {
    window.removeEventListener('resize', this.onResize);
    for (const [slot] of this.heroModels) this.removeHeroModel(slot);
    this.renderer.dispose();
  }
}
