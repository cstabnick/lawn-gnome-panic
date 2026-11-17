// Pure deterministic slot machine rules (no DOM, no THREE, no Math.random).
import { getSlotSpec } from './catalog';
import type { PayoutRule, SlotEvent, SlotMachineSpec, SlotState } from './types';

const PAYOUT_SHOW_S = 1.4;

function nextRand(st: SlotState): number {
  st.seed = (st.seed + 0x6d2b79f5) >>> 0;
  let t = Math.imul(st.seed ^ (st.seed >>> 15), 1 | st.seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function pickSymbol(st: SlotState, spec: SlotMachineSpec): string {
  const total = spec.symbols.reduce((sum, s) => sum + s.weight, 0);
  let r = nextRand(st) * total;
  for (const sym of spec.symbols) {
    r -= sym.weight;
    if (r <= 0) return sym.id;
  }
  return spec.symbols[spec.symbols.length - 1].id;
}

function matchesRule(spec: SlotMachineSpec, reels: readonly string[], rule: PayoutRule): boolean {
  const m = rule.match;
  if (m.k === 'three') return reels.length >= 3 && reels.every((id) => id === m.symbol);
  if (m.k === 'any-bar') {
    const barIds = new Set(spec.symbols.filter((s) => s.isBar).map((s) => s.id));
    return reels.length >= 3 && reels.every((id) => barIds.has(id));
  }
  if (m.k === 'two') {
    const count = reels.filter((id) => id === m.symbol).length;
    return count >= 2;
  }
  return false;
}

export function evaluateReels(
  spec: SlotMachineSpec,
  reels: readonly string[],
  bet: number,
): { win: number; multiplier: number; label: string; jackpot: boolean } {
  for (const rule of spec.payouts) {
    if (matchesRule(spec, reels, rule)) {
      return {
        win: bet * rule.multiplier,
        multiplier: rule.multiplier,
        label: rule.label,
        jackpot: Boolean(rule.jackpot),
      };
    }
  }
  return { win: 0, multiplier: 0, label: '', jackpot: false };
}

export function newSlotState(machineId: string, machineType: string, seed: number): SlotState {
  const spec = getSlotSpec(machineType);
  return {
    machineId,
    machineType: spec.id,
    phase: 'idle',
    phaseT: 0,
    bet: spec.minBet,
    reels: Array.from({ length: spec.reelCount }, (_, i) => spec.symbols[i % spec.symbols.length].id),
    stopped: Array.from({ length: spec.reelCount }, () => true),
    anticipating: false,
    lastWin: 0,
    lastMultiplier: 0,
    lastLabel: '',
    jackpot: false,
    seed: seed >>> 0,
    totalSpins: 0,
    totalWon: 0,
  };
}

export function setSlotBet(st: SlotState, amount: number, chips: number): number {
  if (st.phase === 'spinning') return st.bet;
  const spec = getSlotSpec(st.machineType);
  const clamped = Math.max(spec.minBet, Math.min(spec.maxBet, Math.round(amount)));
  st.bet = chips > 0 ? Math.min(clamped, Math.max(spec.minBet, chips)) : spec.minBet;
  return st.bet;
}

export function startSpin(
  st: SlotState,
  chips: number,
): { ok: boolean; cost: number; events: SlotEvent[] } {
  if (st.phase === 'spinning') return { ok: false, cost: 0, events: [] };
  const spec = getSlotSpec(st.machineType);
  if (chips < st.bet || st.bet < spec.minBet) return { ok: false, cost: 0, events: [] };

  const cost = st.bet;
  st.phase = 'spinning';
  st.phaseT = 0;
  st.anticipating = false;
  st.lastWin = 0;
  st.lastMultiplier = 0;
  st.lastLabel = '';
  st.jackpot = false;
  st.totalSpins += 1;
  st.reels = Array.from({ length: spec.reelCount }, () => pickSymbol(st, spec));
  st.stopped = Array.from({ length: spec.reelCount }, () => false);
  return { ok: true, cost, events: [{ e: 'spin-start', bet: cost }] };
}

function stopTimeForReel(spec: SlotMachineSpec, reels: readonly string[], index: number): number {
  let t = spec.spinS + index * spec.reelStopStaggerS;
  if (index === spec.reelCount - 1 && spec.reelCount >= 3 && reels[0] === reels[1]) {
    t += spec.anticipationS;
  }
  return t;
}

export function tickSlots(st: SlotState, dt: number): { events: SlotEvent[]; payout: number } {
  const events: SlotEvent[] = [];
  if (st.phase === 'idle') return { events, payout: 0 };

  const spec = getSlotSpec(st.machineType);
  st.phaseT += dt;

  if (st.phase === 'spinning') {
    for (let i = 0; i < spec.reelCount; i++) {
      if (st.stopped[i]) continue;
      if (st.phaseT >= stopTimeForReel(spec, st.reels, i)) {
        st.stopped[i] = true;
        const matchSoFar = i > 0 && st.reels[i] === st.reels[0];
        events.push({ e: 'reel-stop', reel: i, symbol: st.reels[i], matchSoFar });
        if (i === 1 && st.reels[0] === st.reels[1] && !st.anticipating) {
          st.anticipating = true;
          events.push({ e: 'anticipation' });
        }
      }
    }

    if (st.stopped.every(Boolean)) {
      const res = evaluateReels(spec, st.reels, st.bet);
      st.lastWin = res.win;
      st.lastMultiplier = res.multiplier;
      st.lastLabel = res.label;
      st.jackpot = res.jackpot;
      st.totalWon += res.win;
      st.phase = 'payout';
      st.phaseT = 0;
      if (res.win > 0) {
        events.push({
          e: 'win',
          amount: res.win,
          multiplier: res.multiplier,
          label: res.label,
          jackpot: res.jackpot,
        });
      } else {
        events.push({ e: 'lose' });
      }
      return { events, payout: res.win };
    }
    return { events, payout: 0 };
  }

  if (st.phase === 'payout' && st.phaseT >= PAYOUT_SHOW_S) {
    st.phase = 'idle';
    st.phaseT = 0;
    events.push({ e: 'ready' });
  }
  return { events, payout: 0 };
}
