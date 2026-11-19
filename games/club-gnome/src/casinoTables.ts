// The Gnomecino's blackjack tables brought to life: dealer, seated patrons, cards and chips, waitstaff.
// Mirrors the look of the Gnome Blackjack table (games/gnome-blackjack), in simplified form. Nothing here is imported from that game.
import * as THREE from 'three';
import { createGnomeModel, GNORMAN_LOOK, type GnomeLook, type GnomeModel, type PlayerState } from '@lawn/gnome';
import type { MapDef } from './config';
import type { MapExtra } from './glow';

// ---------------------------------------------------------------- layout (relative to a blackjack table's centre)
const FELT_Y = 0.955;
/** Dealer stands behind the straight edge, facing the table (+z). */
const DEALER_DZ = -0.85;
/** Patrons stand at the far corners of the curve, turned toward the table. */
const PATRON_DX = 1.35;
const PATRON_DZ = 1.35;
const CARD_W = 0.22;
const CARD_H = 0.31;
const CHIP_H = 0.016;
const CHIP_R = 0.07;
const WALK_SPEED = 1.4;
const WALK_PAUSE = 2;
const HOP_LEN = 0.45;
const HOP_H = 0.12;
/** Waiter's serving pose: the right arm raised with the tray. */
const SERVE_ARM_PITCH = -Math.PI * 0.44;
const SERVE_ARM_ROLL = -0.14;

