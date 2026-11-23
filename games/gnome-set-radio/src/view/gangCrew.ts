import * as THREE from 'three';
import { createGnomeModel, GNORMAN_LOOK, type GnomeLook } from '@lawn/gnome';
import { buildPrefab } from '@lawn/prefabs';
import type { GsrAreaId } from '../audio/jingles';
import { AREA_CAST, type CrewVariantDef, type GangLeaderDef } from '../data/cast';
import { groundHeightAt } from '../levels/loader';
import type { GsrLevelDoc } from '../levels/schema';

export interface HeroCrewMember {
  id: string;
  name: string;
  role: string;
  accentColor: string;
  look: GnomeLook;
  offsetX: number;
  offsetZ: number;
}

export const HERO_CREW: readonly HeroCrewMember[] = [
  {
    id: 'hero-dj-broadcast',
    name: 'DJ Broadcast',
    role: 'Pirate Radio Host',
    accentColor: '#00e5ff',
    look: {
      ...GNORMAN_LOOK,
      hat: 0xff4ecd,
      shirt: 0x1b0b38,
      pants: 0x120624,
      boots: 0x00e5ff,
      beard: 0xffffff,
      glasses: true,
      equipment: { head: 'gsr-dj-headphones', neck: 'gsr-vinyl-chain' },
    },
    offsetX: -6.5,
    offsetZ: -2.0,
  },
  {
    id: 'hero-spin',
    name: 'Spin',
    role: 'Ley-Line Runner · Trick Specialist',
    accentColor: '#ff4ecd',
    look: {
      ...GNORMAN_LOOK,
      hat: 0xff4ecd,
      shirt: 0x2b124d,
      pants: 0x191b26,
      boots: 0xff4ecd,
      beard: null,
      glasses: true,
      equipment: { head: 'gba-headband', back: 'gsr-spray-pack' },
    },
    offsetX: 4.2,
    offsetZ: -2.6,
  },
  {
    id: 'hero-tag',
    name: 'Tag',
    role: 'Ley-Line Runner · Graffiti Ace',
    accentColor: '#69f0ae',
    look: {
      ...GNORMAN_LOOK,
      hat: 0x69f0ae,
      shirt: 0x123828,
      pants: 0x191b26,
      boots: 0x69f0ae,
      beard: 0x2d1e14,
      freckles: true,
      equipment: { head: 'brick-beret', hand: 'gsr-aether-can' },
    },
    offsetX: 6.2,
    offsetZ: -3.4,
  },
  {
    id: 'hero-glide',
    name: 'Glide',
    role: 'Ley-Line Runner · Rail Carve',
    accentColor: '#ffd740',
    look: {
      ...GNORMAN_LOOK,
      hat: 0xffd740,
      shirt: 0x142847,
      pants: 0x191b26,
      boots: 0xffd740,
      beard: null,
      equipment: { head: 'aviator-cap', back: 'gsr-mist-wings' },
    },
    offsetX: 8.2,
    offsetZ: -2.6,
  },
];

export interface PatrolRoute {
  points: readonly [number, number][];
  speed: number;
}

