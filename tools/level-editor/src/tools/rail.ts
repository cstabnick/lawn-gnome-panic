// The Rail tool: the dog's path as a graph of nodes. Each node sits on the ground with a height (its lift). The path the dog
// takes is the smooth curve through the nodes, drawn here the way the game draws it.
//
//   drag a node          move it on the ground (snaps to the grid when Snap is on)
//   Shift+click a path   insert a node there
//   click empty ground   clear the selection
//   Delete / Backspace   remove the selected node (a rail keeps at least two)
//   arrows               nudge the selected node (Shift: 5 m)
//   PageUp / PageDown    raise or lower it (Shift: 1 m; otherwise 0.1 m)
//   Escape               clear the selection
//
// The tool works on the zone's `rail` list (see adapters/gnomeokemonLevel.ts). Every change goes through editZone, so undo works.
import * as THREE from 'three';
import type { EditorContext, Tool } from '../context';

interface RailNode { x: number; z: number; lift: number }
interface RailZone { rail: RailNode[] }

const NODE_PICK = 2.5; // metres: how close a click must be to grab a node
const SEGMENT_PICK = 3; // metres: how close a Shift+click must be to a segment to insert a node
const NODE_R = 0.7;
const LINE_COLOUR = 0x4ad6ff;
const NODE_COLOUR = 0x4ad6ff;
const SELECTED_COLOUR = 0xffd24a;
const BAD_COLOUR = 0xff5a5a;
const RENDER_ORDER = 12;
const CURVE_STEPS = 12; // curve samples per node

const copy = (nodes: readonly RailNode[]): RailNode[] => nodes.map((n) => ({ x: n.x, z: n.z, lift: n.lift }));

