// Ammu-Gnation gun mods: the catalogue (plain data), what a fitted set of mods does to a gun's numbers and sound, the
// text codes for the save and the network, and the aim-down-sights tuning. Pure: no three.js, no DOM.
//
// Every gun is free and unlocked from the start. Ammu-Gnation sells MODS: each one is bolted onto a gun (a prefab part
// at one of the gun's mount points, see gunRig.ts) and changes how it shoots. A gun has one mod per slot at most.
import { GUNS, GUN_ORDER, type GunSpec } from './config';
import type { GunKind } from './types';

export const MOD_SLOTS = ['optic', 'muzzle', 'barrel', 'under', 'mag', 'stock', 'finish', 'charm'] as const;
export type ModSlot = (typeof MOD_SLOTS)[number];

export const SLOT_NAMES: Record<ModSlot, string> = {
  optic: 'Optic', muzzle: 'Muzzle', barrel: 'Barrel', under: 'Underbarrel', mag: 'Magazine', stock: 'Stock',
  finish: 'Finish', charm: 'Charm',
};
export const SLOT_ICONS: Record<ModSlot, string> = {
  optic: '🔭', muzzle: '🔇', barrel: '📏', under: '🔦', mag: '🧺', stock: '🪵', finish: '🎨', charm: '🧿',
};

/** How a shot sounds (gunSounds.ts plays it). 'stock' = the gun's own sound. */
export type GunSoundId = 'stock' | 'suppressed' | 'heavy' | 'kazoo' | 'squeak';
export const GUN_SOUND_IDS: readonly GunSoundId[] = ['stock', 'suppressed', 'heavy', 'kazoo', 'squeak'];

/** The four real guns. Most bolt-ons fit only these; finishes and charms fit every weapon. */
export const FIREARMS: readonly GunKind[] = ['pistol', 'smg', 'shotgun', 'rifle'];
const ALL: readonly GunKind[] = GUN_ORDER;
const LONG: readonly GunKind[] = ['smg', 'shotgun', 'rifle'];

/**
 * Multipliers a mod applies to the gun (1 = no change). `damage` multiplies the hit points one bullet takes off a vehicle
 * (VEHICLE_SHOT_DAMAGE); `zoom` multiplies how far the aim camera zooms in (AIM.zoom with no optic). `mag` is rounded.
 */
export interface ModStats {
  damage: number;
  rate: number;
  spread: number;
  range: number;
  mag: number;
  reload: number;
  recoil: number;
  zoom: number;
}
export const NO_STATS: Readonly<ModStats> = { damage: 1, rate: 1, spread: 1, range: 1, mag: 1, reload: 1, recoil: 1, zoom: 1 };

/** A finish glazes the gun's own body (not the bolt-ons) toward `color`. */
export interface FinishDef {
  color: number;
  /** 0..1 how far each part's colour moves toward `color` (1 = flat colour). */
  mix: number;
  metalness: number;
  roughness: number;
  /** Lit from inside (emissive), like the Firefly Glow. */
  glow?: boolean;
}

export interface GunModDef {
  id: string;
  slot: ModSlot;
  name: string;
  /** One short shop line. */
  blurb: string;
  /** Acorns, paid once per gun. */
  price: number;
  /** @lawn/prefabs id of the part bolted on (gunRig.ts). A finish has none. */
  prefab?: string;
  /** The weapons that take it. */
  guns: readonly GunKind[];
  stats?: Partial<ModStats>;
  /** The shot sound this mod gives (a muzzle mod wins over a barrel mod). */
  sound?: GunSoundId;
  finish?: FinishDef;
}

/** What is fitted on one gun: at most one mod id per slot. Missing slot = stock. */
export type GunLoadout = Partial<Record<ModSlot, string>>;

