import Phaser from 'phaser';
import { createAchievementTracker } from '@lawn/achievements';
import { loadMyGnome } from '@lawn/gnome';
import { audio } from './audio.ts';
import { LawnScene } from './scenes/LawnScene.ts';
import { act, simulateOffline, tick } from './sim/engine.ts';
import { createInitialState } from './sim/state.ts';
import type { GameAction, GameState, SimEvent } from './sim/types.ts';
import { clearSavedGame, loadSavedGame, saveGame } from './storage.ts';
import { createUI } from './ui.ts';

async function boot(): Promise<void> {
  await loadMyGnome();

  const uiEl = document.getElementById('ui');
  if (!uiEl) throw new Error('Missing #ui root');

  const achievements = createAchievementTracker({ ui: uiEl });

  const loaded = loadSavedGame();
  let state: GameState = loaded.state;

  const scene = new LawnScene();

  const handleEvents = (events: SimEvent[]): void => {
    for (const ev of events) {
      if (ev.kind === 'trim') audio.snip();
      else if (ev.kind === 'water') audio.splash();
      else if (ev.kind === 'weed') audio.pop();
      else if (ev.kind === 'golden') audio.golden();
      else if (ev.kind === 'wish') audio.wish();
      else if (ev.kind === 'biscuit') audio.bark();
      else if (ev.kind === 'problem') audio.problem();
      else if (ev.kind === 'mowing-day') {
        audio.bell();
        scene.triggerMowerSweep();
      } else if (ev.kind === 'achievement' && ev.id) {
        achievements.unlock(ev.id).catch(() => {});
      } else if (ev.kind === 'ending') {
        audio.golden();
        ui.showEndingModal(state);
      }
    }
  };

  const dispatch = (action: GameAction): SimEvent[] => {
    const events = act(state, action);
    handleEvents(events);
    ui.render(state);
    return events;
  };

  const ui = createUI(
    uiEl,
    () => state,
    dispatch,
    (imported) => {
      state = imported;
      saveGame(state);
      ui.render(state);
    },
    () => {
      clearSavedGame();
      state = createInitialState();
      saveGame(state);
      ui.render(state);
    },
  );

  scene.setCallbacks({
    getState: () => state,
    dispatch,
    onRideEvents: handleEvents,
  });

  // Apply offline catch-up if player was away > 30s
  if (loaded.offlineSec > 30) {
    const off = simulateOffline(state, loaded.offlineSec);
    if (off.clippingsEarned >= 1) {
      ui.showOfflineModal(off.clippingsEarned, off.secondsApplied);
    }
  }

  new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    backgroundColor: '#1f301b',
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: window.innerWidth,
      height: window.innerHeight,
    },
    scene: [scene],
  });

  ui.render(state);

  // 10 Hz fixed simulation loop
  window.setInterval(() => {
    const events = tick(state, 0.1);
    if (events.length) handleEvents(events);
    ui.render(state);
  }, 100);

  // Autosave every 10 s and on visibilitychange
  window.setInterval(() => saveGame(state), 10_000);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') saveGame(state);
  });

  // Optional keyboard shortcuts (touch equivalents exist for all)
  window.addEventListener('keydown', (e) => {
    if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return;
    if (e.key === '1') ui.setTab('crew');
    else if (e.key === '2') ui.setTab('lawn');
    else if (e.key === '3') ui.setTab('critters');
    else if (e.key === '4') ui.setTab('decor');
    else if (e.key === '5') ui.setTab('tree');
    else if (e.key === ' ' && state.wishes > 0) {
      e.preventDefault();
      dispatch({ type: 'blow-wish' });
    }
  });
}

boot();
