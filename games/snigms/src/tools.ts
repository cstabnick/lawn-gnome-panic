// Pointer and keyboard input: camera (pan, zoom, orbit), wall dragging, furniture placing, floor painting, erasing, selecting, live-mode clicks.
import { COST, FURNITURE } from './config';
import { buildEdges, buyItem, paintFloor, relocateItem, sellItem } from './actions';
import type { App, EdgeKey, FurnitureDef, PlacedItem, Rot } from './types';
import type { Brain } from './brain';
import type { Ghost, View } from './view';
import { type Tile, type Vertex, canPlace, edgeInBounds, edgeKey, edgesBetween, itemSize } from './world';

export interface Tools {
  /** Call every frame (key-held camera movement, ghost refresh). */
  update(dt: number): void;
}

const TAP_PX = 8; // movement under this is still a tap
const TAP_MS = 400; // touch taps must be quicker than this
const KEY_PAN_PX = 420; // screen pixels per second for WASD / arrows
const KEY_ORBIT = 1.6; // radians per second for Q / E
const WHEEL_STEP = 1.1;

interface Ptr {
  id: number;
  type: string;
  sx: number; // where it went down
  sy: number;
  x: number; // latest position
  y: number;
  t: number; // down time (ms)
  moved: boolean;
}

/** One pointer's drag or tap. move() runs on every move; up() once with tap = true when it barely moved. */
interface Gesture {
  pid: number;
  move(x: number, y: number, dx: number, dy: number): void;
  up(tap: boolean, x: number, y: number): void;
  cancel(): void;
}

