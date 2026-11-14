// The bowling alley around the playable lane: the lane and its gutters, the approach, the pin deck and pit,
// the pinsetter hood, three neighbouring lanes on each side, the room with neon, and six bowl-cut spectators
// who hop or groan when the ball's result comes in. Built once from three.js primitives; nothing else is exported.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { LANE, LOOKS, LOOK_COLORS, LOOK_ORDER, PIN, PIN_SPOTS, type Ctx, type System } from './config';
import { createGnomeModel } from './models/gnome';
import type { GnomeModel, PlayerState } from './models/config';

const BOARDS = 39;
const BOARD_W = (2 * LANE.halfWidth) / BOARDS;
/** Foul line to the far end of the pin deck. The pit starts here. */
const DECK_Z = LANE.length + LANE.deckPastHeadPin;
const PIT_END = DECK_Z + 1.0;
/** Distance from the lane centre to the outer edge of a gutter. */
const OUTER = LANE.halfWidth + LANE.gutterWidth;
const GUTTER_R = LANE.gutterWidth / 2;
const ROOM_HALF = 8;
const ROOM_BACK = 22.5;
const ROOM_FRONT = -12;
const CEILING_Y = 4;
const BENCH_Y = 0.45;
const BENCH_Z = -6.6;
const ARROW_BOARDS = [5, 10, 15, 20, 25, 30, 35];
const CROWD_HATS = [0xff8a3d, 0x9be15d, 0x8a3ec9, 0xf2f2f2, 0x3ff0ff, 0xff3fb4];
const CHEER = new Set(['strike', 'double', 'turkey', 'hambone', 'spare']);
const GROAN = new Set(['gutter', 'miss']);

const hex = (c: number): string => `#${c.toString(16).padStart(6, '0')}`;
/** x of the centre of board b (1-based) on a lane centred at x = 0. */
const boardX = (b: number): number => -LANE.halfWidth + (b - 0.5) * BOARD_W;

function canvasTexture(w: number, h: number, draw: (g: CanvasRenderingContext2D, w: number, h: number) => void): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const g = canvas.getContext('2d');
  if (g) draw(g, w, h);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function drawLane(g: CanvasRenderingContext2D, w: number, h: number): void {
  const bw = w / BOARDS;
  for (let i = 0; i < BOARDS; i++) {
    g.fillStyle = hex(i % 2 === 0 ? LOOK_COLORS.laneWood : LOOK_COLORS.laneWoodDark);
    g.fillRect(i * bw, 0, bw + 1, h);
  }
  g.lineWidth = 1;
  for (let i = 0; i < 220; i++) {
    const x = Math.random() * w;
    g.strokeStyle = `rgba(90, 50, 20, ${0.05 + Math.random() * 0.08})`;
    g.beginPath();
    g.moveTo(x, 0);
    g.bezierCurveTo(x + (Math.random() - 0.5) * 6, h * 0.33, x + (Math.random() - 0.5) * 6, h * 0.66, x + (Math.random() - 0.5) * 4, h);
    g.stroke();
  }
  g.fillStyle = 'rgba(60, 30, 10, 0.35)';
  for (let i = 0; i <= BOARDS; i++) g.fillRect(i * bw, 0, 1, h);
}

function drawCarpet(g: CanvasRenderingContext2D, w: number, h: number): void {
  g.fillStyle = hex(LOOK_COLORS.carpet);
  g.fillRect(0, 0, w, h);
  const cols = ['#ff3fb4', '#3ff0ff', '#ffd54f', '#5cff7a', '#ff8a3d', '#ffffff'];
  for (let i = 0; i < 140; i++) {
    g.fillStyle = cols[i % cols.length];
    const s = 4 + Math.random() * 7;
    g.save();
    g.translate(Math.random() * w, Math.random() * h);
    g.rotate(Math.random() * Math.PI);
    const kind = i % 3;
    if (kind === 0) {
      g.beginPath();
      g.arc(0, 0, s * 0.5, 0, Math.PI * 2);
      g.fill();
    } else if (kind === 1) {
      g.fillRect(-s / 2, -s / 6, s, s / 3);
    } else {
      g.beginPath();
      g.moveTo(0, -s / 2);
      g.lineTo(s / 2, s / 2);
      g.lineTo(-s / 2, s / 2);
      g.closePath();
      g.fill();
    }
    g.restore();
  }
}

