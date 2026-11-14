import { heightAt } from './terrain';
import * as THREE from 'three';
import {
  COLORS, OBSTACLES, PLAYER_RADIUS, PEDESTAL_HEIGHT, MOWER_TIERS, TUNING, WAVES,
  type GamePhase, type InputState, type MowerTier, type RunSummary, type UpgradeChoice,
  type Weapon, type WeaponContext, type WeaponId, type MetaUpgradeId, type VisualMode, type ItemKind, type GameMode,
  ITEM_DEFS, CHICKEN_HEAL, CAMERA_VIEWS, SOLO_LEVELS, CHARACTERS, CHARACTER_ORDER, type CharacterId, type LobbyCallbacks,
} from './config';
import { createInput } from './input';
import { createTouchControls } from './ui/touch';
import { createCameraRig } from './camera';
import { createPlayerState, updatePlayer } from './player';
import { createGnomeModel } from './gnome';
import { buildWorld } from './world';
import { createMowerSystem } from './mowers';
import { createPickupSystem } from './pickups';
import { createDropSystem } from './drops';
import { createLobbyStage } from './lobbyStage';
import { createLobbyUI } from './ui/lobby';
import { createHud } from './ui/hud';
import { createLevelUpUI } from './ui/levelup';
import { createResultsUI } from './ui/results';
import { loadSave, writeSave, tryBuy } from './save';
import { computeStats } from './stats';
import { createRun, addXp, rollChoices, applyChoice } from './run';
import { WEAPON_FACTORIES } from './weapons';
import { playSfx, setEngineLevel } from './audio';
import { startMusic, startMenuMusic, pauseMusic, resumeMusic, stopMusic, isMusicMuted, setMusicMuted } from './music';
import { loadFlags, saveFlags } from './flags';
import { createPostFX } from './postfx';
import { buildProp } from './props';
import { buildHouse } from './house';
import { createDayNight } from './daynight';
import { buildScenery } from './scenery';
import { createItemSystem } from './items';
import { createChat } from './ui/chat';
import { createSpectateBar } from './ui/spectate';
import { createJuice } from './juice';
import { createBotSystem } from './br/bots';
import { createZone } from './br/zone';
import { createRoyaleHud } from './ui/royaleHud';
import { createViewButton } from './ui/viewButton';
import { createPauseButton } from './ui/pauseButton';
import { createMuteButton } from './ui/muteButton';
import { createNowPlaying } from './ui/nowPlaying';
import { createPauseUI } from './ui/pause';
import { createNetClient, serverUrl } from './net/client';
import { listenForCheat } from './cheat';
import { initTelemetry, track } from './telemetry';
import { createPuppetSystem } from './net/puppets';
import { checkName } from './net/textFilter';
import { MIN_PLAYERS, NET_SEND_HZ, type GameMsg, type KillSnap, type PlayerInfo, type ServerMsg } from './net/protocol';
import type { KillEvent, MowerKill, NetClient } from './config';
import { loadMyGnome, getMyGnome, resolveLook, prefetchLooks } from '@lawn/gnome';

// A saved Gnome Creator look becomes the 'mine' card. Must run before createLobbyUI builds the cards.
const mine = await loadMyGnome();
if (mine) {
  CHARACTERS.mine.look = mine.look;
  CHARACTERS.mine.name = mine.name.toUpperCase();
  CHARACTER_ORDER.push('mine');
}

// ---------- no browser zoom on phones ----------
// CSS touch-action handles most browsers; iOS Safari ignores user-scalable=no, so also cancel its
// pinch gestures, multi-finger scaling moves and double-tap-to-zoom.
for (const type of ['gesturestart', 'gesturechange', 'gestureend']) {
  document.addEventListener(type, (e) => e.preventDefault(), { passive: false });
}
document.addEventListener('touchmove', (e) => {
  if (e.touches.length > 1 && (e as TouchEvent & { scale?: number }).scale !== 1) e.preventDefault();
}, { passive: false });
document.addEventListener('dblclick', (e) => e.preventDefault(), { passive: false });

// ---------- renderer, scene, camera ----------
const canvas = document.getElementById('game') as HTMLCanvasElement;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(COLORS.sky);
scene.fog = new THREE.Fog(COLORS.sky, 60, 380);
// near 0.3 (not 0.1): far better depth precision, which stops overlays flickering when seen from high above.
const camera = new THREE.PerspectiveCamera(60, 1, 0.3, 2600);
const postfx = createPostFX(renderer, scene, camera);

function resize(): void {
  const w = window.innerWidth;
  const h = window.innerHeight;
  renderer.setSize(w, h, false);
  postfx.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();

// ---------- systems ----------
const uiRoot = document.getElementById('ui') as HTMLElement;
const touch = createTouchControls(uiRoot);
const input = createInput(canvas, touch);
const rig = createCameraRig(camera);
const world = buildWorld(scene);
const props = OBSTACLES.map((o) => {
  const obj = buildProp(o);
  scene.add(obj);
  return { o, obj };
});
let cullTimer = 0;
/** Hides props far from the player; the fog hides the pop-in. */
function cullProps(dt: number, focus: THREE.Vector3): void {
  cullTimer -= dt;
  if (cullTimer > 0) return;
  cullTimer = 0.25;
  for (const p of props) {
    const d = Math.hypot(p.o.x - focus.x, p.o.z - focus.z);
    p.obj.visible = flags.visualMode === 'lite'
      ? d < TUNING.liteCullDist + Math.min(p.o.height, 10) * 2
      : d < TUNING.propCullDist + p.o.height * 2;
  }
}
const houseLights = buildHouse(scene);
const dayNight = createDayNight();
let lastDayPhase = dayNight.state().phase;
const scenery = buildScenery(scene);
let gnome = createGnomeModel(CHARACTERS.gnorman.look);

/** Swaps the player's model to a character's look (lobby selection). */
function setPlayerCharacter(id: CharacterId, color: number | null = null): void {
  scene.remove(gnome.object);
  gnome.object.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (mesh.isMesh) {
      mesh.geometry.dispose();
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const m of mats) m.dispose();
    }
  });
  gnome = createGnomeModel(color === null ? CHARACTERS[id].look : { ...CHARACTERS[id].look, hat: color });
  scene.add(gnome.object);
}
scene.add(gnome.object);
const mowers = createMowerSystem(scene);
const pickups = createPickupSystem(scene);
const drops = createDropSystem(scene);
const items = createItemSystem(scene);
const juice = createJuice(uiRoot);
// Online text chat (queue and match). Opening the box mid-run releases the mouse without pausing.
const chat = createChat(uiRoot, (text) => net?.chat(text));
chat.onOpenChange((open) => {
  if (phase === 'playing') input.setPointerLockAllowed(!open);
});
const bots = createBotSystem(scene);
const zone = createZone(scene);
const royaleHud = createRoyaleHud(uiRoot);
const viewBtn = createViewButton(uiRoot, cycleView);
const pauseBtn = createPauseButton(uiRoot, () => pauseGame());
const muteBtn = createMuteButton(uiRoot, isMusicMuted, () => setMusicMuted(!isMusicMuted()));
muteBtn.show();
const nowPlaying = createNowPlaying(uiRoot);
const pauseUI = createPauseUI(uiRoot);
const puppets = createPuppetSystem(scene);

