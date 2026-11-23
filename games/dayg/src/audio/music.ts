// The music controller (music-ui-and-tech.md section 1). One Mossgrave score for the game (@lawn/music's buildDaygScore), and
// the Lantern Hymn while a menu is open (a scene change, so it is the only other song). In play the mood changes by ramping
// named layers, never by a new song. Stingers fire on bus events; a bell or an open panel ducks the song.
import { buildDaygScore, buildDaygTitle, fadeMusic, playSong, restoreMusic, setLayer, setMuteKey, setMusicDuck, setMusicVolume,
  setMuted, setSongSpatial, type DaygHooks, type DaygLayer, type DaygStinger, type Keep, type Tone } from '@lawn/music';
import type * as ToneNS from 'tone';
import type { Bus } from '../game/bus';
import type { Trait } from '../sim/types';
import type { AudioSettings } from './settings';
import { layerPlan, type LayerPlan } from './layers';
import { createCooldowns, LEVEL_HOLD_S, nextLevel, tensionTarget, type Level } from './tension';

/** The engine's mute key for the song (the sound settings panel sets it too, through setMuted). */
export const MUSIC_MUTE_KEY = 'dayg-music-muted';
const FIGHT_S = 8;          // a hit or an attack counts as a fight this long
const HIT_COOLDOWN_S = 20;  // the first-hit stinger does not repeat inside an encounter
const QUEST_COOLDOWN_S = 3;
const CHIME_COOLDOWN_S = 2;
const ACHIEVEMENT_COOLDOWN_S = 3;
const BELL_DUCK_S = 6;
const BELL_DUCK_DB = -12;
const PANEL_DUCK_DB = -6;
const UP_S = 2;             // a layer rises over 2 s (the attack)
const DOWN_S = 8;           // and falls over 8 s (the release)
const DEEP_CUTOFF_HZ = 1100;
const DEEP_WET = 0.5;

export interface MusicInfo {
  hatlessNear: number;        // Hatless within 15 gm
  calm: number;               // 0..100
  inHaven: boolean;
  night: boolean;
  traits: readonly Trait[];   // the player's zone traits: DEEP, HUSH, SACRED, MOSSY, FLOODS, HIGH, DARK set the colour
  panelOpen: boolean;         // talk, board or ledger: the song ducks so the text reads
  menu: boolean;              // a menu is open: the Lantern Hymn plays instead of the score
}

export interface Music {
  tick(now: number, info: MusicInfo): void;
  applySettings(s: AudioSettings): void;
}

export function createMusic(deps: { bus: Bus; seed: number; now: () => number }): Music {
  const { bus, now } = deps;
  const hooks: Partial<DaygHooks> = {};
  const cooldowns = createCooldowns();
  let inMenu = false;

  const scoreBuild = (T: Tone, keep: Keep, out: ToneNS.Volume): void => buildDaygScore(T, keep, out, deps.seed, hooks);
  const hymnBuild = (T: Tone, keep: Keep, out: ToneNS.Volume): void => buildDaygTitle(T, keep, out, deps.seed);

  // Stingers play on the score only: the hymn is its own song and has none.
  const stinger = (kind: DaygStinger, arg?: number): void => { if (!inMenu) hooks.stinger?.(kind, arg); };
  const limited = (key: string, seconds: number, kind: DaygStinger): void => {
    if (!cooldowns.ready(key, now(), seconds)) return;
    cooldowns.mark(key, now());
    stinger(kind);
  };

  // Start the score. The builder runs once the engine has loaded Tone; the hooks are filled in then.
  setMuteKey(MUSIC_MUTE_KEY);
  playSong(scoreBuild);

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
    limited('hit', HIT_COOLDOWN_S, 'hit');
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
  bus.on('quest-taken', () => limited('quest-up', QUEST_COOLDOWN_S, 'quest-up'));
  bus.on('quest-done', () => limited('quest-done', QUEST_COOLDOWN_S, 'quest-done'));
  bus.on('quest-failed', () => limited('quest-fail', QUEST_COOLDOWN_S, 'quest-fail'));
  bus.on('joined-faction', () => stinger('fanfare', 0));
  bus.on('rank-changed', () => stinger('fanfare', 1));
  bus.on('base-claimed', () => stinger('hammer'));
  bus.on('lantern-lit', () => limited('chime', CHIME_COOLDOWN_S, 'chime'));
  bus.on('achievement', () => limited('achievement', ACHIEVEMENT_COOLDOWN_S, 'achievement'));

  /** Switches between the score and the hymn. A new song, so every layer and duck starts from its rest state. */
  const switchTo = (menu: boolean): void => {
    inMenu = menu;
    applied.clear();
    duckApplied = 0;
    underground = false;
    level = 0;
    levelSince = -Infinity;
    setSongSpatial(null);
    playSong(menu ? hymnBuild : scoreBuild);
  };

  return {
    tick(t, info) {
      if (info.menu !== inMenu) switchTo(info.menu);
      if (inMenu) return;   // the hymn has no layers to move

      const target = tensionTarget({ hatlessNear: info.hatlessNear, calm: info.calm, fight: t < fightUntil });
      if (t - levelSince >= LEVEL_HOLD_S) {
        const next = nextLevel(level, target);
        if (next !== level) { level = next; levelSince = t; }
      }

      // The gains for this level, zone and time of day (layers.ts): the mood rules live there, tested without the engine.
      const has = (trait: Trait): boolean => info.traits.includes(trait);
      const plan = layerPlan({
        level, fight: t < fightUntil, inHaven: info.inHaven, night: info.night,
        hush: has('HUSH'), sacred: has('SACRED'), wet: has('MOSSY') || has('FLOODS'), thin: has('HIGH') || has('DARK'),
      });
      for (const name of Object.keys(plan) as (keyof LayerPlan)[]) setLayerTo(name, plan[name]);

      if (has('DEEP') !== underground) {
        underground = has('DEEP');
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
