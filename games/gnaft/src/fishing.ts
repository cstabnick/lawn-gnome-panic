// Floating debris and the fishing hook. Junk drifts past the raft; the gnome throws a hook on a line,
// snags debris and reels it in for items. E grabs nearby junk by hand (from the raft or while swimming).
import * as THREE from 'three';
import { sfx } from './audio';
import { FISHING, FUN, GRAB, ITEMS, KEYS, RAFT_TOP, type Ctx, type DebrisDef, type FunId, type GameState, type ItemId, type System } from './config';
import { collectDebris, isWalkable, notify, pickDebris, raftVelocity, tileAt } from './rules';

type HookPhase = 'idle' | 'charging' | 'flying' | 'floating' | 'reeling';

interface Debris {
  mesh: THREE.Object3D;
  def: DebrisDef;
  pos: THREE.Vector3;
  phase: number;
  snagged: boolean;
  /** Horizontal offset from the hook while snagged (clamped to MAX_SNAG_OFFSET). */
  offset: { x: number; z: number };
  /** Blinking glint on a bottle or chest, null for other debris. */
  sparkle: THREE.Object3D | null;
}

interface SplashRing { mesh: THREE.Mesh; mat: THREE.MeshBasicMaterial; age: number }

const RING_SECONDS = 0.8;
const FLY_SECONDS = 0.6;
const FLY_PEAK = 3;
const HAND_HEIGHT = 1.1;
const MAX_SNAG_OFFSET = 0.6;
const REEL_SOUND_EVERY = 0.25;
const PRESPAWN = 6;
const PRESPAWN_MIN_DIST = 6;
const LINE_POINTS = 12;
const BEACHBALL_LIFT = 0.1;

function mat(color: number, extra: THREE.MeshStandardMaterialParameters = {}): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.8, ...extra });
}

/** Adds one shadow-casting mesh to a group at a local position, with an optional rotation (radians). */
function part(
  g: THREE.Object3D,
  geo: THREE.BufferGeometry,
  m: THREE.Material,
  x: number,
  y: number,
  z: number,
  rot: [number, number, number] = [0, 0, 0],
): THREE.Mesh {
  const mesh = new THREE.Mesh(geo, m);
  mesh.position.set(x, y, z);
  mesh.rotation.set(rot[0], rot[1], rot[2]);
  mesh.castShadow = true;
  g.add(mesh);
  return mesh;
}

/** Water flow past the raft: current minus the raft's own velocity. */
function flowOf(s: GameState): { x: number; z: number } {
  const r = raftVelocity(s);
  return { x: FISHING.current.x - r.x, z: FISHING.current.z - r.z };
}

/** Direction debris comes from (unit vector, xz). */
function upstreamOf(flow: { x: number; z: number }): { x: number; z: number } {
  let x = flow.x;
  let z = flow.z;
  if (Math.hypot(x, z) < 0.1) {
    x = FISHING.current.x;
    z = FISHING.current.z;
  }
  const len = Math.hypot(x, z) || 1;
  return { x: -x / len, z: -z / len };
}

/** Name shown in the grab prompt. */
function grabName(def: DebrisDef): string {
  if (def.bottle) return 'Message in a bottle';
  if (def.fun) return FUN[def.fun].name;
  return ITEMS[def.item].name;
}

