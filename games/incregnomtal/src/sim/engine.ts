import {
  BISCUIT_TRICKS,
  DECORS,
  GRASS_BASE_GROWTH_PER_SEC,
  GRASS_ORDER,
  GRASSES,
  LIFETIME_MULCH_BONUS_PER_POINT,
  MAX_GRID_COLS,
  MAX_GRID_ROWS,
  MAX_PROBLEM_PENALTY,
  MAX_TAPS_PER_SEC,
  NEWSPAPER_HEADLINES,
  PLOT_TIERS,
  PROBLEMS,
  SIGN_TITLES,
  TIER_4_NODES,
  TOOLS,
  TREE_BY_ID,
  decorCost,
  gnomeHireCost,
  jobMilestoneMult,
  mulchForWeek,
  resowCost,
  weekLengthSec,
} from '../balance.ts';
import type {
  BiscuitTrickId,
  CritterId,
  DecorId,
  GrassId,
  JobId,
  ProblemId,
  TreeNodeId,
} from '../balance.ts';
import { applyPlotTierToTiles } from './state.ts';
import type { ComputedStats, GameAction, GameState, SimEvent, TileState } from './types.ts';

export function hasNode(state: GameState, id: TreeNodeId): boolean {
  return state.treeNodes.includes(id);
}

export function hasCritter(state: GameState, id: CritterId): boolean {
  return state.befriendedCritters.includes(id);
}

export function hasTrick(state: GameState, id: BiscuitTrickId): boolean {
  return state.biscuitTricks.includes(id);
}

export function hasBuff(state: GameState, kind: 'growth' | 'tap' | 'water' | 'biscuit' | 'golden'): boolean {
  return state.buffs.some((b) => b.kind === kind && b.remainingSec > 0);
}

export function countDecor(state: GameState, id: DecorId): number {
  let c = 0;
  for (const t of state.tiles) {
    if (t.unlocked && t.decor === id) c++;
  }
  return c;
}

export function unlockedTiles(state: GameState): TileState[] {
  return state.tiles.filter((t) => t.unlocked);
}

export function bestUnlockedGrass(state: GameState): GrassId {
  // Pick highest value grass that isn't moss (shade-only) unless needed
  let best: GrassId = 'crabgrass';
  let bestVal = 0;
  for (const g of state.unlockedGrasses) {
    if (g === 'moss') continue;
    if (GRASSES[g].value > bestVal) {
      bestVal = GRASSES[g].value;
      best = g;
    }
  }
  return best;
}

function pushLine(state: GameState, line: string): void {
  state.teacupLine = line;
  state.recentLines.unshift(line);
  if (state.recentLines.length > 16) state.recentLines.length = 16;
}

function unlockGrass(state: GameState, grass: GrassId, events: SimEvent[]): void {
  if (!state.unlockedGrasses.includes(grass)) {
    state.unlockedGrasses.push(grass);
    pushLine(state, `Foreman Teacup: "Discovered ${GRASSES[grass].name} seed! Select it in Lawn."`);
    events.push({ kind: 'wish', text: `Unlocked ${GRASSES[grass].name}!` });
  }
}

function befriendCritter(state: GameState, id: CritterId, events: SimEvent[]): void {
  if (!state.befriendedCritters.includes(id)) {
    state.befriendedCritters.push(id);
    events.push({ kind: 'biscuit', text: `Befriended ${id}!` });
    if (state.befriendedCritters.length >= 6) {
      events.push({ kind: 'achievement', id: 'inc-all-critters' });
    }
  }
}

function triggerProblem(state: GameState, id: ProblemId, events: SimEvent[]): void {
  if (!state.seenProblems.includes(id)) {
    state.seenProblems.push(id);
    const row = PROBLEMS.find((p) => p.id === id);
    if (row) {
      pushLine(state, row.tell);
      events.push({ kind: 'problem', id, text: row.name });
    }
  }
  if (!state.activeProblems.includes(id)) {
    state.activeProblems.push(id);
    state.problemGraceSec[id] = 12; // 12 s grace before damage starts
  }
}

function clearProblem(state: GameState, id: ProblemId): void {
  const idx = state.activeProblems.indexOf(id);
  if (idx >= 0) state.activeProblems.splice(idx, 1);
}

export function canBuyTreeNode(state: GameState, id: TreeNodeId): boolean {
  if (hasNode(state, id)) return false;
  const def = TREE_BY_ID[id];
  if (!def) return false;
  if (state.mulch < def.cost) return false;
  if (def.exclusiveWith && hasNode(state, def.exclusiveWith)) return false;
  if (id === 'tame-mower') {
    const t4Count = TIER_4_NODES.filter((n) => hasNode(state, n)).length;
    return t4Count >= 2;
  }
  return def.requires.every((r) => hasNode(state, r));
}