export const GUN_MODS: readonly GunModDef[] = [
  // ---- Optic ----
  { id: 'red-dot', slot: 'optic', name: 'Dew-Drop Dot', blurb: 'A red dot in a glass bead. Steadier aim, a little zoom.', price: 120,
    prefab: 'gunmod-red-dot', guns: FIREARMS, stats: { spread: 0.85, zoom: 1.25 } },
  { id: 'holo', slot: 'optic', name: 'Firefly Holo', blurb: 'A firefly in a frame draws the ring for you.', price: 180,
    prefab: 'gunmod-holo', guns: FIREARMS, stats: { spread: 0.8, zoom: 1.4 } },
  { id: 'long-scope', slot: 'optic', name: 'Long-Look Scope', blurb: 'See the far fence. The far fence sees you.', price: 350,
    prefab: 'gunmod-long-scope', guns: ['smg', 'rifle'], stats: { spread: 0.6, range: 1.3, zoom: 2.6 } },
  { id: 'jam-jar', slot: 'optic', name: 'Jam-Jar Scope', blurb: 'A whole jam jar of zoom. Still smells of plum.', price: 400,
    prefab: 'gunmod-jam-jar-scope', guns: ['shotgun', 'rifle', 'acorn-mortar'], stats: { spread: 0.7, range: 1.2, zoom: 3.4 } },
  // ---- Muzzle ----
  { id: 'suppressor', slot: 'muzzle', name: 'Hush-Puppy Suppressor', blurb: 'Pfft instead of bang. The Hat Watch may not even look up.', price: 200,
    prefab: 'gunmod-suppressor', guns: ['pistol', 'smg', 'rifle'], stats: { range: 0.9, recoil: 0.8 }, sound: 'suppressed' },
  { id: 'brake', slot: 'muzzle', name: 'Muzzle Brake', blurb: 'Slotted iron cup. Kicks less, roars more.', price: 150,
    prefab: 'gunmod-muzzle-brake', guns: LONG, stats: { recoil: 0.55, spread: 0.9 }, sound: 'heavy' },
  { id: 'kazoo', slot: 'muzzle', name: 'Party Kazoo', blurb: 'Every shot is a little song. Nobody asked for it.', price: 60,
    prefab: 'gunmod-kazoo', guns: [...FIREARMS, 'leaf-blower'], sound: 'kazoo' },
  { id: 'squeaker', slot: 'muzzle', name: 'Squeaky Duck', blurb: 'A rubber duck on the muzzle. Squeak, squeak, squeak.', price: 60,
    prefab: 'gunmod-squeaker', guns: [...FIREARMS, 'leaf-blower'], sound: 'squeak' },
  // ---- Barrel ----
  { id: 'long-barrel', slot: 'barrel', name: 'Long Barrel', blurb: 'More barrel, more reach, straighter flight.', price: 220,
    prefab: 'gunmod-long-barrel', guns: ['pistol', 'smg', 'rifle'], stats: { range: 1.4, spread: 0.8, damage: 1.1 } },
  { id: 'heavy-barrel', slot: 'barrel', name: 'Heavy Barrel', blurb: 'Thick as a fence post. Hits like one too.', price: 300,
    prefab: 'gunmod-heavy-barrel', guns: ['pistol', 'shotgun', 'rifle'], stats: { damage: 1.35, rate: 0.85 }, sound: 'heavy' },
  { id: 'ported-barrel', slot: 'barrel', name: 'Ported Barrel', blurb: 'Holes along the top let the hurry out.', price: 260,
    prefab: 'gunmod-ported-barrel', guns: ['pistol', 'smg', 'shotgun'], stats: { rate: 1.15, recoil: 0.8 } },
  // ---- Underbarrel ----
  { id: 'foregrip', slot: 'under', name: 'Twig Foregrip', blurb: 'A second handle for a second hand.', price: 100,
    prefab: 'gunmod-foregrip', guns: LONG, stats: { spread: 0.85, recoil: 0.8 } },
  { id: 'laser', slot: 'under', name: 'Firefly Laser', blurb: 'A firefly that always points where you point.', price: 140,
    prefab: 'gunmod-laser', guns: FIREARMS, stats: { spread: 0.85 } },
  // ---- Magazine ----
  { id: 'extended-mag', slot: 'mag', name: 'Extended Mag', blurb: 'Half as many rounds again. A bit slower to swap.', price: 160,
    prefab: 'gunmod-extended-mag', guns: FIREARMS, stats: { mag: 1.5, reload: 1.1 } },
  { id: 'drum-mag', slot: 'mag', name: 'Drum Mag', blurb: 'A round tin of plenty. Heavy to reload.', price: 320,
    prefab: 'gunmod-drum-mag', guns: LONG, stats: { mag: 2.5, reload: 1.4 } },
  { id: 'speed-mag', slot: 'mag', name: 'Speed-Loader Mag', blurb: 'A pull-tab and it drops out. Reloads in a blink.', price: 180,
    prefab: 'gunmod-speed-mag', guns: FIREARMS, stats: { reload: 0.6 } },
  // ---- Stock ----
  { id: 'padded-stock', slot: 'stock', name: 'Moss-Padded Stock', blurb: 'A cushion of moss against the shoulder.', price: 110,
    prefab: 'gunmod-padded-stock', guns: LONG, stats: { recoil: 0.6 } },
  { id: 'wire-stock', slot: 'stock', name: 'Wire Stock', blurb: 'Bent garden wire. Light, quick, a bit wobbly.', price: 90,
    prefab: 'gunmod-wire-stock', guns: ['pistol', 'smg', 'rifle'], stats: { reload: 0.85, recoil: 0.8, spread: 1.05 } },
  // ---- Finish (every weapon) ----
  { id: 'gilded', slot: 'finish', name: 'Gilded', blurb: 'Gold all over. Look rich, shoot the same.', price: 500,
    guns: ALL, finish: { color: 0xd4af37, mix: 0.8, metalness: 0.85, roughness: 0.3 } },
  { id: 'chrome', slot: 'finish', name: 'Chrome', blurb: 'Mirror-bright. You can check your hat in it.', price: 250,
    guns: ALL, finish: { color: 0xe0e6ed, mix: 0.8, metalness: 0.9, roughness: 0.18 } },
  { id: 'glaze-pink', slot: 'finish', name: "Pay 'n' Glaze Pink", blurb: 'The same pink as the shop across town.', price: 150,
    guns: ALL, finish: { color: 0xff3b9a, mix: 0.75, metalness: 0.2, roughness: 0.5 } },
  { id: 'hedge-camo', slot: 'finish', name: 'Hedge Camo', blurb: 'Green as a hedge. Hides it in a hedge.', price: 120,
    guns: ALL, finish: { color: 0x4f7a3a, mix: 0.7, metalness: 0.05, roughness: 0.9 } },
  { id: 'terracotta', slot: 'finish', name: 'Terracotta', blurb: 'Fired clay, like the gnome holding it.', price: 80,
    guns: ALL, finish: { color: 0xc8643c, mix: 0.75, metalness: 0, roughness: 0.95 } },
  { id: 'firefly-glow', slot: 'finish', name: 'Firefly Glow', blurb: 'It glows in the dark. So do you, now.', price: 400,
    guns: ALL, finish: { color: 0x9cff6a, mix: 0.7, metalness: 0.1, roughness: 0.6, glow: true } },
  // ---- Charm (every weapon) ----
  { id: 'charm-acorn', slot: 'charm', name: 'Lucky Acorn', blurb: 'An acorn on a string. Luck not included.', price: 40,
    prefab: 'gunmod-charm-acorn', guns: ALL },
  { id: 'charm-dice', slot: 'charm', name: 'Fuzzy Dice', blurb: 'Two soft dice. Always roll a six, never get to use it.', price: 60,
    prefab: 'gunmod-charm-dice', guns: ALL },
  { id: 'charm-gnome', slot: 'charm', name: 'Tiny Gnome', blurb: 'A gnome the size of a thumb, hanging on for dear life.', price: 80,
    prefab: 'gunmod-charm-gnome', guns: ALL },
  { id: 'charm-bell', slot: 'charm', name: 'Brass Bell', blurb: 'A little bell. Tinkles when you run.', price: 50,
    prefab: 'gunmod-charm-bell', guns: ALL },
];

