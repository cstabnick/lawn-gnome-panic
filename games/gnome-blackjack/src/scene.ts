// The 3D table: felt, dealer gnome, seated gnomes, cards and chips. Renders any TableState it is given.
import * as THREE from 'three';
import { createGnomeModel, resolveLook, GNORMAN_LOOK, type GnomeModel, type PlayerState, type GnomeLook } from '@lawn/gnome';
import { buildHeld } from '@lawn/prefabs';
import { DEALER, SEAT_COUNT, type Card, type Seat, type TableState } from './config';
import { CHARACTERS, DEALER_CHAR } from './characters';

export interface TableView {
  sync(st: TableState, dt: number): void;
  headPos(seat: number, out: THREE.Vector3): THREE.Vector3;
  /** Where a seated gnome's eyes are (first-person camera). */
  eyePos(seat: number, out: THREE.Vector3): THREE.Vector3;
  /** Hide one seat's gnome (my own, in first person), or -1 to show all. */
  hideSeat(seat: number): void;
}

// ---------------------------------------------------------------- layout
const TABLE_Y = 0.5;
const TABLE_Z = -0.9;
const FELT_R = 2.3;
const SEAT_R = 2.55;
const HAND_R = 1.75;
const CHIP_R = 1.35;
const CARD_W = 0.22;
const CARD_H = 0.31;
const CARD_FAN = 0.13;
const DEALER_CARD_GAP = 0.16;
const DEAL_ANIM_S = 0.3;
const SHOE = new THREE.Vector3(1.7, TABLE_Y + 0.12, -0.6);
const DEALER_POS = new THREE.Vector3(0, 0, -1.4);
const CHIP_H = 0.016;
const CHIP_MAX_LAYERS = 12;

/** Seat angle on the arc (the table's centre is (0, TABLE_Z)). */
function seatAngle(i: number): number {
  return Math.PI * (0.12 + 0.76 * i / (SEAT_COUNT - 1));
}

/** Point on the seat arc at radius r, written to out (y 0). */
function arcPoint(i: number, r: number, out: THREE.Vector3): THREE.Vector3 {
  const th = seatAngle(i);
  return out.set(r * Math.cos(th), 0, TABLE_Z + r * Math.sin(th));
}

// Yaw that turns a lying card's top edge toward the seat (outward on the arc).
function cardYawForSeat(i: number): number {
  const th = seatAngle(i);
  return Math.atan2(-Math.cos(th), -Math.sin(th));
}

