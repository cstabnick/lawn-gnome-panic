// Side-quest perks: every side quest (and Fizz Cup race) leaves a small, modest unlock behind (roadmap
// docs/roadmaps/gta-world-events-and-rewards.md). A perk is ACTIVE when its quest is 'done' in the quest save
// (localStorage 'gta-quests-v1', already cloud-synced), unless the trainer revoked it; the trainer can also grant one
// without the quest. Overrides and the "already announced" list live in PERKS_KEY (this browser only).
//
// Pure data + a small cached state, no DOM: perkEffects.ts applies the effects in the running game, the journal lists
// them, and the trainer calls listPerks / grantPerk / revokePerk / clearPerkOverride.
import { parseSavesJson } from './quests/questSave';
import type { QuestSave } from './quests/types';

export const PERKS_KEY = 'gta-perks-v1';
/** The quest save key (quests/quests.ts SAVE_KEY), repeated here so this module stays import-light. */
export const QUEST_SAVE_KEY = 'gta-quests-v1';

export type PerkId =
  | 'datum-map'
  | 'alley-clearance'
  | 'velvet-rope'
  | 'mulch-rebate'
  | 'biscuit-nose'
  | 'castaway-float'
  | 'porcelain-charm'
  | 'bracken-blessing'
  | 'sonar-trinket'
  | 'rebel-pension'
  | 'audit-paperwork'
  | 'thick-glaze'
  | 'rookie-plate'
  | 'carb-contacts'
  | 'shelldon-odds'
  | 'fizz-sponsor'
  // The Kerbside Exchange city contracts (quests/cityQuests.ts).
  | 'conductor-punch'
  | 'impound-key'
  | 'glow-band'
  | 'press-pass'
  | 'union-card'
  // Pebblewick's side quests (quests/outskirtsQuests.ts).
  | 'weeping-line'
  | 'combine-hum'
  // The Newcomers' Card tutorials (quests/newcomerQuests.ts).
  | 'neighbour-badge'
  | 'showoff'
  | 'scrap-eye'
  | 'sling-regular'
  | 'verge-volunteer'
  | 'bent-pin-regular'
  | 'skyway-regular'
  | 'staff-discount'
  | 'slipway-regular'
  | 'pigeon-tip'
  | 'lodge-regular'
  | 'hopper-pass'
  | 'hide-regular'
  | 'estate-agent'
  | 'party-favour'
  | 'glaze-on-the-house';

export interface PerkDef {
  id: PerkId;
  /** The quest that unlocks it (QuestDef.id). */
  questId: string;
  /** Short name, shown in the unlock toast and the journal. */
  name: string;
  /** What it does, one line, player-facing. */
  text: string;
}