/** Builds one small mesh per item kind. Meshes are cloned from these templates. */
function buildTemplate(item: ItemId): THREE.Object3D {
  const g = new THREE.Group();
  const add = (geo: THREE.BufferGeometry, m: THREE.Material, x: number, y: number, z: number): THREE.Mesh => {
    const mesh = new THREE.Mesh(geo, m);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    g.add(mesh);
    return mesh;
  };
  switch (item) {
    case 'grass': {
      add(new THREE.CylinderGeometry(0.3, 0.3, 0.06, 10), mat(0x6d4c2e), 0, 0.03, 0);
      const cone = new THREE.ConeGeometry(0.09, 0.4, 5);
      const green = mat(ITEMS.grass.color);
      for (let k = 0; k < 3; k++) {
        const a = k * 2.1;
        add(cone, green, Math.cos(a) * 0.12, 0.26, Math.sin(a) * 0.12);
      }
      break;
    }
    case 'dirt': {
      const sack = add(new THREE.SphereGeometry(0.3, 10, 8), mat(ITEMS.dirt.color), 0, 0.18, 0);
      sack.scale.y = 0.6;
      break;
    }
    case 'seed': {
      add(new THREE.BoxGeometry(0.3, 0.2, 0.2), mat(ITEMS.seed.color), 0, 0.1, 0);
      break;
    }
    case 'plank': {
      add(new THREE.BoxGeometry(0.9, 0.06, 0.22), mat(0xb07a45), 0, 0.03, 0);
      const grain = new THREE.BoxGeometry(0.9, 0.01, 0.04);
      const darker = mat(0x8a5a2e);
      add(grain, darker, 0, 0.065, 0.05);
      add(grain, darker, 0, 0.065, -0.05);
      break;
    }
    case 'scrap': {
      const geo = new THREE.BoxGeometry(0.3, 0.1, 0.14);
      const m = mat(ITEMS.scrap.color, { metalness: 0.6, roughness: 0.4 });
      add(geo, m, 0, 0.05, 0).rotation.y = 0.3;
      add(geo, m, 0.12, 0.12, 0.05).rotation.set(0, 1.2, 0.5);
      add(geo, m, -0.1, 0.1, -0.08).rotation.set(0.4, 2.5, 0.2);
      break;
    }
    case 'fuel': {
      add(new THREE.CylinderGeometry(0.15, 0.15, 0.45, 12), mat(ITEMS.fuel.color), 0, 0.23, 0);
      break;
    }
    case 'parts': {
      const gear = add(new THREE.TorusGeometry(0.22, 0.07, 8, 16), mat(ITEMS.parts.color, { metalness: 0.4, roughness: 0.5 }), 0, 0.08, 0);
      gear.rotation.x = Math.PI / 2;
      break;
    }
    case 'duck':
      return buildFun('duck');
    case 'statue':
      return buildFun('statue');
  }
  return g;
}

/** Fun junk models, built from FUN[id].look. */
function buildFun(id: FunId): THREE.Object3D {
  const g = new THREE.Group();
  switch (id) {
    case 'boot': {
      const leather = mat(0x5b3a1e);
      part(g, new THREE.BoxGeometry(0.4, 0.16, 0.2), leather, 0.1, 0.09, 0);
      part(g, new THREE.BoxGeometry(0.2, 0.3, 0.2), leather, -0.1, 0.15, 0);
      part(g, new THREE.BoxGeometry(0.02, 0.02, 0.22), mat(0xe8e0c8), -0.1, 0.31, 0);
      break;
    }
    case 'duck': {
      const yellow = mat(0xffd23f);
      part(g, new THREE.SphereGeometry(0.25, 14, 10), yellow, 0, 0.15, 0).scale.y = 0.7;
      part(g, new THREE.SphereGeometry(0.13, 12, 8), yellow, 0.14, 0.32, 0);
      part(g, new THREE.ConeGeometry(0.06, 0.14, 8), mat(0xff8c1a), 0.31, 0.3, 0, [0, 0, -Math.PI / 2]);
      const black = mat(0x111111);
      part(g, new THREE.SphereGeometry(0.02, 6, 4), black, 0.23, 0.38, 0.07);
      part(g, new THREE.SphereGeometry(0.02, 6, 4), black, 0.23, 0.38, -0.07);
      break;
    }
    case 'chest': {
      const wood = mat(0x7a4e24);
      const gold = mat(0xf2c230, { metalness: 0.6, roughness: 0.4 });
      part(g, new THREE.BoxGeometry(0.6, 0.35, 0.4), wood, 0, 0.175, 0);
      // half-cylinder lid: top half of a cylinder whose axis runs along z
      part(g, new THREE.CylinderGeometry(0.3, 0.3, 0.4, 14, 1, false, Math.PI / 2, Math.PI), wood, 0, 0.35, 0, [Math.PI / 2, 0, 0]);
      for (const x of [-0.2, 0.2]) part(g, new THREE.BoxGeometry(0.07, 0.37, 0.44), gold, x, 0.175, 0);
      part(g, new THREE.BoxGeometry(0.1, 0.12, 0.04), gold, 0, 0.2, 0.22);
      const glint = new THREE.Mesh(
        new THREE.SphereGeometry(0.06, 8, 6),
        new THREE.MeshBasicMaterial({ color: 0xffffff }),
      );
      glint.name = 'sparkle';
      glint.position.set(0, 0.72, 0);
      g.add(glint);
      break;
    }
    case 'statue': {
      // garden gnome lying on its back, face up
      const figure = new THREE.Group();
      part(figure, new THREE.CylinderGeometry(0.15, 0.15, 0.3, 10), mat(0x2f64c9), 0, 0.15, 0);
      part(figure, new THREE.SphereGeometry(0.12, 10, 8), mat(0xf1c27d), 0, 0.36, 0);
      part(figure, new THREE.ConeGeometry(0.1, 0.2, 8), mat(0xf4f4f4), 0, 0.3, 0.08, [Math.PI, 0, 0]);
      part(figure, new THREE.ConeGeometry(0.12, 0.3, 8), mat(0xd93636), 0, 0.5, 0);
      figure.rotation.x = -Math.PI / 2;
      figure.position.set(0, 0.15, 0.3);
      g.add(figure);
      break;
    }
    case 'barrel': {
      const wood = mat(0x9c6b3c);
      const hoop = mat(0x444a4f, { metalness: 0.5, roughness: 0.6 });
      part(g, new THREE.CylinderGeometry(0.22, 0.22, 0.5, 14), wood, 0, 0.22, 0, [0, 0, Math.PI / 2]);
      for (const x of [-0.15, 0.15]) part(g, new THREE.TorusGeometry(0.23, 0.02, 6, 16), hoop, x, 0.22, 0, [0, Math.PI / 2, 0]);
      break;
    }
    case 'beachball': {
      const cols = [0xd93636, 0xffffff, 0x2f64c9, 0xf2c230];
      for (let k = 0; k < cols.length; k++) {
        part(g, new THREE.SphereGeometry(0.3, 16, 12, (k * Math.PI) / 2, Math.PI / 2), mat(cols[k]), 0, 0.3, 0);
      }
      break;
    }
    case 'toilet': {
      const white = mat(0xffffff, { roughness: 0.4 });
      part(g, new THREE.TorusGeometry(0.22, 0.05, 8, 20), white, 0, 0.05, 0, [Math.PI / 2, 0, 0]);
      part(g, new THREE.BoxGeometry(0.44, 0.3, 0.04), white, 0, 0.2, -0.24);
      break;
    }
  }
  return g;
}

