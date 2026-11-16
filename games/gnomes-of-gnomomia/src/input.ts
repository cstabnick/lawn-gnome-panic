// Mouse and touch input: picking, hover text, left-click actions, right-click and long-press menus, click marker and hotkeys.
import * as THREE from 'three';
import { UI, type Entity } from './config';
import { ENEMIES, NPCS, OBJECTS } from './content';
import { allEntities, entityFromObject } from './entities';
import { getGroundMesh } from './world';
import { player, walkTo, interact, useWorldObject } from './player';
import { useHotbar } from './abilities';
import { objectFromMesh } from './objects';
import { setHoverText, showContextMenu, hideContextMenu, type MenuOption } from './ui/hud';
import { isDialogueOpen, closeDialogue } from './ui/dialogue';
import { closeShop } from './ui/shop';
import { say } from './events';

/** A press and release this close together counts as a click. */
const CLICK_PX = 8;
/** A touch held this long opens the menu, if it has not moved more than LONG_PRESS_PX. */
const LONG_PRESS_MS = 500;
const LONG_PRESS_PX = 10;
const MARKER_SECONDS = 0.5;

/** What is under the pointer. */
interface Pick {
  entity?: Entity;
  entityPoint?: THREE.Vector3;
  /** World object id (see objectFromMesh) under the pointer, when no entity is. */
  object?: string;
  objectPoint?: THREE.Vector3;
  /** First ground hit: a walk target. */
  ground?: THREE.Vector3;
}

interface Action {
  label: string;
  run: () => void;
}

let canvas: HTMLCanvasElement | null = null;
let cam: THREE.PerspectiveCamera | null = null;
let sceneRef: THREE.Scene | null = null;
const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();

/** Last pointer position over the canvas (null when it has left). */
let pointer: { x: number; y: number } | null = null;
/** Left button pressed on the canvas and not yet released. */
let down: { x: number; y: number; touch: boolean } | null = null;
let longPressTimer: number | undefined;
let longPressFired = false;
/** Fingers down on the canvas. Once a second one lands (a pinch), nothing is a tap until all have lifted. */
const touches = new Set<number>();
let multiTouch = false;

let markerGroup: THREE.Group | null = null;
const markerMats: THREE.MeshBasicMaterial[] = [];
let markerAge = Infinity;

const isUnder = (obj: THREE.Object3D, root: THREE.Object3D): boolean => {
  for (let o: THREE.Object3D | null = obj; o; o = o.parent) if (o === root) return true;
  return false;
};

/** True while the player types in a text field; hotkeys are left alone then. */
function typing(): boolean {
  const el = document.activeElement;
  return el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement;
}

/** Raycast from the camera through a client-pixel position. */
function pickAt(clientX: number, clientY: number): Pick {
  const out: Pick = {};
  if (!canvas || !cam) return out;
  const rect = canvas.getBoundingClientRect();
  ndc.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
  raycaster.setFromCamera(ndc, cam);

  const ground = getGroundMesh();
  const targets: THREE.Object3D[] = [ground];
  const entityRoots = new Set<THREE.Object3D>();
  for (const e of allEntities()) {
    entityRoots.add(e.object);
    if (!e.dead && e.object.visible) targets.push(e.object);
  }
  // Other scene roots (world objects live here) are targets too; ground, entities and the click marker are already handled.
  if (sceneRef) {
    for (const o of sceneRef.children) {
      if (o.visible && o !== ground && o !== markerGroup && !entityRoots.has(o)) targets.push(o);
    }
  }
  const hits = raycaster.intersectObjects(targets, true);

  // The first hit that belongs to an entity wins.
  for (const h of hits) {
    const ent = entityFromObject(h.object);
    if (ent && !ent.dead) {
      out.entity = ent;
      out.entityPoint = h.point.clone();
      break;
    }
  }
  // Without an entity, the first hit that belongs to a world object.
  if (!out.entity) {
    for (const h of hits) {
      const id = objectFromMesh(h.object);
      if (id) {
        out.object = id;
        out.objectPoint = h.point.clone();
        break;
      }
    }
  }
  // Otherwise the first ground hit is a walk point.
  for (const h of hits) {
    if (isUnder(h.object, ground)) {
      out.ground = h.point.clone();
      break;
    }
  }
  return out;
}

