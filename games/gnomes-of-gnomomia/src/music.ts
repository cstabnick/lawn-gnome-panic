// Background music controller using @lawn/music: Gnomomia Overture, chapter themes, and hearthside interiors.
import {
  buildGnomomiaTheme,
  playSong,
  setMusicVolume,
  setMuteKey,
  setMuted,
  stopSong,
  type GnomomiaThemeId,
} from '@lawn/music';
import { measure } from '@lawn/profiler';
import type { ZoneId } from './config';
import { ZONES } from './content';
import { bus } from './events';
import { onSettingsChange, settings } from './settings';

let activeTrack: GnomomiaThemeId | null = null;

function syncMusicSettings(): void {
  const effective = settings.muted || settings.musicMuted ? 0 : settings.volume * settings.musicVolume;
  setMusicVolume(effective);
  setMuted(effective <= 0);
}

const ZONE_THEMES: Partial<Record<string, GnomomiaThemeId>> = {
  mossbottom: 'mossbottom',
  thatchford: 'thatchford',
  keep: 'keep',
  deeps: 'deeps',
  cloverfield: 'cloverfield',
  hedgewood: 'hedgewood',
  rockery: 'rockery',
  verge: 'verge',
};

function zoneTrack(zone: ZoneId): GnomomiaThemeId {
  const def = ZONES[zone];
  if (def?.indoor) return 'interior';
  return ZONE_THEMES[zone] ?? 'mossbottom';
}

function playTheme(id: GnomomiaThemeId): void {
  if (activeTrack === id) return;
  activeTrack = id;
  playSong((T, keep, out) => {
    measure(`music build ${id}`, () => buildGnomomiaTheme(T, keep, out, id));
  });
}

export function startTitleMusic(): void {
  playTheme('title');
}

export function startZoneMusic(zone: ZoneId): void {
  playTheme(zoneTrack(zone));
}

export function initMusic(): void {
  setMuteKey('gnomomia.musicMuted');
  syncMusicSettings();
  onSettingsChange(syncMusicSettings);
  bus.on('zone-changed', ({ zone }) => startZoneMusic(zone));
}

export { stopSong };