let pausedAt = 0;
function pauseGame(): void {
  if (phase !== 'playing') return;
  phase = 'paused';
  pausedAt = performance.now();
  input.setPointerLockAllowed(false);
  touch.setVisible(false);
  viewBtn.hide();
  pauseBtn.hide();
  spectateBar.hide();
  setEngineLevel(0);
  pauseMusic();
  pauseUI.show({
    mode,
    runNumber: save.runs + 1,
    elapsedS: run.elapsedS,
    level: run.level,
    xp01: run.xp / run.xpToNext,
    hearts: run.hearts,
    maxHearts: stats.maxHearts,
    kills: run.kills,
    acorns: run.acorns,
    gnomesLeft: online ? online.alive : mode === 'royale' ? bots.aliveCount() + 1 : null,
    weapons: run.weapons,
    passives: run.passives,
    stats,
    meta: save.upgrades,
  }, resumeGame, quitRun);
}

function resumeGame(): void {
  if (phase !== 'paused') return;
  pauseUI.hide();
  phase = 'playing';
  resumeMusic();
  input.setPointerLockAllowed(true);
  touch.setVisible(true);
  viewBtn.show();
  pauseBtn.show();
  if (online?.spectating && !online.over) spectateBar.show();
}

function quitRun(): void {
  if (phase !== 'paused') return;
  if (sandbox) {
    // Nothing to score: straight back to the lobby.
    pauseUI.hide();
    goLobby();
    return;
  }
  if (online) {
    finishOnline('GIVING UP (it happens)');
    return;
  }
  pauseUI.hide();
  phase = 'playing';
  killedBy = null;
  killedByText = 'GIVING UP (it happens)';
  run.hearts = 0;
  endRun(false);
}

window.addEventListener('keydown', (e) => {
  if (e.code !== 'Escape' || e.repeat) return;
  if (phase === 'playing') pauseGame();
  // Esc that just released the mouse lock (and so paused) must not also un-pause.
  else if (phase === 'paused' && performance.now() - pausedAt > 300) resumeGame();
});
// Desktop: losing the mouse lock mid-run (Esc, alt-tab) pauses. Our own unlocks happen after phase changes, so they never trigger this.
document.addEventListener('pointerlockchange', () => {
  if (!document.pointerLockElement && phase === 'playing' && !chat.isOpen) pauseGame();
});
const VIEW_NAMES = { third: 'THIRD PERSON', first: 'FIRST PERSON', top: 'TOP-DOWN' } as const;

/** P or the top-right button: third person -> first person -> top-down. */
function cycleView(): void {
  if (phase !== 'playing') return;
  let next = CAMERA_VIEWS[(CAMERA_VIEWS.indexOf(rig.view) + 1) % CAMERA_VIEWS.length];
  if (next === 'first' && online?.spectating) next = CAMERA_VIEWS[(CAMERA_VIEWS.indexOf(next) + 1) % CAMERA_VIEWS.length];
  rig.view = next;
  flags.view = next;
  saveFlags(flags);
  viewBtn.setView(next);
  juice.toast(`VIEW: ${VIEW_NAMES[next]}`, 'Press P or tap the camera button to switch.', '#ffffff');
}
window.addEventListener('keydown', (e) => {
  if (e.code === 'KeyP' && !e.repeat) cycleView();
});
const lobbyStage = createLobbyStage(scene);
const hud = createHud(uiRoot);
const levelUp = createLevelUpUI(uiRoot);
const results = createResultsUI(uiRoot);
const lobbyCallbacks: LobbyCallbacks = {
  onPlay: (mode: GameMode, level: number) => { if (phase === 'lobby') startRun(mode, level); },
  onBuy: (id: MetaUpgradeId) => {
    if (tryBuy(save, id)) {
      playSfx('buy');
      lobbyUI.refresh(save);
    }
  },
  onSelectCharacter: (id: CharacterId) => {
    if (phase !== 'lobby' || save.character === id) return;
    save.character = id;
    writeSave(save);
    setPlayerCharacter(id);
    lobbyUI.setCharacter(id);
    lobbyUI.refresh(save);
    playSfx('buy');
  },
  onVisualMode: (mode: VisualMode) => {
    flags.visualMode = mode;
    saveFlags(flags);
    postfx.setMode(mode);
    lobbyUI.setVisualMode(mode);
    playSfx('buy');
  },
  onFindMatch: (code: string | null) => { void findMatch(code); },
  onLeaveMatch: () => {
    net?.leave();
    lobbyUI.setMatchStatus(null);
    endOnlineSession();
  },
  onSetName: (name: string) => {
    save.name = name;
    writeSave(save);
  },
};
const lobbyUI = createLobbyUI(uiRoot, lobbyCallbacks);

// ---------- state ----------
const save = loadSave();
if (!mine && save.character === 'mine') save.character = 'gnorman'; // the gnome was cleared since the last visit
// The character sent on the wire: a custom gnome travels as its look code.
function wireCharacter(): string { return save.character === 'mine' ? (getMyGnome()?.code ?? 'gnorman') : save.character; }
// Anonymous usage and error reports to the matchmaking server (off without a server, with Do Not Track, or ?telemetry=0).
initTelemetry(serverUrl());
const flags = loadFlags();
postfx.setMode(flags.visualMode);
lobbyUI.setVisualMode(flags.visualMode);
setPlayerCharacter(save.character);
lobbyUI.setCharacter(save.character);
let phase: GamePhase = 'lobby';
let run = createRun(save);
let stats = computeStats(save, null);
let player = createPlayerState(stats);
const weapons = new Map<WeaponId, Weapon>();
let pendingLevelUps = 0;
let choices: UpgradeChoice[] = [];
let waveIndex = -1;
let victoryTimer = -1;
// Solo levels: the waves replay each level with harder mowers, ending in a boss fight.
let levelIdx = 0;
let levelStartS = 0;        // run time when the current level's wave clock started
let demoSandbox = false;    // ?sandbox (demo recording): no mowers, waves or boss
let levelBossSpawned = false;
let bossDone = false;       // royale: its single boss is finished
let levelsCleared = 0;
let levelBannerAt = -1;     // run time to announce the next level
let killedBy: MowerTier | null = null;
let espressoS = 0;
let mode: GameMode = 'solo';
let zoneDmgTimer = 0;
let killedByText: string | null = null;
let celebrateS = 0;
let bestToastDone = false;
let sandbox = false;        // the ihategrass cheat: sand, obstacles, nothing else

const NO_INPUT: InputState = { moveX: 0, moveY: 0, jump: false, sprint: false, start: false, lookX: 0, lookY: 0 };

function waveIndexAt(t: number): number {
  let i = 0;
  while (i + 1 < WAVES.length && WAVES[i + 1].fromS <= t) i++;
  return i;
}

function syncWeapons(): void {
  for (const [id, level] of Object.entries(run.weapons) as [WeaponId, number][]) {
    let w = weapons.get(id);
    if (!w) {
      w = WEAPON_FACTORIES[id](scene);
      weapons.set(id, w);
    }
    w.setLevel(level);
  }
}

function clearWeapons(): void {
  for (const w of weapons.values()) w.dispose();
  weapons.clear();
}

function clearField(): void {
  spectateBar.hide();
  clearWeapons();
  mowers.reset();
  drops.reset();
  pickups.reset();
  items.reset();
  juice.reset();
  bots.reset();
  zone.reset();
  zone.setVisible(false);
  royaleHud.hide();
  puppets.reset();
  world.reset();
}

// ---------- phases ----------
function goLobby(): void {
  phase = 'lobby';
  sandbox = false;
  world.setSand(false);
  if (online) {
    net?.leave();
    online = null;
    setPlayerCharacter(save.character);
    endOnlineSession();
  }
  dayNight.setTime(TUNING.lobbyTimeT);
  clearField();
  stats = computeStats(save, null);
  player = createPlayerState(stats);
  player.position.y = PEDESTAL_HEIGHT;
  gnome.setDead(false);
  gnome.object.visible = true;
  lobbyStage.setVisible(true);
  hud.hide();
  levelUp.hide();
  results.hide();
  lobbyUI.show(save);
  input.setPointerLockAllowed(false);
  setEngineLevel(0);
  startMenuMusic();
  nowPlaying.hide();
}

