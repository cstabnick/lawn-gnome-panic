// The Panic Yard's own scenery and background show: a cottage, a shed and a garden around the infield, and a player
// gnome "playing" Lawn Gnome Panic in the middle (collecting golden acorns while mowers circle it) for the racers
// going past. Primitives and MeshStandardMaterial only; all animation runs from a local clock.
import * as THREE from 'three';
import { buildPrefab } from '@lawn/prefabs';
import type { Track } from '../../track';
import { canvasTexture, createActor, distFromTrackEdge, mulberry32, type Actor } from './util';
import type { CourseShow } from './index';

const RING_R = 10; // the player gnome's circle, m (centred on the infield)
const OMEGA = 0.4; // gnome angular speed, rad/s (about 4 m/s on the ring)
const PHI0 = 0.5; // gnome start angle, so it does not start on an acorn
const ACORN_HIDE = 4; // s an acorn stays hidden after the gnome passes it
const JUMP_EVERY = 3; // s between the gnome's jumps
const JUMP_TIME = 0.5; // s airborne per jump
const JUMP_H = 0.8; // m, height of each jump
const FLOWER_COLOURS = [0xe85d9b, 0xf2c94c, 0xffffff, 0xb07cd8];

const materials = new Map<number, THREE.MeshStandardMaterial>();
function mat(color: number): THREE.MeshStandardMaterial {
  let m = materials.get(color);
  if (!m) {
    m = new THREE.MeshStandardMaterial({ color, roughness: 0.85 });
    materials.set(color, m);
  }
  return m;
}

interface PartOpts {
  rx?: number;
  ry?: number;
  rz?: number;
  shadow?: boolean;
}

/** Adds a mesh of geo in colour to parent at (x, y, z). */
function part(parent: THREE.Object3D, geo: THREE.BufferGeometry, color: number, x: number, y: number, z: number, o: PartOpts = {}): void {
  const m = new THREE.Mesh(geo, mat(color));
  m.position.set(x, y, z);
  m.rotation.set(o.rx ?? 0, o.ry ?? 0, o.rz ?? 0);
  m.castShadow = o.shadow ?? false;
  m.receiveShadow = true;
  parent.add(m);
}

const box = (w: number, h: number, d: number): THREE.BoxGeometry => new THREE.BoxGeometry(w, h, d);

