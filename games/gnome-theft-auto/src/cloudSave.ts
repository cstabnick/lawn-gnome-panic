// Cloud save for Gnome Theft Auto: every progress key (GTA_SAVE_KEYS in saveIO.ts) is mirrored, as one bundle, to the
// platform's SaveService (game GNOME_THEFT_AUTO) when the player is signed in, so Turfton progress follows them to other
// devices. Not signed in or offline: nothing changes, the game plays from localStorage as before.
//
// Mode: 'merge', not 'choose'. The bundle is ten independent things (quests, Acorns, loadouts, bests, sets...), and a
// "this device or that one?" prompt would throw away the other device's half of everything. Each key merges on its own:
//   - quests: mergeQuestSaves (done beats active, furthest step, every cracked target)
//   - stunts, boats helmed, collectibles: union; lap bests: the faster lap per vehicle; intro seen: either side
//   - economy, glaze, gun mods, garage: the side written last (per-key timestamps), since those are one current state
// A key removed on purpose (Options > Experimental > reset) is a tombstone and the newer side wins, so a reset spreads.
//
// Local layout: BUNDLE_KEY holds { v: 1, keys: { [key]: { t, raw } } } (raw = the key's localStorage text, or null for a
// tombstone; t = ms when this device saw it change). refreshBundle() rebuilds it from the keys (values that differ get
// t = now), applyBundle() writes it back to the keys. Save modules call notifySaveChanged() (saveHook.ts) after a write.
import { createCloudSlot, defaultDeps, type CloudDeps, type CloudSlot, type CloudStatus } from '@lawn/cloudsave';
import { mergeBirdSaves } from './birding/birdSave';
import { mergeOutskirtsSaves } from './outskirts/save';
import { mergeRacingSaves } from './streetRace/save';
import { mergeMowSave } from './flora/rewards';
import { mergeGolfSave } from './golf/save';
import { mergeQuestSaves, parseSavesJson } from './quests/questSave';
import { GTA_SAVE_KEYS, type GtaSaveKey } from './saveIO';
import { setSaveChangedListener } from './saveHook';

export type { CloudDeps, CloudStatus };

/** localStorage key of the bundle (the slot's save text). */
export const BUNDLE_KEY = 'gta-cloud-bundle-v1';
/** localStorage key of the slot's sync bookkeeping. */
export const SYNC_KEY = 'gta-cloud-sync-v1';

export interface BundleEntry {
  /** When this side saw the value change (ms since epoch). */
  t: number;
  /** The key's localStorage text; null = deleted on purpose (a reset). */
  raw: string | null;
}
export interface Bundle {
  v: 1;
  keys: Partial<Record<GtaSaveKey, BundleEntry>>;
}

type Store = NonNullable<CloudDeps['storage']>;

// ---- Per-key merges (pure) -------------------------------------------------------------------------------------------

function parse(raw: string | null): unknown {
  if (raw === null) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
const strings = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);
const union = (a: unknown, b: unknown): string[] => [...new Set([...strings(a), ...strings(b)])].sort();

function unionArrays(a: string, b: string): string {
  return JSON.stringify(union(parse(a), parse(b)));
}

function unionCollectibles(a: string, b: string): string {
  const pa = (parse(a) ?? {}) as Record<string, unknown>;
  const pb = (parse(b) ?? {}) as Record<string, unknown>;
  return JSON.stringify({ acorns: union(pa.acorns, pb.acorns), shards: union(pa.shards, pb.shards), signs: union(pa.signs, pb.signs) });
}

interface Lap { time: number; splits: number[] }
function bestLaps(a: string, b: string): string {
  const best: Record<string, Lap> = {};
  for (const side of [a, b]) {
    const laps = ((parse(side) ?? {}) as { best?: Record<string, unknown> }).best;
    if (!laps || typeof laps !== 'object') continue;
    for (const [kind, e] of Object.entries(laps)) {
      const lap = e as Partial<Lap> | null;
      if (!lap || typeof lap.time !== 'number' || !Array.isArray(lap.splits)) continue;
      const have = best[kind];
      if (!have || lap.time < have.time) best[kind] = { time: lap.time, splits: lap.splits };
    }
  }
  const sorted: Record<string, Lap> = {};
  for (const k of Object.keys(best).sort()) sorted[k] = best[k];
  return JSON.stringify({ best: sorted });
}

/** Gnomey Bird `{ best }`: the higher best score of the two devices. */
function bestGnomeyBird(a: string, b: string): string {
  const best = (s: string): number => {
    const v = (parse(s) as { best?: unknown } | null)?.best;
    return typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.floor(v)) : 0;
  };
  return JSON.stringify({ best: Math.max(best(a), best(b)) });
}