function drawSign(g: CanvasRenderingContext2D, w: number, h: number): void {
  g.fillStyle = 'rgba(20, 10, 40, 0.9)';
  g.fillRect(0, 0, w, h);
  g.font = 'italic 900 56px system-ui, sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.shadowColor = hex(LOOK_COLORS.neonPink);
  g.shadowBlur = 18;
  g.fillStyle = hex(LOOK_COLORS.neonPink);
  g.fillText('GNOME LANES', w / 2, h / 2 + 4);
}

/** Lathe-turned pin: white, bowling-pin profile. Radius, height pairs. */
function pinGeometry(): THREE.LatheGeometry {
  const profile: [number, number][] = [
    [0.001, 0], [0.024, 0], [0.03, 0.03], [0.058, 0.1], [0.06, 0.15], [0.045, 0.22],
    [0.03, 0.27], [0.032, 0.31], [0.024, 0.34], [0.015, 0.36], [0.001, PIN.height],
  ];
  return new THREE.LatheGeometry(profile.map(([x, y]) => new THREE.Vector2(x, y)), 10);
}

export function createLane(ctx: Ctx): System {
  const root = new THREE.Group();
  ctx.scene.add(root);

  // ---- Materials (shared) ----
  const laneTex = canvasTexture(256, 512, drawLane);
  laneTex.wrapT = THREE.RepeatWrapping;
  laneTex.repeat.set(1, DECK_Z / (2 * LANE.halfWidth));
  const carpetTex = canvasTexture(256, 256, drawCarpet);
  carpetTex.wrapS = THREE.RepeatWrapping;
  carpetTex.wrapT = THREE.RepeatWrapping;
  carpetTex.repeat.set(4, 3);
  const signTex = canvasTexture(512, 128, drawSign);

  const M = {
    lane: new THREE.MeshStandardMaterial({ map: laneTex, roughness: 0.25, metalness: 0.05 }),
    approach: new THREE.MeshStandardMaterial({ color: LOOK_COLORS.approach, roughness: 0.4 }),
    gutter: new THREE.MeshStandardMaterial({ color: LOOK_COLORS.gutter, roughness: 0.4, metalness: 0.6, side: THREE.DoubleSide }),
    metal: new THREE.MeshStandardMaterial({ color: 0x9aa3ad, roughness: 0.3, metalness: 0.7 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x1a1a22, roughness: 0.8 }),
    curtain: new THREE.MeshStandardMaterial({ color: 0x050308, roughness: 1 }),
    foul: new THREE.MeshStandardMaterial({ color: LOOK_COLORS.pinRed, roughness: 0.5 }),
    mark: new THREE.MeshStandardMaterial({ color: 0x2a1a10, roughness: 0.6 }),
    pin: new THREE.MeshStandardMaterial({ color: LOOK_COLORS.pinWhite, roughness: 0.35 }),
    hood: new THREE.MeshStandardMaterial({ color: 0x2a1d4a, roughness: 0.5 }),
    ballReturn: new THREE.MeshStandardMaterial({ color: 0x4a3a6a, roughness: 0.3, metalness: 0.3 }),
    pink: new THREE.MeshStandardMaterial({ color: LOOK_COLORS.neonPink, emissive: LOOK_COLORS.neonPink, emissiveIntensity: 1.2 }),
    cyan: new THREE.MeshStandardMaterial({ color: LOOK_COLORS.neonCyan, emissive: LOOK_COLORS.neonCyan, emissiveIntensity: 1.2 }),
    screen: new THREE.MeshStandardMaterial({ color: 0x0b0814, roughness: 0.3 }),
    wall: new THREE.MeshStandardMaterial({ color: 0x2a1748, roughness: 0.9, side: THREE.DoubleSide }),
    ceiling: new THREE.MeshStandardMaterial({ color: 0x120a22, roughness: 1, side: THREE.DoubleSide }),
    floor: new THREE.MeshStandardMaterial({ color: 0x140a24, roughness: 1, side: THREE.DoubleSide }),
    carpet: new THREE.MeshStandardMaterial({ map: carpetTex, roughness: 1 }),
    panel: new THREE.MeshStandardMaterial({ color: 0xfff4e0, emissive: 0xfff4e0, emissiveIntensity: 0.9 }),
    bench: new THREE.MeshStandardMaterial({ color: 0x7a4a2a, roughness: 0.7 }),
    sign: new THREE.MeshStandardMaterial({ map: signTex, emissive: 0xffffff, emissiveMap: signTex, emissiveIntensity: 0.6, roughness: 0.5 }),
  };

  // ---- Geometries (shared) ----
  const laneGeo = new THREE.BoxGeometry(2 * LANE.halfWidth, 0.05, DECK_Z);
  const approachGeo = new THREE.BoxGeometry(2 * OUTER, 0.05, LANE.approach);
  // Half-pipe gutter: the bottom half of a cylinder lying along z, with its rim at y = 0.
  const troughGeo = new THREE.CylinderGeometry(GUTTER_R, GUTTER_R, DECK_Z, 12, 1, true, -Math.PI / 2, Math.PI);
  troughGeo.rotateX(Math.PI / 2);
  const capGeo = new THREE.BoxGeometry(0.02, 0.012, DECK_Z);
  const pitGeo = new THREE.BoxGeometry(2 * OUTER, 0.59, 1.0);
  const curtainGeo = new THREE.BoxGeometry(2 * OUTER + 0.04, 2.4, 0.05);
  const hoodGeo = new THREE.BoxGeometry(1.6, 0.6, PIT_END - (LANE.length - 0.6));
  const ballReturnGeo = new RoundedBoxGeometry(0.07, 0.12, DECK_Z, 2, 0.03);
  const pinGeo = pinGeometry();
  const foulGeo = new THREE.BoxGeometry(2 * LANE.halfWidth, 0.004, 0.03);
  const dotGeo = new THREE.CircleGeometry(0.018, 12);
  dotGeo.rotateX(-Math.PI / 2);
  const arrowShape = new THREE.Shape();
  arrowShape.moveTo(-0.025, 0);
  arrowShape.lineTo(0.025, 0);
  arrowShape.lineTo(0, -0.12);
  arrowShape.closePath();
  const arrowGeo = new THREE.ShapeGeometry(arrowShape);
  arrowGeo.rotateX(-Math.PI / 2);
  const stripGeo = new THREE.BoxGeometry(0.04, 0.06, 19);
  const hoodNeonGeo = new THREE.BoxGeometry(1.6, 0.04, 0.02);

  const mesh = (geo: THREE.BufferGeometry, mat: THREE.Material, x: number, y: number, z: number): THREE.Mesh => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    root.add(m);
    return m;
  };

  // ---- Lanes ----
  /** Builds one lane whose centre is at x. The main lane (detailed) gets arrows, dots, approach and the sign. */
  const buildLane = (x: number, detailed: boolean): void => {
    mesh(laneGeo, M.lane, x, -0.025, DECK_Z / 2).receiveShadow = true;
    for (const side of [-1, 1]) {
      const gx = x + side * (LANE.halfWidth + GUTTER_R);
      const trough = mesh(troughGeo, M.gutter, gx, 0, DECK_Z / 2);
      trough.scale.y = LANE.gutterDepth / GUTTER_R;
      if (detailed) mesh(capGeo, M.metal, x + side * (OUTER + 0.01), 0.006, DECK_Z / 2);
    }
    // Pit behind the deck (top just under the deck surface), curtain at its back, hood over the deck.
    mesh(pitGeo, M.dark, x, -0.305, DECK_Z + 0.5);
    mesh(curtainGeo, M.curtain, x, 0.6, PIT_END + 0.025);
    mesh(hoodGeo, M.hood, x, 1.3, (LANE.length - 0.6 + PIT_END) / 2);
    if (!detailed) {
      for (const i of [0, 1, 3, 6]) {
        const [px, pz] = PIN_SPOTS[i];
        mesh(pinGeo, M.pin, x + px, 0, pz);
      }
      return;
    }
    // Targeting: 7 arrows in a V, 7 dots, the foul line, the approach and its dots.
    for (const b of ARROW_BOARDS) {
      const k = Math.abs((b - 20) / 5);
      const a = mesh(arrowGeo, M.mark, x + boardX(b), 0.002, 4.6 + 0.06 * (3 - k));
      a.receiveShadow = true;
      mesh(dotGeo, M.mark, x + boardX(b), 0.002, 2.0);
    }
    mesh(foulGeo, M.foul, x, 0.002, 0);
    mesh(approachGeo, M.approach, x, -0.025, -LANE.approach / 2).receiveShadow = true;
    for (const b of ARROW_BOARDS) mesh(dotGeo, M.mark, x + boardX(b), 0.002, -1.2);
    // Pinsetter neon and the GNOME LANES sign on the hood's front face.
    mesh(hoodNeonGeo, M.cyan, x, 1.02, LANE.length - 0.6 - 0.01);
    const sign = mesh(new THREE.PlaneGeometry(1.4, 0.35), M.sign, x, 1.3, LANE.length - 0.6 - 0.005);
    sign.rotation.y = Math.PI;
  };

  buildLane(0, true);
  for (const k of [1, 2, 3]) {
    buildLane(k * LANE.lanePitch, false);
    buildLane(-k * LANE.lanePitch, false);
  }

  // Divider ball returns in the gaps between lanes.
  for (const x of [0.8, 2.4, 4.0]) {
    mesh(ballReturnGeo, M.ballReturn, x, 0, DECK_Z / 2);
    mesh(ballReturnGeo, M.ballReturn, -x, 0, DECK_Z / 2);
  }

  // Pinsetter scoreboard hanging over the approach (dark screen; the real scoreboard is DOM).
  mesh(new THREE.BoxGeometry(1.4, 0.5, 0.06), M.screen, 0, 3.7, -1.5);

  // ---- The room ----
  const carpet = mesh(new THREE.PlaneGeometry(2 * ROOM_HALF, -ROOM_FRONT), M.carpet, 0, -0.02, (ROOM_FRONT) / 2);
  carpet.rotation.x = -Math.PI / 2;
  carpet.receiveShadow = true;
  const floor = mesh(new THREE.PlaneGeometry(2 * ROOM_HALF, ROOM_BACK), M.floor, 0, -0.65, ROOM_BACK / 2);
  floor.rotation.x = -Math.PI / 2;

  const wallLen = ROOM_BACK - ROOM_FRONT;
  const leftWall = mesh(new THREE.PlaneGeometry(wallLen, 4), M.wall, -ROOM_HALF, 2, (ROOM_BACK + ROOM_FRONT) / 2);
  leftWall.rotation.y = Math.PI / 2;
  const rightWall = mesh(new THREE.PlaneGeometry(wallLen, 4), M.wall, ROOM_HALF, 2, (ROOM_BACK + ROOM_FRONT) / 2);
  rightWall.rotation.y = -Math.PI / 2;
  mesh(new THREE.PlaneGeometry(2 * ROOM_HALF, 4), M.wall, 0, 2, ROOM_BACK).rotation.y = Math.PI;
  mesh(new THREE.PlaneGeometry(2 * ROOM_HALF, 4), M.wall, 0, 2, ROOM_FRONT);

  const ceiling = mesh(new THREE.PlaneGeometry(2 * ROOM_HALF, wallLen), M.ceiling, 0, CEILING_Y, (ROOM_BACK + ROOM_FRONT) / 2);
  ceiling.rotation.x = Math.PI / 2;

  // Ceiling light panels: one instanced mesh.
  const panels = new THREE.InstancedMesh(new THREE.BoxGeometry(0.5, 0.02, 0.5), M.panel, 6 * 8);
  const m4 = new THREE.Matrix4();
  let n = 0;
  for (let ix = 0; ix < 6; ix++) {
    for (let iz = 0; iz < 8; iz++) {
      m4.makeTranslation(-5 + ix * 2, CEILING_Y - 0.02, -10 + iz * 4.4);
      panels.setMatrixAt(n++, m4);
    }
  }
  panels.instanceMatrix.needsUpdate = true;
  root.add(panels);

  // Neon strips along the walls above the pin decks (pink left, cyan right, a second row above).
  mesh(stripGeo, M.pink, -7.97, 2.2, 9.5);
  mesh(stripGeo, M.cyan, 7.97, 2.2, 9.5);
  mesh(stripGeo, M.cyan, -7.97, 3.2, 9.5);
  mesh(stripGeo, M.pink, 7.97, 3.2, 9.5);

  // Benches behind the approach (empty: the spectators stand beside the foul line, where the aim camera sees them).
  const seatGeo = new THREE.BoxGeometry(2.6, 0.06, 0.4);
  const legGeo = new THREE.BoxGeometry(0.06, 0.42, 0.36);
  for (const bx of [-1.8, 1.8]) {
    mesh(seatGeo, M.bench, bx, BENCH_Y - 0.03, BENCH_Z);
    for (const lx of [-1.2, 1.2]) mesh(legGeo, M.bench, bx + lx, 0.21, BENCH_Z);
  }

  // ---- Spectators ----
  interface Spectator { model: GnomeModel; ps: PlayerState; index: number }
  const spectators: Spectator[] = [];
  // On the neighbouring approaches either side of ours, near the foul line, turned toward our lane.
  const seatPositions: [number, number][] = [[-1.3, -0.4], [-1.8, 0.1], [-2.3, -0.7], [1.3, -0.4], [1.8, 0.1], [2.3, -0.7]];
  seatPositions.forEach(([x, z], i) => {
    const id = LOOK_ORDER[i % LOOK_ORDER.length];
    const model = createGnomeModel({ ...LOOKS[id].look, hat: CROWD_HATS[i % CROWD_HATS.length] });
    model.object.traverse((o) => {
      if (o instanceof THREE.Mesh) o.castShadow = true;
    });
    const ps: PlayerState = {
      position: new THREE.Vector3(x, 0, z),
      velocity: new THREE.Vector3(),
      facing: x > 0 ? -0.6 : 0.6,
      grounded: true,
      jumpsUsed: 0,
      stamina: 1,
      staminaDelay: 0,
      sprinting: false,
      exhausted: false,
    };
    root.add(model.object);
    spectators.push({ model, ps, index: i });
  });

  return {
    update(dt: number): void {
      const s = ctx.state;
      const t = s.time;

      // Neon breathes: all neon shares two materials, so this pulses the whole alley.
      M.pink.emissiveIntensity = 1.0 + 0.35 * Math.sin(t * 2.2);
      M.cyan.emissiveIntensity = 1.0 + 0.35 * Math.sin(t * 2.2 + Math.PI);

      const kind = s.phase === 'result' && s.result ? s.result.kind : null;
      const cheer = kind !== null && CHEER.has(kind);
      const groan = kind !== null && GROAN.has(kind);

      for (const sp of spectators) {
        const { model, ps, index: i } = sp;
        // Staggered hop on a good ball; everyone else stands still.
        ps.position.y = (cheer ? Math.abs(Math.sin(t * 9 + i * 1.3)) * 0.12 : 0);
        model.update(ps, dt);
        const arms = model.arms;
        if (cheer) {
          arms.left.rotation.x = -2.6;
          arms.right.rotation.x = -2.6;
          arms.left.rotation.z = 0;
          arms.right.rotation.z = 0;
          model.rig.rotation.x = 0;
          model.rig.rotation.y = Math.sin(t * 9 + i) * 0.1;
        } else if (groan) {
          // Hands on heads, slumped.
          arms.left.rotation.x = -2.9;
          arms.right.rotation.x = -2.9;
          arms.left.rotation.z = 0.6;
          arms.right.rotation.z = -0.6;
          model.rig.rotation.x = 0.3;
          model.rig.rotation.y = 0;
        } else {
          // Idle sway.
          arms.left.rotation.x = Math.sin(t * 1.6 + i) * 0.05;
          arms.right.rotation.x = Math.sin(t * 1.6 + i + Math.PI) * 0.05;
          arms.left.rotation.z = 0;
          arms.right.rotation.z = 0;
          model.rig.rotation.x = 0;
          model.rig.rotation.y = Math.sin(t * 1.3 + i * 1.7) * 0.12;
        }
      }
    },
  };
}