function numberSprite(n: number, colour: number): THREE.Sprite {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d')!;
  g.fillStyle = `#${colour.toString(16).padStart(6, '0')}`;
  g.beginPath();
  g.arc(32, 32, 30, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#111';
  g.font = 'bold 38px sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(String(n), 32, 34);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), depthTest: false }));
  s.scale.set(3.2, 3.2, 1);
  s.renderOrder = RENDER_ORDER + 1;
  return s;
}

export const railTool: Tool = (() => {
  let ctx: EditorContext | null = null;
  let panel: HTMLElement | null = null;
  let active = false;
  let selected = -1;
  let dragging: { index: number; start: RailNode[] } | null = null;
  const overlay = new THREE.Group();
  overlay.name = 'rail-tool';
  let unsubscribe: (() => void) | null = null;

  const zoneOf = (): RailZone => ctx!.zones[ctx!.zone] as unknown as RailZone;
  const nodes = (): RailNode[] => zoneOf().rail;
  const groundY = (x: number, z: number): number => ctx!.terrain.heightAt(x, z);
  const at = (n: RailNode): THREE.Vector3 => new THREE.Vector3(n.x, groundY(n.x, n.z) + n.lift + 0.4, n.z);

  // ---- overlay

  function clearOverlay(): void {
    for (const c of [...overlay.children]) {
      overlay.remove(c);
      c.traverse((o) => {
        if (o instanceof THREE.Mesh || o instanceof THREE.Line) {
          o.geometry.dispose();
          (o.material as THREE.Material).dispose();
        }
        if (o instanceof THREE.Sprite) (o.material as THREE.SpriteMaterial).map?.dispose();
      });
    }
  }

  function rebuild(): void {
    clearOverlay();
    if (!active || !ctx) return;
    const ns = nodes();
    if (ns.length === 0) return;
    // The curve the dog takes, through the nodes.
    const curve = new THREE.CatmullRomCurve3(ns.map(at));
    const pts = curve.getPoints(Math.max(2, (ns.length - 1) * CURVE_STEPS));
    const path = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: LINE_COLOUR, depthTest: false }));
    path.renderOrder = RENDER_ORDER;
    overlay.add(path);
    // The straight segments between nodes, dimmer: where a node is inserted.
    const chain = new THREE.Line(new THREE.BufferGeometry().setFromPoints(ns.map(at)), new THREE.LineDashedMaterial({ color: LINE_COLOUR, dashSize: 0.8, gapSize: 0.6, depthTest: false, transparent: true, opacity: 0.5 }));
    chain.computeLineDistances();
    chain.renderOrder = RENDER_ORDER - 1;
    overlay.add(chain);
    ns.forEach((n, i) => {
      const colour = i === selected ? SELECTED_COLOUR : (nodeGoesUp(ns, i) ? BAD_COLOUR : NODE_COLOUR);
      const ball = new THREE.Mesh(new THREE.SphereGeometry(NODE_R, 12, 8), new THREE.MeshBasicMaterial({ color: colour, depthTest: false }));
      ball.position.copy(at(n));
      ball.renderOrder = RENDER_ORDER;
      overlay.add(ball);
      const label = numberSprite(i + 1, colour);
      label.position.copy(at(n)).add(new THREE.Vector3(0, 2.2, 0));
      overlay.add(label);
    });
    if (!overlay.parent) ctx.viewport.overlay.add(overlay);
  }

  /** The dog's path goes against the ride here: z does not fall from the previous node. */
  function nodeGoesUp(ns: readonly RailNode[], i: number): boolean {
    return i > 0 && ns[i].z >= ns[i - 1].z;
  }

  // ---- panel

  function el<K extends keyof HTMLElementTagNameMap>(tag: K, text?: string, cls?: string): HTMLElementTagNameMap[K] {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (cls) node.className = cls;
    return node;
  }

  const list = el('div', undefined, 'rail-list');
  const detail = el('div', undefined, 'rail-detail');
  const info = el('p', undefined, 'rail-info');
  const hint = el(
    'p',
    'Drag a node to move it. Shift+click the path to add a node. Delete removes the selected node. Arrows nudge it; PageUp and PageDown raise or lower it.',
    'hint',
  );
  const addBtn = el('button', 'Add a node at the end');

  function field(label: string, value: number, step: number, apply: (v: number) => void): HTMLLabelElement {
    const row = el('label', `${label} `);
    const input = el('input');
    input.type = 'number';
    input.step = String(step);
    input.value = String(Math.round(value * 1000) / 1000);
    input.addEventListener('change', () => {
      const v = Number(input.value);
      if (Number.isFinite(v)) apply(v);
    });
    row.append(input);
    return row;
  }

  function refreshPanel(): void {
    if (!panel || !ctx) return;
    const ns = nodes();
    list.replaceChildren();
    ns.forEach((n, i) => {
      const b = el('button', `${i + 1}. (${n.x.toFixed(1)}, ${n.z.toFixed(1)}) ${n.lift.toFixed(1)} m${nodeGoesUp(ns, i) ? ' ⚠' : ''}`);
      b.classList.toggle('on', i === selected);
      b.title = nodeGoesUp(ns, i) ? 'The path goes back toward the gate here: the dog runs from the first node to the last.' : '';
      b.addEventListener('click', () => { select(i); ctx!.viewport.focus(n.x, n.z); });
      list.append(b);
    });
    detail.replaceChildren();
    const sel = selected >= 0 ? ns[selected] : undefined;
    if (sel) {
      const i = selected;
      detail.append(
        el('h4', `Node ${i + 1}`),
        field('x', sel.x, 0.1, (v) => edit('Move rail node', (n) => { n.x = v; })),
        field('z', sel.z, 0.1, (v) => edit('Move rail node', (n) => { n.z = v; })),
        field('Height above the ground (m)', sel.lift, 0.1, (v) => edit('Rail height', (n) => { n.lift = Math.max(0, v); })),
      );
      const del = el('button', 'Delete this node');
      del.addEventListener('click', removeSelected);
      detail.append(del);
    }
    const length = ns.slice(1).reduce((sum, n, i) => sum + Math.hypot(n.x - ns[i].x, n.z - ns[i].z), 0);
    const up = ns.filter((_, i) => nodeGoesUp(ns, i)).length;
    info.textContent = `${ns.length} nodes, about ${Math.round(length)} m long.${up > 0 ? ` ${up} node(s) go back toward the gate (marked ⚠ and red).` : ''}`;
  }

  function select(i: number): void {
    selected = i;
    rebuild();
    refreshPanel();
  }

  // ---- edits (each one an undo step)

  /** Applies `fn` to the node at the selected index, through the editor's undo. */
  function edit(label: string, fn: (n: RailNode) => void): void {
    if (!ctx || selected < 0) return;
    const index = selected;
    ctx.editZone(label, ctx.zone, (def) => {
      const n = (def as unknown as RailZone).rail[index];
      if (n) fn(n);
    });
  }

  function removeSelected(): void {
    if (!ctx || selected < 0) return;
    if (nodes().length <= 2) {
      ctx.status('The rail needs at least two nodes', 'error');
      return;
    }
    const index = selected;
    ctx.editZone('Remove rail node', ctx.zone, (def) => {
      (def as unknown as RailZone).rail.splice(index, 1);
    });
    selected = Math.min(index, nodes().length - 1);
    rebuild();
    refreshPanel();
  }

  function addAtEnd(): void {
    if (!ctx) return;
    const ns = nodes();
    const last = ns[ns.length - 1];
    const x = ctx.round(last.x);
    const z = ctx.round(last.z - 4);
    ctx.editZone('Add rail node', ctx.zone, (def) => {
      (def as unknown as RailZone).rail.push({ x, z, lift: last.lift });
    });
    select(nodes().length - 1);
  }

  /** Index of the segment nearest (x, z), with the point on it. */
  function nearestSegment(x: number, z: number): { i: number; d: number; t: number } | null {
    const ns = nodes();
    let best: { i: number; d: number; t: number } | null = null;
    for (let i = 0; i + 1 < ns.length; i++) {
      const a = ns[i];
      const b = ns[i + 1];
      const dx = b.x - a.x;
      const dz = b.z - a.z;
      const len2 = dx * dx + dz * dz || 1;
      const t = Math.max(0, Math.min(1, ((x - a.x) * dx + (z - a.z) * dz) / len2));
      const d = Math.hypot(x - (a.x + t * dx), z - (a.z + t * dz));
      if (best === null || d < best.d) best = { i, d, t };
    }
    return best;
  }

  function insertOnSegment(x: number, z: number): void {
    if (!ctx) return;
    const seg = nearestSegment(x, z);
    if (seg === null || seg.d > SEGMENT_PICK) return;
    const { i, t } = seg;
    const a = nodes()[i];
    const b = nodes()[i + 1];
    const px = ctx.round(a.x + (b.x - a.x) * t);
    const pz = ctx.round(a.z + (b.z - a.z) * t);
    const lift = Math.round((a.lift + (b.lift - a.lift) * t) * 10) / 10;
    ctx.editZone('Insert rail node', ctx.zone, (def) => {
      (def as unknown as RailZone).rail.splice(i + 1, 0, { x: px, z: pz, lift });
    });
    select(i + 1);
  }

  // ---- pointer and keys

  function onPointerDown(ev: PointerEvent): void {
    if (!ctx || ev.button !== 0) return;
    const hit = ctx.viewport.pick(ev);
    if (hit === null) return;
    const ns = nodes();
    let best = -1;
    let bestD = NODE_PICK;
    ns.forEach((n, i) => {
      const d = Math.hypot(n.x - hit.x, n.z - hit.z);
      if (d < bestD) { bestD = d; best = i; }
    });
    if (best >= 0) {
      select(best);
      dragging = { index: best, start: copy(ns) };
      return;
    }
    if (ev.shiftKey) {
      insertOnSegment(hit.x, hit.z);
      return;
    }
    select(-1);
  }

  function onPointerMove(ev: PointerEvent): void {
    if (!ctx || dragging === null) return;
    const hit = ctx.viewport.pick(ev);
    if (hit === null) return;
    const n = nodes()[dragging.index];
    n.x = ctx.round(hit.x);
    n.z = ctx.round(hit.z);
    ctx.touch(ctx.adapter.zoneRect(ctx.zones[ctx.zone]));
    rebuild();
  }

  function onPointerUp(): void {
    if (!ctx || dragging === null) return;
    const { index, start } = dragging;
    dragging = null;
    const final = nodes()[index];
    if (!final) return;
    const moved = { x: final.x, z: final.z };
    // Put the start back, then commit the move through the editor, so undo returns to where the node was.
    const live = nodes();
    start.forEach((s, i) => { live[i].x = s.x; live[i].z = s.z; live[i].lift = s.lift; });
    if (moved.x === start[index].x && moved.z === start[index].z) {
      ctx.touch(ctx.adapter.zoneRect(ctx.zones[ctx.zone]));
      rebuild();
      refreshPanel();
      return;
    }
    ctx.editZone('Move rail node', ctx.zone, (def) => {
      const n = (def as unknown as RailZone).rail[index];
      if (n) { n.x = moved.x; n.z = moved.z; }
    });
    rebuild();
    refreshPanel();
  }

  function onKeyDown(ev: KeyboardEvent): void {
    if (!ctx || !active) return;
    const target = ev.target as HTMLElement | null;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA')) return;
    if (ev.key === 'Escape') { select(-1); return; }
    if (selected < 0) return;
    const big = ev.shiftKey;
    const step = big ? 5 : 0.5;
    const lift = big ? 1 : 0.1;
    if (ev.key === 'Delete' || ev.key === 'Backspace') { removeSelected(); ev.preventDefault(); return; }
    const moves: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    const mv = moves[ev.key];
    if (mv) {
      const [dx, dz] = mv;
      edit('Nudge rail node', (n) => { n.x = Math.round((n.x + dx) * 10) / 10; n.z = Math.round((n.z + dz) * 10) / 10; });
      ev.preventDefault();
      return;
    }
    if (ev.key === 'PageUp' || ev.key === 'PageDown') {
      const dir = ev.key === 'PageUp' ? 1 : -1;
      edit('Rail height', (n) => { n.lift = Math.max(0, Math.round((n.lift + dir * lift) * 10) / 10); });
      ev.preventDefault();
    }
  }

  return {
    id: 'rail',
    label: 'Rail',
    mount(editor, p) {
      ctx = editor;
      panel = p;
      p.replaceChildren();
      p.append(el('h3', "The dog's path"), info, hint, list, detail, addBtn);
      addBtn.addEventListener('click', addAtEnd);
    },
    activate() {
      if (!ctx) return;
      active = true;
      ctx.viewport.setLeftOrbit(false);
      ctx.viewport.dom.addEventListener('pointerdown', onPointerDown);
      ctx.viewport.dom.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
      window.addEventListener('keydown', onKeyDown);
      unsubscribe = ctx.events.changed.on(() => { rebuild(); refreshPanel(); });
      rebuild();
      refreshPanel();
    },
    deactivate() {
      if (!ctx) return;
      active = false;
      ctx.viewport.setLeftOrbit(true);
      ctx.viewport.dom.removeEventListener('pointerdown', onPointerDown);
      ctx.viewport.dom.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('keydown', onKeyDown);
      unsubscribe?.();
      unsubscribe = null;
      dragging = null;
      clearOverlay();
      overlay.removeFromParent();
    },
  };
})();