function startRun(m: GameMode = 'solo', level = 1): void {
  mode = m;
  dayNight.setTime(TUNING.dayStartT);
  lastDayPhase = dayNight.state().phase;
  lobbyUI.hide();
  lobbyStage.setVisible(false);
  clearField();
  run = createRun(save);
  stats = computeStats(save, run);
  player = createPlayerState(stats);
  pendingLevelUps = 0;
  waveIndex = -1;
  victoryTimer = -1;
  levelIdx = Math.min(SOLO_LEVELS.length, Math.max(1, Math.min(level, save.levelsUnlocked))) - 1;
  track('run_start', { mode: online ? 'online' : m, level: m === 'solo' ? levelIdx + 1 : 1 });
  levelStartS = 0;
  levelBossSpawned = false;
  bossDone = false;
  levelsCleared = 0;
  levelBannerAt = -1;
  mowers.setDifficulty(mode === 'solo' ? SOLO_LEVELS[levelIdx] : { speedMult: 1, hpMult: 1, spawnMult: 1, maxAliveMult: 1 });
  killedBy = null;
  killedByText = null;
  zoneDmgTimer = 0;
  espressoS = 0;
  celebrateS = 0;
  bestToastDone = save.bestTimeS <= 0;
  syncWeapons();
  rig.view = flags.view;
  rig.reset(0);
  viewBtn.setView(flags.view);
  viewBtn.show();
  pauseBtn.show();
  hud.show();
  if (mode === 'royale' && online) {
    // Players stand on a ring in join order. Online matches are humans only (no bots).
    const idx = Math.max(0, online.order.indexOf(online.me));
    const a = (idx / online.order.length) * Math.PI * 2;
    const sx = Math.sin(a) * TUNING.onlineSpawnRing;
    const sz = Math.cos(a) * TUNING.onlineSpawnRing;
    player.position.set(sx, heightAt(sx, sz), sz);
    player.facing = a + Math.PI;
    rig.reset(player.facing);
    zone.reset(online.seed);
    if (!online.isHost) mowers.setPuppet(true);
    zone.setVisible(true);
    royaleHud.show();
    const humans = online.order.length;
    hud.banner(`ONLINE ROYALE · ${humans} GNOMES`, online.isHost ? 'You are hosting. Please do not close the tab.' : 'Last gnome standing wins. Some of these gnomes are people.', 4);
  } else if (mode === 'royale') {
    bots.spawn(TUNING.royaleBots, new THREE.Vector3(0, 0, 0), player.position);
    zone.setVisible(true);
    royaleHud.show();
    hud.banner(`BATTLE ROYALE · ${TUNING.royaleBots + 1} GNOMES`, 'Last gnome standing wins. The bots have names. Respect them.', 3.5);
  } else {
    hud.banner(`RUN #${save.runs + 1} · ${SOLO_LEVELS[levelIdx].name}`, SOLO_LEVELS[levelIdx].sub, 4);
  }
  phase = 'playing';
  input.setPointerLockAllowed(true);
  touch.setVisible(true);
  playSfx('start');
  // Online matches share the server's seed, so everyone gets the same track (not beat-synced).
  const song = startMusic(online ? online.seed : undefined);
  if (!isMusicMuted()) nowPlaying.show(song);
}

/** The ihategrass cheat: a solo walk on sand among the obstacles. No mowers, acorns, items, weapons or HUD. */
function startSandbox(): void {
  if (phase !== 'lobby' || online || queueing) return;
  sandbox = true;
  mode = 'solo';
  dayNight.setTime(TUNING.dayStartT);
  lastDayPhase = dayNight.state().phase;
  lobbyUI.hide();
  lobbyStage.setVisible(false);
  clearField();
  world.setSand(true);
  run = createRun(save);
  stats = computeStats(save, run);
  player = createPlayerState(stats);
  pendingLevelUps = 0;
  victoryTimer = -1;
  espressoS = 0;
  celebrateS = 0;
  rig.view = flags.view;
  rig.reset(0);
  viewBtn.setView(flags.view);
  viewBtn.show();
  pauseBtn.show();
  hud.hide();
  juice.toast('I HATE GRASS', 'No grass. No mowers. No acorns. Just sand. (Esc to leave.)', '#d9c18c');
  phase = 'playing';
  input.setPointerLockAllowed(true);
  touch.setVisible(true);
  playSfx('start');
}
listenForCheat('ihategrass', startSandbox);

function tickSandbox(dt: number, inp: InputState): void {
  dayNight.update(dt);
  const { jumped } = updatePlayer(player, inp, rig.yaw, OBSTACLES, stats, dt);
  if (jumped) playSfx('jump');
  gnome.object.visible = rig.view !== 'first';
  setEngineLevel(0);
}

function openLevelUp(): void {
  phase = 'levelup';
  viewBtn.hide();
  pauseBtn.hide();
  touch.setVisible(false);
  input.setPointerLockAllowed(false);
  setEngineLevel(0);
  choices = rollChoices(run, stats.choiceCount);
  levelUp.show(choices, run.rerollsLeft, onPick, onReroll);
}

function onPick(index: number): void {
  const c = choices[index];
  if (!c || phase !== 'levelup') return;
  applyChoice(run, c, stats);
  stats = computeStats(save, run);
  if (c.id === 'thickBeard') run.hearts = Math.min(stats.maxHearts, run.hearts + 1); // more beard heals too
  syncWeapons();
  pendingLevelUps--;
  levelUp.hide();
  if (pendingLevelUps > 0) {
    openLevelUp();
  } else {
    phase = 'playing';
    input.setPointerLockAllowed(true);
    touch.setVisible(true);
    viewBtn.show();
    pauseBtn.show();
  }
}

function onReroll(): void {
  if (run.rerollsLeft <= 0 || phase !== 'levelup') return;
  run.rerollsLeft--;
  choices = rollChoices(run, stats.choiceCount);
  levelUp.show(choices, run.rerollsLeft, onPick, onReroll);
}

function endRun(victory: boolean): void {
  phase = 'results';
  // cause: a mower tier, the zone, or 'other' (never killedByText as-is: online it can hold a player's name).
  track('run_end', {
    mode: online ? 'online' : mode, victory, timeS: Math.round(run.elapsedS), level: run.level, kills: run.kills,
    cause: victory ? 'none' : killedBy ?? (killedByText === 'THE MOW ZONE' ? 'zone' : 'other'),
  });
  spectateBar.hide();
  levelUp.hide();
  pauseUI.hide();
  viewBtn.hide();
  pauseBtn.hide();
  rig.view = 'third'; // see your gnome's fate on the results screen
  input.setPointerLockAllowed(false);
  setEngineLevel(0);
  stopMusic();
  nowPlaying.hide();
  gnome.object.visible = true;
  if (victory) {
    playSfx('victory');
  } else {
    gnome.setDead(true);
    playSfx('hit');
  }
  const survivalBonus = Math.floor(run.elapsedS / 10) * TUNING.survivalAcornsPer10s;
  const bossBonus = levelsCleared * TUNING.bossAcornBonus;
  const totalEarned = run.acorns + survivalBonus + bossBonus;
  const newBestTime = Math.floor(run.elapsedS) > save.bestTimeS;
  save.runs += 1;
  save.acorns += totalEarned;
  save.totalAcornsEarned += totalEarned;
  if (newBestTime) save.bestTimeS = Math.floor(run.elapsedS);
  save.bossKills += levelsCleared;
  // Solo victory unlocks the next level (picked in the lobby).
  let unlockedLevel: number | null = null;
  if (victory && mode === 'solo' && levelIdx + 2 <= SOLO_LEVELS.length && save.levelsUnlocked < levelIdx + 2) {
    save.levelsUnlocked = levelIdx + 2;
    unlockedLevel = save.levelsUnlocked;
  }
  writeSave(save);

  const summary: RunSummary = {
    runNumber: save.runs, victory, elapsedS: run.elapsedS, kills: run.kills, level: run.level,
    acornsCollected: run.acorns, survivalBonus, bossBonus, totalEarned, newBestTime,
    killedBy: victory ? null : killedBy,
    killedByText: victory ? null : killedByText,
    levelsCleared,
    soloLevel: mode === 'solo' ? levelIdx + 1 : null,
    unlockedLevel,
    placement: online ? { rank: victory ? 1 : online.placement || online.alive, total: online.total } : mode === 'royale' ? { rank: run.hearts > 0 ? 1 : bots.aliveCount() + 1, total: TUNING.royaleBots + 1 } : null,
  };
  hud.hide();
  touch.setVisible(false);
  results.show(summary, goLobby);
}

