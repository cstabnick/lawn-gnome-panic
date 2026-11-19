// The Road tool: draw dirt roads in a zone as polylines, move their points, insert and remove points, delete a road.
// A road is a PathDef with kind 'road' in the zone's `paths`. The game draws it; this tool draws only the editing handles.
import * as THREE from 'three';
import type { PathDef } from '@lawn/level';
import type { EditorContext, Tool } from '../context';
import { zoneRect } from '../state';
import { insertPoint, nearestOnPolyline, nearestPoint, removePoint, type Pt } from './roadMath';

const POINT_PICK = 2; // metres: how close a click must be to grab a point
const SEGMENT_PICK = 3; // metres: how close a click must be to grab a segment or another road
const HANDLE_R = 0.6;
const DRAFT_R = 0.5;
const LINE_COLOUR = 0xffd24a;
const HANDLE_COLOUR = 0xffd24a;
const SELECTED_COLOUR = 0x4ad6ff;
const RENDER_ORDER = 12;
const DEFAULT_WIDTH = 3;

const round1 = (v: number): number => Math.round(v * 10) / 10;
const copyPts = (pts: readonly Pt[]): Pt[] => pts.map((p): Pt => [p[0], p[1]]);
const findRoad = (paths: readonly PathDef[] | undefined, id: string): PathDef | undefined =>
  paths?.find(p => p.id === id && p.kind === 'road');

function disposeObject(o: THREE.Object3D): void {
  const m = o as THREE.Mesh;
  m.geometry?.dispose();
  (m.material as THREE.Material | undefined)?.dispose();
}

interface Drag {
  roadId: string;
  index: number;
  start: Pt[];
  last: Pt;
}

