// Background music controller using @lawn/music: title theme + zone-appropriate fantasy themes.
import {
  buildAcousticMenuTheme,
  buildGnomeFanfare,
  buildMeadowWaltz,
  buildTwilightNocturne,
  playSong,
  setMusicVolume,
  setMuteKey,
  setMuted,
  stopSong,
  type SongBuilder,
} from '@lawn/music';
import type { ZoneId } from './config';
import { ZONES } from './content';
import { bus } from './events';
import { onSettingsChange, settings } from './settings';

type TrackKey = 'title' | 'meadow' | 'fanfare' | 'nocturne';

let activeTrack: TrackKey | null = null;

function syncMusicSettings(): void {
  const effective = settings.muted || settings.musicMuted ? 0 : settings.volume * settings.musicVolume;
  setMusicVolume(effective);
  setMuted(effective <= 0);
}

function zoneTrack(zone: ZoneId): { key: TrackKey; seed: number } {
  const def = ZONES[zone];
  if (def?.indoor || zone === 'deeps' || zone === 'rockery') {
    return { key: 'nocturne', seed: 4201 };
  }
  if (zone === 'keep' || zone === 'hedgewood' || zone === 'verge') {
    return { key: 'fanfare', seed: 1337 };
  }
  return { key: 'meadow', seed: 777 };
}

function playKey(key: TrackKey, seed = 777): void {
  if (activeTrack === key) return;
  activeTrack = key;
  const builder: SongBuilder = (T, keep, out) => {
    if (key === 'title') buildAcousticMenuTheme(T, keep, out);
    else if (key === 'meadow') buildMeadowWaltz(T, keep, out, seed);
    else if (key === 'fanfare') buildGnomeFanfare(T, keep, out, seed);
    else buildTwilightNocturne(T, keep, out, seed);
  };
  playSong(builder);
}

export function startTitleMusic(): void {
  playKey('title');
}

export function startZoneMusic(zone: ZoneId): void {
  const { key, seed } = zoneTrack(zone);
  playKey(key, seed);
}

export function initMusic(): void {
  setMuteKey('gnomomia.musicMuted');
  syncMusicSettings();
  onSettingsChange(syncMusicSettings);
  bus.on('zone-changed', ({ zone }) => startZoneMusic(zone));
}

export { stopSong };
