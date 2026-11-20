// GBA GJAM entry point: loads player's @lawn/gnome, wires achievements, audio,
// indoor Gnomerena renderer, 2-on-2 simulation, input, and UI.
import { createAchievementTracker } from '@lawn/achievements';
import { loadMyGnome } from '@lawn/gnome';
import { JamAudio } from './audio';
import { JamInput } from './input';
import { JamRenderer } from './renderer';
import { JamSimulation } from './sim';
import { getTeamById } from './teams';
import { JamUI } from './ui';
import type { MatchConfig } from './types';

async function boot(): Promise<void> {
  await loadMyGnome();

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

  const ui = new JamUI(uiRoot, {
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
      audio.unlock();
      audio.startMusic('court');
      activeConfig = config;
      paused = false;

      const home = getTeamById(config.homeTeamId);
      const away = getTeamById(config.awayTeamId);

      sim = new JamSimulation(config, {
        onAnnounce: (ev) => ui.announce(ev),
        onSound: (kind) => {
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
        },
        onRimShake: (side, strength) => renderer.arena.shakeRim(side, strength),
        onCameraPunch: (strength) => renderer.punchCamera(strength),
        onBurst: (pos, kind, color) => renderer.spawnBurst(pos, kind, color),
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
          sim = null;
          renderer.setMode('attract');
          ui.showPostGame(result, cfg);
        },
      });

      renderer.mountMatch(sim, home, away);
      input.setTouchVisible(true);
    },
    onPauseToggle: () => {
      if (!sim) return;
      paused = !paused;
      audio.setMusicMode(paused ? 'chill' : 'court');
      ui.showPauseMenu(paused);
      input.setTouchVisible(!paused);
    },
    onQuitMatch: () => {
      audio.setMusicMode('chill');
      sim = null;
      paused = false;
      input.setTouchVisible(false);
      renderer.setMode('attract');
    },
    onSeasonChampion: () => {
      void achievements.unlock('jam-champion');
    },
  });

  input.mountTouchControls(ui.root);
  ui.showTitle();

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

    if (sim && !paused && activeConfig) {
      const p1In = input.pollP1(activeConfig.opponentMode === 'ai');
      const p2In = input.pollP2();
      sim.step(dt, p1In, p2In);

      const home = getTeamById(activeConfig.homeTeamId);
      const away = getTeamById(activeConfig.awayTeamId);
      const p1 = sim.players[sim.p1ControlIdx];
      ui.updateHUD(
        home.abbr,
        away.abbr,
        sim.score[0],
        sim.score[1],
        sim.quarter,
        sim.clockSec,
        sim.shotClock,
        p1.profile.name,
        p1.turbo,
        p1.onFire,
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
