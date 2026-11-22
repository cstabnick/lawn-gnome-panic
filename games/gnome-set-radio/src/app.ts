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
import { getLevelDoc, LEVEL_ORDER, type GsrLevelId } from './levels/loader';
import type { GsrLevelDoc } from './levels/schema';
import {
  advanceEvent,
  createLevelSession,
  loadProgress,
  saveProgress,
  type LevelSession,
} from './game/events';
import { createSkater, stepSkater, type SkaterState } from './sim/skater';
import { createHelperGnome } from './ui/helperGnome';
import { createHud } from './ui/hud';
import { createMusicExplorer } from './ui/musicExplorer';
import { mountTitleOverlay, showArea5Teaser } from './ui/title';
import { createChaseCamera } from './view/camera';
import { createFx } from './view/fx';
import { createGraffitiSystem, getGraffitiTexture, REGIONAL_GRAFFITI } from './view/graffiti';
import { createMarkerSystem, type MarkerSystem } from './view/markers';
import { createRiderView, type RiderView } from './view/rider';
import { buildWorldVisuals, type WorldVisuals } from './view/world';

const ARROWS = ['↑', '↗', '→', '↘', '↓', '↙', '←', '↖'] as const;
function directionArrow(camYaw: number, dx: number, dz: number): string {
  const fwdX = Math.sin(camYaw);
  const fwdZ = Math.cos(camYaw);
  const rightX = -Math.cos(camYaw);
  const rightZ = Math.sin(camYaw);
  const f = dx * fwdX + dz * fwdZ;
  const r = dx * rightX + dz * rightZ;
  const angle = Math.atan2(r, f);
  const idx = (Math.round((angle / (Math.PI * 2)) * 8) + 8) % 8;
  return ARROWS[idx]!;
}

