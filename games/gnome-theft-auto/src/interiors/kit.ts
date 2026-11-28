// The interior kit (E05): what an InteriorDef's build() uses to make a furnished room. Local coordinates: origin at the
// room centre on the floor, +x east, +z south, y up. The runtime (runtime.ts) places the group at the pocket origin and
// offsets the boxes itself.
import * as THREE from 'three';
import { buildPrefab, getPrefab } from '@lawn/prefabs';
import { flatLayer, LAYER } from '@lawn/depth';
import { gnomeState, makeGnome } from '../gnomes';
import { DEFAULT_LOOK } from '../config';
import { enterInterior, leaveInterior } from './runtime';
import { themeOf } from './registry';
import type { PlacedInterior } from './registry';
import type { InteriorBuild, InteriorKit, InteriorNpc, InteriorSpot, InteriorThemeId, InteriorTheme, PutOpts } from './types';

const WALL_THICK = 0.4;
const WALL_COLLIDER_H = 2;
const SKIRT_H = 0.12;
const SKIRT_OUT = 0.03;
const DOOR_W = 1.2;
const DOOR_H = 2.2;
const DOOR_PROUD = 0.05;
const POST_W = 0.15;
const POST_H = 2.4;
const LINTEL_H = 0.15;
const PANE_PROUD = 0.04;
const FRAME_DEPTH = 0.06; // bar depth argument (bars are planes now)
const FRAME_BAR = 0.06;
const NPC_HALF = 0.35;
const NPC_H = 1.2;
const RUG_MAX_TOP = 0.25;
const FLAT_MAX_H = 0.08;
const CEILING_LIP = 6; // the ceiling overhangs the walls, so the cut-away top of the frame shows ceiling, not sky
const SIGN_BACK_OFF = 0.01; // the sign backing sits this far behind the text plane (towards the wall)
const SIGN_BACK_PAD = 0.08; // the backing is this much larger than the text plane
const SIGN_MAX_WALL_DIST = 0.4;
const WALL_HANG_MIN_Y = 0.25;
const WALL_MAX_THICK = 0.6;
const WALL_FAR_SIDE = 0.45;

/** A wall's decor: the kit's direct children that hang on it. Its inward normal points into the room. */
export interface WallDecor {
  /** A point on the wall plane and the wall's inward normal (local coordinates, y ignored). */
  x: number; z: number; nx: number; nz: number;
  /** Direct children of the kit group that hang on this wall. */
  objects: THREE.Object3D[];
}

/** A plane facing the room: `yaw` turns its front to the direction (sin yaw, cos yaw). */
function frontPlane(w: number, h: number, material: THREE.Material): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), material);
  m.castShadow = false;
  return m;
}

function standard(color: number, roughness = 0.9): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness });
}