export const PERKS: readonly PerkDef[] = [
  { id: 'datum-map', questId: 'sq-grid-truthers', name: 'Datum Map', text: 'Street events show on the map from anywhere, not just nearby.' },
  { id: 'alley-clearance', questId: 'sq-snail-rigging', name: 'Alley Clearance', text: 'In Turfton, Watch heat under 3 hats cools a little faster.' },
  { id: 'velvet-rope', questId: 'sq-big-lou-embargo', name: 'Velvet Rope Tab', text: 'Acorn-Cola, Dandelion Fizz and Acorn-Flour Cake cost 25% less.' },
  { id: 'mulch-rebate', questId: 'sq-mulch-pyramid', name: 'Mulch Rebate', text: "Pay 'n' Glaze charges 15% less." },
  { id: 'biscuit-nose', questId: 'sq-biscuit-hotdog', name: "Biscuit's Nose", text: 'The map marks the nearest Golden Acorn you have not found.' },
  { id: 'castaway-float', questId: 'sq-castaway-drydock', name: "Castaway's Float", text: 'Cracks mend slowly while you swim.' },
  { id: 'porcelain-charm', questId: 'sq-porcelain-blues', name: 'Porcelain-Glaze Charm', text: 'The Glaze Clinic refunds half its bill.' },
  { id: 'bracken-blessing', questId: 'sq-fescue-fugitive', name: "Bracken's Blessing", text: 'On foot outside Turfton, cracks mend slowly up to 60%.' },
  { id: 'sonar-trinket', questId: 'sq-tessie', name: 'Sonar Trinket', text: 'The map marks the nearest Stopping Shard you have not found.' },
  { id: 'rebel-pension', questId: 'sq-hose-revolt', name: "Brenda's Pension", text: '+15 Acorns every 3 minutes of play.' },
  { id: 'audit-paperwork', questId: 'sq-hoa-audit', name: 'Audit Paperwork', text: 'Heat below one hat fades three times faster.' },
  { id: 'thick-glaze', questId: 'sq-porcelain-support', name: 'Thick Glaze', text: 'You take 10% less damage.' },
  { id: 'rookie-plate', questId: 'race-rookie-mowdown', name: 'Rookie Plate', text: 'Speed-trap daredevil payouts +25%.' },
  { id: 'carb-contacts', questId: 'race-lowrider-derby', name: 'Carburettor Contacts', text: 'Turfton Taxi fares cost 20% less.' },
  { id: 'shelldon-odds', questId: 'race-snail-endurance', name: "Shelldon's Odds", text: 'World and street event rewards +10%.' },
  { id: 'fizz-sponsor', questId: 'race-fizz-cup-final', name: 'Fizz Sponsor', text: 'Dandelion Fizz is free.' },
  { id: 'conductor-punch', questId: 'city-kerbside-rounds', name: "Conductor's Punch Card", text: 'Turfton Taxi fares cost 10% less.' },
  { id: 'impound-key', questId: 'city-impound-run', name: 'Impound Key', text: 'Sling-Lift calls cost 25% less.' },
  { id: 'glow-band', questId: 'city-glow-band-express', name: "Nina's Glow-Band", text: 'In Downtown and the Greenhouse Strip, Watch heat under 2 hats cools faster.' },
  { id: 'press-pass', questId: 'city-penthouse-exclusive', name: 'Tattler Press Pass', text: 'World and street event rewards +10%.' },
  { id: 'union-card', questId: 'city-skyway-robbery', name: 'Local 404 Card', text: '+20 Acorns every 3 minutes from the strike fund.' },
  { id: 'weeping-line', questId: 'sq-weeping-line', name: 'Weeping Line Discount', text: "Pebblewick's counters charge 20% less." },
  { id: 'combine-hum', questId: 'sq-hum-at-three', name: "Ratchet's Thanks", text: "Ratchet's Mower & Dew repairs for free." },
  { id: 'neighbour-badge', questId: 'nc-good-neighbour', name: "Neighbour's Badge", text: 'Street and world event rewards +5%.' },
  { id: 'showoff', questId: 'nc-strike-a-pose', name: 'Show-Off', text: 'Near Miss bonuses +20%.' },
  { id: 'scrap-eye', questId: 'nc-wheel-and-kit', name: "Pip's Scrap Eye", text: 'Scrap sold at the Lock-Up pays 20% more.' },
  { id: 'sling-regular', questId: 'nc-lockup', name: 'Lock-Up Regular', text: 'Sling-Lift calls cost 15% less.' },
  { id: 'verge-volunteer', questId: 'nc-mind-the-verges', name: 'Verge Volunteer', text: 'Lawn Service pay +25%.' },
  { id: 'bent-pin-regular', questId: 'nc-bent-pin', name: 'Bent Pin Regular', text: 'Catch cards sell for 15% more.' },
  { id: 'skyway-regular', questId: 'nc-skyway', name: 'Skyway Regular', text: 'Speed-trap daredevil payouts +10%.' },
  { id: 'staff-discount', questId: 'nc-odd-jobs', name: "Mabel's Staff Discount", text: 'Turfton Taxi fares cost 15% less.' },
  { id: 'slipway-regular', questId: 'nc-take-off', name: "Wally's Word", text: "The Wingwright's Slipway costs 10% less." },
  { id: 'pigeon-tip', questId: 'nc-sky-spotting', name: "Hedda's Tip-Off", text: 'Pigeon-Drop parcels pay 25% more.' },
  { id: 'lodge-regular', questId: 'nc-tuft-and-tally', name: 'Lodge Regular', text: 'The Tuft & Tally Lodge pays 15% more.' },
  { id: 'hopper-pass', questId: 'nc-last-stop-pebblewick', name: 'Hopper Season Ticket', text: 'The Pebblewick Hopper is half fare.' },
  { id: 'hide-regular', questId: 'nc-reedwatch', name: 'Reedwatch Regular', text: 'New birds and bird photos pay 20% more.' },
  { id: 'estate-agent', questId: 'nc-hangar-and-boathouse', name: "Tansy's Word", text: 'Hangar Two and the Mossbank Boathouse cost 10% less.' },
  { id: 'party-favour', questId: 'nc-party', name: 'Party Favour', text: 'Acorn-Flour Cake costs 10% less.' },
  { id: 'glaze-on-the-house', questId: 'sq-on-the-house', name: "Cass's Tab", text: "Pay 'n' Glaze repairs are free." },
];

const BY_ID = new Map<string, PerkDef>(PERKS.map((p) => [p.id, p]));