// ---------- the run ----------
/** All combines of the current boss fight are down. */
function clearLevel(): void {
  levelsCleared += 1;
  levelBossSpawned = false;
  bossDone = true;
  if (mode !== 'solo') {
    hud.banner('COMBINE DEFEATED', 'The lawn is safe. For now. (It is never safe.)', 3);
    return;
  }
  // Solo: beating the level's boss fight wins the run.
  run.bossDefeated = true;
  victoryTimer = TUNING.victoryDelayS;
  const last = levelIdx >= SOLO_LEVELS.length - 1;
  hud.banner(
    last ? 'THE COMBINES ARE DEFEATED' : `LEVEL ${levelIdx + 1} CLEAR!`,
    last ? 'Three combines. One gnome. The lawn is yours (until it grows back).' : `Level ${levelIdx + 2} is now unlocked in the lobby.`,
    3,
  );
}

function applyItem(kind: ItemKind): void {
  const def = ITEM_DEFS[kind];
  juice.toast(def.name, def.toast, '#' + def.color.toString(16).padStart(6, '0'));
  playSfx('buy');
  switch (kind) {
    case 'chicken':
      run.hearts = Math.min(stats.maxHearts, run.hearts + CHICKEN_HEAL);
      break;
    case 'shopVac':
      drops.vacuum();
      break;
    case 'weedKiller':
      for (const e of mowers.enemies()) {
        if (Math.hypot(e.pos.x - player.position.x, e.pos.z - player.position.z) < TUNING.nukeRadius) {
          damageMower(e.id, e.tier === 'combine' ? TUNING.nukeBossDamage : 1e6);
        }
      }
      juice.shake(1.2);
      playSfx('boom');
      break;
    case 'espresso':
      espressoS = TUNING.espressoS;
      break;
    case 'compostBin':
      pendingLevelUps += 1;
      break;
  }
}

function tickRun(dt: number, inp: InputState): void {
  run.elapsedS += dt;
  if (sandbox) {
    tickSandbox(dt, inp);
    return;
  }
  // Online: sim = this browser runs the world (host); sp = my gnome is dead and I am watching.
  const sim = !online || online.isHost;
  const sp = online?.spectating ?? false;

  // Day and night: banners at the turns, bonus XP in the dark.
  const dn = dayNight.update(dt);
  if (dn.phase !== lastDayPhase) {
    if (dn.phase === 'night') hud.banner('NIGHT FALLS', 'The mowers turned their headlights on. +25% XP until dawn.', 3.5);
    else if (dn.phase === 'dawn' && lastDayPhase === 'night') hud.banner('A NEW DAY DAWNS', 'You survived the night. The lawn is unimpressed.', 3.5);
    lastDayPhase = dn.phase;
  }
  const nightXp = dn.night01 > 0.5 ? TUNING.nightXpMult : 1;

  if (!sp) {
    const { jumped } = updatePlayer(player, inp, rig.yaw, OBSTACLES, stats, dt);
    if (jumped) playSfx('jump');
  }

  // Waves and bosses. Solo replays the waves each level with harder mowers; royale is a single level.
  const L = mode === 'solo' ? SOLO_LEVELS[levelIdx] : null;
  const levelTime = Math.max(0, run.elapsedS - levelStartS);
  const wi = waveIndexAt(levelTime);
  if (wi !== waveIndex && !demoSandbox) {
    waveIndex = wi;
    const b = WAVES[wi].banner;
    if (b && levelIdx === 0) hud.banner(b.title, b.sub, 3.5); // tier banners only the first time through
  }
  if (L && levelBannerAt > 0 && run.elapsedS >= levelBannerAt) {
    levelBannerAt = -1;
    hud.banner(L.name, L.sub, 4);
  }
  if (sim && !demoSandbox && !levelBossSpawned && !bossDone && levelTime >= (L ? L.bossAtS : TUNING.bossAtS)) {
    levelBossSpawned = true;
    run.bossSpawned = true;
    const count = L ? L.bossCount : 1;
    mowers.spawnBoss(count, L ? L.bossHpMult : 1);
    playSfx('bossWarning');
    if (count === 1) hud.banner('A COMBINE APPROACHES', 'Of course there is a boss fight. This is a roguelike.', 4);
    else if (count === 2) hud.banner('TWO COMBINES APPROACH', 'It brought a friend. Rude.', 4);
    else hud.banner(`${count} COMBINES APPROACH`, 'Just triple it. Absolutely unfair. Good luck.', 4);
  }

  // Mowers.
  const targets: THREE.Vector3[] = [player.position];
  if (online?.isHost) {
    const others = puppets.living('p');
    if (sp && others.length > 0) targets[0] = others[0]; // nobody chases a dead host
    targets.push(...others);
  }
  for (const c of bots.contestants()) if (c.alive) targets.push(c.pos);
  let kills: MowerKill[] = demoSandbox ? [] : mowers.update(dt, levelTime, targets, OBSTACLES, (x, z) => world.markMowed(x, z));
  if (online) {
    if (online.isHost) for (const k of kills) online.kills.push([r2(k.x), r2(k.z), k.tier, k.by ?? -1]);
    else kills = online.netKills.splice(0);
  }
  for (const k of kills) {
    // Online, drops go only to the gnome that landed the killing blow.
    if (online && k.by !== online.me) {
      juice.kill(k.x, k.z);
      continue;
    }
    run.kills += 1;
    const def = MOWER_TIERS[k.tier];
    drops.spawnXp(k.x, k.z, def.xp);
    if (k.tier === 'combine') {
      drops.spawnAcorns(k.x, k.z, TUNING.bossAcornDrop);
      juice.shake(1.5);
    } else if (Math.random() < def.acornChance * stats.acornLuck) {
      drops.spawnAcorns(k.x, k.z, 1);
    }
    juice.kill(k.x, k.z);
    playSfx('enemyDie');
  }
  // Every combine of this boss fight is down: the level is cleared.
  if (levelBossSpawned && victoryTimer < 0 && mowers.bossHp() === null) clearLevel();

  // Weapons.
  const enemiesNow = mowers.enemies();
  const ctx: WeaponContext = {
    dt,
    player: player.position,
    facing: player.facing,
    enemies: enemiesNow,
    stats,
    damage: (id, amount) => {
      const e = enemiesNow.find((m) => m.id === id);
      if (e && e.hp > 0) juice.damageNumber(e.pos.x, e.pos.y + 1.3, e.pos.z, amount);
      damageMower(id, amount);
      playSfx('enemyHit');
    },
    slow: (id, factor, seconds) => slowMower(id, factor, seconds),
    playSfx,
  };
  if (!sp) for (const w of weapons.values()) w.update(ctx);
  if (sp) {
    tickRoyale(dt, sim, sp);
    return;
  }

  // Pickups.
  const got = drops.update(dt, player.position, stats.magnetRadius);
  if (got.xp > 0) {
    pendingLevelUps += addXp(run, got.xp * stats.xpMultiplier * nightXp);
    playSfx('xp');
  }
  const acornGain = got.acorns + pickups.update(dt, player.position);
  if (acornGain > 0) {
    run.acorns += acornGain;
    pendingLevelUps += addXp(run, acornGain * TUNING.acornXp * stats.xpMultiplier * nightXp);
    playSfx('pickup');
  }
  for (const kind of items.update(dt, player.position)) applyItem(kind);

  if (espressoS > 0) {
    espressoS -= dt;
    player.stamina = stats.staminaMax;
    player.exhausted = false;
  }
  if (!bestToastDone && run.elapsedS > save.bestTimeS) {
    bestToastDone = true;
    juice.toast('NEW PERSONAL BEST', 'Every second from here is a record.', '#ffd54f');
  }

  // Contact damage.
  if (run.invulnS > 0) {
    run.invulnS -= dt;
  } else {
    for (const e of mowers.enemies()) {
      const def = MOWER_TIERS[e.tier];
      const d = Math.hypot(e.pos.x - player.position.x, e.pos.z - player.position.z);
      // A mower may be up on an obstacle (e.pos.y > 0): you clear it only by being above its top.
      if (d < PLAYER_RADIUS + e.radius && player.position.y < e.pos.y + def.height && player.position.y > e.pos.y - 0.6) {
        run.hearts -= def.contactDamage;
        run.invulnS = TUNING.invulnS + stats.invulnBonusS;
        killedBy = e.tier;
        killedByText = null;
        juice.hurt();
        juice.shake(0.5 * def.contactDamage);
        if (run.hearts > 0) playSfx('hurt');
        break;
      }
    }
  }
  if (mode === 'royale' && tickRoyale(dt, sim, sp)) return;
  // In first person you are the camera, so your own gnome is hidden.
  gnome.object.visible = rig.view !== 'first' && (run.invulnS <= 0 || Math.floor(run.invulnS * 12) % 2 === 0);

  // Engine drone from the nearest mower.
  let nearest = Infinity;
  for (const e of mowers.enemies()) {
    nearest = Math.min(nearest, Math.hypot(e.pos.x - player.position.x, e.pos.z - player.position.z));
  }
  setEngineLevel(Math.max(0, 1 - nearest / 15));

  hud.update({
    hearts: run.hearts,
    maxHearts: stats.maxHearts,
    stamina01: player.stamina / stats.staminaMax,
    exhausted: player.exhausted,
    xp01: run.xp / run.xpToNext,
    level: run.level,
    elapsedS: run.elapsedS,
    kills: run.kills,
    acorns: run.acorns,
    boss: mowers.bossHp(),
    runNumber: save.runs + 1,
    levelLabel: mode === 'solo' ? `LEVEL ${levelIdx + 1}` : '',
    buffs: espressoS > 0 ? [{ label: 'TRIPLE ESPRESSO', remaining01: espressoS / TUNING.espressoS }] : [],
  });

  if (run.hearts <= 0) {
    if (online) becomeSpectator();
    else endRun(false);
    return;
  }
  if (victoryTimer > 0) {
    victoryTimer -= dt;
    if (victoryTimer <= 0) {
      endRun(true);
      return;
    }
  }
  if (pendingLevelUps > 0 && celebrateS <= 0 && !sp) {
    celebrateS = TUNING.levelUpCelebrateS;
    juice.levelUp(run.level);
    playSfx('levelUp');
  }
}