const BY_ID = new Map(GUN_MODS.map((m) => [m.id, m]));

export function getMod(id: string | undefined): GunModDef | undefined {
  return id ? BY_ID.get(id) : undefined;
}

/** True when `mod` can go on `gun`. */
export function modFits(mod: GunModDef, gun: GunKind): boolean {
  return mod.guns.includes(gun);
}

/** The mods a gun takes in one slot, in catalogue order. */
export function modsFor(gun: GunKind, slot: ModSlot): GunModDef[] {
  return GUN_MODS.filter((m) => m.slot === slot && modFits(m, gun));
}

/** The slots that have at least one mod for this gun, in MOD_SLOTS order. */
export function slotsFor(gun: GunKind): ModSlot[] {
  return MOD_SLOTS.filter((s) => modsFor(gun, s).length > 0);
}

/** Drop unknown ids, mods in the wrong slot and mods that do not fit the gun. Always a fresh object. */
export function normalizeGunLoadout(gun: GunKind, l: GunLoadout | null | undefined): GunLoadout {
  const out: GunLoadout = {};
  if (!l) return out;
  for (const slot of MOD_SLOTS) {
    const m = getMod(l[slot]);
    if (m && m.slot === slot && modFits(m, gun)) out[slot] = m.id;
  }
  return out;
}

