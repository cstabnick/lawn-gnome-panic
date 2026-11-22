import * as THREE from 'three';
import { createVolumeStore } from '@arcade/volume';
import { createAchievementTracker } from '@lawn/achievements';
import {
  buildGnomeSetRadioTrack,
  playSong,
  setMusicVolume,
  setMuteKey,
  stopSong,
  type GsrMusicOptions,
  type GsrTrackId,
} from '@lawn/music';
import { createMutter } from '@lawn/mutter';
import { createInputController } from './input';
import { getLevelDoc, type GsrLevelId } from './levels/loader';
import type { GsrLevelDoc } from './levels/schema';
import {
  advanceEvent,
  createLevelSession,
  loadProgress,
  saveProgress,
  type LevelSession,
} from './game/events';
import { createSkater, stepSkater, type SkaterState } from './sim/skater';
import { createHud } from './ui/hud';
import { createMusicExplorer } from './ui/musicExplorer';
import { mountTitleOverlay, showArea3Teaser } from './ui/title';
import { createChaseCamera } from './view/camera';
import { createRiderView, type RiderView } from './view/rider';
import { buildWorldVisuals, type WorldVisuals } from './view/world';

export function startApp(): void {
const params = new URLSearchParams(location.search);
const autostart = params.get('autostart') === '1';
const startLevelParam = (params.get('level') === 'bongo-basin' ? 'bongo-basin' : 'velvet-keys') as GsrLevelId;
const openExplorerParam = params.get('explorer') === '1';

const canvas = document.getElementById('c') as HTMLCanvasElement;
const uiRoot = document.getElementById('ui') as HTMLElement;

// Never restyle or hide #ui itself; mount our own container inside it.
const gsrUi = document.createElement('div');
gsrUi.id = 'gsr-ui';
gsrUi.style.cssText = 'position:fixed; inset:0; pointer-events:none;';
uiRoot.appendChild(gsrUi);

const volume = createVolumeStore();
setMuteKey('gsr-music-muted');
volume.subscribe((st) => {
  setMusicVolume(st.muted ? 0 : st.master * st.music);
});

const mutter = createMutter({ gain: () => volume.effective('sounds') });
window.addEventListener('pointerdown', () => mutter.unlock(), { once: true });

const achievements = createAchievementTracker({ ui: gsrUi });

// Three.js setup
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(window.innerWidth, window.innerHeight, false);
renderer.shadowMap.enabled = true;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.15, 450);

const hemi = new THREE.HemisphereLight(0xffb3ec, 0x261542, 1.05);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff5d6, 1.35);
sun.position.set(36, 58, 30);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
scene.add(sun);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight, false);
});

const input = createInputController(canvas);
input.mountTouch(gsrUi);

let progress = loadProgress();
let currentLevelId: GsrLevelId = startLevelParam;
let doc: GsrLevelDoc = getLevelDoc(currentLevelId);
let world: WorldVisuals | null = null;
let rider: RiderView | null = null;
let skater: SkaterState = createSkater(doc);
let session: LevelSession = createLevelSession(doc, currentLevelId);
const chaseCam = createChaseCamera();
const prevButtons = { jump: false, trick: false, railCooldown: 0 };

let currentTrackId: GsrTrackId = 'pirate-radio-hub';
let beatPulse = 0;
let playing = false;
let bossHitCooldown = 0;
let pluckHitCooldown = 0;
let sentryHitCooldown = 0;

function playTrack(id: GsrTrackId, overrides: GsrMusicOptions | null = null): void {
  currentTrackId = id;
  playSong((T, keep, out) =>
    buildGnomeSetRadioTrack(T, keep, out, id, 1, {
      grinding: () => overrides?.grinding?.() ?? skater.grinding,
      air: () => overrides?.air?.() ?? (!skater.grounded && !skater.grinding),
      boss: () => overrides?.boss?.() ?? (session.bossUnlocked && !session.levelCleared),
      hype: () => overrides?.hype?.() ?? Math.min(1, 0.3 + skater.comboMult * 0.12),
      onBeat(step) {
        if (step % 4 === 0) beatPulse = 1;
        musicExplorer.onBeat(step);
      },
    }),
  );
}

const musicExplorer = createMusicExplorer(gsrUi, {
  getCurrentTrack: () => currentTrackId,
  onSelectTrack: (id, overrides) => playTrack(id, overrides),
  onStop: () => stopSong(),
});

const titleOverlay = mountTitleOverlay(gsrUi, progress, {
  onPlay: (id) => startLevel(id),
  onOpenMusic: () => musicExplorer.open(),
});

const hud = createHud(gsrUi, {
  volume,
  onOpenMusic: () => musicExplorer.toggle(),
  onOpenAreas: () => {
    playing = false;
    hud.setVisible(false);
    input.setTouchVisible(false);
    titleOverlay.show(progress);
    playTrack('pirate-radio-hub', musicExplorer.getReactiveOverrides());
  },
});

