import {
  DECORS,
  PLOT_TIERS,
  TOOLS,
  TREE_NODES,
  decorCost,
  formatNum,
  gnomeHireCost,
} from '../balance.ts';
import type { DecorId, TreeNodeId } from '../balance.ts';
import {
  act,
  bestUnlockedGrass,
  canBuyTreeNode,
  computeStats,
  countDecor,
  finishMowerRide,
  hasCritter,
  hasNode,
  tick,
  unlockedTiles,
} from './engine.ts';
import { createInitialState } from './state.ts';
import type { GameState } from './types.ts';

export interface WeekSummary {
  week: number;
  durationSec: number;
  peakIncomePerSec: number;
  clippingsEarned: number;
  mulchEarned: number;
  lifetimeMulch: number;
}

export interface BotReport {
  mode: 'clicker' | 'idle';
  ended: boolean;
  totalMinutes: number;
  weeks: WeekSummary[];
  maxStallSec: number;
  maxProblemPenalty: number;
  maxNumberSeen: number;
}

function trySpendDecisions(state: GameState, mode: 'clicker' | 'idle'): boolean {
  let bought = false;
  const stats = computeStats(state);

  // 1. Buy skill tree nodes (prioritize capstone, then tier-4 path, then key nodes)
  const priorityOrder: TreeNodeId[] =
    mode === 'idle'
      ? [
          'tame-mower',
          'root',
          'spare-hat',
          'whistle',
          'foreman',
          'tea-break',
          'deep-roots',
          'seed-sense',
          'overseeding',
          'golden-blades',
          'big-thimble',
          'rain-dance',
          'barrel-keeper',
          'compost-alchemy',
          'firm-grip',
          'long-nap',
          'late-riser',
          'birdseed',
          'worm-whisperer',
          'good-boy',
          'squirrel-treaty',
          'lawn-stripes',
          'union-cap',
          'dry-summer-prep',
          'bee-line',
        ]
      : [
          'tame-mower',
          'root',
          'firm-grip',
          'deep-roots',
          'spare-hat',
          'big-thimble',
          'birdseed',
          'seed-sense',
          'whistle',
          'combo-keeper',
          'worm-whisperer',
          'rain-dance',
          'overseeding',
          'foreman',
          'golden-eye',
          'good-boy',
          'barrel-keeper',
          'golden-blades',
          'tea-break',
          'squirrel-treaty',
          'compost-alchemy',
          'lawn-stripes',
          'union-cap',
          'dry-summer-prep',
          'bee-line',
        ];

  for (const id of priorityOrder) {
    if (canBuyTreeNode(state, id)) {
      act(state, { type: 'buy-tree-node', id });
      bought = true;
    }
  }

  // If Tame the Mower is bought and bell is ready, ring it!
  if (hasNode(state, 'tame-mower') && stats.bellReady) {
    act(state, { type: 'ring-bell' });
    return true;
  }

  // 2. Sow bare dirt or upgrade grass to best unlocked
  const tiles = unlockedTiles(state);
  const best = bestUnlockedGrass(state);
  const hasBare = tiles.some((t) => t.grass === 'bare' && !t.decor);
  const needsUpgrade = tiles.some((t) => !t.decor && t.grass !== best && t.grass !== 'moss');
  if (hasBare || needsUpgrade) {
    act(state, { type: 'sow-all', grass: best });
    bought = true;
  }

  // 3. Expand lawn plot when affordable
  const nextPlot = PLOT_TIERS[state.plotLevel + 1];
  if (nextPlot && state.acorns >= nextPlot.acornCost + 2) {
    act(state, { type: 'expand-plot' });
    bought = true;
  }

  // 4. Hire gnome
  const hire = gnomeHireCost(state.gnomes);
  if (state.clippings >= hire.clippings && state.acorns >= hire.acorns && state.gnomes < 26) {
    act(state, { type: 'hire-gnome' });
    bought = true;
  }

  // 5. Tool upgrades
  for (const tool of ['trimTool', 'waterTool', 'weedTool'] as const) {
    const def = TOOLS[tool];
    const next = def.tiers[state[tool] + 1];
    if (next && state.clippings >= next.cost) {
      act(state, { type: 'upgrade-tool', tool });
      bought = true;
    }
  }

  // 6. Key functional decor (one of each useful one per week)
  const wantDecor: DecorId[] = [
    'compost-bin',
    'sprinkler',
    'stepping-stones',
    'birdbath',
    'bird-feeder',
    'rain-barrel',
    'flower-bed',
    'flamingo',
  ];
  for (const d of wantDecor) {
    const def = DECORS[d];
    if (state.week < def.minWeek) continue;
    const owned = countDecor(state, d);
    if (owned >= 2) continue;
    const cost = decorCost(d, owned);
    const canPay =
      (def.currency === 'clippings' && state.clippings >= cost * 1.3) ||
      (def.currency === 'acorns' && state.acorns >= cost + 3) ||
      (def.currency === 'loam' && state.loam >= cost + 15);
    if (canPay) {
      const slot = tiles.find((t) => !t.decor);
      if (slot) {
        act(state, { type: 'place-decor', decor: d, index: slot.index });
        bought = true;
      }
    }
  }

  // 7. Critter actions
  if (state.week >= 2 && state.acorns >= 5 && countDecor(state, 'bird-feeder') > 0 && state.squirrelTrades < 6) {
    act(state, { type: 'trade-squirrels' });
    bought = true;
  }
  if (mode === 'clicker' && state.week >= 3 && state.biscuitFetches < 36) {
    act(state, { type: 'play-fetch' });
    bought = true;
  }
  if (state.week >= 5 && !hasCritter(state, 'crows') && state.acorns >= 10) {
    act(state, { type: 'befriend-crows' });
    bought = true;
  }

  // 8. Job balancing
  if (stats.waterFactor < 0.75 && state.jobs.trim > 1) {
    act(state, { type: 'assign-job', job: 'water', delta: 1 });
  } else if (stats.loamFactor < 0.75 && countDecor(state, 'compost-bin') > 0 && state.jobs.trim > 1) {
    act(state, { type: 'assign-job', job: 'compost', delta: 1 });
  } else if (mode === 'idle' && state.week >= 3 && state.jobs.dog === 0 && state.jobs.trim > 3) {
    act(state, { type: 'assign-job', job: 'dog', delta: 1 });
  }

  return bought;
}