export function computeStats(state: GameState): ComputedStats {
  const tiles = unlockedTiles(state);
  const planted = tiles.filter((t) => t.grass !== 'bare' && !t.decor);

  // Day/night cycle: 1 day = weekLen / 7; last 25% of each day is dusk/night
  const wLen = weekLengthSec(state.week, hasNode(state, 'late-riser'));
  const dayLen = wLen / (hasNode(state, 'late-riser') ? 8 : 7);
  const dayPhase = (state.weekElapsedSec % dayLen) / dayLen;
  const isNight = dayPhase > 0.78;
  const nightMult = isNight && !hasNode(state, 'tea-break') ? 0.75 : 1.0;

  // Charm calculation
  let charm = 0;
  for (const t of tiles) {
    if (t.decor) {
      charm += DECORS[t.decor].charm;
    } else if (t.grass !== 'bare') {
      charm += GRASSES[t.grass].charmPerTile;
    }
  }
  if (hasCritter(state, 'bees')) {
    charm += hasNode(state, 'bee-line') ? 24 : 10;
  }
  if (hasCritter(state, 'crows')) charm += 10;
  if (hasTrick(state, 'roller')) charm += 10;
  if (hasNode(state, 'lawn-stripes')) charm *= 2;
  charm = Math.max(0, Math.round(charm * 10) / 10);
  const charmMult = 1 + charm / 50;

  // Water supply & demand
  const waterToolDef = TOOLS.waterTool.tiers[Math.min(state.waterTool, TOOLS.waterTool.tiers.length - 1)];
  const sprinklers = countDecor(state, 'sprinkler');
  const rainBarrels = countDecor(state, 'rain-barrel');
  const baseFlowCap = (waterToolDef.flowCap ?? 16) + sprinklers * 22;
  const barrelCapBonus = hasNode(state, 'barrel-keeper') ? 1.25 : 1;
  const dryMult = state.drySummerActive
    ? hasNode(state, 'dry-summer-prep')
      ? 0.7
      : 0.25
    : 1;
  const flowCap = baseFlowCap * barrelCapBonus * dryMult;

  const watererBase =
    state.jobs.water *
    4.2 *
    waterToolDef.mult *
    jobMilestoneMult(state.jobs.water) *
    (hasNode(state, 'big-thimble') ? 3 : 1) *
    (hasNode(state, 'whistle') ? 1.35 : 1);
  const trenchBonus = hasTrick(state, 'digHere') ? 1.3 : 1;
  const rainBonus = state.rainSec > 0 || hasBuff(state, 'water') ? 999 : 0;
  const waterSupply = Math.min(flowCap, watererBase + sprinklers * 8 + 1.5) * trenchBonus + rainBonus;

  let waterDemand = 0;
  for (const t of planted) {
    const g = GRASSES[t.grass];
    waterDemand += g.water * g.growth;
  }
  if (waterDemand < 0.1) waterDemand = 0.1;
  const waterRatio =
    state.water > 5
      ? Math.min(1, (waterSupply + state.water * 0.15) / waterDemand)
      : Math.min(1, waterSupply / waterDemand);
  // Floor at 0.2 so no tile ever dies
  const waterFactor = 0.2 + 0.8 * Math.max(0, Math.min(1, waterRatio));

  // Loam supply & demand
  const compostBins = countDecor(state, 'compost-bin');
  const weedToolDef = TOOLS.weedTool.tiers[Math.min(state.weedTool, TOOLS.weedTool.tiers.length - 1)];
  let loamSupply = 0.5; // natural soil regen
  if (compostBins > 0) {
    const compRatio = hasNode(state, 'compost-alchemy') ? 0.5 : 0.1;
    loamSupply +=
      state.jobs.compost *
      3.2 *
      weedToolDef.mult *
      jobMilestoneMult(state.jobs.compost) *
      (1 + compostBins * 0.4) *
      compRatio *
      10;
  }
  if (hasCritter(state, 'worms')) {
    loamSupply += hasNode(state, 'worm-whisperer') ? 14 : 6;
  }
  let loamDemand = 0;
  for (const t of planted) {
    const g = GRASSES[t.grass];
    if (g.loam < 0) {
      loamSupply += -g.loam * 1.2; // clover produces loam
    } else {
      loamDemand += g.loam;
    }
  }
  if (loamDemand < 0.1) loamDemand = 0.1;
  const loamRatio =
    state.loam > 5
      ? Math.min(1, (loamSupply + state.loam * 0.15) / loamDemand)
      : Math.min(1, loamSupply / loamDemand);
  const loamFactor = 0.3 + 0.7 * Math.max(0, Math.min(1, loamRatio));

  // Problem penalty (hard capped at 40%)
  let rawPenalty = 0;
  let problemTiles = 0;
  for (const t of planted) {
    if (t.weed) problemTiles += 0.4;
    if (t.puddle) problemTiles += 0.5;
    if (t.grub) problemTiles += 0.6;
    if (t.mole) problemTiles += 0.7;
    if (t.dogSpot && t.grass !== 'clover') problemTiles += 0.5;
    if (t.scorched && !GRASSES[t.grass].heatProof) problemTiles += 0.5;
  }
  if (planted.length > 0) {
    rawPenalty = (problemTiles / planted.length) * 0.5;
  }
  // Crows penalty if shiny decor unprotected in week 5+
  if (
    state.activeProblems.includes('crows') &&
    !hasCritter(state, 'crows') &&
    !hasTrick(state, 'chase') &&
    countDecor(state, 'scarecrow') === 0
  ) {
    rawPenalty += 0.15;
  }
  const problemPenalty = Math.min(MAX_PROBLEM_PENALTY, Math.max(0, rawPenalty));

  // Global multipliers
  const lifetimeMulchMult = 1 + state.lifetimeMulch * LIFETIME_MULCH_BONUS_PER_POINT;
  let globalMult = lifetimeMulchMult * charmMult * (1 - problemPenalty) * nightMult;
  if (hasNode(state, 'root')) globalMult *= 1.15;
  if (hasNode(state, 'seed-sense')) globalMult *= 1.2;
  if (hasNode(state, 'tea-break')) globalMult *= 1.6;
  if (hasNode(state, 'squirrel-treaty')) globalMult *= 1.35;
  if (hasNode(state, 'dry-summer-prep')) globalMult *= 1.5;
  if (hasNode(state, 'union-cap')) globalMult *= 1 + state.gnomes * 0.04;
  if (hasNode(state, 'long-nap')) globalMult *= 1.25;
  if (hasBuff(state, 'golden')) globalMult *= 2.0;

  // Growth multiplier
  let growthMult = waterFactor * loamFactor;
  if (hasNode(state, 'deep-roots')) growthMult *= 1.3;
  if (hasNode(state, 'compost-alchemy')) growthMult *= 1.4;
  if (hasCritter(state, 'worms')) growthMult *= hasNode(state, 'worm-whisperer') ? 1.3 : 1.15;
  if (hasTrick(state, 'roller')) growthMult *= 1.45;
  if (hasCritter(state, 'frog')) growthMult *= 1.12;
  if (hasBuff(state, 'growth')) growthMult *= 2.0;
  if (hasBuff(state, 'biscuit')) growthMult *= 1.5;
  if (state.rainSec > 0) growthMult *= 1.3;

  // Trim capacity & auto income estimate
  const trimToolDef = TOOLS.trimTool.tiers[Math.min(state.trimTool, TOOLS.trimTool.tiers.length - 1)];
  const stones = countDecor(state, 'stepping-stones');
  const speedMult =
    (1 + stones * 0.12) *
    (hasNode(state, 'whistle') ? 1.35 : 1) *
    (hasBuff(state, 'biscuit') ? 1.3 : 1);
  const trimCapacity =
    state.jobs.trim * 0.9 * trimToolDef.mult * jobMilestoneMult(state.jobs.trim) * speedMult;

  let lawnProductionValue = 0;
  for (const t of planted) {
    const g = GRASSES[t.grass];
    if (!g.needsTrim) continue;
    let tileGrowth = g.growth * growthMult;
    if (t.shaded && !g.shadeTolerant) tileGrowth *= 0.45;
    if (t.puddle) tileGrowth *= 0.15;
    const cyclesPerSec = (GRASS_BASE_GROWTH_PER_SEC * tileGrowth) / 90;
    lawnProductionValue += g.value * cyclesPerSec;
  }

  const goldenAvgMult = hasNode(state, 'golden-blades') ? 1.45 : 1;
  // Auto trimmers harvest proportional to capacity and lawn value
  const effectiveHarvest =
    state.jobs.trim > 0
      ? lawnProductionValue * Math.min(1.2, 0.65 + trimCapacity / Math.max(1, planted.length * 0.45)) * trimToolDef.mult * 0.85
      : 0;
  const autoIncomePerSec = Math.max(0, effectiveHarvest * globalMult * goldenAvgMult);

  // Tap value: max(best tile value, 3% of current auto income/s)
  const bestTileVal =
    planted.length > 0
      ? Math.max(...planted.map((t) => GRASSES[t.grass].value)) * globalMult
      : 1 * globalMult;
  const comboCap = hasNode(state, 'combo-keeper') ? 1.5 : 1.0;
  const comboMult = 1 + Math.min(comboCap, state.tapCombo * 0.05);
  const tapMult =
    comboMult *
    (hasNode(state, 'firm-grip') ? 2 : 1) *
    (hasBuff(state, 'tap') ? 3 : 1);
  const tapValue = Math.max(bestTileVal, autoIncomePerSec * 0.03) * tapMult;

  // Sign title
  let signTitle = SIGN_TITLES[0].title;
  if (state.ended) {
    signTitle = 'Yard of the Year';
  } else {
    for (const s of SIGN_TITLES) {
      if (charm >= s.minCharm) signTitle = s.title;
    }
  }

  const day = Math.floor(state.weekElapsedSec / dayLen);
  const bellReady = day >= 2 || state.sandboxMode; // Wednesday (index 2) onward

  return {
    charm,
    charmMult,
    waterSupply,
    waterDemand,
    waterFactor,
    loamSupply,
    loamDemand,
    loamFactor,
    problemPenalty,
    autoIncomePerSec,
    tapValue,
    signTitle,
    mulchPreview: mulchForWeek(state.clippingsThisWeek),
    lifetimeMulchMult,
    isNight,
    bellReady,
  };
}