function loadSceneForLevel(levelId: GsrLevelId): void {
  currentLevelId = levelId;
  doc = getLevelDoc(levelId);
  if (world) {
    scene.remove(world.group);
    world.dispose();
  }
  if (rider) {
    scene.remove(rider.root);
    rider.dispose();
  }
  world = buildWorldVisuals(doc);
  scene.add(world.group);
  rider = createRiderView();
  scene.add(rider.root);
  skater = createSkater(doc);
  session = createLevelSession(doc, levelId);
  chaseCam.yaw = skater.yaw;
  scene.fog = new THREE.FogExp2(doc.data.fogColor, 0.0042);
}

function startLevel(levelId: GsrLevelId): void {
  loadSceneForLevel(levelId);
  titleOverlay.hide();
  hud.setVisible(true);
  input.setTouchVisible(true);
  playing = true;
  playTrack(doc.data.trackId, musicExplorer.getReactiveOverrides());
  mutter.say(session.activeBanner?.text ?? '', 96);
}

// Initial scene (for background behind title, or immediate autostart)
loadSceneForLevel(startLevelParam);
if (autostart) {
  startLevel(startLevelParam);
} else {
  playTrack('pirate-radio-hub');
}
if (openExplorerParam) {
  musicExplorer.open();
}

function handleEventCompletion(
  evId: string,
  targetId?: string,
): void {
  const result = advanceEvent(session, evId, targetId);
  if (result.completedNow) {
    const ev = session.events.get(evId);
    if (ev?.def.kind === 'side') {
      void achievements.increment('gsr-side-grooves');
    }
    if (result.line) mutter.say(result.line, ev?.def.kind === 'boss' ? 76 : 112);
    if (result.bossJustUnlocked) {
      mutter.say('Boss awakened on the main stage!', 82);
    }
    if (result.levelJustCleared) {
      if (!progress.completedAreas.includes(currentLevelId)) {
        progress.completedAreas.push(currentLevelId);
      }
      if (currentLevelId === 'velvet-keys') {
        void achievements.unlock('gsr-ivory-encore');
      } else if (currentLevelId === 'bongo-basin') {
        void achievements.unlock('gsr-bongo-king');
        progress.area3Teased = true;
        setTimeout(() => {
          playing = false;
          hud.setVisible(false);
          input.setTouchVisible(false);
          showArea3Teaser(
            gsrUi,
            () => musicExplorer.open(),
            () => titleOverlay.show(progress),
          );
        }, 1600);
      }
      saveProgress(progress);
    }
  }
}

