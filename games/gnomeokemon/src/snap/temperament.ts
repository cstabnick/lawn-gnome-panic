// Temperament: how each Gnomokemon behaves around the tools and around Tag.
// Source: docs/design/gnomeokemon/temperaments.md (sections 1, 2 and 4).
// STUB: signatures are final; the bodies are placeholders until the temperament issue fills them in.

export type Temperament =
  | 'docile'
  | 'curious'
  | 'skittish'
  | 'shy'
  | 'territorial'
  | 'thief'
  | 'sentinel'
  | 'aloof';

/** Distance (world units) at which Tag counts as "nearby" for temperament responses. */
export const NOTICE_RADIUS = 6;

/** Temperament of every species, keyed by species id from src/prefabs/dex.ts. Filled in by the temperament issue. */
export const TEMPERAMENTS: Readonly<Record<string, Temperament>> = {
  'mossback': 'docile',
  'unfired': 'docile',
  'sunlizard': 'docile',
  'starbeetle': 'docile',
  'snowcap': 'docile',
  'sproutling': 'curious',
  'kilnpup': 'curious',
  'dewdrop': 'curious',
  'clogmaw': 'curious',
  'glowmoth': 'curious',
  'kelpsprite': 'curious',
  'clockworkfrog': 'curious',
  'frosthound': 'curious',
  'grubthorn': 'skittish',
  'bellrat': 'skittish',
  'icicleimp': 'skittish',
  'armadillan': 'shy',
  'cisterneel': 'shy',
  'drownedtoad': 'shy',
  'mooncap': 'shy',
  'dewghost': 'shy',
  'pinego': 'shy',
  'staghorn': 'territorial',
  'hoseleech': 'territorial',
  'paperwasp': 'territorial',
  'seamower': 'territorial',
  'hedgewright': 'territorial',
  'thimblekin': 'thief',
  'rustcrab': 'thief',
  'magpiethief': 'thief',
  'strawight': 'sentinel',
  'cactuskin': 'sentinel',
  'kilnwarden': 'sentinel',
  'barnacleknight': 'sentinel',
  'bonsaititan': 'sentinel',
  'minimower': 'aloof',
  'tumblewight': 'aloof',
  'acorndrake': 'aloof',
  'gnomespirit': 'aloof',
  'gnomejesus': 'aloof',
  'chimneyowl': 'aloof',
  'frostking': 'aloof',
};

/** Fallback when a species id is unknown. */
export const DEFAULT_TEMPERAMENT: Temperament = 'docile';

/** One-word label shown in the Gnomokedex, capitalised. */
export const TEMPERAMENT_LABEL: Readonly<Record<Temperament, string>> = {
  docile: 'Docile',
  curious: 'Curious',
  skittish: 'Skittish',
  shy: 'Shy',
  territorial: 'Territorial',
  thief: 'Thief',
  sentinel: 'Sentinel',
  aloof: 'Aloof',
};

export function temperamentOf(speciesId: string): Temperament {
  return TEMPERAMENTS[speciesId] ?? DEFAULT_TEMPERAMENT;
}

/** What a thrown Bait does. */
export type BaitResult = 'eat' | 'eatWhenDogStill' | 'eatAfterStill' | 'steal' | 'ignore';

/** What a Pester (purple scare) does. */
export type PesterResult = 'startle' | 'backOff' | 'bolt' | 'hide' | 'display' | 'drop' | 'stiff' | 'spin';

/** What the Gnome Flute does. */
export type FluteResult = 'dance' | 'freeze' | 'sway' | 'nod';

/** What a creature does when Tag (the dog) is within NOTICE_RADIUS. */
export type TagResult = 'approach' | 'flee' | 'retreat' | 'warn' | 'hover' | 'ignore';

export function baitResult(t: Temperament): BaitResult {
  switch (t) {
    case 'docile':
      return 'eat';
    case 'curious':
      return 'eat';
    case 'skittish':
      return 'eatWhenDogStill';
    case 'shy':
      return 'eatAfterStill';
    case 'territorial':
      return 'ignore';
    case 'thief':
      return 'steal';
    case 'sentinel':
      return 'ignore';
    case 'aloof':
      return 'ignore';
    default:
      return 'eat';
  }
}

export function pesterResult(t: Temperament): PesterResult {
  switch (t) {
    case 'docile':
      return 'startle';
    case 'curious':
      return 'backOff';
    case 'skittish':
      return 'bolt';
    case 'shy':
      return 'hide';
    case 'territorial':
      return 'display';
    case 'thief':
      return 'drop';
    case 'sentinel':
      return 'stiff';
    case 'aloof':
      return 'spin';
    default:
      return 'startle';
  }
}

export function fluteResult(t: Temperament): FluteResult {
  switch (t) {
    case 'docile':
      return 'dance';
    case 'curious':
      return 'dance';
    case 'skittish':
      return 'freeze';
    case 'shy':
      return 'dance';
    case 'territorial':
      return 'dance';
    case 'thief':
      return 'dance';
    case 'sentinel':
      return 'sway';
    case 'aloof':
      return 'nod';
    default:
      return 'dance';
  }
}

export function tagResult(t: Temperament): TagResult {
  switch (t) {
    case 'docile':
      return 'ignore';
    case 'curious':
      return 'approach';
    case 'skittish':
      return 'flee';
    case 'shy':
      return 'retreat';
    case 'territorial':
      return 'warn';
    case 'thief':
      return 'hover';
    case 'sentinel':
      return 'ignore';
    case 'aloof':
      return 'ignore';
    default:
      return 'ignore';
  }
}
