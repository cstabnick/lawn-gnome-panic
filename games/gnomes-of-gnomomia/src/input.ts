// Mouse and touch input: picking, hover text, left-click actions, right-click and long-press menus, click marker and hotkeys.
import * as THREE from 'three';
import { UI, type Entity } from './config';
import { ENEMIES, ITEMS, NPCS, OBJECTS } from './content';
import { CLASSES } from './data/classes';
import { allEntities, entityFromObject } from './entities';
import { getWalkMeshes } from './world';
import { player, sitAt, walkTo, interact, useWorldObject } from './player';
import { useHotbar } from './abilities';
import { objectFromMesh } from './objects';
import { getInteractablePrefabs } from './dressing';
import { setHoverText, showContextMenu, hideContextMenu, type MenuOption } from './ui/hud';
import { isDialogueOpen, closeDialogue } from './ui/dialogue';
import { closeShop } from './ui/shop';
import { remotePlayerFromObject, type RemotePlayer } from './net/mmo';
import { cancelTrade, isTradeOpen, requestTrade } from './net/trade';
import { invitePlayer, isPartyPeer } from './party/party';
import { say } from './events';
import { getPrefabRestTarget, getPrefabSitTarget, type PrefabHit } from '@lawn/prefabs';
import { examinablePrefabFromMesh, prefabExamine } from './itemArt';

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
  /** Another online player under the pointer, when no entity is. */
  remotePlayer?: RemotePlayer;
  remotePlayerPoint?: THREE.Vector3;
  /** World object id (see objectFromMesh) under the pointer, when no entity is. */
  object?: string;
  objectPoint?: THREE.Vector3;
  /** First ground hit: a walk target. */
  ground?: THREE.Vector3;
  /** Furniture or a prop (an @lawn/prefabs model) under the pointer, when no entity or object is. */
  prefab?: PrefabHit;
  prefabPoint?: THREE.Vector3;
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
let pointerMoved = false;
let hoverTimer = 0;
const HOVER_INTERVAL_S = 0.1;
/** Touch pointer pressed on the canvas and not yet released. */
let down: { x: number; y: number; touch: boolean } | null = null;
/** Right mouse button pressed on the canvas; a short click opens the context menu, a drag orbits the camera. */
let rightDown: { x: number; y: number; pointerId: number } | null = null;
let longPressTimer: number | undefined;
let longPressFired = false;
/** Fingers down on the canvas. Once a second one lands (a pinch), nothing is a tap until all have lifted. */
const touches = new Set<number>();
let multiTouch = false;

let markerGroup: THREE.Group | null = null;
const markerMats: THREE.MeshBasicMaterial[] = [];
let markerAge = Infinity;
const pickTargets: THREE.Object3D[] = [];
const entityRootSet = new Set<THREE.Object3D>();
const walkMeshSet = new Set<THREE.Object3D>();

const isUnderAny = (obj: THREE.Object3D, roots: ReadonlySet<THREE.Object3D>): boolean => {
  for (let o: THREE.Object3D | null = obj; o; o = o.parent) if (roots.has(o)) return true;
  return false;
};

/** True while the player types in a text field; hotkeys are left alone then. */
function typing(): boolean {
  const el = document.activeElement;
  return el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement;
}

