// The pure farm simulation (E16 D1): plant, water, grow on game time, offline growth (capped), harvest, the oak,
// save/load/merge. No three.js, no DOM, no storage. Time is passed in.
import { BED_CROPS, BEDS, CROP_IDS, FARM, cropDef, type BedState, type BedStatus, type CropId, type FarmEvent,
  type FarmResult, type FarmState, type FarmStats, type OakState } from './types';

type Stage = 0 | 1 | 2;

const fail = (error: string) => ({ ok: false as const, error });

function validBed(bed: number): boolean {
  return Number.isInteger(bed) && bed >= 0 && bed < BEDS.length;
}

function emptyBed(): BedState {
  return { crop: null, stage: 0, grown: 0, wet: false };
}

/** A fresh croft: eight empty beds, no oak, empty crate, seed 'radish'. */
export function newFarm(nowMs = 0): FarmState {
  return {
    v: 1, savedAt: nowMs,
    beds: BEDS.map(() => emptyBed()),
    oak: { planted: false, stage: 0, grown: 0, sinceShake: 0 },
    crate: {}, seed: 'radish',
    stats: { planted: 0, harvested: 0, sold: 0, earned: 0, acornsFromOak: 0 },
  };
}

export function bedStatus(s: FarmState, bed: number): BedStatus {
  const b = validBed(bed) ? s.beds[bed] : undefined;
  if (!b || !b.crop) return 'empty';
  if (b.stage === 2) return 'ripe';
  return b.wet ? 'growing' : 'dry';
}

export function plantCrop(s: FarmState, bed: number, crop: CropId): FarmResult {
  if (!validBed(bed)) return fail('No such bed.');
  if (s.beds[bed].crop) return fail('Something is growing here.');
  if (crop === 'oak') return fail('The oak goes in its own spot.');
  if (!BED_CROPS.includes(crop)) return fail('Nothing to plant.');
  s.beds[bed] = { crop, stage: 0, grown: 0, wet: false };
  s.stats.planted += 1;
  return { ok: true };
}

export function waterBed(s: FarmState, bed: number): FarmResult {
  if (!validBed(bed)) return fail('No such bed.');
  const b = s.beds[bed];
  if (!b.crop) return fail('Nothing planted.');
  if (b.stage === 2) return fail('Ready to harvest.');
  if (b.wet) return fail('Already watered.');
  b.wet = true;
  return { ok: true };
}

export function harvest(s: FarmState, bed: number): { ok: true; crop: CropId; n: number } | { ok: false; error: string } {
  if (!validBed(bed)) return fail('No such bed.');
  const b = s.beds[bed];
  if (!b.crop) return fail('Nothing planted.');
  if (b.stage < 2) return fail('Not ripe yet.');
  const crop = b.crop;
  const n = cropDef(crop).yield;
  s.beds[bed] = emptyBed();
  s.stats.harvested += n;
  return { ok: true, crop, n };
}

export function plantOak(s: FarmState): FarmResult {
  if (s.oak.planted) return fail('The oak is already planted.');
  s.oak = { planted: true, stage: 0, grown: 0, sinceShake: 0 };
  s.stats.planted += 1;
  return { ok: true };
}

export function oakReady(s: FarmState): boolean {
  return s.oak.planted && s.oak.stage === 2 && s.oak.sinceShake >= FARM.oakShakeS;
}

export function shakeOak(s: FarmState): number {
  if (!oakReady(s)) return 0;
  s.oak.sinceShake = 0;
  s.stats.acornsFromOak += FARM.oakShakeAcorns;
  return FARM.oakShakeAcorns;
}

/** Grow the farm by dt seconds of game time. */
export function stepFarm(s: FarmState, dt: number): FarmEvent[] {
  if (!Number.isFinite(dt) || dt <= 0) return [];
  const events: FarmEvent[] = [];

  s.beds.forEach((b, bed) => {
    const crop = b.crop;
    if (!crop || b.stage >= 2 || !b.wet) return;
    b.grown += dt;
    if (b.grown < cropDef(crop).stageS) return;
    // One stage per step; the leftover time is dropped and the bed is dry for the next stage.
    b.grown = 0;
    b.stage = (b.stage + 1) as Stage;
    b.wet = false;
    events.push({ kind: 'stage', bed, crop, stage: b.stage });
    if (b.stage < 2) events.push({ kind: 'thirsty', bed, crop });
  });

  const oak = s.oak;
  if (oak.planted) {
    if (oak.stage < 2) {
      oak.grown += dt;
      const stageS = cropDef('oak').stageS;
      while (oak.stage < 2 && oak.grown >= stageS) {
        oak.grown -= stageS;
        oak.stage = (oak.stage + 1) as Stage;
        events.push({ kind: 'oak-stage', stage: oak.stage });
      }
      if (oak.stage === 2) {
        // The oak starts its shake count at 0; time left over from growing counts toward the first shake.
        const left = oak.grown;
        oak.grown = 0;
        oak.sinceShake = 0;
        advanceShake(oak, left, events);
      }
    } else {
      advanceShake(oak, dt, events);
    }
  }

  return events;
}