/** Battle royale: the zone, the bots, the kill feed, the alive count. Returns true if the run ended. */
function tickRoyale(dt: number, sim: boolean, sp: boolean): boolean {
  const zs = zone.update(dt, run.elapsedS);
  const outside = !sp && zone.isOutside(player.position.x, player.position.z);
  if (outside) {
    zoneDmgTimer -= dt;
    if (zoneDmgTimer <= 0) {
      zoneDmgTimer = TUNING.zoneDamageEveryS * (zs.radius < TUNING.zoneLateRadius ? 0.5 : 1);
      run.hearts -= 1;
      killedBy = null;
      killedByText = 'THE MOW ZONE';
      juice.hurt();
      juice.shake(0.4);
      if (run.hearts > 0) playSfx('hurt');
    }
  } else {
    zoneDmgTimer = Math.min(zoneDmgTimer, 0.5);
  }
  if (sim) {
    const deaths = bots.update(dt, {
      elapsedS: run.elapsedS,
      enemies: mowers.enemies(),
      damageEnemy: (id, amount) => mowers.damage(id, amount, online ? -1 : undefined),
      zone,
      obstacles: OBSTACLES,
    });
    for (const d of deaths) {
      royaleHud.feed(d);
      online?.feed.push(d);
    }
  }
  if (!online) {
    royaleHud.update({ alive: bots.aliveCount() + (run.hearts > 0 ? 1 : 0), total: TUNING.royaleBots + 1, zone: zs, playerOutside: outside });
    if (run.hearts > 0 && bots.aliveCount() === 0) {
      hud.banner('#1 LAST GNOME STANDING', 'Winner winner, chicken dinner. Legally distinct.', 3);
      endRun(true);
      return true;
    }
    return false;
  }
  if (online.isHost) {
    let humans = run.hearts > 0 && !sp ? 1 : 0;
    for (const a of online.humansAlive.values()) if (a) humans++;
    online.alive = humans;
  }
  royaleHud.update({ alive: online.alive, total: online.total, zone: zs, playerOutside: outside });
  if (online.isHost && online.alive <= 1) {
    hostEndMatch();
    return true;
  }
  return false;
}

// ---------- online ----------
interface OnlineMatch {
  me: number;
  hostId: number;
  isHost: boolean;
  myColor: number;                      // my match colour (hat, name tag, kill feed)
  seed: number;
  order: number[];                      // player ids in join order (spawn ring slots)
  players: Map<number, PlayerInfo>;
  humansAlive: Map<number, boolean>;    // other players; the host counts these
  total: number;
  alive: number;                        // host: computed each tick; clients: from the last snap
  sendTimer: number;
  kills: KillSnap[];                    // host: queued for the next snap
  feed: KillEvent[];                    // host: queued for the next snap
  hits: [number, number, number, number][]; // client: queued for the host
  netKills: MowerKill[];                // client: kills from snaps, consumed by tickRun
  spectating: boolean;
  placement: number;
  over: boolean;
}

let net: NetClient | null = null;
let online: OnlineMatch | null = null;
const r2 = (v: number): number => Math.round(v * 100) / 100;

