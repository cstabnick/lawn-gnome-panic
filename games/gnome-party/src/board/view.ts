// The 3D board: spaces, star, gnome tokens, die, camera. It only draws PartyState; it never changes it.
import * as THREE from 'three';
import { createGnomeModel, type GnomeModel, type PlayerState } from '@lawn/gnome';
import { BOARD, TIMING, type BoardState, type MoveEvent, type PartyState, type Seat } from '../config';

export interface BoardView {
  /** The board's own scene; main.ts renders it with `camera` when no minigame runs. */
  readonly scene: THREE.Scene;
  /** Every frame. Builds the board on first call (and rebuilds if state.seed changes). */
  render(state: Readonly<PartyState>, dt: number): void;
  dispose(): void;
}

const DISC_R = 0.55;
const DISC_H = 0.12;
const STAR_Y = DISC_H + 1.4;
const STAR_FLY_S = 0.8;
const HOP_HEIGHT = 0.6;
const LABEL_S = 1;
const LABEL_Y = DISC_H + 2.6;
const DIE_Y = DISC_H + 2.2;
const DIE_SHRINK_S = 0.3;
const WALK_SPEED = 3;
const CAM_BEHIND = 7;
const CAM_UP = 6;
const CAM_RATE = 3;
const WIDE_POS: readonly [number, number, number] = [0, 16, 14];
const WIDE_LOOK: readonly [number, number, number] = [0, 0, 0];
/** Offsets for up to four tokens on one space: a small square, in seat order. */
const SLOT_OFFSETS: readonly (readonly [number, number])[] = [[-0.25, -0.25], [0.25, -0.25], [-0.25, 0.25], [0.25, 0.25]];

const mod = (a: number, n: number): number => ((a % n) + n) % n;

/** Centre of space i on the oval, at y = 0. */
function spotAt(i: number, n: number): THREE.Vector3 {
  const a = (mod(i, n) / n) * Math.PI * 2;
  return new THREE.Vector3(9 * Math.cos(a), 0, 6 * Math.sin(a));
}

/** Where a token stands on space i, with its slot offset, at height y. */
function place(i: number, off: readonly [number, number], n: number, y: number): THREE.Vector3 {
  const p = spotAt(i, n);
  return new THREE.Vector3(p.x + off[0], y, p.z + off[1]);
}

/** Offset of seat `seat` among the seats that end on the same space. */
function slotOffset(seat: number, b: BoardState): readonly [number, number] {
  const space = b.players[seat]?.space;
  let idx = 0;
  for (let k = 0; k < seat; k++) if (b.players[k]?.space === space) idx++;
  return SLOT_OFFSETS[idx % SLOT_OFFSETS.length];
}

function eventLabel(ev: MoveEvent): string | null {
  if (ev.e === 'star') return ev.bought ? '★ +1' : `need ${BOARD.starCost} coins`;
  if (ev.e === 'coins') return ev.delta > 0 ? `+${ev.delta}` : `${ev.delta}`;
  return null;
}

function looksKey(seats: readonly Seat[]): string {
  return seats.map((s) => `${s.seat}${JSON.stringify(s.look)}`).join('|');
}

function canvas2d(w: number, h: number): CanvasRenderingContext2D {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  if (!ctx) throw new Error('2D canvas is not available');
  return ctx;
}

function canvasTexture(c: HTMLCanvasElement): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Disposes every geometry and material under root (sprites share one geometry, so it is kept). */
function disposeTree(root: THREE.Object3D): void {
  root.traverse((o) => {
    const geo = (o as { geometry?: THREE.BufferGeometry }).geometry;
    if (geo && !(o instanceof THREE.Sprite)) geo.dispose();
    const mat = (o as { material?: THREE.Material | THREE.Material[] }).material;
    if (mat) for (const m of Array.isArray(mat) ? mat : [mat]) m.dispose();
  });
}

function clearGroup(group: THREE.Group): void {
  for (const c of [...group.children]) disposeTree(c);
  group.clear();
}