/** The mod ids of a loadout, in slot order. */
export function loadoutIds(l: GunLoadout): string[] {
  return MOD_SLOTS.map((s) => l[s]).filter((id): id is string => !!id);
}

/** The combined multipliers of every fitted mod. */
export function loadoutStats(gun: GunKind, l: GunLoadout): ModStats {
  const s: ModStats = { ...NO_STATS };
  for (const id of loadoutIds(normalizeGunLoadout(gun, l))) {
    const st = getMod(id)?.stats;
    if (!st) continue;
    for (const k of Object.keys(st) as (keyof ModStats)[]) s[k] *= st[k] ?? 1;
  }
  return s;
}

/** A gun with its mods applied: the GunSpec numbers the weapon fires with, plus damage, zoom and sound. */
export interface ModdedGun extends GunSpec {
  /** Multiplier on VEHICLE_SHOT_DAMAGE[kind]. */
  damage: number;
  /** Multiplier on AIM.zoom while aiming (1 = no optic). */
  zoom: number;
  sound: GunSoundId;
  /** The fitted mods (normalised). */
  loadout: GunLoadout;
}

export function moddedGun(gun: GunKind, l: GunLoadout | null | undefined): ModdedGun {
  const base = GUNS[gun];
  const loadout = normalizeGunLoadout(gun, l);
  const s = loadoutStats(gun, loadout);
  const sound = getMod(loadout.muzzle)?.sound ?? getMod(loadout.barrel)?.sound ?? 'stock';
  return {
    ...base,
    rate: base.rate * s.rate,
    spread: Math.max(0, base.spread * s.spread),
    range: base.range * s.range,
    mag: Math.max(1, Math.round(base.mag * s.mag)),
    reload: base.reload * s.reload,
    recoil: base.recoil * s.recoil,
    damage: s.damage,
    zoom: s.zoom,
    sound,
    loadout,
  };
}

/** Acorns to pay for the mods in `wanted` that are not in `owned`. */
export function loadoutCost(owned: ReadonlySet<string>, wanted: GunLoadout): number {
  let n = 0;
  for (const id of loadoutIds(wanted)) if (!owned.has(id)) n += getMod(id)?.price ?? 0;
  return n;
}

