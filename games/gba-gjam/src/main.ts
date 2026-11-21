// GBA GJAM entry point: loads player's @lawn/gnome, wires achievements, audio,
// indoor Gnomerena renderer, 2-on-2 simulation, @lawn/mp online multiplayer, input, and UI.
import { createAchievementTracker } from '@lawn/achievements';
import { getMyGnome, loadMyGnome } from '@lawn/gnome';
import { whileHidden } from '@lawn/mp/background';
import { showSyncNotice, watchKey } from '@lawn/sync';
import { JamAudio } from './audio';
import { cloud, onCloudMerged } from './cloud';
import { JamInput } from './input';
import { JamNet, type SimEvent } from './net';
import { JamRenderer } from './renderer';
import { SAVE_KEY, onSaveWritten } from './save';
import { JamSimulation } from './sim';
import { customGnomeToProfile, getTeamById } from './teams';
import { JamUI } from './ui';
import type { MatchConfig } from './types';

async function boot(): Promise<void> {
  await loadMyGnome();
  onSaveWritten(() => cloud.pushSave());
  await cloud.syncAtStartup();

  const canvas = document.getElementById('game') as HTMLCanvasElement;
  const uiRoot = document.getElementById('ui') as HTMLElement;

  const achievements = createAchievementTracker({ ui: uiRoot });
  const audio = new JamAudio();
  const input = new JamInput();
  const renderer = new JamRenderer(canvas);

  let sim: JamSimulation | null = null;
  let activeConfig: MatchConfig | null = null;
  let paused = false;
  let jumboTick = 0;

  const playSound = (
    kind:
      | 'bounce'
      | 'swish'
      | 'swish3'
      | 'clang'
      | 'dunk'
      | 'dunkFire'
      | 'pass'
      | 'shove'
      | 'block'
      | 'fire'
      | 'whistle'
      | 'buzzer'
      | 'cheer',
  ): void => {
    switch (kind) {
      case 'bounce': audio.playBounce(); break;
      case 'swish': audio.playSwish(false); break;
      case 'swish3': audio.playSwish(true); break;
      case 'clang': audio.playRimClang(); break;
      case 'dunk': audio.playDunk(false); break;
      case 'dunkFire': audio.playDunk(true); break;
      case 'pass': audio.playPass(); break;
      case 'shove': audio.playShove(); break;
      case 'block': audio.playBlock(); break;
      case 'fire': audio.playFire(); break;
      case 'whistle': audio.playWhistle(); break;
      case 'buzzer': audio.playBuzzer(); break;
      case 'cheer': audio.playCrowdCheer(0.95); break;
    }
  };

  let ui: JamUI;

  const net = new JamNet({
    onStatus: (st) => ui.updateOnlineStatus(st),
    onStartOnlineMatch: (config) => {
      ui.clearScreens();
      ui.showHUD(true);
      startMatch(config);
    },
    onRemoteEvent: (ev: SimEvent) => {
      if (ev.kind === 'announce') {
        ui.announce(ev.ev);
        audio.announce(ev.ev);
      }
      else if (ev.kind === 'sound') playSound(ev.sound);
      else if (ev.kind === 'rimShake') renderer.arena.shakeRim(ev.side, ev.strength);
      else if (ev.kind === 'cameraPunch') renderer.punchCamera(ev.strength);
      else if (ev.kind === 'burst') {
        const THREE_VEC = sim?.ball.pos.clone().set(ev.x, ev.y, ev.z);
        if (THREE_VEC) renderer.spawnBurst(THREE_VEC, ev.burstKind, ev.color);
      }
    },
    onRemoteMatchEnd: (result) => {
      audio.setMusicMode('chill');
      input.setTouchVisible(false);
      const cfg = activeConfig!;
      sim = null;
      renderer.setMode('attract');
      ui.showPostGame(result, cfg);
    },
    onOpponentLeft: (reason) => {
      audio.setMusicMode('chill');
      input.setTouchVisible(false);
      sim = null;
      paused = false;
      renderer.setMode('attract');
      ui.showOnlineDisconnected(reason);
    },
    onRemoteLooksUpdated: (players) => {
      if (!sim) return;
      net.applyFetchedLooksToSim(sim, players);
      renderer.refreshPlayerLooks(sim);
    },
  });

  function startMatch(config: MatchConfig): void {
    audio.unlock();
    audio.startMusic('court');
    activeConfig = config;
    paused = false;

    const home = getTeamById(config.homeTeamId);
    const away = getTeamById(config.awayTeamId);
    const isOnlineHost = config.opponentMode === 'online' && Boolean(config.onlineContext?.isHost);

    sim = new JamSimulation(
      config,
      {
        onAnnounce: (ev) => {
          ui.announce(ev);
          audio.announce(ev);
          if (isOnlineHost) net.sendEvent({ kind: 'announce', ev });
        },
        onSound: (kind) => {
          playSound(kind);
          if (isOnlineHost) net.sendEvent({ kind: 'sound', sound: kind });
        },
        onRimShake: (side, strength) => {
          renderer.arena.shakeRim(side, strength);
          if (isOnlineHost) net.sendEvent({ kind: 'rimShake', side, strength });
        },
        onCameraPunch: (strength) => {
          renderer.punchCamera(strength);
          if (isOnlineHost) net.sendEvent({ kind: 'cameraPunch', strength });
        },
        onBurst: (pos, kind, color) => {
          renderer.spawnBurst(pos, kind, color);
          if (isOnlineHost) net.sendEvent({ kind: 'burst', x: pos.x, y: pos.y, z: pos.z, burstKind: kind, color });
        },
        onAchievement: (kind) => {
          if (kind === 'dunk') void achievements.unlock('jam-first-dunk');
          else if (kind === 'fire') void achievements.unlock('jam-on-fire');
          else if (kind === 'three') void achievements.increment('jam-downtown');
          else if (kind === 'win') void achievements.unlock('jam-first-win');
        },
        onMatchEnd: (result) => {
          audio.setMusicMode('chill');
          input.setTouchVisible(false);
          const cfg = activeConfig!;
          if (isOnlineHost) net.sendMatchEnd(result);
          sim?.dispose();
          sim = null;
          renderer.setMode('attract');
          ui.showPostGame(result, cfg);
        },
      },
      {
        onError: (err) => {
          ui.announce({ text: 'BOT SCRIPT ERROR', subtext: err, color: '#ff5555' });
        },
      },
    );

    renderer.mountMatch(sim, home, away);
    input.setTouchVisible(config.opponentMode !== 'botvsbot');
  }

  ui = new JamUI(uiRoot, {
    volume: audio.volume,
    onClickSound: () => {
      audio.unlock();
      audio.playClick();
      if (!sim) audio.startMusic('chill');
    },
    onNextBeat: () => audio.nextBeatTrack(),
    currentBeatName: () => audio.currentBeatTrack(),
    onPreviewGnome: (look) => {
      if (look) {
        renderer.showPreviewGnome(look);
        renderer.setMode('preview');
      } else if (!sim) {
        renderer.setMode('attract');
      }
    },
    onStartMatch: (config) => {
      startMatch(config);
    },
    onPauseToggle: () => {
      if (!sim) return;
      paused = !paused;
      if (activeConfig?.opponentMode !== 'online') {
        audio.setMusicMode(paused ? 'chill' : 'court');
      }
      ui.showPauseMenu(paused);
      input.setTouchVisible(!paused);
    },
    onQuitMatch: () => {
      audio.stopAnnouncer();
      audio.setMusicMode('chill');
      sim?.dispose();
      if (activeConfig?.opponentMode === 'online') {
        net.leave();
      }
      sim = null;
      paused = false;
      input.setTouchVisible(false);
      renderer.setMode('attract');
    },
    onSeasonChampion: () => {
      void achievements.unlock('jam-champion');
    },
    isOnlineAvailable: () => net.isAvailable(),
    onOnlineQueue: (code, payload) => {
      const team = getTeamById(payload.teamId);
      const customProfile = payload.useCustom
        ? customGnomeToProfile(payload.customGnome, team)
        : undefined;
      const displayName = getMyGnome()?.name || payload.customGnome.name || 'Gnome';
      void net.queue(code, displayName, {
        teamId: payload.teamId,
        useCustom: payload.useCustom,
        duo: payload.duo,
        customProfile,
        difficulty: payload.difficulty,
        quarterSeconds: payload.quarterSeconds,
      });
    },
    onOnlineLeave: () => {
      net.leave();
    },
    isBigHead: () => renderer.isBigHead(),
    onToggleBigHead: () => {
      const next = !renderer.isBigHead();
      renderer.setBigHead(next);
      audio.unlock();
      if (next) audio.playFire();
      else audio.playClick();
      if (sim) {
        ui.announce({
          text: next ? '🗿 BIGHEAD MODE ON!' : 'BIGHEAD MODE OFF',
          subtext: next ? 'CLASSIC GBA CHEAT ACTIVATED!' : undefined,
          color: '#ffd21f',
          big: true,
        });
      }
      return next;
    },
    isAnnouncerEnabled: () => audio.isAnnouncerEnabled(),
    onToggleAnnouncer: () => {
      const next = !audio.isAnnouncerEnabled();
      audio.setAnnouncerEnabled(next);
      return next;
    },
  });

  // Classic keyboard cheatcode listener: type BIGHEAD anywhere (outside inputs)
  let cheatBuf = '';
  window.addEventListener('keydown', (e) => {
    const tag = (e.target as HTMLElement | null)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    if (e.key.length === 1 && /^[a-zA-Z]$/.test(e.key)) {
      cheatBuf = (cheatBuf + e.key.toUpperCase()).slice(-7);
      if (cheatBuf === 'BIGHEAD') {
        cheatBuf = '';
        const next = !renderer.isBigHead();
        renderer.setBigHead(next);
        audio.unlock();
        if (next) audio.playFire();
        else audio.playClick();
        if (sim) {
          ui.announce({
            text: next ? '🗿 BIGHEAD MODE ON!' : 'BIGHEAD MODE OFF',
            subtext: next ? 'CLASSIC GBA CHEAT ACTIVATED!' : undefined,
            color: '#ffd21f',
            big: true,
          });
        } else if (document.getElementById('jam-title')) {
          ui.showTitle();
        }
      }
    }
  });

  input.mountTouchControls(ui.root);
  onCloudMerged(() => {
    ui.reloadSaveFromStorage();
    showSyncNotice('Progress from your other device was added to GBA GJAM.');
  });
  watchKey(SAVE_KEY, () => {
    ui.reloadSaveFromStorage();
    showSyncNotice('Your GBA GJAM save changed in another tab.');
  });
  cloud.onStatus(() => {
    if (document.getElementById('jam-title')) ui.showTitle();
  });
  ui.showTitle();

  // Expose read-only state & bot-swap hook for AI/ML experiments
  (window as unknown as Record<string, unknown>).__GBA_JAM__ = {
    getGameState: () => sim?.getSnapshot() ?? null,
    setBot: (slot: 0 | 1 | 2 | 3, bot: Parameters<JamSimulation['setBot']>[1]) => sim?.setBot(slot, bot),
  };

  function stepSimulation(dt: number, hidden: boolean): void {
    if (sim && activeConfig) {
      if (activeConfig.opponentMode === 'online') {
        const isHost = activeConfig.onlineContext?.isHost ?? false;
        const myTeam = activeConfig.onlineContext?.myTeam ?? 0;
        const localIn = hidden
          ? { moveX: 0, moveZ: 0, turbo: false, shootDown: false, shootPressed: false, shootReleased: false, passPressed: false, fakePressed: false }
          : input.pollP1(true);

        if (isHost) {
          const remoteIn = net.consumeRemoteInput();
          const p1In = myTeam === 0 ? localIn : remoteIn;
          const p2In = myTeam === 1 ? localIn : remoteIn;
          sim.step(dt, p1In, p2In);
          net.tick(dt, sim, null);
        } else {
          net.applySnapshotToGuest(sim, dt);
          net.tick(dt, sim, localIn);
        }
      } else if (!paused && !hidden) {
        const p1In = input.pollP1(activeConfig.opponentMode === 'ai');
        const p2In = input.pollP2();
        sim.step(dt, p1In, p2In);
      }
    } else {
      net.tick(dt, null, null);
    }
  }

  // Keep online simulation/keepalives running even if tab is backgrounded
  whileHidden((dt) => {
    stepSimulation(dt, true);
  });

  // Main 60fps animation loop
  let lastTs = performance.now();
  const loop = (now: number): void => {
    requestAnimationFrame(loop);
    const dt = Math.min(0.05, Math.max(0.001, (now - lastTs) / 1000));
    lastTs = now;

    if (sim && input.isPausePressed()) {
      paused = !paused;
      ui.showPauseMenu(paused);
      input.setTouchVisible(!paused);
    }

    stepSimulation(dt, false);

    if (sim && activeConfig) {
      const activeSim = sim;
      const home = getTeamById(activeConfig.homeTeamId);
      const away = getTeamById(activeConfig.awayTeamId);
      const hasP2 = activeConfig.opponentMode === 'local2p' || activeConfig.opponentMode === 'online';
      const isBotOnly = activeConfig.opponentMode === 'botvsbot';
      ui.updateHUD(
        home.abbr,
        away.abbr,
        activeSim.score[0],
        activeSim.score[1],
        activeSim.quarter,
        activeSim.clockSec,
        activeSim.shotClock,
        activeSim.players.map((p, idx) => ({
          name: p.profile.name,
          turbo: p.turbo,
          onFire: p.onFire,
          role:
            !isBotOnly && idx === activeSim.p1ControlIdx
              ? 'P1'
              : hasP2 && idx === activeSim.p2ControlIdx
                ? 'P2'
                : 'CPU',
          teamColor: p.team === 0 ? home.primaryHex : away.primaryHex,
        })),
      );

      jumboTick += dt;
      if (jumboTick >= 0.2) {
        jumboTick = 0;
        const onFirePlayer = sim.players.find((p) => p.onFire);
        audio.setMusicMode(onFirePlayer ? 'fire' : 'court');
        renderer.updateJumbotron({
          homeAbbr: home.abbr,
          awayAbbr: away.abbr,
          homeHex: home.primaryHex,
          awayHex: away.primaryHex,
          homeScore: sim.score[0],
          awayScore: sim.score[1],
          quarter: sim.quarter,
          clockSec: sim.clockSec,
          shotClock: sim.shotClock,
          onFireText: onFirePlayer ? `🔥 ${onFirePlayer.profile.name.toUpperCase()} IS ON FIRE! 🔥` : undefined,
        });
      }
    }

    renderer.render(dt, sim);
  };
  requestAnimationFrame(loop);
}

void boot();