const TEX_W = 128;
const TEX_H = 180;
const TEX_SCALE = 2;
const RANKS = ['', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const SUIT_GLYPH: Record<string, string> = { S: '♠', H: '♥', D: '♦', C: '♣' };
const CHIP_COLOR: Record<number, number> = { 5: 0xd03030, 10: 0x3050d0, 25: 0x30a050, 50: 0x202020 };

interface Pip { r: number; s: string }

/** What lies on each table: a dealer up card (plus the hole card back), two player hands, chip stacks (values, bottom first). */
const LAYOUTS: readonly {
  dealer: Pip;
  player: [Pip[], Pip[]];
  chips: [number[], number[]];
}[] = [
  {
    dealer: { r: 10, s: 'H' },
    player: [[{ r: 8, s: 'S' }, { r: 9, s: 'C' }], [{ r: 1, s: 'D' }, { r: 12, s: 'H' }]],
    chips: [[10, 10, 25], [5, 5, 50]],
  },
  {
    dealer: { r: 6, s: 'C' },
    player: [[{ r: 5, s: 'H' }, { r: 4, s: 'D' }], [{ r: 11, s: 'S' }, { r: 7, s: 'H' }]],
    chips: [[25, 25, 5], [5, 10, 10, 50]],
  },
];

const DEALER_LOOK: GnomeLook = { ...GNORMAN_LOOK, hat: 0x111111, shirt: 0xf4f4f4, pants: 0x111111, beard: 0xf4f4f4 };
const PATRON_LOOKS: readonly GnomeLook[] = [
  { ...GNORMAN_LOOK, hat: 0x3b6ea5, shirt: 0x6b3a2a, pants: 0x2a2a32, beard: 0x8a5a3a },
  { ...GNORMAN_LOOK, hat: 0xd94a7a, shirt: 0x4a2a5a, beard: null, hair: { color: 0xe6b850, style: 'pigtails' }, dress: true },
  { ...GNORMAN_LOOK, hat: 0x2e8a5a, shirt: 0x3a3a4a, beard: 0xd8d8d8, glasses: true },
];

// ---------------------------------------------------------------- helpers
function noPick(o: THREE.Object3D): THREE.Object3D {
  o.traverse((c) => {
    if (c instanceof THREE.Mesh) c.raycast = () => {};
  });
  return o;
}

function newCanvas(): CanvasRenderingContext2D {
  const cv = document.createElement('canvas');
  cv.width = TEX_W * TEX_SCALE;
  cv.height = TEX_H * TEX_SCALE;
  const ctx = cv.getContext('2d') as CanvasRenderingContext2D;
  ctx.scale(TEX_SCALE, TEX_SCALE);
  return ctx;
}

function rrect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function toTexture(ctx: CanvasRenderingContext2D): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(ctx.canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/** Texture and material caches shared by every table in one call (a handful of textures in total). */
interface Textures {
  face(p: Pip): THREE.MeshStandardMaterial;
  back: THREE.MeshStandardMaterial;
  chip(value: number): THREE.MeshStandardMaterial;
}

function makeTextures(): Textures {
  const faces = new Map<string, THREE.MeshStandardMaterial>();
  const chips = new Map<number, THREE.MeshStandardMaterial>();
  let back: THREE.MeshStandardMaterial | null = null;

  const faceMat = (p: Pip): THREE.MeshStandardMaterial => {
    const key = `${p.r}${p.s}`;
    const hit = faces.get(key);
    if (hit) return hit;
    const ctx = newCanvas();
    const ink = p.s === 'H' || p.s === 'D' ? '#c0262d' : '#1a1a1a';
    const glyph = SUIT_GLYPH[p.s] ?? '?';
    const rank = RANKS[p.r] ?? '?';
    ctx.fillStyle = '#f6eedb';
    rrect(ctx, 2, 2, TEX_W - 4, TEX_H - 4, 12);
    ctx.fill();
    ctx.strokeStyle = '#8a7a5a';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = ink;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    // Corner indexes, top-left and (turned) bottom-right.
    for (const flip of [false, true]) {
      ctx.save();
      if (flip) {
        ctx.translate(TEX_W, TEX_H);
        ctx.rotate(Math.PI);
      }
      ctx.font = `bold ${rank.length > 1 ? 20 : 24}px sans-serif`;
      ctx.fillText(rank, 15, 18);
      ctx.font = '18px sans-serif';
      ctx.fillText(glyph, 15, 38);
      ctx.restore();
    }
    // Centre: a big suit for number cards, a big letter for court cards and the ace.
    if (p.r >= 11) {
      ctx.font = 'bold 64px serif';
      ctx.fillText(rank, TEX_W / 2, TEX_H / 2);
    } else {
      ctx.font = '64px sans-serif';
      ctx.fillText(glyph, TEX_W / 2, TEX_H / 2);
    }
    const mat = new THREE.MeshStandardMaterial({ map: toTexture(ctx), roughness: 0.5 });
    faces.set(key, mat);
    return mat;
  };

  const backMat = (): THREE.MeshStandardMaterial => {
    if (back) return back;
    const ctx = newCanvas();
    ctx.fillStyle = '#7a1418';
    rrect(ctx, 0, 0, TEX_W, TEX_H, 12);
    ctx.fill();
    ctx.strokeStyle = '#d4a84b';
    ctx.lineWidth = 3;
    rrect(ctx, 8, 8, TEX_W - 16, TEX_H - 16, 8);
    ctx.stroke();
    ctx.fillStyle = '#d4a84b';
    for (let y = 30; y <= 150; y += 30) {
      for (let x = 26; x <= 102; x += 26) {
        ctx.beginPath();
        ctx.arc(x, y, 7, Math.PI, 0);
        ctx.fill();
        ctx.fillRect(x - 2, y, 4, 7);
      }
    }
    back = new THREE.MeshStandardMaterial({ map: toTexture(ctx), roughness: 0.5 });
    return back;
  };

  const chipMat = (value: number): THREE.MeshStandardMaterial => {
    const hit = chips.get(value);
    if (hit) return hit;
    const mat = new THREE.MeshStandardMaterial({ color: CHIP_COLOR[value] ?? 0x888888, roughness: 0.35 });
    chips.set(value, mat);
    return mat;
  };

  return {
    face: faceMat,
    get back() { return backMat(); },
    chip: chipMat,
  };
}

// ---------------------------------------------------------------- gnome builders
function martiniTray(liquid: number): THREE.Group {
  const tray = new THREE.Group();
  const metal = new THREE.MeshStandardMaterial({ color: 0xd8dde6, metalness: 0.7, roughness: 0.25 });
  const glass = new THREE.MeshStandardMaterial({ color: 0xe6f7ff, transparent: true, opacity: 0.45, roughness: 0.1 });
  const liq = new THREE.MeshStandardMaterial({ color: liquid, roughness: 0.2, transparent: true, opacity: 0.85 });
  const platter = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.15, 0.014, 16), metal);
  platter.position.y = 0.008;
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.085, 8), glass);
  stem.position.y = 0.065;
  const bowl = new THREE.Mesh(new THREE.ConeGeometry(0.068, 0.078, 14, 1, true), glass);
  bowl.rotation.x = Math.PI;
  bowl.position.y = 0.142;
  const drink = new THREE.Mesh(new THREE.ConeGeometry(0.056, 0.055, 14), liq);
  drink.rotation.x = Math.PI;
  drink.position.y = 0.136;
  const olive = new THREE.Mesh(
    new THREE.SphereGeometry(0.013, 8, 6),
    new THREE.MeshStandardMaterial({ color: 0x6b8e23, roughness: 0.4 }),
  );
  olive.position.set(0.015, 0.165, 0.01);
  tray.add(platter, stem, bowl, drink, olive);
  return tray;
}

