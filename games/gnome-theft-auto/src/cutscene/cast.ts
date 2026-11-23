// The cast: every named character's look, voice pitch (Hz for @lawn/mutter), held prop and scale, shared by the
// story rooms (quests/cutscene.ts) and scripted scenes (script.ts actors with `preset`). Pure data.
import type { GnomeLook } from '@lawn/gnome';
import { DEFAULT_LOOK } from '../config';
import type { DialogueLine } from '../quests/types';
import type { ScriptActor } from './script';

export const BASE_SPEAKER_LOOK: GnomeLook = {
  hat: 0xd93636, shirt: 0x2f8a4a, pants: 0x4b3a2a, skin: 0xf1c27d, boots: 0x222222, beard: 0xdddddd,
  hair: null, freckles: false, dress: false, glasses: false, bowlCut: null,
};

export interface CastPreset {
  look: Partial<GnomeLook>;
  hz: number;
  held?: string;
  /** Scale in a room set (rooms are drawn bigger than the map: 1.45 is a typical gnome there). */
  scale?: number;
}

/** Room scale of an ordinary gnome; world-stage actors are scaled by preset.scale / ROOM_SCALE so they match the map. */
export const ROOM_SCALE = 1.45;

export const CAST: Record<string, CastPreset> = {
  pip: { look: { hat: 0xc82828, shirt: 0x2f6b3a, pants: 0x3b2f24, beard: 0x6b4423, freckles: true }, hz: 126, scale: 1.38 },
  tansy: { look: { hat: 0xf08a24, shirt: 0x2f353d, pants: 0x23384d, beard: null, glasses: true, hair: { color: 0x6b3a1e, style: 'pigtails' } }, hz: 118, held: 'leaf-blower-cannon', scale: 1.42 },
  vesper: { look: { hat: 0x141418, shirt: 0xf8f8fa, pants: 0xf8f8fa, skin: 0xfafafa, beard: null, glasses: true }, hz: 92, held: 'brass-calipers', scale: 1.5 },
  granny: { look: { hat: 0x8e44ad, shirt: 0x7a4f7d, dress: true, beard: null, glasses: true, hair: { color: 0xdedede, style: 'pigtails' } }, hz: 132, held: 'gta-shotgun', scale: 1.44 },
  diggs: { look: { hat: 0x4b6329, shirt: 0x556b2f, pants: 0x384620, beard: 0x5c3e24 }, hz: 80, held: 'gta-rifle', scale: 1.52 },
  bracken: { look: { hat: 0x2e6f40, shirt: 0x4b3522, pants: 0x2f2519, beard: 0xd9d9d2 }, hz: 76, held: 'stopping-stone', scale: 1.48 },
  loam: { look: { hat: 0x9ec6de, shirt: 0x3c5266, pants: 0x283642, beard: 0xeeeeee, glasses: true }, hz: 84, held: 'porcelain-lantern', scale: 1.46 },
  bodega: { look: { hat: 0x7c4a2d, shirt: 0x3b7a57, beard: 0x8b5a2b }, hz: 88, scale: 1.42 },
  juniper: { look: { hat: 0x2f5a8f, shirt: 0x243447, pants: 0x1d2733, beard: null, glasses: true, hair: { color: 0x4a2f22, style: 'pigtails' } }, hz: 116, scale: 1.44 },
  reginald: { look: { hat: 0x18181e, shirt: 0xc9b99b, pants: 0x3a3228, beard: 0x9e9e9e, glasses: true }, hz: 96, held: 'brass-calipers', scale: 1.45 },
  sorrel: { look: { hat: 0x4f7a5a, shirt: 0x6d5c4d, beard: null, hair: { color: 0x7d4c2a, style: 'pigtails' } }, hz: 122, scale: 1.4 },
  clara: { look: { hat: 0xf6f6fa, shirt: 0xe6e8f0, skin: 0xfafafa, dress: true, beard: null }, hz: 134, held: 'porcelain-lantern', scale: 1.4 },
  brenda: { look: { hat: 0xd4a04a, shirt: 0xb84a7a, dress: true, beard: null, glasses: true }, hz: 112, scale: 1.48 },
  'big lou': { look: { hat: 0x18181e, shirt: 0x23262e, pants: 0x141418, beard: 0x222222, glasses: true }, hz: 78, scale: 1.56 },
  mossley: { look: { hat: 0x3b6ea5, shirt: 0x7c6a53, beard: 0xb8b0a0, glasses: true }, hz: 118, scale: 1.42 },
  burt: { look: { hat: 0x4b5563, shirt: 0xc9b99b, beard: 0x6b6b6b, glasses: true }, hz: 102, scale: 1.44 },
  driftwood: { look: { hat: 0x4f9d92, shirt: 0xd9c79e, beard: 0xe5e0d4 }, hz: 94, scale: 1.44 },
  cedric: { look: { hat: 0x8e44ad, shirt: 0x5b3b24, beard: 0x3a2a1d }, hz: 114, scale: 1.44 },
  bramble: { look: { hat: 0x8b5a2b, shirt: 0x4a6b3b, beard: 0xc4b8a4 }, hz: 100, scale: 1.46 },
  shelldon: { look: { hat: 0x7a8a78, shirt: 0x3f4740, beard: null, glasses: true }, hz: 110, scale: 1.4 },
  wally: { look: { hat: 0x6b4a2e, shirt: 0xc2a878, beard: 0xd9d9d9, glasses: true }, hz: 96, scale: 1.42 },
};