/** Raycast from the camera through a client-pixel position. */
function pickAt(clientX: number, clientY: number, maxDist = 260): Pick {
  const out: Pick = {};
  if (!canvas || !cam) return out;
  const rect = canvas.getBoundingClientRect();
  ndc.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
  raycaster.setFromCamera(ndc, cam);
  raycaster.far = maxDist;

  const walk = getWalkMeshes();
  pickTargets.length = 0;
  entityRootSet.clear();
  walkMeshSet.clear();
  for (let i = 0; i < walk.length; i++) {
    const w = walk[i];
    pickTargets.push(w);
    walkMeshSet.add(w);
  }
  const entities = allEntities();
  for (let i = 0; i < entities.length; i++) {
    const e = entities[i];
    entityRootSet.add(e.object);
    if (!e.dead && e.object.visible) pickTargets.push(e.object);
  }
  // Other scene roots (world objects, other players) are targets too; the world itself (named 'world': thousands of
  // meshes) is not, only its walkable meshes above. Entities and the click marker are already handled.
  if (sceneRef) {
    const children = sceneRef.children;
    for (let i = 0; i < children.length; i++) {
      const o = children[i];
      if (o.visible && o.name !== 'world' && o !== markerGroup && !entityRootSet.has(o)) pickTargets.push(o);
    }
  }
  const prefabs = getInteractablePrefabs();
  for (let i = 0; i < prefabs.length; i++) {
    if (prefabs[i].visible) pickTargets.push(prefabs[i]);
  }
  const hits = raycaster.intersectObjects(pickTargets, true);

  // The first hit that belongs to an entity wins.
  for (const h of hits) {
    const ent = entityFromObject(h.object);
    if (ent && !ent.dead) {
      out.entity = ent;
      out.entityPoint = h.point.clone();
      break;
    }
  }
  // Without an entity, check for another online player.
  if (!out.entity) {
    for (const h of hits) {
      const rp = remotePlayerFromObject(h.object);
      if (rp) {
        out.remotePlayer = rp;
        out.remotePlayerPoint = h.point.clone();
        break;
      }
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
  // Without either, the first hit on a piece of furniture or a prop (examinable / interactable).
  if (!out.entity && !out.object) {
    for (const h of hits) {
      const prefab = examinablePrefabFromMesh(h.object);
      if (prefab) {
        out.prefab = prefab;
        out.prefabPoint = h.point.clone();
        break;
      }
    }
  }
  // Otherwise the first ground hit is a walk point.
  for (const h of hits) {
    if (isUnderAny(h.object, walkMeshSet)) {
      out.ground = h.point.clone();
      break;
    }
  }
  return out;
}

/** Default (left-click) action for an interactable prefab (seat or fire), or null if examine-only. */
function prefabAction(hit: PrefabHit): Action | null {
  if (hit.def.seat && hit.def.uses.includes('sit')) {
    return {
      label: `Sit on ${hit.def.name}`,
      run: () => {
        const t = getPrefabSitTarget(hit.root, hit.def);
        if (t) sitAt({ kind: 'seat', x: t.position.x, y: t.position.y, z: t.position.z, facing: t.facing, label: hit.def.name });
      },
    };
  }
  if (hit.def.rest) {
    return {
      label: `Rest by ${hit.def.name}`,
      run: () => {
        const t = getPrefabRestTarget(hit.root, hit.def, player.position);
        if (t) sitAt({ kind: 'rest', x: t.position.x, y: t.position.y, z: t.position.z, facing: t.facing, label: hit.def.name });
      },
    };
  }
  return null;
}

function lootLabel(e: Entity): string {
  if (e.loot.length === 1 && e.gold === 0) {
    const slot = e.loot[0];
    const name = ITEMS[slot.item]?.name ?? slot.item;
    return slot.count > 1 ? `Take ${slot.count} × ${name}` : `Take ${name}`;
  }
  if (e.loot.length === 0 && e.gold > 0) return `Take ${e.gold} gold`;
  return 'Take Loot';
}

function examineRemotePlayer(r: RemotePlayer): string {
  if (!r.card) return `${r.name}, a fellow gnome of Gnomomia.`;
  const cls = r.card.classId ? CLASSES[r.card.classId].name : 'Gnome';
  return `${r.name} — Level ${r.card.level} ${cls}.`;
}

/** The default (left-click) action for an entity. */
function defaultAction(e: Entity): Action {
  if (e.kind === 'enemy') return { label: `Attack ${e.name} (level ${e.level})`, run: () => interact('attack', e.id) };
  if (e.kind === 'npc') return { label: `Talk-to ${e.name}`, run: () => interact('talk', e.id) };
  return { label: lootLabel(e), run: () => interact('take', e.id) };
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
  } else if (hit.prefab && prefabAction(hit.prefab)) {
    prefabAction(hit.prefab)!.run();
    if (hit.prefabPoint) showMarker(hit.prefabPoint, 0xffe14f);
  } else if (hit.ground) {
    walkTo(hit.ground.x, hit.ground.z, hit.ground.y);
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
    if (ground) opts.push({ label: 'Walk here', onSelect: () => walkTo(ground.x, ground.z, ground.y) });
  } else if (hit.remotePlayer) {
    const rp = hit.remotePlayer;
    opts.push({ label: `Trade with ${rp.name}`, onSelect: () => requestTrade(rp.id) });
    if (!isPartyPeer(rp.id)) opts.push({ label: `Invite ${rp.name} to party`, onSelect: () => invitePlayer(rp.id) });
    opts.push({ label: `Examine ${rp.name}`, onSelect: () => say(examineRemotePlayer(rp), UI.textWhite) });
    if (ground) opts.push({ label: 'Walk here', onSelect: () => walkTo(ground.x, ground.z, ground.y) });
    opts.push({ label: 'Cancel', onSelect: () => {} });
  } else if (hit.object && OBJECTS[hit.object]) {
    const id = hit.object;
    const def = OBJECTS[id];
    opts.push({ label: def.verb, onSelect: () => useWorldObject(id) });
    opts.push({ label: `Examine ${def.name}`, onSelect: () => say(def.examine, UI.textWhite) });
    if (ground) opts.push({ label: 'Walk here', onSelect: () => walkTo(ground.x, ground.z, ground.y) });
    opts.push({ label: 'Cancel', onSelect: () => {} });
  } else {
    const furniture = hit.prefab;
    if (furniture) {
      const act = prefabAction(furniture);
      if (act) opts.push({ label: act.label, onSelect: act.run });
      opts.push({ label: `Examine ${furniture.def.name}`, onSelect: () => say(prefabExamine(furniture.def), UI.textWhite) });
    }
    if (ground) opts.push({ label: 'Walk here', onSelect: () => walkTo(ground.x, ground.z, ground.y) });
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
    pointerMoved = true;
    // A touch that drifts too far cancels its long press.
    if (down?.touch && longPressTimer !== undefined && Math.hypot(e.clientX - down.x, e.clientY - down.y) > LONG_PRESS_PX) {
      clearLongPress();
    }
  });
  c.addEventListener('pointerleave', () => {
    pointer = null;
    pointerMoved = false;
    hoverTimer = 0;
  });

  c.addEventListener('pointerdown', (e) => {
    if (e.button === 2 && e.pointerType !== 'touch') {
      rightDown = { x: e.clientX, y: e.clientY, pointerId: e.pointerId };
      return;
    }
    if (e.button !== 0) return;
    if (e.pointerType !== 'touch') {
      // Mouse left-click acts immediately on press and never orbits the camera.
      leftClick(e.clientX, e.clientY);
      return;
    }
    touches.add(e.pointerId);
    if (touches.size > 1) {
      multiTouch = true;
      down = null;
      clearLongPress();
      return;
    }
    if (multiTouch) return;
    down = { x: e.clientX, y: e.clientY, touch: true };
    longPressFired = false;
    clearLongPress();
    const sx = e.clientX;
    const sy = e.clientY;
    longPressTimer = window.setTimeout(() => {
      longPressTimer = undefined;
      longPressFired = true;
      openMenu(sx, sy);
    }, LONG_PRESS_MS);
  });
  const lift = (e: PointerEvent): void => {
    touches.delete(e.pointerId);
    if (touches.size === 0) multiTouch = false;
    if (rightDown && e.pointerId === rightDown.pointerId && e.type === 'pointercancel') rightDown = null;
  };
  window.addEventListener('pointerup', lift);
  window.addEventListener('pointercancel', lift);
  c.addEventListener('pointerup', (e) => {
    if (e.button === 2 && rightDown && e.pointerId === rightDown.pointerId) {
      const rd = rightDown;
      rightDown = null;
      if (Math.hypot(e.clientX - rd.x, e.clientY - rd.y) <= CLICK_PX) openMenu(e.clientX, e.clientY);
      return;
    }
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
  c.addEventListener('pointercancel', (e) => {
    if (rightDown && e.pointerId === rightDown.pointerId) rightDown = null;
    down = null;
    clearLongPress();
    longPressFired = false;
  });

  c.addEventListener('contextmenu', (e) => {
    e.preventDefault();
  });

  // Suppress the browser context menu everywhere outside text fields (e.g. non-interactive HUD panels).
  window.addEventListener('contextmenu', (e) => {
    const t = e.target;
    if (t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement || (t instanceof HTMLElement && t.isContentEditable)) return;
    e.preventDefault();
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
      if (isTradeOpen()) cancelTrade();
    }
  });
}

export function updateInput(dt: number): void {
  if (!canvas) return;

  // Hover text and cursor for whatever is under the pointer (immediate on move, 10 Hz while stationary).
  if (!pointer) {
    setHoverText(null);
    canvas.style.cursor = 'default';
  } else {
    hoverTimer -= dt;
    if (pointerMoved || hoverTimer <= 0) {
      pointerMoved = false;
      hoverTimer = HOVER_INTERVAL_S;
      let cursor = 'default';
      let hover: string | null = null;
      const hit = pickAt(pointer.x, pointer.y, 160);
      if (hit.entity) {
        hover = defaultAction(hit.entity).label;
        cursor = 'pointer';
      } else if (hit.object) {
        hover = OBJECTS[hit.object]?.name ?? hit.object;
        cursor = 'pointer';
      } else if (hit.prefab && prefabAction(hit.prefab)) {
        hover = prefabAction(hit.prefab)!.label;
        cursor = 'pointer';
      } else if (hit.ground) {
        hover = 'Walk here';
      }
      setHoverText(hover);
      canvas.style.cursor = cursor;
    }
  }

  // Click marker shrinks and disappears over MARKER_SECONDS.
  if (markerGroup && markerGroup.visible) {
    markerAge += dt;
    if (markerAge >= MARKER_SECONDS) markerGroup.visible = false;
    else markerGroup.scale.setScalar(1 - markerAge / MARKER_SECONDS);
  }
}