/** Message in a bottle: green glass, a cork and a rolled paper, lying on its side, with a blinking glint. */
function buildBottle(): THREE.Object3D {
  const g = new THREE.Group();
  const lay = new THREE.Group();
  lay.rotation.z = Math.PI / 2;
  lay.position.y = 0.12;
  g.add(lay);
  const add = (geo: THREE.BufferGeometry, m: THREE.Material, y: number): THREE.Mesh => {
    const mesh = new THREE.Mesh(geo, m);
    mesh.position.set(0, y, 0);
    mesh.castShadow = true;
    lay.add(mesh);
    return mesh;
  };
  const glass = mat(0x5fbf7f, { transparent: true, opacity: 0.6, roughness: 0.1 });
  add(new THREE.CylinderGeometry(0.1, 0.12, 0.45, 12), glass, 0);
  add(new THREE.CylinderGeometry(0.04, 0.05, 0.15, 10), glass, 0.3);
  add(new THREE.CylinderGeometry(0.045, 0.045, 0.06, 10), mat(0x6d4c2e), 0.405);
  add(new THREE.CylinderGeometry(0.03, 0.03, 0.2, 8), mat(0xffffff), 0);

  const glint = new THREE.Mesh(
    new THREE.SphereGeometry(0.06, 8, 6),
    new THREE.MeshBasicMaterial({ color: 0xffffff }),
  );
  glint.name = 'sparkle';
  glint.position.set(0, 0.55, 0);
  g.add(glint);
  return g;
}