export function createBoardView(camera: THREE.PerspectiveCamera): BoardView {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87c8ff);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x447744, 1.4));

  const sun = new THREE.DirectionalLight(0xffffff, 1.6);
  sun.position.set(10, 20, 8);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  const sc = sun.shadow.camera;
  sc.left = -25;
  sc.right = 25;
  sc.top = 25;
  sc.bottom = -25;
  sc.near = 1;
  sc.far = 80;
  sc.updateProjectionMatrix();
  scene.add(sun);

  const lawn = new THREE.Mesh(new THREE.PlaneGeometry(60, 50), new THREE.MeshStandardMaterial({ color: 0x5cae4a }));
  lawn.rotation.x = -Math.PI / 2;
  lawn.receiveShadow = true;
  scene.add(lawn);

  const boardGroup = new THREE.Group();
  const tokenGroup = new THREE.Group();
  const labelGroup = new THREE.Group();
  scene.add(boardGroup, tokenGroup, labelGroup);

  const star = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.45),
    new THREE.MeshStandardMaterial({ color: 0xffd54f, emissive: 0x3a2e00 }),
  );
  star.castShadow = true;
  scene.add(star);

  const dieMats = Array.from({ length: 6 }, () => new THREE.MeshStandardMaterial({ color: 0xffffff }));
  const die = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.6), dieMats);
  die.castShadow = true;
  die.visible = false;
  scene.add(die);
  let dieFace = 0; // 0 = blank

  const labels = new Map<number, THREE.Sprite>();
  const dieTex = new Map<number, THREE.CanvasTexture>();
  const labelTex = new Map<string, THREE.CanvasTexture>();

  const tokens: (GnomeModel | null)[] = [null, null, null, null];
  const poses: PlayerState[] = [0, 1, 2, 3].map(() => ({
    position: new THREE.Vector3(),
    velocity: new THREE.Vector3(),
    facing: 0,
    grounded: true,
    jumpsUsed: 0,
  }));

  let boardKey = '';
  let tokenKey = '';
  /** The star's space before the current move started (the host has already moved it). */
  let starBefore = 0;
  let camReady = false;
  const camLook = new THREE.Vector3();

  function dieTexture(v: number): THREE.CanvasTexture {
    let t = dieTex.get(v);
    if (!t) {
      const ctx = canvas2d(128, 128);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 128, 128);
      ctx.strokeStyle = '#222222';
      ctx.lineWidth = 8;
      ctx.strokeRect(4, 4, 120, 120);
      ctx.fillStyle = '#222222';
      ctx.font = 'bold 84px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(v), 64, 68);
      t = canvasTexture(ctx.canvas);
      dieTex.set(v, t);
    }
    return t;
  }

  function labelTexture(text: string): THREE.CanvasTexture {
    let t = labelTex.get(text);
    if (!t) {
      const ctx = canvas2d(512, 96);
      ctx.font = 'bold 48px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineWidth = 10;
      ctx.strokeStyle = '#000000';
      ctx.strokeText(text, 256, 50);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(text, 256, 50);
      t = canvasTexture(ctx.canvas);
      labelTex.set(text, t);
    }
    return t;
  }

  function labelSprite(idx: number): THREE.Sprite {
    let s = labels.get(idx);
    if (!s) {
      s = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, depthTest: false }));
      s.renderOrder = 10;
      s.scale.set(4.8, 0.9, 1);
      labelGroup.add(s);
      labels.set(idx, s);
    }
    return s;
  }

  function setDieFace(v: number): void {
    if (v === dieFace) return;
    dieFace = v;
    for (const m of dieMats) {
      m.map = v > 0 ? dieTexture(v) : null;
      m.needsUpdate = true;
    }
  }

  function buildBoard(state: Readonly<PartyState>): void {
    clearGroup(boardGroup);
    const n = state.board.spaces.length;
    const blue = new THREE.MeshStandardMaterial({ color: 0x3d7bff });
    const red = new THREE.MeshStandardMaterial({ color: 0xff4a4a });
    const disc = new THREE.CylinderGeometry(DISC_R, DISC_R, DISC_H, 28);
    state.board.spaces.forEach((kind, i) => {
      const m = new THREE.Mesh(disc, kind === 'red' ? red : blue);
      m.position.copy(place(i, [0, 0], n, DISC_H / 2));
      m.castShadow = true;
      m.receiveShadow = true;
      boardGroup.add(m);
    });
    if (n > 0) {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(DISC_R, 0.72, 32),
        new THREE.MeshStandardMaterial({ color: 0xffffff }),
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.copy(place(0, [0, 0], n, DISC_H + 0.01));
      boardGroup.add(ring);
    }
  }

  function buildTokens(state: Readonly<PartyState>): void {
    for (let s = 0; s < tokens.length; s++) {
      const old = tokens[s];
      if (old) {
        tokenGroup.remove(old.object);
        disposeTree(old.object);
        tokens[s] = null;
      }
    }
    for (const seat of state.seats) {
      const g = createGnomeModel(seat.look);
      g.object.traverse((o) => {
        if (o instanceof THREE.Mesh) o.castShadow = true;
      });
      tokenGroup.add(g.object);
      tokens[seat.seat] = g;
    }
  }

  return {
    scene,
    render(state, dt) {
      const b = state.board;
      const n = b.spaces.length;
      if (n === 0) return;

      const bk = `${state.seed}|${b.spaces.join('')}`;
      if (bk !== boardKey) {
        boardKey = bk;
        buildBoard(state);
      }
      const tk = looksKey(state.seats);
      if (tk !== tokenKey) {
        tokenKey = tk;
        buildTokens(state);
      }

      const ph = state.phase;
      const hopS = TIMING.hopS;
      for (const s of labels.values()) s.visible = false;

      // Star rests on board.starAt; outside a move, remember that space as the one a move starts from.
      if (ph.p !== 'move') starBefore = b.starAt;
      let starPos = place(b.starAt, [0, 0], n, STAR_Y);

      let moveSeat = -1;
      let moverPos: THREE.Vector3 | null = null;
      let dieShown = false;

      if (ph.p === 'move') {
        const seat = ph.seat;
        moveSeat = seat;
        const off = slotOffset(seat, b);
        const hopTo: number[] = [];
        for (const ev of ph.events) if (ev.e === 'hop') hopTo.push(ev.to);
        const H = hopTo.length;
        const hopEnd = H * hopS;
        const elapsed = Math.min(Math.max(ph.total - ph.left, 0), ph.total);
        // The host has already moved the token to its end space; walk back the hops to the start.
        const start = mod(b.players[seat].space - H, n);

        // Star: flies along an arc for each starMoved event, after the hops before it.
        let rest = starBefore;
        let flying: { from: number; to: number; t: number } | null = null;
        let hopCount = 0;
        for (const ev of ph.events) {
          if (ev.e === 'hop') {
            hopCount++;
            continue;
          }
          if (ev.e !== 'starMoved') continue;
          const at = hopCount * hopS;
          if (elapsed < at) break;
          if (elapsed < at + STAR_FLY_S) {
            flying = { from: rest, to: ev.to, t: (elapsed - at) / STAR_FLY_S };
            break;
          }
          rest = ev.to;
        }
        if (flying) {
          const f: { from: number; to: number; t: number } = flying;
          starPos = spotAt(f.from, n).lerp(spotAt(f.to, n), f.t);
          starPos.y = STAR_Y + 1.2 * Math.sin(Math.PI * f.t);
        } else {
          starPos = place(rest, [0, 0], n, STAR_Y);
        }

        // Mover: hop j runs during [j*hopS, (j+1)*hopS); after the last hop it stands on its end space.
        const pose = poses[seat];
        let pos: THREE.Vector3;
        if (H > 0 && elapsed < hopEnd) {
          const j = Math.min(Math.floor(elapsed / hopS), H - 1);
          const t = Math.min(Math.max((elapsed - j * hopS) / hopS, 0), 1);
          const from = place(j === 0 ? start : hopTo[j - 1], off, n, DISC_H);
          const to = place(hopTo[j], off, n, DISC_H);
          pos = from.clone().lerp(to, t);
          pos.y = DISC_H + HOP_HEIGHT * Math.sin(Math.PI * t);
          const dx = to.x - from.x;
          const dz = to.z - from.z;
          const len = Math.hypot(dx, dz) || 1;
          pose.facing = Math.atan2(dx, dz);
          pose.velocity.set((dx / len) * WALK_SPEED, 0, (dz / len) * WALK_SPEED);
          pose.grounded = t <= 0 || t >= 1;
        } else {
          pos = place(b.players[seat].space, off, n, DISC_H);
          pose.velocity.set(0, 0, 0);
          pose.grounded = true;
        }
        pose.position.copy(pos);
        moverPos = pos;

        // Floating text: a star or coins event shows for 1 s from the moment its token reaches that space.
        let hopsBefore = 0;
        ph.events.forEach((ev, idx) => {
          if (ev.e === 'hop') {
            hopsBefore++;
            return;
          }
          const text = eventLabel(ev);
          const at = hopsBefore * hopS;
          if (text === null || elapsed < at || elapsed >= at + LABEL_S) return;
          const fromSpace = hopsBefore === 0 ? start : hopTo[hopsBefore - 1];
          const sp = labelSprite(idx);
          const mat = sp.material as THREE.SpriteMaterial;
          const tex = labelTexture(text);
          if (mat.map !== tex) {
            mat.map = tex;
            mat.needsUpdate = true;
          }
          sp.position.copy(place(fromSpace, off, n, LABEL_Y));
          sp.visible = true;
        });

        // Die: shows the roll, then shrinks away after the last hop.
        const shrink = elapsed <= hopEnd ? 1 : Math.max(0, 1 - (elapsed - hopEnd) / DIE_SHRINK_S);
        setDieFace(ph.die);
        if (shrink > 0) {
          dieShown = true;
          die.visible = true;
          die.position.set(pos.x, DIE_Y, pos.z);
          die.rotation.set(0, 0, 0);
          die.scale.setScalar(shrink);
        }
      } else if (ph.p === 'roll') {
        // Die spins above the current seat's token while it waits to roll.
        const p = place(b.players[ph.seat].space, slotOffset(ph.seat, b), n, DIE_Y);
        setDieFace(0);
        die.visible = true;
        die.position.copy(p);
        die.rotation.x += dt * 4;
        die.rotation.y += dt * 3;
        die.scale.setScalar(1);
        dieShown = true;
      }
      if (!dieShown) die.visible = false;

      star.position.copy(starPos);
      star.rotation.y += dt * 2;

      // Tokens: the mover is already placed; the others stand on their spaces.
      for (let s = 0; s < tokens.length; s++) {
        const t = tokens[s];
        if (!t) continue;
        const pose = poses[s];
        if (s !== moveSeat) {
          pose.position.copy(place(b.players[s].space, slotOffset(s, b), n, DISC_H));
          pose.velocity.set(0, 0, 0);
          pose.grounded = true;
        }
        t.update(pose, dt);
      }

      // Camera: follow the token during roll and move; otherwise a wide view of the oval.
      let camTo: THREE.Vector3;
      let lookTo: THREE.Vector3;
      const focus: THREE.Vector3 | null =
        ph.p === 'move' ? moverPos : ph.p === 'roll' ? place(b.players[ph.seat].space, slotOffset(ph.seat, b), n, DISC_H) : null;
      if (focus) {
        const out = new THREE.Vector3(focus.x, 0, focus.z);
        if (out.lengthSq() < 1e-6) out.set(0, 0, 1);
        else out.normalize();
        camTo = focus.clone().addScaledVector(out, CAM_BEHIND);
        camTo.y += CAM_UP;
        lookTo = focus.clone();
        lookTo.y += 1;
      } else {
        camTo = new THREE.Vector3(...WIDE_POS);
        lookTo = new THREE.Vector3(...WIDE_LOOK);
      }
      if (!camReady) {
        camera.position.copy(camTo);
        camLook.copy(lookTo);
        camReady = true;
      }
      const k = 1 - Math.exp(-dt * CAM_RATE);
      camera.position.lerp(camTo, k);
      camLook.lerp(lookTo, k);
      camera.lookAt(camLook);
    },
    dispose() {
      clearGroup(boardGroup);
      for (let s = 0; s < tokens.length; s++) {
        const t = tokens[s];
        if (t) {
          tokenGroup.remove(t.object);
          disposeTree(t.object);
          tokens[s] = null;
        }
      }
      disposeTree(scene);
      for (const t of dieTex.values()) t.dispose();
      for (const t of labelTex.values()) t.dispose();
      dieTex.clear();
      labelTex.clear();
      labels.clear();
      scene.clear();
    },
  };
}