/** A waiter (black vest, red bow tie) or a waitress (red skirt), each holding a martini tray. */
function serverGnome(role: 'waiter' | 'waitress'): GnomeModel {
  const waitress = role === 'waitress';
  const look: GnomeLook = waitress
    ? { ...GNORMAN_LOOK, hat: 0xc0262d, beard: null, hair: { color: 0x8a3a1a, style: 'pigtails' }, freckles: true, dress: false }
    : { ...GNORMAN_LOOK, hat: 0x1d1d26, shirt: 0xf4f4f4, pants: 0x1d1d26, beard: null, glasses: false, dress: false };
  const model = createGnomeModel(look);
  const cloth = new THREE.MeshStandardMaterial({ color: waitress ? 0xc0262d : 0x1d1d26, roughness: 0.55 });
  const trim = new THREE.MeshStandardMaterial({ color: waitress ? 0xf4f4f4 : 0xc0262d, roughness: 0.45 });
  if (waitress) {
    const top = new THREE.Mesh(new THREE.CylinderGeometry(0.205, 0.215, 0.09, 14), cloth);
    top.position.y = 0.52;
    const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.238, 0.255, 0.11, 14), cloth);
    skirt.position.y = 0.33;
    const apron = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.13, 0.025), trim);
    apron.position.set(0, 0.33, 0.24);
    model.rig.add(top, skirt, apron);
  } else {
    const vest = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.17, 0.2, 12), cloth);
    vest.position.y = 0.45;
    const tie = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.04, 0.02), trim);
    tie.position.set(0, 0.6, 0.155);
    model.rig.add(vest, tie);
  }
  const tray = martiniTray(waitress ? 0xd8f0e0 : 0xf2e8c8);
  tray.position.set(0, -0.32, 0.03);
  tray.rotation.set(-SERVE_ARM_PITCH, 0, -SERVE_ARM_ROLL);
  model.arms.right.add(tray);
  return model;
}

// ---------------------------------------------------------------- animation state
interface Idler {
  model: GnomeModel;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  facing: number;
  /** Phase offset so no two gnomes sway or hop together. */
  phase: number;
  /** Hop period in seconds (cheering); 0 = never hops. */
  period: number;
}

interface Walker {
  model: GnomeModel;
  pts: readonly { x: number; z: number }[];
  /** Index of the waypoint the walker is heading for. */
  next: number;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  facing: number;
  pause: number;
  pose: PlayerState;
}

function stepWalker(w: Walker, dt: number): void {
  if (w.pause > 0) {
    w.pause -= dt;
    w.vel.set(0, 0, 0);
    return;
  }
  const tgt = w.pts[w.next];
  const dx = tgt.x - w.pos.x;
  const dz = tgt.z - w.pos.z;
  const d = Math.hypot(dx, dz);
  if (d <= WALK_SPEED * dt) {
    w.pos.set(tgt.x, 0, tgt.z);
    w.next = (w.next + 1) % w.pts.length;
    w.pause = WALK_PAUSE;
    w.vel.set(0, 0, 0);
    return;
  }
  w.vel.set((dx / d) * WALK_SPEED, 0, (dz / d) * WALK_SPEED);
  w.facing = Math.atan2(dx, dz);
  w.pos.addScaledVector(w.vel, dt);
}