export function createFishing(ctx: Ctx): System {
  const templates = new Map<string, THREE.Object3D>();
  const debris: Debris[] = [];
  let t = 0;
  let spawnTimer = 0;
  let phase: HookPhase = 'idle';
  let charge = 0;
  let flyT = 0;
  const flyFrom = new THREE.Vector3();
  const flyTo = new THREE.Vector3();
  const hookPos = new THREE.Vector3();
  let reelT = 0;

  // ---- hook visuals
  const bobber = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 10, 8),
    new THREE.MeshStandardMaterial({ color: 0xd93636, roughness: 0.5 }),
  );
  bobber.visible = false;
  ctx.scene.add(bobber);

  const linePos = new THREE.BufferAttribute(new Float32Array(LINE_POINTS * 3), 3);
  const lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute('position', linePos);
  const line = new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color: 0xffffff }));
  line.frustumCulled = false;
  line.visible = false;
  ctx.scene.add(line);

  // ---- charge bar (own element inside the shared #ui)
  const bar = document.createElement('div');
  bar.id = 'rg-charge';
  bar.style.cssText =
    'position:absolute;left:50%;bottom:90px;transform:translateX(-50%);width:160px;height:10px;' +
    'border:1px solid #fff;box-sizing:border-box;display:none;';
  const fill = document.createElement('div');
  fill.style.cssText = 'height:100%;width:0%;background:#fff;';
  bar.appendChild(fill);
  ctx.ui.appendChild(bar);

  // ---- grab prompt (own element inside the shared #ui)
  const grabEl = document.createElement('div');
  grabEl.id = 'rg-grab';
  grabEl.style.cssText =
    'position:absolute;left:50%;bottom:120px;transform:translateX(-50%);white-space:nowrap;' +
    'color:#fff;font-weight:bold;background:rgba(0,0,0,0.55);padding:6px 12px;border-radius:6px;' +
    'pointer-events:none;display:none;';
  ctx.ui.appendChild(grabEl);

  // ---- splash rings (pooled, flat on the water)
  const ringGeo = new THREE.RingGeometry(0.2, 0.3, 32);
  const rings: SplashRing[] = [];
  const ringPool: SplashRing[] = [];
  const spawnRing = (x: number, z: number): void => {
    let r = ringPool.pop();
    if (!r) {
      const m = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8, depthWrite: false });
      r = { mesh: new THREE.Mesh(ringGeo, m), mat: m, age: 0 };
      r.mesh.rotation.x = -Math.PI / 2;
    }
    r.age = 0;
    r.mat.opacity = 0.8;
    r.mesh.scale.setScalar(1);
    r.mesh.position.set(x, 0.05, z);
    ctx.scene.add(r.mesh);
    rings.push(r);
  };

  const templateFor = (def: DebrisDef): THREE.Object3D => {
    const key = def.bottle ? 'bottle' : def.fun ? 'fun:' + def.fun : def.item;
    let tpl = templates.get(key);
    if (!tpl) {
      tpl = def.bottle ? buildBottle() : def.fun ? buildFun(def.fun) : buildTemplate(def.item);
      templates.set(key, tpl);
    }
    return tpl;
  };

  const makeDebris = (def: DebrisDef, x: number, z: number): void => {
    const mesh = templateFor(def).clone();
    ctx.scene.add(mesh);
    debris.push({
      mesh,
      def,
      pos: new THREE.Vector3(x, 0.05, z),
      phase: Math.random() * Math.PI * 2,
      snagged: false,
      offset: { x: 0, z: 0 },
      sparkle: mesh.getObjectByName('sparkle') ?? null,
    });
  };

  const spawnUpstream = (s: GameState, flow: { x: number; z: number }): void => {
    const up = upstreamOf(flow);
    const perp = { x: -up.z, z: up.x };
    const across = (Math.random() - 0.5) * FISHING.spawnSpread;
    makeDebris(
      pickDebris(s),
      up.x * FISHING.spawnDistance + perp.x * across,
      up.z * FISHING.spawnDistance + perp.z * across,
    );
  };

  const releaseSnagged = (): void => {
    for (const d of debris) d.snagged = false;
  };

  // Pre-spawn along the flow line so the sea is not empty at the start.
  {
    const s = ctx.state;
    const up = upstreamOf(flowOf(s));
    for (let k = 0; k < PRESPAWN; k++) {
      let d = (Math.random() * 2 - 1) * FISHING.spawnDistance;
      if (Math.abs(d) < PRESPAWN_MIN_DIST) d = d < 0 ? -PRESPAWN_MIN_DIST : PRESPAWN_MIN_DIST;
      makeDebris(pickDebris(s), up.x * d, up.z * d);
    }
  }

  return {
    update(dt: number): void {
      const s = ctx.state;
      const input = ctx.input;
      t += dt;
      const flow = flowOf(s);

      // ---- spawning (all modes)
      spawnTimer += dt;
      if (spawnTimer >= FISHING.debrisSpawnSeconds) {
        spawnTimer = 0;
        if (debris.length < FISHING.debrisMax) spawnUpstream(s, flow);
      }

      // ---- splash rings: grow and fade over RING_SECONDS, then return to the pool
      for (let k = rings.length - 1; k >= 0; k--) {
        const r = rings[k];
        r.age += dt;
        const u = r.age / RING_SECONDS;
        if (u >= 1) {
          ctx.scene.remove(r.mesh);
          rings.splice(k, 1);
          ringPool.push(r);
          continue;
        }
        r.mesh.scale.setScalar(1 + 5 * u);
        r.mat.opacity = 0.8 * (1 - u);
      }

      // ---- drift, and despawn debris that has gone far downstream
      for (let k = debris.length - 1; k >= 0; k--) {
        const d = debris[k];
        if (d.snagged) continue;
        d.pos.x += flow.x * dt;
        d.pos.z += flow.z * dt;
        const far = Math.hypot(d.pos.x, d.pos.z) > FISHING.despawnDistance;
        const away = d.pos.x * flow.x + d.pos.z * flow.z > 0;
        if (far && away) {
          ctx.scene.remove(d.mesh);
          debris.splice(k, 1);
        }
      }

      // ---- hook state machine
      if (s.mode !== 'play') {
        if (phase !== 'idle') {
          releaseSnagged();
          phase = 'idle';
        }
      } else {
        // no fishing while swimming: a hook out when the gnome falls in is reeled back in
        if (s.player.swimming && phase !== 'idle') {
          releaseSnagged();
          phase = 'idle';
        }

        if (phase === 'idle') {
          if (input.mousePressed(0) && input.locked() && !s.player.swimming) {
            phase = 'charging';
            charge = 0;
          }
        }

        if (phase === 'charging') {
          charge = Math.min(1, charge + dt / FISHING.chargeSeconds);
          if (input.mouseReleased(0)) {
            const p = s.player.position;
            const dist = FISHING.minThrow + (FISHING.maxThrow - FISHING.minThrow) * charge;
            const dir = ctx.camera.getWorldDirection(new THREE.Vector3());
            dir.y = 0;
            if (dir.lengthSq() < 1e-6) dir.set(Math.sin(s.player.facing), 0, Math.cos(s.player.facing));
            dir.normalize();
            flyFrom.set(p.x, p.y + HAND_HEIGHT, p.z);
            flyTo.set(p.x + dir.x * dist, 0, p.z + dir.z * dist);
            hookPos.copy(flyFrom);
            flyT = 0;
            phase = 'flying';
            sfx('throw');
          }
        }

        if (phase === 'flying') {
          flyT += dt;
          const u = Math.min(1, flyT / FLY_SECONDS);
          hookPos.lerpVectors(flyFrom, flyTo, u);
          hookPos.y += FLY_PEAK * 4 * u * (1 - u);
          if (u >= 1) {
            hookPos.copy(flyTo);
            phase = 'floating';
            if (!isWalkable(s, flyTo.x, flyTo.z)) {
              spawnRing(flyTo.x, flyTo.z);
              sfx('splash');
            }
          }
        }

        if (phase === 'floating' || phase === 'reeling') {
          if (input.mouseDown(0)) {
            if (phase === 'floating') {
              phase = 'reeling';
              reelT = REEL_SOUND_EVERY;
            }
            const p = s.player.position;
            const dx = p.x - hookPos.x;
            const dz = p.z - hookPos.z;
            const d = Math.hypot(dx, dz);
            if (d > 0) {
              const step = Math.min(d, FISHING.reelSpeed * dt);
              hookPos.x += (dx / d) * step;
              hookPos.z += (dz / d) * step;
            }
            reelT += dt;
            if (reelT >= REEL_SOUND_EVERY) {
              reelT -= REEL_SOUND_EVERY;
              sfx('reel');
            }
          } else {
            phase = 'floating';
            hookPos.x += flow.x * dt;
            hookPos.z += flow.z * dt;
          }

          // snag unsnagged debris under the hook
          for (const d of debris) {
            if (d.snagged) continue;
            const dx = d.pos.x - hookPos.x;
            const dz = d.pos.z - hookPos.z;
            const len = Math.hypot(dx, dz);
            if (len <= FISHING.hookRadius) {
              d.snagged = true;
              const k = len > MAX_SNAG_OFFSET ? MAX_SNAG_OFFSET / len : 1;
              d.offset.x = dx * k;
              d.offset.z = dz * k;
            }
          }

          hookPos.y = isWalkable(s, hookPos.x, hookPos.z)
            ? RAFT_TOP + 0.1
            : 0.05 + Math.sin(t * 2) * 0.08;

          // snagged debris follows the hook
          for (const d of debris) {
            if (!d.snagged) continue;
            d.pos.x = hookPos.x + d.offset.x;
            d.pos.z = hookPos.z + d.offset.z;
          }

          // collect or snap
          const pp = s.player.position;
          const dist = Math.hypot(hookPos.x - pp.x, hookPos.z - pp.z);
          if (dist <= FISHING.collectDistance) {
            if (debris.some((d) => d.snagged)) spawnRing(hookPos.x, hookPos.z);
            for (let k = debris.length - 1; k >= 0; k--) {
              const d = debris[k];
              if (!d.snagged) continue;
              collectDebris(s, d.def);
              sfx(d.def.bottle ? 'bottle' : d.def.fun === 'duck' ? 'quack' : 'catch');
              ctx.scene.remove(d.mesh);
              debris.splice(k, 1);
            }
            phase = 'idle';
          } else if (dist > FISHING.despawnDistance) {
            notify(s, 'The line snapped!');
            releaseSnagged();
            phase = 'idle';
          }
        }
      }

      // ---- grab by hand (E): the nearest unsnagged junk within GRAB.reach, on the raft or while swimming
      let grabTarget: Debris | null = null;
      if (s.mode === 'play') {
        const pp = s.player.position;
        let best = Infinity;
        for (const d of debris) {
          if (d.snagged) continue;
          const dd = Math.hypot(d.pos.x - pp.x, d.pos.z - pp.z);
          if (dd <= GRAB.reach && dd < best) {
            best = dd;
            grabTarget = d;
          }
        }
      }
      if (grabTarget && input.pressed(KEYS.interact)) {
        const g = grabTarget;
        collectDebris(s, g.def);
        sfx(g.def.bottle ? 'bottle' : g.def.fun === 'duck' ? 'quack' : 'catch');
        spawnRing(g.pos.x, g.pos.z);
        ctx.scene.remove(g.mesh);
        debris.splice(debris.indexOf(g), 1);
        grabTarget = null;
      }
      s.canGrab = grabTarget !== null;
      if (grabTarget) {
        const label = `E — grab ${grabName(grabTarget.def)}`;
        if (grabEl.textContent !== label) grabEl.textContent = label;
        grabEl.style.display = 'block';
      } else {
        grabEl.style.display = 'none';
      }

      // ---- debris pose (snagged debris were moved above)
      for (const d of debris) {
        // junk drifting over the raft slides across the grass instead of bobbing under it
        const base = tileAt(s, d.pos.x, d.pos.z) ? RAFT_TOP + 0.03 : 0.05 + Math.sin(t * 2 + d.phase) * 0.08;
        d.pos.y = base + (d.def.fun === 'beachball' ? BEACHBALL_LIFT : 0);
        d.mesh.position.copy(d.pos);
        d.mesh.rotation.y = t * 0.5 + d.phase;
        d.mesh.scale.setScalar(d === grabTarget ? 1 + 0.15 * Math.sin(t * 8) : 1);
        if (d.sparkle) d.sparkle.visible = Math.sin(t * 6 + d.phase) > 0.3;
      }

      // ---- hook, line and charge bar visuals
      const showHook = phase === 'flying' || phase === 'floating' || phase === 'reeling';
      bobber.visible = showHook;
      line.visible = showHook;
      if (showHook) {
        const pp = s.player.position;
        bobber.position.copy(hookPos);
        // bite: while floating with something snagged, the bobber dips for 0.3 s of every 0.6 s
        const hasSnag = debris.some((d) => d.snagged);
        if (phase === 'floating' && hasSnag && t % 0.6 < 0.3) bobber.position.y -= 0.08;
        const hx = pp.x;
        const hy = pp.y + HAND_HEIGHT;
        const hz = pp.z;
        const span = Math.hypot(hookPos.x - hx, hookPos.y - hy, hookPos.z - hz);
        const sag = Math.min(1.2, span * 0.08);
        for (let k = 0; k < LINE_POINTS; k++) {
          const u = k / (LINE_POINTS - 1);
          linePos.setXYZ(
            k,
            hx + (hookPos.x - hx) * u,
            hy + (hookPos.y - hy) * u - sag * 4 * u * (1 - u),
            hz + (hookPos.z - hz) * u,
          );
        }
        linePos.needsUpdate = true;
      }

      if (phase === 'charging') {
        bar.style.display = 'block';
        fill.style.width = `${Math.round(charge * 100)}%`;
      } else {
        bar.style.display = 'none';
      }
    },
  };
}
