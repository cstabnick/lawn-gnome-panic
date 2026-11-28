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
import { getMyGnome } from '@lawn/gnome';
import { whileHidden } from '@lawn/mp/background';
import { ROOM_CODE_RE } from '@lawn/mp/protocol';
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
import {
  activeAreaAt,
  checkVoidRescue,
  getMegaLocalDoc,
  MEGA_WORLD_OFFSETS,
  sampleMegaGroundY,
} from './levels/megaWorld';
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
import { advanceBossWaypoint, createBossBattle, stepBossBattle, type BossBattleState } from './game/bossBattle';
import { createSkater, stepSkater, type SkaterState } from './sim/skater';
import { createLevelGroundProbe, syncChassisFromSkater } from './sim/skateVehicle';
import { createCutscenePlayer } from './ui/cutscene';
import { createHelperGnome } from './ui/helperGnome';
import { createHud } from './ui/hud';
import { createMusicExplorer } from './ui/musicExplorer';
import { createArchipelagoMap } from './ui/archipelagoMap';
import { createLocationToast } from './ui/locationToast';
import { createRadioTicker } from './ui/radioTicker';
import { createShopModal } from './ui/shopModal';
import { mountTitleOverlay, showFinaleEncoreModal, showAreaClearSummary } from './ui/title';
import { getArchipelagoNode } from './data/archipelago';
import { COMPETITIONS } from './data/competitions';
import {
  createCompetitionRun,
  isBetterMedal,
  stepCompetitionRun,
  type CompetitionRun,
} from './game/competitions';
import { applyRegionalLighting } from './view/atmosphere';
import { createChaseCamera } from './view/camera';
import { createFx } from './view/fx';
import { createGraffitiSystem, getGraffitiTexture, REGIONAL_GRAFFITI } from './view/graffiti';
import { createMarkerSystem, type MarkerSystem } from './view/markers';
import { createRiderView, type RiderView } from './view/rider';
import { createRemoteRiders } from './view/remoteRiders';
import { buildTransitCableCurve } from './view/transitGates';
import { buildMegaWorldView, type MegaWorldView } from './view/megaWorldView';
import { type WorldVisuals } from './view/world';
import { createGsrNet } from './net/client';

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

  const transitFadeEl = document.createElement('div');
  transitFadeEl.id = 'gsr-transit-fade';
  transitFadeEl.style.cssText =
    'position:fixed; inset:0; z-index:45; background:#090314; opacity:0; pointer-events:none;';
  gsrUi.appendChild(transitFadeEl);

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
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.15, 900);

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
  const remoteRiders = createRemoteRiders(scene);
  const radioTicker = createRadioTicker(gsrUi);
  const locationToast = createLocationToast(gsrUi);
  const discoveredRoofs = new Set<string>();
  let pendingArrivalNote: string | null = null;

  let progress = loadProgress();
  let currentLevelId: GsrLevelId = startLevelParam;
  let doc: GsrLevelDoc = getLevelDoc(currentLevelId);
  const megaWorld: MegaWorldView = buildMegaWorldView(currentLevelId);
  megaWorld.setFlowVisible(flowVisible);
  scene.add(megaWorld.group);
  for (const w of megaWorld.islands.values()) {
    for (const vId of progress.collectedVinyls) {
      w.markVinylCollected(vId);
    }
  }
  const sessions = new Map<GsrLevelId, LevelSession>();
  const bossBattles = new Map<GsrLevelId, BossBattleState>();
  for (const id of LEVEL_ORDER) {
    const d = getLevelDoc(id);
    sessions.set(id, createLevelSession(d, id));
    bossBattles.set(id, createBossBattle(id, d));
  }
  let world: WorldVisuals | null = megaWorld.islands.get(currentLevelId) ?? null;
  let markers: MarkerSystem | null = null;
  let rider: RiderView | null = createRiderView(scene);
  scene.add(rider.root);
  rider.setCosmetics({ trailId: progress.equippedTrail, rideId: progress.equippedRide });
  fx.setTrailStyle(progress.equippedTrail, doc.data.accentColor);
  let skater: SkaterState = createSkater(doc);
  let session: LevelSession = sessions.get(currentLevelId)!;
  let bossBattle: BossBattleState = bossBattles.get(currentLevelId)!;
  const chaseCam = createChaseCamera();
  const prevButtons = { jump: false, trick: false, railCooldown: 0, boost: false };

  const applyCosmetics = () => {
    rider?.setCosmetics({ trailId: progress.equippedTrail, rideId: progress.equippedRide });
    fx.setTrailStyle(progress.equippedTrail, doc.data.accentColor);
  };

  const shopModal = createShopModal(gsrUi, {
    onBuy(item) {
      if (progress.tokens < item.cost || progress.ownedCosmetics.includes(item.id)) return;
      progress.tokens -= item.cost;
      progress.ownedCosmetics.push(item.id);
      if (item.category === 'trail') progress.equippedTrail = item.id;
      else progress.equippedRide = item.id;
      saveProgress(progress);
      applyCosmetics();
      sfx.rankFanfare();
    },
    onEquip(item, category) {
      if (category === 'trail') progress.equippedTrail = item ? item.id : null;
      else progress.equippedRide = item ? item.id : null;
      saveProgress(progress);
      applyCosmetics();
      sfx.tagSwitch();
    },
  });

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
  let trickMusicPulse = false;
  let activeComp: CompetitionRun | null = null;
  let scratchPadCd = 0;
  let smoothedHype = 0.3;
  let smoothedComboMult = 1;
  let unmultipliedEnergy = 0;
  let currentBpm = 120;

  type TransitState =
    | { phase: 'ride'; t: number; dur: number; fadeStart: number; targetId: GsrLevelId; curve: THREE.CatmullRomCurve3 }
    | { phase: 'fade-to-cutscene'; t: number; dur: number }
    | { phase: 'fade-to-player-out'; t: number; dur: number; onBlack: () => void }
    | { phase: 'fade-to-player-in'; t: number; dur: number };
  let transit: TransitState | null = null;
  const setTransitFade = (alpha: number): void => {
    const clamped = Math.max(0, Math.min(1, alpha));
    transitFadeEl.style.opacity = clamped.toFixed(3);
  };
  const transitPosTmp = new THREE.Vector3();
  const transitTanTmp = new THREE.Vector3();
  const transitCamPosTmp = new THREE.Vector3();
  const transitCamLookTmp = new THREE.Vector3();
  const transitRightTmp = new THREE.Vector3();

  const unstuckSkater = () => {
    const [ox, oy, oz] = MEGA_WORLD_OFFSETS[currentLevelId];
    skater = createSkater(doc);
    skater.x += ox;
    skater.y += oy;
    skater.z += oz;
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
        skillPeak: () => musicExplorer.getReactiveOverrides()?.skillPeak?.() ?? (smoothedComboMult >= 3.5 || skillFlairTimer > 0),
        hype: () => musicExplorer.getReactiveOverrides()?.hype?.() ?? smoothedHype,
        wallRiding: () => skater.wallRiding,
        comboTier: () => {
          const m = Math.round(smoothedComboMult);
          return m >= 7 ? 3 : m >= 4 ? 2 : m >= 2 ? 1 : 0;
        },
        speedNorm: () => Math.min(1, skater.speedKmh / 90),
        trickPulse: () => {
          const v = trickMusicPulse;
          trickMusicPulse = false;
          return v;
        },
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

  const formatNetLabel = (status: string, count: number, room: string | null): string => {
    if (status === 'online') return room ? `🌐 ${room} (${count})` : `🌐 Online (${count})`;
    if (status === 'connecting') return '🌐 Connecting…';
    if (status === 'retrying') return '🌐 Reconnecting…';
    return '🌐 Solo';
  };

  const rawRoom = (params.get('room') ?? '').toUpperCase().trim();
  const initialRoom = ROOM_CODE_RE.test(rawRoom) ? rawRoom : null;
  const offlineMode = params.get('offline') === '1';

  const net = createGsrNet({
    onStatus(status, count, room) {
      const label = formatNetLabel(status, count, room);
      titleOverlay.setNetLabel(label);
      hud.setNetLabel(label);
    },
    onPeerJoin(peer) {
      remoteRiders.addOrUpdatePeer(peer);
    },
    onPeerLeave(id) {
      remoteRiders.removePeer(id);
    },
    onPeerPose(id, area, p, sentAt) {
      remoteRiders.pushPose(id, area, p, sentAt);
    },
    onPeerTrick(id, area, kind) {
      remoteRiders.triggerTrick(id, area, kind);
    },
    onPeerSpray(_id, area, x, y, z, tagId, bbId) {
      if (area !== currentLevelId || !world) return;
      const design = REGIONAL_GRAFFITI[area].find((t) => t.id === tagId) ?? REGIONAL_GRAFFITI[area][0]!;
      if (bbId && world.billboardMeshes.has(bbId)) {
        world.markBillboardTagged(bbId, getGraffitiTexture(design));
      }
      fx.ring(x, y, z, design.primary);
    },
    onReset() {
      remoteRiders.clear();
    },
  });

  const openRoomModal = () => {
    document.getElementById('gsr-room-modal')?.remove();
    const modal = document.createElement('div');
    modal.id = 'gsr-room-modal';
    modal.style.cssText = `
      position:fixed; inset:0; z-index:50; display:flex; align-items:center; justify-content:center;
      background:rgba(10,4,22,0.86); padding:16px; pointer-events:auto; font-family:system-ui,sans-serif;
    `;
    modal.innerHTML = `
      <div style="width:min(400px, 94vw); background:#180b2e; border:3px solid #69f0ae; border-radius:16px; padding:18px; color:#fff; display:flex; flex-direction:column; gap:10px; box-shadow:0 20px 60px rgba(0,0,0,0.8);">
        <div style="font-size:11px; font-weight:900; color:#69f0ae; letter-spacing:1px;">ONLINE SKATE LOBBY</div>
        <div style="font-size:18px; font-weight:900; color:#ffd740;">BROADCAST ARCHIPELAGO</div>
        <div style="font-size:12px; color:#d8c9f2;">Status: <b>${formatNetLabel(net.status, net.playerCount, net.roomCode)}</b></div>
        <input id="gsr-room-input" type="text" maxlength="8" placeholder="Room code (4-8 A-Z / 0-9)" value="${net.roomCode ?? ''}" style="min-height:44px; padding:8px 12px; border-radius:10px; border:2px solid #554275; background:#120624; color:#fff; font-weight:800; text-transform:uppercase;" />
        <div style="display:flex; gap:8px; flex-wrap:wrap;">
          <button id="gsr-room-join" style="flex:1; min-height:44px; border-radius:10px; border:none; background:#69f0ae; color:#120624; font-weight:900; cursor:pointer;">Join Room</button>
          <button id="gsr-room-pub" style="flex:1; min-height:44px; border-radius:10px; border:2px solid #00e5ff; background:#142847; color:#fff; font-weight:800; cursor:pointer;">Public Lobby</button>
        </div>
        <button id="gsr-room-close" style="min-height:44px; border-radius:10px; border:1px solid #554275; background:#241145; color:#fff; font-weight:700; cursor:pointer;">Close</button>
      </div>
    `;
    gsrUi.appendChild(modal);
    const inputEl = modal.querySelector('#gsr-room-input') as HTMLInputElement;
    modal.querySelector('#gsr-room-join')?.addEventListener('click', () => {
      const code = inputEl.value.toUpperCase().trim();
      if (!ROOM_CODE_RE.test(code)) {
        inputEl.style.borderColor = '#ff5252';
        return;
      }
      net.switchRoom(code);
      modal.remove();
    });
    modal.querySelector('#gsr-room-pub')?.addEventListener('click', () => {
      net.switchRoom(null);
      modal.remove();
    });
    modal.querySelector('#gsr-room-close')?.addEventListener('click', () => modal.remove());
  };

  const archipelagoMap = createArchipelagoMap(gsrUi, {
    onTravel: (id) => startLevel(id),
  });

  const titleOverlay = mountTitleOverlay(gsrUi, progress, {
    onPlay: (id) => startLevel(id),
    onOpenMusic: () => musicExplorer.open(),
    onOpenMap: () => archipelagoMap.open(currentLevelId, progress),
    onOpenRoom: openRoomModal,
    onWatchIntro: () => {
      if (!world) return;
      titleOverlay.hide();
      cutscene.play(GAME_INTRO_CUTSCENE, world.gangCrew.getAnchors(), () => {
        progress.introSeen = true;
        saveProgress(progress);
        titleOverlay.show(progress);
      });
    },
    onWatchCutscene: (cutsceneId) => {
      const def = ALL_CUTSCENES.find((c) => c.id === cutsceneId);
      if (!def || !world) return;
      titleOverlay.hide();
      cutscene.play(def, world.gangCrew.getAnchors(), () => {
        titleOverlay.show(progress);
      });
    },
    onPlayJingle: (areaId) => {
      jingles.unlock();
      jingles.play(areaId);
    },
  });

  const togglePause = () => {
    if (!playing || cutscene.isActive() || transit !== null) return;
    paused = !paused;
    hud.setPaused(paused);
    input.setTouchVisible(!paused);
  };

  const hud = createHud(gsrUi, {
    volume,
    onOpenMusic: () => musicExplorer.toggle(),
    onOpenMap: () => archipelagoMap.open(currentLevelId, progress),
    onOpenRoom: openRoomModal,
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

  const mine = getMyGnome();
  net.start(mine?.name ?? 'Runner', mine?.code ?? 'g1.00000000', initialRoom, offlineMode);

  const effects = createGameEffectDispatcher([
    createAudioEffectHandler(sfx),
    createCameraEffectHandler(chaseCam),
    createVisualFxEffectHandler(fx),
    createRiderAnimEffectHandler(() => rider),
    createHudEffectHandler(hud),
  ]);

  function switchDistrict(levelId: GsrLevelId, resetSkaterPos: boolean): WorldVisuals {
    currentLevelId = levelId;
    selectedTagIdx = 0;
    doc = getLevelDoc(levelId);
    const [ox, oy, oz] = MEGA_WORLD_OFFSETS[levelId];
    if (markers) {
      markers.dispose();
    }
    const nextWorld = megaWorld.islands.get(levelId)!;
    world = nextWorld;
    markers = createMarkerSystem(nextWorld.group, doc, {
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
    session = sessions.get(levelId)!;
    bossBattle = bossBattles.get(levelId)!;
    if (resetSkaterPos) {
      skater = createSkater(doc);
      skater.x += ox;
      skater.y += oy;
      skater.z += oz;
      chaseCam.yaw = skater.yaw;
    } else if (skater.chassis) {
      const megaDoc = getMegaLocalDoc(levelId);
      skater.chassis.ctrl.ground = createLevelGroundProbe(megaDoc, () => skater.chassis!.feetY);
      syncChassisFromSkater(skater.chassis, skater.x - ox, skater.y - oy, skater.z - oz, skater.vx, skater.vz, skater.yaw);
    }
    paused = false;
    hud.setPaused(false);
    bossWaveHitCd = 0;
    bossWaveDodgeCd = 0;
    applyRegionalLighting(levelId, hemi, sun, rimLight, scene, doc.data.fogColor);
    applyCosmetics();
    discoveredRoofs.clear();
    radioTicker.setStation(levelId);
    helper.resetForLevel(levelId);
    activeComp = null;
    hud.setCompetitionHud(null);
    const compUnlocked = session.levelCleared || progress.completedAreas.includes(levelId);
    nextWorld.worldBits.setCompetitionState(compUnlocked, false);
    return nextWorld;
  }

  function loadSceneForLevel(levelId: GsrLevelId): WorldVisuals {
    graffiti.clear();
    return switchDistrict(levelId, true);
  }

  function beginPlay(): void {
    hud.setVisible(true);
    input.setTouchVisible(true);
    playing = true;
    mutter.say(session.activeBanner?.text ?? '', 96);
    const arch = getArchipelagoNode(currentLevelId);
    locationToast.show(
      `AREA ${doc.data.areaNumber} · ${arch.frequency} · ${arch.elevationM}m ALT`,
      doc.name.toUpperCase(),
      pendingArrivalNote ?? doc.data.subtitle,
      doc.data.accentColor,
    );
    pendingArrivalNote = null;
  }

  function startLevel(levelId: GsrLevelId, options?: { fromTransit?: boolean }): void {
    if (!options?.fromTransit) {
      transit = null;
      setTransitFade(0);
    }
    loadSceneForLevel(levelId);
    titleOverlay.hide();
    playTrack(doc.data.trackId, musicExplorer.getReactiveOverrides());
    currentBpm = doc.data.areaNumber === 1 ? 162 : doc.data.areaNumber === 4 ? 170 : doc.data.areaNumber === 8 ? 166 : 132;
    if (camera.fov !== 60) {
      camera.fov = 60;
      camera.updateProjectionMatrix();
    }
    if (rider) {
      const [ox, oy, oz] = MEGA_WORLD_OFFSETS[currentLevelId];
      const spawnSurfY = oy + sampleSurfaceHeight(doc, skater.x - ox, skater.z - oz, skater.y - oy);
      rider.update(skater, 0.016, 0, spawnSurfY);
    }
    if (autostart || noCutscenes || !world) {
      chaseCam.snap(camera, skater, (x, z) => sampleMegaGroundY(currentLevelId, x, z));
      beginPlay();
      if (options?.fromTransit) {
        transit = { phase: 'fade-to-player-in', t: 0, dur: 0.45 };
      }
      return;
    }
    playing = false;
    hud.setVisible(false);
    input.setTouchVisible(false);
    const anchors = world.gangCrew.getAnchors();
    // Every start of an area (first visit, restart, replay, next area) plays its level intro.
    // The game intro comes first, once, before the first area.
    const afterAreaIntro = () => {
      session.activeBanner = null;
      if (options?.fromTransit) {
        transit = {
          phase: 'fade-to-player-out',
          t: 0,
          dur: 0.35,
          onBlack: () => {
            chaseCam.snap(camera, skater, (x, z) => sampleMegaGroundY(currentLevelId, x, z));
            beginPlay();
          },
        };
      } else {
        beginPlay();
      }
    };
    const playAreaIntro = () => {
      cutscene.play(AREA_CUTSCENES[levelId].levelIntro, anchors, afterAreaIntro);
    };
    if (!progress.introSeen) {
      cutscene.play(GAME_INTRO_CUTSCENE, anchors, () => {
        progress.introSeen = true;
        saveProgress(progress);
        playAreaIntro();
      });
    } else {
      playAreaIntro();
    }
    if (options?.fromTransit) {
      cutscene.updateCamera(camera, 1.0, 0);
      transit = { phase: 'fade-to-cutscene', t: 0, dur: 0.45 };
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
      helper.notifyProgress();
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
        if (result.nextStoryEventId) {
          const questIntro = AREA_CUTSCENES[currentLevelId].questIntros?.[result.nextStoryEventId];
          if (questIntro && !autostart && !noCutscenes && world) {
            playing = false;
            hud.setVisible(false);
            input.setTouchVisible(false);
            cutscene.play(questIntro, world.gangCrew.getAnchors(), () => {
              hud.setVisible(true);
              input.setTouchVisible(true);
              playing = true;
            });
          } else {
            const nextEv = session.events.get(result.nextStoryEventId);
            if (nextEv) {
              session.activeBanner = {
                speaker: nextEv.def.character,
                text: nextEv.def.introLine,
                ttl: 5.0,
              };
            }
          }
        }
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
        } else if (currentLevelId === 'mulch-alley') {
          void achievements.unlock('gsr-token-jackpot');
        } else if (currentLevelId === 'tupperware-mall') {
          void achievements.unlock('gsr-mall-clearance');
        } else if (currentLevelId === 'hoa-citadel') {
          void achievements.unlock('gsr-bylaw-breaker');
        } else if (currentLevelId === 'subsoil-relay') {
          void achievements.unlock('gsr-deep-cut-sync');
        } else if (currentLevelId === 'zero-hz-zenith') {
          void achievements.unlock('gsr-zero-hz-encore');
          if (!progress.ownedCosmetics.includes('aether-board')) {
            progress.ownedCosmetics.push('aether-board');
            progress.equippedRide = 'aether-board';
            applyCosmetics();
            locationToast.show('🛸 TIER 9 REWARD UNLOCKED!', 'THE AETHER BOARD', 'Equipped! Visit any Shop NPC to swap rides.', '#ffd740');
          }
        }
        progress.tokens += 300;
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

        const curIdx = LEVEL_ORDER.indexOf(currentLevelId);
        const nextAreaId: GsrLevelId | null =
          curIdx >= 0 && curIdx + 1 < LEVEL_ORDER.length ? LEVEL_ORDER[curIdx + 1]! : null;

        const openNextOrTeaser = () => {
          if (nextAreaId) startLevel(nextAreaId);
          else {
            playing = false;
            hud.setVisible(false);
            helper.hide();
            input.setTouchVisible(false);
            showFinaleEncoreModal(
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
              onFreeRoam: () => {
                hud.setVisible(true);
                input.setTouchVisible(true);
                playing = true;
                const compDef = COMPETITIONS[currentLevelId];
                world?.worldBits.setCompetitionState(true, false);
                locationToast.show(
                  '🛹 FREE ROAM UNLOCKED',
                  compDef.title.toUpperCase(),
                  'Visit the Encore Trophy Booth or ride any Transit Gate!',
                  '#ffd740',
                );
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
    scratchPadCd = Math.max(0, scratchPadCd - dt);

    const inp = input.poll(chaseCam.yaw);
    if (inp.pauseEdge && playing && !cutscene.isActive() && !musicExplorer.isOpen() && transit === null) {
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
    if (inp.helperEdge && playing && !paused && transit === null) {
      helper.showHint(currentLevelId, session, true);
    }
    if (inp.toggleFlow && world) {
      flowVisible = !flowVisible;
      megaWorld.setFlowVisible(flowVisible);
    }

    let promptText: string | null = null;
    const sprayVerb = inp.isTouch ? 'Tap SPRAY' : 'Press SPRAY (F)';
    const tags = REGIONAL_GRAFFITI[currentLevelId];
    const activeTag = tags[selectedTagIdx]!;

    const isPlaying =
      playing &&
      !paused &&
      !cutscene.isActive() &&
      !musicExplorer.isOpen() &&
      !shopModal.isOpen() &&
      (!transit || transit.phase === 'fade-to-player-in') &&
      !!world &&
      !!rider;
    effects.tick(dt, { skater, beatPulse, playing: isPlaying });
    radioTicker.setVisible(isPlaying);
    if (isPlaying) radioTicker.tick(dt, beatPulse);

    if (transit?.phase === 'ride' && world && rider) {
      transit.t += dt;
      const u = Math.min(1, transit.t / transit.dur);
      const s = u * u * 0.72;
      transit.curve.getPoint(s, transitPosTmp);
      transit.curve.getTangent(s, transitTanTmp).normalize();
      const speed = 26 + u * 36;
      skater.x = transitPosTmp.x;
      skater.y = transitPosTmp.y + 0.15;
      skater.z = transitPosTmp.z;
      skater.vx = transitTanTmp.x * speed;
      skater.vy = transitTanTmp.y * speed;
      skater.vz = transitTanTmp.z * speed;
      skater.yaw = Math.atan2(transitTanTmp.x, transitTanTmp.z);
      skater.grinding = true;
      skater.grounded = false;
      skater.boosting = true;
      skater.wallRiding = false;
      skater.danceMove = null;
      skater.lean = 0;
      skater.roll = 0;
      skater.pitch = 0;
      skater.trickSpin = 0;

      rider.update(skater, dt, beatPulse, transitPosTmp.y - 20);
      fx.update(skater, dt);
      world.update(elapsed, beatPulse, false, 0, 0.7);
      net.setPose(currentLevelId, skater);
      remoteRiders.update(currentLevelId, dt);

      transitRightTmp.set(-transitTanTmp.z, 0, transitTanTmp.x).normalize();
      transitCamPosTmp
        .copy(transitPosTmp)
        .addScaledVector(transitTanTmp, -7.5)
        .addScaledVector(transitRightTmp, 1.8);
      transitCamPosTmp.y += 3.1;
      transitCamLookTmp.copy(transitPosTmp).addScaledVector(transitTanTmp, 12.0);
      transitCamLookTmp.y += 0.6;
      camera.position.lerp(transitCamPosTmp, Math.min(1, dt * 8));
      camera.up.set(0, 1, 0);
      camera.lookAt(transitCamLookTmp);
      const targetRideFov = 72;
      if (Math.abs(camera.fov - targetRideFov) > 0.05) {
        camera.fov += (targetRideFov - camera.fov) * Math.min(1, dt * 6);
        camera.updateProjectionMatrix();
      }

      if (transit.t >= transit.fadeStart) {
        setTransitFade((transit.t - transit.fadeStart) / (transit.dur - transit.fadeStart));
      }
      if (transit.t >= transit.dur) {
        setTransitFade(1);
        startLevel(transit.targetId, { fromTransit: true });
      }
    } else if (transit?.phase === 'fade-to-player-out') {
      world?.update(elapsed, beatPulse, false, 0, 0.3);
      transit.t += dt;
      setTransitFade(transit.t / transit.dur);
      if (transit.t >= transit.dur) {
        setTransitFade(1);
        transit.onBlack();
        transit = { phase: 'fade-to-player-in', t: 0, dur: 0.45 };
      }
    } else if (isPlaying && world && rider) {
      const [ox, oy, oz] = MEGA_WORLD_OFFSETS[currentLevelId];
      const inHitstop = hitstopTimer > 0;
      if (inHitstop) {
        hitstopTimer = Math.max(0, hitstopTimer - dt);
      }
      let stepRes;
      if (inHitstop) {
        stepRes = {
          landed: false,
          landImpact: 0,
          bankedScore: 0,
          bounced: false,
          trickTriggered: null,
          trickAnim: null,
          jumpTriggered: false,
          airJumpTriggered: false,
          airDashTriggered: false,
          wallKickTriggered: false,
          boostStarted: false,
          bumped: false,
          wallRideStarted: false,
          grindStarted: false,
          danceStarted: null,
        };
      } else {
        skater.x -= ox;
        skater.y -= oy;
        skater.z -= oz;
        stepRes = stepSkater(skater, getMegaLocalDoc(currentLevelId), inp.skater, dt, prevButtons);
        skater.x += ox;
        skater.y += oy;
        skater.z += oz;
      }

      // Void rescue safety net
      const rescue = checkVoidRescue(skater.x, skater.y, skater.z, currentLevelId, skater.grinding);
      if (rescue.rescued) {
        skater.x = rescue.x;
        skater.y = rescue.y;
        skater.z = rescue.z;
        skater.vx = 0;
        skater.vz = 0;
        skater.vy = 10;
        skater.airJumpsLeft = skater.maxAirJumps;
        fx.ring(skater.x, skater.y, skater.z, '#00e5ff');
        locationToast.show('✨ AETHER UPDRAFT', 'BACK ON DECK', 'Void safety net caught you!', '#00e5ff');
      }

      // Seamless Mega World district crossing
      const nextAreaId = activeAreaAt(skater.x, skater.y, skater.z, currentLevelId);
      if (nextAreaId !== currentLevelId) {
        switchDistrict(nextAreaId, false);
        playTrack(doc.data.trackId, musicExplorer.getReactiveOverrides());
        currentBpm = doc.data.areaNumber === 1 ? 162 : doc.data.areaNumber === 4 ? 170 : doc.data.areaNumber === 8 ? 166 : 132;
        const arch = getArchipelagoNode(nextAreaId);
        locationToast.show(
          `AREA ${doc.data.areaNumber} · ${arch.frequency} · ${arch.elevationM}m ALT`,
          doc.name.toUpperCase(),
          'SEAMLESS SKY-RAIL ARRIVAL',
          doc.data.accentColor,
        );
      }

      const [curOx, curOy, curOz] = MEGA_WORLD_OFFSETS[currentLevelId];
      const lx = skater.x - curOx;
      const ly = skater.y - curOy;
      const lz = skater.z - curOz;

      const onBeatNow = beatPulse > 0.62;
      if (stepRes.jumpTriggered) effects.emit({ type: 'jump' });
      if (stepRes.airJumpTriggered) effects.emit({ type: 'airJump', x: skater.x, y: skater.y, z: skater.z });
      if (stepRes.airDashTriggered) effects.emit({ type: 'airDash', x: skater.x, y: skater.y, z: skater.z });
      if (stepRes.wallKickTriggered) effects.emit({ type: 'wallKick', x: skater.x, y: skater.y, z: skater.z });
      if (stepRes.grindStarted) effects.emit({ type: 'grindStart' });
      if (stepRes.wallRideStarted) effects.emit({ type: 'wallRideStart' });
      if (stepRes.boostStarted) effects.emit({ type: 'boostStart' });
      if (stepRes.bumped) effects.emit({ type: 'bump' });
      if (stepRes.danceStarted) {
        sfx.dancePop();
        if (stepRes.danceStarted === 'airfreeze') fx.ring(skater.x, skater.y, skater.z, '#00e5ff');
      }
      const surfY = curOy + sampleSurfaceHeight(doc, lx, lz, ly);
      rider.update(skater, dt, beatPulse, surfY);
      chaseCam.update(camera, skater, dt, inp.orbitDeltaX, (x, z) => sampleMegaGroundY(currentLevelId, x, z), beatPulse, unmultipliedEnergy);
      fx.update(skater, dt);
      helper.tick(dt, currentLevelId, session);

      if (stepRes.trickTriggered) {
        trickMusicPulse = true;
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
        if (stepRes.trickAnim) {
          net.sendTrick(currentLevelId, stepRes.trickAnim, stepRes.trickTriggered);
        }
      }
      if (stepRes.landed) {
        effects.emit({ type: 'land', x: skater.x, y: skater.y, z: skater.z, impact: stepRes.landImpact });
      }
      if (stepRes.bankedScore > 0) {
        const earnedTokens = Math.max(10, Math.round(stepRes.bankedScore * 0.08));
        progress.tokens += earnedTokens;
        saveProgress(progress);
        if (stepRes.bankedScore >= 1000) skillFlairTimer = Math.max(skillFlairTimer, 4.5);
        if (stepRes.bankedScore >= 1500) hitstopTimer = Math.max(hitstopTimer, 0.045);
        if (stepRes.bankedScore >= 1800) {
          radioTicker.announce(`MASSIVE ${stepRes.bankedScore.toLocaleString()}-PT COMBO LIVE ON AIR!`);
        }
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
        const horiz = Math.hypot(lx - bb.def.x, lz - bb.def.z);
        const vert = Math.abs(ly - bb.def.y);
        if (horiz < 5.5 && vert < 4.5) {
          promptText = bb.tagged
            ? `${sprayVerb} to re-tag ${bb.def.gangName} billboard!`
            : `${sprayVerb} to tag ${bb.def.gangName} billboard!`;
          if (inp.sprayEdge) {
            sprayConsumed = true;
            trickMusicPulse = true;
            skater.yaw = Math.atan2(bb.def.x - lx, bb.def.z - lz);
            if (skater.grounded && skater.chassis) {
              syncChassisFromSkater(skater.chassis, lx, ly, lz, skater.vx, skater.vz, skater.yaw);
            }
            hitstopTimer = Math.max(hitstopTimer, 0.045);
            const wasTagged = bb.tagged;
            world.markBillboardTagged(id, getGraffitiTexture(activeTag));
            effects.emit({
              type: 'spray',
              isTarget: true,
              x: bb.def.x + curOx,
              y: bb.def.y + curOy + 1.2,
              z: bb.def.z + curOz,
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
            net.sendSpray(currentLevelId, bb.def.x, bb.def.y + 1.2, bb.def.z, activeTag.id, id);
            if (!wasTagged && bb.def.eventId) handleEventCompletion(bb.def.eventId, id);
          }
          break;
        }
      }

      // Interactive world objects
      for (const [id, item] of world.interactiveMeshes) {
        const dist = Math.hypot(lx - item.def.x, ly - item.def.y, lz - item.def.z);
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
              trickMusicPulse = true;
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
        if (Math.hypot(lx - pPos.x, ly - pPos.y, lz - pPos.z) < 3.6) {
          promptText = `${sprayVerb} to tag the Bassist!`;
          if (inp.sprayEdge) {
            sprayConsumed = true;
            trickMusicPulse = true;
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
          if (Math.hypot(lx - p.x, ly - p.y, lz - p.z) < 3.2) {
            promptText = `${sprayVerb} to silence Sentry!`;
            if (inp.sprayEdge) {
              sprayConsumed = true;
              trickMusicPulse = true;
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
          const d = Math.hypot(lx - ev.def.x, ly - ev.def.y, lz - ev.def.z);
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

      // Ambient NPC proximity lines & gang crew shoutouts (paused during active story banners)
      if (!session.activeBanner) {
        for (const npc of world.ambientNpcs) {
          const d = Math.hypot(lx - npc.def.x, ly - npc.def.y, lz - npc.def.z);
          if (d < 3.4 && elapsed - npc.talkedAt > 30) {
            npc.talkedAt = elapsed;
            world.showSpeechBubble(npc.def.id, npc.def.name, npc.def.line, 4.5);
          }
        }

        // Skating gang crew shoutouts when player skates nearby
        world.gangCrew.checkShoutouts(lx, ly, lz, elapsed, (id, speaker, line, hz) => {
          world?.showSpeechBubble(id, speaker, line, 4.5);
          mutter.say(line, hz);
        });
      }

      // Map-wide Boss encounter + interactive bass shockwave
      stepBossBattle(bossBattle, dt, session.bossUnlocked, session.levelCleared);
      if (session.bossUnlocked && !session.levelCleared && world.bossActor) {
        session.bossWavePhase += dt * bossBattle.waveSpeed;
        const dx = lx - bossBattle.x;
        const dz = lz - bossBattle.z;
        const distXZ = Math.hypot(dx, dz);
        const dist = Math.hypot(dx, ly - bossBattle.y, dz);

        const waveR = (1 + (session.bossWavePhase % 1) * 6.5) * 2.2;
        if (Math.abs(distXZ - waveR) < 1.3 && distXZ > 0.5) {
          const dy = ly - bossBattle.y;
          if (dy < 1.3 && bossWaveHitCd <= 0) {
            bossWaveHitCd = 1.3;
            skater.vx += (dx / distXZ) * 12;
            skater.vz += (dz / distXZ) * 12;
            skater.vy = 4.8;
            skater.grounded = false;
            effects.emit({ type: 'bump' });
          } else if (dy >= 1.3 && dy < 8.5 && bossWaveDodgeCd <= 0) {
            bossWaveDodgeCd = 1.5;
            skater.comboScore += 200;
            skater.comboMult++;
            skater.comboTimer = 2.6;
            skater.maxCombo = Math.max(skater.maxCombo, skater.comboMult);
            hud.slamTrick('Bass Wave Dodge', skater.comboMult, beatPulse > 0.62);
          }
        }

        if (dist < bossBattle.hitRadius && bossHitCooldown <= 0) {
          promptText = `${sprayVerb} to tag the Boss!`;
          if (inp.sprayEdge) {
            sprayConsumed = true;
            trickMusicPulse = true;
            hitstopTimer = Math.max(hitstopTimer, 0.045);
            bossHitCooldown = 0.9;
            world.bossActor.hits++;
            world.triggerBossHit();
            advanceBossWaypoint(bossBattle);
            effects.emit({ type: 'bossHit', x: bossBattle.x + curOx, y: bossBattle.y + curOy + 1.8, z: bossBattle.z + curOz });
            const bossEv = [...session.events.values()].find((e) => e.def.kind === 'boss');
            if (bossEv) {
              handleEventCompletion(bossEv.def.id);
              session.bossHp = Math.max(0, session.bossMaxHp - bossEv.progress);
              if (!bossEv.completed) {
                session.activeBanner = {
                  speaker: bossEv.def.character,
                  text: bossEv.progress === 1
                    ? 'Direct hit?! Catch me across the district, street-skater!'
                    : 'Final phase—meet me at the next landmark!',
                  ttl: 3.5,
                };
              }
            }
          }
        }
      }

      // Shop NPC interaction
      if (world.shopNpcPos) {
        const sn = world.shopNpcPos;
        if (Math.hypot(lx - sn.x, ly - sn.y, lz - sn.z) < 4.8) {
          promptText = `${sprayVerb} to open ${sn.name}'s Gear Shop`;
          if (inp.sprayEdge) {
            sprayConsumed = true;
            mutter.say(sn.greeting, 114);
            shopModal.open(currentLevelId, progress);
          }
        }
      }

      // Satellite island bounce pads
      if (scratchPadCd <= 0) {
        for (const pad of world.satellitePads) {
          if (Math.hypot(lx - pad.x, ly - pad.y, lz - pad.z) < 2.6 && skater.vy <= 3.0) {
            scratchPadCd = 0.65;
            skater.vy = pad.power;
            skater.grounded = false;
            skater.airJumpsLeft = skater.maxAirJumps;
            skater.boost = Math.min(100, skater.boost + 35);
            effects.emit({ type: 'bounce', kind: 'bongo-pad', x: pad.x + curOx, y: pad.y + curOy + 0.3, z: pad.z + curOz, color: '#00e5ff' });
            hud.slamTrick('SATELLITE LAUNCH', skater.comboMult, beatPulse > 0.62);
            break;
          }
        }
      }

      // Collectible Golden Vinyls
      for (const [vId, v] of world.goldenVinyls) {
        if (v.collected) continue;
        if (Math.hypot(lx - v.def.x, ly - v.def.y, lz - v.def.z) < 2.6) {
          world.markVinylCollected(vId);
          if (!progress.collectedVinyls.includes(vId)) {
            progress.collectedVinyls.push(vId);
            progress.tokens += 150;
            saveProgress(progress);
            void achievements.increment('gsr-crate-digger');
          }
          skater.totalScore += 500;
          skater.boost = Math.min(100, skater.boost + 40);
          sfx.pickup('aerial-ring');
          fx.burst(v.def.x, v.def.y, v.def.z, '#ffd740', 22);
          fx.ring(v.def.x, v.def.y, v.def.z, '#ffd740');
          locationToast.show(
            '💿 GOLDEN VINYL FOUND',
            v.def.label.toUpperCase(),
            `${progress.collectedVinyls.length} / 27 COLLECTED (+500 PTS)`,
            '#ffd740',
          );
          radioTicker.announce(`Crate-digger! Found ${v.def.label} (${progress.collectedVinyls.length}/27)!`);
        }
      }

      // Rooftop Landmark Discovery
      if (skater.grounded) {
        for (const b of doc.data.buildings) {
          if (!b.label || discoveredRoofs.has(b.id)) continue;
          const roofY = b.yBase + b.h;
          if (
            Math.abs(ly - roofY) < 0.75 &&
            Math.abs(lx - b.x) <= b.w * 0.5 &&
            Math.abs(lz - b.z) <= b.d * 0.5
          ) {
            discoveredRoofs.add(b.id);
            skater.totalScore += 150;
            sfx.onBeat();
            radioTicker.announce(`Rooftop Discovered: ${b.label}! (+150)`, 4.0);
            break;
          }
        }
      }

      // Transit Gates to connected neighboring islands
      for (const gate of world.transitGates) {
        const [gx, gy, gz] = gate.link.gatePos;
        if (Math.hypot(lx - gx, ly - gy, lz - gz) < 5.2) {
          promptText = `${sprayVerb} to ride ${gate.link.label}`;
          if (inp.sprayEdge) {
            sprayConsumed = true;
            fx.ring(gx + curOx, gy + curOy + 1.0, gz + curOz, gate.link.color);
            fx.flash(gate.link.color, 0.35, 0.25);
            sfx.rankFanfare();
            pendingArrivalNote = 'ARRIVED VIA TRANSIT GATE';
            playing = false;
            paused = false;
            hud.setPaused(false);
            hud.setVisible(false);
            input.setTouchVisible(false);
            helper.hide();
            radioTicker.setVisible(false);
            transit = {
              phase: 'ride',
              t: 0,
              dur: 1.9,
              fadeStart: 1.35,
              targetId: gate.link.targetId,
              curve: buildTransitCableCurve(gate.link),
            };
            break;
          }
          break;
        }
      }

      // Turntable Scratch Launch Pads
      if (scratchPadCd <= 0) {
        for (const pad of world.worldBits.scratchPads) {
          if (Math.hypot(lx - pad.x, ly - pad.y, lz - pad.z) < 2.4 && skater.vy <= 3.0) {
            scratchPadCd = 0.65;
            skater.vy = 16.5;
            skater.grounded = false;
            skater.airJumpsLeft = skater.maxAirJumps;
            skater.boost = Math.min(100, skater.boost + 35);
            skater.comboScore += 150;
            skater.comboMult++;
            skater.comboTimer = Math.max(skater.comboTimer, 2.6);
            trickMusicPulse = true;
            effects.emit({ type: 'bounce', kind: 'hydrant', x: pad.x + curOx, y: pad.y + curOy + 0.3, z: pad.z + curOz, color: '#00e5ff' });
            hud.slamTrick('SCRATCH BOOST', skater.comboMult, beatPulse > 0.62);
            break;
          }
        }
      }

      // Encore Competition Trophy Booth & Active Competition Loop
      const compDef = COMPETITIONS[currentLevelId];
      const compUnlocked = session.levelCleared || progress.completedAreas.includes(currentLevelId);
      const bp = world.worldBits.boothPos;
      if (!activeComp && Math.hypot(lx - bp.x, ly - bp.y, lz - bp.z) < 4.5) {
        if (compUnlocked) {
          promptText = `${sprayVerb} to start ${compDef.title}`;
          if (inp.sprayEdge) {
            sprayConsumed = true;
            activeComp = createCompetitionRun(compDef);
            world.worldBits.setCompetitionState(true, true, activeComp.collectedRings);
            sfx.rankFanfare();
            mutter.say(compDef.hostLine, 118);
            locationToast.show(`🏆 ${compDef.title.toUpperCase()}`, `${compDef.durationS}S ENCORE`, compDef.hostLine, '#ffd740');
          }
        } else {
          promptText = `🔒 Clear Boss to unlock ${compDef.title}`;
        }
      }

      if (activeComp) {
        const prevScoreTotal = skater.totalScore;
        let ringHitIdx: number | undefined;
        if (compDef.kind === 'ring-sprint' && compDef.ringPositions) {
          for (let ri = 0; ri < compDef.ringPositions.length; ri++) {
            if (activeComp.collectedRings.has(ri)) continue;
            const rp = compDef.ringPositions[ri]!;
            if (Math.hypot(lx - rp[0], ly - rp[1], lz - rp[2]) < 3.4) {
              ringHitIdx = ri;
              sfx.pickup('aerial-ring');
              fx.burst(rp[0] + curOx, rp[1] + curOy, rp[2] + curOz, '#ffd740', 14);
              break;
            }
          }
        }
        const compRes = stepCompetitionRun(activeComp, dt, {
          scoreDelta: Math.max(0, stepRes.bankedScore + (skater.totalScore - prevScoreTotal)),
          grindAirDt: skater.grinding || !skater.grounded ? dt : 0,
          trickCount: stepRes.trickTriggered ? 1 : 0,
          tagCount: sprayConsumed ? 1 : 0,
          ringIndex: ringHitIdx,
        });
        world.worldBits.setCompetitionState(true, !activeComp.finished, activeComp.collectedRings);
        hud.setCompetitionHud({
          title: compDef.title,
          timeLeft: activeComp.timeLeft,
          progress: Math.round(activeComp.progress),
          bronze: compDef.bronzeTarget,
          silver: compDef.silverTarget,
          gold: compDef.goldTarget,
        });
        if (compRes.finishedNow) {
          const medal = compRes.medal;
          const prevMedal = progress.competitionMedals[currentLevelId];
          if (isBetterMedal(medal, prevMedal) && medal) {
            progress.competitionMedals[currentLevelId] = medal;
            saveProgress(progress);
          }
          sfx.rankFanfare();
          locationToast.show(
            medal ? `🏆 ${medal.toUpperCase()} MEDAL!` : 'ENCORE COMPLETE',
            compDef.title.toUpperCase(),
            `Result: ${Math.round(activeComp.progress)} · Gold: ${compDef.goldTarget}`,
            medal === 'gold' ? '#ffd740' : medal === 'silver' ? '#e0e0e0' : '#ff9100',
          );
          activeComp = null;
          hud.setCompetitionHud(null);
          world.worldBits.setCompetitionState(true, false);
        }
      }

      // Freeform surface graffiti (only when grounded, wall-riding, or grinding — never mid-air!)
      if (inp.sprayEdge && !sprayConsumed && (skater.grounded || skater.wallRiding || skater.grinding)) {
        const hit = graffiti.sprayAt(skater, activeTag, world.group);
        if (hit.hit) {
          trickMusicPulse = true;
          effects.emit({ type: 'spray', isTarget: false, x: hit.x, y: hit.y, z: hit.z, color: activeTag.primary, count: 14, shake: 0.08, shakeDur: 0.1 });
          net.sendSpray(currentLevelId, hit.x, hit.y, hit.z, activeTag.id);
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

      // Gradual 1.5-beat scale-down after big combo + unmultiplied score brightness/saturation
      const beatSec = 60 / Math.max(90, currentBpm);
      const decayRate = 1 / (beatSec * 1.5);
      const targetHype = Math.min(1, 0.3 + skater.comboMult * 0.12);
      if (targetHype >= smoothedHype) smoothedHype = targetHype;
      else smoothedHype = Math.max(targetHype, smoothedHype - decayRate * 0.7 * dt);

      if (skater.comboMult >= smoothedComboMult) smoothedComboMult = skater.comboMult;
      else smoothedComboMult = Math.max(skater.comboMult, smoothedComboMult - (smoothedComboMult - 1) * decayRate * dt);

      const rawUnmult = skater.unmultipliedScore + skater.comboScore;
      const targetEnergy = Math.min(1, rawUnmult / 4500);
      unmultipliedEnergy += (targetEnergy - unmultipliedEnergy) * Math.min(1, dt * 2.5);
      const bright = (1 + unmultipliedEnergy * 0.13).toFixed(3);
      const sat = (1 + unmultipliedEnergy * 0.26).toFixed(3);
      const cont = (1 + unmultipliedEnergy * 0.05).toFixed(3);
      canvas.style.filter = `brightness(${bright}) saturate(${sat}) contrast(${cont})`;
      renderer.toneMappingExposure = 1.12 + unmultipliedEnergy * 0.11;

      net.setPose(currentLevelId, skater);
      remoteRiders.update(currentLevelId, dt);
      megaWorld.update(
        currentLevelId,
        elapsed,
        beatPulse,
        session.bossUnlocked && !session.levelCleared,
        session.bossWavePhase,
        smoothedHype,
        Math.round(smoothedComboMult),
        { x: bossBattle.x, y: bossBattle.y, z: bossBattle.z },
      );
      markers?.update(elapsed, beatPulse, session);
      const nearest = markers?.nearestTarget(lx, ly, lz, session);
      const compass = nearest
        ? {
            label: nearest.label,
            kind: nearest.kind,
            dist: nearest.dist,
            arrow: directionArrow(chaseCam.yaw, nearest.x - lx, nearest.z - lz),
          }
        : null;
      hud.update(doc, skater, session, promptText, tags, selectedTagIdx, compass, beatPulse);
    } else if (world) {
      megaWorld.update(currentLevelId, elapsed, beatPulse, false, 0, 0.3, 1);
      if (cutscene.isActive()) {
        cutscene.updateCamera(camera, dt, beatPulse);
      } else {
        const [ox, oy, oz] = MEGA_WORLD_OFFSETS[currentLevelId];
        camera.position.set(ox + Math.sin(elapsed * 0.18) * 56, oy + 24, oz + Math.cos(elapsed * 0.18) * 56);
        camera.lookAt(ox, oy + 4, oz - 8);
      }
    }

    if (transit && (transit.phase === 'fade-to-cutscene' || transit.phase === 'fade-to-player-in')) {
      transit.t += dt;
      setTransitFade(1 - transit.t / transit.dur);
      if (transit.t >= transit.dur) {
        setTransitFade(0);
        transit = null;
      }
    }

    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }

  whileHidden(() => {
    if (playing && !paused) {
      net.setPose(currentLevelId, skater);
    }
  });

  requestAnimationFrame(frame);
}