/** The default (left-click) action for an entity. */
function defaultAction(e: Entity): Action {
  if (e.kind === 'enemy') return { label: `Attack ${e.name} (level ${e.level})`, run: () => interact('attack', e.id) };
  if (e.kind === 'npc') return { label: `Talk-to ${e.name}`, run: () => interact('talk', e.id) };
  return { label: 'Take Loot', run: () => interact('take', e.id) };
}

function examineText(e: Entity): string {
  if (e.kind === 'npc') return NPCS[e.defId]?.examine ?? '';
  if (e.kind === 'enemy') return ENEMIES[e.defId]?.examine ?? '';
  return 'A small sack of loot.';
}

/** Show the X click marker at a point. Yellow for a walk, red for an entity. */
function showMarker(p: THREE.Vector3, color: number): void {
  if (!markerGroup) return;
  markerGroup.position.set(p.x, p.y + 0.05, p.z);
  markerGroup.scale.setScalar(1);
  markerGroup.visible = true;
  for (const m of markerMats) m.color.setHex(color);
  markerAge = 0;
}

function leftClick(x: number, y: number): void {
  if (player.dead) return;
  hideContextMenu();
  const hit = pickAt(x, y);
  // Clicking anywhere but an NPC closes an open dialogue.
  if (isDialogueOpen() && hit.entity?.kind !== 'npc') closeDialogue();

  if (hit.entity && hit.entityPoint) {
    defaultAction(hit.entity).run();
    showMarker(hit.entityPoint, 0xff3030);
  } else if (hit.object && hit.objectPoint) {
    useWorldObject(hit.object);
    showMarker(hit.objectPoint, 0xffe14f);
  } else if (hit.ground) {
    walkTo(hit.ground.x, hit.ground.z);
    showMarker(hit.ground, 0xffe14f);
  }
}

/** Right-click menu, also used for a long press. */
function openMenu(x: number, y: number): void {
  const hit = pickAt(x, y);
  const opts: MenuOption[] = [];
  const ground = hit.ground;
  if (hit.entity) {
    const e = hit.entity;
    const act = defaultAction(e);
    opts.push({ label: act.label, onSelect: act.run });
    opts.push({ label: `Examine ${e.name}`, onSelect: () => say(examineText(e), UI.textWhite) });
    if (ground) opts.push({ label: 'Walk here', onSelect: () => walkTo(ground.x, ground.z) });
  } else if (hit.object && OBJECTS[hit.object]) {
    const id = hit.object;
    const def = OBJECTS[id];
    opts.push({ label: def.verb, onSelect: () => useWorldObject(id) });
    opts.push({ label: `Examine ${def.name}`, onSelect: () => say(def.examine, UI.textWhite) });
    if (ground) opts.push({ label: 'Walk here', onSelect: () => walkTo(ground.x, ground.z) });
    opts.push({ label: 'Cancel', onSelect: () => {} });
  } else {
    if (ground) opts.push({ label: 'Walk here', onSelect: () => walkTo(ground.x, ground.z) });
    opts.push({ label: 'Cancel', onSelect: () => {} });
  }
  showContextMenu(x, y, opts);
}

function clearLongPress(): void {
  if (longPressTimer !== undefined) clearTimeout(longPressTimer);
  longPressTimer = undefined;
}

