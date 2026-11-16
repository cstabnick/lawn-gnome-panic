// The lawn shark: a fin circles the raft and every so often chews on an edge tile.
// Get over there and bonk it (F), or lose the tile.
import * as THREE from 'three';
import { KEYS, SHARK, TILE_SIZE } from './config';
import type { Ctx, System } from './config';
import { sfx } from './audio';
import { edgeTiles, notify, raftExtent, removeTile, tileKey } from './rules';

const SHARK_GREY = 0x56606b;
const CIRCLE_SPEED = 4;      // m/s
const APPROACH_SPEED = 6;    // m/s
const FLEE_SPEED = 8;        // m/s
const FLEE_SECONDS = 5;
const BITE_OUT = 1.6;        // the bite point is this far from the tile centre, outward
const RETRY_SECONDS = 10;    // raft too small to bite: check again after this long
const DIRS: [number, number][] = [[1, 0], [-1, 0], [0, 1], [0, -1]];

type Phase = 'circling' | 'approach' | 'biting' | 'fleeing';
interface Bite { i: number; j: number; di: number; dj: number; x: number; z: number }
interface Splash { mesh: THREE.Mesh; vx: number; vy: number; vz: number; life: number }

const rand = (a: number, b: number): number => a + Math.random() * (b - a);