export const AREA_PATROL_ROUTES: Partial<Record<GsrAreaId, readonly PatrolRoute[]>> = {
  'velvet-keys': [
    {
      points: [
        [0, 26],
        [18, 22],
        [18, -18],
        [0, -24],
        [-18, -18],
        [-18, 22],
      ],
      speed: 7.2,
    },
    {
      points: [
        [20, 36],
        [48, 36],
        [52, -4],
        [48, -44],
        [20, -44],
        [18, -4],
      ],
      speed: 6.8,
    },
    {
      points: [
        [-20, 40],
        [-48, 40],
        [-54, 0],
        [-54, -42],
        [-20, -42],
        [-18, 0],
      ],
      speed: 7.5,
    },
  ],
  'bongo-basin': [
    {
      points: [
        [-42, 26],
        [16, 26],
        [20, 42],
        [-42, 42],
      ],
      speed: 7.4,
    },
    {
      points: [
        [20, 32],
        [54, 32],
        [54, -36],
        [20, -36],
      ],
      speed: 8.0,
    },
    {
      points: [
        [-58, 22],
        [-58, -46],
        [-32, -56],
        [18, -56],
        [18, -10],
        [-24, -10],
      ],
      speed: 7.0,
    },
  ],
  'chrome-kiln': [
    {
      points: [
        [-12, 38],
        [12, 38],
        [12, -26],
        [-12, -26],
      ],
      speed: 7.6,
    },
    {
      points: [
        [-54, 34],
        [-54, -44],
        [-18, -14],
        [-18, 34],
      ],
      speed: 7.2,
    },
    {
      points: [
        [18, 34],
        [54, 34],
        [54, -44],
        [18, -16],
      ],
      speed: 7.5,
    },
  ],
  'neon-birdbath': [
    {
      points: [
        [-14, 42],
        [14, 42],
        [16, -14],
        [-14, -14],
      ],
      speed: 7.8,
    },
    {
      points: [
        [-48, 38],
        [-54, -38],
        [-22, -46],
        [-18, 2],
      ],
      speed: 7.4,
    },
    {
      points: [
        [18, 38],
        [54, 38],
        [54, -42],
        [22, -42],
      ],
      speed: 8.1,
    },
  ],
  'mulch-alley': [
    { points: [[-12, 42], [12, 42], [12, -28], [-12, -28]], speed: 7.6 },
    { points: [[-48, 38], [-48, -46], [-22, -56], [-18, 2]], speed: 7.4 },
    { points: [[18, 2], [48, 38], [48, -46], [22, -56]], speed: 7.8 },
  ],
  'tupperware-mall': [
    { points: [[-14, 42], [14, 42], [14, -26], [-14, -26]], speed: 7.8 },
    { points: [[-48, 38], [-48, -44], [-22, -56], [-14, 18]], speed: 7.5 },
    { points: [[14, 18], [48, 38], [48, -44], [22, -56]], speed: 7.9 },
  ],
  'hoa-citadel': [
    { points: [[-12, 42], [12, 42], [12, -26], [-12, -26]], speed: 7.5 },
    { points: [[-48, 38], [-48, -46], [-22, -56], [-14, 0]], speed: 7.3 },
    { points: [[14, 0], [48, 38], [48, -46], [22, -56]], speed: 7.7 },
  ],
  'subsoil-relay': [
    { points: [[-12, 42], [12, 42], [12, -26], [-12, -26]], speed: 8.0 },
    { points: [[-48, 38], [-48, -46], [-22, -56], [-14, 0]], speed: 7.8 },
    { points: [[14, 0], [48, 38], [48, -46], [22, -56]], speed: 8.2 },
  ],
  'zero-hz-zenith': [
    { points: [[-12, 42], [12, 42], [12, -26], [-12, -26]], speed: 8.2 },
    { points: [[-48, 38], [-48, -46], [-22, -56], [-14, 0]], speed: 8.0 },
    { points: [[14, 0], [48, 38], [48, -46], [22, -56]], speed: 8.4 },
  ],
};

export interface CutsceneAnchors {
  bossPos: { x: number; y: number; z: number };
  sidekickPos: { x: number; y: number; z: number };
  playerSpawn: { x: number; y: number; z: number };
  djBoothPos: { x: number; y: number; z: number };
  crewLineupPos: { x: number; y: number; z: number };
}

export interface GangCrewSystem {
  update(t: number, dt: number, beatPulse: number): void;
  checkShoutouts(
    px: number,
    py: number,
    pz: number,
    elapsed: number,
    onShout: (targetId: string, speaker: string, line: string, mutterHz: number) => void,
  ): void;
  getAnchors(): CutsceneAnchors;
  dispose(): void;
}