export function perkDef(id: string): PerkDef | undefined {
  return BY_ID.get(id);
}

/** The perk a quest unlocks, or undefined (story quests have none). */
export function perkForQuest(questId: string): PerkDef | undefined {
  return PERKS.find((p) => p.questId === questId);
}

export interface PerkOverrides {
  granted: string[];
  revoked: string[];
  /** Perks whose unlock toast has been shown. */
  seen: string[];
}

/** Pure: which perks are active for these quest saves and overrides. Revoked wins over granted and over the quest. */
export function computeActive(saves: Record<string, QuestSave>, o: PerkOverrides): Set<PerkId> {
  const out = new Set<PerkId>();
  for (const p of PERKS) {
    if (o.revoked.includes(p.id)) continue;
    if (o.granted.includes(p.id) || saves[p.questId]?.state === 'done') out.add(p.id);
  }
  return out;
}

export function parseOverrides(raw: string | null): PerkOverrides {
  const empty: PerkOverrides = { granted: [], revoked: [], seen: [] };
  if (!raw) return empty;
  try {
    const v = JSON.parse(raw) as Partial<PerkOverrides> | null;
    if (!v || typeof v !== 'object') return empty;
    const list = (x: unknown): string[] => (Array.isArray(x) ? x.filter((s): s is string => typeof s === 'string') : []);
    return { granted: list(v.granted), revoked: list(v.revoked), seen: list(v.seen) };
  } catch {
    return empty;
  }
}

// ---- Live state (localStorage), cached for a second so per-frame perkActive() calls stay cheap. ----

type PerkStorage = Pick<Storage, 'getItem' | 'setItem'>;
let storage: PerkStorage | null | undefined;
let cache: Set<PerkId> | null = null;
let cacheAt = -Infinity;
const CACHE_MS = 1000;

function store(): PerkStorage | null {
  if (storage !== undefined) return storage;
  try {
    storage = typeof localStorage !== 'undefined' ? localStorage : null;
  } catch {
    storage = null;
  }
  return storage;
}

/** Tests only: use this storage (null = none) and drop the cache. */
export function setPerkStorage(s: PerkStorage | null): void {
  storage = s;
  cache = null;
}

function readOverrides(): PerkOverrides {
  try {
    return parseOverrides(store()?.getItem(PERKS_KEY) ?? null);
  } catch {
    return parseOverrides(null);
  }
}

function writeOverrides(o: PerkOverrides): void {
  try {
    store()?.setItem(PERKS_KEY, JSON.stringify(o));
  } catch {
    // a full or blocked storage only loses the override
  }
  cache = null;
}

function readSaves(): Record<string, QuestSave> {
  try {
    return parseSavesJson(store()?.getItem(QUEST_SAVE_KEY) ?? null);
  } catch {
    return {};
  }
}

function now(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}

/** Every active perk id (cached up to a second). */
export function activePerks(): Set<PerkId> {
  const t = now();
  if (!cache || t - cacheAt > CACHE_MS) {
    cache = computeActive(readSaves(), readOverrides());
    cacheAt = t;
  }
  return cache;
}

export function perkActive(id: PerkId): boolean {
  return activePerks().has(id);
}

export type PerkSource = 'quest' | 'granted' | 'revoked' | 'locked';

/** Trainer / journal: every perk, whether it is active and why. */
export function listPerks(): { def: PerkDef; active: boolean; source: PerkSource }[] {
  const o = readOverrides();
  const saves = readSaves();
  return PERKS.map((def) => {
    let source: PerkSource = 'locked';
    if (o.revoked.includes(def.id)) source = 'revoked';
    else if (o.granted.includes(def.id)) source = 'granted';
    else if (saves[def.questId]?.state === 'done') source = 'quest';
    return { def, active: source === 'quest' || source === 'granted', source };
  });
}

/** Trainer: turn a perk on without its quest. False for an unknown id. */
export function grantPerk(id: string): boolean {
  if (!BY_ID.has(id)) return false;
  const o = readOverrides();
  o.revoked = o.revoked.filter((x) => x !== id);
  if (!o.granted.includes(id)) o.granted.push(id);
  writeOverrides(o);
  return true;
}

/** Trainer: turn a perk off even if its quest is done. False for an unknown id. */
export function revokePerk(id: string): boolean {
  if (!BY_ID.has(id)) return false;
  const o = readOverrides();
  o.granted = o.granted.filter((x) => x !== id);
  if (!o.revoked.includes(id)) o.revoked.push(id);
  writeOverrides(o);
  return true;
}