function advanceShake(oak: OakState, dt: number, events: FarmEvent[]): void {
  const before = oak.sinceShake;
  oak.sinceShake += dt;
  if (before < FARM.oakShakeS && oak.sinceShake >= FARM.oakShakeS) events.push({ kind: 'oak-ready' });
}

/** Growth while the game was closed: measured from savedAt, capped at FARM.offlineCapS. */
export function applyOffline(s: FarmState, nowMs: number): FarmEvent[] {
  if (!Number.isFinite(nowMs)) return [];
  const raw = (nowMs - s.savedAt) / 1000;
  const secs = Number.isFinite(raw) ? Math.min(Math.max(raw, 0), FARM.offlineCapS) : 0;
  const events = stepFarm(s, secs);
  s.savedAt = nowMs;
  return events;
}

export function bedSecondsLeft(s: FarmState, bed: number): number {
  const b = validBed(bed) ? s.beds[bed] : undefined;
  if (!b || !b.crop || b.stage === 2) return 0;
  return Math.max(0, cropDef(b.crop).stageS - b.grown);
}

export function oakSecondsLeft(s: FarmState): number {
  const oak = s.oak;
  if (!oak.planted) return 0;
  if (oak.stage < 2) return Math.max(0, cropDef('oak').stageS - oak.grown);
  return Math.max(0, FARM.oakShakeS - oak.sinceShake);
}

export function serializeFarm(s: FarmState, nowMs: number): string {
  return JSON.stringify({ ...s, savedAt: nowMs });
}

// ---- lenient parse --------------------------------------------------------------------------------------------------

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function isStage(v: unknown): v is Stage {
  return v === 0 || v === 1 || v === 2;
}

function isNonNeg(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v) && v >= 0;
}

function isBedCrop(v: unknown): v is CropId {
  return typeof v === 'string' && (BED_CROPS as readonly string[]).includes(v);
}

function parseBed(raw: unknown): BedState {
  if (!isRecord(raw) || !isBedCrop(raw.crop)) return emptyBed();
  if (!isStage(raw.stage) || !isNonNeg(raw.grown) || typeof raw.wet !== 'boolean') return emptyBed();
  return { crop: raw.crop, stage: raw.stage, grown: raw.grown, wet: raw.wet };
}

function parseOak(raw: unknown): OakState {
  const fresh = newFarm().oak;
  if (!isRecord(raw)) return fresh;
  return {
    planted: raw.planted === true,
    stage: isStage(raw.stage) ? raw.stage : 0,
    grown: isNonNeg(raw.grown) ? raw.grown : 0,
    sinceShake: isNonNeg(raw.sinceShake) ? raw.sinceShake : 0,
  };
}

/** Parse a stored farm; anything broken falls back field by field, and an unreadable save is a fresh farm. */
export function parseFarm(raw: string | null, nowMs = 0): FarmState {
  if (!raw) return newFarm(nowMs);
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return newFarm(nowMs);
  }
  if (!isRecord(parsed) || parsed.v !== 1) return newFarm(nowMs);

  const out = newFarm(nowMs);
  out.savedAt = typeof parsed.savedAt === 'number' && Number.isFinite(parsed.savedAt) ? parsed.savedAt : nowMs;

  const bedsRaw = Array.isArray(parsed.beds) ? parsed.beds : [];
  out.beds = BEDS.map((_, i) => parseBed(bedsRaw[i]));
  out.oak = parseOak(parsed.oak);

  if (isRecord(parsed.crate)) {
    for (const id of CROP_IDS) {
      const n = parsed.crate[id];
      if (typeof n === 'number' && Number.isInteger(n) && n >= 0) out.crate[id] = n;
    }
  }

  out.seed = isBedCrop(parsed.seed) ? parsed.seed : 'radish';

  if (isRecord(parsed.stats)) {
    const keys: (keyof FarmStats)[] = ['planted', 'harvested', 'sold', 'earned', 'acornsFromOak'];
    for (const k of keys) {
      const n = parsed.stats[k];
      out.stats[k] = isNonNeg(n) ? n : 0;
    }
  }

  return out;
}

/** The save with the later savedAt (ties: a). */
export function mergeFarm(a: FarmState, b: FarmState): FarmState {
  return a.savedAt >= b.savedAt ? a : b;
}