/** Quests merged both ways round give the same quests; sort ids so the text is the same too. */
function quests(a: string, b: string): string {
  const merged = parseSavesJson(mergeQuestSaves(a, b));
  const sorted: Record<string, unknown> = {};
  for (const id of Object.keys(merged).sort()) sorted[id] = merged[id];
  return JSON.stringify(sorted);
}

/** How two live values of a key combine; null = "the newer side wins". */
const MERGES: Record<GtaSaveKey, ((a: string, b: string) => string) | null> = {
  'gta-quests-v1': quests,
  'gta-economy-v1': null,
  'gta-collectibles-v1': unionCollectibles,
  'gta-glaze-v1': null,
  'gta-gunmods-v1': null,
  'gta-garage': null,
  'gta-lockup-v1': null,
  'gta-estates-v1': null,
  'gta-stunts-v1': unionArrays,
  'gta-speedway-laps-v1': bestLaps,
  'gta-boats-helmed-v1': unionArrays,
  'gta-intro-seen-v1': (a, b) => (a === '1' || b === '1' ? '1' : a),
  'gta-hunting-v1': null,
  'gta-craft-tune-v1': null,
  'gta-air-flown-v1': unionArrays,
  'gta-birding-v1': mergeBirdSaves,
  'gta-trainer-v1': null, // trainer/mark.ts: the newer mark wins; a device without one keeps the other's
  'gta-sky-v1': unionArrays, // skyTraffic/progress.ts: ads read and flags only grow
  'gta-fishing-v1': null, // fishing/fishSave.ts: one current state (rods, bait, cards); the newer side wins
  'gta-jobs-v1': null, // jobs/career.ts: one career state (XP, counters); the newer side wins
  'gta-mowing-v1': mergeMowSave, // flora/rewards.ts: counts only grow; per-field maximum
  'gta-outskirts-v1': mergeOutskirtsSaves, // outskirts/save.ts: Pebblewick progress only grows; a union
  'gta-odd-rides-v1': unionArrays, // oddRides.ts: the odd rides driven only grow
  'gta-inventory-v1': null, // inventory.ts: one current bag; the newer side wins
  'gta-ownership-v1': null, // ownership.ts: properties, policies and wrecks; the newer side wins (pairs with gta-economy-v1 loans)
  'gta-position-v1': null, // positionSave.ts: the last place stood; the newer side wins
  'gta-gnomeybird-v1': bestGnomeyBird, // gnomlet/apps/gnomeyBird.ts: the higher best score wins
  'gta-home-v1': null, // home/layout.ts: one current flat layout; the newer side wins
  'gta-homes-visited-v1': unionArrays, // homes/visits.ts: home ids visited only grow
  'gta-winter-v1': null, // winter/save.ts: best times, run counts, ice catches; the newer side wins
  'gta-golf-v1': mergeGolfSave, // golf/save.ts: counts and bests merge, the board stays broken, ids union
  'gta-rootwell-v1': null, // campus/achievements.ts: campus doors visited; the newer side wins
  'gta-farm-v1': null, // farm/runtime.ts: one croft; the newer side (later savedAt) wins
  'gta-country-v1': null, // country/achievements.ts: visits and seen deer; the newer side wins
  'gta-camp-loot-v1': null, // country/campsBuild.ts: camp tin times; the newer side wins
  'gta-racing-v1': mergeRacingSaves, // streetRace/save.ts: lowest best per track, counts grow
};

/** Keys that only grow: refreshBundle merges a local write into the bundle instead of replacing it (a stale in-memory
 *  copy in a save module must not drop what another device added mid-session). */
const GROWS = new Set<GtaSaveKey>(['gta-gnomeybird-v1', 'gta-homes-visited-v1', 'gta-collectibles-v1', 'gta-stunts-v1', 'gta-speedway-laps-v1', 'gta-boats-helmed-v1', 'gta-intro-seen-v1', 'gta-birding-v1', 'gta-sky-v1', 'gta-outskirts-v1', 'gta-mowing-v1', 'gta-odd-rides-v1', 'gta-racing-v1']);

function newer(a: BundleEntry, b: BundleEntry): BundleEntry {
  if (a.t !== b.t) return a.t > b.t ? a : b;
  // Same instant: any fixed choice keeps the merge deterministic (a tombstone wins, then the larger text).
  if (a.raw === null || b.raw === null) return a.raw === null ? a : b;
  return a.raw >= b.raw ? a : b;
}

