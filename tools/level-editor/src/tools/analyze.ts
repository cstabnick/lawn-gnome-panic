// Analyze: where a walker cannot go. Shows blocked and unreached ground, tests a path between two clicks, reports whether the
// zone's spawn reaches everything that matters, and re-bakes the walkability grid after edits. Every overlay it adds to
// ctx.viewport.overlay is removed again on deactivate.
import * as THREE from 'three';
import { WalkGrid, type Rect } from '@lawn/level';
import type { EditorContext, GroundHit, Tool } from '../context';
import { findPath3, type Point3 } from '@gnomomia/pathfind';
import { computeReachability, type ReachReport } from '@gnomomia/reach';
import { bakeWalkTiles, computeBakeHash, walkTileSpecs } from '@gnomomia/bakeWalk';
import { loadWalkGrid } from '@gnomomia/walkBake';
import { saveWalk } from '../persist';
import { zoneRect } from '../state';
import { paintGrid } from './overlayPaint';

// Overlay texels are half a metre: fine enough to see a fence line, cheap enough to repaint while editing.
const TEXEL = 0.5;
// The overlay floats this far above the ground so it does not z-fight with the terrain.
const LIFT = 0.25;
const DEBOUNCE_MS = 250;
const REACH_RANGE = 60;
// A path counts as reached when its last waypoint is this close to B (m).
const REACHED_TOL = 1.5;
const PATH_EXPAND = 60000;
// Pointer travel (px) above which a press is a drag, not a click.
const CLICK_SLOP = 4;
const POLE_HEIGHT = 4;
const MARK_RADIUS = 0.8;
const COLOUR_A = 0x33dd55;
const COLOUR_B = 0xff3333;
const COLOUR_PATH = 0xff8800;
const COLOUR_POLE = 0xff2020;

function h<K extends keyof HTMLElementTagNameMap>(tag: K, text?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (text !== undefined) e.textContent = text;
  return e;
}

function button(text: string, onClick: () => void): HTMLButtonElement {
  const b = h('button', text);
  b.type = 'button';
  b.addEventListener('click', onClick);
  return b;
}

function section(panel: HTMLElement, title: string): HTMLElement {
  const s = h('section');
  s.append(h('h3', title));
  panel.append(s);
  return s;
}

function overlaps(a: Rect, b: Rect): boolean {
  return a.minX < b.maxX && b.minX < a.maxX && a.minZ < b.maxZ && b.minZ < a.maxZ;
}

function nextFrame(): Promise<void> {
  return new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
}

function marker(colour: number, p: GroundHit): THREE.Mesh {
  const m = new THREE.Mesh(
    new THREE.SphereGeometry(MARK_RADIUS, 12, 8),
    new THREE.MeshBasicMaterial({ color: colour, depthTest: false }),
  );
  m.position.set(p.x, p.y + MARK_RADIUS, p.z);
  m.renderOrder = 12;
  return m;
}