/** A fresh kit for one build of `placed`, and the record it fills. The group is in local coordinates (not yet placed). */
export function createKit(placed: PlacedInterior): { kit: InteriorKit; build: InteriorBuild; walls: () => WallDecor[] } {
  const group = new THREE.Group();
  group.name = `interior-${placed.def.id}`;
  const build: InteriorBuild = { boxes: [], spots: [], npcs: [], spawn: null, exitDoor: null, windows: [] };
  const theme: InteriorTheme = placed.theme;
  const size = { ...placed.def.size };
  let roomBuilt = false;
  /** Half the room's width and depth, set by room(); null until then. */
  let shell: { hw: number; hd: number } | null = null;

  const add = (o: THREE.Object3D): THREE.Object3D => {
    group.add(o);
    return o;
  };

  const boxCollider = (minX: number, maxX: number, minZ: number, maxZ: number, h: number): void => {
    build.boxes.push({ minX, maxX, minZ, maxZ, h });
  };

  const room: InteriorKit['room'] = (opts) => {
    if (roomBuilt) return;
    roomBuilt = true;
    const w = opts?.w ?? size.w;
    const d = opts?.d ?? size.d;
    const h = opts?.h ?? size.h;
    const t = opts?.theme !== undefined ? themeOf(opts.theme as InteriorThemeId | InteriorTheme) : theme;
    const hw = w / 2;
    const hd = d / 2;
    shell = { hw, hd };

    // Floor: top at y = 0.
    const floor = new THREE.Mesh(new THREE.BoxGeometry(w + 0.6, 0.2, d + 0.6), standard(t.floor));
    floor.position.set(0, -0.1, 0);
    floor.castShadow = false;
    floor.userData.shell = true;
    add(floor);

    // Walls: single-sided planes whose front faces into the room, so a camera outside sees through them.
    // [centre x, centre z, plane width, rotation.y]
    const walls: [number, number, number, number][] = [
      [0, -hd, w, 0], // north wall (its front faces +z)
      [0, hd, w, Math.PI], // south wall (faces -z)
      [-hw, 0, d, Math.PI / 2], // west wall (faces +x)
      [hw, 0, d, -Math.PI / 2], // east wall (faces -x)
    ];
    for (const [x, z, len, ry] of walls) {
      const wall = frontPlane(len, h, standard(t.wall));
      wall.position.set(x, h / 2, z);
      wall.rotation.y = ry;
      wall.userData.shell = true;
      add(wall);
      // Skirting: a strip just in front of the wall.
      const skirt = frontPlane(len, SKIRT_H, flatLayer(standard(t.trim), LAYER.decal)); // on the wall plane: a draw layer, no z-fight
      const nx = Math.sin(ry);
      const nz = Math.cos(ry);
      skirt.position.set(x + nx * SKIRT_OUT, SKIRT_H / 2, z + nz * SKIRT_OUT);
      skirt.rotation.y = ry;
      skirt.userData.shell = true;
      add(skirt);
    }

    // Ceiling: facing down into the room, overhanging the walls (CEILING_LIP) so the cut-away top shows ceiling.
    // No light reaches a downward face but the hemisphere's ground colour, so a dark ceiling read as a black void: a
    // little of its own colour as glow keeps it a ceiling.
    const ceilingMat = standard(t.ceiling);
    ceilingMat.emissive.setHex(t.ceiling).multiplyScalar(0.4);
    const ceiling = frontPlane(w + 2 * CEILING_LIP, d + 2 * CEILING_LIP, ceilingMat);
    ceiling.position.set(0, h, 0);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.userData.shell = true;
    add(ceiling);

    // Wall colliders, just outside the inner size. Only 2 m tall: a gnome jumps ~1.1 m, so it cannot get over, but the
    // follow camera (higher up) is not pulled in against the wall; the walls are see-through from outside (dollhouse view).
    const top = WALL_COLLIDER_H;
    boxCollider(-hw - WALL_THICK, hw + WALL_THICK, -hd - WALL_THICK, -hd, top); // north
    boxCollider(-hw - WALL_THICK, hw + WALL_THICK, hd, hd + WALL_THICK, top); // south
    boxCollider(-hw - WALL_THICK, -hw, -hd, hd, top); // west
    boxCollider(hw, hw + WALL_THICK, -hd, hd, top); // east
  };

  const door = (x: number, z: number, yaw: number): void => {
    const sin = Math.sin(yaw);
    const cos = Math.cos(yaw);
    // Tangent along the wall (perpendicular to the facing direction).
    const tx = cos;
    const tz = -sin;
    // The frame is planes facing into the room (like the walls), a little in front of the panel, so the follow camera
    // standing outside the room behind the player looks straight through it.
    const frame = flatLayer(standard(theme.trim), LAYER.marking);
    const fo = DOOR_PROUD + 0.02;
    for (const side of [-1, 1]) {
      const off = DOOR_W / 2 + POST_W / 2;
      const post = frontPlane(POST_W, POST_H, frame);
      post.position.set(x + tx * off * side + sin * fo, POST_H / 2, z + tz * off * side + cos * fo);
      post.rotation.y = yaw;
      post.userData.shell = true;
      add(post);
    }
    const lintel = frontPlane(DOOR_W + POST_W * 2, LINTEL_H, frame);
    lintel.position.set(x + sin * fo, POST_H + LINTEL_H / 2, z + cos * fo);
    lintel.rotation.y = yaw;
    lintel.userData.shell = true;
    add(lintel);

    const panel = frontPlane(DOOR_W, DOOR_H, flatLayer(standard(0x5d4037), LAYER.decal));
    panel.position.set(x + sin * DOOR_PROUD, DOOR_H / 2, z + cos * DOOR_PROUD);
    panel.rotation.y = yaw;
    panel.userData.shell = true;
    add(panel);

    build.exitDoor = { x, z, yaw };
    if (build.spawn === null) {
      build.spawn = { x: x + 1.5 * sin, z: z + 1.5 * cos, yaw };
    }
    build.spots.push({ id: 'exit', x, z, prompt: 'Leave ' + placed.def.name, run: () => leaveInterior() });
  };

  const spawn = (x: number, z: number, yaw: number): void => {
    build.spawn = { x, z, yaw };
  };

  const put = (prefabId: string, x: number, z: number, yaw = 0, opts: PutOpts = {}): THREE.Object3D => {
    if (!getPrefab(prefabId)) {
      console.warn(`interior kit: unknown prefab ${prefabId}`);
      return new THREE.Group();
    }
    const obj = buildPrefab(prefabId, { lights: false, shadows: false, tint: opts.tint });
    if (opts.size !== undefined) {
      obj.updateMatrixWorld(true);
      const bb = new THREE.Box3().setFromObject(obj);
      const dim = opts.by === 'h'
        ? bb.max.y - bb.min.y
        : Math.max(bb.max.x - bb.min.x, bb.max.z - bb.min.z);
      const k = dim > 0 ? opts.size / dim : 1;
      obj.scale.setScalar(k);
    }
    // Stand the bottom on y, then turn it.
    obj.position.set(x, 0, z);
    obj.updateMatrixWorld(true);
    const base = new THREE.Box3().setFromObject(obj);
    obj.position.set(x, (opts.y ?? 0) - base.min.y, z);
    obj.rotation.y = yaw;
    add(obj);
    obj.updateMatrixWorld(true);
    const bb = new THREE.Box3().setFromObject(obj);

    if (opts.solid !== false && bb.max.y >= RUG_MAX_TOP) {
      boxCollider(bb.min.x, bb.max.x, bb.min.z, bb.max.z, bb.max.y);
    }
    if (bb.max.y - bb.min.y < FLAT_MAX_H) {
      obj.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (!mesh.isMesh) return;
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        for (const m of mats) flatLayer(m, LAYER.decal);
      });
    }
    return obj;
  };

  const block = (
    w: number, h: number, d: number, x: number, z: number,
    opts: { y?: number; color?: number; solid?: boolean; emissive?: number } = {},
  ): THREE.Mesh => {
    const y = opts.y ?? 0;
    const mat = new THREE.MeshStandardMaterial({
      color: opts.color ?? theme.trim,
      emissive: opts.emissive ?? 0,
      roughness: 0.85,
    });
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    mesh.position.set(x, y + h / 2, z);
    add(mesh);
    if (opts.solid !== false) {
      boxCollider(x - w / 2, x + w / 2, z - d / 2, z + d / 2, y + h);
    }
    return mesh;
  };

  const windowFn = (x: number, z: number, yaw: number, w = 1.6, h = 1.2, y = 1.1): void => {
    const sin = Math.sin(yaw);
    const cos = Math.cos(yaw);
    const tx = cos;
    const tz = -sin;
    const frame = flatLayer(standard(theme.trim), LAYER.marking);
    // Frame bars are planes facing into the room, just in front of the pane: invisible to a camera outside the wall.
    const bar = (len: number, bh: number, _bw: number, cx: number, cy: number): void => {
      const m = frontPlane(len, bh, frame);
      const fo = PANE_PROUD + 0.01;
      m.position.set(x + tx * cx + sin * fo, cy, z + tz * cx + cos * fo);
      m.rotation.y = yaw;
      m.userData.shell = true;
      add(m);
    };
    bar(w + FRAME_BAR * 2, FRAME_BAR, FRAME_DEPTH, 0, y - FRAME_BAR / 2); // sill
    bar(w + FRAME_BAR * 2, FRAME_BAR, FRAME_DEPTH, 0, y + h + FRAME_BAR / 2); // head
    bar(FRAME_BAR, h, FRAME_DEPTH, -w / 2 - FRAME_BAR / 2, y + h / 2); // left
    bar(FRAME_BAR, h, FRAME_DEPTH, w / 2 + FRAME_BAR / 2, y + h / 2); // right

    const pane = new THREE.Mesh(new THREE.PlaneGeometry(w, h), flatLayer(new THREE.MeshBasicMaterial({ color: 0xbfe3ff }), LAYER.decal));
    pane.position.set(x + sin * PANE_PROUD, y + h / 2, z + cos * PANE_PROUD);
    pane.rotation.y = yaw;
    pane.userData.shell = true;
    add(pane);
    build.windows.push(pane);
  };

  const sign = (
    text: string, x: number, y: number, z: number, yaw: number,
    opts: { w?: number; h?: number; bg?: number; fg?: number } = {},
  ): void => {
    const w = opts.w ?? 1.6;
    const h = opts.h ?? 0.6;
    const bg = opts.bg ?? 0x2b2b2b;
    const fg = opts.fg ?? 0xf5f0e1;
    const hex = (n: number): string => '#' + n.toString(16).padStart(6, '0');

    let map: THREE.CanvasTexture | null = null;
    if (typeof document !== 'undefined') {
      const canvas = document.createElement('canvas');
      const cw = 512;
      const ch = Math.max(1, Math.round((cw * h) / w));
      canvas.width = cw;
      canvas.height = ch;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = hex(bg);
        ctx.fillRect(0, 0, cw, ch);
        ctx.fillStyle = hex(fg);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const lines = text.split('\n');
        let size = Math.floor((ch * 0.8) / lines.length);
        while (size > 8) {
          ctx.font = `bold ${size}px sans-serif`;
          const widest = Math.max(...lines.map((l) => ctx.measureText(l).width));
          if (widest <= cw * 0.9) break;
          size -= 2;
        }
        ctx.font = `bold ${Math.max(8, size)}px sans-serif`;
        const lineH = Math.max(8, size) * 1.15;
        const startY = ch / 2 - ((lines.length - 1) * lineH) / 2;
        lines.forEach((l, i) => ctx.fillText(l, cw / 2, startY + i * lineH));
        map = new THREE.CanvasTexture(canvas);
        map.colorSpace = THREE.SRGBColorSpace;
      }
    }
    const material = map
      ? flatLayer(new THREE.MeshBasicMaterial({ map }), LAYER.decal)
      : flatLayer(new THREE.MeshBasicMaterial({ color: bg }), LAYER.decal);
    // The sign is a pair: a darker backing board on the marking layer, and the text plane on the decal layer, so the
    // text always draws over it. Grouped so the pair hides together with its wall.
    const pair = new THREE.Group();
    pair.name = 'sign';
    pair.userData.wallSign = true;
    const backing = new THREE.Mesh(
      new THREE.PlaneGeometry(w + SIGN_BACK_PAD, h + SIGN_BACK_PAD),
      flatLayer(new THREE.MeshBasicMaterial({ color: new THREE.Color(bg).multiplyScalar(0.55) }), LAYER.marking),
    );
    backing.position.set(x - Math.sin(yaw) * SIGN_BACK_OFF, y, z - Math.cos(yaw) * SIGN_BACK_OFF);
    backing.rotation.y = yaw;
    pair.add(backing);
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(w, h), material);
    plane.position.set(x, y, z);
    plane.rotation.y = yaw;
    pair.add(plane);
    add(pair);
  };

  const spot = (s: InteriorSpot): void => {
    build.spots.push(s);
  };

  const npc = (n: InteriorNpc): void => {
    const model = makeGnome(group, { ...DEFAULT_LOOK, ...n.look });
    model.update(gnomeStateFor(n) as never, 0);
    model.object.position.set(n.x, 0, n.z);
    model.object.rotation.y = n.yaw;
    model.object.userData.interiorNpc = true;
    build.npcs.push(n);
    if (n.line) {
      const line = n.line;
      build.spots.push({
        id: 'npc-' + n.id,
        x: n.x,
        z: n.z,
        prompt: 'Talk to ' + (n.name ?? 'the gnome'),
        run: () => sayLine(n.name, line),
      });
    }
    boxCollider(n.x - NPC_HALF, n.x + NPC_HALF, n.z - NPC_HALF, n.z + NPC_HALF, NPC_H);
  };

  const stairsTo = (
    x: number, z: number,
    to: string | { x: number; y: number; z: number; yaw: number },
    prompt?: string,
  ): void => {
    if (typeof to === 'string') {
      const id = to;
      build.spots.push({
        id: 'stairs-' + id,
        x,
        z,
        prompt: prompt ?? 'Go through',
        run: () => {
          enterInterior(id);
        },
      });
    } else {
      const pose = to;
      build.spots.push({
        id: 'stairs-out',
        x,
        z,
        prompt: prompt ?? 'Go out',
        run: () => {
          leaveInterior(pose);
        },
      });
    }
  };

  /** The room's wall decor, classified from the group's children as they stand now (call after build). */
  const walls = (): WallDecor[] => {
    if (!shell) return [];
    const { hw, hd } = shell;
    // axis 'z' walls lie on a z plane (north, south); 'x' walls on an x plane (west, east).
    const list: { decor: WallDecor; axis: 'x' | 'z' }[] = [
      { decor: { x: 0, z: -hd, nx: 0, nz: 1, objects: [] }, axis: 'z' }, // north
      { decor: { x: 0, z: hd, nx: 0, nz: -1, objects: [] }, axis: 'z' }, // south
      { decor: { x: -hw, z: 0, nx: 1, nz: 0, objects: [] }, axis: 'x' }, // west
      { decor: { x: hw, z: 0, nx: -1, nz: 0, objects: [] }, axis: 'x' }, // east
    ];
    const planeOf = (wl: (typeof list)[number]): number => (wl.axis === 'z' ? wl.decor.z : wl.decor.x);
    const normalOf = (wl: (typeof list)[number]): number => (wl.axis === 'z' ? wl.decor.nz : wl.decor.nx);
    for (const c of group.children) {
      if (c.userData.shell || c.userData.interiorNpc) continue;
      c.updateMatrixWorld(true);
      const bb = new THREE.Box3().setFromObject(c);
      if (bb.isEmpty()) continue;
      if (c.userData.wallSign) {
        const mid = bb.getCenter(new THREE.Vector3());
        let best: (typeof list)[number] | null = null;
        let bestD = Infinity;
        for (const wl of list) {
          const along = wl.axis === 'z' ? mid.z : mid.x;
          const dist = Math.abs(along - planeOf(wl));
          if (dist < bestD) { bestD = dist; best = wl; }
        }
        if (best && bestD < SIGN_MAX_WALL_DIST) best.decor.objects.push(c);
        continue;
      }
      if (bb.min.y < WALL_HANG_MIN_Y) continue; // it stands on the floor: not wall decor
      let best: (typeof list)[number] | null = null;
      let bestD = Infinity;
      for (const wl of list) {
        const lo = wl.axis === 'z' ? bb.min.z : bb.min.x;
        const hi = wl.axis === 'z' ? bb.max.z : bb.max.x;
        if (hi - lo > WALL_MAX_THICK) continue;
        const plane = planeOf(wl);
        // The far side (the side away from the room) must reach the wall.
        const reaches = normalOf(wl) > 0 ? lo <= plane + WALL_FAR_SIDE : hi >= plane - WALL_FAR_SIDE;
        if (!reaches) continue;
        const dist = Math.abs((lo + hi) / 2 - plane);
        if (dist < bestD) { bestD = dist; best = wl; }
      }
      if (best) best.decor.objects.push(c);
    }
    return list.map((wl) => wl.decor);
  };

  const kit: InteriorKit = {
    id: placed.def.id,
    name: placed.def.name,
    group,
    theme,
    size,
    room,
    door,
    spawn,
    put,
    block,
    window: windowFn,
    sign,
    spot,
    npc,
    stairsTo,
  };
  return { kit, build, walls };
}

function gnomeStateFor(n: InteriorNpc) {
  return gnomeState(n.x, 0, n.z, n.yaw, 0, !!n.sit);
}

/** Speaks a resident's line: the runtime turns the event into a toast. */
function sayLine(name: string | undefined, line: string): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('gta:interior-say', { detail: { name, line } }));
}

/** Free every geometry, material and texture under the group (on leaving). */
export function disposeGroup(group: THREE.Object3D): void {
  group.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (mesh.geometry) {
      try { mesh.geometry.dispose(); } catch { /* already gone */ }
    }
    const mats = mesh.material === undefined ? [] : Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const m of mats) {
      const map = (m as THREE.MeshBasicMaterial).map;
      if (map) {
        try { map.dispose(); } catch { /* already gone */ }
      }
      try { m.dispose(); } catch { /* already gone */ }
    }
  });
}
