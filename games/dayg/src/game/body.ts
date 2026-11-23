// The gnome's fired-clay body: chips and cracks from Hatless scratches, falls and cold; moss in open cracks.
// Pure helpers do the rules and mutate a BodyState; createBodySystem wires them to the bus.
import type { DeathCause, Season, TreatMethod, Tuning } from '../sim/types';
import type { Bus } from './bus';
import {
  BODY_PARTS,
  type BodyPart, type BodyState, type BodySystem, type CrackLevel, type InfectionStage, type NeedDamage,
} from './types';

type CrackCause = 'hit' | 'fall' | 'cold' | 'scrape';
type Cracks = Record<BodyPart, CrackLevel>;

export function createBody(): BodyState {
  return {
    cracks: { head: 0, chest: 0, armL: 0, armR: 0, legL: 0, legR: 0 },
    glaze: 1, wear: 0, infection: null, shattered: false, cause: null,
  };
}

function raiseLevel(b: BodyState, part: BodyPart): void {
  if (b.cracks[part] < 3) b.cracks[part] = (b.cracks[part] + 1) as CrackLevel;
}

function shatter(b: BodyState, cause: DeathCause): void {
  if (b.shattered) return;
  b.shattered = true;
  b.cause = cause;
}

function pickPart(rng: () => number, t: Tuning): BodyPart {
  const w = t.body.partWeights;
  const total = BODY_PARTS.reduce((s, p) => s + w[p], 0);
  let r = rng() * total;
  for (const p of BODY_PARTS) {
    r -= w[p];
    if (r < 0) return p;
  }
  return BODY_PARTS[BODY_PARTS.length - 1];
}

export function hitBody(
  b: BodyState, strength: number, rng: () => number, t: Tuning,
): { part: BodyPart; raised: boolean; exposed: boolean; shattered: boolean } {
  if (b.shattered) return { part: 'chest', raised: false, exposed: false, shattered: true };
  const k = t.body;
  const i = t.infection;
  const part = pickPart(rng, t);
  const before = b.cracks[part];
  const raised = rng() < strength * k.crackPerHit;
  if (raised) raiseLevel(b, part);
  b.glaze = Math.max(0, b.glaze - k.glazeLossPerHit);
  let exposed = false;
  if (!b.infection) {
    const base = before >= 2 ? i.exposeOpenCrack : i.exposeGlazed;
    const chance = base * (b.glaze < 0.5 ? 2 : 1);
    if (rng() < chance) {
      exposed = true;
      b.infection = { part, hours: 0, stage: 0 };
    }
  }
  if (raised && before === 3 && (part === 'head' || part === 'chest')) shatter(b, 'hatless');
  return { part, raised, exposed, shattered: b.shattered };
}

export function fallBody(
  b: BodyState, height: number, rng: () => number, t: Tuning,
): { part: BodyPart | null; shattered: boolean } {
  const k = t.body;
  if (b.shattered || height < k.fallChip) return { part: null, shattered: b.shattered };
  const leg: BodyPart = rng() < 0.5 ? 'legL' : 'legR';
  raiseLevel(b, leg);
  if (height >= k.fallCrack && b.cracks[leg] < 2) b.cracks[leg] = 2;
  if (height >= k.fallShatter) {
    const chance = Math.min(1, k.fallShatterChance + (height - k.fallShatter) / 20);
    if (rng() < chance) shatter(b, 'fall');
    else {
      b.cracks[leg] = 3;
      raiseLevel(b, 'chest');
    }
  }
  return { part: leg, shattered: b.shattered };
}

export function stepInfection(
  b: BodyState, hours: number, season: Season, wet: number, t: Tuning,
): InfectionStage | 'turned' | null {
  const inf = b.infection;
  if (!inf || b.shattered) return null;
  const i = t.infection;
  inf.hours += hours * i.seasonMul[season] * (wet > 0 ? i.wetMul : 1);
  if (inf.hours >= i.turnHours) {
    inf.stage = 3;
    shatter(b, 'moss');
    return 'turned';
  }
  const stage: InfectionStage = inf.hours < i.stage0Hours ? 0
    : inf.hours < i.stage1Hours ? 1
    : inf.hours < i.stage2Hours ? 2 : 3;
  if (stage === inf.stage) return null;
  inf.stage = stage;
  return stage;
}