export function startApp(): void {
  const params = new URLSearchParams(location.search);
  const autostart = params.get('autostart') === '1';
  let flowVisible = params.get('flow') === '1';
  const rawLevel = params.get('level');
  const startLevelParam: GsrLevelId = LEVEL_ORDER.includes(rawLevel as GsrLevelId)
    ? (rawLevel as GsrLevelId)
    : 'velvet-keys';
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

  const fx = createFx(scene, gsrUi);
  const graffiti = createGraffitiSystem(scene);

  let progress = loadProgress();
  let currentLevelId: GsrLevelId = startLevelParam;
  let doc: GsrLevelDoc = getLevelDoc(currentLevelId);
  let world: WorldVisuals | null = null;
  let markers: MarkerSystem | null = null;
  let rider: RiderView | null = null;
  let skater: SkaterState = createSkater(doc);
  let session: LevelSession = createLevelSession(doc, currentLevelId);
  const chaseCam = createChaseCamera();
  const prevButtons = { jump: false, trick: false, railCooldown: 0 };

  let selectedTagIdx = 0;
  let currentTrackId: GsrTrackId = 'pirate-radio-hub';
  let beatPulse = 0;
  let playing = false;
  let bossHitCooldown = 0;
  let pluckHitCooldown = 0;
  let sentryHitCooldown = 0;

  const helper = createHelperGnome(gsrUi, {
    onUnstuck: () => {
      skater = createSkater(doc);
      chaseCam.yaw = skater.yaw;
      fx.ring(skater.x, skater.y, skater.z, '#69f0ae');
    },
  });

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
    onOpenHelper: () => helper.showHint(currentLevelId, session, true),
    onSelectTag: (idx) => {
      selectedTagIdx = idx % 3;
    },
    onOpenAreas: () => {
      playing = false;
      hud.setVisible(false);
      helper.hide();
      input.setTouchVisible(false);
      titleOverlay.show(progress);
      playTrack('pirate-radio-hub', musicExplorer.getReactiveOverrides());
    },
  });

  function loadSceneForLevel(levelId: GsrLevelId): void {
    currentLevelId = levelId;
    selectedTagIdx = 0;
    doc = getLevelDoc(levelId);
    if (world) {
      scene.remove(world.group);
      world.dispose();
    }
    if (markers) {
      markers.dispose();
    }
    if (rider) {
      scene.remove(rider.root);
      rider.dispose();
    }
    const nextWorld = buildWorldVisuals(doc);
    world = nextWorld;
    world.setFlowVisible(flowVisible);
    scene.add(world.group);
    markers = createMarkerSystem(scene, doc, {
      getBillboardDone: (id) => nextWorld.billboardMeshes.get(id)?.tagged ?? false,
      getInteractiveDone: (id) => nextWorld.interactiveMeshes.get(id)?.consumed ?? false,
      getChasePos: () => {
        if (!nextWorld.pluckNpc) return null;
        const p = nextWorld.pluckNpc.root.position;
        return { x: p.x, y: p.y, z: p.z };
      },
      getSentryStates: () => nextWorld.sentries.map((se) => ({ x: se.root.position.x, y: se.root.position.y, z: se.root.position.z, tagged: se.tagged })),
      getBossPos: () => {
        if (!nextWorld.bossActor) return null;
        const p = nextWorld.bossActor.root.position;
        return { x: p.x, y: p.y, z: p.z };
      },
    });
    rider = createRiderView();
    scene.add(rider.root);
    skater = createSkater(doc);
    session = createLevelSession(doc, levelId);
    chaseCam.yaw = skater.yaw;
    scene.fog = new THREE.FogExp2(doc.data.fogColor, 0.0042);
    helper.resetForLevel(levelId);
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

  loadSceneForLevel(startLevelParam);
  if (autostart) {
    startLevel(startLevelParam);
  } else {
    playTrack('pirate-radio-hub');
  }
  if (openExplorerParam) {
    musicExplorer.open();
  }

  function handleEventCompletion(evId: string, targetId?: string): void {
    const result = advanceEvent(session, evId, targetId);
    if (result.completedNow) {
      const ev = session.events.get(evId);
      if (ev?.def.kind === 'side') {
        void achievements.increment('gsr-side-grooves');
      }
      if (result.line) mutter.say(result.line, ev?.def.kind === 'boss' ? 76 : 112);
      helper.showFact(currentLevelId);
      if (result.bossJustUnlocked) {
        mutter.say('Boss awakened on the main stage!', 82);
        fx.flash('#ff4ecd', 0.25, 0.25);
      }
      if (result.levelJustCleared) {
        if (!progress.completedAreas.includes(currentLevelId)) {
          progress.completedAreas.push(currentLevelId);
        }
        if (currentLevelId === 'velvet-keys') {
          void achievements.unlock('gsr-ivory-encore');
        } else if (currentLevelId === 'bongo-basin') {
          void achievements.unlock('gsr-bongo-king');
        } else if (currentLevelId === 'chrome-kiln') {
          void achievements.unlock('gsr-kiln-breaker');
        } else if (currentLevelId === 'neon-birdbath') {
          void achievements.unlock('gsr-spire-splash');
          progress.area3Teased = true;
          setTimeout(() => {
            playing = false;
            hud.setVisible(false);
            helper.hide();
            input.setTouchVisible(false);
            showArea5Teaser(
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
    if (inp.tagSelect !== null) {
      selectedTagIdx = inp.tagSelect % 3;
    }
    if (inp.cycleTag) {
      selectedTagIdx = (selectedTagIdx + 1) % 3;
    }
    if (inp.helperEdge && playing) {
      helper.showHint(currentLevelId, session, true);
    }
    if (inp.toggleFlow && world) {
      flowVisible = !flowVisible;
      world.setFlowVisible(flowVisible);
    }

    let promptText: string | null = null;
    const tags = REGIONAL_GRAFFITI[currentLevelId];
    const activeTag = tags[selectedTagIdx]!;

    if (playing && !musicExplorer.isOpen() && world && rider) {
      const stepRes = stepSkater(skater, doc, inp.skater, dt, prevButtons);
      if (stepRes.airJumpTriggered) {
        rider.triggerAirJump();
        fx.burst(skater.x, skater.y, skater.z, '#00e5ff', 18);
        fx.ring(skater.x, skater.y, skater.z, '#ff4ecd');
      }
      rider.update(skater, dt);
      chaseCam.update(camera, skater, dt, inp.orbitDeltaX);
      fx.update(skater, dt);
      helper.tick(dt, currentLevelId, session);

      if (stepRes.trickTriggered) {
        hud.slamTrick(stepRes.trickTriggered, skater.comboMult);
        fx.ring(skater.x, skater.y, skater.z, activeTag.primary);
      }
      if (stepRes.landed) {
        fx.ring(skater.x, skater.y, skater.z, '#69f0ae');
      }
      if (stepRes.bankedScore > 0) {
        hud.slamBank(stepRes.bankedScore);
        if (stepRes.bankedScore >= 1200) fx.flash('#ffd740', 0.22, 0.2);
        for (const ev of session.events.values()) {
          if (ev.def.objectiveType === 'rail-combo' && !ev.completed && stepRes.bankedScore >= ev.def.targetCount) {
            handleEventCompletion(ev.def.id);
          }
        }
      }

      let sprayConsumed = false;

      // Billboard spray-tagging
      for (const [id, bb] of world.billboardMeshes) {
        if (bb.tagged) continue;
        const dist = Math.hypot(skater.x - bb.def.x, skater.y - bb.def.y, skater.z - bb.def.z);
        if (dist < 4.5) {
          promptText = `Press SPRAY (F) to tag ${bb.def.gangName} billboard!`;
          if (inp.sprayEdge) {
            sprayConsumed = true;
            world.markBillboardTagged(id, getGraffitiTexture(activeTag));
            rider.triggerSpray(activeTag.primary);
            fx.burst(bb.def.x, bb.def.y + 1.2, bb.def.z, activeTag.primary, 24);
            skater.comboScore += 300;
            skater.comboMult++;
            skater.comboTimer = 2.6;
            hud.slamTrick(activeTag.label, skater.comboMult);
            void achievements.unlock('gsr-first-tag');
            if (bb.def.eventId) handleEventCompletion(bb.def.eventId, id);
          }
        }
      }

      // Interactive world objects
      for (const [id, item] of world.interactiveMeshes) {
        const dist = Math.hypot(skater.x - item.def.x, skater.y - item.def.y, skater.z - item.def.z);
        if ((item.def.kind === 'bongo-pad' || item.def.kind === 'updraft-vent') && dist < 2.3 && skater.vy <= 2.0) {
          skater.vy = item.def.power ?? (item.def.kind === 'updraft-vent' ? 18.5 : 16);
          skater.grounded = false;
          skater.airJumpsLeft = skater.maxAirJumps;
          skater.comboScore += 150;
          skater.comboMult++;
          skater.comboTimer = 2.5;
          skater.lastTrickName = item.def.kind === 'updraft-vent' ? 'Thermal Updraft' : 'Bongo Bounce';
          hud.slamTrick(skater.lastTrickName, skater.comboMult);
          fx.ring(item.def.x, item.def.y + 0.2, item.def.z, activeTag.secondary);
          if (item.def.eventId && !item.consumed) {
            world.markInteractiveDone(id);
            handleEventCompletion(item.def.eventId, id);
          }
        } else if (item.def.kind === 'hydrant' && dist < 2.1 && skater.vy <= 2) {
          skater.vy = item.def.power ?? 16;
          skater.grounded = false;
          skater.airJumpsLeft = skater.maxAirJumps;
          skater.lastTrickName = 'Geyser Launch';
          hud.slamTrick('Geyser Launch', skater.comboMult);
          fx.ring(item.def.x, item.def.y + 0.2, item.def.z, '#00e5ff');
        } else if (item.def.kind === 'spray-pickup' && !item.consumed && dist < 2.0) {
          world.markInteractiveDone(id);
          skater.boost = Math.min(100, skater.boost + 45);
          rider.triggerSpray('#ffd740');
        } else if (item.def.kind === 'tempo-acorn' && !item.consumed && dist < 2.3) {
          world.markInteractiveDone(id);
          rider.triggerSpray('#ffd740');
          if (item.def.eventId) handleEventCompletion(item.def.eventId, id);
        } else if (item.def.kind === 'aerial-ring' && !item.consumed && dist < 3.2) {
          world.markInteractiveDone(id);
          skater.boost = Math.min(100, skater.boost + 30);
          skater.comboScore += 250;
          skater.comboMult++;
          hud.slamTrick('Aerial Ring', skater.comboMult);
          if (item.def.eventId) handleEventCompletion(item.def.eventId, id);
        } else if (
          (item.def.kind === 'relay-dish' || item.def.kind === 'speaker-stack' || item.def.kind === 'boombox') &&
          dist < 3.6
        ) {
          if (!item.consumed) {
            promptText = `Press SPRAY (F) to tune ${item.def.label ?? 'Device'}`;
            if (inp.sprayEdge) {
              sprayConsumed = true;
              world.markInteractiveDone(id);
              rider.triggerSpray('#ff4ecd');
              skater.boost = Math.min(100, skater.boost + 25);
              if (item.def.eventId) handleEventCompletion(item.def.eventId, id);
            }
          }
        }
      }

      // Chase NPC (Pluck / Gus)
      if (world.pluckNpc && pluckHitCooldown <= 0) {
        const pPos = world.pluckNpc.root.position;
        if (Math.hypot(skater.x - pPos.x, skater.y - pPos.y, skater.z - pPos.z) < 3.6) {
          promptText = 'Press SPRAY (F) to tag the Bassist!';
          if (inp.sprayEdge) {
            sprayConsumed = true;
            pluckHitCooldown = 0.8;
            world.pluckNpc.surge = 1.8;
            rider.triggerSpray('#ff4ecd');
            fx.burst(pPos.x, pPos.y + 0.8, pPos.z, '#ff4ecd', 22);
            const chaseEv = [...session.events.values()].find((e) => e.def.objectiveType === 'chase');
            if (chaseEv) handleEventCompletion(chaseEv.def.id);
          }
        }
      }

      // Patrol Sentries (Area 2 Conga Sentries / Area 3 Anvil Patrol)
      if (sentryHitCooldown <= 0) {
        for (const se of world.sentries) {
          if (se.tagged) continue;
          const p = se.root.position;
          if (Math.hypot(skater.x - p.x, skater.y - p.y, skater.z - p.z) < 3.2) {
            promptText = 'Press SPRAY (F) to silence Sentry!';
            if (inp.sprayEdge) {
              sprayConsumed = true;
              se.tagged = true;
              sentryHitCooldown = 0.4;
              rider.triggerSpray('#ff9100');
              const sentryEv = [...session.events.values()].find((e) => e.def.objectiveType === 'sentries');
              if (sentryEv) handleEventCompletion(sentryEv.def.id);
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
              sprayConsumed = true;
              ev.active = true;
              session.activeBanner = { speaker: ev.def.character, text: ev.def.introLine, ttl: 5.5 };
              mutter.say(ev.def.introLine, 118);
            }
          }
        }
      }

      // Ambient NPC proximity lines
      for (const npc of world.ambientNpcs) {
        const d = Math.hypot(skater.x - npc.def.x, skater.y - npc.def.y, skater.z - npc.def.z);
        if (d < 3.4 && elapsed - npc.talkedAt > 12) {
          npc.talkedAt = elapsed;
          session.activeBanner = { speaker: npc.def.name, text: npc.def.line, ttl: 4.5 };
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
            sprayConsumed = true;
            bossHitCooldown = 0.9;
            world.bossActor.hits++;
            rider.triggerSpray('#ffd740');
            fx.burst(bp.x, bp.y + 1.2, bp.z, '#ffd740', 28);
            const bossEv = [...session.events.values()].find((e) => e.def.kind === 'boss');
            if (bossEv) handleEventCompletion(bossEv.def.id);
          }
        }
      }

      // Freeform surface graffiti!
      if (inp.sprayEdge && !sprayConsumed) {
        const hit = graffiti.sprayAt(skater, activeTag, world.group);
        rider.triggerSpray(activeTag.primary);
        fx.burst(hit.x, hit.y, hit.z, activeTag.primary, 14);
        skater.comboScore += 150;
        skater.comboMult++;
        skater.comboTimer = Math.max(skater.comboTimer, 2.4);
        hud.slamTrick(`TAG: ${activeTag.label}`, skater.comboMult);
      }

      if (session.activeBanner) {
        session.activeBanner.ttl -= dt;
        if (session.activeBanner.ttl <= 0) session.activeBanner = null;
      }

      const hype = Math.min(1, 0.3 + skater.comboMult * 0.12);
      world.update(elapsed, beatPulse, session.bossUnlocked && !session.levelCleared, session.bossWavePhase, hype);
      markers?.update(elapsed, beatPulse, session);
      const nearest = markers?.nearestTarget(skater.x, skater.y, skater.z, session);
      const compass = nearest
        ? {
            label: nearest.label,
            kind: nearest.kind,
            dist: nearest.dist,
            arrow: directionArrow(chaseCam.yaw, nearest.x - skater.x, nearest.z - skater.z),
          }
        : null;
      hud.update(doc, skater, session, promptText, tags, selectedTagIdx, compass);
    } else if (world) {
      world.update(elapsed, beatPulse, false, 0, 0.3);
      camera.position.set(Math.sin(elapsed * 0.18) * 48, 22, Math.cos(elapsed * 0.18) * 48);
      camera.lookAt(0, 4, -8);
    }

    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}