function wrapAngle(a: number): number {
  return ((a + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
}

/** A cottage facing +x (its front door looks at the infield). */
function buildCottage(parent: THREE.Object3D, x: number, z: number): void {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.rotation.y = Math.PI / 2; // local +z (the front) becomes +x
  parent.add(g);
  const cream = 0xf3e6c8;
  const roof = 0xb23a2e;
  part(g, box(6, 3, 5), cream, 0, 1.5, 0, { shadow: true });
  const gable = new THREE.Shape();
  gable.moveTo(-3, 0);
  gable.lineTo(3, 0);
  gable.lineTo(0, 1.5);
  gable.closePath();
  const gableGeo = new THREE.ExtrudeGeometry(gable, { depth: 0.1, bevelEnabled: false });
  part(g, gableGeo, cream, 0, 3, 2.5, { shadow: true });
  part(g, gableGeo, cream, 0, 3, -2.6, { shadow: true });
  const pitch = Math.atan(0.5); // rise 1.5 over run 3
  part(g, box(3.7, 0.25, 5.8), roof, -1.5, 3.75, 0, { rz: pitch, shadow: true });
  part(g, box(3.7, 0.25, 5.8), roof, 1.5, 3.75, 0, { rz: -pitch, shadow: true });
  part(g, box(0.6, 1.6, 0.6), 0x9a5b3c, 1.8, 4.6, -1, { shadow: true });
  part(g, box(0.9, 2, 0.1), 0x6b4a2b, 0, 1, 2.55); // door
  for (const wx of [-1.8, 1.8]) part(g, box(1.1, 1, 0.1), 0xbfe3f0, wx, 1.8, 2.55); // windows
}

/** A garden shed (the garden-shed prefab, at 2x). */
function buildShed(parent: THREE.Object3D, x: number, z: number): void {
  const shed = buildPrefab('garden-shed', { scale: 2 });
  shed.position.set(x, 0, z);
  parent.add(shed);
}

/** A broadleaf tree (the broadleaf-tree prefab, tinted green and scaled to the old trunk-and-crown). */
function buildTree(parent: THREE.Object3D, x: number, z: number): void {
  const tree = buildPrefab('broadleaf-tree', { scale: 5.5, tint: 0x3f7d3a });
  tree.position.set(x, 0, z);
  parent.add(tree);
}

/** A ride-on mower facing +z, red, no driver: the ride-on-mower prefab. */
function buildMower(parent: THREE.Object3D): THREE.Group {
  const g = buildPrefab('ride-on-mower', { tint: 0xc2262e });
  parent.add(g);
  return g;
}

function paintBoard(g: CanvasRenderingContext2D, n: number): void {
  g.fillStyle = '#1f4d24';
  g.fillRect(0, 0, 512, 200);
  g.strokeStyle = '#f2b626';
  g.lineWidth = 8;
  g.strokeRect(8, 8, 496, 184);
  g.fillStyle = '#fff3c4';
  g.font = 'bold 64px sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(`ACORNS: ${n}`, 256, 104);
}

export function buildPanicShow(scene: THREE.Scene, track: Track): CourseShow {
  const root = new THREE.Group();
  scene.add(root);
  const rng = mulberry32(2026);

  // Fixed pieces must be at least 2 m off the track edge. Nudge any that are not, straight outwards from the centre.
  // Walk a point along (ux, uz) until it is at least 2 m off the track edge.
  const pushOff = (x: number, z: number, ux: number, uz: number): { x: number; z: number } => {
    let px = x;
    let pz = z;
    for (let i = 0; i < 80 && distFromTrackEdge(track, px, pz) < 2; i++) {
      px += ux * 0.5;
      pz += uz * 0.5;
    }
    return { x: px, z: pz };
  };
  const safe = (x: number, z: number): { x: number; z: number } => {
    const len = Math.hypot(x, z) || 1;
    return pushOff(x, z, x / len, z / len);
  };

  // The infield: cottage on the west side, shed on the east, washing line and bird bath out on the margins.
  const cottage = safe(-19, 0);
  buildCottage(root, cottage.x, cottage.z);
  const shed = safe(19, -2);
  buildShed(root, shed.x, shed.z);

  // Garden dressing outside the track.
  const trees = [[50, 40], [-50, 40], [50, -44], [-20, 44]];
  for (const [tx, tz] of trees) {
    const p = safe(tx, tz);
    buildTree(root, p.x, p.z);
  }
  const beds = [[-50, -4], [50, 6]];
  const flower = new THREE.SphereGeometry(0.18, 6, 4);
  for (const [bx, bz] of beds) {
    const b = safe(bx, bz);
    part(root, box(1.6, 0.3, 4), 0x5a3d2b, b.x, 0.15, b.z);
    for (let k = 0; k < 14; k++) {
      const fx = b.x + (rng() - 0.5) * 1.2;
      const fz = b.z + (rng() - 0.5) * 3.4;
      part(root, flower, FLOWER_COLOURS[k % FLOWER_COLOURS.length], fx, 0.45, fz);
    }
  }
  const bath = safe(0, -46);
  const birdbath = buildPrefab('birdbath', { scale: 1.6 });
  birdbath.position.set(bath.x, 0, bath.z);
  root.add(birdbath);
  // Picket fence along the west margin: 1 m picket-fence sections, turned to run along z. Each section is pushed west
  // until it clears the track edge (the track runs along x = -52 here).
  for (let z = -12; z < 12; z += 1) {
    const section = buildPrefab('picket-fence');
    const p = pushOff(-53, z + 0.5, -1, 0);
    section.position.set(p.x, 0, p.z);
    section.rotation.y = Math.PI / 2;
    root.add(section);
  }
  // Washing line, moved off the track like the other fixed pieces (the poles sit 1.5 m either side of the middle).
  const pole = new THREE.CylinderGeometry(0.05, 0.05, 2.2, 6);
  const line = { x: -48, z: -44 };
  const lineLen = Math.hypot(line.x, line.z);
  for (let i = 0; i < 80 && Math.min(...[-1.5, 0, 1.5].map((dx) => distFromTrackEdge(track, line.x + dx, line.z))) < 2; i++) {
    line.x += (line.x / lineLen) * 0.5;
    line.z += (line.z / lineLen) * 0.5;
  }
  part(root, pole, 0x6b4a2b, line.x - 1.5, 1.1, line.z);
  part(root, pole, 0x6b4a2b, line.x + 1.5, 1.1, line.z);
  part(root, box(3, 0.02, 0.02), 0x222222, line.x, 2, line.z);
  for (const sx of [-0.7, 0.7]) part(root, box(0.9, 0.9, 0.02), 0xffffff, line.x + sx, 1.6, line.z);

  // The scoreboard, floating over the infield on two poles.
  for (const px of [-2.4, 2.4]) part(root, new THREE.CylinderGeometry(0.12, 0.12, 5.2, 8), 0x6b4a2b, px, 2.6, 0);
  part(root, box(5.8, 2.4, 0.15), 0x6b4a2b, 0, 5.6, 0);
  const tex = canvasTexture(512, 200, (g) => paintBoard(g, 0));
  const boardMat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide });
  const boardGeo = new THREE.PlaneGeometry(5.4, 2.1);
  for (const side of [0.1, -0.1]) {
    const face = new THREE.Mesh(boardGeo, boardMat);
    face.position.set(0, 5.6, side);
    face.rotation.y = side > 0 ? 0 : Math.PI;
    root.add(face);
  }
  let shownAcorns = -1;

  // The infield game: a player gnome on the 10 m ring, six acorns on the ring, two mowers on the 9 m and 12 m rings.
  const player: Actor = createActor(scene, RING_R * Math.cos(PHI0), RING_R * Math.sin(PHI0), -PHI0, { hat: 0xd23a32 });
  const acorns: { g: THREE.Group; theta: number; hide: number }[] = [];
  for (let i = 0; i < 6; i++) {
    const theta = (i / 6) * Math.PI * 2;
    const g = buildPrefab('acorn', { scale: 2.8, tint: 'gold' });
    g.position.set(RING_R * Math.cos(theta), 0, RING_R * Math.sin(theta));
    root.add(g);
    acorns.push({ g, theta, hide: 0 });
  }
  const mowers = [
    { g: buildMower(root), r: 9, phase: 0.9 }, // just ahead of the gnome, on the inner ring
    { g: buildMower(root), r: 12, phase: -0.9 }, // behind it, on the outer ring
  ];

  let t = 0;
  let collected = 0;

  return {
    update(_raceT: number, dt: number): void {
      t += dt;
      const phi = PHI0 + OMEGA * t;
      const speed = RING_R * OMEGA;

      // The gnome runs the ring and jumps every 3 s; every second jump is a front flip.
      const jumpIdx = Math.floor(t / JUMP_EVERY);
      const jt = t - jumpIdx * JUMP_EVERY;
      const airborne = jt < JUMP_TIME;
      const u = jt / JUMP_TIME;
      const y = airborne ? JUMP_H * 4 * u * (1 - u) : 0;
      const pose = player.pose;
      pose.position.set(RING_R * Math.cos(phi), y, RING_R * Math.sin(phi));
      pose.velocity.set(-speed * Math.sin(phi), 0, speed * Math.cos(phi));
      pose.facing = -phi;
      pose.grounded = !airborne;
      pose.jumpsUsed = airborne ? (jumpIdx % 2 === 1 ? 2 : 1) : 0;
      player.update(dt);

      // Acorns: the gnome collects one as it passes, then it is hidden for 4 s.
      for (const a of acorns) {
        if (a.hide > 0) {
          a.hide -= dt;
        } else if (Math.abs(wrapAngle(phi - a.theta)) < 0.2) {
          a.hide = ACORN_HIDE;
          collected++;
        }
        a.g.visible = a.hide <= 0;
      }
      if (collected !== shownAcorns) {
        shownAcorns = collected;
        paintBoard((tex.image as HTMLCanvasElement).getContext('2d') as CanvasRenderingContext2D, collected);
        tex.needsUpdate = true;
      }

      // Mowers: circle the ring, heading along the tangent (forward = (sin h, cos h), so h = -angle).
      for (const m of mowers) {
        const a = m.phase + OMEGA * t;
        m.g.position.set(m.r * Math.cos(a), 0, m.r * Math.sin(a));
        m.g.rotation.y = -a;
      }
    },
  };
}