export function createTools(app: App, view: View, brain: Brain, canvas: HTMLCanvasElement): Tools {
  const pointers = new Map<number, Ptr>();
  const heldKeys = new Set<string>();
  let gesture: Gesture | null = null;
  let pinch: { dist: number; mx: number; my: number; ang: number } | null = null;
  let hover: { x: number; y: number } | null = null; // mouse position, for hover ghosts
  let ghostSig = '';
  let lastCtx = '';
  let shownSelected: number | null | undefined = undefined;

  // ---- helpers ----

  function setGhost(g: Ghost | null): void {
    const sig = g ? JSON.stringify(g) : '';
    if (sig === ghostSig) return;
    ghostSig = sig;
    view.setGhost(g);
  }

  function findItem(id: number): PlacedItem | undefined {
    return app.h.lot.items.find((i) => i.id === id);
  }

  /** Top-left tile that centres the footprint on `tile`. */
  function centred(def: FurnitureDef, tile: Tile, rot: Rot): Tile {
    const s = itemSize(def, rot);
    return { tx: tile.tx - Math.floor(s.w / 2), ty: tile.ty - Math.floor(s.d / 2) };
  }

  function placeGhostAt(x: number, y: number): Ghost | null {
    const kind = app.tool.kind;
    const def = kind ? FURNITURE[kind] : undefined;
    if (!kind || !def) return null;
    const tile = view.pickTile(x, y);
    if (!tile) return null;
    const { tx, ty } = centred(def, tile, app.tool.rot);
    return { type: 'item', kind, tx, ty, rot: app.tool.rot, valid: canPlace(app.h.lot, kind, tx, ty, app.tool.rot) };
  }

  /** The lot edge nearest the ground point under (x, y): a horizontal or vertical edge, whichever midpoint is closer. */
  function nearestEdge(x: number, y: number): EdgeKey | null {
    const g = view.pickGround(x, y);
    if (!g) return null;
    const hk = edgeKey('h', Math.floor(g.x), Math.round(g.z));
    const vk = edgeKey('v', Math.round(g.x), Math.floor(g.z));
    const hd = (Math.floor(g.x) + 0.5 - g.x) ** 2 + (Math.round(g.z) - g.z) ** 2;
    const vd = (Math.round(g.x) - g.x) ** 2 + (Math.floor(g.z) + 0.5 - g.z) ** 2;
    const order = hd <= vd ? [hk, vk] : [vk, hk];
    for (const k of order) if (edgeInBounds(app.h.lot, k)) return k;
    return null;
  }

  /** The ghost a mouse hover shows for the current tool (null when nothing hover-able). */
  function hoverGhost(): Ghost | null {
    if (!hover) return null;
    const { x, y } = hover;
    if (app.mode === 'furnish' && app.tool.tool === 'place') return placeGhostAt(x, y);
    if (app.mode === 'build' && (app.tool.tool === 'door' || app.tool.tool === 'window')) {
      const key = nearestEdge(x, y);
      if (!key) return null;
      const cost = COST[app.tool.tool];
      return { type: 'edges', keys: [key], kind: app.tool.tool, valid: app.h.lot.edges[key] === 'wall' && app.h.funds >= cost };
    }
    return null;
  }

  function cancelPlacing(): void {
    app.tool.tool = 'select';
    setGhost(null);
  }

  function isTyping(): boolean {
    const el = document.activeElement;
    if (!el) return false;
    const tag = el.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || (el as HTMLElement).isContentEditable === true;
  }

  function isTap(p: Ptr): boolean {
    if (p.moved) return false;
    return p.type !== 'touch' || performance.now() - p.t < TAP_MS;
  }

  // ---- gestures ----

  /** Camera drag: right or middle button (any mode), or left drag on empty ground in live mode / select tool. */
  function startPan(p: Ptr, orbit: boolean, onTap: (() => void) | null): Gesture {
    return {
      pid: p.id,
      move(_x, _y, dx, dy) {
        if (orbit) view.orbit(dx * 0.01);
        else view.pan(dx, dy);
      },
      up(tap) {
        if (tap && onTap) onTap();
      },
      cancel() {},
    };
  }

  /** A gesture that only reacts to a tap. */
  function startTap(p: Ptr, onTap: () => void): Gesture {
    return {
      pid: p.id,
      move() {},
      up(tap) {
        if (tap) onTap();
      },
      cancel() {},
    };
  }

  /** Drag out a straight run of edges (wall tool, or erase). */
  function startEdgeDrag(p: Ptr, start: Vertex, kind: 'wall' | 'erase'): Gesture {
    let cur = start;
    const show = () => {
      const keys = edgesBetween(start, cur);
      const valid = kind === 'erase' || app.h.funds >= COST.wall * keys.length;
      setGhost({ type: 'edges', keys, kind, valid });
    };
    return {
      pid: p.id,
      move(x, y) {
        const v = view.pickVertex(x, y);
        if (!v) return;
        cur = v;
        show();
      },
      up() {
        setGhost(null);
        const keys = edgesBetween(start, cur);
        if (keys.length === 0) return;
        if (kind === 'erase') buildEdges(app, keys, null);
        else buildEdges(app, keys, 'wall');
      },
      cancel() {
        setGhost(null);
      },
    };
  }

  /** Paint every distinct tile the pointer crosses; paints them on release. */
  function startFloorDrag(p: Ptr): Gesture {
    const tiles = new Map<string, Tile>();
    const add = (x: number, y: number) => {
      const t = view.pickTile(x, y);
      if (!t) return;
      const k = `${t.tx},${t.ty}`;
      if (!tiles.has(k)) tiles.set(k, t);
    };
    const show = () => {
      const list = [...tiles.values()];
      setGhost({ type: 'tiles', tiles: list, valid: app.h.funds >= COST.floor * list.length });
    };
    add(p.x, p.y);
    show();
    return {
      pid: p.id,
      move(x, y) {
        add(x, y);
        show();
      },
      up() {
        setGhost(null);
        const list = [...tiles.values()];
        if (list.length > 0) paintFloor(app, list, app.tool.floor);
      },
      cancel() {
        setGhost(null);
      },
    };
  }

  /** Place a new item: the ghost follows the pointer, release buys it, the tool stays on 'place'. */
  function startPlace(p: Ptr): Gesture {
    const show = (x: number, y: number) => setGhost(placeGhostAt(x, y));
    show(p.x, p.y);
    return {
      pid: p.id,
      move(x, y) {
        show(x, y);
      },
      up(_tap, x, y) {
        setGhost(null);
        const kind = app.tool.kind;
        const def = kind ? FURNITURE[kind] : undefined;
        const tile = view.pickTile(x, y);
        if (!kind || !def || !tile) return;
        const { tx, ty } = centred(def, tile, app.tool.rot);
        buyItem(app, kind, tx, ty, app.tool.rot);
      },
      cancel() {
        setGhost(null);
      },
    };
  }

  /** Drag the selected item to a new tile; a tap keeps it selected. */
  function startItemDrag(p: Ptr, id: number): Gesture | null {
    const item = findItem(id);
    const def = item ? FURNITURE[item.kind] : undefined;
    if (!item || !def) return null;
    const kind = item.kind;
    const show = (x: number, y: number) => {
      const cur = findItem(id);
      const tile = view.pickTile(x, y);
      if (!cur || !tile) {
        setGhost(null);
        return;
      }
      const { tx, ty } = centred(def, tile, cur.rot);
      setGhost({ type: 'item', kind, tx, ty, rot: cur.rot, valid: canPlace(app.h.lot, kind, tx, ty, cur.rot, id) });
    };
    return {
      pid: p.id,
      move(x, y) {
        show(x, y);
      },
      up(tap, x, y) {
        setGhost(null);
        if (tap) {
          app.selected = id;
          return;
        }
        const cur = findItem(id);
        const tile = view.pickTile(x, y);
        if (!cur || !tile) return;
        const { tx, ty } = centred(def, tile, cur.rot);
        relocateItem(app, id, tx, ty, cur.rot);
      },
      cancel() {
        setGhost(null);
      },
    };
  }

  /** Door or window: a tap on the nearest edge. */
  function edgeTap(p: Ptr, kind: 'door' | 'window'): Gesture {
    return startTap(p, () => {
      const key = nearestEdge(p.x, p.y);
      if (key) buildEdges(app, [key], kind);
    });
  }

  /** Decide what a new pointer does, given the mode and tool. Returns null when it does nothing. */
  function beginGesture(p: Ptr, button: number, shift: boolean): Gesture | null {
    // Right and middle buttons always move the camera; a right click (no drag) cancels placing.
    if (p.type === 'mouse' && button !== 0) {
      if (button === 2 && shift) return startPan(p, true, null);
      return startPan(p, false, () => {
        if (app.mode === 'furnish' && app.tool.tool === 'place') cancelPlacing();
      });
    }

    const { x, y } = p;
    const tool = app.tool.tool;

    if (app.mode === 'live') {
      const id = view.pickItem(x, y);
      if (id === null) return startPan(p, false, null);
      return startTap(p, () => brain.commandUse(id));
    }

    if (app.mode === 'build') {
      switch (tool) {
        case 'wall':
        case 'erase': {
          if (tool === 'erase') {
            const id = view.pickItem(x, y);
            if (id !== null) {
              sellItem(app, id);
              return null;
            }
          }
          const v = view.pickVertex(x, y);
          if (!v) return null;
          return startEdgeDrag(p, v, tool === 'wall' ? 'wall' : 'erase');
        }
        case 'door':
        case 'window':
          return edgeTap(p, tool);
        case 'floor':
          return startFloorDrag(p);
        default:
          return startPan(p, false, null);
      }
    }

    // furnish
    switch (tool) {
      case 'place':
        return app.tool.kind ? startPlace(p) : startPan(p, false, null);
      case 'erase': {
        const id = view.pickItem(x, y);
        if (id !== null) {
          sellItem(app, id);
          return null;
        }
        const v = view.pickVertex(x, y);
        if (!v) return null;
        return startEdgeDrag(p, v, 'erase');
      }
      case 'select': {
        const id = view.pickItem(x, y);
        if (id !== null && id === app.selected) {
          const g = startItemDrag(p, id);
          if (g) return g;
        }
        if (id !== null) return startTap(p, () => { app.selected = id; });
        return startPan(p, false, () => { app.selected = null; });
      }
      default:
        return startPan(p, false, null);
    }
  }

  /** Two fingers (or any two pointers): pinch zooms, moving both pans, twisting orbits. */
  function pinchStep(): void {
    const it = pointers.values();
    const a = it.next().value as Ptr;
    const b = it.next().value as Ptr;
    const dist = Math.hypot(a.x - b.x, a.y - b.y);
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2;
    const ang = Math.atan2(b.y - a.y, b.x - a.x);
    if (pinch) {
      if (dist > 0) view.zoom(pinch.dist / dist);
      view.pan(mx - pinch.mx, my - pinch.my);
      let d = ang - pinch.ang;
      while (d > Math.PI) d -= 2 * Math.PI;
      while (d < -Math.PI) d += 2 * Math.PI;
      view.orbit(d);
    }
    pinch = { dist, mx, my, ang };
  }

  // ---- pointer events ----

  canvas.addEventListener('pointerdown', (e: PointerEvent) => {
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {
      /* not every pointer can be captured */
    }
    const p: Ptr = { id: e.pointerId, type: e.pointerType, sx: e.clientX, sy: e.clientY, x: e.clientX, y: e.clientY, t: performance.now(), moved: false };
    pointers.set(p.id, p);
    if (e.pointerType === 'touch') hover = null;

    if (pointers.size >= 2) {
      // A second pointer cancels whatever one-pointer gesture was running.
      gesture?.cancel();
      gesture = null;
      setGhost(null);
      pinch = null;
      return;
    }
    gesture = beginGesture(p, e.button, e.shiftKey);
  });

  canvas.addEventListener('pointermove', (e: PointerEvent) => {
    const p = pointers.get(e.pointerId);
    if (!p) {
      if (e.pointerType === 'mouse') hover = { x: e.clientX, y: e.clientY };
      return;
    }
    const dx = e.clientX - p.x;
    const dy = e.clientY - p.y;
    p.x = e.clientX;
    p.y = e.clientY;
    if (Math.hypot(p.x - p.sx, p.y - p.sy) > TAP_PX) p.moved = true;
    if (p.type === 'mouse') hover = { x: p.x, y: p.y };

    if (pointers.size >= 2) {
      pinchStep();
      return;
    }
    if (gesture && gesture.pid === p.id) gesture.move(p.x, p.y, dx, dy);
  });

  const endPointer = (e: PointerEvent) => {
    const p = pointers.get(e.pointerId);
    if (!p) return;
    p.x = e.clientX;
    p.y = e.clientY;
    if (Math.hypot(p.x - p.sx, p.y - p.sy) > TAP_PX) p.moved = true;
    pointers.delete(p.id);
    if (p.type === 'touch') hover = null;
    if (pointers.size < 2) pinch = null;

    if (gesture && gesture.pid === p.id) {
      const g = gesture;
      gesture = null;
      if (e.type === 'pointercancel') g.cancel();
      else g.up(isTap(p), p.x, p.y);
    }
  };
  canvas.addEventListener('pointerup', endPointer);
  canvas.addEventListener('pointercancel', endPointer);
  canvas.addEventListener('pointerleave', (e: PointerEvent) => {
    if (e.pointerType === 'mouse' && !pointers.has(e.pointerId)) hover = null;
  });

  canvas.addEventListener(
    'wheel',
    (e: WheelEvent) => {
      e.preventDefault();
      view.zoom(e.deltaY > 0 ? WHEEL_STEP : 1 / WHEEL_STEP);
    },
    { passive: false },
  );
  canvas.addEventListener('contextmenu', (e: Event) => e.preventDefault());

  // ---- keyboard ----

  window.addEventListener('keydown', (e: KeyboardEvent) => {
    if (isTyping()) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    heldKeys.add(k);

    switch (k) {
      case 'r': {
        if (e.repeat || app.mode !== 'furnish') return;
        if (app.tool.tool === 'select' && app.selected !== null) {
          const item = findItem(app.selected);
          if (item) relocateItem(app, item.id, item.tx, item.ty, ((item.rot + 1) % 4) as Rot);
        } else if (app.tool.tool === 'place') {
          app.tool.rot = ((app.tool.rot + 1) % 4) as Rot;
        }
        return;
      }
      case 'Delete':
      case 'Backspace': {
        if (app.mode !== 'furnish' || app.tool.tool !== 'select' || app.selected === null) return;
        e.preventDefault();
        sellItem(app, app.selected);
        return;
      }
      case 'Escape': {
        if (app.tool.tool === 'place') cancelPlacing();
        else app.selected = null;
        return;
      }
      default:
        return;
    }
  });
  window.addEventListener('keyup', (e: KeyboardEvent) => {
    heldKeys.delete(e.key.length === 1 ? e.key.toLowerCase() : e.key);
  });
  window.addEventListener('blur', () => heldKeys.clear());

  // ---- per frame ----

  return {
    update(dt: number) {
      // Held keys: camera. The lot follows the pan direction, so W moves the camera forward (ground slides down).
      if (dt > 0 && !isTyping()) {
        let px = 0;
        let py = 0;
        if (heldKeys.has('w') || heldKeys.has('ArrowUp')) py += 1;
        if (heldKeys.has('s') || heldKeys.has('ArrowDown')) py -= 1;
        if (heldKeys.has('a') || heldKeys.has('ArrowLeft')) px += 1;
        if (heldKeys.has('d') || heldKeys.has('ArrowRight')) px -= 1;
        if (px !== 0 || py !== 0) view.pan(px * KEY_PAN_PX * dt, py * KEY_PAN_PX * dt);
        if (heldKeys.has('q')) view.orbit(-KEY_ORBIT * dt);
        if (heldKeys.has('e')) view.orbit(KEY_ORBIT * dt);
        if (heldKeys.has('+') || heldKeys.has('=')) view.zoom(Math.pow(0.5, dt));
        if (heldKeys.has('-') || heldKeys.has('_')) view.zoom(Math.pow(2, dt));
      }

      // Mode or tool changed (the UI sets these directly): drop the old ghost.
      const ctx = `${app.mode}|${app.tool.tool}|${app.tool.kind}|${app.tool.rot}|${app.tool.floor}`;
      if (ctx !== lastCtx) {
        lastCtx = ctx;
        if (!gesture) setGhost(null);
      }
      if (app.selected !== shownSelected) {
        shownSelected = app.selected;
        view.setSelected(app.selected);
      }
      // Hover ghosts follow the mouse (setGhost skips unchanged ghosts).
      if (!gesture && pointers.size === 0) setGhost(hoverGhost());
    },
  };
}