function addClippings(state: GameState, amount: number): void {
  if (amount <= 0) return;
  // Cap below 10^12 in normal play
  const capped = Math.min(amount, 5e11);
  state.clippings = Math.min(9.9e11, state.clippings + capped);
  state.clippingsThisWeek = Math.min(9.9e11, state.clippingsThisWeek + capped);
  state.lifetimeClippings = Math.min(9.9e11, state.lifetimeClippings + capped);
}

function trimTile(
  state: GameState,
  tile: TileState,
  stats: ComputedStats,
  isManual: boolean,
  events: SimEvent[],
): number {
  const g = GRASSES[tile.grass];
  if (!g.needsTrim || tile.height < 18) return 0;

  const heightFrac = tile.height / 100;
  let pay = isManual
    ? Math.max(g.value * heightFrac * stats.charmMult * stats.lifetimeMulchMult, stats.tapValue)
    : g.value * heightFrac * stats.charmMult * stats.lifetimeMulchMult;

  let isGolden = tile.golden;
  if (!isGolden && hasNode(state, 'golden-blades') && ((state.totalTrims + tile.index) % 20 === 0)) {
    isGolden = true;
  }
  if (isGolden) {
    pay *= 10;
    tile.golden = false;
  }

  addClippings(state, pay);
  tile.height = 10;
  tile.overgrownSec = 0;
  state.trimsThisWeek++;
  state.totalTrims++;

  if (state.trimsThisWeek >= 25) {
    unlockGrass(state, 'fescue', events);
  }
  if (isManual) {
    events.push({ kind: 'trim', tileIndex: tile.index, value: pay });
  }
  return pay;
}