export function mergeEntry(key: GtaSaveKey, a: BundleEntry | undefined, b: BundleEntry | undefined): BundleEntry | undefined {
  if (!a || !b) return a ?? b;
  const fn = MERGES[key];
  if (!fn || a.raw === null || b.raw === null) return newer(a, b);
  return { t: Math.max(a.t, b.t), raw: fn(a.raw, b.raw) };
}

export function parseBundle(text: string | null): Bundle {
  const out: Bundle = { v: 1, keys: {} };
  const p = parse(text) as { keys?: Record<string, unknown> } | null;
  if (!p || typeof p !== 'object' || !p.keys || typeof p.keys !== 'object') return out;
  for (const key of GTA_SAVE_KEYS) {
    const e = p.keys[key] as Partial<BundleEntry> | undefined;
    if (!e || typeof e.t !== 'number' || (e.raw !== null && typeof e.raw !== 'string')) continue;
    out.keys[key] = { t: e.t, raw: e.raw };
  }
  return out;
}

export function stringifyBundle(b: Bundle): string {
  const keys: Bundle['keys'] = {};
  for (const key of GTA_SAVE_KEYS) if (b.keys[key]) keys[key] = b.keys[key];
  return JSON.stringify({ v: 1, keys });
}

/** The slot's merge: this browser's bundle (null = none) and the account's, key by key. Deterministic and idempotent. */
export function mergeBundles(local: string | null, remote: string): string {
  const a = parseBundle(local);
  const b = parseBundle(remote);
  const out: Bundle = { v: 1, keys: {} };
  for (const key of GTA_SAVE_KEYS) {
    const e = mergeEntry(key, a.keys[key], b.keys[key]);
    if (e) out.keys[key] = e;
  }
  return stringifyBundle(out);
}

/** "3 quests done, 420 Acorns": shown with the save on the account. */
export function summarizeBundle(text: string): string {
  const b = parseBundle(text);
  const qs = parseSavesJson(b.keys['gta-quests-v1']?.raw ?? null);
  const done = Object.values(qs).filter((q) => q?.state === 'done').length;
  const eco = parse(b.keys['gta-economy-v1']?.raw ?? null) as { acorns?: unknown } | null;
  const acorns = typeof eco?.acorns === 'number' ? `, ${eco.acorns} Acorns` : '';
  return `${done} quest${done === 1 ? '' : 's'} done${acorns}`;
}

// ---- Bundle <-> keys -------------------------------------------------------------------------------------------------