export function runBot(mode: 'clicker' | 'idle', maxMinutes = 140): BotReport {
  const state = createInitialState();
  const weeks: WeekSummary[] = [];
  let currentWeek = state.week;
  let weekPeak = 0;
  let weekClippings = 0;
  let weekDuration = 0;
  let lastLifetimeMulch = 0;

  let stallSec = 0;
  let maxStallSec = 0;
  let maxProblemPenalty = 0;
  let maxNumberSeen = 0;
  let decisionTimer = 0;

  const stepDt = 0.5; // 0.5 s steps for fast simulation
  const maxSec = maxMinutes * 60;

  while (state.totalElapsedSec < maxSec && !state.ended) {
    if (state.mowerRide.active) {
      // Complete the 60s mower ride
      state.totalElapsedSec += 60;
      finishMowerRide(state);
      break;
    }

    // Active clicker behavior: 4-6 taps/s, grabs golden acorns, blows wishes, casts rain dance
    if (mode === 'clicker') {
      if (state.goldenAcorn) act(state, { type: 'tap-golden-acorn' });
      if (state.easterEgg) act(state, { type: 'tap-easter-egg' });
      if (state.wishes > 0 && state.buffs.length < 2) act(state, { type: 'blow-wish' });
      if (hasNode(state, 'rain-dance') && state.rainCooldownSec <= 0) act(state, { type: 'rain-dance' });

      const statsBefore = computeStats(state);
      if (statsBefore.waterFactor < 0.75) {
        act(state, { type: 'tap-thimble' });
      }
      // Tap up to 3 best tiles per 0.5s (= 6 taps/s)
      const tiles = unlockedTiles(state);
      let taps = 0;
      for (const t of tiles) {
        if (taps >= 3) break;
        if (t.weed || t.grub || t.mole || t.puddle || t.grass === 'bare' || t.height >= 25) {
          act(state, { type: 'tap-tile', index: t.index });
          taps++;
        }
      }
    }

    // Buy decisions: clicker checks every 5s, idle checks every 25s
    decisionTimer += stepDt;
    const interval = mode === 'clicker' ? 5 : 25;
    if (decisionTimer >= interval) {
      decisionTimer = 0;
      const bought = trySpendDecisions(state, mode);
      if (bought) stallSec = 0;
    }

    const prevClippingsWeek = state.clippingsThisWeek;
    tick(state, stepDt);
    weekDuration += stepDt;

    const stats = computeStats(state);
    weekPeak = Math.max(weekPeak, stats.autoIncomePerSec);
    weekClippings = Math.max(weekClippings, prevClippingsWeek);
    maxProblemPenalty = Math.max(maxProblemPenalty, stats.problemPenalty);
    maxNumberSeen = Math.max(maxNumberSeen, state.clippings, state.lifetimeClippings);

    // Track stall (only when not waiting on final mower ride)
    if (!hasNode(state, 'tame-mower')) {
      stallSec += stepDt;
      // Check if player *could* afford any action right now
      const hire = gnomeHireCost(state.gnomes);
      const canBuyAnything =
        (state.clippings >= hire.clippings && state.acorns >= hire.acorns) ||
        (['trimTool', 'waterTool', 'weedTool'] as const).some((k) => {
          const nxt = TOOLS[k].tiers[state[k] + 1];
          return nxt && state.clippings >= nxt.cost;
        }) ||
        TREE_NODES.some((n) => canBuyTreeNode(state, n.id));
      if (canBuyAnything) stallSec = 0;
      maxStallSec = Math.max(maxStallSec, stallSec);
    }

    if (state.week !== currentWeek) {
      const gainedMulch = state.lifetimeMulch - lastLifetimeMulch;
      weeks.push({
        week: currentWeek,
        durationSec: Math.round(weekDuration),
        peakIncomePerSec: weekPeak,
        clippingsEarned: weekClippings,
        mulchEarned: gainedMulch,
        lifetimeMulch: state.lifetimeMulch,
      });
      currentWeek = state.week;
      lastLifetimeMulch = state.lifetimeMulch;
      weekPeak = 0;
      weekClippings = 0;
      weekDuration = 0;
      stallSec = 0;
      // Immediately spend fresh Mulch at start of new week
      trySpendDecisions(state, mode);
    }
  }

  return {
    mode,
    ended: state.ended,
    totalMinutes: Math.round((state.totalElapsedSec / 60) * 10) / 10,
    weeks,
    maxStallSec: Math.round(maxStallSec),
    maxProblemPenalty: Math.round(maxProblemPenalty * 1000) / 1000,
    maxNumberSeen,
  };
}

export function formatBotReport(r: BotReport): string {
  const lines = [
    `\n=== Incregnomtal Balance Sim: ${r.mode.toUpperCase()} ===`,
    `Ended: ${r.ended} in ${r.totalMinutes} min | Max stall: ${r.maxStallSec}s | Max problem penalty: ${(r.maxProblemPenalty * 100).toFixed(1)}% | Peak num: ${formatNum(r.maxNumberSeen)}`,
    'Week | Len   | Peak /s  | Clippings | Mulch | Lifetime',
    '-----|-------|----------|-----------|-------|---------',
  ];
  for (const w of r.weeks) {
    lines.push(
      `  ${w.week}  | ${(w.durationSec / 60).toFixed(1).padStart(4)}m | ${formatNum(w.peakIncomePerSec).padStart(8)} | ${formatNum(w.clippingsEarned).padStart(9)} | ${String(w.mulchEarned).padStart(5)} | ${String(w.lifetimeMulch).padStart(8)}`,
    );
  }
  return lines.join('\n');
}