/** The preset whose key appears in a speaker label ("Pip Potsworth" -> pip), or undefined. */
export function presetFor(speaker: string): CastPreset | undefined {
  const lower = speaker.toLowerCase();
  for (const [k, v] of Object.entries(CAST)) if (lower.includes(k)) return v;
  return undefined;
}

/** Resolve speaker look, pitch, optional held prop, and scale from character preset + line override. */
export function speakerLookAndHz(line: DialogueLine): { look: GnomeLook; hz: number; held?: string; scale: number } {
  const preset = presetFor(line.speaker);
  return {
    look: { ...BASE_SPEAKER_LOOK, ...(preset?.look ?? {}), ...(line.look ?? {}) },
    hz: line.hz ?? preset?.hz ?? 100,
    held: preset?.held,
    scale: preset?.scale ?? ROOM_SCALE,
  };
}

export interface ResolvedCast { look: GnomeLook; hz: number; held: string | null; scale: number; name: string }

/**
 * Everything needed to build and voice a script actor. `room`: staged in a room set (preset scale as is, default 1.45)
 * or the world (preset scale / 1.45, default 1: real size next to the map). `playerLook`: the look for `player: true`.
 */
export function castOf(actor: ScriptActor, opts: { room: boolean; playerLook?: GnomeLook | null }): ResolvedCast {
  const preset = actor.preset ? (CAST[actor.preset.toLowerCase()] ?? presetFor(actor.preset)) : undefined;
  const base: GnomeLook = actor.player ? (opts.playerLook ?? DEFAULT_LOOK) : BASE_SPEAKER_LOOK;
  const presetName = actor.preset ? actor.preset.replace(/\b\w/g, (c) => c.toUpperCase()) : undefined;
  const roomScale = preset?.scale ?? ROOM_SCALE;
  return {
    look: { ...base, ...(actor.player ? {} : (preset?.look ?? {})), ...(actor.look ?? {}) },
    hz: actor.hz ?? preset?.hz ?? 100,
    held: actor.held === null ? null : (actor.held ?? preset?.held ?? null),
    scale: actor.scale ?? (opts.room ? roomScale : roomScale / ROOM_SCALE),
    name: actor.name ?? presetName ?? (actor.player ? 'You' : actor.id),
  };
}
