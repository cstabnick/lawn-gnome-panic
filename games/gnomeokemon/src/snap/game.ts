import * as THREE from 'three';
import { setMusicScene } from '../music';
import { getGnomeokemon } from '../prefabs/registry';
import { renderGradingView } from './grading';
import { animateGiantDog, createGiantDog } from './models';
import { evaluateShot } from './scoring';
import type { CourseId, CreatureAction, CreatureSnapshot, PhotoRecord } from './types';
import {
  COURSE_META,
  type CreatureBehavior,
  animateLawnCreature,
  buildCourseEnvironment,
  createCourseCurve,
  getCourseSpawns,
  spawnLawnCreature,
} from './world';

interface LiveCreature {
  speciesId: string;
  group: THREE.Group;
  basePos: THREE.Vector3;
  baseRotY: number;
  behavior: CreatureBehavior;
  radius: number;
  speed: number;
  phase: number;
  action: CreatureAction;
  actionTimer: number;
  baitTarget: THREE.Vector3 | null;
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

export function mountSnapGame(
  container: HTMLElement,
  onOpenGallery: () => void,
  courseId: CourseId = 'lawn',
): () => void {
  container.replaceChildren();
  setMusicScene(courseId === 'lawn' ? 'snap' : courseId);

  const wrap = document.createElement('div');
  Object.assign(wrap.style, {
    maxWidth: '1120px',
    margin: '0 auto',
    padding: '12px 16px 20px',
  });
  container.append(wrap);

  // Course selector bar
  const courseBar = document.createElement('div');
  Object.assign(courseBar.style, {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px',
    marginBottom: '10px',
    flexWrap: 'wrap',
  });
  const courseTabs = document.createElement('div');
  Object.assign(courseTabs.style, { display: 'flex', gap: '8px', flexWrap: 'wrap' });
  for (const cid of ['lawn', 'desert', 'depths', 'kiln'] as const) {
    const active = cid === courseId;
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = COURSE_META[cid].label;
    Object.assign(b.style, {
      minHeight: '44px',
      padding: '8px 14px',
      borderRadius: '999px',
      border: `1px solid ${active ? 'var(--accent)' : 'var(--line)'}`,
      background: active ? 'var(--panel-2)' : 'var(--panel)',
      color: active ? 'var(--accent)' : 'var(--ink)',
      fontWeight: '600',
      fontSize: '13px',
      cursor: 'pointer',
    });
    b.onclick = () => {
      if (cid === courseId) return;
      cleanup();
      mountSnapGame(container, onOpenGallery, cid);
    };
    courseTabs.append(b);
  }
  const courseSub = document.createElement('div');
  Object.assign(courseSub.style, { fontSize: '12px', color: 'var(--dim)' });
  courseSub.textContent = COURSE_META[courseId].subtitle;
  courseBar.append(courseTabs, courseSub);
  wrap.append(courseBar);

  // Stage container
  const stage = document.createElement('div');
  stage.id = 'snap-stage';
  Object.assign(stage.style, {
    position: 'relative',
    width: '100%',
    height: 'clamp(240px, 48vh, 520px)',
    borderRadius: '12px',
    overflow: 'hidden',
    border: '1px solid var(--line)',
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

  // Viewfinder crosshair overlay
  const reticle = document.createElement('div');
  Object.assign(reticle.style, {
    position: 'absolute',
    inset: '0',
    pointerEvents: 'none',
    display: 'grid',
    placeItems: 'center',
  });
  reticle.innerHTML = `<div style="width:92px;height:92px;border:2px solid rgba(255,255,255,0.55);border-radius:50%;box-shadow:0 0 0 9999px rgba(0,0,0,0.06);display:grid;place-items:center;">
    <div style="width:10px;height:10px;border:2px solid #ffcc33;border-radius:50%;"></div>
  </div>`;
  stage.append(reticle);

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
    top: '10px',
    left: '10px',
    right: '10px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '8px',
    pointerEvents: 'none',
    flexWrap: 'wrap',
  });
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
  topHud.append(statusPill, toastPill);
  stage.append(topHud);

  // Controls bar below stage (all >= 44px touch targets!)
  const bar = document.createElement('div');
  Object.assign(bar.style, {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginTop: '10px',
    alignItems: 'center',
    justifyContent: 'space-between',
  });
  wrap.append(bar);

  const leftTools = document.createElement('div');
  Object.assign(leftTools.style, { display: 'flex', flexWrap: 'wrap', gap: '8px' });
  const rightTools = document.createElement('div');
  Object.assign(rightTools.style, { display: 'flex', flexWrap: 'wrap', gap: '8px' });
  bar.append(leftTools, rightTools);

  function toolBtn(label: string, onClick: () => void, accent = false): HTMLButtonElement {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = label;
    Object.assign(b.style, {
      minHeight: '44px',
      padding: '10px 14px',
      borderRadius: '8px',
      border: `1px solid ${accent ? 'var(--accent)' : 'var(--line)'}`,
      background: accent ? 'var(--accent)' : 'var(--panel)',
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
  const dog = createGiantDog();
  scene.add(dog);

  const creatures: LiveCreature[] = getCourseSpawns(courseId).map((sp) => {
    const group = spawnLawnCreature(sp);
    scene.add(group);
    return {
      speciesId: sp.speciesId,
      group,
      basePos: new THREE.Vector3(...sp.pos),
      baseRotY: sp.rotY,
      behavior: sp.behavior,
      radius: sp.radius,
      speed: sp.speed,
      phase: sp.phase ?? 0,
      action: 'idle',
      actionTimer: 0,
      baitTarget: null,
    };
  });

  const projectiles: Projectile[] = [];
  const camera = new THREE.PerspectiveCamera(56, 1, 0.1, 120);

  let dogT = 0;
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
        c.action = 'dancing';
        c.actionTimer = 5.0;
        hit++;
      }
    }
    showToast(hit > 0 ? `🎵 ${hit} Gnomokemon dancing!` : '🎵 Played Gnome Flute');
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
    showToast(`📸 Snapped #${dex} ${name}!`);
    updateHud();

    if (filmLeft <= 0) finishRide();
  }

  function finishRide(): void {
    cleanup();
    setMusicScene('grading');
    renderGradingView(container, photos, {
      onRideAgain: () => {
        mountSnapGame(container, onOpenGallery, courseId);
      },
      onOpenGallery,
    });
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

  leftTools.append(snapBtn, baitBtn, pesterBtn, fluteBtn, zoomBtn, speedBtn);
  rightTools.append(endBtn);

  // Input listeners
  const onPointerDown = (e: PointerEvent): void => {
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    canvas.setPointerCapture(e.pointerId);
  };
  const onPointerUp = (): void => {
    dragging = false;
  };
  const onPointerMove = (e: PointerEvent): void => {
    if (!dragging) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    const sens = zoomed ? 0.0022 : 0.0045;
    yawOffset -= dx * sens;
    pitchOffset = Math.max(-0.55, Math.min(0.75, pitchOffset - dy * sens));
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
    } else if (e.code === 'KeyQ') throwProjectile('bait');
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
    dog.position.set(dogPos.x, bob, dogPos.z);
    dog.lookAt(dogPos.x + dogTan.x, bob, dogPos.z + dogTan.z);
    animateGiantDog(dog, t, dogT < 1);

    // Camera mounted on the Giant Dog's saddle
    const baseYaw = Math.atan2(dogTan.x, dogTan.z);
    const finalYaw = baseYaw + yawOffset;
    camera.position.set(dogPos.x, 2.38 + bob * 0.7, dogPos.z);
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
        const reach = p.kind === 'bait' ? 8.5 : 6.0;
        for (const c of creatures) {
          if (c.group.position.distanceTo(hitPos) < reach) {
            c.action = p.kind === 'bait' ? 'eating' : 'startled';
            c.actionTimer = 4.6;
            if (p.kind === 'bait') {
              c.baitTarget = new THREE.Vector3(hitPos.x, c.basePos.y, hitPos.z);
            } else {
              c.baitTarget = null;
              const dx = hitPos.x - c.group.position.x;
              const dz = hitPos.z - c.group.position.z;
              c.group.rotation.y = Math.atan2(dx, dz);
            }
          }
        }
        scene.remove(p.mesh);
        projectiles.splice(i, 1);
      } else if (p.life <= 0) {
        scene.remove(p.mesh);
        projectiles.splice(i, 1);
      }
    }