export function createShark(ctx: Ctx): System {
  const { scene, state, input } = ctx;

  // ---------------------------------------------------------------- model
  const group = new THREE.Group();
  scene.add(group);

  const greyMat = new THREE.MeshStandardMaterial({ color: SHARK_GREY, roughness: 0.6 });
  const body = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), greyMat);
  body.scale.set(0.7, 0.5, 1.5); // about 3 m long, just below the surface
  body.position.y = -0.4;
  group.add(body);

  const fin = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.2, 3), greyMat);
  fin.scale.set(0.2, 1, 1);      // flattened along x into a blade
  fin.position.set(0, 0.5, 0.2);
  fin.castShadow = true;
  group.add(fin);

  const tail = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.6, 0.6), greyMat);
  tail.position.set(0, 0.1, -1.7);
  tail.castShadow = true;
  group.add(tail);

  // White wake trailing behind the fin, fading with distance.
  const wakeGeo = new THREE.SphereGeometry(0.5, 8, 6);
  for (let k = 0; k < 6; k++) {
    const wakeMat = new THREE.MeshStandardMaterial({
      color: 0xffffff, transparent: true, opacity: 0.8 * (1 - k / 6), depthWrite: false,
    });
    const wake = new THREE.Mesh(wakeGeo, wakeMat);
    wake.scale.set(1.2, 0.04, 0.8);
    wake.position.set(0, 0.03, -2.2 - k * 0.9);
    group.add(wake);
  }

  // Pulsing red ring on the water at the bite point.
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(1, 1.3, 32),
    new THREE.MeshBasicMaterial({ color: 0xff3333, transparent: true }),
  );
  ring.rotation.x = -Math.PI / 2;
  ring.visible = false;
  scene.add(ring);

  // Splash bits while biting.
  const splashGeo = new THREE.SphereGeometry(0.12, 6, 4);
  const splashMats = [new THREE.MeshBasicMaterial({ color: 0xffffff }), new THREE.MeshBasicMaterial({ color: 0x9be38a })];
  const splashes: Splash[] = [];

  // ---------------------------------------------------------------- state
  let phase: Phase = 'circling';
  let angle = Math.random() * Math.PI * 2;
  let radius = 6;
  /** Seconds until the next bite. null until the first attack gate passes. */
  let attackIn: number | null = null;
  let bite: Bite = { i: 0, j: 0, di: 1, dj: 0, x: 0, z: 0 };
  let timer = 0;     // seconds left while biting or fleeing
  let chompIn = 0;
  let splashIn = 0;
  let t = 0;         // animation clock

  const active = (): boolean => state.mode !== 'title' && !state.sea.docked;

  function pickBite(): boolean {
    const edges = edgeTiles(state);
    if (edges.length === 0) return false;
    const tile = edges[Math.floor(Math.random() * edges.length)];
    const gaps = DIRS.filter(([di, dj]) => !state.tiles.has(tileKey(tile.i + di, tile.j + dj)));
    if (gaps.length === 0) return false;
    const [di, dj] = gaps[Math.floor(Math.random() * gaps.length)];
    bite = {
      i: tile.i, j: tile.j, di, dj,
      x: tile.i * TILE_SIZE + di * BITE_OUT,
      z: tile.j * TILE_SIZE + dj * BITE_OUT,
    };
    return true;
  }

  function enterFlee(): void {
    phase = 'fleeing';
    timer = FLEE_SECONDS;
    ring.visible = false;
  }

  function enterCircling(): void {
    phase = 'circling';
    angle = Math.atan2(group.position.z, group.position.x);
    radius = Math.max(1, Math.hypot(group.position.x, group.position.z));
    attackIn = rand(SHARK.intervalMin, SHARK.intervalMax);
    ring.visible = false;
  }

  function spawnSplash(): void {
    const mesh = new THREE.Mesh(splashGeo, splashMats[Math.random() < 0.5 ? 0 : 1]);
    mesh.position.set(bite.x + rand(-0.6, 0.6), 0.1, bite.z + rand(-0.6, 0.6));
    scene.add(mesh);
    splashes.push({ mesh, vx: rand(-1, 1), vy: rand(2, 4), vz: rand(-1, 1), life: 0.6 });
  }

  function updateSplashes(dt: number): void {
    for (let k = splashes.length - 1; k >= 0; k--) {
      const s = splashes[k];
      s.life -= dt;
      if (s.life <= 0) {
        scene.remove(s.mesh);
        splashes.splice(k, 1);
        continue;
      }
      s.vy -= 9.8 * dt;
      s.mesh.position.x += s.vx * dt;
      s.mesh.position.y += s.vy * dt;
      s.mesh.position.z += s.vz * dt;
    }
  }

  // ---------------------------------------------------------------- phases

  function updateCircling(dt: number, on: boolean, cr: number): void {
    radius += (cr - radius) * Math.min(1, dt * 2);
    angle += (CIRCLE_SPEED / radius) * dt;
    group.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
    group.rotation.y = -angle; // path direction is (-sin a, cos a), which is heading -a
    body.rotation.y = 0;
    fin.position.set(0, 0.5 + Math.sin(t * 2) * 0.05, 0.2);
    ring.visible = false;

    if (on && attackIn === null && state.time >= SHARK.firstAfter) attackIn = 0;
    if (on && attackIn !== null) {
      attackIn -= dt;
      if (attackIn <= 0) {
        if (state.tiles.size <= SHARK.minTiles || !pickBite()) {
          attackIn = RETRY_SECONDS;
        } else {
          phase = 'approach';
          attackIn = null;
          sfx('shark');
          notify(state, 'The lawn shark is chewing your raft! Get over there and press F!');
        }
      }
    }
  }

  function updateApproach(dt: number): void {
    const dx = bite.x - group.position.x;
    const dz = bite.z - group.position.z;
    const d = Math.hypot(dx, dz);
    group.rotation.y = Math.atan2(dx, dz);
    body.rotation.y = 0;
    fin.position.set(0, 0.5, 0.2);
    const step = APPROACH_SPEED * dt;
    if (d <= step) {
      group.position.set(bite.x, 0, bite.z);
      phase = 'biting';
      timer = SHARK.biteSeconds;
      chompIn = 0;
    } else {
      group.position.x += (dx / d) * step;
      group.position.z += (dz / d) * step;
    }
  }

  function updateBiting(dt: number, on: boolean): void {
    if (!state.tiles.has(tileKey(bite.i, bite.j))) {
      enterCircling();
      return;
    }
    group.position.set(bite.x, 0, bite.z);
    group.rotation.y = Math.atan2(-bite.di, -bite.dj); // face the tile
    body.rotation.y = Math.sin(t * 14) * 0.18;          // shake side to side
    fin.position.set(0, 0.5, 0.2 + 0.7 * Math.max(0, Math.sin(t * 5))); // lunge at the tile

    ring.visible = true;
    ring.position.set(bite.x, 0.06, bite.z);
    const pulse = 1 + 0.15 * Math.sin(t * 8);
    ring.scale.set(pulse, pulse, 1);

    if (on) {
      chompIn -= dt;
      if (chompIn <= 0) {
        sfx('chomp');
        chompIn = 1;
      }
      timer -= dt;
    }
    splashIn -= dt;
    if (splashIn <= 0) {
      spawnSplash();
      splashIn = 0.25;
    }

    const px = state.player.position.x - bite.x;
    const pz = state.player.position.z - bite.z;
    if (Math.hypot(px, pz) <= SHARK.bonkDistance && input.pressed(KEYS.bonk)) {
      sfx('bonk');
      state.stats.sharksBonked++;
      notify(state, 'BONK! The shark swims off.');
      enterFlee();
    } else if (on && timer <= 0) {
      if (removeTile(state, bite.i, bite.j, SHARK.minTiles)) notify(state, 'The shark ate a tile!');
      enterFlee();
    }
  }

  function updateFleeing(dt: number, on: boolean): void {
    const x = group.position.x;
    const z = group.position.z;
    const d = Math.hypot(x, z) || 1;
    const ux = x / d;
    const uz = z / d; // straight away from the raft
    group.position.set(x + ux * FLEE_SPEED * dt, 0, z + uz * FLEE_SPEED * dt);
    group.rotation.y = Math.atan2(ux, uz);
    body.rotation.y = 0;
    fin.position.set(0, 0, 0.2); // fin dips under the water

    if (on) timer -= dt;
    if (on && timer <= 0) enterCircling();
  }

  return {
    update(dt: number) {
      t += dt;
      const on = active();
      const cr = Math.max(6, raftExtent(state) + SHARK.circleRadius * 0.5);

      switch (phase) {
        case 'circling': updateCircling(dt, on, cr); break;
        case 'approach': updateApproach(dt); break;
        case 'biting': updateBiting(dt, on); break;
        case 'fleeing': updateFleeing(dt, on); break;
      }
      updateSplashes(dt);
    },
  };
}
