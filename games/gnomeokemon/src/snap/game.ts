import * as THREE from 'three';
import { setMusicScene } from '../music';
import { loadSettings } from '../settings';
import { getGnomeokemon } from '../prefabs/registry';
import { animateGiantDog, createGiantDog } from './models';
import { evaluateShot } from './scoring';
import { flashSmear, mountSmear } from './smear';
import {
  NOTICE_RADIUS,
  type Temperament,
  baitResult,
  fluteResult,
  pesterResult,
  tagResult,
  temperamentOf,
} from './temperament';
import { type Mind, type MindState, type Personality, initialMind, personalityOf, stepMind } from './character';
import { type Zone, layoutFor } from './layout';
import { buildSightBlockers } from './occluders';
import { railSections } from './rail';
import type { CourseId, CreatureAction, CreatureSnapshot, PhotoRecord } from './types';
import {
  COURSE_META,
  type CreatureBehavior,
  animateLawnCreature,
  buildCourseEnvironment,
  courseGround,
  createCourseCurve,
  spawnLawnCreature,
} from './world';
import { buildFordWater, buildSplashes, buildTube, isInTube, type WaterFx } from './water';
import { traceSightlines, visibleFraction } from './sightlines';

/** Lawn fog: clear sky, and the blue of the glass tube. */
const FOG_CLEAR = 0x87c7e8;
const FOG_TUBE = 0x2c7fb0;
const fogClearColor = new THREE.Color(FOG_CLEAR);
const fogTubeColor = new THREE.Color(FOG_TUBE);

interface LiveCreature {
  speciesId: string;
  group: THREE.Group;
  /** Ground position (x, z) the mind moves; the spawn height is kept in y. Drift is added on top when drawn. */
  basePos: THREE.Vector3;
  baseRotY: number;
  /** Unused for movement now (the mind drives it). Kept so the CreatureBehavior type stays in use. */
  behavior: CreatureBehavior;
  /** Largest Tag-notice drift from basePos. */
  radius: number;
  action: CreatureAction;
  actionTimer: number;
  baitTarget: THREE.Vector3 | null;
  temperament: Temperament;
  /** Seconds left of a freeze (Flute) or nod; idle movement is skipped while > 0. */
  frozenTime: number;
  /** Seconds Tag has been outside NOTICE_RADIUS of this creature. Resets when he comes near. */
  awayTime: number;
  /** True while a Bolt run is in progress: the walk away awards no bait bonus. */
  fleeing: boolean;
  /** Offset from basePos moved by Tag's notice (approach, flee, retreat, hover). Relaxes to zero when Tag is not near. */
  drift: THREE.Vector3;
  /** Accumulated Y rotation during a Spin (Pester on an Aloof creature). */
  spinY: number;
  /** What the creature is deciding right now. Drives movement, except while startled, dancing or frozen. */
  mind: Mind;
  /** Fixed traits (boldness, shyness, ...) from personalityOf. */
  persona: Personality;
  /** The roam zone of this creature's home group, from the course layout. */
  zone: Zone;
  /** Height above the ground under it (the spawn height minus the ground at the spawn point). */
  lift: number;
  /** Bobbing amplitude on water (0: none) and its phase. */
  bob: number;
  phase: number;
}

function assertNever(x: never): never {
  throw new Error(`Unhandled temperament result: ${String(x)}`);
}

/** Moves `v` toward `target` by at most `step`. */
function approach(v: number, target: number, step: number): number {
  return v + Math.max(-step, Math.min(step, target - v));
}

/** 0 before the ford, 1 inside it, 2 after it. */
function fordSideOf(u: number, ford: readonly [number, number]): number {
  return u < ford[0] ? 0 : u > ford[1] ? 2 : 1;
}

/** Mind states map onto the animation actions that already exist. */
function actionFor(state: MindState): CreatureAction {
  switch (state) {
    case 'graze':
      return 'graze';
    case 'roam':
    case 'rest':
      return 'idle';
    case 'look':
      return 'look';
    case 'run':
      return 'run';
    case 'hide':
      return 'hide';
    case 'lured':
      return 'eating';
    default:
      return assertNever(state);
  }
}

/** Back to roaming for `seconds`, with no target. */
function wander(m: Mind, seconds: number): void {
  m.state = 'roam';
  m.timer = seconds;
  m.target = null;
  m.coverIndex = null;
}

/** Turns `current` toward `target` by at most `maxStep` radians (shortest way round). */
function turnToward(current: number, target: number, maxStep: number): number {
  const d = Math.atan2(Math.sin(target - current), Math.cos(target - current));
  return current + Math.max(-maxStep, Math.min(maxStep, d));
}

/** Pulls a ground point back inside a roam zone circle. */
function clampToZone(pos: THREE.Vector3, zone: Zone): void {
  const dx = pos.x - zone.x;
  const dz = pos.z - zone.z;
  const d = Math.hypot(dx, dz);
  if (d > zone.radius) {
    const k = zone.radius / d;
    pos.x = zone.x + dx * k;
    pos.z = zone.z + dz * k;
  }
}