    // Update animated world scenery & lively creature movement
    worldHandles.update(t);
    for (const c of creatures) {
      if (c.action !== 'idle') {
        c.actionTimer -= dt;
        if (c.actionTimer <= 0) {
          c.action = 'idle';
          c.baitTarget = null;
        }
      }

      let curBaseY = c.basePos.y;
      let curRotY = c.baseRotY;

      if (c.action === 'eating' && c.baitTarget) {
        // Walk/hop toward the thrown bait!
        const dx = c.baitTarget.x - c.group.position.x;
        const dz = c.baitTarget.z - c.group.position.z;
        const dist = Math.hypot(dx, dz);
        if (dist > 0.65) {
          const step = Math.min(dist, 2.4 * dt);
          c.group.position.x += (dx / dist) * step;
          c.group.position.z += (dz / dist) * step;
        }
        curRotY = Math.atan2(dx, dz);
        c.group.rotation.y = curRotY;
      } else if (c.action === 'idle') {
        const ang = t * c.speed + c.phase;
        let nx = c.basePos.x;
        let nz = c.basePos.z;
        if (c.behavior === 'patrol') {
          nx += Math.sin(ang) * c.radius;
          curRotY = Math.cos(ang) >= 0 ? Math.PI / 2 : -Math.PI / 2;
        } else if (c.behavior === 'orbit' || c.behavior === 'roll') {
          nx += Math.cos(ang) * c.radius;
          nz += Math.sin(ang) * c.radius;
          curRotY = Math.atan2(-Math.sin(ang), Math.cos(ang));
        } else if (c.behavior === 'hop') {
          nx += Math.sin(ang) * c.radius * 0.7;
          nz += Math.cos(ang * 0.7) * c.radius * 0.5;
          curBaseY += Math.abs(Math.sin(ang * 3)) * 0.25;
          curRotY = Math.atan2(Math.cos(ang) * c.radius * 0.7, -Math.sin(ang * 0.7) * c.radius * 0.35);
        } else if (c.behavior === 'swoop') {
          nx += Math.sin(ang) * c.radius;
          nz += Math.sin(ang * 2) * (c.radius * 0.55);
          curBaseY += Math.sin(ang * 2.2) * 0.45;
          curRotY = Math.atan2(Math.cos(ang), Math.cos(ang * 2));
        } else if (c.behavior === 'burrow') {
          const pop = Math.sin(ang);
          curBaseY += pop > 0 ? pop * 0.2 : -0.35;
          nx += Math.cos(ang * 0.5) * c.radius * 0.4;
        }
        c.group.position.x = nx;
        c.group.position.z = nz;
        c.group.rotation.y = curRotY;
      }

      animateLawnCreature(c.group, c.action, t, curBaseY, curRotY);
    }

    updateHud();
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
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    renderer.dispose();
  }

  return cleanup;
}