function createAnalyzeTool(): Tool {
  let ctx: EditorContext | null = null;
  const cx = (): EditorContext => {
    if (!ctx) throw new Error('Analyze used before mount');
    return ctx;
  };

  let active = false;
  let showBlocked = false;
  let pathMode = false;
  let pointA: GroundHit | null = null;
  let pointB: GroundHit | null = null;
  let pressAt: { x: number; y: number } | null = null;
  let report: ReachReport | null = null;
  let stale = false;
  let busy = false;
  let blockedMesh: THREE.Mesh | null = null;
  let blockedTimer: number | undefined;
  let pathLine: THREE.Line | null = null;
  let markerA: THREE.Mesh | null = null;
  let markerB: THREE.Mesh | null = null;
  let poles: THREE.Group | null = null;

  // Panel elements, set in mount().
  let pathBtn!: HTMLButtonElement;
  let pathText!: HTMLElement;
  let gatesText!: HTMLElement;
  let reachInfo!: HTMLElement;
  let reachStatus!: HTMLElement;
  let reachList!: HTMLElement;
  let bakeText!: HTMLElement;
  let bakeBtn!: HTMLButtonElement;

  // Removes an overlay object and frees its GPU resources.
  function drop(o: THREE.Object3D | null): void {
    if (!o) return;
    cx().viewport.overlay.remove(o);
    o.traverse((n) => {
      if (!(n instanceof THREE.Mesh) && !(n instanceof THREE.Line)) return;
      n.geometry.dispose();
      for (const m of Array.isArray(n.material) ? n.material : [n.material]) {
        if (m instanceof THREE.MeshBasicMaterial) m.map?.dispose();
        m.dispose();
      }
    });
  }

  function buildBlocked(reached: ReachReport | null): THREE.Mesh {
    const c = cx();
    const rect = zoneRect(c.zones[c.zone]);
    const w = rect.maxX - rect.minX;
    const d = rect.maxZ - rect.minZ;
    const img = paintGrid(rect, TEXEL, (x, z) => {
      if (c.terrain.isBlocked(x, z)) return [230, 40, 40, 140];
      if (reached && !reached.reached(x, z)) return [255, 170, 0, 110];
      return [0, 0, 0, 0];
    });
    // Two metres between vertices is enough for a lift of a quarter metre over gentle slopes.
    const geo = new THREE.PlaneGeometry(w, d, Math.max(1, Math.round(w / 2)), Math.max(1, Math.round(d / 2)));
    const pos = geo.attributes.position;
    const uv = geo.attributes.uv;
    for (let k = 0; k < pos.count; k++) {
      // uv v = 0 is minZ, so texture row 0 (the first row of paintGrid) lands on the minZ edge.
      const x = rect.minX + uv.getX(k) * w;
      const z = rect.minZ + uv.getY(k) * d;
      pos.setXYZ(k, x, c.terrain.heightAt(x, z) + LIFT, z);
    }
    pos.needsUpdate = true;
    geo.computeBoundingSphere();
    const tex = new THREE.DataTexture(img.data, img.width, img.height);
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    tex.needsUpdate = true;
    const mat = new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      side: THREE.DoubleSide,
    });
    return new THREE.Mesh(geo, mat);
  }

  function rebuildBlocked(): void {
    drop(blockedMesh);
    blockedMesh = null;
    if (!active || !showBlocked) return;
    const c = cx();
    // A report for another zone says nothing about this one.
    blockedMesh = buildBlocked(report && report.zone === c.zone ? report : null);
    c.viewport.overlay.add(blockedMesh);
  }

  function scheduleBlocked(): void {
    if (!active || !showBlocked) return;
    window.clearTimeout(blockedTimer);
    blockedTimer = window.setTimeout(rebuildBlocked, DEBOUNCE_MS);
  }

  function rebuildPoles(): void {
    drop(poles);
    poles = null;
    if (!active || !report) return;
    const c = cx();
    const group = new THREE.Group();
    for (const r of report.results) {
      if (r.reachable) continue;
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.15, 0.15, POLE_HEIGHT, 6),
        new THREE.MeshBasicMaterial({ color: COLOUR_POLE, depthTest: false }),
      );
      pole.position.set(r.x, c.terrain.heightAt(r.x, r.z) + POLE_HEIGHT / 2, r.z);
      pole.renderOrder = 12;
      group.add(pole);
    }
    poles = group;
    c.viewport.overlay.add(group);
  }

  function clearPath(): void {
    drop(pathLine);
    pathLine = null;
    drop(markerA);
    markerA = null;
    drop(markerB);
    markerB = null;
    pointA = null;
    pointB = null;
  }

  function computePath(a: GroundHit, b: GroundHit): void {
    const c = cx();
    drop(pathLine);
    pathLine = null;
    const wps = findPath3(
      { x: a.x, y: a.y, z: a.z },
      { x: b.x, y: b.y, z: b.z },
      (x, z, fromY) => c.terrain.standY(x, z, fromY),
      PATH_EXPAND,
    );
    if (wps.length === 0) {
      pathText.textContent = 'no path';
      return;
    }
    const pts: Point3[] = [a, ...wps];
    let len = 0;
    for (let i = 1; i < pts.length; i++) {
      len += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y, pts[i].z - pts[i - 1].z);
    }
    const last = wps[wps.length - 1];
    const gap = Math.hypot(last.x - b.x, last.z - b.z);
    const end = gap <= REACHED_TOL ? 'reached' : `stopped short by ${gap.toFixed(1)} m`;
    pathText.textContent = `${wps.length} waypoint(s), ${len.toFixed(1)} m, ${end}`;
    const geo = new THREE.BufferGeometry().setFromPoints(pts.map((p) => new THREE.Vector3(p.x, p.y + 0.5, p.z)));
    pathLine = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: COLOUR_PATH, depthTest: false }));
    pathLine.renderOrder = 12;
    c.viewport.overlay.add(pathLine);
  }

  function onPointerDown(ev: PointerEvent): void {
    pressAt = ev.button === 0 ? { x: ev.clientX, y: ev.clientY } : null;
  }

  function onPointerUp(ev: PointerEvent): void {
    const press = pressAt;
    pressAt = null;
    if (!press || !active || !pathMode) return;
    if (Math.hypot(ev.clientX - press.x, ev.clientY - press.y) > CLICK_SLOP) return;
    const c = cx();
    const hit = c.viewport.pick(ev);
    if (!hit) return;
    const a = pointA;
    if (!a || pointB) {
      clearPath();
      pointA = hit;
      markerA = marker(COLOUR_A, hit);
      c.viewport.overlay.add(markerA);
      pathText.textContent = 'Now click B.';
      return;
    }
    pointB = hit;
    markerB = marker(COLOUR_B, hit);
    c.viewport.overlay.add(markerB);
    computePath(a, hit);
  }

  function refreshText(): void {
    const c = cx();
    const n = c.dirty.walkRects.length;
    bakeText.textContent = n ? `${n} edited area(s) need a re-bake` : 'Up to date';
    gatesText.textContent = c.gatesOpen
      ? 'Gates open: reachability ignores quest gates'
      : 'Gates closed: as in a new game';
  }

  function renderReach(): void {
    const c = cx();
    reachList.replaceChildren();
    reachList.style.opacity = stale ? '0.5' : '';
    reachStatus.textContent = stale ? 'out of date: run again' : '';
    if (!report) {
      reachInfo.textContent = 'Not run yet.';
      return;
    }
    reachInfo.textContent = `cells visited: ${report.cells}`;
    // Unreachable rows first: they are what the user came to find.
    const rows = [...report.results].sort((a, b) => Number(a.reachable) - Number(b.reachable));
    for (const r of rows) {
      const row = button(`${r.reachable ? '✓' : '✗'} ${r.label}`, () => c.viewport.focus(r.x, r.z, REACH_RANGE));
      reachList.append(row);
    }
  }

  function markStale(): void {
    if (report && !stale) {
      stale = true;
      renderReach();
    }
  }

  function runReach(): void {
    const c = cx();
    report = computeReachability(c.terrain, c.zones[c.zone]);
    stale = false;
    renderReach();
    rebuildPoles();
    rebuildBlocked();
  }

  async function rebake(): Promise<void> {
    if (busy) return;
    const c = cx();
    busy = true;
    bakeBtn.disabled = true;
    c.status('Baking...');
    try {
      // Let the status line paint before the bake blocks the page.
      await nextFrame();
      // Rects added while the bake runs stay queued: only the ones read here are cleared afterwards.
      const dirtyRects = [...c.dirty.walkRects];
      const base = loadWalkGrid() ?? new WalkGrid();
      const specs = walkTileSpecs(c.zones);
      // An unedited tile's shipped bake is still valid, so only tiles that touch an edit are re-baked.
      const todo = base.tileIds.length === 0
        ? specs
        : specs.filter((s) => dirtyRects.some((r) => overlaps(s.rect, r)));
      if (todo.length === 0) {
        c.dirty.walkRects.splice(0, dirtyRects.length);
        c.status('Walkability is up to date: nothing to bake.');
        return;
      }
      const t0 = performance.now();
      const grid = bakeWalkTiles(c.terrain, todo, base);
      grid.inputHash = computeBakeHash(c.terrain, c.zones);
      const res = await saveWalk(grid.toJSON());
      c.dirty.walkRects.splice(0, dirtyRects.length);
      const secs = ((performance.now() - t0) / 1000).toFixed(1);
      c.status(`Baked ${todo.length} tile(s) in ${secs} s, saved ${res.files.join(', ')}`);
    } catch (e) {
      c.status(`Bake failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      busy = false;
      bakeBtn.disabled = false;
      refreshText();
    }
  }

  return {
    id: 'analyze',
    label: 'Analyze',

    mount(c, panel) {
      ctx = c;
      panel.textContent = '';

      const walkSec = section(panel, 'Walkability');
      const blockedBox = h('input');
      blockedBox.type = 'checkbox';
      const blockedLabel = h('label');
      blockedLabel.append(blockedBox, ' Show blocked ground');
      walkSec.append(blockedLabel);
      blockedBox.addEventListener('change', () => {
        showBlocked = blockedBox.checked;
        rebuildBlocked();
      });

      const pathSec = section(panel, 'Path test');
      pathBtn = button('Test path', () => {
        pathMode = !pathMode;
        pathBtn.classList.toggle('on', pathMode);
        pathText.textContent = pathMode ? 'Click A, then B.' : '';
      });
      pathText = h('div');
      pathSec.append(pathBtn, pathText);

      const reachSec = section(panel, 'Reachability');
      gatesText = h('div');
      reachInfo = h('div');
      reachStatus = h('div');
      reachList = h('div');
      reachSec.append(button('Run reachability', runReach), gatesText, reachInfo, reachStatus, reachList);

      const bakeSec = section(panel, 'Walk bake');
      bakeText = h('div');
      bakeBtn = button('Re-bake walkability and save', () => void rebake());
      bakeSec.append(bakeText, bakeBtn);

      c.events.changed.on(() => {
        markStale();
        refreshText();
        scheduleBlocked();
      });
      c.events.zone.on(() => {
        clearPath();
        pathText.textContent = pathMode ? 'Click A, then B.' : '';
        markStale();
        refreshText();
        scheduleBlocked();
      });

      refreshText();
      renderReach();
    },

    activate() {
      if (!ctx) return;
      active = true;
      ctx.viewport.dom.addEventListener('pointerdown', onPointerDown);
      ctx.viewport.dom.addEventListener('pointerup', onPointerUp);
      rebuildBlocked();
      rebuildPoles();
    },

    deactivate() {
      if (!ctx) return;
      active = false;
      pathMode = false;
      pathBtn?.classList.remove('on');
      ctx.viewport.dom.removeEventListener('pointerdown', onPointerDown);
      ctx.viewport.dom.removeEventListener('pointerup', onPointerUp);
      window.clearTimeout(blockedTimer);
      pressAt = null;
      drop(blockedMesh);
      blockedMesh = null;
      drop(poles);
      poles = null;
      clearPath();
    },
  };
}

export const analyzeTool: Tool = createAnalyzeTool();