// ---- Text codes (save + network) -----------------------------------------------------------------------------------
// One letter per slot, then the mod's index among that slot's mods in GUN_MODS (base 36, one character).
// Example: "o0m2f4" = optic red-dot, muzzle kazoo, finish hedge-camo. Only [a-z0-9]. Unknown pieces are skipped.
const SLOT_LETTER: Record<ModSlot, string> = { optic: 'o', muzzle: 'm', barrel: 'b', under: 'u', mag: 'g', stock: 's', finish: 'f', charm: 'c' };
const LETTER_SLOT = new Map(MOD_SLOTS.map((s) => [SLOT_LETTER[s], s]));
const slotList = (slot: ModSlot): GunModDef[] => GUN_MODS.filter((m) => m.slot === slot);

export function encodeGunLoadout(l: GunLoadout): string {
  let out = '';
  for (const slot of MOD_SLOTS) {
    const id = l[slot];
    if (!id) continue;
    const i = slotList(slot).findIndex((m) => m.id === id);
    if (i >= 0 && i < 36) out += SLOT_LETTER[slot] + i.toString(36);
  }
  return out;
}

export function decodeGunLoadout(code: string): GunLoadout {
  const out: GunLoadout = {};
  if (typeof code !== 'string') return out;
  for (let i = 0; i + 1 < code.length; i += 2) {
    const slot = LETTER_SLOT.get(code[i]);
    const idx = parseInt(code[i + 1], 36);
    if (!slot || !Number.isFinite(idx)) continue;
    const m = slotList(slot)[idx];
    if (m) out[slot] = m.id;
  }
  return out;
}

/** The held gun on the wire: "<GUN_ORDER index>-<encodeGunLoadout>", e.g. "3-o2m0". */
export function encodeGunWire(gun: GunKind, l: GunLoadout): string {
  return `${GUN_ORDER.indexOf(gun)}-${encodeGunLoadout(l)}`;
}

export function decodeGunWire(code: string): { gun: GunKind; loadout: GunLoadout } | null {
  const m = /^(\d{1,2})-([a-z0-9]{0,32})$/.exec(code);
  if (!m) return null;
  const gun = GUN_ORDER[Number(m[1])];
  if (!gun) return null;
  return { gun, loadout: normalizeGunLoadout(gun, decodeGunLoadout(m[2])) };
}

// ---- Aim down sights --------------------------------------------------------------------------------------------------
export const AIM = {
  /** How far the aim camera zooms in with no optic (field of view divided by this). An optic multiplies it (ModdedGun.zoom). */
  zoom: 1.35,
  /** Spread while fully aimed, as a fraction of the hip-fire spread. */
  spreadMul: 0.45,
  /** Walking speed while aiming, as a fraction of the normal walk. */
  moveMul: 0.5,
  /** How fast the aim blend (0..1) goes in and out, per second. */
  blendRate: 9,
  /** Camera distance behind the look point and the over-the-shoulder offset when fully aimed (foot view: 4.6 and 0.7). */
  cameraDist: 2.1,
  shoulder: 0.85,
  /** At or past this total zoom an optic shows the full-screen scope overlay (aimHud.ts). */
  scopeOverlayAt: 2.4,
} as const;

/** Move the aim blend toward 1 (aiming) or 0, at AIM.blendRate per second. */
export function stepAim(t: number, aiming: boolean, dt: number): number {
  const target = aiming ? 1 : 0;
  const step = AIM.blendRate * dt;
  return t < target ? Math.min(target, t + step) : Math.max(target, t - step);
}

/** The total aim zoom (field-of-view divisor) for a modded gun at aim blend t (1 when not aiming). */
export function aimZoom(gun: ModdedGun, t: number): number {
  return 1 + (AIM.zoom * gun.zoom - 1) * Math.max(0, Math.min(1, t));
}