let lastT = performance.now();
function frame(now: number): void {
  const dt = Math.min(0.05, (now - lastT) / 1000);
  lastT = now;
  const elapsed = now / 1000;

  beatPulse = Math.max(0, beatPulse - dt * 3.5);
  bossHitCooldown = Math.max(0, bossHitCooldown - dt);
  pluckHitCooldown = Math.max(0, pluckHitCooldown - dt);
  sentryHitCooldown = Math.max(0, sentryHitCooldown - dt);

  const inp = input.poll(chaseCam.yaw);
  if (inp.toggleExplorer) {
    musicExplorer.toggle();
  }

  let promptText: string | null = null;

  if (playing && !musicExplorer.isOpen() && world && rider) {
    const stepRes = stepSkater(skater, doc, inp.skater, dt, prevButtons);
    rider.update(skater, dt);
    chaseCam.update(camera, skater, dt, inp.orbitDeltaX);

    if (stepRes.bankedScore > 0) {
      for (const ev of session.events.values()) {
        if (ev.def.objectiveType === 'rail-combo' && !ev.completed && stepRes.bankedScore >= ev.def.targetCount) {
          handleEventCompletion(ev.def.id);
        }
      }
    }

    // Billboard spray-tagging
    for (const [id, bb] of world.billboardMeshes) {
      if (bb.tagged) continue;
      const dist = Math.hypot(skater.x - bb.def.x, skater.y - bb.def.y, skater.z - bb.def.z);
      if (dist < 4.5) {
        promptText = `Press SPRAY (F) to tag ${bb.def.gangName} billboard!`;
        if (inp.sprayEdge) {
          world.markBillboardTagged(id);
          rider.triggerSpray('#00e5ff');
          skater.comboScore += 300;
          skater.comboTimer = 2.5;
          void achievements.unlock('gsr-first-tag');
          if (bb.def.eventId) handleEventCompletion(bb.def.eventId, id);
        }
      }
    }

    // Interactive world objects
    for (const [id, item] of world.interactiveMeshes) {
      const dist = Math.hypot(skater.x - item.def.x, skater.y - item.def.y, skater.z - item.def.z);
      if (item.def.kind === 'bongo-pad' && dist < 2.2 && skater.vy <= 1.5) {
        skater.vy = item.def.power ?? 16;
        skater.grounded = false;
        skater.comboScore += 150;
        skater.comboTimer = 2.4;
        skater.lastTrickName = 'Bongo Bounce';
        if (item.def.eventId && !item.consumed) {
          world.markInteractiveDone(id);
          handleEventCompletion(item.def.eventId, id);
        }
      } else if (item.def.kind === 'hydrant' && dist < 2.1 && skater.vy <= 2) {
        skater.vy = item.def.power ?? 16;
        skater.grounded = false;
        skater.lastTrickName = 'Geyser Launch';
      } else if (item.def.kind === 'spray-pickup' && !item.consumed && dist < 2.0) {
        world.markInteractiveDone(id);
        skater.boost = Math.min(100, skater.boost + 45);
        rider.triggerSpray('#ffd740');
      } else if (item.def.kind === 'tempo-acorn' && !item.consumed && dist < 2.3) {
        world.markInteractiveDone(id);
        rider.triggerSpray('#ffd740');
        if (item.def.eventId) handleEventCompletion(item.def.eventId, id);
      } else if (item.def.kind === 'aerial-ring' && !item.consumed && dist < 3.0) {
        world.markInteractiveDone(id);
        skater.boost = Math.min(100, skater.boost + 30);
        skater.comboScore += 250;
        if (item.def.eventId) handleEventCompletion(item.def.eventId, id);
      } else if (
        (item.def.kind === 'relay-dish' || item.def.kind === 'speaker-stack' || item.def.kind === 'boombox') &&
        dist < 3.6
      ) {
        if (!item.consumed) {
          promptText = `Press SPRAY (F) to tune ${item.def.label ?? 'Device'}`;
          if (inp.sprayEdge) {
            world.markInteractiveDone(id);
            rider.triggerSpray('#ff4ecd');
            skater.boost = Math.min(100, skater.boost + 25);
            if (item.def.eventId) handleEventCompletion(item.def.eventId, id);
          }
        }
      }
    }

    // Pluck chase (Area 1)
    if (world.pluckNpc && pluckHitCooldown <= 0) {
      const pPos = world.pluckNpc.root.position;
      if (Math.hypot(skater.x - pPos.x, skater.y - pPos.y, skater.z - pPos.z) < 3.5) {
        promptText = 'Press SPRAY (F) to tag Pluck!';
        if (inp.sprayEdge) {
          pluckHitCooldown = 0.8;
          rider.triggerSpray('#ff4ecd');
          handleEventCompletion('vk-pluck-chase');
        }
      }
    }

    // Conga Sentries (Area 2)
    if (sentryHitCooldown <= 0) {
      for (const se of world.sentries) {
        if (se.tagged) continue;
        const p = se.root.position;
        if (Math.hypot(skater.x - p.x, skater.y - p.y, skater.z - p.z) < 3.2) {
          promptText = 'Press SPRAY (F) to silence Conga Sentry!';
          if (inp.sprayEdge) {
            se.tagged = true;
            sentryHitCooldown = 0.4;
            rider.triggerSpray('#ff9100');
            handleEventCompletion('bb-clear-drumline');
            break;
          }
        }
      }
    }

    // Side-story NPC intros
    for (const ev of session.events.values()) {
      if (ev.def.kind === 'side' && !ev.completed) {
        const d = Math.hypot(skater.x - ev.def.x, skater.y - ev.def.y, skater.z - ev.def.z);
        if (d < 4.2) {
          promptText = `Press SPRAY (F) to talk to ${ev.def.character}`;
          if (inp.sprayEdge) {
            ev.active = true;
            session.activeBanner = { speaker: ev.def.character, text: ev.def.introLine, ttl: 5.5 };
            mutter.say(ev.def.introLine, 118);
          }
        }
      }
    }

    // Boss encounter
    if (session.bossUnlocked && !session.levelCleared && world.bossActor) {
      session.bossWavePhase += dt * 0.55;
      const bp = world.bossActor.root.position;
      const dist = Math.hypot(skater.x - bp.x, skater.y - bp.y, skater.z - bp.z);
      if (dist < 4.8 && bossHitCooldown <= 0) {
        promptText = 'Press SPRAY (F) to tag the Boss!';
        if (inp.sprayEdge) {
          bossHitCooldown = 0.9;
          rider.triggerSpray('#ffd740');
          const bossEv = [...session.events.values()].find((e) => e.def.kind === 'boss');
          if (bossEv) handleEventCompletion(bossEv.def.id);
        }
      }
    }

    if (session.activeBanner) {
      session.activeBanner.ttl -= dt;
      if (session.activeBanner.ttl <= 0) session.activeBanner = null;
    }

    world.update(elapsed, beatPulse, session.bossUnlocked && !session.levelCleared, session.bossWavePhase);
    hud.update(doc, skater, session, promptText);
  } else if (world) {
    world.update(elapsed, beatPulse, false, 0);
    // Slow title orbit
    camera.position.set(Math.sin(elapsed * 0.18) * 48, 22, Math.cos(elapsed * 0.18) * 48);
    camera.lookAt(0, 4, -8);
  }

  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
}
