// The Front's background show: Red Caps and Blue Caps fight on both sides of the road. Primitives and canvas only,
// animated from a local clock. Tracers fly 2.5 m up, over the road, so they never hide the karts.
import * as THREE from 'three';
import type { Track } from '../../track';
import type { CourseShow } from './index';
import { canvasTexture, createActor, distFromTrackEdge, mulberry32, offTrackSpot, type Actor } from './util';

const SOLDIERS_PER_TEAM = 8;
const SHOTS = 24;                  // tracer pool
const BOOMS = 6;                   // explosion pool (each slot: one fireball and one smoke puff)
const SHOT_TIME = 0.3;             // s, a tracer's flight
const SHOT_SPEED = 25 / SHOT_TIME; // m/s: a tracer covers 25 m
const STRAFE_SPEED = 2.2;          // m/s
const RIFLE_POSE = -1.4;           // arm rotation.x: forward
const BOOM_LIFE = 2.3;             // s until an explosion slot is free again

interface Team { sign: number; hat: number; shirt: number; cloth: number }
const TEAMS: Team[] = [
  { sign: -1, hat: 0xd23a32, shirt: 0x8f2a24, cloth: 0xd23a32 }, // Red Caps: the -x half
  { sign: 1, hat: 0x2f64c9, shirt: 0x1f4285, cloth: 0x2f64c9 },  // Blue Caps: the +x half
];

interface Soldier {
  actor: Actor;
  ends: { x: number; z: number }[];
  goal: number;
  state: 'move' | 'stand';
  timer: number;
  shotTimer: number;
  yaw: number;           // facing the enemy base
  tx: number; tz: number; // unit direction toward the enemy base
}
interface Shot { mesh: THREE.Mesh; age: number; x: number; z: number; tx: number; tz: number }
interface Boom { fire: THREE.Mesh; smoke: THREE.Mesh; fireMat: THREE.MeshBasicMaterial; smokeMat: THREE.MeshBasicMaterial; age: number }
interface Flag { geo: THREE.PlaneGeometry; x0: Float32Array; phase: number }

/** A point in the given half (sign -1 = -x, +1 = +x), at least `clear` m off the road. */
function basePoint(track: Track, rng: () => number, sign: number, clear: number): { x: number; z: number } {
  for (let i = 0; i < 400; i++) {
    const s = offTrackSpot(track, rng, clear, 10);
    if (s && Math.sign(s.x) === sign) return s;
  }
  return { x: sign * 30, z: 0 };
}

function ticketText(raceT: number): string {
  return `RED ${Math.max(0, 87 - Math.floor(raceT / 4))} - BLUE ${Math.max(0, 91 - Math.floor(raceT / 3.5))}`;
}

function paintTickets(g: CanvasRenderingContext2D, score: string): void {
  g.fillStyle = '#1b2233';
  g.fillRect(0, 0, 512, 192);
  g.strokeStyle = '#f2d16b';
  g.lineWidth = 8;
  g.strokeRect(4, 4, 504, 184);
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillStyle = '#f2d16b';
  g.font = 'bold 34px sans-serif';
  g.fillText('TICKETS', 256, 48);
  g.fillStyle = '#ffffff';
  g.font = 'bold 60px sans-serif';
  g.fillText(score, 256, 128);
}