export function act(state: GameState, action: GameAction): SimEvent[] {
  const events: SimEvent[] = [];
  if (state.mowerRide.active) return events;
  const stats = computeStats(state);

  switch (action.type) {
    case 'tap-tile': {
      // Rate limit manual taps to 8/s
      if (state.tapsThisSecond >= MAX_TAPS_PER_SEC) return events;
      state.tapsThisSecond++;
      state.tapCombo = Math.min(hasNode(state, 'combo-keeper') ? 30 : 20, state.tapCombo + 1);
      state.tapComboDecaySec = hasNode(state, 'combo-keeper') ? 3.0 : 1.0;

      const tile = state.tiles[action.index];
      if (!tile || !tile.unlocked) return events;

      // If placing decor
      if (state.placingDecor) {
        return act(state, { type: 'place-decor', decor: state.placingDecor, index: action.index });
      }

      // Sundial easter egg: tap 7 times -> Gnomeday
      if (tile.decor === 'sundial') {
        state.sundialTaps++;
        if (state.sundialTaps === 7) {
          state.gnomedayActive = true;
          pushLine(state, 'Foreman Teacup: "You broke the sundial. Now it says Gnomeday."');
          events.push({ kind: 'easter', text: 'Gnomeday!' });
        }
        return events;
      }

      // Clear tile problems first (satisfying click fix!)
      if (tile.weed) {
        tile.weed = false;
        state.wishes++;
        state.dandelionsPulled++;
        addClippings(state, stats.tapValue * 0.6);
        events.push({ kind: 'weed', tileIndex: tile.index });
        if (state.dandelionsPulled >= 20) {
          events.push({ kind: 'achievement', id: 'inc-wish-maker' });
        }
        return events;
      }
      if (tile.puddle) {
        if (state.week >= 4 && !hasCritter(state, 'frog')) {
          befriendCritter(state, 'frog', events);
          pushLine(state, 'Foreman Teacup: "A frog moved into the puddle. Guess we leave one wet."');
          return events;
        }
        tile.puddle = false;
        state.water = Math.min(state.waterCap, state.water + 8);
        events.push({ kind: 'water', tileIndex: tile.index });
        return events;
      }
      if (tile.grub) {
        tile.grub = false;
        addClippings(state, stats.tapValue * 0.8);
        events.push({ kind: 'weed', tileIndex: tile.index });
        return events;
      }
      if (tile.mole) {
        tile.mole = false;
        state.loam = Math.min(state.loamCap, state.loam + 4);
        events.push({ kind: 'weed', tileIndex: tile.index });
        return events;
      }
      if (tile.dogSpot) {
        tile.dogSpot = false;
        events.push({ kind: 'water', tileIndex: tile.index });
        return events;
      }

      // Sow bare tile or resow different grass
      if (tile.decor) return events;
      if (tile.grass === 'bare') {
        const g = state.unlockedGrasses.includes(state.selectedGrass)
          ? state.selectedGrass
          : 'crabgrass';
        const cost = resowCost(g, hasNode(state, 'seed-sense'));
        if (state.clippings >= cost) {
          state.clippings -= cost;
          tile.grass = g;
          tile.height = 15;
          clearProblem(state, 'bare-dirt');
          // Check if starting lawn is filled -> unlock Ryegrass
          const u = unlockedTiles(state);
          if (u.every((t) => t.grass !== 'bare' || t.decor !== null)) {
            unlockGrass(state, 'ryegrass', events);
          }
          events.push({ kind: 'trim', tileIndex: tile.index, value: 0 });
        }
        return events;
      }

      // Trim if tall enough
      if (tile.height >= 20 && GRASSES[tile.grass].needsTrim) {
        trimTile(state, tile, stats, true, events);
      } else if (tile.grass !== state.selectedGrass && state.unlockedGrasses.includes(state.selectedGrass)) {
        const cost = resowCost(state.selectedGrass, hasNode(state, 'seed-sense'));
        if (state.clippings >= cost) {
          state.clippings -= cost;
          tile.grass = state.selectedGrass;
          tile.height = 15;
        }
      }
      return events;
    }

    case 'tap-thimble': {
      const toolDef = TOOLS.waterTool.tiers[Math.min(state.waterTool, TOOLS.waterTool.tiers.length - 1)];
      const gain = 6 * toolDef.mult * (hasNode(state, 'big-thimble') ? 3 : 1);
      state.water = Math.min(state.waterCap, state.water + gain);
      events.push({ kind: 'water', value: gain });
      return events;
    }

    case 'hire-gnome': {
      const cost = gnomeHireCost(state.gnomes);
      if (state.clippings < cost.clippings || state.acorns < cost.acorns) return events;
      state.clippings -= cost.clippings;
      state.acorns -= cost.acorns;
      state.gnomes++;
      // Assign to trim by default (or water if thirsty)
      if (stats.waterFactor < 0.7 && state.jobs.water < Math.ceil(state.gnomes * 0.35)) {
        state.jobs.water++;
      } else {
        state.jobs.trim++;
      }
      return events;
    }

    case 'assign-job': {
      const totalAssigned = Object.values(state.jobs).reduce((a, b) => a + b, 0);
      if (action.delta === 1) {
        if (totalAssigned < state.gnomes) {
          state.jobs[action.job]++;
        } else {
          // Reassign from the largest other job
          let donor: JobId | null = null;
          let max = 0;
          for (const j of Object.keys(state.jobs) as JobId[]) {
            if (j !== action.job && state.jobs[j] > max) {
              max = state.jobs[j];
              donor = j;
            }
          }
          if (donor && state.jobs[donor] > 0) {
            state.jobs[donor]--;
            state.jobs[action.job]++;
          }
        }
      } else if (state.jobs[action.job] > 0) {
        state.jobs[action.job]--;
      }
      return events;
    }

    case 'upgrade-tool': {
      const def = TOOLS[action.tool];
      const cur = state[action.tool];
      if (cur + 1 >= def.tiers.length) return events;
      const next = def.tiers[cur + 1];
      if (state.clippings < next.cost) return events;
      state.clippings -= next.cost;
      state[action.tool] = cur + 1;
      if (action.tool === 'waterTool' && cur + 1 === 2) {
        // Hose bought -> puddles can appear
        pushLine(state, 'Foreman Teacup: "Hose is down. Watch for puddles on the far tiles."');
      }
      return events;
    }

    case 'select-grass': {
      if (state.unlockedGrasses.includes(action.grass)) {
        state.selectedGrass = action.grass;
      }
      return events;
    }

    case 'sow-all': {
      if (!state.unlockedGrasses.includes(action.grass)) return events;
      state.selectedGrass = action.grass;
      const perTile = resowCost(action.grass, hasNode(state, 'seed-sense'));
      const tiles = unlockedTiles(state).filter((t) => {
        if (t.decor) return false;
        if (action.grass === 'moss') return t.shaded && t.grass !== 'moss';
        return t.grass !== action.grass && !(t.shaded && t.grass === 'moss');
      });
      for (const t of tiles) {
        if (state.clippings < perTile) break;
        state.clippings -= perTile;
        t.grass = action.grass;
        t.height = Math.max(t.height, 15);
      }
      clearProblem(state, 'bare-dirt');
      const u = unlockedTiles(state);
      if (u.every((t) => t.grass !== 'bare' || t.decor !== null)) {
        unlockGrass(state, 'ryegrass', events);
      }
      return events;
    }

    case 'expand-plot': {
      const next = PLOT_TIERS[state.plotLevel + 1];
      if (!next || state.acorns < next.acornCost) return events;
      state.acorns -= next.acornCost;
      state.plotLevel++;
      applyPlotTierToTiles(state.tiles, state.plotLevel);
      // Auto-sow new tiles with crabgrass if bare so player isn't overwhelmed
      const g = hasNode(state, 'overseeding') ? bestUnlockedGrass(state) : 'crabgrass';
      for (const t of state.tiles) {
        if (t.unlocked && t.grass === 'bare' && !t.decor) {
          t.grass = g;
          t.height = 20;
        }
      }
      pushLine(state, `Foreman Teacup: "Fence moved back. Now we've got ${next.label}."`);
      return events;
    }

    case 'set-compost-share': {
      state.compostShare = Math.max(0, Math.min(0.5, action.share));
      return events;
    }

    case 'start-place-decor': {
      state.placingDecor = action.decor;
      return events;
    }

    case 'place-decor': {
      const def = DECORS[action.decor];
      const tile = state.tiles[action.index];
      if (!def || !tile || !tile.unlocked || tile.decor) return events;
      const owned = countDecor(state, action.decor);
      const cost = decorCost(action.decor, owned);
      if (def.currency === 'clippings' && state.clippings < cost) return events;
      if (def.currency === 'acorns' && state.acorns < cost) return events;
      if (def.currency === 'loam' && state.loam < cost) return events;

      if (def.currency === 'clippings') state.clippings -= cost;
      else if (def.currency === 'acorns') state.acorns -= cost;
      else state.loam -= cost;

      tile.decor = action.decor;
      tile.grass = 'bare';
      tile.height = 0;
      tile.weed = false;
      tile.puddle = false;
      tile.grub = false;
      tile.mole = false;
      state.placingDecor = null;

      if (action.decor === 'birdbath') {
        befriendCritter(state, 'robin', events);
        pushLine(state, 'Foreman Teacup: "Robin moved right in. Grubs are done for."');
      } else if (action.decor === 'compost-bin') {
        befriendCritter(state, 'worms', events);
        pushLine(state, 'Foreman Teacup: "Compost bin is up. Earthworms already found it."');
      } else if (action.decor === 'rain-barrel') {
        state.waterCap += 120;
      } else if (action.decor === 'bird-feeder') {
        clearProblem(state, 'seed-thieves');
        pushLine(state, 'Foreman Teacup: "Feeder keeps the Robin busy. Though I hear squirrels..."');
      } else if (action.decor === 'scarecrow') {
        clearProblem(state, 'seed-thieves');
        clearProblem(state, 'crows');
      }
      return events;
    }

    case 'blow-wish': {
      if (state.wishes <= 0) return events;
      state.wishes--;
      const kinds: ('growth' | 'tap' | 'water' | 'biscuit')[] = ['growth', 'tap', 'water', 'biscuit'];
      const pick = kinds[state.dandelionsPulled % kinds.length];
      const labels: Record<typeof pick, string> = {
        growth: '×2 Growth (30s)',
        tap: '×3 Tap Value (30s)',
        water: 'Free Water (30s)',
        biscuit: 'Biscuit is Very Awake (30s)',
      };
      state.buffs = state.buffs.filter((b) => b.kind !== pick);
      state.buffs.push({ kind: pick, label: labels[pick], remainingSec: 30 });
      pushLine(state, `Wish granted: ${labels[pick]}!`);
      events.push({ kind: 'wish', text: labels[pick] });
      return events;
    }

    case 'rain-dance': {
      if (!hasNode(state, 'rain-dance') || state.rainCooldownSec > 0) return events;
      state.rainSec = 20;
      state.rainCooldownSec = 75;
      state.water = state.waterCap;
      pushLine(state, 'Foreman Teacup: "Rain Dance worked. Fill the barrels while it lasts."');
      events.push({ kind: 'water', text: 'Rain Dance!' });
      return events;
    }

    case 'tap-golden-acorn': {
      if (!state.goldenAcorn) return events;
      state.goldenAcorn = null;
      const bonus = hasNode(state, 'golden-eye') ? 4 : 2;
      state.acorns += bonus;
      state.buffs = state.buffs.filter((b) => b.kind !== 'golden');
      state.buffs.push({ kind: 'golden', label: 'Golden Acorn ×2 Clippings (30s)', remainingSec: 30 });
      pushLine(state, `Golden Acorn! +${bonus} Acorns & ×2 Clippings for 30s.`);
      events.push({ kind: 'golden', value: bonus });
      return events;
    }

    case 'tap-easter-egg': {
      if (!state.easterEgg) return events;
      const egg = state.easterEgg;
      state.easterEgg = null;
      if (egg.kind === 'stray-acorn') {
        state.acorns += 2;
        pushLine(state, 'Foreman Teacup: "A Blue Cap\'s stray shot from the Front. Finders keepers. (+2 Acorns)"');
      } else if (egg.kind === 'golf-ball') {
        state.acorns += 2;
        pushLine(state, 'Foreman Teacup: "Golf ball rolled in from Island Links. Biscuit is very proud. (+2 Acorns)"');
      } else if (egg.kind === 'bottle') {
        state.wishes += 2;
        pushLine(state, 'Message in the birdbath: "Still drifting. Send mulch. — The Castaway" (+2 Wishes)');
      } else if (egg.kind === 'hatless-gnome') {
        state.acorns += 1;
        pushLine(state, 'Foreman Teacup: "We don\'t talk about the hatless one."');
      }
      events.push({ kind: 'easter', text: egg.kind });
      return events;
    }

    case 'trade-squirrels': {
      if (state.acorns < 3) return events;
      const profit = hasNode(state, 'squirrel-treaty') ? 7 : 5;
      state.acorns += profit - 3; // net +2 or +4 acorns
      state.squirrelTrades++;
      befriendCritter(state, 'squirrels', events);
      clearProblem(state, 'squirrels');
      unlockGrass(state, 'bluegrass', events);

      // Plant an oak sapling on an edge unlocked tile -> casts shade on adjacent tiles
      const edge = unlockedTiles(state).find((t) => !t.oakSapling && !t.decor && (t.col === 0 || t.row === 0 || t.col === 2 || t.row === 2));
      if (edge) {
        edge.oakSapling = true;
        edge.shaded = true;
        for (const n of state.tiles) {
          if (Math.abs(n.col - edge.col) + Math.abs(n.row - edge.row) === 1) {
            n.shaded = true;
          }
        }
        if (state.week >= 4) unlockGrass(state, 'moss', events);
      }
      pushLine(state, `Squirrels returned ${profit} Acorns and planted an oak sapling!`);
      events.push({ kind: 'golden', value: profit });
      return events;
    }

    case 'play-fetch': {
      state.biscuitFetches++;
      for (const trick of BISCUIT_TRICKS) {
        if (state.biscuitFetches >= trick.fetchNeeded && !hasTrick(state, trick.id)) {
          state.biscuitTricks.push(trick.id);
          if (trick.id === 'fetch') {
            befriendCritter(state, 'biscuit', events);
            clearProblem(state, 'moles');
            events.push({ kind: 'achievement', id: 'inc-good-boy' });
          }
          if (trick.id === 'stayOff') clearProblem(state, 'dog-spots');
          if (trick.id === 'chase') clearProblem(state, 'crows');
          if (trick.id === 'digHere') {
            const target = unlockedTiles(state).find((t) => !t.trench && !t.decor);
            if (target) target.trench = true;
          }
          pushLine(state, `Biscuit learned "${trick.name}"! ${trick.desc}`);
          events.push({ kind: 'biscuit', text: trick.name });
        }
      }
      return events;
    }

    case 'pet-biscuit': {
      state.biscuitPets++;
      if (state.biscuitPets === 100) {
        state.chippedGnomes += 3;
        state.acorns += 5;
        pushLine(state, 'Biscuit rolled over for belly rubs! Three gnomes chipped. Worth it. (+5 Acorns)');
        events.push({ kind: 'easter', text: 'Biscuit rolled over!' });
      } else {
        events.push({ kind: 'biscuit', text: 'Woof!' });
      }
      return events;
    }

    case 'befriend-frog': {
      befriendCritter(state, 'frog', events);
      pushLine(state, 'Foreman Teacup: "Frog is on the payroll now. Eats gnats at dusk."');
      return events;
    }

    case 'befriend-crows': {
      if (state.acorns < 6 || hasCritter(state, 'crows')) return events;
      state.acorns -= 6;
      befriendCritter(state, 'crows', events);
      clearProblem(state, 'crows');
      pushLine(state, 'Foreman Teacup: "Crows took the bottle caps. Now they bring shiny junk back."');
      return events;
    }

    case 'buy-tree-node': {
      if (!canBuyTreeNode(state, action.id)) return events;
      const def = TREE_BY_ID[action.id];
      state.mulch -= def.cost;
      state.treeNodes.push(action.id);
      if (action.id === 'tame-mower') {
        pushLine(state, 'Foreman Teacup: "Old Saturday is ready to ride. Ring the shed bell when you are!"');
      }
      return events;
    }

    case 'respec-tree': {
      if (!state.canRespec || state.treeNodes.length === 0) return events;
      let refund = 0;
      for (const id of state.treeNodes) {
        refund += TREE_BY_ID[id]?.cost ?? 0;
      }
      state.treeNodes = [];
      state.mulch += refund;
      pushLine(state, `Foreman Teacup: "Tree cleared. ${refund} Mulch ready to replant."`);
      return events;
    }

    case 'ring-bell': {
      if (!stats.bellReady) return events;
      return mowingDay(state);
    }

    case 'enter-sandbox': {
      state.sandboxMode = true;
      state.mowerRide.active = false;
      unlockGrass(state, 'golden', events);
      pushLine(state, 'Foreman Teacup: "Yard of the Year. Endless summer, Golden Grass, and Old Saturday parked by the shed."');
      return events;
    }
  }
}