export function treatChance(b: BodyState, method: TreatMethod, t: Tuning): number {
  const inf = b.infection;
  if (!inf) return 0;
  const i = t.infection;
  let p = i.cure[method][inf.stage];
  if (method === 'scrape-seal' && inf.stage === 1) p -= i.missingGlazingPenalty * Math.max(0, 2 - i.playerGlazing);
  return Math.max(0, p);
}

export function createBodySystem(bus: Bus, rng: () => number, t: Tuning): BodySystem {
  const state = createBody();

  function emitCracks(before: Cracks, cause: CrackCause): void {
    for (const p of BODY_PARTS) {
      if (state.cracks[p] > before[p]) bus.emit('cracked', { part: p, level: state.cracks[p], cause });
    }
  }

  function emitShatter(wasShattered: boolean): void {
    if (!wasShattered && state.shattered && state.cause) bus.emit('player-shattered', { cause: state.cause });
  }

  bus.on('player-hit', (e) => {
    if (state.shattered) return;
    const was = state.shattered;
    const before = { ...state.cracks };
    const r = hitBody(state, e.strength, rng, t);
    emitCracks(before, 'hit');
    if (r.exposed) bus.emit('infection', { stage: 0, part: r.part });
    emitShatter(was);
  });

  bus.on('fell', (e) => {
    if (state.shattered) return;
    const was = state.shattered;
    const before = { ...state.cracks };
    fallBody(state, e.height, rng, t);
    emitCracks(before, 'fall');
    emitShatter(was);
  });

  return {
    state,
    update(sunHours, env) {
      if (state.shattered) return;
      const was = state.shattered;
      const before = { ...state.cracks };
      const inf = state.infection;
      if (inf) {
        const r = stepInfection(state, sunHours, env.season, env.wet, t);
        if (r !== null) bus.emit('infection', { stage: r, part: inf.part });
      }
      if (!state.shattered) {
        const dmg: readonly NeedDamage[] = env.damage;
        const add = dmg.reduce((s, d) => s + d.perHour, 0) * sunHours;
        if (add > 0) {
          let worst: NeedDamage | null = null;
          for (const d of dmg) if (!worst || d.perHour > worst.perHour) worst = d;
          const crossBefore = Math.floor(state.wear / 25);
          state.wear += add;
          const crossAfter = Math.floor(state.wear / 25);
          for (let n = crossBefore; n < crossAfter; n++) {
            raiseLevel(state, BODY_PARTS[Math.floor(rng() * BODY_PARTS.length)]);
          }
          emitCracks(before, worst?.cause === 'cold' ? 'cold' : 'hit');
          if (state.wear >= t.body.wearToShatter) shatter(state, worst?.cause ?? 'cold');
        }
      }
      emitShatter(was);
    },
    effects() {
      const stage3 = state.infection?.stage === 3;
      return {
        limp: Math.max(state.cracks.legL, state.cracks.legR) / 3,
        aimShake: Math.max(state.cracks.armL, state.cracks.armR) / 3 + (stage3 ? 0.4 : 0),
        hatSlips: stage3,
      };
    },
    treat(method) {
      if (state.shattered || !state.infection) return false;
      const inf = state.infection;
      const success = rng() < treatChance(state, method, t);
      if (!success) return false;
      const { stage, part } = inf;
      state.infection = null;
      bus.emit('infection-cured', { stage });
      if (method === 'scrape-seal' && state.cracks[part] < 3) {
        const before = { ...state.cracks };
        state.cracks[part] = 3;
        emitCracks(before, 'scrape');
      }
      return true;
    },
    mend() {
      if (state.shattered) return false;
      const worst = Math.max(...BODY_PARTS.map((p) => state.cracks[p]));
      if (worst === 0 && state.glaze >= 1) return false;
      if (worst > 0) {
        const part = BODY_PARTS.find((p) => state.cracks[p] === worst)!;
        state.cracks[part] = (worst - 1) as CrackLevel;
      }
      state.glaze = 1;
      return true;
    },
  };
}
