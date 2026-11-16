// The 3D table: felt, dealer gnome, seated gnomes, cards and chips. Renders any TableState it is given.
import * as THREE from 'three';
import { createGnomeModel, resolveLook, GNORMAN_LOOK, type GnomeModel, type PlayerState, type GnomeLook } from '@lawn/gnome';
import { DEALER, SEAT_COUNT, type Card, type Seat, type TableState } from './config';
import { CHARACTERS, DEALER_CHAR } from './characters';

export interface TableView {
  sync(st: TableState, dt: number): void;
  headPos(seat: number, out: THREE.Vector3): THREE.Vector3;
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
    seatGnomes[i] = {
      id: seat.id,
      model,
      pose: { position: pos, velocity: new THREE.Vector3(), facing: seatFacing[i], grounded: true, jumpsUsed: 0 },
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

  return {
    sync(st: TableState, dt: number): void {
      // Gnomes: rebuilt when a seat's id changes; posed every frame.
      for (let i = 0; i < SEAT_COUNT; i++) {
        setSeatGnome(i, st.seats[i] ?? null);
        const g = seatGnomes[i];
        if (!g) continue;
        const seat = st.seats[i];
        const result = st.phase === 'payout' ? seat?.hand?.result ?? null : null;
        const up = result === 'win' || result === 'blackjack';
        const down = result === 'bust' || result === 'lose';
        let y = 0;
        if (st.turn === i) y += 0.03 * Math.sin(4 * st.t);
        if (up) y += Math.abs(Math.sin(8 * st.t)) * 0.15;
        g.pose.position.set(g.pose.position.x, y, g.pose.position.z);
        g.model.update(g.pose, dt);
        if (up) {
          g.model.arms.left.rotation.x = -2.4;
          g.model.arms.right.rotation.x = -2.4;
        }
        g.model.rig.rotation.x = down ? 0.25 : 0;
        updateChips(i, seat ? (seat.hand ? seat.hand.bet : seat.bet) : 0);
      }
      dealerModel.update(dealerPose, dt);
      dealerModel.rig.rotation.x = 0;

      collectCards(st);
      syncCards(dt);
      updateRing(st);
    },
    headPos(seat: number, out: THREE.Vector3): THREE.Vector3 {
      if (seat === DEALER) return out.set(0, 1.65, -1.4);
      const p = arcPoint(seat, SEAT_R, new THREE.Vector3());
      return out.set(p.x, 1.45, p.z);
    },
  };
}
