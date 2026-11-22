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
import { createJinglePlayer } from './audio/jingles';
import { createGsrSfx } from './audio/sfx';
import { ALL_CUTSCENES, AREA_CUTSCENES, GAME_INTRO_CUTSCENE } from './data/cutscenes';
import {
  createAudioEffectHandler,
  createCameraEffectHandler,
  createGameEffectDispatcher,
  createHudEffectHandler,
  createRiderAnimEffectHandler,
  createVisualFxEffectHandler,
} from './fx/effectHandlers';
import { createInputController } from './input';
import { getLevelDoc, groundHeightAt, LEVEL_ORDER, sampleSurfaceHeight, type GsrLevelId } from './levels/loader';
import type { GsrLevelDoc } from './levels/schema';
import {
  advanceEvent,
  computeStyleRank,
  createLevelSession,
  loadProgress,
  saveProgress,
  type LevelSession,
  type StyleRank,
} from './game/events';
import { createSkater, stepSkater, type SkaterState } from './sim/skater';
import { syncChassisFromSkater } from './sim/skateVehicle';
import { createCutscenePlayer } from './ui/cutscene';
import { createHelperGnome } from './ui/helperGnome';
import { createHud } from './ui/hud';
import { createMusicExplorer } from './ui/musicExplorer';
import { mountTitleOverlay, showArea5Teaser, showAreaClearSummary } from './ui/title';
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
  const noCutscenes = params.get('nocutscenes') === '1';
  const cutsceneParam = params.get('cutscene');
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
  const jingles = createJinglePlayer(volume);
  const unlockAudio = () => {
    mutter.unlock();
    sfx.unlock();
    jingles.unlock();
  };
  window.addEventListener('pointerdown', unlockAudio, { once: true });
  window.addEventListener('keydown', unlockAudio, { once: true });

  const achievements = createAchievementTracker({ ui: gsrUi });

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.15, 450);

  const hemi = new THREE.HemisphereLight(0xffb3ec, 0x261542, 1.05);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff5d6, 1.35);
  sun.position.set(36, 58, 30);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.bias = -0.0005;
  sun.shadow.camera.left = -75;
  sun.shadow.camera.right = 75;
  sun.shadow.camera.top = 75;
  sun.shadow.camera.bottom = -75;
  sun.shadow.camera.near = 10;
  sun.shadow.camera.far = 190;
  scene.add(sun);
  const rimLight = new THREE.DirectionalLight(0x66d9ff, 0.45);
  rimLight.position.set(-40, 28, -35);
  scene.add(rimLight);

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
  let paused = false;
  let hitstopTimer = 0;
  let bossHitCooldown = 0;
  let bossWaveHitCd = 0;
  let bossWaveDodgeCd = 0;
  let pluckHitCooldown = 0;
  let sentryHitCooldown = 0;
  let skillFlairTimer = 0;

  const unstuckSkater = () => {
    skater = createSkater(doc);
    chaseCam.yaw = skater.yaw;
    fx.ring(skater.x, skater.y, skater.z, '#69f0ae');
  };

  const helper = createHelperGnome(gsrUi, {
    onUnstuck: unstuckSkater,
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

  const cutscene = createCutscenePlayer(gsrUi, { jingles, mutter });

  const titleOverlay = mountTitleOverlay(gsrUi, progress, {
    onPlay: (id) => startLevel(id),
    onOpenMusic: () => musicExplorer.open(),
    onWatchIntro: () => {
      if (!world) return;
      titleOverlay.hide();
      cutscene.play(GAME_INTRO_CUTSCENE, world.gangCrew.getAnchors(), () => {
        progress.introSeen = true;
        saveProgress(progress);
        titleOverlay.show(progress);
      });
    },
    onPlayJingle: (areaId) => {
      jingles.unlock();
      jingles.play(areaId);
    },
  });

  const togglePause = () => {
    if (!playing || cutscene.isActive()) return;
    paused = !paused;
    hud.setPaused(paused);
    input.setTouchVisible(!paused);
  };

  const hud = createHud(gsrUi, {
    volume,
    onOpenMusic: () => musicExplorer.toggle(),
    onOpenHelper: () => helper.showHint(currentLevelId, session, true),
    onSelectTag: (idx) => {
      selectedTagIdx = idx % 3;
      effects.emit({ type: 'tagSwitch' });
    },
    onTogglePause: togglePause,
    onRestart: () => {
      paused = false;
      hud.setPaused(false);
      startLevel(currentLevelId);
    },
    onUnstuck: unstuckSkater,
    onOpenAreas: () => {
      paused = false;
      hud.setPaused(false);
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

  function loadSceneForLevel(levelId: GsrLevelId): WorldVisuals {
    currentLevelId = levelId;
    selectedTagIdx = 0;
    doc = getLevelDoc(levelId);
    graffiti.clear();
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
    rider = createRiderView(scene);
    scene.add(rider.root);
    skater = createSkater(doc);
    session = createLevelSession(doc, levelId);
    paused = false;
    hud.setPaused(false);
    bossWaveHitCd = 0;
    bossWaveDodgeCd = 0;
    chaseCam.yaw = skater.yaw;
    scene.fog = new THREE.FogExp2(doc.data.fogColor, 0.0042);
    helper.resetForLevel(levelId);
    return nextWorld;
  }

  function beginPlay(): void {
    hud.setVisible(true);
    input.setTouchVisible(true);
    playing = true;
    mutter.say(session.activeBanner?.text ?? '', 96);
  }

  function startLevel(levelId: GsrLevelId): void {
    loadSceneForLevel(levelId);
    titleOverlay.hide();
    playTrack(doc.data.trackId, musicExplorer.getReactiveOverrides());
    if (autostart || noCutscenes || !world) {
      beginPlay();
      return;
    }
    playing = false;
    hud.setVisible(false);
    input.setTouchVisible(false);
    const anchors = world.gangCrew.getAnchors();
    if (!progress.introSeen) {
      cutscene.play(GAME_INTRO_CUTSCENE, anchors, () => {
        progress.introSeen = true;
        saveProgress(progress);
        beginPlay();
      });
    } else {
      const crewSpeaker = doc.data.areaNumber % 2 === 0 ? 'Tag' : 'Spin';
      session.activeBanner = {
        speaker: crewSpeaker,
        text: `Area ${doc.data.areaNumber}: ${doc.name} is live! Clear the ${doc.data.events.filter((e) => e.kind === 'story').length} gang events—boss awaits on the main stage!`,
        ttl: 5.5,
      };
      beginPlay();
    }
  }

  const initialWorld = loadSceneForLevel(startLevelParam);
  const requestedCutscene = cutsceneParam ? ALL_CUTSCENES.find((c) => c.id === cutsceneParam) : undefined;
  if (requestedCutscene) {
    titleOverlay.hide();
    hud.setVisible(false);
    input.setTouchVisible(false);
    playTrack(doc.data.trackId);
    cutscene.play(requestedCutscene, initialWorld.gangCrew.getAnchors(), () => {
      titleOverlay.show(progress);
      playTrack('pirate-radio-hub');
    });
  } else if (autostart) {
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
      if (result.line) {
        mutter.say(result.line, ev?.def.kind === 'boss' ? 76 : 112);
        if (ev) world?.showSpeechBubble(ev.def.id, ev.def.character, result.line, 5.0);
      }
      helper.showFact(currentLevelId);
      if (result.bossJustUnlocked) {
        effects.emit({ type: 'bossUnlock' });
        if (!autostart && !noCutscenes && world) {
          playing = false;
          hud.setVisible(false);
          input.setTouchVisible(false);
          cutscene.play(AREA_CUTSCENES[currentLevelId].bossIntro, world.gangCrew.getAnchors(), () => {
            hud.setVisible(true);
            input.setTouchVisible(true);
            playing = true;
          });
        } else {
          mutter.say('Boss awakened on the main stage!', 82);
        }
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
        }
        const sideEvs = [...session.events.values()].filter((e) => e.def.kind === 'side');
        const sideCleared = sideEvs.filter((e) => e.completed).length;
        const finalScore = skater.totalScore + skater.comboScore * skater.comboMult;
        const rank = computeStyleRank(finalScore, skater.maxCombo, sideCleared);
        const prevBest = progress.bestScores[currentLevelId] ?? 0;
        const isNewBest = finalScore > prevBest;
        if (isNewBest) progress.bestScores[currentLevelId] = finalScore;
        const rankOrder: Record<StyleRank, number> = { S: 4, A: 3, B: 2, C: 1 };
        const prevRank = progress.bestRanks[currentLevelId];
        if (!prevRank || rankOrder[rank] > rankOrder[prevRank]) {
          progress.bestRanks[currentLevelId] = rank;
        }
        saveProgress(progress);

        const nextAreaId: GsrLevelId | null =
          currentLevelId === 'velvet-keys'
            ? 'bongo-basin'
            : currentLevelId === 'bongo-basin'
            ? 'chrome-kiln'
            : currentLevelId === 'chrome-kiln'
            ? 'neon-birdbath'
            : null;

        const openNextOrTeaser = () => {
          if (nextAreaId) startLevel(nextAreaId);
          else {
            playing = false;
            hud.setVisible(false);
            helper.hide();
            input.setTouchVisible(false);
            showArea5Teaser(
              gsrUi,
              () => musicExplorer.open(),
              () => titleOverlay.show(progress),
            );
          }
        };

        const finishArea = () => {
          playing = false;
          hud.setVisible(false);
          helper.hide();
          input.setTouchVisible(false);
          sfx.rankFanfare();
          showAreaClearSummary(
            gsrUi,
            {
              areaNumber: doc.data.areaNumber,
              areaName: doc.name,
              score: finalScore,
              isNewBest,
              maxCombo: skater.maxCombo,
              onBeatCount: skater.onBeatCount,
              sideCleared,
              sideTotal: sideEvs.length,
              rank,
              hasNextArea: nextAreaId !== null,
            },
            {
              onNextArea: openNextOrTeaser,
              onReplay: () => startLevel(currentLevelId),
              onAreas: () => {
                titleOverlay.show(progress);
                playTrack('pirate-radio-hub', musicExplorer.getReactiveOverrides());
              },
            },
          );
        };

        if (!autostart && !noCutscenes && world) {
          setTimeout(() => {
            playing = false;
            hud.setVisible(false);
            helper.hide();
            input.setTouchVisible(false);
            cutscene.play(AREA_CUTSCENES[currentLevelId].bossDefeat, world!.gangCrew.getAnchors(), finishArea);
          }, 900);
        } else {
          setTimeout(finishArea, 1200);
        }
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
    bossWaveHitCd = Math.max(0, bossWaveHitCd - dt);
    bossWaveDodgeCd = Math.max(0, bossWaveDodgeCd - dt);
    pluckHitCooldown = Math.max(0, pluckHitCooldown - dt);
    sentryHitCooldown = Math.max(0, sentryHitCooldown - dt);
    skillFlairTimer = Math.max(0, skillFlairTimer - dt);

    const inp = input.poll(chaseCam.yaw);
    if (inp.pauseEdge && playing && !cutscene.isActive() && !musicExplorer.isOpen()) {
      togglePause();
    }
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
    if (inp.helperEdge && playing && !paused) {
      helper.showHint(currentLevelId, session, true);
    }
    if (inp.toggleFlow && world) {
      flowVisible = !flowVisible;
      world.setFlowVisible(flowVisible);
    }

    let promptText: string | null = null;
    const sprayVerb = inp.isTouch ? 'Tap SPRAY' : 'Press SPRAY (F)';
    const tags = REGIONAL_GRAFFITI[currentLevelId];
    const activeTag = tags[selectedTagIdx]!;

    const isPlaying = playing && !paused && !cutscene.isActive() && !musicExplorer.isOpen() && !!world && !!rider;
    effects.tick(dt, { skater, beatPulse, playing: isPlaying });

    if (isPlaying && world && rider) {
      const inHitstop = hitstopTimer > 0;
      if (inHitstop) {
        hitstopTimer = Math.max(0, hitstopTimer - dt);
      }
      const stepRes = inHitstop
        ? {
            landed: false,
            landImpact: 0,
            bankedScore: 0,
            bounced: false,
            trickTriggered: null,
            trickAnim: null,
            jumpTriggered: false,
            airJumpTriggered: false,
            wallKickTriggered: false,
            boostStarted: false,
            bumped: false,
            wallRideStarted: false,
            grindStarted: false,
            danceStarted: null,
          }
        : stepSkater(skater, doc, inp.skater, dt, prevButtons);

      const onBeatNow = beatPulse > 0.62;
      if (stepRes.jumpTriggered) effects.emit({ type: 'jump' });
      if (stepRes.airJumpTriggered) effects.emit({ type: 'airJump', x: skater.x, y: skater.y, z: skater.z });
      if (stepRes.wallKickTriggered) effects.emit({ type: 'wallKick', x: skater.x, y: skater.y, z: skater.z });
      if (stepRes.grindStarted) effects.emit({ type: 'grindStart' });
      if (stepRes.wallRideStarted) effects.emit({ type: 'wallRideStart' });
      if (stepRes.boostStarted) effects.emit({ type: 'boostStart' });
      if (stepRes.bumped) effects.emit({ type: 'bump' });
      if (stepRes.danceStarted) {
        sfx.dancePop();
        if (stepRes.danceStarted === 'airfreeze') fx.ring(skater.x, skater.y, skater.z, '#00e5ff');
      }
      const surfY = sampleSurfaceHeight(doc, skater.x, skater.z, skater.y);
      rider.update(skater, dt, beatPulse, surfY);
      chaseCam.update(camera, skater, dt, inp.orbitDeltaX, (x, z) => groundHeightAt(doc, x, z));
      fx.update(skater, dt);
      helper.tick(dt, currentLevelId, session);

      if (stepRes.trickTriggered) {
        if (skater.comboMult >= 4) skillFlairTimer = Math.max(skillFlairTimer, 4.5);
        if (onBeatNow) {
          skater.comboScore += 50;
          skater.onBeatCount++;
          effects.emit({ type: 'onBeat' });
        }
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
          onBeat: onBeatNow,
        });
      }
      if (stepRes.landed) {
        effects.emit({ type: 'land', x: skater.x, y: skater.y, z: skater.z, impact: stepRes.landImpact });
      }
      if (stepRes.bankedScore > 0) {
        if (stepRes.bankedScore >= 1000) skillFlairTimer = Math.max(skillFlairTimer, 4.5);
        if (stepRes.bankedScore >= 1500) hitstopTimer = Math.max(hitstopTimer, 0.045);
        effects.emit({ type: 'bankScore', points: stepRes.bankedScore });
        for (const ev of session.events.values()) {
          if (ev.def.objectiveType === 'rail-combo' && !ev.completed && stepRes.bankedScore >= ev.def.targetCount) {
            handleEventCompletion(ev.def.id);
          }
        }
      }

      let sprayConsumed = false;

      // Billboard spray-tagging (always sprays the board when standing nearby, even to re-tag)
      for (const [id, bb] of world.billboardMeshes) {
        const horiz = Math.hypot(skater.x - bb.def.x, skater.z - bb.def.z);
        const vert = Math.abs(skater.y - bb.def.y);
        if (horiz < 5.5 && vert < 4.5) {
          promptText = bb.tagged
            ? `${sprayVerb} to re-tag ${bb.def.gangName} billboard!`
            : `${sprayVerb} to tag ${bb.def.gangName} billboard!`;
          if (inp.sprayEdge) {
            sprayConsumed = true;
            skater.yaw = Math.atan2(bb.def.x - skater.x, bb.def.z - skater.z);
            if (skater.grounded && skater.chassis) {
              syncChassisFromSkater(skater.chassis, skater.x, skater.y, skater.z, skater.vx, skater.vz, skater.yaw);
            }
            hitstopTimer = Math.max(hitstopTimer, 0.045);
            const wasTagged = bb.tagged;
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
            skater.comboScore += (wasTagged ? 180 : 300) + (onBeatNow ? 50 : 0);
            skater.comboMult++;
            skater.comboTimer = 2.6;
            if (onBeatNow) {
              skater.onBeatCount++;
              effects.emit({ type: 'onBeat' });
            }
            if (skater.comboMult >= 3) skillFlairTimer = Math.max(skillFlairTimer, 4.5);
            hud.slamTrick(activeTag.label, skater.comboMult, onBeatNow);
            void achievements.unlock('gsr-first-tag');
            if (!wasTagged && bb.def.eventId) handleEventCompletion(bb.def.eventId, id);
          }
          break;
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
            promptText = `${sprayVerb} to tune ${item.def.label ?? 'Device'}`;
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
          promptText = `${sprayVerb} to tag the Bassist!`;
          if (inp.sprayEdge) {
            sprayConsumed = true;
            hitstopTimer = Math.max(hitstopTimer, 0.045);
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
            promptText = `${sprayVerb} to silence Sentry!`;
            if (inp.sprayEdge) {
              sprayConsumed = true;
              hitstopTimer = Math.max(hitstopTimer, 0.045);
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
            promptText = `${sprayVerb} to talk to ${ev.def.character}`;
            if (inp.sprayEdge) {
              sprayConsumed = true;
              ev.active = true;
              world.showSpeechBubble(ev.def.id, ev.def.character, ev.def.introLine, 5.5);
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
          world.showSpeechBubble(npc.def.id, npc.def.name, npc.def.line, 4.5);
        }
      }

      // Skating gang crew shoutouts when player skates nearby
      world.gangCrew.checkShoutouts(skater.x, skater.y, skater.z, elapsed, (id, speaker, line, hz) => {
        world?.showSpeechBubble(id, speaker, line, 4.5);
        mutter.say(line, hz);
      });

      // Boss encounter + interactive bass shockwave
      if (session.bossUnlocked && !session.levelCleared && world.bossActor) {
        session.bossWavePhase += dt * 0.55;
        const bp = world.bossActor.root.position;
        const dx = skater.x - bp.x;
        const dz = skater.z - bp.z;
        const distXZ = Math.hypot(dx, dz);
        const dist = Math.hypot(dx, skater.y - bp.y, dz);

        const waveR = (1 + (session.bossWavePhase % 1) * 5.2) * 1.8;
        if (Math.abs(distXZ - waveR) < 1.1 && distXZ > 0.5) {
          const dy = skater.y - bp.y;
          if (dy < 1.15 && bossWaveHitCd <= 0) {
            bossWaveHitCd = 1.3;
            skater.vx += (dx / distXZ) * 11;
            skater.vz += (dz / distXZ) * 11;
            skater.vy = 4.5;
            skater.grounded = false;
            effects.emit({ type: 'bump' });
          } else if (dy >= 1.15 && dy < 6.5 && bossWaveDodgeCd <= 0) {
            bossWaveDodgeCd = 1.5;
            skater.comboScore += 200;
            skater.comboMult++;
            skater.comboTimer = 2.6;
            skater.maxCombo = Math.max(skater.maxCombo, skater.comboMult);
            hud.slamTrick('Bass Wave Dodge', skater.comboMult, beatPulse > 0.62);
          }
        }

        if (dist < 4.8 && bossHitCooldown <= 0) {
          promptText = `${sprayVerb} to tag the Boss!`;
          if (inp.sprayEdge) {
            sprayConsumed = true;
            hitstopTimer = Math.max(hitstopTimer, 0.045);
            bossHitCooldown = 0.9;
            world.bossActor.hits++;
            world.triggerBossHit();
            effects.emit({ type: 'bossHit', x: bp.x, y: bp.y + 1.2, z: bp.z });
            const bossEv = [...session.events.values()].find((e) => e.def.kind === 'boss');
            if (bossEv) {
              handleEventCompletion(bossEv.def.id);
              session.bossHp = Math.max(0, session.bossMaxHp - bossEv.progress);
              if (!bossEv.completed) {
                session.activeBanner = {
                  speaker: bossEv.def.character,
                  text: bossEv.progress === 1
                    ? 'Direct hit?! Watch the bass shockwave, street-skater!'
                    : 'One more tag and the frequency flips—bring it on!',
                  ttl: 3.5,
                };
              }
            }
          }
        }
      }

      // Freeform surface graffiti (only when grounded, wall-riding, or grinding — never mid-air!)
      if (inp.sprayEdge && !sprayConsumed && (skater.grounded || skater.wallRiding || skater.grinding)) {
        const hit = graffiti.sprayAt(skater, activeTag, world.group);
        if (hit.hit) {
          effects.emit({ type: 'spray', isTarget: false, x: hit.x, y: hit.y, z: hit.z, color: activeTag.primary, count: 14, shake: 0.08, shakeDur: 0.1 });
          skater.comboScore += 150;
          skater.comboMult++;
          skater.comboTimer = Math.max(skater.comboTimer, 2.4);
          hud.slamTrick(`TAG: ${activeTag.label}`, skater.comboMult);
        }
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
      hud.update(doc, skater, session, promptText, tags, selectedTagIdx, compass, beatPulse);
    } else if (world) {
      world.update(elapsed, beatPulse, false, 0, 0.3);
      if (cutscene.isActive()) {
        cutscene.updateCamera(camera, dt, beatPulse);
      } else {
        camera.position.set(Math.sin(elapsed * 0.18) * 48, 22, Math.cos(elapsed * 0.18) * 48);
        camera.lookAt(0, 4, -8);
      }
    }

    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}