export function buildFrontShow(scene: THREE.Scene, track: Track): CourseShow {
  const rng = mulberry32(0xf207);
  const bounds = track.course.bounds;
  let clock = 0;
  let ticketsShown = ticketText(0);

  const add = (geo: THREE.BufferGeometry, mat: THREE.Material, x: number, y: number, z: number, yaw = 0): THREE.Mesh => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.rotation.y = yaw;
    scene.add(m);
    return m;
  };

  // Shared geometry and materials (nothing is allocated per frame).
  const metal = new THREE.MeshStandardMaterial({ color: 0x8a8a8a, metalness: 0.4, roughness: 0.5 });
  const bagGeo = new THREE.BoxGeometry(1.0, 0.4, 0.5);
  const bagMat = new THREE.MeshStandardMaterial({ color: 0xc8b48a, roughness: 0.95 });
  const crateGeo = new THREE.BoxGeometry(0.9, 0.9, 0.9);
  const crateMat = new THREE.MeshStandardMaterial({ color: 0x8b6a3e, roughness: 0.9 });
  const rifleGeo = new THREE.BoxGeometry(0.07, 0.8, 0.07);
  const rifleMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a });
  const postGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.2, 5);
  const wireGeo = new THREE.BoxGeometry(0.02, 0.02, 2.2);
  const craterGeo = new THREE.CylinderGeometry(1, 1, 0.04, 14);
  const craterMat = new THREE.MeshStandardMaterial({ color: 0x2b2418, roughness: 1 });
  const sphereGeo = new THREE.SphereGeometry(1, 10, 8);
  const shotGeo = new THREE.BoxGeometry(0.12, 0.12, 1.2);
  const shotMat = new THREE.MeshBasicMaterial({ color: 0xffe14d });

  const flags: Flag[] = [];
  const soldiers: Soldier[] = [];

  // Bases: a sandbag wall with crates, a flag, and a squad that strafes behind the wall and fires at the enemy.
  for (const team of TEAMS) {
    const c = basePoint(track, rng, team.sign, 11);
    const tx = -team.sign, tz = 0;   // unit direction toward the enemy base
    const yaw = Math.atan2(tx, tz);  // the yaw that faces it
    const px = tz, pz = -tx;         // across the road (left of the heading)
    const at = (along: number, across: number) => ({ x: c.x + tx * along + px * across, z: c.z + tz * along + pz * across });

    for (let row = 0; row < 2; row++) {
      for (let i = -2; i <= 2; i++) {
        const q = at(2.5, i * 1.05);
        add(bagGeo, bagMat, q.x, 0.2 + row * 0.4, q.z, yaw);
      }
    }
    for (const across of [-3.2, 3.2]) {
      const q = at(3.2, across);
      add(crateGeo, crateMat, q.x, 0.45, q.z, yaw);
    }

    const pole = at(-2, -3.5);
    add(new THREE.CylinderGeometry(0.06, 0.06, 6.4, 6), metal, pole.x, 3.2, pole.z);
    const cloth = new THREE.PlaneGeometry(2.2, 1.3, 10, 4);
    cloth.translate(1.1, 0, 0);
    const clothMesh = new THREE.Mesh(cloth, new THREE.MeshStandardMaterial({ color: team.cloth, side: THREE.DoubleSide }));
    clothMesh.position.set(pole.x, 5.6, pole.z);
    clothMesh.rotation.y = yaw;
    scene.add(clothMesh);
    flags.push({ geo: cloth, x0: new Float32Array(cloth.attributes.position.array), phase: rng() * 6 });

    for (let i = 0; i < SOLDIERS_PER_TEAM; i++) {
      const d = 0.4 + 0.5 * (i % 3);
      const lane = [at(-d, -3), at(-d, 3)];
      const idx = i % 2;
      const actor = createActor(scene, lane[idx].x, lane[idx].z, yaw, { hat: team.hat, shirt: team.shirt });
      const rifle = new THREE.Mesh(rifleGeo, rifleMat);
      rifle.position.set(0, -0.4, 0.05);
      actor.model.arms.right.add(rifle);
      soldiers.push({ actor, ends: lane, goal: idx, state: 'stand', timer: rng() * 2, shotTimer: rng() * 2, yaw, tx, tz });
    }
  }

  // Shell craters in the grass.
  for (let i = 0; i < 8; i++) {
    const s = offTrackSpot(track, rng, 3);
    if (!s) continue;
    const r = 1.2 + rng() * 0.8;
    add(craterGeo, craterMat, s.x, 0.02, s.z, rng() * Math.PI).scale.set(r, 1, r * (0.7 + rng() * 0.6));
  }

  // Barbed-wire runs: four posts, two strands between each pair. A run is skipped if any post lands near the road.
  for (let run = 0; run < 6; run++) {
    const s0 = offTrackSpot(track, rng, 8, 3);
    if (!s0) continue;
    const ang = rng() * Math.PI;
    const dx = Math.sin(ang), dz = Math.cos(ang);
    const posts = [0, 1, 2, 3].map((k) => ({ x: s0.x + dx * 2.2 * k, z: s0.z + dz * 2.2 * k }));
    if (!posts.every((p) => distFromTrackEdge(track, p.x, p.z) >= 3)) continue;
    for (const p of posts) add(postGeo, metal, p.x, 0.6, p.z);
    for (let k = 0; k < 3; k++) {
      const mx = (posts[k].x + posts[k + 1].x) / 2, mz = (posts[k].z + posts[k + 1].z) / 2;
      for (const wy of [0.4, 0.9]) add(wireGeo, metal, mx, wy, mz, Math.atan2(dx, dz));
    }
  }

  // Explosion pool: an orange fireball that grows and fades, then a grey smoke puff that rises and fades.
  const booms: Boom[] = [];
  for (let i = 0; i < BOOMS; i++) {
    const fireMat = new THREE.MeshBasicMaterial({ color: 0xff8a1f, transparent: true, depthWrite: false });
    const smokeMat = new THREE.MeshBasicMaterial({ color: 0x9a9a9a, transparent: true, depthWrite: false });
    booms.push({ fire: add(sphereGeo, fireMat, 0, -20, 0), smoke: add(sphereGeo, smokeMat, 0, -20, 0), fireMat, smokeMat, age: BOOM_LIFE });
  }
  let boomTimer = 1;

  // Tracer pool.
  const shots: Shot[] = [];
  for (let i = 0; i < SHOTS; i++) shots.push({ mesh: add(shotGeo, shotMat, 0, -20, 0), age: SHOT_TIME, x: 0, z: 0, tx: 0, tz: 0 });

  // TICKETS board on two poles, facing the middle of the course.
  const boardTex = canvasTexture(512, 192, (g) => paintTickets(g, ticketsShown));
  const boardCanvas = boardTex.image as HTMLCanvasElement;
  const bs = offTrackSpot(track, rng, 6, 3) ?? { x: 0, z: bounds.minZ + 4 };
  const bh = Math.atan2(-bs.x, -bs.z);
  const lx = Math.cos(bh), lz = -Math.sin(bh); // left of the board
  const board = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 2.1), new THREE.MeshBasicMaterial({ map: boardTex, side: THREE.DoubleSide }));
  board.position.set(bs.x, 4.4, bs.z);
  board.rotation.y = bh;
  scene.add(board);
  for (const side of [-2.8, 2.8]) add(new THREE.CylinderGeometry(0.1, 0.1, 5.45, 6), metal, bs.x + lx * side, 2.725, bs.z + lz * side);

  const fire = (s: Soldier) => {
    const sh = shots.find((x) => x.age >= SHOT_TIME);
    if (!sh) return;
    sh.age = 0;
    sh.x = s.actor.pose.position.x + s.tx * 0.8;
    sh.z = s.actor.pose.position.z + s.tz * 0.8;
    sh.tx = s.tx;
    sh.tz = s.tz;
    sh.mesh.rotation.y = Math.atan2(s.tx, s.tz);
  };

  const stepSoldier = (s: Soldier, dt: number) => {
    const pose = s.actor.pose;
    if (s.state === 'move') {
      const g = s.ends[s.goal];
      const dx = g.x - pose.position.x, dz = g.z - pose.position.z;
      const dist = Math.hypot(dx, dz);
      if (dist < 0.1) {
        s.state = 'stand';
        s.timer = 1.5 + rng() * 2;
        pose.velocity.set(0, 0, 0);
      } else {
        const k = Math.min(dist, STRAFE_SPEED * dt) / dist;
        pose.position.x += dx * k;
        pose.position.z += dz * k;
        pose.velocity.set((dx / dist) * STRAFE_SPEED, 0, (dz / dist) * STRAFE_SPEED);
      }
    } else {
      pose.velocity.set(0, 0, 0);
      s.timer -= dt;
      if (s.timer <= 0) {
        s.state = 'move';
        s.goal = 1 - s.goal;
      }
      s.shotTimer -= dt;
      if (s.shotTimer <= 0) {
        s.shotTimer = 0.9 + rng() * 0.8;
        fire(s);
      }
    }
    pose.facing = s.yaw;
    s.actor.update(dt);
    if (s.state === 'stand') {
      s.actor.model.arms.left.rotation.x = RIFLE_POSE;
      s.actor.model.arms.right.rotation.x = RIFLE_POSE;
    }
  };

  const stepBoom = (b: Boom, dt: number) => {
    b.age = Math.min(b.age + dt, BOOM_LIFE);
    const a = b.age;
    b.fire.visible = a < 0.6;
    b.smoke.visible = a >= 0.3 && a < BOOM_LIFE;
    if (b.fire.visible) {
      b.fire.scale.setScalar(0.3 + 2.2 * Math.min(a / 0.4, 1));
      b.fireMat.opacity = 1 - a / 0.6;
    }
    if (b.smoke.visible) {
      const sa = a - 0.3;
      b.smoke.position.y = 0.5 + sa * 1.2;
      b.smoke.scale.setScalar(1 + sa * 0.8);
      b.smokeMat.opacity = 0.6 * (1 - sa / 2);
    }
  };

  return {
    update(raceT: number, dt: number) {
      clock += dt;

      // Flags wave: the cloth's z offset grows toward the free edge.
      for (const f of flags) {
        const pos = f.geo.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < pos.count; i++) {
          const x = f.x0[i * 3];
          pos.setZ(i, Math.sin(clock * 5 + x * 2.5 + f.phase) * 0.2 * (x / 2.2));
        }
        pos.needsUpdate = true;
      }

      for (const s of soldiers) stepSoldier(s, dt);

      for (const sh of shots) {
        sh.age = Math.min(sh.age + dt, SHOT_TIME);
        if (sh.age >= SHOT_TIME) {
          sh.mesh.visible = false;
          continue;
        }
        const d = SHOT_SPEED * sh.age;
        sh.mesh.visible = true;
        sh.mesh.position.set(sh.x + sh.tx * d, 2.5, sh.z + sh.tz * d);
      }

      boomTimer -= dt;
      if (boomTimer <= 0) {
        boomTimer = 2 + rng() * 2;
        const boom = booms.find((b) => b.age >= BOOM_LIFE);
        const spot = offTrackSpot(track, rng, 6, 3);
        if (boom && spot) {
          boom.age = 0;
          boom.fire.position.set(spot.x, 0.8, spot.z);
          boom.smoke.position.set(spot.x, 0.5, spot.z);
        }
      }
      for (const b of booms) stepBoom(b, dt);

      const text = ticketText(raceT);
      if (text !== ticketsShown) {
        ticketsShown = text;
        paintTickets(boardCanvas.getContext('2d') as CanvasRenderingContext2D, text);
        boardTex.needsUpdate = true;
      }
    },
  };
}