export function initInput(c: HTMLCanvasElement, camera: THREE.PerspectiveCamera, scene: THREE.Scene): void {
  canvas = c;
  cam = camera;
  sceneRef = scene;

  // Click marker: an X of two flat bars, hidden until a click.
  markerGroup = new THREE.Group();
  const barGeo = new THREE.BoxGeometry(0.6, 0.02, 0.1);
  for (const angle of [Math.PI / 4, -Math.PI / 4]) {
    const mat = new THREE.MeshBasicMaterial({ color: 0xffe14f });
    markerMats.push(mat);
    const bar = new THREE.Mesh(barGeo, mat);
    bar.rotation.y = angle;
    markerGroup.add(bar);
  }
  markerGroup.visible = false;
  scene.add(markerGroup);

  c.addEventListener('pointermove', (e) => {
    pointer = { x: e.clientX, y: e.clientY };
    // A touch that drifts too far cancels its long press.
    if (down?.touch && longPressTimer !== undefined && Math.hypot(e.clientX - down.x, e.clientY - down.y) > LONG_PRESS_PX) {
      clearLongPress();
    }
  });
  c.addEventListener('pointerleave', () => {
    pointer = null;
  });

  c.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    if (e.pointerType === 'touch') {
      touches.add(e.pointerId);
      if (touches.size > 1) {
        multiTouch = true;
        down = null;
        clearLongPress();
        return;
      }
    }
    if (multiTouch) return;
    down = { x: e.clientX, y: e.clientY, touch: e.pointerType === 'touch' };
    longPressFired = false;
    if (down.touch) {
      clearLongPress();
      const sx = e.clientX;
      const sy = e.clientY;
      longPressTimer = window.setTimeout(() => {
        longPressTimer = undefined;
        longPressFired = true;
        openMenu(sx, sy);
      }, LONG_PRESS_MS);
    }
  });
  const lift = (e: PointerEvent): void => {
    touches.delete(e.pointerId);
    if (touches.size === 0) multiTouch = false;
  };
  window.addEventListener('pointerup', lift);
  window.addEventListener('pointercancel', lift);
  c.addEventListener('pointerup', (e) => {
    if (e.button !== 0 || !down) return;
    const d = down;
    down = null;
    clearLongPress();
    // A long press already opened the menu; its release does nothing else.
    if (longPressFired) {
      longPressFired = false;
      return;
    }
    if (Math.hypot(e.clientX - d.x, e.clientY - d.y) <= CLICK_PX) leftClick(e.clientX, e.clientY);
  });
  c.addEventListener('pointercancel', () => {
    down = null;
    clearLongPress();
    longPressFired = false;
  });

  c.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    openMenu(e.clientX, e.clientY);
  });

  // Hotkeys.
  window.addEventListener('keydown', (e) => {
    if (typing()) return;
    if (/^[1-8]$/.test(e.key)) {
      if (!isDialogueOpen()) useHotbar(Number(e.key) - 1);
    } else if (e.key === 'Escape') {
      hideContextMenu();
      closeDialogue();
      closeShop();
    }
  });
}

export function updateInput(dt: number): void {
  if (!canvas) return;

  // Hover text and cursor for whatever is under the pointer.
  let cursor = 'default';
  let hover: string | null = null;
  if (pointer) {
    const hit = pickAt(pointer.x, pointer.y);
    if (hit.entity) {
      hover = defaultAction(hit.entity).label;
      cursor = 'pointer';
    } else if (hit.object) {
      hover = OBJECTS[hit.object]?.name ?? hit.object;
      cursor = 'pointer';
    } else if (hit.ground) {
      hover = 'Walk here';
    }
  }
  setHoverText(hover);
  canvas.style.cursor = cursor;

  // Click marker shrinks and disappears over MARKER_SECONDS.
  if (markerGroup && markerGroup.visible) {
    markerAge += dt;
    if (markerAge >= MARKER_SECONDS) markerGroup.visible = false;
    else markerGroup.scale.setScalar(1 - markerAge / MARKER_SECONDS);
  }
}