function createSession(ctx: EditorContext, panel: HTMLElement) {
  const group = new THREE.Group();
  let active = false;
  let mode: 'idle' | 'draw' = 'idle';
  let draft: Pt[] = [];
  let cursor: Pt | null = null;
  let selectedRoadId: string | null = null;
  let selectedPoint = -1;
  let drag: Drag | null = null;

  const roads = (): PathDef[] => ctx.zones[ctx.zone].paths?.filter(p => p.kind === 'road') ?? [];
  const roadById = (id: string | null): PathDef | undefined => (id === null ? undefined : findRoad(ctx.zones[ctx.zone].paths, id));

  // ---- overlay

  const lift = (x: number, z: number): THREE.Vector3 => new THREE.Vector3(x, ctx.terrain.heightAt(x, z) + 0.5, z);

  function addLine(points: Pt[], opacity = 1): void {
    if (points.length < 2) return;
    const geom = new THREE.BufferGeometry().setFromPoints(points.map(([x, z]) => lift(x, z)));
    const mat = new THREE.LineBasicMaterial({ color: LINE_COLOUR, depthTest: false, transparent: opacity < 1, opacity });
    const line = new THREE.Line(geom, mat);
    line.renderOrder = RENDER_ORDER;
    group.add(line);
  }

  function addHandle(p: Pt, radius: number, colour: number): void {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(radius, 10, 8),
      new THREE.MeshBasicMaterial({ color: colour, depthTest: false }),
    );
    mesh.position.copy(lift(p[0], p[1]));
    mesh.renderOrder = RENDER_ORDER;
    group.add(mesh);
  }

  function rebuild(): void {
    for (const child of [...group.children]) {
      disposeObject(child);
      group.remove(child);
    }
    if (!active) return;
    if (mode === 'draw') {
      addLine(draft);
      if (draft.length > 0 && cursor) addLine([draft[draft.length - 1], cursor], 0.6);
      for (const p of draft) addHandle(p, DRAFT_R, HANDLE_COLOUR);
      return;
    }
    const road = roadById(selectedRoadId);
    if (!road) return;
    addLine(road.points);
    road.points.forEach((p, i) => addHandle(p, HANDLE_R, i === selectedPoint ? SELECTED_COLOUR : HANDLE_COLOUR));
  }

  // ---- panel

  const el = <K extends keyof HTMLElementTagNameMap>(tag: K, text?: string, cls?: string): HTMLElementTagNameMap[K] => {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (cls) node.className = cls;
    return node;
  };

  const newBtn = el('button', 'New road');
  const roadList = el('div', undefined, 'road-list');
  const selBox = el('div', undefined, 'road-selected');
  const widthLabel = el('label', 'Width (m) ');
  const widthInput = el('input');
  widthInput.type = 'number';
  widthInput.step = '0.5';
  widthInput.min = '1';
  widthLabel.append(widthInput);
  const deleteBtn = el('button', 'Delete road');
  selBox.append(widthLabel, deleteBtn);
  const hint = el(
    'p',
    'New road: click points, Enter or double-click to finish, Esc to cancel. Selected road: drag a point; Shift+click a segment adds a point; click a point then Delete removes it.',
    'hint',
  );
  panel.append(newBtn, roadList, selBox, hint);

  function refreshPanel(): void {
    newBtn.classList.toggle('on', mode === 'draw');
    roadList.replaceChildren();
    for (const r of roads()) {
      const b = el('button', `${r.id} (${r.points.length} points)`);
      b.classList.toggle('on', r.id === selectedRoadId);
      b.addEventListener('click', () => {
        selectRoad(r.id);
        ctx.viewport.focus(r.points[0][0], r.points[0][1]);
      });
      roadList.append(b);
    }
    const road = roadById(selectedRoadId);
    selBox.hidden = !road || mode === 'draw';
    if (road) widthInput.value = String(road.width ?? DEFAULT_WIDTH);
  }

  // ---- selection and modes

  function selectRoad(id: string | null): void {
    selectedRoadId = id;
    selectedPoint = -1;
    mode = 'idle';
    draft = [];
    cursor = null;
    rebuild();
    refreshPanel();
  }

  function cancelDrag(): void {
    if (!drag) return;
    const d = drag;
    drag = null;
    const road = roadById(d.roadId);
    if (!road) return;
    road.points = copyPts(d.start);
    ctx.touch(zoneRect(ctx.zones[ctx.zone]));
  }

  function finishDraft(): void {
    if (draft.length < 2) {
      ctx.status('A road needs at least 2 points');
      return;
    }
    const points = draft.map(([x, z]): Pt => [round1(x), round1(z)]);
    const id = 'road-' + Math.random().toString(36).slice(2, 7);
    ctx.editZone('Add road', ctx.zone, def => {
      (def.paths ??= []).push({ id, kind: 'road', points, width: DEFAULT_WIDTH });
    });
    mode = 'idle';
    draft = [];
    cursor = null;
    selectRoad(id);
  }

  function removeSelectedPoint(): void {
    const road = roadById(selectedRoadId);
    if (!road || selectedPoint < 0 || selectedPoint >= road.points.length) return;
    if (removePoint(road.points, selectedPoint) === null) {
      ctx.status('A road needs at least 2 points');
      return;
    }
    const id = road.id;
    const index = selectedPoint;
    ctx.editZone('Remove road point', ctx.zone, def => {
      const r = findRoad(def.paths, id);
      if (r) r.points = removePoint(r.points, index) ?? r.points;
    });
    selectedPoint = -1;
    rebuild();
    refreshPanel();
  }

  newBtn.addEventListener('click', () => {
    if (mode === 'draw') {
      mode = 'idle';
      draft = [];
      cursor = null;
    } else {
      mode = 'draw';
      selectedRoadId = null;
      selectedPoint = -1;
      draft = [];
      cursor = null;
    }
    rebuild();
    refreshPanel();
  });

  widthInput.addEventListener('change', () => {
    const road = roadById(selectedRoadId);
    if (!road) return;
    const v = Number(widthInput.value);
    if (!Number.isFinite(v)) {
      widthInput.value = String(road.width ?? DEFAULT_WIDTH);
      return;
    }
    const w = Math.max(1, v);
    if (w === (road.width ?? DEFAULT_WIDTH)) return;
    const id = road.id;
    ctx.editZone('Edit road width', ctx.zone, def => {
      const r = findRoad(def.paths, id);
      if (r) r.width = w;
    });
  });

  deleteBtn.addEventListener('click', () => {
    const id = selectedRoadId;
    if (id === null) return;
    ctx.editZone('Delete road', ctx.zone, def => {
      def.paths = (def.paths ?? []).filter(p => !(p.id === id && p.kind === 'road'));
    });
    selectedRoadId = null;
    selectedPoint = -1;
    rebuild();
    refreshPanel();
  });

  // ---- pointer and keyboard

  const dom = (): HTMLCanvasElement => ctx.viewport.dom;

  function onDown(ev: PointerEvent): void {
    if (ev.button !== 0) return;
    const hit = ctx.viewport.pick(ev);
    if (mode === 'draw') {
      if (!hit) return;
      const last = draft[draft.length - 1];
      // A double-click's second press would otherwise add a duplicate of the point just placed.
      if (last && Math.hypot(hit.x - last[0], hit.z - last[1]) < 0.3) return;
      draft = [...draft, [hit.x, hit.z]];
      rebuild();
      return;
    }
    if (!hit) return;

    const road = roadById(selectedRoadId);
    if (road) {
      if (ev.shiftKey) {
        if (nearestPoint(road.points, hit.x, hit.z, POINT_PICK) !== -1) return;
        const seg = nearestOnPolyline(road.points, hit.x, hit.z);
        if (seg.index < 0 || seg.dist > SEGMENT_PICK) return;
        const at = seg.index;
        const x = round1(seg.x);
        const z = round1(seg.z);
        const id = road.id;
        ctx.editZone('Add road point', ctx.zone, def => {
          const r = findRoad(def.paths, id);
          if (r) r.points = insertPoint(r.points, at, x, z);
        });
        selectedPoint = at + 1;
        rebuild();
        return;
      }
      const idx = nearestPoint(road.points, hit.x, hit.z, POINT_PICK);
      if (idx !== -1) {
        selectedPoint = idx;
        const start = copyPts(road.points);
        drag = { roadId: road.id, index: idx, start, last: [start[idx][0], start[idx][1]] };
        rebuild();
        return;
      }
    }

    // A click near another road's segment selects that road.
    let best: { id: string; dist: number } | null = null;
    for (const r of roads()) {
      if (r.id === selectedRoadId) continue;
      const h = nearestOnPolyline(r.points, hit.x, hit.z);
      if (h.index >= 0 && h.dist <= SEGMENT_PICK && (!best || h.dist < best.dist)) best = { id: r.id, dist: h.dist };
    }
    if (best) {
      selectRoad(best.id);
      return;
    }
    if (selectedPoint !== -1) {
      selectedPoint = -1;
      rebuild();
    }
  }

  function onMove(ev: PointerEvent): void {
    if (mode === 'draw') {
      const hit = ctx.viewport.pick(ev);
      cursor = hit ? [hit.x, hit.z] : null;
      rebuild();
      return;
    }
    if (!drag) return;
    const hit = ctx.viewport.pick(ev);
    if (!hit) return;
    const road = roadById(drag.roadId);
    if (!road) return;
    const x = round1(hit.x);
    const z = round1(hit.z);
    drag.last = [x, z];
    road.points[drag.index] = [x, z];
    ctx.touch(zoneRect(ctx.zones[ctx.zone]));
    rebuild();
  }

  function onUp(): void {
    if (!drag) return;
    const d = drag;
    drag = null;
    const road = roadById(d.roadId);
    if (!road) return;
    // The live preview moved the point; put it back so the undo entry records the real before and after.
    road.points = copyPts(d.start);
    const [x, z] = d.last;
    const [sx, sz] = d.start[d.index];
    if (x !== sx || z !== sz) {
      ctx.editZone('Move road point', ctx.zone, def => {
        const r = findRoad(def.paths, d.roadId);
        if (r) r.points[d.index] = [x, z];
      });
    } else {
      ctx.touch(zoneRect(ctx.zones[ctx.zone]));
    }
    rebuild();
  }

  function onDblClick(ev: MouseEvent): void {
    if (mode !== 'draw') return;
    ev.preventDefault();
    finishDraft();
  }

  function onKey(ev: KeyboardEvent): void {
    if (ev.key === 'Escape') {
      cancelDrag();
      mode = 'idle';
      draft = [];
      cursor = null;
      selectedPoint = -1;
      rebuild();
      refreshPanel();
      return;
    }
    // Keys typed into the panel (width, buttons) belong to the panel, not to the road.
    const tag = (ev.target as HTMLElement | null)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || tag === 'BUTTON') return;
    if (ev.key === 'Enter' && mode === 'draw') {
      ev.preventDefault();
      finishDraft();
    } else if ((ev.key === 'Delete' || ev.key === 'Backspace') && selectedRoadId !== null && selectedPoint >= 0) {
      ev.preventDefault();
      removeSelectedPoint();
    }
  }

  const onChanged = (): void => {
    rebuild();
    refreshPanel();
  };
  const onZone = (): void => {
    cancelDrag();
    mode = 'idle';
    draft = [];
    cursor = null;
    selectedRoadId = null;
    selectedPoint = -1;
    rebuild();
    refreshPanel();
  };
  ctx.events.changed.on(onChanged);
  ctx.events.zone.on(onZone);
  refreshPanel();

  const onPointerDown = (ev: PointerEvent): void => onDown(ev);
  const onPointerMove = (ev: PointerEvent): void => onMove(ev);
  const onDoubleClick = (ev: MouseEvent): void => onDblClick(ev);

  return {
    activate(): void {
      if (active) return;
      active = true;
      ctx.viewport.overlay.add(group);
      dom().addEventListener('pointerdown', onPointerDown);
      dom().addEventListener('pointermove', onPointerMove);
      dom().addEventListener('dblclick', onDoubleClick);
      window.addEventListener('pointerup', onUp);
      window.addEventListener('keydown', onKey);
      rebuild();
      refreshPanel();
    },
    deactivate(): void {
      if (!active) return;
      dom().removeEventListener('pointerdown', onPointerDown);
      dom().removeEventListener('pointermove', onPointerMove);
      dom().removeEventListener('dblclick', onDoubleClick);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('keydown', onKey);
      cancelDrag();
      mode = 'idle';
      draft = [];
      cursor = null;
      selectedPoint = -1;
      active = false;
      for (const child of [...group.children]) {
        disposeObject(child);
        group.remove(child);
      }
      ctx.viewport.overlay.remove(group);
      refreshPanel();
    },
  };
}

let session: ReturnType<typeof createSession> | null = null;

export const roadTool: Tool = {
  id: 'road',
  label: 'Road',
  mount(ctx: EditorContext, panel: HTMLElement): void {
    session = createSession(ctx, panel);
  },
  activate(): void {
    session?.activate();
  },
  deactivate(): void {
    session?.deactivate();
  },
};
