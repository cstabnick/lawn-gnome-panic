// Island Links' background show: gnomes playing Gnome Golf beside the fairways. Three greens with flags, two bunkers
// and a pond, a tee box where a gnome drives over the track, spectators behind a rope, a scoreboard and palm-ish trees.
// Everything sits at least 3 m off the mown track. Animated from a local clock; placement is seeded.
import * as THREE from 'three';
import { buildPrefab } from '@lawn/prefabs';
import type { Track } from '../../track';
import { pointAt } from '../../track';
import type { CourseShow } from './index';
import { mulberry32, canvasTexture, distFromTrackEdge, offTrackSpot, createActor, type Actor } from './util';

interface Spot { x: number; z: number; r: number }

const PUTT_PERIOD = 5;
const DRIVE_PERIOD = 7;
const CONTACT = 0.6;          // seconds into a swing when the club meets the ball
const ROLL_TIME = 1.5;
const FLIGHT_TIME = 2.2;
const BALL_R = 0.12;
const CLAP_TIME = 1.6;
const PAR = [3, 4, 5];
const NAMES = ['Gnorm', 'Blib', 'Tuft'];

/** Arm angle (rad, negative = forward) of a swing u seconds in: back, through the ball, settle. */
function swingAngle(u: number): number {
  if (u < 0.3) return 1.4 * (u / 0.3);
  if (u < CONTACT) return 1.4 - 2.6 * ((u - 0.3) / 0.3);
  if (u < 1.0) return -1.2 * (1 - (u - CONTACT) / 0.4);
  return 0;
}

/** Heading h for a gnome at (fx, fz) to face (tx, tz), using the repo's convention (forward = (sin h, cos h)). */
function faceYaw(fx: number, fz: number, tx: number, tz: number): number {
  return Math.atan2(tx - fx, tz - fz);
}