export function mowingDay(state: GameState): SimEvent[] {
  const events: SimEvent[] = [];

  // If Tame the Mower is unlocked and not yet ended -> start the 60s interactive Mower Ride!
  if (hasNode(state, 'tame-mower') && !state.ended) {
    state.mowerRide = {
      active: true,
      remainingSec: 60,
      durationSec: 60,
      x: 4,
      y: 5,
      angle: 0,
      mowedTiles: [],
      hatPatternScore: 0,
      finished: false,
    };
    pushLine(state, 'Foreman Teacup: "Everybody on! Steer Old Saturday across the lawn!"');
    events.push({ kind: 'mowing-day', text: 'Tame the Mower Ride!' });
    return events;
  }

  const earned = mulchForWeek(state.clippingsThisWeek);
  state.mulch += earned;
  state.lifetimeMulch += earned;
  state.mowingDays++;
  state.week++;
  state.weekElapsedSec = 0;
  state.dayIndex = 0;
  state.canRespec = true;
  state.gnomedayActive = false;

  if (state.mowingDays === 1) {
    events.push({ kind: 'achievement', id: 'inc-first-mulch' });
  }

  // Keep half rain barrel water if Barrel Keeper
  const barrels = countDecor(state, 'rain-barrel');
  const savedWater = hasNode(state, 'barrel-keeper') ? Math.round(state.water * 0.5) : 45;

  // Reset per-week resources
  state.clippings = 0;
  state.clippingsThisWeek = 0;
  state.water = Math.max(45, savedWater);
  state.waterCap = 80 + (hasNode(state, 'barrel-keeper') ? barrels * 60 : 0);
  state.loam = 40;
  state.trimsThisWeek = 0;
  state.trimTool = 0;
  state.waterTool = 0;
  state.weedTool = 0;
  state.placingDecor = null;
  state.buffs = [];
  state.activeProblems = [];
  state.problemGraceSec = {};

  // Keep acorns (hard currency) + give a small fresh-week hat stipend
  state.acorns = Math.max(state.acorns, 3);

  // Crew resets to 1 (or 2 with Spare Hat)
  state.gnomes = hasNode(state, 'spare-hat') ? 2 : 1;
  state.jobs = {
    trim: 1,
    water: state.gnomes > 1 ? 1 : 0,
    weed: 0,
    compost: 0,
    dog: 0,
    bees: 0,
  };

  // Biscuit tricks reset unless Good Boy is bought
  if (!hasNode(state, 'good-boy')) {
    const keepFetch = hasCritter(state, 'biscuit');
    state.biscuitTricks = keepFetch ? ['fetch'] : [];
    state.biscuitFetches = keepFetch ? 5 : 0;
  }

  // Reset lawn heights and decor (keep discoveries & plot size)
  const startGrass = hasNode(state, 'overseeding')
    ? bestUnlockedGrass(state)
    : state.unlockedGrasses.includes('ryegrass')
      ? 'ryegrass'
      : 'crabgrass';
  const startHeight = hasNode(state, 'overseeding') ? 50 : 20;

  for (const t of state.tiles) {
    t.decor = null;
    t.weed = false;
    t.puddle = false;
    t.grub = false;
    t.mole = false;
    t.dogSpot = false;
    t.scorched = false;
    t.golden = false;
    t.bootPrint = false;
    if (t.unlocked) {
      t.grass = t.shaded && state.unlockedGrasses.includes('moss') ? 'moss' : startGrass;
      t.height = startHeight;
      t.overgrownSec = 0;
    }
  }

  // After 3rd Mowing Day: giant boot print easter egg on one tile
  if (state.mowingDays === 3) {
    const mid = unlockedTiles(state)[Math.floor(unlockedTiles(state).length / 2)];
    if (mid) mid.bootPrint = true;
  }

  // Dry Summer starts in Week 4
  state.drySummerActive = state.week === 4;
  if (state.week === 4) {
    unlockGrass(state, 'zoysia', events);
    triggerProblem(state, 'dry-summer', events);
  } else if (state.week === 5) {
    events.push({ kind: 'achievement', id: 'inc-dry-survivor' });
    state.combineBannerSec = 10; // Week 5 fake-out banner!
    unlockGrass(state, 'moss', events);
    triggerProblem(state, 'heat-shade', events);
  } else if (state.week >= 6) {
    triggerProblem(state, 'old-saturday', events);
  }

  pushLine(
    state,
    `Mowing Day #${state.mowingDays}! Old Saturday left ${earned} Mulch (Lifetime: ${state.lifetimeMulch}). Free respec available!`,
  );
  events.push({ kind: 'mowing-day', value: earned });
  return events;
}

