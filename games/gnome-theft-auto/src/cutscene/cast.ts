// The cast: every named character's look, voice pitch (Hz for @lawn/mutter), held prop and scale, shared by the
// story rooms (quests/cutscene.ts) and scripted scenes (script.ts actors with `preset`). Pure data.
import type { GnomeLook } from '@lawn/gnome';
import { DEFAULT_LOOK } from '../config';
import type { VoiceSpec } from '@lawn/mutter';
import type { DialogueLine } from '../quests/types';
import { playerVoice, voiceFor } from '../voice/voices';
import { HEDGEWORTH_CAST } from '../golf/types';
import { SPORTS_CAST } from '../sports/types';
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
  dot: { look: { hat: 0x2a4d7a, shirt: 0x7a2a2a, pants: 0x2b2b33, beard: null, glasses: true, hair: { color: 0xbdbdbd, style: 'pigtails' } }, hz: 128, held: 'ticket-stub', scale: 1.4 },
  hedda: { look: { hat: 0x1c1c1c, shirt: 0xe9e4d4, pants: 0x2b2b2b, beard: null, glasses: true, hair: { color: 0x2a1a12, style: 'pigtails' } }, hz: 124, scale: 1.42 },
  nina: { look: { hat: 0x7a3cff, shirt: 0x1c1c2a, beard: null, hair: { color: 0x39ff88, style: 'pigtails' } }, hz: 136, scale: 1.38 },
  grout: { look: { hat: 0x3d4a5c, shirt: 0x5b6b3a, pants: 0x2f3a4a, beard: 0x4a3a2a }, hz: 74, scale: 1.58 },
  mabel: { look: { hat: 0xf2c200, shirt: 0x222222, beard: null, glasses: true, hair: { color: 0xc0c0c0, style: 'pigtails' } }, hz: 140, scale: 1.4 },
  // Hedgeworth Links (golf/types.ts HEDGEWORTH_CAST).
  peony: { look: HEDGEWORTH_CAST.peony.look, hz: HEDGEWORTH_CAST.peony.hz, held: HEDGEWORTH_CAST.peony.held, scale: 1.44 },
  basil: { look: HEDGEWORTH_CAST.basil.look, hz: HEDGEWORTH_CAST.basil.hz, held: HEDGEWORTH_CAST.basil.held, scale: 1.42 },
  thrift: { look: HEDGEWORTH_CAST.thrift.look, hz: HEDGEWORTH_CAST.thrift.hz, held: HEDGEWORTH_CAST.thrift.held, scale: 1.5 },
  // Founders' Green regulars (sports/types.ts SPORTS_CAST): Drainpipe Court and the Gutter Bowls.
  cardoon: { look: SPORTS_CAST.cardoon.look, hz: SPORTS_CAST.cardoon.hz, held: SPORTS_CAST.cardoon.held, scale: 1.44 },
  lintel: { look: SPORTS_CAST.lintel.look, hz: SPORTS_CAST.lintel.hz, held: SPORTS_CAST.lintel.held, scale: 1.44 },
  pansy: { look: SPORTS_CAST.pansy.look, hz: SPORTS_CAST.pansy.hz, held: SPORTS_CAST.pansy.held, scale: 1.44 },
  benchley: { look: SPORTS_CAST.benchley.look, hz: SPORTS_CAST.benchley.hz, held: SPORTS_CAST.benchley.held, scale: 1.4 },
  fennel: { look: SPORTS_CAST.fennel.look, hz: SPORTS_CAST.fennel.hz, held: SPORTS_CAST.fennel.held, scale: 1.44 },
  moss: { look: SPORTS_CAST.moss.look, hz: SPORTS_CAST.moss.hz, held: SPORTS_CAST.moss.held, scale: 1.44 },
  pebble: { look: SPORTS_CAST.pebble.look, hz: SPORTS_CAST.pebble.hz, held: SPORTS_CAST.pebble.held, scale: 1.25 },
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

/** `voice`: the speaker's full voice (voice/voices.ts), pitch overridden by the actor's `hz`. */
export interface ResolvedCast { look: GnomeLook; hz: number; held: string | null; scale: number; name: string; voice: VoiceSpec }

/**
 * Everything needed to build and voice a script actor. `room`: staged in a room set (preset scale as is, default 1.45)
 * or the world (preset scale / 1.45, default 1: real size next to the map). `playerLook`: the look for `player: true`.
 */
export function castOf(actor: ScriptActor, opts: { room: boolean; playerLook?: GnomeLook | null }): ResolvedCast {
  const preset = actor.preset ? (CAST[actor.preset.toLowerCase()] ?? presetFor(actor.preset)) : undefined;
  const base: GnomeLook = actor.player ? (opts.playerLook ?? DEFAULT_LOOK) : BASE_SPEAKER_LOOK;
  const presetName = actor.preset ? actor.preset.replace(/\b\w/g, (c) => c.toUpperCase()) : undefined;
  const roomScale = preset?.scale ?? ROOM_SCALE;
  const look: GnomeLook = { ...base, ...(actor.player ? {} : (preset?.look ?? {})), ...(actor.look ?? {}) };
  return {
    look,
    hz: actor.hz ?? preset?.hz ?? 100,
    held: actor.held === null ? null : (actor.held ?? preset?.held ?? null),
    scale: actor.scale ?? (opts.room ? roomScale : roomScale / ROOM_SCALE),
    name: actor.name ?? presetName ?? (actor.player ? 'You' : actor.id),
    voice: actor.player
      ? { ...playerVoice(look), ...(actor.hz ? { hz: actor.hz } : {}) }
      : voiceFor(actor.preset ?? actor.name ?? actor.id, actor.hz),
  };
}