export function buildGolfShow(scene: THREE.Scene, track: Track): CourseShow {
  const rng = mulberry32(0x60f1);
  const root = new THREE.Group();
  scene.add(root);
  const taken: Spot[] = [];
  const far = (x: number, z: number, r: number): boolean =>
    taken.every((t) => Math.hypot(x - t.x, z - t.z) > r + t.r + 1.5);
  /** A spot for a round thing of radius r, 3 m clear of the track edge and of everything already placed. */
  const place = (r: number, inset = 3): { x: number; z: number } | null => {
    for (let i = 0; i < 8; i++) {
      const s = offTrackSpot(track, rng, r + 3, inset);
      if (!s) return null;
      if (far(s.x, s.z, r)) { taken.push({ x: s.x, z: s.z, r }); return s; }
    }
    return null;
  };

  const lambert = (color: number, opts: THREE.MeshLambertMaterialParameters = {}) =>
    new THREE.MeshLambertMaterial({ color, ...opts });
  const flatCircle = (radius: number, segs: number, color: number, y: number, opts: THREE.MeshLambertMaterialParameters = {}) => {
    const g = new THREE.CircleGeometry(radius, segs);
    g.rotateX(-Math.PI / 2);
    const m = new THREE.Mesh(g, lambert(color, opts));
    m.position.y = y;
    return m;
  };

  // Shared geometry and materials.
  const ballGeo = new THREE.SphereGeometry(BALL_R, 10, 8);
  const ballMat = lambert(0xffffff);
  const poleGeo = new THREE.CylinderGeometry(0.05, 0.05, 2.2, 6);
  const poleMat = lambert(0xffffff);
  const grassMat = lambert(0x7fd36a);
  const sandMat = lambert(0xe3cf9a);

  // Greens with holes and flags.
  interface Green {
    hole: { x: number; z: number };
    ball: { x: number; z: number };
    ballMesh: THREE.Mesh;
    putter: Actor;
    holder: Actor;
    offset: number;
    flagged: boolean;
  }
  const greens: Green[] = [];
  for (let i = 0; i < 3; i++) {
    const r = 4 + rng();
    const h = place(r);
    if (!h) continue;
    const green = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.06, 32), grassMat);
    green.position.set(h.x, 0.03, h.z);
    root.add(green);
    const holeDisc = flatCircle(0.3, 16, 0x1c2a1c, 0.075);
    holeDisc.position.set(h.x, 0.075, h.z);
    root.add(holeDisc);

    // The flagstick prefab: pole and red flag, scaled to the 2.2 m pole this hole used to have.
    const flagstick = buildPrefab('golf-flagstick', { scale: 0.85 });
    flagstick.position.set(h.x, 0, h.z);
    root.add(flagstick);

    // Ball 3 m from the hole; the putter stands 1.2 m behind the ball, facing the hole.
    const a = rng() * Math.PI * 2;
    const dx = Math.cos(a), dz = Math.sin(a);
    const ball = { x: h.x + dx * 3, z: h.z + dz * 3 };
    const putPos = { x: ball.x + dx * 1.2, z: ball.z + dz * 1.2 };
    const putter = createActor(scene, putPos.x, putPos.z, faceYaw(putPos.x, putPos.z, h.x, h.z), { shirt: 0xf6c1d0 });
    // Flag holder stands 1.6 m to one side of the hole.
    const fx = h.x - dz * 1.6, fz = h.z + dx * 1.6;
    const holder = createActor(scene, fx, fz, faceYaw(fx, fz, h.x, h.z), { shirt: 0xbfe3f7 });
    const ballMesh = new THREE.Mesh(ballGeo, ballMat);
    root.add(ballMesh);
    greens.push({ hole: h, ball, ballMesh, putter, holder, offset: i * 1.7, flagged: false });
  }

  // Two bunkers and a pond.
  for (let i = 0; i < 2; i++) {
    const s = place(2.5);
    if (!s) continue;
    const b = flatCircle(1, 28, 0xe3cf9a, 0.04, {});
    b.scale.set(2.5, 1, 1.6);
    b.rotation.y = rng() * Math.PI;
    b.position.set(s.x, 0.04, s.z);
    root.add(b);
  }
  const pondSpot = place(5.4);
  if (pondSpot) {
    const water = flatCircle(5.2, 40, 0x3c8fd6, 0.04, { transparent: true, opacity: 0.8 });
    water.position.set(pondSpot.x, 0.04, pondSpot.z);
    root.add(water);
    const rimGeo = new THREE.RingGeometry(5.2, 5.6, 40);
    rimGeo.rotateX(-Math.PI / 2);
    const rim = new THREE.Mesh(rimGeo, lambert(0x2a6aa6));
    rim.position.set(pondSpot.x, 0.05, pondSpot.z);
    root.add(rim);
  }

  // Tee box across the track from a spot on the track's centre, so the drive flies over the mown road.
  let tee: { x: number; z: number } | null = null;
  let land = { x: 0, z: 0 };
  let nrm = { x: 0, z: 0 };
  for (const f of [0.5, 0.3, 0.7, 0.15, 0.85]) {
    const p = pointAt(track, track.length * f);
    const nx = p.tz, nz = -p.tx; // left of the tangent
    const off = track.width / 2 + 5;
    const t = { x: p.x + nx * off, z: p.z + nz * off };
    const l = { x: p.x - nx * off, z: p.z - nz * off };
    const b = track.course.bounds;
    const inside = (q: { x: number; z: number }) => q.x > b.minX + 2 && q.x < b.maxX - 2 && q.z > b.minZ + 2 && q.z < b.maxZ - 2;
    if (inside(t) && inside(l) && distFromTrackEdge(track, t.x, t.z) >= 3 && distFromTrackEdge(track, l.x, l.z) >= 3) {
      tee = t; land = l; nrm = { x: nx, z: nz };
      break;
    }
  }
  let drive: { tee: { x: number; z: number }; actor: Actor; ball: THREE.Mesh; trail: THREE.Points; trailPos: Float32Array } | null = null;
  if (tee) {
    const teeBox = new THREE.Mesh(new THREE.BoxGeometry(3, 0.06, 3), grassMat);
    teeBox.position.set(tee.x, 0.03, tee.z);
    root.add(teeBox);
    // Driver stands 1.2 m on the outer side of the tee, facing the far side of the track.
    const gx = tee.x + nrm.x * 1.2, gz = tee.z + nrm.z * 1.2;
    const actor = createActor(scene, gx, gz, faceYaw(gx, gz, land.x, land.z), { shirt: 0xffe08a });
    const ball = new THREE.Mesh(ballGeo, ballMat);
    root.add(ball);
    const N = 20;
    const trailPos = new Float32Array(N * 3);
    const tg = new THREE.BufferGeometry();
    tg.setAttribute('position', new THREE.Float32BufferAttribute(trailPos, 3));
    const trail = new THREE.Points(tg, new THREE.PointsMaterial({ color: 0xffffff, size: 0.25, transparent: true, opacity: 0.7 }));
    trail.visible = false;
    root.add(trail);
    drive = { tee, actor, ball, trail, trailPos };
  }

  // Spectators behind a rope, on the far side of the first green from its putter.
  const g0 = greens[0];
  const spectators: Actor[] = [];
  if (g0) {
    const baseA = Math.atan2(g0.putter.pose.position.x - g0.hole.x, g0.putter.pose.position.z - g0.hole.z);
    const ropePts: THREE.Vector3[] = [];
    for (let i = 0; i <= 10; i++) {
      const a = baseA + (i - 5) * 0.2;
      ropePts.push(new THREE.Vector3(g0.hole.x + Math.sin(a) * 6.5, 1.0, g0.hole.z + Math.cos(a) * 6.5));
    }
    root.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(ropePts), new THREE.LineBasicMaterial({ color: 0xffffff })));
    for (const end of [ropePts[0], ropePts[ropePts.length - 1]]) {
      const post = new THREE.Mesh(poleGeo, poleMat);
      post.scale.y = 0.5;
      post.position.set(end.x, 0.55, end.z);
      root.add(post);
    }
    const shirts = [0xff9f9f, 0x9fd6ff, 0xc7f5a0, 0xffd27f, 0xd7b6ff, 0xffffff];
    for (let i = 0; i < 6; i++) {
      const a = baseA + (i - 2.5) * 0.3;
      for (const R of [7.8, 9.2]) {
        const x = g0.hole.x + Math.sin(a) * R, z = g0.hole.z + Math.cos(a) * R;
        if (distFromTrackEdge(track, x, z) >= 3) {
          spectators.push(createActor(scene, x, z, faceYaw(x, z, g0.hole.x, g0.hole.z), { shirt: shirts[i] }));
          break;
        }
      }
    }
  }

  // Scoreboard on two poles, facing the track.
  let board: { paint: (hole: number, scores: number[]) => void; tex: THREE.CanvasTexture } | null = null;
  const boardSpot = place(1.2, 4);
  if (boardSpot) {
    const c = pointAt(track, track.length * 0.5);
    const yaw = faceYaw(boardSpot.x, boardSpot.z, c.x, c.z);
    const lx = Math.cos(yaw), lz = -Math.sin(yaw);
    for (const side of [-1.8, 1.8]) {
      const p = new THREE.Mesh(poleGeo, poleMat);
      p.scale.y = 1.45;
      p.position.set(boardSpot.x + lx * side, 1.6, boardSpot.z + lz * side);
      root.add(p);
    }
    let ctx: CanvasRenderingContext2D | null = null;
    const tex = canvasTexture(256, 128, (g) => { ctx = g; });
    const paint = (hole: number, scores: number[]) => {
      if (!ctx) return;
      ctx.fillStyle = '#1f4d2b'; ctx.fillRect(0, 0, 256, 128);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 22px sans-serif'; ctx.textBaseline = 'top';
      ctx.fillText(`HOLE ${hole}  PAR ${PAR[(hole - 1) % 3]}`, 10, 8);
      ctx.font = '18px sans-serif';
      NAMES.forEach((n, i) => ctx!.fillText(`${n}  ${scores[i]}`, 10, 46 + i * 24));
      tex.needsUpdate = true;
    };
    const boardMesh = new THREE.Mesh(new THREE.PlaneGeometry(4, 2),
      new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide }));
    boardMesh.position.set(boardSpot.x, 2.7, boardSpot.z);
    boardMesh.rotation.y = yaw;
    root.add(boardMesh);
    board = { paint, tex };
  }

  // Palm-ish trees around the edges (the palm-tree prefab, scaled to the 4 m trunk these used to have).
  for (let i = 0; i < 14; i++) {
    const s = place(0.6, 1);
    if (!s) continue;
    const tree = buildPrefab('palm-tree', { scale: 5.7 });
    tree.position.set(s.x, 0, s.z);
    root.add(tree);
  }

  // Clock state.
  let clock = 0;
  let clapUntil = -1;
  let hole = 1;
  const scores = [0, 0, 0];
  board?.paint(hole, scores);

  return {
    update(_raceT: number, dt: number) {
      clock += dt;

      // Putting: swing, the ball rolls to the hole, drops in, then reappears 3 m away.
      greens.forEach((g, i) => {
        const u = (clock + g.offset) % PUTT_PERIOD;
        g.putter.update(dt);
        g.putter.model.arms.left.rotation.x = swingAngle(u);
        g.putter.model.arms.right.rotation.x = swingAngle(u);
        g.holder.update(dt);
        g.holder.model.arms.left.rotation.x = -1.2;
        g.holder.model.arms.right.rotation.x = -1.2;

        const m = g.ballMesh;
        m.visible = true;
        m.scale.setScalar(1);
        m.position.set(g.ball.x, BALL_R, g.ball.z);
        if (u >= CONTACT && u < CONTACT + ROLL_TIME) {
          const p = (u - CONTACT) / ROLL_TIME;
          const f = 1 - (1 - p) * (1 - p);
          m.position.set(g.ball.x + (g.hole.x - g.ball.x) * f, BALL_R, g.ball.z + (g.hole.z - g.ball.z) * f);
        } else if (u >= CONTACT + ROLL_TIME && u < CONTACT + ROLL_TIME + 0.3) {
          const p = (u - CONTACT - ROLL_TIME) / 0.3;
          m.position.set(g.hole.x, BALL_R - p * 0.15, g.hole.z);
          m.scale.setScalar(1 - p * 0.8);
          if (!g.flagged) {
            g.flagged = true;
            scores[i % 3] += 1;
            clapUntil = clock + CLAP_TIME;
            board?.paint(hole, scores);
          }
        } else if (u >= CONTACT + ROLL_TIME + 0.3 && u < PUTT_PERIOD - 0.5) {
          m.visible = false;
        }
        if (u < 0.1) g.flagged = false;
      });

      // Driving: swing, the ball flies a high arc over the track and lies on the far side.
      if (drive) {
        const u = clock % DRIVE_PERIOD;
        drive.actor.update(dt);
        drive.actor.model.arms.left.rotation.x = swingAngle(u);
        drive.actor.model.arms.right.rotation.x = swingAngle(u);
        const flying = u >= CONTACT && u < CONTACT + FLIGHT_TIME;
        const at = (p: number) => {
          const q = Math.min(1, Math.max(0, p));
          return {
            x: drive!.tee.x + (land.x - drive!.tee.x) * q,
            y: BALL_R + 48 * q * (1 - q),
            z: drive!.tee.z + (land.z - drive!.tee.z) * q,
          };
        };
        if (flying) {
          const p = (u - CONTACT) / FLIGHT_TIME;
          const b = at(p);
          drive.ball.position.set(b.x, b.y, b.z);
          drive.trail.visible = true;
          const N = drive.trailPos.length / 3;
          for (let k = 0; k < N; k++) {
            const t = at(p - k * 0.03);
            drive.trailPos[k * 3] = t.x;
            drive.trailPos[k * 3 + 1] = t.y;
            drive.trailPos[k * 3 + 2] = t.z;
          }
          (drive.trail.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
        } else {
          drive.trail.visible = false;
          if (u >= CONTACT + FLIGHT_TIME && u < DRIVE_PERIOD - 0.6) {
            drive.ball.position.set(land.x, BALL_R, land.z);
          } else {
            drive.ball.position.set(drive.tee.x, BALL_R, drive.tee.z);
          }
        }
      }

      // Spectators clap while a putt has just dropped.
      const clapping = clock < clapUntil;
      for (const s of spectators) {
        s.update(dt);
        const a = clapping ? -1.6 + 0.6 * Math.sin(clock * 14) : 0;
        s.model.arms.left.rotation.x = a;
        s.model.arms.right.rotation.x = a;
      }

      // Scoreboard moves on to the next hole every 20 s.
      const nextHole = (Math.floor(clock / 20) % 3) + 1;
      if (nextHole !== hole) {
        hole = nextHole;
        board?.paint(hole, scores);
      }
    },
  };
}