export function stepMowerRide(
  state: GameState,
  dt: number,
  steerX: number,
  steerY: number,
): SimEvent[] {
  const events: SimEvent[] = [];
  const ride = state.mowerRide;
  if (!ride.active || ride.finished) return events;

  ride.remainingSec = Math.max(0, ride.remainingSec - dt);
  const speed = 2.6;
  const mag = Math.hypot(steerX, steerY);
  if (mag > 0.05) {
    const nx = steerX / mag;
    const ny = steerY / mag;
    ride.angle = Math.atan2(ny, nx);
    ride.x = Math.max(0.2, Math.min(MAX_GRID_COLS - 0.2, ride.x + nx * speed * dt));
    ride.y = Math.max(0.2, Math.min(MAX_GRID_ROWS - 0.2, ride.y + ny * speed * dt));
  } else {
    ride.x = Math.max(0.2, Math.min(MAX_GRID_COLS - 0.2, ride.x + Math.cos(ride.angle) * speed * 0.6 * dt));
    ride.y = Math.max(0.2, Math.min(MAX_GRID_ROWS - 0.2, ride.y + Math.sin(ride.angle) * speed * 0.6 * dt));
  }

  const col = Math.floor(ride.x);
  const row = Math.floor(ride.y);
  const idx = row * MAX_GRID_COLS + col;
  const tile = state.tiles[idx];
  if (tile && tile.unlocked) {
    tile.height = 10;
    tile.weed = false;
    if (!ride.mowedTiles.includes(idx)) {
      ride.mowedTiles.push(idx);
      // Hat shape check: pointed triangle top (rows 2-4 center) + wide brim (row 6)
      const isCrown = row >= 2 && row <= 5 && Math.abs(col - 3.5) <= (row - 1) * 0.8;
      const isBrim = row === 6 && col >= 1 && col <= 6;
      if (isCrown || isBrim) ride.hatPatternScore++;
    }
  }

  const unlockedCount = unlockedTiles(state).length;
  if (ride.remainingSec <= 0 || ride.mowedTiles.length >= unlockedCount) {
    finishMowerRide(state, events);
  }
  return events;
}

export function finishMowerRide(state: GameState, events: SimEvent[] = []): SimEvent[] {
  state.mowerRide.active = false;
  state.mowerRide.finished = true;
  state.ended = true;
  state.secretHatEnding = state.mowerRide.hatPatternScore >= 12;
  unlockGrass(state, 'golden', events);
  pushLine(state, 'Yard of the Year! Old Saturday purrs by the shed, and Biscuit curls up in the shade.');
  events.push({ kind: 'achievement', id: 'inc-yard-of-the-year' });
  events.push({ kind: 'ending', text: 'Yard of the Year!' });
  return events;
}