function buildInlineSkates(accentColor: string, disposables: { dispose(): void }[]): {
  left: THREE.Group;
  right: THREE.Group;
  wheels: THREE.Mesh[];
} {
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x222633, roughness: 0.4, metalness: 0.6 });
  const wheelMat = new THREE.MeshStandardMaterial({
    color: accentColor,
    emissive: accentColor,
    emissiveIntensity: 0.85,
    roughness: 0.25,
  });
  const railGeo = new THREE.BoxGeometry(0.06, 0.04, 0.34);
  const wheelGeo = new THREE.CylinderGeometry(0.036, 0.036, 0.035, 10);
  disposables.push(frameMat, wheelMat, railGeo, wheelGeo);

  const wheels: THREE.Mesh[] = [];
  const makeSkate = (): THREE.Group => {
    const g = new THREE.Group();
    g.position.set(0, -0.3, 0.02);
    const rail = new THREE.Mesh(railGeo, frameMat);
    rail.position.y = 0.03;
    g.add(rail);
    for (const wz of [-0.12, -0.04, 0.04, 0.12]) {
      const w = new THREE.Mesh(wheelGeo, wheelMat);
      w.rotation.z = Math.PI / 2;
      w.position.set(0, -0.008, wz);
      g.add(w);
      wheels.push(w);
    }
    return g;
  };
  return { left: makeSkate(), right: makeSkate(), wheels };
}

function stylizeBossLeader(
  bossRoot: THREE.Object3D,
  leader: GangLeaderDef,
  disposables: { dispose(): void }[],
): THREE.Group {
  const crown = new THREE.Group();
  crown.position.set(0, 1.95, 0);

  const haloGeo = new THREE.TorusGeometry(0.68, 0.045, 8, 24);
  const haloMat = new THREE.MeshStandardMaterial({
    color: leader.primaryColor,
    emissive: leader.primaryColor,
    emissiveIntensity: 0.95,
    roughness: 0.2,
  });
  const halo = new THREE.Mesh(haloGeo, haloMat);
  halo.rotation.x = Math.PI * 0.42;
  crown.add(halo);

  const gemGeo = new THREE.OctahedronGeometry(0.14);
  const gemMat = new THREE.MeshStandardMaterial({
    color: leader.accentColor,
    emissive: leader.accentColor,
    emissiveIntensity: 1.0,
    roughness: 0.15,
  });
  const gem = new THREE.Mesh(gemGeo, gemMat);
  gem.position.y = 0.24;
  crown.add(gem);

  disposables.push(haloGeo, haloMat, gemGeo, gemMat);
  bossRoot.add(crown);
  return crown;
}

