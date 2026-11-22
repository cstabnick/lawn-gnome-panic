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
import { createGsrSfx } from './audio/sfx';
import {
  createAudioEffectHandler,
  createCameraEffectHandler,
  createGameEffectDispatcher,
  createHudEffectHandler,
  createRiderAnimEffectHandler,
  createVisualFxEffectHandler,
} from './fx/effectHandlers';
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
  const sfx = createGsrSfx(volume);
  const unlockAudio = () => {
    mutter.unlock();
    sfx.unlock();
  };
  window.addEventListener('pointerdown', unlockAudio, { once: true });
  window.addEventListener('keydown', unlockAudio, { once: true });

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
  let skillFlairTimer = 0;

  const helper = createHelperGnome(gsrUi, {
    onUnstuck: () => {
      skater = createSkater(doc);
      chaseCam.yaw = skater.yaw;
      fx.ring(skater.x, skater.y, skater.z, '#69f0ae');
    },
  });

  function playTrack(id: GsrTrackId, _overrides: GsrMusicOptions | null = null): void {
    currentTrackId = id;
    playSong((T, keep, out) =>
      buildGnomeSetRadioTrack(T, keep, out, id, 1, {
        grinding: () => musicExplorer.getReactiveOverrides()?.grinding?.() ?? skater.grinding,
        air: () => musicExplorer.getReactiveOverrides()?.air?.() ?? (!skater.grounded && !skater.grinding),
        boss: () => musicExplorer.getReactiveOverrides()?.boss?.() ?? (session.bossUnlocked && !session.levelCleared),
        skillPeak: () => musicExplorer.getReactiveOverrides()?.skillPeak?.() ?? (skater.comboMult >= 4 || skillFlairTimer > 0),
        hype: () => musicExplorer.getReactiveOverrides()?.hype?.() ?? Math.min(1, 0.3 + skater.comboMult * 0.12),
        onBeat(step, _bar, section) {
          if (step % 4 === 0) beatPulse = 1;
          musicExplorer.onBeat(step, section);
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
      effects.emit({ type: 'tagSwitch' });
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

  const effects = createGameEffectDispatcher([
    createAudioEffectHandler(sfx),
    createCameraEffectHandler(chaseCam),
    createVisualFxEffectHandler(fx),
    createRiderAnimEffectHandler(() => rider),
    createHudEffectHandler(hud),
  ]);

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
        effects.emit({ type: 'bossUnlock' });
        mutter.say('Boss awakened on the main stage!', 82);
      } else if (!result.levelJustCleared) {
        effects.emit({ type: 'eventComplete' });
      }
      if (result.levelJustCleared) {
        effects.emit({ type: 'levelClear' });
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
    skillFlairTimer = Math.max(0, skillFlairTimer - dt);

    const inp = input.poll(chaseCam.yaw);
    if (inp.toggleExplorer) {
      musicExplorer.toggle();
    }
    if (inp.tagSelect !== null) {
      selectedTagIdx = inp.tagSelect % 3;
      effects.emit({ type: 'tagSwitch' });
    }
    if (inp.cycleTag) {
      selectedTagIdx = (selectedTagIdx + 1) % 3;
      effects.emit({ type: 'tagSwitch' });
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

    const isPlaying = playing && !musicExplorer.isOpen() && !!world && !!rider;
    effects.tick(dt, { skater, beatPulse, playing: isPlaying });

    if (isPlaying && world && rider) {
      const stepRes = stepSkater(skater, doc, inp.skater, dt, prevButtons);
      if (stepRes.jumpTriggered) effects.emit({ type: 'jump' });
      if (stepRes.airJumpTriggered) effects.emit({ type: 'airJump', x: skater.x, y: skater.y, z: skater.z });
      if (stepRes.grindStarted) effects.emit({ type: 'grindStart' });
      if (stepRes.wallRideStarted) effects.emit({ type: 'wallRideStart' });
      if (stepRes.boostStarted) effects.emit({ type: 'boostStart' });
      if (stepRes.bumped) effects.emit({ type: 'bump' });
      rider.update(skater, dt, beatPulse);
      chaseCam.update(camera, skater, dt, inp.orbitDeltaX);
      fx.update(skater, dt);
      helper.tick(dt, currentLevelId, session);

      if (stepRes.trickTriggered) {
        if (skater.comboMult >= 4) skillFlairTimer = Math.max(skillFlairTimer, 4.5);
        effects.emit({
          type: 'trick',
          name: stepRes.trickTriggered,
          anim: stepRes.trickAnim,
          mult: skater.comboMult,
          x: skater.x,
          y: skater.y,
          z: skater.z,
          color: activeTag.primary,
          skipAnim: stepRes.airJumpTriggered,
        });
      }
      if (stepRes.landed) {
        effects.emit({ type: 'land', x: skater.x, y: skater.y, z: skater.z, impact: stepRes.landImpact });
      }
      if (stepRes.bankedScore > 0) {
        if (stepRes.bankedScore >= 1000) skillFlairTimer = Math.max(skillFlairTimer, 4.5);
        effects.emit({ type: 'bankScore', points: stepRes.bankedScore });
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
            effects.emit({
              type: 'spray',
              isTarget: true,
              x: bb.def.x,
              y: bb.def.y + 1.2,
              z: bb.def.z,
              color: activeTag.primary,
              count: 24,
              celebrate: true,
              shake: 0.22,
              shakeDur: 0.2,
            });
            skater.comboScore += 300;
            skater.comboMult++;
            skater.comboTimer = 2.6;
            if (skater.comboMult >= 3) skillFlairTimer = Math.max(skillFlairTimer, 4.5);
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
          effects.emit({ type: 'bounce', kind: item.def.kind, x: item.def.x, y: item.def.y + 0.2, z: item.def.z, color: activeTag.secondary });
          skater.vy = item.def.power ?? (item.def.kind === 'updraft-vent' ? 18.5 : 16);
          skater.grounded = false;
          skater.airJumpsLeft = skater.maxAirJumps;
          skater.comboScore += 150;
          skater.comboMult++;
          skater.comboTimer = 2.5;
          skater.lastTrickName = item.def.kind === 'updraft-vent' ? 'Thermal Updraft' : 'Bongo Bounce';
          hud.slamTrick(skater.lastTrickName, skater.comboMult);
          if (item.def.eventId && !item.consumed) {
            world.markInteractiveDone(id);
            handleEventCompletion(item.def.eventId, id);
          }
        } else if (item.def.kind === 'hydrant' && dist < 2.1 && skater.vy <= 2) {
          effects.emit({ type: 'bounce', kind: 'hydrant', x: item.def.x, y: item.def.y + 0.2, z: item.def.z, color: '#00e5ff' });
          skater.vy = item.def.power ?? 16;
          skater.grounded = false;
          skater.airJumpsLeft = skater.maxAirJumps;
          skater.lastTrickName = 'Geyser Launch';
          hud.slamTrick('Geyser Launch', skater.comboMult);
        } else if (item.def.kind === 'spray-pickup' && !item.consumed && dist < 2.0) {
          effects.emit({ type: 'pickup', kind: 'spray-pickup' });
          world.markInteractiveDone(id);
          skater.boost = Math.min(100, skater.boost + 45);
        } else if (item.def.kind === 'tempo-acorn' && !item.consumed && dist < 2.3) {
          effects.emit({ type: 'pickup', kind: 'tempo-acorn' });
          world.markInteractiveDone(id);
          if (item.def.eventId) handleEventCompletion(item.def.eventId, id);
        } else if (item.def.kind === 'aerial-ring' && !item.consumed && dist < 3.2) {
          effects.emit({ type: 'pickup', kind: 'aerial-ring' });
          world.markInteractiveDone(id);
          skater.boost = Math.min(100, skater.boost + 30);
          skater.comboScore += 250;
          skater.comboMult++;
          if (skater.comboMult >= 3) skillFlairTimer = Math.max(skillFlairTimer, 4.5);
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
              effects.emit({ type: 'spray', isTarget: true, x: item.def.x, y: item.def.y + 0.8, z: item.def.z, color: '#ff4ecd', count: 16, celebrate: true, shake: 0.16, shakeDur: 0.16 });
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
            effects.emit({ type: 'spray', isTarget: true, x: pPos.x, y: pPos.y + 0.8, z: pPos.z, color: '#ff4ecd', count: 22, shake: 0.18, shakeDur: 0.16 });
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
              effects.emit({ type: 'spray', isTarget: true, x: p.x, y: p.y + 0.8, z: p.z, color: '#ff9100', count: 16, shake: 0.18, shakeDur: 0.16 });
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
            effects.emit({ type: 'spray', isTarget: true, x: bp.x, y: bp.y + 1.2, z: bp.z, color: '#ffd740', count: 28, shake: 0.28, shakeDur: 0.22 });
            const bossEv = [...session.events.values()].find((e) => e.def.kind === 'boss');
            if (bossEv) handleEventCompletion(bossEv.def.id);
          }
        }
      }

      // Freeform surface graffiti!
      if (inp.sprayEdge && !sprayConsumed) {
        const hit = graffiti.sprayAt(skater, activeTag, world.group);
        effects.emit({ type: 'spray', isTarget: false, x: hit.x, y: hit.y, z: hit.z, color: activeTag.primary, count: 14, shake: 0.08, shakeDur: 0.1 });
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