// ---------------------------------------------------------------- the stub's replacement
/** Called only when map.id === 'gnomecino'. Adds the tables' people, cards, chips and waitstaff to g. */
export function addCasinoTables(g: THREE.Group, map: MapDef): MapExtra {
  const tex = makeTextures();
  const idlers: Idler[] = [];
  const walkers: Walker[] = [];
  const cardGeo = new THREE.PlaneGeometry(CARD_W, CARD_H);
  const chipGeo = new THREE.CylinderGeometry(CHIP_R, CHIP_R, CHIP_H, 14);

  const put = (o: THREE.Object3D): void => {
    g.add(noPick(o));
  };

  // A card lying on the felt, top edge toward the dealer, so the player reads it with its bottom edge toward them.
  const placeCard = (p: Pip, x: number, z: number, yaw: number, face: boolean): void => {
    const holder = new THREE.Group();
    holder.position.set(x, FELT_Y, z);
    holder.rotation.y = yaw;
    const card = new THREE.Mesh(cardGeo, face ? tex.face(p) : tex.back);
    card.rotation.x = -Math.PI / 2;
    card.position.y = 0.002;
    holder.add(card);
    put(holder);
  };

  // Chip stack: values bottom first, drawn as flat cylinders.
  const placeChips = (values: readonly number[], x: number, z: number): void => {
    values.forEach((v, k) => {
      const chip = new THREE.Mesh(chipGeo, tex.chip(v));
      chip.position.set(x, FELT_Y + CHIP_H / 2 + k * CHIP_H, z);
      put(chip);
    });
  };

  const tables = map.props.filter((p) => p.prefab === 'blackjack-table');
  tables.forEach((table, ti) => {
    const cx = table.x;
    const cz = table.z;
    const layout = LAYOUTS[ti % LAYOUTS.length];

    // Dealer, behind the straight edge, facing the table.
    const dealer = createGnomeModel(DEALER_LOOK);
    put(dealer.object);
    idlers.push({
      model: dealer,
      pos: new THREE.Vector3(cx, 0, cz + DEALER_DZ),
      vel: new THREE.Vector3(),
      facing: 0,
      phase: ti * 1.7,
      period: 0,
    });

    // Two patrons at the far corners of the curve, turned toward the table.
    const patronA = PATRON_LOOKS[(ti * 2) % PATRON_LOOKS.length];
    const patronB = PATRON_LOOKS[(ti * 2 + 1) % PATRON_LOOKS.length];
    for (const [side, look, k] of [[-1, patronA, 0], [1, patronB, 1]] as const) {
      const px = cx + side * PATRON_DX;
      const pz = cz + PATRON_DZ;
      const model = createGnomeModel(look);
      put(model.object);
      idlers.push({
        model,
        pos: new THREE.Vector3(px, 0, pz),
        vel: new THREE.Vector3(),
        facing: Math.atan2(-side * PATRON_DX, -PATRON_DZ),
        phase: ti * 2.3 + k * 1.1,
        period: 6 + ((ti + k) % 3) * 1.5,
      });
    }

    // Dealer hand: the up card and the hole card (back).
    placeCard(layout.dealer, cx - 0.12, cz - 1.75, 0, true);
    placeCard(layout.dealer, cx + 0.14, cz - 1.8, -0.12, false);

    // Two player hands, two cards each, in front of the two betting spots.
    layout.player.forEach((hand, h) => {
      const hx = cx + (h === 0 ? -0.7 : 0.7);
      hand.forEach((p, k) => {
        placeCard(p, hx + (k === 0 ? -0.06 : 0.07), cz - 0.15 + k * 0.02, (k === 0 ? 0.05 : -0.08) + h * 0.03, true);
      });
    });

    // Chip stacks at the betting spots, in front of the player hands.
    placeChips(layout.chips[0], cx - 0.7, cz + 0.4);
    placeChips(layout.chips[1], cx + 0.7, cz + 0.4);
  });

  // Ambient waitstaff: a waiter on a long lane, a waitress on a shorter one, both in the open floor in front of the tables.
  const waiter = serverGnome('waiter');
  const waitress = serverGnome('waitress');
  put(waiter.object);
  put(waitress.object);
  const addWalker = (model: GnomeModel, pts: { x: number; z: number }[], start: number): void => {
    const pos = new THREE.Vector3(pts[start].x, 0, pts[start].z);
    const vel = new THREE.Vector3();
    walkers.push({
      model,
      pts,
      next: (start + 1) % pts.length,
      pos,
      vel,
      facing: 0,
      pause: start === 0 ? 0 : WALK_PAUSE,
      pose: { position: pos, velocity: vel, facing: 0, grounded: true, jumpsUsed: 0 },
    });
  };
  addWalker(waiter, [{ x: -6, z: 2.5 }, { x: 6, z: 2.5 }, { x: 6, z: 4.5 }, { x: -6, z: 4.5 }], 0);
  addWalker(waitress, [{ x: -9, z: 3.5 }, { x: 9, z: 3.5 }], 1);

  return {
    update(dt: number, t: number): void {
      for (const w of walkers) {
        stepWalker(w, dt);
        w.pose.facing = w.facing;
        w.model.update(w.pose, dt);
        w.model.arms.right.rotation.x = SERVE_ARM_PITCH;
        w.model.arms.right.rotation.z = SERVE_ARM_ROLL;
      }
      for (const d of idlers) {
        // Idle sway: the gnome turns a little side to side.
        const sway = Math.sin(t * 0.9 + d.phase) * 0.06;
        // Cheering: a short hop every few seconds, each on its own beat.
        let lift = 0;
        if (d.period > 0) {
          const k = (t + d.phase) % d.period;
          if (k < HOP_LEN) lift = Math.sin((Math.PI * k) / HOP_LEN) * HOP_H;
        }
        d.pos.y = lift;
        d.model.update({ position: d.pos, velocity: d.vel, facing: d.facing + sway, grounded: true, jumpsUsed: 0 }, dt);
      }
    },
  };
}