export function tick(state: GameState, dt: number): SimEvent[] {
  const events: SimEvent[] = [];
  if (dt <= 0) return events;
  if (state.mowerRide.active) {
    return stepMowerRide(state, dt, 0, 0);
  }

  // Tap rate window & combo decay
  state.tapWindowSec += dt;
  if (state.tapWindowSec >= 1.0) {
    state.tapWindowSec -= 1.0;
    state.tapsThisSecond = 0;
  }
  if (state.tapCombo > 0) {
    state.tapComboDecaySec -= dt;
    if (state.tapComboDecaySec <= 0) {
      state.tapCombo = Math.max(0, state.tapCombo - 1);
      state.tapComboDecaySec = 0.25;
    }
  }

  // Buff & rain timers
  for (const b of state.buffs) b.remainingSec -= dt;
  state.buffs = state.buffs.filter((b) => b.remainingSec > 0);
  if (state.rainSec > 0) state.rainSec = Math.max(0, state.rainSec - dt);
  if (state.rainCooldownSec > 0) state.rainCooldownSec = Math.max(0, state.rainCooldownSec - dt);
  if (state.combineBannerSec > 0) state.combineBannerSec = Math.max(0, state.combineBannerSec - dt);

  // Problem grace countdown
  for (const key of Object.keys(state.problemGraceSec) as ProblemId[]) {
    const rem = (state.problemGraceSec[key] ?? 0) - dt;
    if (rem <= 0) delete state.problemGraceSec[key];
    else state.problemGraceSec[key] = rem;
  }

  // Advance clock
  state.totalElapsedSec += dt;
  state.weekElapsedSec += dt;
  const wLen = weekLengthSec(state.week, hasNode(state, 'late-riser'));
  const daysInWeek = hasNode(state, 'late-riser') ? 8 : 7;
  const newDay = Math.min(daysInWeek - 1, Math.floor((state.weekElapsedSec / wLen) * daysInWeek));
  if (newDay > state.dayIndex) {
    state.dayIndex = newDay;
    // Daily newspaper + acorn from Biscuit's Fetch the Paper trick
    if (hasTrick(state, 'fetchPaper')) {
      state.acorns += 1;
      const headline = NEWSPAPER_HEADLINES[(state.week * 7 + newDay) % NEWSPAPER_HEADLINES.length];
      pushLine(state, `${headline} (+1 Acorn)`);
    }
    // Clear boot print after 1 day
    for (const t of state.tiles) t.bootPrint = false;
  }

  // Compute current stats
  const stats = computeStats(state);

  // Water & Loam pool updates
  const waterNet = (stats.waterSupply - stats.waterDemand) * dt;
  state.water = Math.max(0, Math.min(state.waterCap, state.water + waterNet));
  const loamNet = (stats.loamSupply - stats.loamDemand) * dt;
  state.loam = Math.max(0, Math.min(state.loamCap, state.loam + loamNet));

  // Auto income from Trimmer crew
  if (stats.autoIncomePerSec > 0) {
    // Compost share drains a fraction of clippings into extra loam if bin exists
    const hasBin = countDecor(state, 'compost-bin') > 0;
    const share = hasBin ? state.compostShare : 0;
    const gross = stats.autoIncomePerSec * dt;
    addClippings(state, gross * (1 - share));
    if (share > 0) {
      const rate = hasNode(state, 'compost-alchemy') ? 0.5 : 0.1;
      state.loam = Math.min(state.loamCap, state.loam + gross * share * rate * 0.05);
    }
  }

  // Tile growth, overgrowth, auto-trim visuals & auto-weeders
  let growthMult = stats.waterFactor * stats.loamFactor;
  if (hasNode(state, 'deep-roots')) growthMult *= 1.3;
  if (hasNode(state, 'compost-alchemy')) growthMult *= 1.4;
  if (hasCritter(state, 'worms')) growthMult *= hasNode(state, 'worm-whisperer') ? 1.3 : 1.15;
  if (hasTrick(state, 'roller')) growthMult *= 1.45;
  if (hasCritter(state, 'frog')) growthMult *= 1.12;
  if (hasBuff(state, 'growth')) growthMult *= 2.0;
  if (state.rainSec > 0) growthMult *= 1.3;

  const tiles = unlockedTiles(state);
  let weedClearBudget =
    (state.jobs.weed * 0.35 * jobMilestoneMult(state.jobs.weed) * (1 + state.weedTool * 0.6)) * dt;
  let autoTrimVisualBudget = state.jobs.trim * 0.7 * dt;

  // Bees check: Clover growing unlocks Bees
  if (!hasCritter(state, 'bees') && tiles.some((t) => t.grass === 'clover')) {
    befriendCritter(state, 'bees', events);
    pushLine(state, 'Foreman Teacup: "Clover bloomed and the bees moved in. Finally, a critter with no catch."');
  }

  // Robin auto-clears grubs (unless scared off by scarecrow)
  const robinActive =
    (hasCritter(state, 'robin') || (hasNode(state, 'birdseed') && state.week >= 2)) &&
    countDecor(state, 'scarecrow') === 0;
  const biscuitActive = hasCritter(state, 'biscuit');

  for (const t of tiles) {
    if (t.decor || t.grass === 'bare') continue;
    const g = GRASSES[t.grass];
    let tileG = g.growth * growthMult;
    if (t.shaded && !g.shadeTolerant) tileG *= 0.45;
    if (t.puddle) tileG *= 0.15;

    t.height = Math.min(100, t.height + GRASS_BASE_GROWTH_PER_SEC * tileG * dt);

    // Visual auto-trimming keeps grass moving
    if (g.needsTrim && t.height >= 72 && autoTrimVisualBudget >= 0.4) {
      t.height = 18;
      t.overgrownSec = 0;
      state.trimsThisWeek++;
      state.totalTrims++;
      if (state.trimsThisWeek >= 25) unlockGrass(state, 'fescue', events);
      autoTrimVisualBudget -= 0.4;
    }

    // Overgrowth -> dandelions
    if (g.needsTrim && t.height >= 99) {
      t.overgrownSec += dt;
      if (t.overgrownSec >= 20 && !t.weed) {
        t.weed = true;
        t.overgrownSec = 0;
        triggerProblem(state, 'dandelions', events);
      }
    }

    // Auto-clear problems by Weeder / Robin / Biscuit
    if (t.weed && weedClearBudget >= 0.5) {
      t.weed = false;
      state.wishes++;
      state.dandelionsPulled++;
      weedClearBudget -= 0.5;
    }
    if (t.grub && robinActive) {
      t.grub = false;
    }
    if (t.mole && biscuitActive) {
      t.mole = false;
    }
  }

  // Dog-handler slowly teaches Biscuit tricks for idle players
  if (state.jobs.dog > 0 && state.week >= 3) {
    const rate = state.jobs.dog * 0.08 * dt;
    if (Math.floor(state.totalElapsedSec * rate + 0.001) > Math.floor((state.totalElapsedSec - dt) * rate + 0.001)) {
      act(state, { type: 'play-fetch' });
    }
  }

  // Auto-Foreman (Tier 3 Crew node): auto-hires gnomes & balances jobs
  if (hasNode(state, 'foreman') && Math.floor(state.totalElapsedSec) !== Math.floor(state.totalElapsedSec - dt)) {
    const cost = gnomeHireCost(state.gnomes);
    if (state.clippings >= cost.clippings && state.acorns >= cost.acorns && state.gnomes < 28) {
      act(state, { type: 'hire-gnome' });
    }
    if (stats.waterFactor < 0.7 && state.jobs.trim > 2) {
      state.jobs.trim--;
      state.jobs.water++;
    } else if (stats.loamFactor < 0.7 && countDecor(state, 'compost-bin') > 0 && state.jobs.trim > 2) {
      state.jobs.trim--;
      state.jobs.compost++;
    }
  }

  // Periodic problem tells & triggers based on progression
  if (stats.waterFactor < 0.72 && state.week >= 1) triggerProblem(state, 'thirst', events);
  if (state.week >= 1 && state.waterTool >= 2 && tiles.some((t) => !t.puddle && !t.decor)) {
    // Occasional puddle from hose overflow
    if (Math.floor(state.totalElapsedSec / 55) !== Math.floor((state.totalElapsedSec - dt) / 55)) {
      const cand = tiles.find((t) => !t.puddle && !t.decor && t.grass !== 'bare');
      if (cand) {
        cand.puddle = true;
        triggerProblem(state, 'tap-cap', events);
      }
    }
  }
  if (state.week >= 2 && stats.loamFactor < 0.8) {
    triggerProblem(state, 'tired-soil', events);
  }
  if (state.week >= 2 && Math.floor(state.totalElapsedSec / 45) !== Math.floor((state.totalElapsedSec - dt) / 45)) {
    const bg = tiles.find((t) => !t.grub && !t.decor && t.grass !== 'bare');
    if (bg && !robinActive) {
      bg.grub = true;
      triggerProblem(state, 'grubs', events);
    }
  }
  if (hasCritter(state, 'robin') && countDecor(state, 'bird-feeder') === 0 && countDecor(state, 'scarecrow') === 0) {
    triggerProblem(state, 'seed-thieves', events);
  }
  if (countDecor(state, 'bird-feeder') > 0 && !hasCritter(state, 'squirrels')) {
    triggerProblem(state, 'squirrels', events);
  }
  if (state.week >= 3 && hasCritter(state, 'worms') && !biscuitActive) {
    if (Math.floor(state.totalElapsedSec / 50) !== Math.floor((state.totalElapsedSec - dt) / 50)) {
      const m = tiles.find((t) => !t.mole && !t.decor && t.grass !== 'bare');
      if (m) {
        m.mole = true;
        triggerProblem(state, 'moles', events);
      }
    }
  }
  if (biscuitActive && !hasTrick(state, 'stayOff')) {
    if (Math.floor(state.totalElapsedSec / 55) !== Math.floor((state.totalElapsedSec - dt) / 55)) {
      const d = tiles.find((t) => !t.dogSpot && !t.decor && t.grass !== 'bare' && t.grass !== 'clover');
      if (d) {
        d.dogSpot = true;
        unlockGrass(state, 'clover', events);
        triggerProblem(state, 'dog-spots', events);
      }
    }
  }
  if (state.week >= 5 && (countDecor(state, 'flamingo') > 0 || countDecor(state, 'gazing-ball') > 0)) {
    if (!hasCritter(state, 'crows') && !hasTrick(state, 'chase') && countDecor(state, 'scarecrow') === 0) {
      triggerProblem(state, 'crows', events);
    }
  }

  // Acorn oak drip (slow steady acorns so player is never soft-locked)
  state.acornDripSec -= dt;
  if (state.acornDripSec <= 0) {
    const squirrelBonus = hasCritter(state, 'squirrels') ? (hasNode(state, 'squirrel-treaty') ? 3 : 2) : 1;
    const crowBonus = hasCritter(state, 'crows') ? 1 : 0;
    state.acorns += squirrelBonus + crowBonus;
    state.acornDripSec = 26;
  }

  // Golden acorn drop (every 60-120s, or 2x as often with Golden Eye)
  if (state.goldenAcorn) {
    state.goldenAcorn.remainingSec -= dt;
    if (state.goldenAcorn.remainingSec <= 0) state.goldenAcorn = null;
  } else {
    state.goldenSpawnSec -= dt;
    if (state.goldenSpawnSec <= 0 && tiles.length > 0) {
      const pick = tiles[state.nextSpawnId % tiles.length];
      state.goldenAcorn = {
        id: state.nextSpawnId++,
        col: pick.col,
        row: pick.row,
        remainingSec: 9,
      };
      state.goldenSpawnSec = hasNode(state, 'golden-eye') ? 40 : 80;
    }
  }

  // Easter egg spawn
  if (state.easterEgg) {
    state.easterEgg.remainingSec -= dt;
    if (state.easterEgg.remainingSec <= 0) state.easterEgg = null;
  } else {
    state.easterSpawnSec -= dt;
    if (state.easterSpawnSec <= 0 && tiles.length > 0) {
      const kinds: ('stray-acorn' | 'golf-ball' | 'bottle' | 'hatless-gnome')[] = [
        'stray-acorn',
        'golf-ball',
        'bottle',
        'hatless-gnome',
      ];
      const kind = kinds[state.nextSpawnId % kinds.length];
      const pick = tiles[(state.nextSpawnId * 3) % tiles.length];
      state.easterEgg = {
        kind,
        col: pick.col,
        row: pick.row,
        remainingSec: 18,
      };
      state.easterSpawnSec = 110;
    }
  }

  // Automatic Mowing Day when week finishes (unless in endless sandbox mode)
  if (!state.sandboxMode && state.weekElapsedSec >= wLen) {
    events.push(...mowingDay(state));
  }

  return events;
}

export function simulateOffline(state: GameState, elapsedSec: number): { clippingsEarned: number; secondsApplied: number } {
  const wLen = weekLengthSec(state.week, hasNode(state, 'late-riser'));
  const oneDay = wLen / 7;
  // Cap offline catch-up to one in-game day; week clock does NOT advance while away
  const capped = Math.max(0, Math.min(elapsedSec, oneDay));
  if (capped < 5) return { clippingsEarned: 0, secondsApplied: 0 };

  const stats = computeStats(state);
  const rate = hasNode(state, 'long-nap') ? 1.0 : 0.5;
  const earned = stats.autoIncomePerSec * capped * rate;
  addClippings(state, earned);
  return { clippingsEarned: earned, secondsApplied: capped };
}