export function createGangCrew(
  doc: GsrLevelDoc,
  group: THREE.Group,
  bossActor: { root: THREE.Object3D; baseX: number; baseY: number; baseZ: number } | null,
  speechTargets: Map<string, { root: THREE.Object3D; height: number }>,
): GangCrewSystem {
  const disposables: { dispose(): void }[] = [];
  const areaId = doc.id as GsrAreaId;
  const cast = AREA_CAST[areaId];

  // 1. Stylize Boss Leader with floating crown/halo
  let bossCrown: THREE.Group | null = null;
  if (bossActor && cast) {
    bossCrown = stylizeBossLeader(bossActor.root, cast.leader, disposables);
  }

  // 2. Spawn 2 Sidekicks flanking the Boss Stage
  const sidekicks: { root: THREE.Object3D; baseY: number; phase: number }[] = [];
  const baseBossX = bossActor?.baseX ?? 0;
  const baseBossY = bossActor?.baseY ?? groundHeightAt(doc, 0, -24);
  const baseBossZ = bossActor?.baseZ ?? -24;

  if (cast) {
    const offsets: readonly [number, number][] = [
      [-3.2, 1.8],
      [3.2, 1.8],
    ];
    cast.sidekicks.forEach((sk, idx) => {
      const [ox, oz] = offsets[idx]!;
      const sx = baseBossX + ox;
      const sz = baseBossZ + oz;
      const sy = baseBossY;
      let root: THREE.Object3D | null = null;
      if (sk.kind === 'gnome' && sk.gnomeLook) {
        const model = createGnomeModel(sk.gnomeLook);
        model.object.position.y = 0.08;
        const skates = buildInlineSkates(sk.accentColor, disposables);
        if (model.legs) {
          model.legs.left.add(skates.left);
          model.legs.right.add(skates.right);
        }
        root = model.object;
      } else if (sk.prefabId) {
        root = buildPrefab(sk.prefabId, { scale: 1.35 });
      }
      if (root) {
        root.position.set(sx, sy, sz);
        root.rotation.y = idx === 0 ? 0.35 : -0.35;
        group.add(root);
        sidekicks.push({ root, baseY: sy, phase: idx * 1.7 });
        speechTargets.set(sk.id, { root, height: 2.35 });
      }
    });
  }

  // 3. Spawn 3 Skating Gang Crew Gnomes patrolling the area
  interface SkatingMember {
    id: string;
    variant: CrewVariantDef;
    root: THREE.Group;
    model: ReturnType<typeof createGnomeModel>;
    wheels: THREE.Mesh[];
    route: PatrolRoute;
    segIdx: number;
    segT: number;
    stridePhase: number;
    lastShoutAt: number;
    shoutIdx: number;
    x: number;
    y: number;
    z: number;
  }

  const skaters: SkatingMember[] = [];
  const routes = AREA_PATROL_ROUTES[areaId] ?? [];
  if (cast && routes.length > 0) {
    for (let i = 0; i < Math.min(3, routes.length); i++) {
      const route = routes[i]!;
      if (route.points.length < 2) continue;
      const variant = cast.crewVariants[i % 2]!;
      const model = createGnomeModel(variant.look);
      model.object.position.y = 0.08;
      const skates = buildInlineSkates(cast.leader.primaryColor, disposables);
      if (model.legs) {
        model.legs.left.add(skates.left);
        model.legs.right.add(skates.right);
      }
      const root = new THREE.Group();
      root.add(model.object);
      const [x0, z0] = route.points[0]!;
      const y0 = groundHeightAt(doc, x0, z0);
      root.position.set(x0, y0 + 0.05, z0);
      group.add(root);

      const id = `crew-${areaId}-${i}`;
      speechTargets.set(id, { root, height: 2.25 });
      skaters.push({
        id,
        variant,
        root,
        model,
        wheels: skates.wheels,
        route,
        segIdx: 0,
        segT: 0,
        stridePhase: i * 1.9,
        lastShoutAt: -20 + i * 3,
        shoutIdx: i,
        x: x0,
        y: y0,
        z: z0,
      });
    }
  }

  // 3b. Spawn DJ Broadcast + 3 Ley-Line Runner Crew Models near spawn
  const spawnMarker = doc.markers.find((m) => m.kind === 'spawn');
  const spX = spawnMarker?.x ?? 0;
  const spZ = spawnMarker?.z ?? 36;
  const heroModels: { model: ReturnType<typeof createGnomeModel>; baseY: number; phase: number }[] = [];
  const djX = spX + HERO_CREW[0]!.offsetX;
  const djZ = spZ + HERO_CREW[0]!.offsetZ;
  const djY = groundHeightAt(doc, djX, djZ);

  // DJ Broadcast turntable booth
  const booth = buildPrefab('gsr-boombox', { scale: 1.45 });
  if (booth) {
    booth.position.set(djX, djY, djZ + 1.15);
    booth.rotation.y = 0.25;
    group.add(booth);
  }

  HERO_CREW.forEach((hero, idx) => {
    const hx = spX + hero.offsetX;
    const hz = spZ + hero.offsetZ;
    const hy = groundHeightAt(doc, hx, hz);
    const m = createGnomeModel(hero.look);
    m.object.position.set(hx, hy + 0.08, hz);
    m.object.rotation.y = idx === 0 ? 0.25 : -0.35;
    const skates = buildInlineSkates(hero.accentColor, disposables);
    if (m.legs) {
      m.legs.left.add(skates.left);
      m.legs.right.add(skates.right);
    }
    group.add(m.object);
    heroModels.push({ model: m, baseY: hy + 0.08, phase: idx * 1.4 });
    speechTargets.set(hero.id, { root: m.object, height: 2.35 });
  });

  return {
    update(t, dt, beatPulse) {
      for (const hm of heroModels) {
        hm.model.object.position.y = hm.baseY + Math.abs(Math.sin(t * 3.6 + hm.phase)) * (0.1 + beatPulse * 0.12);
        hm.model.arms.left.rotation.x = -0.35 + Math.sin(t * 4.2 + hm.phase) * 0.25;
        hm.model.arms.right.rotation.x = -0.35 - Math.sin(t * 4.2 + hm.phase) * 0.25;
      }
      if (bossCrown) {
        bossCrown.rotation.y = t * 1.4;
        bossCrown.position.y = 1.95 + Math.sin(t * 3.2) * 0.1 + beatPulse * 0.08;
        bossCrown.scale.setScalar(1 + beatPulse * 0.12);
      }

      for (const sk of sidekicks) {
        sk.root.position.y = sk.baseY + Math.abs(Math.sin(t * 3.8 + sk.phase)) * (0.16 + beatPulse * 0.1);
      }

      const stepDt = Math.min(0.05, Math.max(0.001, dt));
      for (const m of skaters) {
        const pts = m.route.points;
        const a = pts[m.segIdx]!;
        const nextIdx = (m.segIdx + 1) % pts.length;
        const b = pts[nextIdx]!;
        const dx = b[0] - a[0];
        const dz = b[1] - a[1];
        const segLen = Math.max(0.1, Math.hypot(dx, dz));

        m.segT += (m.route.speed * stepDt) / segLen;
        while (m.segT >= 1) {
          m.segT -= 1;
          m.segIdx = (m.segIdx + 1) % pts.length;
        }

        const ca = pts[m.segIdx]!;
        const cb = pts[(m.segIdx + 1) % pts.length]!;
        const nx = ca[0] + (cb[0] - ca[0]) * m.segT;
        const nz = ca[1] + (cb[1] - ca[1]) * m.segT;
        const ny = groundHeightAt(doc, nx, nz);

        const dirX = cb[0] - ca[0];
        const dirZ = cb[1] - ca[1];
        const targetYaw = Math.atan2(dirX, dirZ);

        let diff = targetYaw - m.root.rotation.y;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        m.root.rotation.y += diff * Math.min(1, stepDt * 8);

        m.x = nx;
        m.y = ny;
        m.z = nz;
        m.root.position.set(nx, ny + 0.05, nz);

        m.stridePhase += stepDt * 7.5;
        const stride = Math.sin(m.stridePhase);
        m.model.rig.rotation.x = 0.16;
        m.model.rig.position.y = Math.abs(stride) * 0.04 + beatPulse * 0.025;
        if (m.model.legs) {
          m.model.legs.left.rotation.x = stride * 0.55;
          m.model.legs.right.rotation.x = -stride * 0.55;
        }
        m.model.arms.left.rotation.x = -stride * 0.45 - 0.15;
        m.model.arms.right.rotation.x = stride * 0.45 - 0.15;
        for (const w of m.wheels) {
          w.rotation.x += m.route.speed * stepDt * 10;
        }
      }
    },

    checkShoutouts(px, py, pz, elapsed, onShout) {
      for (const m of skaters) {
        const dist = Math.hypot(px - m.x, py - m.y, pz - m.z);
        if (dist < 9.5 && elapsed - m.lastShoutAt > 11) {
          m.lastShoutAt = elapsed;
          const line = m.variant.shoutouts[m.shoutIdx % m.variant.shoutouts.length]!;
          m.shoutIdx++;
          onShout(m.id, m.variant.name, line, m.variant.mutterHz);
          break;
        }
      }
    },

    getAnchors() {
      return {
        bossPos: { x: baseBossX, y: baseBossY, z: baseBossZ },
        sidekickPos: { x: baseBossX + 1.8, y: baseBossY, z: baseBossZ + 2.2 },
        playerSpawn: { x: spX, y: groundHeightAt(doc, spX, spZ), z: spZ },
        djBoothPos: { x: djX, y: djY, z: djZ },
        crewLineupPos: { x: spX + 6.2, y: groundHeightAt(doc, spX + 6.2, spZ - 2.8), z: spZ - 2.8 },
      };
    },

    dispose() {
      for (const d of disposables) d.dispose();
    },
  };
}