async function findMatch(code: string | null): Promise<void> {
  if (phase !== 'lobby') return;
  const nm = checkName(save.name);
  if (!nm.ok) {
    juice.toast('PICK ANOTHER NAME', nm.reason, '#ff8a80');
    return;
  }
  const url = serverUrl();
  if (!url) {
    lobbyUI.setMatchStatus(null);
    juice.toast('ONLINE IS OFF', 'This build has no matchmaking server (VITE_MP_URL).', '#ff8a80');
    return;
  }
  lobbyUI.setMatchStatus('CONNECTING TO THE LAWN...');
  try {
    if (!net) {
      net = createNetClient(url, { name: save.name, character: wireCharacter() });
      net.onMessage(onServerMsg);
      net.onClose(onNetClose);
    }
    await net.connect();
    net.queue(code, wireCharacter(), save.name);
    track('online_queue', { private: code !== null });
    queueing = true;
    void setAwake(true);
    if (!chat.enabled) {
      chat.setEnabled(true);
      chat.system('In the queue. Press Enter or T to chat.');
    }
  } catch {
    lobbyUI.setMatchStatus(null);
    juice.toast('NO SERVER', 'The matchmaking server did not answer. It may be waking up: try again.', '#ff8a80');
  }
}

/** Mower damage from my weapons: applied here when I run the world, else sent to the host (puppets only flash). */
function damageMower(id: number, amount: number): void {
  if (online && !online.isHost) {
    online.hits.push([id, amount, 1, 0]);
    mowers.damage(id, amount);
  } else {
    mowers.damage(id, amount, online ? online.me : undefined);
  }
}

function slowMower(id: number, factor: number, seconds: number): void {
  if (online && !online.isHost) online.hits.push([id, 0, factor, seconds]);
  else mowers.slow(id, factor, seconds);
}

function startOnline(m: Extract<ServerMsg, { t: 'match' }>): void {
  const players = new Map<number, PlayerInfo>();
  const humansAlive = new Map<number, boolean>();
  for (const p of m.players) {
    players.set(p.id, p);
    if (p.id !== m.you) humansAlive.set(p.id, true);
  }
  void prefetchLooks(m.players);
  const myColor = m.players.find((p) => p.id === m.you)?.color ?? 0xffffff;
  online = {
    me: m.you, hostId: m.hostId, isHost: m.hostId === m.you, myColor, seed: m.seed,
    order: m.players.map((p) => p.id), players, humansAlive,
    total: m.players.length, alive: m.players.length, sendTimer: 0,
    kills: [], feed: [], hits: [], netKills: [],
    spectating: false, placement: 0, over: false,
  };
  setPlayerCharacter(save.character, myColor);
  track('online_match', { players: m.players.length, host: m.hostId === m.you });
  startRun('royale', 1);
  // Test hook: ?die drops my hearts to 0 two seconds in, to try spectating.
  if (new URLSearchParams(location.search).has('die')) setTimeout(() => { if (phase === 'playing') run.hearts = 0; }, 2000);
}

function onServerMsg(m: ServerMsg): void {
  switch (m.t) {
    case 'queued':
      if (phase === 'lobby') {
        const n = m.players;
        if (n < MIN_PLAYERS) {
          lobbyUI.setMatchStatus(`WAITING FOR ANOTHER GNOME...${m.code ? ` · CODE ${m.code}` : ''}`);
        } else {
          lobbyUI.setMatchStatus(`${n} GNOME${n === 1 ? '' : 'S'} FOUND · STARTS IN ${m.startsInS}s${m.code ? ` · CODE ${m.code}` : ''}`);
        }
      }
      break;
    case 'match':
      if (phase !== 'lobby') {
        net?.leave();
        break;
      }
      lobbyUI.setMatchStatus(null);
      queueing = false;
      startOnline(m);
      chat.system('Match on! Press Enter or T to chat.');
      break;
    case 'relay':
      onGameMsg(m.from, m.d);
      break;
    case 'chat':
      if (chat.enabled) chat.add(m.name, m.color, m.text);
      break;
    case 'host':
      onHostChange(m.hostId);
      break;
    case 'left':
      if (online) {
        puppets.remove('p' + m.id);
        if (online.humansAlive.get(m.id)) {
          online.humansAlive.set(m.id, false);
          const cause = m.reason === 'timeout' ? 'A BAD CONNECTION' : 'THE EXIT BUTTON';
          const ev = { victim: online.players.get(m.id)?.name ?? '???', cause, color: online.players.get(m.id)?.color };
          if (online.isHost) online.feed.push(ev);
          royaleHud.feed(ev);
        }
      }
      break;
    case 'ended':
      if (online) finishOnline(m.reason);
      else if (phase === 'lobby') {
        lobbyUI.setMatchStatus(null);
        endOnlineSession();
        juice.toast('MATCHMAKING STOPPED', m.reason, '#ff8a80');
      }
      break;
    case 'error':
      if (m.code === 'chat-rate') {
        chat.system(m.message);
        break;
      }
      if (m.code === 'bad-name') juice.toast('PICK ANOTHER NAME', m.message, '#ff8a80');
      else juice.toast('THE SERVER SAYS NO', m.message, '#ff8a80');
      if (phase === 'lobby') {
        lobbyUI.setMatchStatus(null);
        endOnlineSession();
      }
      break;
    default:
      break;
  }
}

function onNetClose(): void {
  if (online) finishOnline('LOST CONNECTION TO THE LAWN');
  else if (phase === 'lobby') {
    lobbyUI.setMatchStatus(null);
    if (queueing) juice.toast('LOST CONNECTION', 'Check your signal and press PLAY again.', '#ff8a80');
  }
  endOnlineSession();
}

/** The server picked a new host (the old one left or went silent). If it is me, my game takes over the world. */
function onHostChange(hostId: number): void {
  if (!online || online.over) return;
  const wasHost = online.isHost;
  online.hostId = hostId;
  online.isHost = hostId === online.me;
  track('host_change', { me: online.isHost });
  if (online.isHost && !wasHost) {
    mowers.setPuppet(false); // the mowers I was mirroring are now mine to simulate
    online.hits = [];
    online.netKills = [];
    // Boss state only lived on the old host: a living combine means the fight is on; none after its time means it was beaten.
    if (mowers.bossHp() !== null) levelBossSpawned = true;
    else if (run.elapsedS - levelStartS >= TUNING.bossAtS) bossDone = true;
    hud.banner('YOU ARE NOW HOSTING', 'The host left, so your game runs the lawn now. Please do not close the tab.', 4);
    chat.system('You are now hosting the match.');
  } else if (!online.isHost) {
    chat.system(`${online.players.get(hostId)?.name ?? 'Someone'} is now hosting the match.`);
  }
}

// ---------- connection health ----------
// Phones lose connections silently (Wi-Fi to cellular, weak signal, screen lock): the socket looks
// open while nothing gets through. The server sends something every second (queue status or a
// match 'beat'), so a long silence means my connection is gone. Players who go silent are removed
// by the server (MATCH_SILENT_S), which also hands hosting to someone else.
const NET_STALL_MS = 4000;        // nothing from the server for this long = disconnected
const BACKGROUND_LEAVE_MS = 6000; // tab hidden this long mid-match: everyone else saw me freeze, so leave

let queueing = false;
let hiddenAt = 0;

/** Leaving online play (cancelled, back in the lobby, disconnected): chat off, the screen may sleep
 *  again, and the socket closes so an idle tab does not keep the server machine awake. PLAY reconnects. */
function endOnlineSession(): void {
  queueing = false;
  chat.setEnabled(false);
  void setAwake(false);
  net?.drop(); // no-op when already closed; its onClose (onNetClose) finds nothing left to end
}

/** Called every frame: drops a stalled socket (onNetClose then ends the match or the search). */
function watchConnection(): void {
  if (!net || !net.connected) return;
  if (!((online && !online.over) || queueing)) return;
  if (performance.now() - net.lastHeardAt > NET_STALL_MS) net.drop();
}