/** Trainer: back to "active when the quest is done". */
export function clearPerkOverride(id: string): boolean {
  if (!BY_ID.has(id)) return false;
  const o = readOverrides();
  o.granted = o.granted.filter((x) => x !== id);
  o.revoked = o.revoked.filter((x) => x !== id);
  writeOverrides(o);
  return true;
}

/** Active perks not announced yet; marks them announced. perkEffects.ts toasts them. */
export function takeNewPerks(): PerkDef[] {
  const o = readOverrides();
  const fresh = PERKS.filter((p) => activePerks().has(p.id) && !o.seen.includes(p.id));
  if (fresh.length > 0) {
    o.seen.push(...fresh.map((p) => p.id));
    writeOverrides(o);
  }
  return fresh;
}

// ---- Effect numbers (pure, read by perkEffects.ts, worldEvents.ts and the street-event director). ----

/** Spend reasons (Economy.spend's second argument) and the perk that discounts them. */
export const PRICE_PERKS: readonly { perk: PerkId; reasons: readonly string[]; scale: number }[] = [
  { perk: 'velvet-rope', reasons: ['Acorn-Cola', 'Dandelion Fizz', 'Acorn-Flour Cake'], scale: 0.75 },
  { perk: 'fizz-sponsor', reasons: ['Dandelion Fizz'], scale: 0 },
  { perk: 'mulch-rebate', reasons: ["Pay 'n' Glaze"], scale: 0.85 },
  { perk: 'carb-contacts', reasons: ['Turfton Taxi'], scale: 0.8 },
  { perk: 'conductor-punch', reasons: ['Turfton Taxi'], scale: 0.9 },
  { perk: 'impound-key', reasons: ['Sling-Lift'], scale: 0.75 },
  { perk: 'weeping-line', reasons: ['Pebblewick'], scale: 0.8 },
  { perk: 'combine-hum', reasons: ['Ratchet Repairs'], scale: 0 },
  { perk: 'sling-regular', reasons: ['Sling-Lift'], scale: 0.85 },
  { perk: 'staff-discount', reasons: ['Turfton Taxi'], scale: 0.85 },
  { perk: 'slipway-regular', reasons: ["Wingwright's Slipway"], scale: 0.9 },
  { perk: 'glaze-on-the-house', reasons: ["Pay 'n' Glaze repair"], scale: 0 },
  { perk: 'hopper-pass', reasons: ['Pebblewick Hopper'], scale: 0.5 },
  { perk: 'estate-agent', reasons: ['Hangar Two', 'Mossbank Boathouse'], scale: 0.9 },
  { perk: 'party-favour', reasons: ['Acorn-Flour Cake'], scale: 0.9 },
];

/** Earnings multipliers by earn reason (perkEffects.ts wraps economy.earn). Matching scales multiply. */
export const EARN_PERKS: readonly { perk: PerkId; reasons: readonly string[]; scale: number }[] = [
  { perk: 'showoff', reasons: ['Near Miss'], scale: 1.2 },
  { perk: 'scrap-eye', reasons: ['Scrap'], scale: 1.2 },
  { perk: 'verge-volunteer', reasons: ['Lawn Service'], scale: 1.25 },
  { perk: 'bent-pin-regular', reasons: ['The Bent Pin'], scale: 1.15 },
  { perk: 'skyway-regular', reasons: ['Speed Trap Daredevil'], scale: 1.1 },
  { perk: 'pigeon-tip', reasons: ['Pigeon-Drop parcel'], scale: 1.25 },
  { perk: 'lodge-regular', reasons: ['Tuft & Tally Lodge'], scale: 1.15 },
  { perk: 'hide-regular', reasons: ['Bird photo', 'New bird'], scale: 1.2 },
];

/** Earnings multiplier for an earn reason given the active perks (pure). */
export function earnScaleFor(reason: string | undefined, active: ReadonlySet<PerkId>): number {
  if (!reason) return 1;
  let s = 1;
  for (const p of EARN_PERKS) if (active.has(p.perk) && p.reasons.includes(reason)) s *= p.scale;
  return s;
}

/** Price multiplier for a spend reason given the active perks (pure). The lowest matching scale wins. */
export function priceScaleFor(reason: string | undefined, active: ReadonlySet<PerkId>): number {
  if (!reason) return 1;
  let s = 1;
  for (const p of PRICE_PERKS) if (active.has(p.perk) && p.reasons.includes(reason)) s = Math.min(s, p.scale);
  return s;
}

/** Multiplier on world-event and street-event Acorn rewards. */
export function perkRewardScale(): number {
  return (perkActive('shelldon-odds') ? 1.1 : 1) * (perkActive('press-pass') ? 1.1 : 1) * (perkActive('neighbour-badge') ? 1.05 : 1);
}