interface Projectile {
  kind: 'bait' | 'pester';
  mesh: THREE.Mesh;
  vel: THREE.Vector3;
  life: number;
}

function playTone(freq: number, dur: number, type: OscillatorType = 'sine', gain = 0.08): void {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(gain, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + dur);
    setTimeout(() => void ctx.close(), dur * 1000 + 80);
  } catch {
    // Ignore audio errors when autoplay is blocked
  }
}

function playFluteTune(): void {
  playTone(523.25, 0.14, 'triangle', 0.07);
  setTimeout(() => playTone(659.25, 0.14, 'triangle', 0.07), 120);
  setTimeout(() => playTone(783.99, 0.24, 'triangle', 0.08), 240);
}

function playShutterClick(): void {
  playTone(920, 0.04, 'square', 0.05);
  setTimeout(() => playTone(440, 0.05, 'triangle', 0.04), 45);
}

export interface SnapHooks {
  /** The ride ended (film used up, track finished or "Finish Ride"). Receives every photo taken. */
  onFinish: (photos: readonly PhotoRecord[]) => void;
  /** The player left the ride early (Exit button or Escape). */
  onExit: () => void;
}

/** Full-screen safari ride. `container` should be a fixed, viewport-sized layer; the ride fills it. */
export function mountSnapGame(container: HTMLElement, courseId: CourseId, hooks: SnapHooks): () => void {
  container.replaceChildren();
  setMusicScene(courseId === 'lawn' ? 'snap' : courseId);

  const wrap = document.createElement('div');
  Object.assign(wrap.style, { position: 'absolute', inset: '0', background: '#0d140f' });
  container.append(wrap);

  // Stage fills the whole viewport; every control floats over it.
  const stage = document.createElement('div');
  stage.id = 'snap-stage';
  Object.assign(stage.style, {
    position: 'absolute',
    inset: '0',
    overflow: 'hidden',
    background: '#1a271d',
    userSelect: 'none',
  });
  wrap.append(stage);

  const canvas = document.createElement('canvas');
  Object.assign(canvas.style, {
    width: '100%',
    height: '100%',
    display: 'block',
    touchAction: 'none',
    cursor: 'crosshair',
  });
  stage.append(canvas);
  // Lens smear: sits over the view, under the HUD. Shown by a Pester on a Territorial creature.
  const smearEl = mountSmear(stage);

  // Viewfinder crosshair overlay
  const reticle = document.createElement('div');
  Object.assign(reticle.style, {
    position: 'absolute',
    inset: '0',
    pointerEvents: 'none',
    display: 'grid',
    placeItems: 'center',
  });
  reticle.innerHTML = `<div id="reticle-ring" style="width:92px;height:92px;border:2px solid rgba(255,255,255,0.55);border-radius:50%;box-shadow:0 0 0 9999px rgba(0,0,0,0.06);display:grid;place-items:center;transition:border-color 120ms ease,transform 120ms ease;">
    <div style="width:10px;height:10px;border:2px solid #ffcc33;border-radius:50%;"></div>
  </div>`;
  stage.append(reticle);
  const reticleRing = reticle.firstElementChild as HTMLElement;

  // Shutter flash overlay
  const flash = document.createElement('div');
  Object.assign(flash.style, {
    position: 'absolute',
    inset: '0',
    background: '#ffffff',
    opacity: '0',
    pointerEvents: 'none',
    transition: 'opacity 140ms ease-out',
  });
  stage.append(flash);

  // Top HUD bar
  const topHud = document.createElement('div');
  Object.assign(topHud.style, {
    position: 'absolute',
    top: 'calc(10px + env(safe-area-inset-top))',
    left: 'calc(10px + env(safe-area-inset-left))',
    right: 'calc(10px + env(safe-area-inset-right))',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '8px',
    pointerEvents: 'none',
    flexWrap: 'wrap',
  });
  const hudLeft = document.createElement('div');
  Object.assign(hudLeft.style, { display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-start' });
  const hudRight = document.createElement('div');
  Object.assign(hudRight.style, { display: 'flex', gap: '8px', pointerEvents: 'auto' });
  const statusPill = document.createElement('div');
  Object.assign(statusPill.style, {
    background: 'rgba(18, 28, 20, 0.78)',
    border: '1px solid rgba(255,255,255,0.18)',
    padding: '6px 12px',
    borderRadius: '999px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#eef4e7',
  });
  const toastPill = document.createElement('div');
  Object.assign(toastPill.style, {
    background: 'rgba(255, 204, 51, 0.92)',
    color: '#18231a',
    padding: '6px 12px',
    borderRadius: '999px',
    fontSize: '13px',
    fontWeight: '700',
    opacity: '0',
    transition: 'opacity 180ms ease',
  });
  hudLeft.append(statusPill, toastPill);
  topHud.append(hudLeft, hudRight);
  stage.append(topHud);

  // Instant-camera mini thumbnail preview (spoiler-free!)
  const previewCard = document.createElement('div');
  Object.assign(previewCard.style, {
    position: 'absolute',
    bottom: 'calc(150px + env(safe-area-inset-bottom))',
    right: 'calc(12px + env(safe-area-inset-right))',
    width: '108px',
    padding: '4px',
    background: '#f4f4f0',
    borderRadius: '6px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.45)',
    opacity: '0',
    transform: 'translateY(8px) rotate(2deg)',
    transition: 'opacity 180ms ease, transform 180ms ease',
    pointerEvents: 'none',
  });
  const previewImg = document.createElement('img');
  Object.assign(previewImg.style, { width: '100%', height: '66px', objectFit: 'cover', borderRadius: '3px', display: 'block' });
  previewCard.append(previewImg);
  stage.append(previewCard);

  // Controls float over the bottom of the stage (all >= 44px touch targets).
  const bar = document.createElement('div');
  Object.assign(bar.style, {
    position: 'absolute',
    left: '0',
    right: '0',
    bottom: '0',
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px calc(12px + env(safe-area-inset-right)) calc(12px + env(safe-area-inset-bottom)) calc(12px + env(safe-area-inset-left))',
    background: 'linear-gradient(0deg, rgba(8,14,10,0.78) 0%, rgba(8,14,10,0) 100%)',
    pointerEvents: 'none',
  });
  stage.append(bar);

  const leftTools = document.createElement('div');
  Object.assign(leftTools.style, { display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', pointerEvents: 'auto' });
  bar.append(leftTools);

  function toolBtn(label: string, onClick: () => void, accent = false): HTMLButtonElement {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = label;
    Object.assign(b.style, {
      minHeight: '44px',
      padding: '10px 14px',
      borderRadius: '8px',
      border: `1px solid ${accent ? 'var(--accent)' : 'var(--line)'}`,
      background: accent ? 'var(--accent)' : 'rgba(18, 28, 20, 0.82)',
      backdropFilter: 'blur(4px)',
      color: accent ? '#18231a' : 'var(--ink)',
      fontWeight: accent ? '700' : '600',
      fontSize: '13px',
      cursor: 'pointer',
    });
    b.onclick = onClick;
    return b;
  }

  // Three.js Setup
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
  renderer.shadowMap.enabled = true;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const worldHandles = buildCourseEnvironment(scene, courseId);

  const curve = createCourseCurve(courseId);
  const ground = courseGround(courseId);
  // Lawn ride only: the ford's water, the glass tube, splashes, hedges and the fog.
  const sections = courseId === 'lawn' ? railSections(curve) : null;
  let splashFx: WaterFx | null = null;
  let lawnFog: THREE.Fog | null = null;
  if (sections) {
    buildFordWater(scene, curve, sections.ford);
    buildTube(scene, curve, sections.tube);
    splashFx = buildSplashes(scene, curve, sections.ford, sections.tube);
    const blockers = buildSightBlockers(scene, curve, ground);
    const report = traceSightlines(curve, blockers);
    console.info(`lawn sight lines visible: ${visibleFraction(report).toFixed(2)}`);
    lawnFog = new THREE.Fog(FOG_CLEAR, 18, 60);
    scene.fog = lawnFog;
  }
  const dog = createGiantDog();
  scene.add(dog);

  const layout = layoutFor(courseId);
  const creatures: LiveCreature[] = layout.spawns.map((sp) => {
    const zone = layout.zones[sp.zone];
    const group = spawnLawnCreature({
      speciesId: sp.speciesId,
      pos: sp.pos,
      rotY: sp.rotY,
      scale: sp.scale ?? 1,
      behavior: 'patrol',
      radius: zone.radius,
      speed: 0,
    });
    scene.add(group);
    const temperament = temperamentOf(sp.speciesId);
    return {
      speciesId: sp.speciesId,
      group,
      basePos: new THREE.Vector3(sp.pos[0], sp.pos[1], sp.pos[2]),
      lift: sp.lift,
      bob: sp.bob ?? 0,
      phase: sp.phase ?? 0,
      baseRotY: sp.rotY,
      behavior: 'patrol',
      radius: zone.radius,
      action: 'idle',
      actionTimer: 0,
      baitTarget: null,
      temperament,
      frozenTime: 0,
      awayTime: 0,
      fleeing: false,
      drift: new THREE.Vector3(),
      spinY: 0,
      mind: initialMind(),
      persona: personalityOf(sp.speciesId, temperament),
      zone,
    };
  });

  const projectiles: Projectile[] = [];
  const bursts: { mesh: THREE.Mesh; vel: THREE.Vector3; life: number }[] = [];
  const camera = new THREE.PerspectiveCamera(56, 1, 0.1, 120);

  let dogT = 0;
  let fordSide = sections ? fordSideOf(dogT, sections.ford) : 1;
  let camY = 3.0;
  const RIDE_DURATION = 72; // seconds
  let speedMult = 1;
  let filmLeft = 24;
  let zoomed = false;
  let yawOffset = 0;
  let pitchOffset = -0.05;
  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  let destroyed = false;
  let animId = 0;
  let toastTimeout = 0;
  const keys = new Set<string>();
  const photos: PhotoRecord[] = [];
  const clock = new THREE.Clock();

  function showToast(msg: string): void {
    toastPill.textContent = msg;
    toastPill.style.opacity = '1';
    window.clearTimeout(toastTimeout);
    toastTimeout = window.setTimeout(() => {
      toastPill.style.opacity = '0';
    }, 2200);
  }
  showToast(COURSE_META[courseId].label);

  function updateHud(): void {
    const pct = Math.min(100, Math.round(dogT * 100));
    statusPill.textContent = `🐾 Dog Ride ${pct}% · 🎞️ ${filmLeft}/24 · 📸 ${photos.length} caught`;
  }

  function throwProjectile(kind: 'bait' | 'pester'): void {
    if (destroyed) return;
    const mat = new THREE.MeshLambertMaterial({
      color: kind === 'bait' ? 0xe03c31 : 0x7c4dff,
      flatShading: true,
    });
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6), mat);
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    mesh.position.copy(camera.position).addScaledVector(dir, 0.7);
    const vel = dir.multiplyScalar(13).add(new THREE.Vector3(0, 4.2, 0));
    scene.add(mesh);
    projectiles.push({ kind, mesh, vel, life: 3.0 });
    playTone(kind === 'bait' ? 420 : 280, 0.09, 'sine', 0.05);
  }

  function blowFlute(): void {
    if (destroyed) return;
    playFluteTune();
    let hit = 0;
    for (const c of creatures) {
      if (c.group.position.distanceTo(dog.position) < 12) {
        const result = fluteResult(c.temperament);
        switch (result) {
          case 'dance':
          case 'sway':
            c.action = 'dancing';
            c.actionTimer = 5.0;
            hit++;
            break;
          case 'freeze':
            c.frozenTime = 2;
            break;
          case 'nod':
            c.frozenTime = 1;
            c.group.rotation.y = Math.atan2(dog.position.x - c.group.position.x, dog.position.z - c.group.position.z);
            break;
          default:
            assertNever(result);
        }
      }
    }
    showToast(hit > 0 ? `🎵 ${hit} Gnomokemon dancing!` : '🎵 Played Gnome Flute');
  }

  /** Bait landed and the temperament allows it: the mind goes to the bait (lured). */
  function eatBait(c: LiveCreature, hitPos: THREE.Vector3): void {
    c.action = 'eating';
    c.actionTimer = 4.6;
    c.fleeing = false;
    c.baitTarget = new THREE.Vector3(hitPos.x, c.basePos.y, hitPos.z);
    c.mind.state = 'lured';
    c.mind.timer = 0;
    c.mind.target = { x: hitPos.x, z: hitPos.z };
    c.mind.coverIndex = null;
  }

  function applyBait(c: LiveCreature, hitPos: THREE.Vector3): void {
    const result = baitResult(c.temperament);
    switch (result) {
      case 'eat':
      case 'steal':
        eatBait(c, hitPos);
        break;
      case 'eatWhenDogStill':
        // Tag is never stopped in the ride, so "still" means: he is not near the bait.
        if (dog.position.distanceTo(hitPos) > NOTICE_RADIUS) eatBait(c, hitPos);
        break;
      case 'eatAfterStill':
        if (c.awayTime >= 2) eatBait(c, hitPos);
        break;
      case 'ignore':
        break;
      default:
        assertNever(result);
    }
  }

  /** Startles a creature for `seconds`, turning it toward the hit point. */
  function scare(c: LiveCreature, seconds: number, hitPos: THREE.Vector3): void {
    c.action = 'startled';
    c.actionTimer = seconds;
    c.baitTarget = null;
    c.fleeing = false;
    c.group.rotation.y = Math.atan2(hitPos.x - c.group.position.x, hitPos.z - c.group.position.z);
  }

  function applyPester(c: LiveCreature, hitPos: THREE.Vector3): void {
    const result = pesterResult(c.temperament);
    switch (result) {
      case 'startle':
        scare(c, 4.6, hitPos);
        break;
      case 'backOff':
        scare(c, 2, hitPos);
        break;
      case 'bolt': {
        scare(c, 0.5, hitPos);
        // After the startle, the mind runs 6 units away from the hit point for 1.2 s.
        let ax = c.group.position.x - hitPos.x;
        let az = c.group.position.z - hitPos.z;
        if (ax === 0 && az === 0) ax = 1;
        const len = Math.hypot(ax, az);
        ax /= len;
        az /= len;
        c.mind.state = 'run';
        c.mind.timer = 1.2;
        c.mind.target = { x: hitPos.x + ax * 6, z: hitPos.z + az * 6 };
        c.mind.coverIndex = null;
        break;
      }
      case 'hide':
        scare(c, 6, hitPos);
        break;
      case 'display':
        // Stays put; the lens smear comes 1.2 s later.
        scare(c, 1.2, hitPos);
        window.setTimeout(() => {
          if (!destroyed) flashSmear(smearEl, 0.9);
        }, 1200);
        break;
      case 'drop':
        scare(c, 1.0, hitPos);
        break;
      case 'stiff':
        scare(c, 2.0, hitPos);
        break;
      case 'spin':
        scare(c, 0.6, hitPos);
        c.spinY = c.group.rotation.y;
        break;
      default:
        assertNever(result);
    }
  }

  function toggleZoom(): void {
    zoomed = !zoomed;
    camera.fov = zoomed ? 25 : 56;
    camera.updateProjectionMatrix();
    zoomBtn.textContent = zoomed ? '🔍 Zoom: 2.5x (Z)' : '🔍 Zoom: 1x (Z)';
  }

  function snapPhoto(): void {
    if (destroyed || filmLeft <= 0) return;
    filmLeft--;
    playShutterClick();
    flash.style.opacity = '0.85';
    setTimeout(() => {
      flash.style.opacity = '0';
    }, 60);

    // Render clean frame & capture
    renderer.render(scene, camera);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.86);
    const result = evaluateShot(
      camera,
      creatures.map((c) => ({ speciesId: c.speciesId, object: c.group, action: c.action })),
    );

    if (!result) {
      showToast('No Gnomokemon in frame!');
      updateHud();
      if (filmLeft <= 0) finishRide();
      return;
    }

    const entry = getGnomeokemon(result.speciesId);
    const name = entry?.prefab.name ?? result.speciesId;
    const dex = entry?.dex ?? '000';
    const element = entry?.element ?? 'bloom';

    const creatureSnaps: CreatureSnapshot[] = creatures.map((c) => ({
      speciesId: c.speciesId,
      pos: [c.group.position.x, c.group.position.y, c.group.position.z],
      rotY: c.group.rotation.y,
      action: c.action,
      animTime: clock.elapsedTime,
    }));

    const record: PhotoRecord = {
      id: `${result.speciesId}-${Date.now()}-${photos.length}`,
      speciesId: result.speciesId,
      dex,
      name,
      element,
      capturedAt: Date.now(),
      dataUrl,
      score: result.score,
      snapshot: {
        courseId,
        dogT,
        cameraPos: [camera.position.x, camera.position.y, camera.position.z],
        cameraQuat: [camera.quaternion.x, camera.quaternion.y, camera.quaternion.z, camera.quaternion.w],
        fov: camera.fov,
        creatures: creatureSnaps,
      },
    };
    photos.push(record);
    previewImg.src = dataUrl;
    previewCard.style.opacity = '1';
    previewCard.style.transform = 'translateY(0) rotate(2deg)';
    setTimeout(() => {
      previewCard.style.opacity = '0';
      previewCard.style.transform = 'translateY(8px) rotate(2deg)';
    }, 1800);
    showToast(`📸 Snapped #${dex} ${name}!`);
    updateHud();

    if (filmLeft <= 0) finishRide();
  }

  function finishRide(): void {
    if (destroyed) return;
    cleanup();
    hooks.onFinish(photos);
  }

  function exitRide(): void {
    if (destroyed) return;
    cleanup();
    hooks.onExit();
  }

  const snapBtn = toolBtn('📸 Snap (Space)', snapPhoto, true);
  const baitBtn = toolBtn('🍎 Bait (Q)', () => throwProjectile('bait'));
  const pesterBtn = toolBtn('💥 Pester (E)', () => throwProjectile('pester'));
  const fluteBtn = toolBtn('🎵 Flute (F)', blowFlute);
  const zoomBtn = toolBtn('🔍 Zoom: 1x (Z)', toggleZoom);
  const speedBtn = toolBtn('🐾 Trot: 1x (Shift)', () => {
    speedMult = speedMult === 1 ? 2 : 1;
    speedBtn.textContent = speedMult === 2 ? '🐾 Trot: 2x (Shift)' : '🐾 Trot: 1x (Shift)';
  });
  const endBtn = toolBtn('Finish Ride →', finishRide);
  const exitBtn = toolBtn('✕ Exit', exitRide);

  leftTools.append(snapBtn, baitBtn, pesterBtn, fluteBtn, zoomBtn, speedBtn);
  hudRight.append(endBtn, exitBtn);

  // Input listeners
  const isLocked = (): boolean => document.pointerLockElement === canvas;
  const onPointerDown = (e: PointerEvent): void => {
    // A mouse captures the pointer on the first click so you can look around without dragging; then click snaps.
    if (e.pointerType === 'mouse') {
      if (isLocked()) {
        snapPhoto();
        return;
      }
      try {
        const p = canvas.requestPointerLock() as unknown as Promise<void> | undefined;
        if (p && typeof p.catch === 'function') p.catch(() => {});
      } catch {
        // Not allowed right now: fall back to click-and-drag.
      }
    }
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    canvas.setPointerCapture(e.pointerId);
  };
  const onPointerUp = (): void => {
    dragging = false;
  };
  const onPointerMove = (e: PointerEvent): void => {
    const locked = isLocked();
    if (!dragging && !locked) return;
    const dx = locked ? e.movementX : e.clientX - lastX;
    const dy = locked ? e.movementY : e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    const opts = loadSettings();
    const sens = (zoomed ? 0.0022 : 0.0045) * opts.mouseSens;
    yawOffset -= dx * sens;
    pitchOffset = Math.max(-0.55, Math.min(0.75, pitchOffset - dy * sens * (opts.invertY ? -1 : 1)));
  };
  const onWheel = (e: WheelEvent): void => {
    e.preventDefault();
    if ((e.deltaY < 0 && !zoomed) || (e.deltaY > 0 && zoomed)) toggleZoom();
  };
  const onKeyDown = (e: KeyboardEvent): void => {
    keys.add(e.code);
    if (e.code === 'Space') {
      e.preventDefault();
      snapPhoto();
    } else if (e.code === 'Escape') {
      if (performance.now() - lastUnlock > 500) exitRide();
    }
    else if (e.code === 'KeyQ') throwProjectile('bait');
    else if (e.code === 'KeyE') throwProjectile('pester');
    else if (e.code === 'KeyF') blowFlute();
    else if (e.code === 'KeyZ') toggleZoom();
    else if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
      speedMult = speedMult === 1 ? 2 : 1;
      speedBtn.textContent = speedMult === 2 ? '🐾 Trot: 2x (Shift)' : '🐾 Trot: 1x (Shift)';
    }
  };
  const onKeyUp = (e: KeyboardEvent): void => {
    keys.delete(e.code);
  };

  // Touch pinch-to-zoom support
  let lastPinchDist = 0;
  const onTouchMove = (e: TouchEvent): void => {
    if (e.touches.length !== 2) {
      lastPinchDist = 0;
      return;
    }
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    const d = Math.hypot(dx, dy);
    if (lastPinchDist > 0) {
      if (d - lastPinchDist > 22 && !zoomed) toggleZoom();
      else if (lastPinchDist - d > 22 && zoomed) toggleZoom();
    }
    lastPinchDist = d;
  };
  const onTouchEnd = (): void => {
    lastPinchDist = 0;
  };
  canvas.addEventListener('touchmove', onTouchMove, { passive: true });
  canvas.addEventListener('touchend', onTouchEnd);

  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', onPointerUp);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('wheel', onWheel, { passive: false });
  let lastUnlock = 0;
  const onLockChange = (): void => {
    if (!isLocked()) lastUnlock = performance.now();
    dragging = false;
    showToast(isLocked() ? '🖱️ Mouse captured: move to look, click to snap, Esc to release' : '🖱️ Mouse released: click the view to look around');
  };
  document.addEventListener('pointerlockchange', onLockChange);
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);

  const dogPos = new THREE.Vector3();
  const dogTan = new THREE.Vector3();
  const lookTarget = new THREE.Vector3();

  function tick(): void {
    if (destroyed) return;
    const dt = Math.min(0.05, clock.getDelta());
    const t = clock.elapsedTime;

    // Resize renderer cleanly
    const w = stage.clientWidth;
    const h = stage.clientHeight;
    if (w > 0 && h > 0) {
      const pr = Math.min(window.devicePixelRatio || 1, 2);
      if (canvas.width !== Math.round(w * pr) || canvas.height !== Math.round(h * pr)) {
        renderer.setPixelRatio(pr);
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      }
    }

    // Keyboard camera pan
    const panSpeed = zoomed ? 1.0 : 1.9;
    if (keys.has('ArrowLeft') || keys.has('KeyA')) yawOffset += panSpeed * dt;
    if (keys.has('ArrowRight') || keys.has('KeyD')) yawOffset -= panSpeed * dt;
    if (keys.has('ArrowUp') || keys.has('KeyW')) pitchOffset = Math.min(0.75, pitchOffset + panSpeed * 0.7 * dt);
    if (keys.has('ArrowDown') || keys.has('KeyS')) pitchOffset = Math.max(-0.55, pitchOffset - panSpeed * 0.7 * dt);

    // Move Giant Dog along rail
    dogT = Math.min(1, dogT + (dt * speedMult) / RIDE_DURATION);
    curve.getPointAt(dogT, dogPos);
    curve.getTangentAt(dogT, dogTan);

    const bob = Math.abs(Math.sin(t * 9)) * 0.08;
    dog.position.set(dogPos.x, dogPos.y + bob, dogPos.z);
    dog.lookAt(dogPos.x + dogTan.x, dogPos.y + bob, dogPos.z + dogTan.z);
    animateGiantDog(dog, t, dogT < 1);

    // Lawn water: the camera drops under the surface in the tube, and the fog turns blue.
    const inTube = sections !== null && isInTube(dogPos, curve, sections.tube);
    if (sections) {
      const side = fordSideOf(dogT, sections.ford);
      if (side !== fordSide) {
        fordSide = side;
        showToast('💦 Splash!');
      }
    }
    if (lawnFog) {
      lawnFog.color.lerp(inTube ? fogTubeColor : fogClearColor, Math.min(1, 3 * dt));
      lawnFog.near = approach(lawnFog.near, inTube ? 2 : 18, 3 * dt);
      lawnFog.far = approach(lawnFog.far, inTube ? 14 : 60, 3 * dt);
    }
    splashFx?.update(t, dt);

    // Camera mounted on the Giant Dog's saddle
    const baseYaw = Math.atan2(dogTan.x, dogTan.z);
    const finalYaw = baseYaw + yawOffset;
    // Sit above and just ahead of the saddle so the dog's head is below the frame instead of filling it.
    const tanLen = Math.hypot(dogTan.x, dogTan.z) || 1;
    const camTargetY = inTube ? dogPos.y + 0.3 : dogPos.y + 3.0 + bob * 0.7;
    camY = approach(camY, camTargetY, 4 * dt);
    camera.position.set(dogPos.x + (dogTan.x / tanLen) * 0.95, camY, dogPos.z + (dogTan.z / tanLen) * 0.95);
    lookTarget.set(
      camera.position.x + Math.sin(finalYaw) * Math.cos(pitchOffset),
      camera.position.y + Math.sin(pitchOffset),
      camera.position.z + Math.cos(finalYaw) * Math.cos(pitchOffset),
    );
    camera.lookAt(lookTarget);

    // Update projectiles
    for (let i = projectiles.length - 1; i >= 0; i--) {
      const p = projectiles[i];
      p.life -= dt;
      p.vel.y -= 18 * dt;
      p.mesh.position.addScaledVector(p.vel, dt);
      if (p.mesh.position.y <= 0.14) {
        const hitPos = p.mesh.position.clone();
        // Spawn 3D impact burst particles
        const burstColor = p.kind === 'bait' ? 0xff7043 : 0xb388ff;
        const burstMat = new THREE.MeshBasicMaterial({ color: burstColor });
        for (let b = 0; b < 6; b++) {
          const bm = new THREE.Mesh(new THREE.SphereGeometry(0.06, 5, 4), burstMat);
          bm.position.copy(hitPos);
          const ang = (b / 6) * Math.PI * 2;
          scene.add(bm);
          bursts.push({
            mesh: bm,
            vel: new THREE.Vector3(Math.cos(ang) * 2.4, 2.8, Math.sin(ang) * 2.4),
            life: 0.45,
          });
        }
        const reach = p.kind === 'bait' ? 8.5 : 6.0;
        for (const c of creatures) {
          if (c.group.position.distanceTo(hitPos) >= reach) continue;
          if (p.kind === 'bait') applyBait(c, hitPos);
          else applyPester(c, hitPos);
        }
        scene.remove(p.mesh);
        projectiles.splice(i, 1);
      } else if (p.life <= 0) {
        scene.remove(p.mesh);
        projectiles.splice(i, 1);
      }
    }

    // Update burst particles
    for (let i = bursts.length - 1; i >= 0; i--) {
      const b = bursts[i];
      b.life -= dt;
      b.vel.y -= 10 * dt;
      b.mesh.position.addScaledVector(b.vel, dt);
      b.mesh.scale.setScalar(Math.max(0.01, b.life * 2));
      if (b.life <= 0) {
        scene.remove(b.mesh);
        bursts.splice(i, 1);
      }
    }

    // Update animated world scenery & lively creature movement
    worldHandles.update(t);
    for (const c of creatures) {
      c.awayTime = c.group.position.distanceTo(dog.position) < NOTICE_RADIUS ? 0 : c.awayTime + dt;
      if (c.frozenTime > 0) c.frozenTime = Math.max(0, c.frozenTime - dt);

      // A startle or dance ends on its timer. A bait run ends too: the creature forgets the bait and wanders.
      if (c.action === 'startled' || c.action === 'dancing' || c.baitTarget) {
        c.actionTimer -= dt;
        if (c.actionTimer <= 0) {
          if (c.action === 'startled' || c.action === 'dancing') c.action = 'idle';
          if (c.baitTarget) {
            c.baitTarget = null;
            if (c.mind.state === 'lured' || c.mind.state === 'graze') wander(c.mind, 4);
          }
        }
      }

      const curBaseY = c.basePos.y;
      let curRotY = c.baseRotY;

      if (c.action === 'startled' && pesterResult(c.temperament) === 'spin') {
        // One full turn over the 0.6 s startle.
        c.spinY += (Math.PI * 2 / 0.6) * Math.min(dt, Math.max(0, c.actionTimer + dt));
        curRotY = c.spinY;
      }

      // Frozen (Flute or nod), startled and dancing creatures stay where they are; everyone else follows their mind.
      const mindDriven = c.frozenTime <= 0 && c.action !== 'startled' && c.action !== 'dancing';
      if (mindDriven) {
        if (
          c.baitTarget &&
          !c.fleeing &&
          baitResult(c.temperament) === 'steal' &&
          Math.hypot(c.basePos.x - c.baitTarget.x, c.basePos.z - c.baitTarget.z) <= 0.65
        ) {
          // Thief reached the bait: it keeps it.
          showToast('🍎 Stolen!');
          c.baitTarget = null;
          wander(c.mind, 4);
        }

        const bait = c.baitTarget ? { x: c.baitTarget.x, z: c.baitTarget.z } : null;
        const step = stepMind(c.mind, c.persona, {
          self: { x: c.basePos.x, z: c.basePos.z },
          tag: { x: dog.position.x, z: dog.position.z },
          bait,
          zone: c.zone,
          cover: layout.cover,
          dt,
          rand: Math.random,
        });
        c.mind = step.mind;
        c.basePos.x += step.velocity.x * dt;
        c.basePos.z += step.velocity.z * dt;
        clampToZone(c.basePos, c.zone);
        c.action = actionFor(c.mind.state);
        c.fleeing = c.mind.state === 'run';
        if (c.mind.state !== 'look' && Math.hypot(step.velocity.x, step.velocity.z) > 0.05) {
          // Face the way it is moving, turning at 4 rad/s.
          c.baseRotY = turnToward(c.baseRotY, Math.atan2(step.velocity.x, step.velocity.z), 4 * dt);
        }

        let facing: number | null = null;
        if (c.action === 'idle') {
          // Tag notice: react to the dog when he is within NOTICE_RADIUS.
          const toDogX = dog.position.x - c.group.position.x;
          const toDogZ = dog.position.z - c.group.position.z;
          let moved = false;
          if (c.group.position.distanceTo(dog.position) < NOTICE_RADIUS) {
            const len = Math.hypot(toDogX, toDogZ) || 1;
            const ux = toDogX / len;
            const uz = toDogZ / len;
            const res = tagResult(c.temperament);
            switch (res) {
              case 'approach':
                c.drift.x += ux * 0.6 * dt;
                c.drift.z += uz * 0.6 * dt;
                if (c.drift.length() > c.radius) c.drift.setLength(c.radius);
                moved = true;
                break;
              case 'flee':
                c.drift.x -= ux * 2.2 * dt;
                c.drift.z -= uz * 2.2 * dt;
                moved = true;
                break;
              case 'retreat':
                c.drift.x -= ux * 1.0 * dt;
                c.drift.z -= uz * 1.0 * dt;
                moved = true;
                break;
              case 'warn':
                facing = Math.atan2(toDogX, toDogZ);
                break;
              case 'hover':
                c.drift.x += ux * 0.5 * dt;
                c.drift.z += uz * 0.5 * dt;
                moved = true;
                break;
              case 'ignore':
                break;
              default:
                assertNever(res);
            }
          }
          if (!moved) {
            // Tag is not pushing this creature: drift back home at 1 unit/s.
            const dl = c.drift.length();
            if (dl > 0) c.drift.multiplyScalar(Math.max(0, dl - 1.0 * dt) / dl);
          }
        }

        c.group.position.x = c.basePos.x + c.drift.x;
        c.group.position.z = c.basePos.z + c.drift.z;
        c.group.position.y = ground(c.group.position.x, c.group.position.z) + c.lift + (c.bob ? Math.sin(t * 2 + c.phase) * c.bob : 0);
        if (c.action === 'look') {
          // Turn the body toward Tag at 3 rad/s, so the reaction shows even without a head.
          const want = Math.atan2(dog.position.x - c.group.position.x, dog.position.z - c.group.position.z);
          c.group.rotation.y = turnToward(c.group.rotation.y, want, 3 * dt);
          c.baseRotY = c.group.rotation.y;
        } else {
          c.group.rotation.y = facing ?? c.baseRotY;
        }
        curRotY = c.group.rotation.y;
      } else if (c.frozenTime > 0) {
        // Frozen: keep the current facing.
        curRotY = c.group.rotation.y;
      }

      const lookYaw = Math.atan2(dog.position.x - c.group.position.x, dog.position.z - c.group.position.z);
      animateLawnCreature(c.group, c.action, t, curBaseY, curRotY, c.mind.state === 'look' ? lookYaw : 0);
    }

    updateHud();
    // Live reticle lock-on indicator (no score spoiler)
    let locked = false;
    const _proj = new THREE.Vector3();
    for (const c of creatures) {
      if (c.group.position.distanceTo(camera.position) > 22) continue;
      _proj.copy(c.group.position).setY(c.group.position.y + 0.35).project(camera);
      if (_proj.z > -1 && _proj.z < 1 && Math.hypot(_proj.x, _proj.y) < 0.35) {
        locked = true;
        break;
      }
    }
    reticleRing.style.borderColor = locked ? '#ffcc33' : 'rgba(255,255,255,0.55)';
    reticleRing.style.transform = locked ? 'scale(1.08)' : 'scale(1)';

    renderer.render(scene, camera);

    if (dogT >= 1) {
      finishRide();
      return;
    }
    animId = requestAnimationFrame(tick);
  }

  animId = requestAnimationFrame(tick);

  function cleanup(): void {
    if (destroyed) return;
    destroyed = true;
    cancelAnimationFrame(animId);
    window.clearTimeout(toastTimeout);
    canvas.removeEventListener('touchmove', onTouchMove);
    canvas.removeEventListener('touchend', onTouchEnd);
    canvas.removeEventListener('pointerdown', onPointerDown);
    canvas.removeEventListener('pointerup', onPointerUp);
    canvas.removeEventListener('pointercancel', onPointerUp);
    canvas.removeEventListener('pointermove', onPointerMove);
    canvas.removeEventListener('wheel', onWheel);
    document.removeEventListener('pointerlockchange', onLockChange);
    if (document.pointerLockElement === canvas) document.exitPointerLock();
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    renderer.dispose();
  }

  return cleanup;
}