// Screen Wake Lock: keeps phone screens on while queueing or in a match, so the phone does not
// sleep (and drop the connection) while you wait or spectate. Browsers release it when the tab
// is hidden; it is taken again on return.
let wakeWanted = false;
let wakeLock: WakeLockSentinel | null = null;
async function setAwake(on: boolean): Promise<void> {
  wakeWanted = on;
  if (!on) {
    const lock = wakeLock;
    wakeLock = null;
    await lock?.release().catch(() => {});
    return;
  }
  if (wakeLock || document.hidden || !('wakeLock' in navigator)) return;
  try {
    const lock = await navigator.wakeLock.request('screen');
    if (!wakeWanted) {
      await lock.release();
      return;
    }
    wakeLock = lock;
    lock.addEventListener('release', () => {
      if (wakeLock === lock) wakeLock = null;
    });
  } catch {
    // denied (battery saver, unsupported): play on without it
  }
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    hiddenAt = performance.now();
    return;
  }
  if (wakeWanted) void setAwake(true);
  // My game was frozen while hidden; the others saw me stand still. Leave rather than play on out of sync.
  if (online && !online.over && performance.now() - hiddenAt > BACKGROUND_LEAVE_MS) {
    finishOnline('THE GAME WENT TO SLEEP (phone locked or app switched)');
  }
});

function onGameMsg(from: number, d: GameMsg): void {
  if (!online || online.over) return;
  switch (d.k) {
    case 'me': {
      const p = online.players.get(from);
      if (!p) return;
      puppets.set({
        key: 'p' + from, name: p.name, x: d.x, y: d.y, z: d.z, facing: d.facing, alive: d.alive,
        character: p.character !== 'mine' && Object.prototype.hasOwnProperty.call(CHARACTERS, p.character) ? (p.character as CharacterId) : 'gnorman',
        color: p.color,
        look: resolveLook(p) ?? undefined,
      });
      if (!d.alive && online.humansAlive.get(from)) online.humansAlive.set(from, false);
      break;
    }
    case 'hits':
      if (!online.isHost) return;
      for (const [id, amount, factor, seconds] of d.list) {
        if (amount > 0) mowers.damage(id, amount, from);
        if (seconds > 0) mowers.slow(id, factor, seconds);
      }
      break;
    case 'died': {
      if (!online.isHost || online.humansAlive.get(from) === undefined) return;
      online.humansAlive.set(from, false);
      const ev = { victim: online.players.get(from)?.name ?? '???', cause: d.cause, color: online.players.get(from)?.color };
      royaleHud.feed(ev);
      online.feed.push(ev);
      break;
    }
    case 'snap': {
      if (online.isHost) return;
      run.elapsedS = d.t;
      mowers.applySnapshot(d.mowers);
      const seen = new Set<string>();
      for (const [id, name, x, y, z, alive] of d.bots) {
        const key = 'b' + id;
        seen.add(key);
        puppets.set({ key, name, x, y, z, facing: null, alive: alive === 1, character: null, color: null });
      }
      for (const key of puppets.keys()) if (key.startsWith('b') && !seen.has(key)) puppets.remove(key);
      for (const [x, z, tier, by] of d.kills) {
        if (Object.prototype.hasOwnProperty.call(MOWER_TIERS, tier)) online.netKills.push({ id: 0, tier: tier as MowerTier, x, z, by });
      }
      for (const f of d.feed) royaleHud.feed(f);
      online.alive = d.alive;
      online.total = d.total;
      break;
    }
    case 'over':
      onOver(d.winner, d.winnerName);
      break;
    default:
      break;
  }
}

/** My gnome died online: the match goes on, so watch instead of ending the run. */
function becomeSpectator(): void {
  if (!online || online.spectating) return;
  online.spectating = true;
  // Host: alive was just counted without me. Client: the last snap still counted me.
  online.placement = online.isHost ? online.alive + 1 : online.alive;
  const cause = killedByText ?? (killedBy ? MOWER_TIERS[killedBy].name : 'a lawn mower');
  if (online.isHost) {
    const ev = { victim: save.name, cause, color: online.myColor };
    royaleHud.feed(ev);
    online.feed.push(ev);
  } else {
    net?.send(online.hostId, { k: 'died', cause });
  }
  gnome.setDead(true);
  playSfx('hit');
  hud.banner(`YOU PLACED #${online.placement}`, 'Spectating. A/D switches gnomes, F flies a free camera. (Esc for the menu.)', 4);
  specPos.copy(player.position);
  specKey = null;
  specFree = false;
  specStep(1);
  if (rig.view === 'first') rig.view = 'third';
  spectateBar.show();
}

// ---------- spectating (online, after my gnome died) ----------
const SPEC_FREE_SPEED = 14;    // free camera, units per second (x2.5 with sprint)
const SPEC_FREE_RADIUS = 260;  // free camera stays within this distance of the lawn's centre
let specKey: string | null = null; // puppet key being followed ('p<id>')
let specFree = false;
const specPos = new THREE.Vector3();

/** Other players whose gnome is still alive, in join order. */
function specCandidates(): { key: string; name: string; color: number }[] {
  const out: { key: string; name: string; color: number }[] = [];
  if (!online) return out;
  for (const id of online.order) {
    if (id === online.me) continue;
    const key = 'p' + id;
    if (!puppets.position(key)) continue;
    const info = online.players.get(id);
    out.push({ key, name: info?.name ?? '???', color: info?.color ?? 0xffffff });
  }
  return out;
}

/** Follow the next (dir 1) or previous (dir -1) living player; free camera when nobody is left. */
function specStep(dir: number): void {
  const list = specCandidates();
  if (list.length === 0) {
    specKey = null;
    specFree = true;
    return;
  }
  const i = list.findIndex((c) => c.key === specKey);
  const next = i < 0 ? (dir >= 0 ? 0 : list.length - 1) : (i + dir + list.length) % list.length;
  specKey = list[next].key;
  specFree = false;
}

function toggleSpecFree(): void {
  if (specFree) specStep(1);
  else specFree = true;
}

const spectateBar = createSpectateBar(uiRoot, {
  onPrev: () => specStep(-1),
  onNext: () => specStep(1),
  onToggleFree: toggleSpecFree,
});

window.addEventListener('keydown', (e) => {
  if (!online?.spectating || online.over || phase !== 'playing' || e.repeat) return;
  if (e.code === 'KeyF') toggleSpecFree();
  else if (specFree) return;
  else if (e.code === 'KeyA' || e.code === 'ArrowLeft') specStep(-1);
  else if (e.code === 'KeyD' || e.code === 'ArrowRight' || e.code === 'Space') specStep(1);
});

/** The point the camera orbits while spectating: the followed gnome, or the free camera. */
function spectateFocus(dt: number, inp: InputState): THREE.Vector3 {
  if (!specFree) {
    let pos = specKey ? puppets.position(specKey) : null;
    if (!pos) {
      specStep(1); // they died or left: move on
      pos = specKey ? puppets.position(specKey) : null;
    }
    if (pos) specPos.lerp(pos, 1 - Math.exp(-8 * dt));
  }
  if (specFree) {
    const fx = Math.sin(rig.yaw);
    const fz = Math.cos(rig.yaw);
    const step = SPEC_FREE_SPEED * (inp.sprint ? 2.5 : 1) * dt;
    specPos.x += (fx * inp.moveY - fz * inp.moveX) * step;
    specPos.z += (fz * inp.moveY + fx * inp.moveX) * step;
    const r = Math.hypot(specPos.x, specPos.z);
    if (r > SPEC_FREE_RADIUS) specPos.multiplyScalar(SPEC_FREE_RADIUS / r);
    specPos.y = heightAt(specPos.x, specPos.z);
  }
  const t = specFree ? undefined : specCandidates().find((c) => c.key === specKey);
  spectateBar.set(t ? { name: t.name, color: t.color } : null, online?.alive ?? 0);
  return specPos;
}

