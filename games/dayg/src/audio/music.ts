// The music controller (music-ui-and-tech.md section 1). One Mossgrave song for the whole game (@lawn/music's
// buildDaygScore). The game changes the mood by ramping named layers, so it never starts a new song in play: day and night,
// the haven, and the threat tiers are all gains. Stingers fire on the bus events; a bell or a panel ducks the song.
import { buildDaygScore, fadeMusic, playSong, restoreMusic, setLayer, setMuteKey, setMusicDuck, setMusicVolume, setMuted, setSongSpatial,
  type DaygHooks, type DaygLayer, type DaygStinger, type Keep, type Tone } from '@lawn/music';
import type * as ToneNS from 'tone';
import type { Bus } from '../game/bus';
import type { AudioSettings } from './settings';
import { createCooldowns, LEVEL_HOLD_S, nextLevel, tensionTarget, type Level } from './tension';

/** The engine's mute key for the song (the sound settings panel sets it too, through setMuted). */
export const MUSIC_MUTE_KEY = 'dayg-music-muted';
const FIGHT_S = 8;          // a hit or an attack counts as a fight this long
const HIT_COOLDOWN_S = 20;  // the first-hit stinger does not repeat inside an encounter
const QUEST_COOLDOWN_S = 3;
const BELL_DUCK_S = 6;
const BELL_DUCK_DB = -12;
const PANEL_DUCK_DB = -6;
const UP_S = 2;             // a layer rises over 2 s (the attack)
const DOWN_S = 8;           // and falls over 8 s (the release)
const DEEP_CUTOFF_HZ = 1100;
const DEEP_WET = 0.5;

export interface MusicInfo {
  hatlessNear: number;     // Hatless within 15 gm
  calm: number;            // 0..100
  inHaven: boolean;
  night: boolean;
  underground: boolean;    // the player is in a DEEP zone
  panelOpen: boolean;      // talk, board or ledger: the song ducks so the text reads
}

export interface Music {
  tick(now: number, info: MusicInfo): void;
  applySettings(s: AudioSettings): void;
}

export function createMusic(deps: { bus: Bus; seed: number; now: () => number }): Music {
  const { bus, now } = deps;
  const hooks: Partial<DaygHooks> = {};
  const cooldowns = createCooldowns();
  const stinger = (kind: DaygStinger, arg?: number): void => { hooks.stinger?.(kind, arg); };

  // Start the one song. The builder runs once the engine has loaded Tone; the hooks are filled in then.
  setMuteKey(MUSIC_MUTE_KEY);
  playSong((T: Tone, keep: Keep, out: ToneNS.Volume) => buildDaygScore(T, keep, out, deps.seed, hooks));

  let fightUntil = -Infinity;
  let bellDuckUntil = -Infinity;
  let level: Level = 0;
  let levelSince = -Infinity;
  let duckApplied = 0;
  let underground = false;
  const applied = new Map<DaygLayer, number>();

  // A layer is only marked applied once the song has it, so a value set before the song is built is set again later.
  const setLayerTo = (name: DaygLayer, value: number): void => {
    const was = applied.get(name);
    if (was === value) return;
    if (setLayer(name, value, was !== undefined && value < was ? DOWN_S : UP_S)) applied.set(name, value);
  };

  // Stingers from the game's events. Each one lands on the next bar.
  bus.on('player-hit', () => {
    fightUntil = now() + FIGHT_S;
    if (cooldowns.ready('hit', now(), HIT_COOLDOWN_S)) {
      cooldowns.mark('hit', now());
      stinger('hit');
    }
  });
  bus.on('noise', (e) => { if (e.source === 'attack') fightUntil = now() + FIGHT_S; });
  bus.on('dusk', () => stinger('dusk'));
  bus.on('dawn', () => stinger('dawn'));
  bus.on('infection', (e) => { if (e.stage !== 'turned') stinger('infection', e.stage); });
  bus.on('bell-rung', (e) => {
    bellDuckUntil = now() + BELL_DUCK_S;
    stinger('bell', e.survived ? 1 : 0);
  });
  bus.on('player-shattered', () => { stinger('shatter'); fadeMusic(4); });
  bus.on('respawned', () => { restoreMusic(1); stinger('respawn'); });
  const quest = (kind: DaygStinger) => (): void => {
    if (!cooldowns.ready(kind, now(), QUEST_COOLDOWN_S)) return;
    cooldowns.mark(kind, now());
    stinger(kind);
  };
  bus.on('quest-taken', quest('quest-up'));
  bus.on('quest-done', quest('quest-done'));
  bus.on('quest-failed', quest('quest-fail'));
  bus.on('joined-faction', () => stinger('fanfare', 0));
  bus.on('rank-changed', () => stinger('fanfare', 1));
  bus.on('base-claimed', () => stinger('hammer'));
  bus.on('lantern-lit', () => { if (cooldowns.ready('chime', now(), 2)) { cooldowns.mark('chime', now()); stinger('chime'); } });

  return {
    tick(t, info) {
      const target = tensionTarget({ hatlessNear: info.hatlessNear, calm: info.calm, fight: t < fightUntil });
      if (t - levelSince >= LEVEL_HOLD_S) {
        const next = nextLevel(level, target);
        if (next !== level) { level = next; levelSince = t; }
      }

      // Day, night and the haven are gains; the threat tiers stay silent inside the haven.
      const haven = info.inHaven;
      setLayerTo('day', haven ? 0.3 : info.night ? 0 : 1);
      setLayerTo('night', haven ? 0.2 : info.night ? 1 : 0);
      setLayerTo('haven', haven ? 1 : 0);
      setLayerTo('pulse', !haven && level >= 1 ? 1 : 0);
      setLayerTo('ostinato', !haven && level >= 2 ? 1 : 0);
      setLayerTo('drums', !haven && level >= 3 ? 1 : 0);
      setLayerTo('stabs', !haven && level >= 3 && t < fightUntil ? 1 : 0);

      if (info.underground !== underground) {
        underground = info.underground;
        setSongSpatial(underground ? { cutoffHz: DEEP_CUTOFF_HZ, reverbWet: DEEP_WET, rampS: 2 } : null);
      }

      // Ducking: a bell beats a panel; both release on their own.
      const duck = t < bellDuckUntil ? BELL_DUCK_DB : info.panelOpen ? PANEL_DUCK_DB : 0;
      if (duck !== duckApplied) {
        duckApplied = duck;
        setMusicDuck(duck, duck === 0 ? 0.4 : 0.1);
      }
    },
    applySettings(s) {
      setMusicVolume((s.music / 100) * (s.master / 100));
      setMuted(s.muted);
    },
  };
}