function safeGet(storage: Store, key: string): string | null {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

/** Fold the current localStorage keys into the bundle (changed values get t = now). Returns the bundle text. */
export function refreshBundle(storage: Store, now = Date.now()): string {
  const before = safeGet(storage, BUNDLE_KEY);
  const b = parseBundle(before);
  for (const key of GTA_SAVE_KEYS) {
    const raw = safeGet(storage, key);
    const e = b.keys[key];
    if (raw === null) {
      // Gone since the last look: removed on purpose (reset), so the removal spreads. Never seen: nothing to say.
      if (e && e.raw !== null) b.keys[key] = { t: now, raw: null };
      continue;
    }
    if (e?.raw === raw) continue;
    const fn = MERGES[key];
    const grown = e && e.raw !== null && GROWS.has(key) && fn ? fn(e.raw, raw) : raw;
    if (grown !== e?.raw) b.keys[key] = { t: now, raw: grown };
  }
  const text = stringifyBundle(b);
  if (text !== before && (before !== null || Object.keys(b.keys).length > 0)) {
    try {
      storage.setItem(BUNDLE_KEY, text);
    } catch {
      // storage full or blocked: the bundle just is not updated
    }
  }
  return text;
}

/** Write the bundle back to the localStorage keys (only those that differ). */
export function applyBundle(storage: Store): void {
  const b = parseBundle(safeGet(storage, BUNDLE_KEY));
  for (const key of GTA_SAVE_KEYS) {
    const e = b.keys[key];
    if (!e) continue;
    try {
      if (e.raw === null) {
        if (storage.getItem(key) !== null) storage.removeItem(key);
      } else if (storage.getItem(key) !== e.raw) {
        storage.setItem(key, e.raw);
      }
    } catch {
      // storage full or blocked
    }
  }
}

// ---- The slot --------------------------------------------------------------------------------------------------------

let deps: CloudDeps = defaultDeps();
let slot: CloudSlot | null = null;
let starting = false;
const listeners = new Set<(s: CloudStatus) => void>();

function emit(): void {
  const s = cloudStatus();
  for (const cb of [...listeners]) {
    try {
      cb(s);
    } catch {
      // a listener must not break the sync
    }
  }
}

function makeSlot(): CloudSlot {
  const next = createCloudSlot({
    game: 'GNOME_THEFT_AUTO',
    saveKey: BUNDLE_KEY,
    syncKey: SYNC_KEY,
    summarize: summarizeBundle,
    mode: 'merge',
    merge: mergeBundles,
    // A push found another device's newer save and merged it in: put it in the keys (read by the modules on next load).
    onLocalChanged: () => {
      if (deps.storage) applyBundle(deps.storage);
    },
    deps,
  });
  next.onStatus(emit);
  return next;
}

/**
 * Run once at startup, before the game modules read their saves (main.ts, before importing app.ts). Folds local keys
 * into the bundle, merges with the account's save (gives up after timeoutMs: offline play is never blocked), writes the
 * result back to the keys and starts listening for notifySaveChanged(). Never rejects.
 */
export async function startCloudSave(timeoutMs = 4000): Promise<void> {
  slot = makeSlot();
  const storage = deps.storage;
  if (!storage) return;
  // The Save Trainer paused sync on this device: play from localStorage only, never pull or push (trainer/sections/save.ts).
  if (cloudPaused()) return;
  try {
    refreshBundle(storage);
    starting = true;
    emit();
    const r = await slot.syncAtStartup(timeoutMs);
    if (r.kind === 'ok') applyBundle(storage);
  } catch {
    // never blocks the game
  } finally {
    starting = false;
    emit();
  }
  const live = slot;
  setSaveChangedListener(() => {
    refreshBundle(storage);
    live.pushSave();
  });
}

/** localStorage key: '1' = the Save Trainer paused cloud sync on this device (not a save key, never synced). */
export const CLOUD_PAUSE_KEY = 'gta-cloud-paused-v1';

/** True when the Save Trainer paused cloud sync on this device. */
export function cloudPaused(): boolean {
  try {
    return deps.storage?.getItem(CLOUD_PAUSE_KEY) === '1';
  } catch {
    return false;
  }
}

/** Save Trainer: pause (true) or resume cloud sync on this device. Takes effect on the next load. */
export function setCloudPaused(paused: boolean): void {
  try {
    if (paused) deps.storage?.setItem(CLOUD_PAUSE_KEY, '1');
    else deps.storage?.removeItem(CLOUD_PAUSE_KEY);
  } catch {
    // storage blocked
  }
}

/** 'syncing' while the startup sync runs, then the slot's status ('off' = not signed in or unreachable). */
export function cloudStatus(): CloudStatus {
  if (starting) return 'syncing';
  return slot?.status() ?? 'off';
}

/** Calls cb whenever the status changes. Returns an unsubscribe function. */
export function onCloudStatus(cb: (s: CloudStatus) => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

/** True when the player is signed in (an 'off' status then means the service could not be reached). */
export function cloudSignedIn(): boolean {
  try {
    return deps.signedIn();
  } catch {
    return false;
  }
}

/** One line for Options: synced, syncing, offline, or not signed in. */
export function cloudStatusText(s: CloudStatus = cloudStatus(), signedIn = cloudSignedIn()): string {
  if (cloudPaused()) return 'Sync paused on this device (Save Trainer): progress stays here until you resume it.';
  if (s === 'synced') return 'Synced: your Turfton progress follows your account.';
  if (s === 'syncing') return 'Syncing with your account...';
  if (s === 'stopped') return 'Sync paused: another device saved first. Reload to sync again.';
  return signedIn ? 'Offline: progress is saved on this device and syncs next time.' : 'Saved on this device only. Sign in at the arcade (Me page) to sync it.';
}

/** Adds the Cloud save heading and its live status line to the Options panel. */
export function mountCloudStatus(panel: HTMLElement): void {
  const line = document.createElement('div');
  line.className = 'gta-opt-note';
  line.id = 'gta-cloud-status';
  const paint = (s: CloudStatus) => {
    line.dataset.status = s;
    line.textContent = cloudStatusText(s);
  };
  paint(cloudStatus());
  onCloudStatus(paint);
  panel.append(line);
}

/** Replaces some deps and resets the slot, status and hook. For tests only. */
export function setCloudDepsForTest(partial: Partial<CloudDeps>): void {
  deps = { ...defaultDeps(), ...partial };
  slot = null;
  starting = false;
  setSaveChangedListener(null);
}