/** Host: one gnome (or none) left. */
function hostEndMatch(): void {
  if (!online || online.over) return;
  let winner = -1;
  let winnerName = 'NOBODY (the mowers win)';
  if (run.hearts > 0 && !online.spectating) {
    winner = online.me;
    winnerName = save.name;
  } else {
    for (const [id, a] of online.humansAlive) {
      if (a) {
        winner = id;
        winnerName = online.players.get(id)?.name ?? '???';
      }
    }
  }
  net?.send(null, { k: 'over', winner, winnerName });
  onOver(winner, winnerName);
}

function onOver(winner: number, winnerName: string): void {
  if (!online || online.over) return;
  track('online_end', { reason: 'over', won: winner === online.me });
  online.over = true;
  const won = winner === online.me;
  if (won) hud.banner('#1 LAST GNOME STANDING', 'Winner winner, chicken dinner. Legally distinct.', 3);
  else if (!online.spectating) {
    killedBy = null;
    killedByText = `${winnerName} WINNING`;
  }
  endRun(won);
}

/** Leave a live match (quit, host gone, connection lost). */
function finishOnline(reason: string): void {
  if (!online || online.over) return;
  track('online_end', {
    reason: reason.startsWith('LOST CONNECTION') ? 'net_lost' : reason.startsWith('THE GAME WENT TO SLEEP') ? 'background'
      : reason.startsWith('GIVING UP') ? 'quit' : 'ended',
  });
  online.over = true;
  net?.leave();
  if (!online.spectating) {
    killedBy = null;
    killedByText = reason;
  }
  endRun(false);
}

/** Sends my gnome to everyone, and the world (host) or my hits (client), NET_SEND_HZ times a second. */
function netTick(dt: number): void {
  if (!online || online.over || !net) return;
  online.sendTimer -= dt;
  if (online.sendTimer > 0) return;
  online.sendTimer = 1 / NET_SEND_HZ;
  const p = player.position;
  net.send(null, { k: 'me', x: r2(p.x), y: r2(p.y), z: r2(p.z), facing: r2(player.facing), alive: !online.spectating });
  if (online.isHost) {
    net.send(null, {
      k: 'snap', t: r2(run.elapsedS), mowers: mowers.snapshot(),
      bots: [],
      kills: online.kills.splice(0), feed: online.feed.splice(0), alive: online.alive, total: online.total,
    });
  } else if (online.hits.length > 0) {
    net.send(online.hostId, { k: 'hits', list: online.hits.splice(0) });
  }
}

// ---------- loop ----------
goLobby();

// Test hooks for headless smoke tests and screenshots: ?autostart=solo|royale skips the lobby; &pause pauses after 1.5 s.
{
  const params = new URLSearchParams(location.search);
  // &character=gnancy picks a character (also works on the lobby screen).
  const ch = params.get('character');
  if (ch && ch in CHARACTERS && ch !== save.character) lobbyCallbacks.onSelectCharacter(ch as CharacterId);
  const auto = params.get('autostart');
  // ?autostart=online[&code=ABCD] goes straight into matchmaking.
  if (auto === 'online') lobbyCallbacks.onFindMatch(params.get('code')?.toUpperCase() ?? null);
  if (auto === 'solo' || auto === 'royale') {
    // &sandbox: an empty lawn for recording demos (tools/record-demo.mjs). No mowers, waves or boss.
    demoSandbox = auto === 'solo' && params.has('sandbox');
    startRun(auto);
    // &level=2|3 starts a solo run on that level; &boss brings its boss fight in now.
    const lv = parseInt(params.get('level') ?? '', 10);
    if (auto === 'solo' && lv >= 2 && lv <= SOLO_LEVELS.length) {
      levelIdx = lv - 1;
      mowers.setDifficulty(SOLO_LEVELS[levelIdx]);
    }
    if (auto === 'solo' && params.has('boss')) levelStartS = -SOLO_LEVELS[levelIdx].bossAtS;
    // &at=x,z drops the gnome at that point on the terrain (for looking at hills).
    const at = (params.get('at') ?? '').split(',').map(Number);
    if (at.length === 2 && at.every(Number.isFinite)) player.position.set(at[0], heightAt(at[0], at[1]), at[1]);
    // &facing=<degrees> turns the gnome (0 faces the default camera's forward).
    const facingDeg = parseFloat(params.get('facing') ?? '');
    if (Number.isFinite(facingDeg)) player.facing = (facingDeg * Math.PI) / 180;
    // &cam=back|side|front|top|first, or &cam=<degrees> round the gnome from behind.
    const cam = params.get('cam');
    if (cam) {
      const offsets: Record<string, number> = { back: 0, side: 90, front: 180 };
      const deg = cam in offsets ? offsets[cam] : parseFloat(cam);
      rig.view = cam === 'top' || cam === 'first' ? cam : 'third';
      rig.reset(player.facing + (Number.isFinite(deg) ? (deg * Math.PI) / 180 : 0));
    }
    // &nohud hides every UI module's container (not #ui itself) for clean recordings.
    if (params.has('nohud')) {
      const style = document.createElement('style');
      style.textContent = '#ui > * { display: none !important; }';
      document.head.append(style);
    }
    if (params.has('pause')) setTimeout(() => pauseGame(), 1500);
  }
  // &time=0..1 jumps the clock (0 sunrise, 0.25 noon, 0.5 sunset, 0.75 midnight).
  const time = parseFloat(params.get('time') ?? '');
  if (Number.isFinite(time)) {
    dayNight.setTime(time);
    lastDayPhase = dayNight.state().phase;
  }
}

const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.05);
  const inp = input.read(dt);

  if (phase === 'playing') {
    // Online, the world cannot slow down for one player's level-up.
    tickRun(dt * (celebrateS > 0 && !online ? TUNING.levelUpTimeScale : 1), inp);
    if (celebrateS > 0) {
      celebrateS -= dt;
      if (celebrateS <= 0 && phase === 'playing') openLevelUp();
    }
  } else if (online && !online.over && (phase === 'levelup' || phase === 'paused')) {
    // Online, menus do not pause the match: your gnome just stands there.
    tickRun(dt, NO_INPUT);
  }
  watchConnection();
  if (online && !online.over) netTick(dt);
  puppets.update(dt);

  let focus = player.position;
  if (phase === 'lobby') {
    player.facing += dt * 0.5;
    lobbyStage.update(dt);
    camera.position.set(0.9, 1.25, 4.2);
    camera.lookAt(0.9, 0.85, 0);
  } else {
    const camInp = phase === 'playing' ? inp : NO_INPUT;
    if (online?.spectating && !online.over) focus = spectateFocus(dt, camInp);
    rig.update(focus, camInp, dt);
  }

  juice.update(dt, camera, phase === 'playing' ? items.active() : []);
  cullProps(dt, focus);
  gnome.update(player, dt);
  // Apply the time of day to everything that is lit or coloured by it.
  const dnState = dayNight.state();
  if (scene.fog instanceof THREE.Fog) scene.fog.color.copy(dnState.fogColor);
  if (scene.background instanceof THREE.Color) scene.background.copy(dnState.fogColor);
  world.setLighting(dnState);
  scenery.setSky(dnState);
  houseLights.setNight(dnState.night01);
  mowers.setNight(dnState.night01);
  world.setShadowRange(phase === 'playing' && rig.view === 'top' ? 80 : 35);
  world.update(dt, focus);
  scenery.update(dt, focus);
  postfx.render(dt);
});