// ---------------------------------------------------------------- card textures
const RANKS = ['', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const SUIT_GLYPH: Record<string, string> = { S: '♠', H: '♥', D: '♦', C: '♣' };
const TEX_W = 128;
const TEX_H = 180;
const faceCache = new Map<string, THREE.CanvasTexture>();
let backCache: THREE.CanvasTexture | null = null;

function newCanvas(): CanvasRenderingContext2D {
  const cv = document.createElement('canvas');
  cv.width = TEX_W;
  cv.height = TEX_H;
  return cv.getContext('2d') as CanvasRenderingContext2D;
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
  return tex;
}

function faceTexture(c: Card): THREE.CanvasTexture {
  const key = `${c.r}${c.s}`;
  const cached = faceCache.get(key);
  if (cached) return cached;
  const ctx = newCanvas();
  const ink = c.s === 'H' || c.s === 'D' ? '#c0262d' : '#1a1a1a';
  ctx.fillStyle = '#f6eedb';
  rrect(ctx, 2, 2, TEX_W - 4, TEX_H - 4, 12);
  ctx.fill();
  ctx.strokeStyle = '#8a7a5a';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = ink;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const glyph = SUIT_GLYPH[c.s] ?? '?';
  const corner = (x: number, y: number) => {
    ctx.font = 'bold 26px sans-serif';
    ctx.fillText(RANKS[c.r] ?? '?', x, y);
    ctx.font = '24px sans-serif';
    ctx.fillText(glyph, x, y + 24);
  };
  corner(20, 22);
  ctx.save();
  ctx.translate(TEX_W, TEX_H);
  ctx.rotate(Math.PI);
  corner(20, 22);
  ctx.restore();
  ctx.font = '72px sans-serif';
  ctx.fillText(glyph, TEX_W / 2, TEX_H / 2 + 4);

  const tex = toTexture(ctx);
  faceCache.set(key, tex);
  return tex;
}

function backTexture(): THREE.CanvasTexture {
  if (backCache) return backCache;
  const ctx = newCanvas();
  ctx.fillStyle = '#7a1418';
  rrect(ctx, 0, 0, TEX_W, TEX_H, 12);
  ctx.fill();
  ctx.strokeStyle = '#d4a84b';
  ctx.lineWidth = 3;
  rrect(ctx, 8, 8, TEX_W - 16, TEX_H - 16, 8);
  ctx.stroke();
  // A grid of small gold mushrooms.
  ctx.fillStyle = '#d4a84b';
  for (let y = 30; y <= 150; y += 30) {
    for (let x = 26; x <= 102; x += 26) {
      ctx.beginPath();
      ctx.arc(x, y, 7, Math.PI, 0);
      ctx.fill();
      ctx.fillRect(x - 2, y, 4, 7);
    }
  }
  backCache = toTexture(ctx);
  return backCache;
}

// ---------------------------------------------------------------- chips
const CHIP_COLOR: Record<number, number> = { 5: 0xd03030, 10: 0x3050d0, 25: 0x30a050, 50: 0x202020 };

/** Chip values that make up amount, largest first (greedy). */
function chipValues(amount: number): number[] {
  const out: number[] = [];
  let rest = amount;
  for (const d of [50, 25, 10, 5]) {
    while (rest >= d) {
      out.push(d);
      rest -= d;
    }
  }
  return out;
}

// ---------------------------------------------------------------- the view
interface Gnome {
  id: number;
  model: GnomeModel;
  pose: PlayerState;
  shotgun: THREE.Group;
}

interface CardSlot {
  mesh: THREE.Mesh;
  mat: THREE.MeshStandardMaterial;
  faceKey: string;
  age: number;
}

interface CardWant {
  key: string;
  target: THREE.Vector3;
  yaw: number;
  face: Card | null;
}

export function createTableView(scene: THREE.Scene): TableView {
  // Room and light.
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(30, 30),
    new THREE.MeshStandardMaterial({ color: 0x2a1a10, roughness: 0.9 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  scene.add(new THREE.HemisphereLight(0xffe8c0, 0x201008, 0.8));
  const spot = new THREE.SpotLight(0xffd9a0, 40, 12, 0.7, 0.5);
  spot.position.set(0, 5, 0.5);
  spot.target.position.set(0, 0, 0.2);
  spot.castShadow = true;
  spot.shadow.mapSize.set(1024, 1024);
  scene.add(spot);
  scene.add(spot.target);
  for (const p of [[-2.5, 1.6, -1.6], [2.5, 1.6, -1.6], [0, 1.2, 2.4]]) {
    const lamp = new THREE.PointLight(0xff9a4a, 0.8, 6, 2);
    lamp.position.set(p[0], p[1], p[2]);
    scene.add(lamp);
  }

  // Table: a half disc of felt with the flat edge along x, the round side toward the camera.
  const halfDisc = (r: number, h: number) => new THREE.CylinderGeometry(r, r, h, 48, 1, false, 0, Math.PI);
  const felt = new THREE.Mesh(
    halfDisc(FELT_R, 0.06),
    new THREE.MeshStandardMaterial({ color: 0x1f6b3a, roughness: 0.95 }),
  );
  felt.rotation.y = -Math.PI / 2;
  felt.position.set(0, TABLE_Y - 0.03, TABLE_Z);
  felt.receiveShadow = true;
  scene.add(felt);

  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(FELT_R, 0.07, 10, 48, Math.PI),
    new THREE.MeshStandardMaterial({ color: 0x5a3418, roughness: 0.6 }),
  );
  rim.rotation.x = Math.PI / 2;
  rim.position.set(0, TABLE_Y - 0.04, TABLE_Z);
  rim.castShadow = true;
  scene.add(rim);

  const base = new THREE.Mesh(
    halfDisc(FELT_R - 0.05, 0.25),
    new THREE.MeshStandardMaterial({ color: 0x2a160c, roughness: 0.8 }),
  );
  base.rotation.y = -Math.PI / 2;
  base.position.set(0, TABLE_Y - 0.2, TABLE_Z);
  base.castShadow = true;
  scene.add(base);

  const legMat = new THREE.MeshStandardMaterial({ color: 0x2a160c, roughness: 0.8 });
  const legGeo = new THREE.CylinderGeometry(0.06, 0.06, TABLE_Y - 0.33, 10);
  for (const [x, z] of [[-1.9, TABLE_Z + 0.2], [1.9, TABLE_Z + 0.2], [0, TABLE_Z + 1.9]]) {
    const leg = new THREE.Mesh(legGeo, legMat);
    leg.position.set(x, (TABLE_Y - 0.33) / 2, z);
    leg.castShadow = true;
    scene.add(leg);
  }

  // Stools: a toadstool at each seat.
  const stemGeo = new THREE.CylinderGeometry(0.07, 0.09, 0.3, 12);
  const capGeo = new THREE.SphereGeometry(0.2, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2);
  const stemMat = new THREE.MeshStandardMaterial({ color: 0xf2e6d0, roughness: 0.7 });
  const capMat = new THREE.MeshStandardMaterial({ color: 0xc23a3a, roughness: 0.6 });
  const seatXY = new THREE.Vector3();
  const seatPos: THREE.Vector3[] = [];
  for (let i = 0; i < SEAT_COUNT; i++) {
    arcPoint(i, SEAT_R, seatXY);
    seatPos.push(seatXY.clone());
    const stem = new THREE.Mesh(stemGeo, stemMat);
    stem.position.set(seatXY.x, 0.15, seatXY.z);
    const cap = new THREE.Mesh(capGeo, capMat);
    cap.position.set(seatXY.x, 0.3, seatXY.z);
    cap.castShadow = true;
    scene.add(stem, cap);
  }

  // Shoe.
  const shoe = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 0.16, 0.22),
    new THREE.MeshStandardMaterial({ color: 0x1a1412, roughness: 0.5 }),
  );
  shoe.position.set(SHOE.x, TABLE_Y + 0.08, SHOE.z);
  shoe.castShadow = true;
  scene.add(shoe);

  // Turn ring.
  const ringMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8, depthWrite: false });
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.28, 0.34, 32), ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.visible = false;
  scene.add(ring);

  // Chips: one group per seat.
  const chipGeo = new THREE.CylinderGeometry(0.06, 0.06, CHIP_H, 20);
  const chipMats: Record<number, THREE.MeshStandardMaterial> = {};
  for (const v of Object.keys(CHIP_COLOR)) {
    chipMats[Number(v)] = new THREE.MeshStandardMaterial({ color: CHIP_COLOR[Number(v)], roughness: 0.4 });
  }
  const chipGroups: THREE.Group[] = [];
  const chipAmount: number[] = [];
  for (let i = 0; i < SEAT_COUNT; i++) {
    const g = new THREE.Group();
    arcPoint(i, CHIP_R, seatXY);
    g.position.set(seatXY.x, 0, seatXY.z);
    scene.add(g);
    chipGroups.push(g);
    chipAmount.push(0);
  }

  // Gnomes.
  const seatGnomes: (Gnome | null)[] = new Array(SEAT_COUNT).fill(null);
  const dealerModel = createGnomeModel(DEALER_CHAR.look);
  dealerModel.object.scale.setScalar(1.15);
  scene.add(dealerModel.object);
  const dealerPose: PlayerState = {
    position: DEALER_POS.clone(),
    velocity: new THREE.Vector3(),
    facing: 0,
    grounded: true,
    jumpsUsed: 0,
  };
  const seatFacing: number[] = [];
  for (let i = 0; i < SEAT_COUNT; i++) {
    const p = seatPos[i];
    seatFacing.push(Math.atan2(-p.x, TABLE_Z - p.z));
  }

  // Cards.
  const cardGeo = new THREE.PlaneGeometry(CARD_W, CARD_H);
  const cardGroup = new THREE.Group();
  scene.add(cardGroup);
  const slots = new Map<string, CardSlot>();

  // Shotgun blast FX (dual muzzle flashes, pellet tracers, chest spark, smoke).
  const blastGroup = new THREE.Group();
  blastGroup.visible = false;
  scene.add(blastGroup);
  const flashMat = new THREE.MeshBasicMaterial({ color: 0xffd060 });
  const flashGeo = new THREE.SphereGeometry(0.08, 8, 6);
  const flashL = new THREE.Mesh(flashGeo, flashMat);
  const flashR = new THREE.Mesh(flashGeo, flashMat);
  const chestSpark = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 6), new THREE.MeshBasicMaterial({ color: 0xff6020 }));
  blastGroup.add(flashL, flashR, chestSpark);
  const pelletGeo = new THREE.SphereGeometry(0.015, 6, 4);
  const pelletMat = new THREE.MeshBasicMaterial({ color: 0xffe484 });
  const PELLETS = 10;
  const pellets: { mesh: THREE.Mesh; ox: number; oy: number }[] = [];
  for (let i = 0; i < PELLETS; i++) {
    const m = new THREE.Mesh(pelletGeo, pelletMat);
    const ang = (i / PELLETS) * Math.PI * 2;
    const rad = 0.03 + (i % 3) * 0.035;
    blastGroup.add(m);
    pellets.push({ mesh: m, ox: Math.cos(ang) * rad, oy: Math.sin(ang) * rad });
  }
  const smokeMat = new THREE.MeshStandardMaterial({ color: 0xd0ccc6, roughness: 1, transparent: true, opacity: 0.65 });
  const smokeGeo = new THREE.SphereGeometry(0.09, 7, 5);
  const smokes: THREE.Mesh[] = [];
  for (let i = 0; i < 4; i++) {
    const m = new THREE.Mesh(smokeGeo, smokeMat);
    blastGroup.add(m);
    smokes.push(m);
  }
  let dealerDown = 0;

  function buildGnome(seat: Seat): GnomeModel {
    if (seat.cpu) {
      return createGnomeModel(CHARACTERS[seat.character]?.look ?? GNORMAN_LOOK);
    }
    const found = resolveLook({ id: seat.id, character: seat.character });
    const look: GnomeLook = { ...(found ?? GNORMAN_LOOK), hat: seat.color };
    return createGnomeModel(look);
  }

  function setSeatGnome(i: number, seat: Seat | null): void {
    const cur = seatGnomes[i];
    if (!seat) {
      if (cur) {
        scene.remove(cur.model.object);
        seatGnomes[i] = null;
      }
      return;
    }
    if (cur && cur.id === seat.id) return;
    if (cur) scene.remove(cur.model.object);
    const model = buildGnome(seat);
    scene.add(model.object);
    model.object.traverse((o) => {
      o.castShadow = true;
    });
    const pos = arcPoint(i, SEAT_R, new THREE.Vector3());
    const shotgun = buildHeld('double-shotgun', { lights: false });
    shotgun.position.set(0, -0.32, 0.04);
    shotgun.rotation.set(Math.PI, 0, 0);
    shotgun.visible = false;
    model.arms.right.add(shotgun);
    seatGnomes[i] = {
      id: seat.id,
      model,
      pose: { position: pos, velocity: new THREE.Vector3(), facing: seatFacing[i], grounded: true, jumpsUsed: 0 },
      shotgun,
    };
  }

  function updateChips(i: number, amount: number): void {
    if (chipAmount[i] === amount) return;
    chipAmount[i] = amount;
    const g = chipGroups[i];
    g.clear();
    if (amount <= 0) return;
    const layers = Math.min(CHIP_MAX_LAYERS, Math.ceil(amount / 5));
    const values = chipValues(amount);
    for (let k = 0; k < layers; k++) {
      const v = values[k] ?? 5;
      const chip = new THREE.Mesh(chipGeo, chipMats[v] ?? chipMats[5]);
      chip.position.set(0, TABLE_Y + 0.008 + k * CHIP_H, 0);
      g.add(chip);
    }
  }

  /** Target of the k-th card of a player's hand (n cards in the hand). */
  function handTarget(i: number, j: number, n: number, out: THREE.Vector3): THREE.Vector3 {
    const th = seatAngle(i);
    const off = (j - (n - 1) / 2) * CARD_FAN;
    const cx = HAND_R * Math.cos(th) - off * Math.sin(th);
    const cz = TABLE_Z + HAND_R * Math.sin(th) + off * Math.cos(th);
    return out.set(cx, TABLE_Y + 0.035 + 0.002 * j, cz);
  }

  function makeCard(): CardSlot {
    const mat = new THREE.MeshStandardMaterial({ roughness: 0.6 });
    const mesh = new THREE.Mesh(cardGeo, mat);
    mesh.rotation.order = 'YXZ';
    mesh.position.copy(SHOE);
    cardGroup.add(mesh);
    return { mesh, mat, faceKey: '', age: 0 };
  }

  function faceOf(c: Card | null): { key: string; tex: THREE.CanvasTexture } {
    if (!c) return { key: 'back', tex: backTexture() };
    return { key: `${c.r}${c.s}`, tex: faceTexture(c) };
  }

  const tmp = new THREE.Vector3();
  const wants = new Map<string, CardWant>();

  function collectCards(st: TableState): void {
    wants.clear();
    for (let i = 0; i < SEAT_COUNT; i++) {
      const hand = st.seats[i]?.hand;
      if (!hand) continue;
      const n = hand.cards.length;
      for (let j = 0; j < n; j++) {
        wants.set(`${i}:${j}`, {
          key: `${i}:${j}`,
          target: handTarget(i, j, n, new THREE.Vector3()),
          yaw: cardYawForSeat(i),
          face: hand.cards[j],
        });
      }
    }
    const dn = st.dealer.length;
    for (let j = 0; j < dn; j++) {
      const hidden = st.holeHidden && j === 1;
      tmp.set((j - (dn - 1) / 2) * DEALER_CARD_GAP, TABLE_Y + 0.035 + 0.002 * j, -0.45);
      wants.set(`${DEALER}:${j}`, {
        key: `${DEALER}:${j}`,
        target: tmp.clone(),
        yaw: 0,
        face: hidden ? null : st.dealer[j],
      });
    }
  }

  function syncCards(dt: number): void {
    for (const [key, slot] of slots) {
      if (!wants.has(key)) {
        cardGroup.remove(slot.mesh);
        slot.mat.dispose();
        slots.delete(key);
      }
    }
    for (const want of wants.values()) {
      let slot = slots.get(want.key);
      if (!slot) {
        slot = makeCard();
        slots.set(want.key, slot);
      }
      const face = faceOf(want.face);
      if (slot.faceKey !== face.key) {
        slot.faceKey = face.key;
        slot.mat.map = face.tex;
        slot.mat.needsUpdate = true;
      }
      slot.mesh.rotation.set(-Math.PI / 2, want.yaw, 0);
      if (slot.age < DEAL_ANIM_S) {
        slot.age = Math.min(DEAL_ANIM_S, slot.age + dt);
        const p = slot.age / DEAL_ANIM_S;
        const e = 1 - (1 - p) * (1 - p);
        slot.mesh.position.lerpVectors(SHOE, want.target, e);
      } else {
        slot.mesh.position.lerp(want.target, Math.min(1, dt * 10));
      }
    }
  }

  function updateRing(st: TableState): void {
    if (st.turn < 0 || st.turn >= SEAT_COUNT) {
      ring.visible = false;
      return;
    }
    const seat = st.seats[st.turn];
    if (!seat) {
      ring.visible = false;
      return;
    }
    // The ring sits under the middle of the turn seat's hand.
    const n = seat.hand?.cards.length ?? 0;
    const c = handTarget(st.turn, Math.max(0, Math.floor((n - 1) / 2)), Math.max(1, n), new THREE.Vector3());
    ring.position.set(c.x, TABLE_Y + 0.03, c.z);
    ring.visible = true;
    ringMat.color.setHex(seat.color);
    ringMat.opacity = 0.6 + 0.4 * Math.sin(6 * st.t);
  }

  let hiddenSeat = -1;

  return {
    hideSeat(seat: number): void {
      hiddenSeat = seat;
    },
    eyePos(seat: number, out: THREE.Vector3): THREE.Vector3 {
      // Head centre is at 0.8 on the model; eyes a touch above and forward of it, toward the table.
      const p = arcPoint(seat, SEAT_R - 0.12, out);
      return p.setY(0.86);
    },
    sync(st: TableState, dt: number): void {
      const shot = st.dealerShot;
      const shotAge = shot ? st.t - shot.at : -1;
      const shooterSeat = shot && shotAge < 1.05 ? shot.by : -1;

      // Gnomes: rebuilt when a seat's id changes; posed every frame.
      for (let i = 0; i < SEAT_COUNT; i++) {
        setSeatGnome(i, st.seats[i] ?? null);
        const g = seatGnomes[i];
        if (!g) continue;
        const isShooter = i === shooterSeat;
        g.model.object.visible = i !== hiddenSeat || isShooter;
        const seat = st.seats[i];
        const result = st.phase === 'payout' ? seat?.hand?.result ?? null : null;
        const up = !isShooter && (result === 'win' || result === 'blackjack');
        const down = !isShooter && (result === 'bust' || result === 'lose');

        const basePos = seatPos[i];
        let x = basePos.x;
        let y = 0;
        let z = basePos.z;
        let facing = seatFacing[i];
        let aim = false;
        let recoil = 0;

        if (isShooter) {
          const spotX = 0;
          const spotY = TABLE_Y;
          const spotZ = -0.76;
          if (shotAge < 0.28) {
            const p = shotAge / 0.28;
            const e = 1 - (1 - p) * (1 - p);
            x = THREE.MathUtils.lerp(basePos.x, spotX, e);
            y = THREE.MathUtils.lerp(0, spotY, e) + 0.28 * Math.sin(Math.PI * p);
            z = THREE.MathUtils.lerp(basePos.z, spotZ, e);
            facing = THREE.MathUtils.lerp(seatFacing[i], Math.PI, e);
          } else if (shotAge < 0.65) {
            x = spotX;
            y = spotY;
            z = spotZ;
            facing = Math.PI;
            aim = true;
            if (shotAge >= 0.3 && shotAge < 0.44) recoil = 0.28 * Math.sin(((shotAge - 0.3) / 0.14) * Math.PI);
            else if (shotAge >= 0.39 && shotAge < 0.54) recoil = 0.32 * Math.sin(((shotAge - 0.39) / 0.15) * Math.PI);
          } else {
            const p = Math.min(1, (shotAge - 0.65) / 0.4);
            const e = p * p * (3 - 2 * p);
            x = THREE.MathUtils.lerp(spotX, basePos.x, e);
            y = THREE.MathUtils.lerp(spotY, 0, e) + 0.28 * Math.sin(Math.PI * p);
            z = THREE.MathUtils.lerp(spotZ, basePos.z, e);
            facing = THREE.MathUtils.lerp(Math.PI, seatFacing[i], e);
          }
          g.shotgun.visible = shotAge < 0.72;
        } else {
          g.shotgun.visible = false;
          if (st.turn === i) y += 0.03 * Math.sin(4 * st.t);
          if (up) y += Math.abs(Math.sin(8 * st.t)) * 0.15;
        }

        g.pose.position.set(x, y, z);
        g.pose.facing = facing;
        g.model.update(g.pose, dt);
        if (aim) {
          g.model.arms.right.rotation.x = -Math.PI / 2 - recoil;
          g.model.arms.left.rotation.x = -1.25 - recoil * 0.6;
        } else if (up) {
          g.model.arms.left.rotation.x = -2.4;
          g.model.arms.right.rotation.x = -2.4;
        }
        g.model.rig.rotation.x = down ? 0.25 : 0;
        updateChips(i, seat ? (seat.hand ? seat.hand.bet : seat.bet) : 0);
      }

      // Dual shotgun blast FX (muzzle flashes, pellet spread into dealer's chest, smoke).
      if (shot && shotAge >= 0.3 && shotAge < 1.15) {
        blastGroup.visible = true;
        const muzzleZ = -1.16;
        const muzzleY = TABLE_Y + 0.54;
        const chestZ = -1.36;
        const chestY = 0.65;
        flashL.visible = shotAge >= 0.3 && shotAge < 0.41;
        flashR.visible = shotAge >= 0.39 && shotAge < 0.5;
        flashL.position.set(-0.07, muzzleY, muzzleZ);
        flashR.position.set(-0.03, muzzleY, muzzleZ);
        flashL.scale.setScalar(1 + Math.sin(((shotAge - 0.3) / 0.11) * Math.PI) * 0.6);
        flashR.scale.setScalar(1 + Math.sin(((shotAge - 0.39) / 0.11) * Math.PI) * 0.6);

        const impactOn = shotAge >= 0.32 && shotAge < 0.56;
        chestSpark.visible = impactOn;
        chestSpark.position.set(0, chestY, chestZ);
        chestSpark.scale.setScalar(impactOn ? 0.7 + 0.6 * Math.sin(((shotAge - 0.32) / 0.24) * Math.PI) : 0.01);

        for (let k = 0; k < pellets.length; k++) {
          const pl = pellets[k];
          const fireAt = k < 5 ? 0.3 : 0.39;
          const pt = (shotAge - fireAt) / 0.12;
          pl.mesh.visible = pt >= 0 && pt <= 1;
          if (pl.mesh.visible) {
            pl.mesh.position.set(
              THREE.MathUtils.lerp(-0.05, pl.ox, pt),
              THREE.MathUtils.lerp(muzzleY, chestY + pl.oy, pt),
              THREE.MathUtils.lerp(muzzleZ, chestZ, pt),
            );
          }
        }
        const sp = Math.min(1, (shotAge - 0.3) / 0.85);
        smokeMat.opacity = 0.65 * (1 - sp);
        for (let k = 0; k < smokes.length; k++) {
          const sm = smokes[k];
          sm.position.set((k - 1.5) * 0.08, muzzleY + 0.05 + sp * 0.45 + k * 0.04, muzzleZ - 0.1 - sp * 0.25);
          sm.scale.setScalar(0.6 + sp * 2.1);
        }
      } else {
        blastGroup.visible = false;
      }

      // Dealer: knocked flat for 10-15 s, then rises back up.
      let fall = 0;
      if (shot) {
        if (st.t < shot.until) {
          if (shotAge >= 0.32) {
            const p = Math.min(1, (shotAge - 0.32) / 0.26);
            fall = 1 - (1 - p) * (1 - p);
          }
        } else {
          const p = Math.min(1, (st.t - shot.until) / 0.8);
          fall = 1 - p * p * (3 - 2 * p);
        }
      }
      dealerDown = fall;
      dealerModel.update(dealerPose, dt);
      dealerModel.rig.rotation.x = -fall * (Math.PI / 2);
      dealerModel.rig.position.y = fall * 0.18;
      dealerModel.arms.left.rotation.z = fall * 0.55;
      dealerModel.arms.right.rotation.z = -fall * 0.55;

      collectCards(st);
      syncCards(dt);
      updateRing(st);
    },
    headPos(seat: number, out: THREE.Vector3): THREE.Vector3 {
      if (seat === DEALER) return out.set(0, 1.65 - dealerDown * 1.0, -1.4);
      const p = arcPoint(seat, SEAT_R, new THREE.Vector3());
      return out.set(p.x, 1.45, p.z);
    },
  };
}
