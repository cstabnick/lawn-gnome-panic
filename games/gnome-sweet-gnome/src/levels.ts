// The level list: 60 hand-designed levels (1-30 Mossy Lane, 31-45 Oakwood Treehouse, 46-60 Shell Cove). Each introduces one mechanic at a time and follows a sawtooth
// difficulty: hard every 5th level, super hard every 10th, and a breather right after each hard one.
// Move counts and stars are first guesses; `npm run assess -w games/gnome-sweet-gnome` checks levels against `target`.
import { TILE_KINDS } from './engine/types';
import type { LevelDef, TileKind } from './engine/types';
import { LEVEL_TUNING, type LevelTuning } from './levelTuning';

/** Intended smart-bot win rate for level id: a sawtooth that gets harder, hard every 5th, a breather after. */
export function targetFor(id: number): number {
  if (id <= 3) return 0.97;
  if (id % 10 === 0) return 0.4;
  if (id % 5 === 0) return 0.5;
  // Past level 30 (the new homes) the curve restarts a little easier and levels off instead of sinking forever.
  const base = id <= 30 ? 0.93 - 0.011 * (id - 3) : Math.max(0.62, 0.8 - 0.006 * (id - 31));
  if (id % 5 === 1) return Math.min(0.95, base + 0.08);
  return Math.round(base * 100) / 100;
}

/** Placeholder stars: moves * 60 / 120 / 190, rounded to 50. Replaced by tuning. */
function starsFor(moves: number): [number, number, number] {
  const r = (x: number) => Math.round(x / 50) * 50;
  return [r(moves * 60), r(moves * 120), r(moves * 190)];
}

/** The hand-designed levels, before tuning. scripts/tune-levels.mjs tunes these. */
export const BASE_LEVELS: LevelDef[] = [
  // 1-3: plain boards, one collect goal each.
  { id: 1, name: 'Front Path', moves: 20, kinds: 5, goals: [{ type: 'collect', kind: 'mushroom', count: 15 }], stars: starsFor(20), target: targetFor(1) },
  { id: 2, name: 'Gravel Walk', moves: 21, kinds: 5, goals: [{ type: 'collect', kind: 'gem', count: 18 }], stars: starsFor(21), target: targetFor(2) },
  { id: 3, name: 'Daisy Border', moves: 20, kinds: 5, goals: [{ type: 'collect', kind: 'daisy', count: 20 }], stars: starsFor(20), target: targetFor(3) },

  // 4-6: weeds. Level 4 has a small patch; 5 is hard (scattered weeds, fewer moves); 6 is the breather with W.
  {
    id: 4, name: 'Weedy Patch', moves: 22, kinds: 5, goals: [{ type: 'weeds' }],
    layout: ['........', '........', '........', '..wwww..', '..wwww..', '........', '........', '........'],
    stars: starsFor(22), target: targetFor(4),
  },
  {
    id: 5, name: 'Toadstool Lane', moves: 19, kinds: 5, goals: [{ type: 'weeds' }],
    layout: ['........', '.w....w.', '........', '..w..w..', '.w.ww.w.', '........', '........', '........'],
    stars: starsFor(19), target: targetFor(5),
  },
  {
    id: 6, name: 'Dandelion Bend', moves: 22, kinds: 5, goals: [{ type: 'weeds' }],
    layout: ['........', '........', '..W..W..', '........', '........', '.w.WW.w.', '........', '........'],
    stars: starsFor(22), target: targetFor(6),
  },

  // 7-9: stones. Stones sit in the lower half in small clusters; 9 adds S (two layers).
  {
    id: 7, name: 'Stony Bed', moves: 25, kinds: 5, goals: [{ type: 'stones' }],
    layout: ['........', '........', '........', '........', '........', '..sss...', '........', '........'],
    stars: starsFor(25), target: targetFor(7),
  },
  {
    id: 8, name: 'Pebble Path', moves: 28, kinds: 5, goals: [{ type: 'stones' }],
    layout: ['........', '........', '........', '........', '........', '.ss..s..', '..s.....', '........'],
    stars: starsFor(28), target: targetFor(8),
  },
  {
    id: 9, name: 'Sunken Stones', moves: 28, kinds: 5, goals: [{ type: 'stones' }],
    layout: ['........', '........', '........', '........', '........', '.SS..s..', '.....S..', '........'],
    stars: starsFor(28), target: targetFor(9),
  },

  // 10: super hard. Weeds and a collect goal together.
  {
    id: 10, name: 'The Rockery', moves: 22, kinds: 5,
    goals: [{ type: 'weeds' }, { type: 'collect', kind: 'acorn', count: 18 }],
    layout: ['........', '.w....w.', '........', '..W..W..', '........', '.w..w...', '........', '...ww...'],
    stars: starsFor(22), target: targetFor(10),
  },

  // 11-14: lost gnomes (top two rows, nothing holed or stoned below them).
  {
    id: 11, name: 'Lost Gnome Hollow', moves: 25, kinds: 5, goals: [{ type: 'gnomes' }],
    layout: ['...g....', '........', '........', '........', '........', '........', '........', '........'],
    stars: starsFor(25), target: targetFor(11),
  },
  {
    id: 12, name: 'Wayward Gnome', moves: 28, kinds: 5, goals: [{ type: 'gnomes' }],
    layout: ['.g......', '......g.', '........', '........', '........', '........', '........', '........'],
    stars: starsFor(28), target: targetFor(12),
  },
  {
    id: 13, name: 'Hedge Gnomes', moves: 31, kinds: 5, goals: [{ type: 'gnomes' }],
    layout: ['g...g...', '.......g', '........', '........', '........', '........', '........', '........'],
    stars: starsFor(31), target: targetFor(13),
  },
  {
    id: 14, name: 'Gnome Crossing', moves: 28, kinds: 5, goals: [{ type: 'gnomes' }],
    layout: ['..g.....', '.....g..', '........', '........', '........', '........', '........', '........'],
    stars: starsFor(28), target: targetFor(14),
  },

  // 15: hard. Gnomes and weeds.
  {
    id: 15, name: 'Thistle Gnomes', moves: 23, kinds: 5,
    goals: [{ type: 'gnomes' }, { type: 'weeds' }],
    layout: ['.g......', '......g.', '........', '..w..w..', '.ww..ww.', '........', '........', '........'],
    stars: starsFor(23), target: targetFor(15),
  },

  // 16-19: holes for board shapes, each with one other goal.
  {
    id: 16, name: 'Heart Bed', moves: 26, kinds: 5,
    goals: [{ type: 'collect', kind: 'acorn', count: 20 }],
    layout: ['#..##..#', '........', '........', '#......#', '##....##', '###..###', '###..###', '####.###'],
    stars: starsFor(26), target: targetFor(16),
  },
  {
    id: 17, name: 'Hourglass Hedge', moves: 24, kinds: 6, goals: [{ type: 'weeds' }],
    layout: ['..w..w..', '#......#', '##....##', '###..###', '###..###', '##....##', '#......#', '.ww..ww.'],
    stars: starsFor(24), target: targetFor(17),
  },
  {
    id: 18, name: 'Plus Patch', moves: 26, kinds: 6, goals: [{ type: 'stones' }],
    layout: ['##....##', '##....##', '........', '........', '........', '..s..s..', '##.ss.##', '##....##'],
    stars: starsFor(26), target: targetFor(18),
  },
  {
    id: 19, name: 'Round Bed', moves: 25, kinds: 6, goals: [{ type: 'weeds' }],
    layout: ['w......w', '.w....w.', '..####..', '..####..', '..####..', '..####..', '.w....w.', 'w......w'],
    stars: starsFor(25), target: targetFor(19),
  },

  // 20: super hard. Stones and a collect goal on a shaped board.
  {
    id: 20, name: 'Stony Hourglass', moves: 21, kinds: 6,
    goals: [{ type: 'stones' }, { type: 'collect', kind: 'clover', count: 18 }],
    layout: ['........', '#......#', '##....##', '###..###', '###..###', '##s..s##', '#..SS..#', '........'],
    stars: starsFor(21), target: targetFor(20),
  },

  // 21-29: mixes of two goals. W and S are common; 6 kinds on 22 and 27 only.
  {
    id: 21, name: 'Clover Field', moves: 26, kinds: 5,
    goals: [{ type: 'collect', kind: 'clover', count: 20 }, { type: 'weeds' }],
    layout: ['........', '........', '..W..W..', '........', '........', '.W....W.', '........', '........'],
    stars: starsFor(26), target: targetFor(21),
  },
  {
    id: 22, name: 'Stony Hollow', moves: 32, kinds: 5,
    goals: [{ type: 'stones' }, { type: 'gnomes' }],
    layout: ['..g.....', '.....g..', '........', '........', '...SS...', '.s.....s', '........', '........'],
    stars: starsFor(32), target: targetFor(22),
  },
  {
    id: 23, name: 'Pebble Walk', moves: 30, kinds: 6,
    goals: [{ type: 'stones' }, { type: 'collect', kind: 'acorn', count: 20 }],
    layout: ['........', '........', '........', '........', '........', '..S..s..', '.s....S.', '........'],
    stars: starsFor(30), target: targetFor(23),
  },
  {
    id: 24, name: 'Gnome Gap', moves: 28, kinds: 5,
    goals: [{ type: 'gnomes' }, { type: 'weeds' }],
    layout: ['g.......', '.....g..', '........', '..WW..WW', '........', '.w....w.', '........', '........'],
    stars: starsFor(28), target: targetFor(24),
  },
  {
    id: 25, name: 'Plus Quarry', moves: 24, kinds: 6,
    goals: [{ type: 'stones' }, { type: 'collect', kind: 'clover', count: 16 }],
    layout: ['##....##', '##....##', '........', '........', '..S..s..', '.ss..S..', '##....##', '##....##'],
    stars: starsFor(24), target: targetFor(25),
  },
  {
    id: 26, name: 'Breezy Gnome', moves: 28, kinds: 5,
    goals: [{ type: 'weeds' }, { type: 'gnomes' }],
    layout: ['.......g', '........', '..w..w..', '........', '........', 'w.....w.', '........', '...W....'],
    stars: starsFor(28), target: targetFor(26),
  },
  {
    id: 27, name: 'Berry Patch', moves: 28, kinds: 6,
    goals: [{ type: 'collect', kind: 'berry', count: 18 }, { type: 'stones' }],
    layout: ['........', '........', '........', '........', '...ss...', '..SS.s..', '........', '........'],
    stars: starsFor(28), target: targetFor(27),
  },
  {
    id: 28, name: 'Mossy Gnomes', moves: 30, kinds: 5,
    goals: [{ type: 'gnomes' }, { type: 'collect', kind: 'gem', count: 20 }],
    layout: ['g..g....', '......g.', '........', '........', '........', '........', '........', '........'],
    stars: starsFor(30), target: targetFor(28),
  },
  {
    id: 29, name: 'Overgrown Stones', moves: 30, kinds: 6,
    goals: [{ type: 'weeds' }, { type: 'stones' }],
    layout: ['........', '.W....W.', '........', '........', '........', '..SS.s..', '.s.....S', '........'],
    stars: starsFor(30), target: targetFor(29),
  },

  // 30: super hard finale. Weeds, stones and gnomes on the plus shape. Gnomes sit in columns 3 and 4, which
  // have no holes or stones below them.
  {
    id: 30, name: 'The Grand Lawn', moves: 26, kinds: 5,
    goals: [{ type: 'weeds' }, { type: 'stones' }, { type: 'gnomes' }],
    layout: ['##.g..##', '##..g.##', '..w..w..', '..ww.ww.', '..s..s..', '.s....s.', '##....##', '##....##'],
    stars: starsFor(26), target: targetFor(30),
  },

  // ---- Oakwood Treehouse (31-45). Narrow trunk shapes, weeds up in the branches, gnomes stuck in the canopy. ----
  {
    id: 31, name: 'Low Branch', moves: 24, kinds: 5, goals: [{ type: 'collect', kind: 'acorn', count: 24 }],
    layout: ['#......#', '........', '........', '........', '........', '........', '........', '#......#'],
    stars: starsFor(24), target: targetFor(31),
  },
  {
    id: 32, name: 'Rope Swing', moves: 26, kinds: 5, goals: [{ type: 'weeds' }],
    layout: ['.w....w.', '..w..w..', '........', '........', '........', '........', '..w..w..', '.w....w.'],
    stars: starsFor(26), target: targetFor(32),
  },
  {
    id: 33, name: 'Knotty Trunk', moves: 26, kinds: 5, goals: [{ type: 'stones' }],
    layout: ['##....##', '##....##', '##....##', '#......#', '........', '..s..s..', '.s.ss.s.', '........'],
    stars: starsFor(26), target: targetFor(33),
  },
  {
    id: 34, name: 'Canopy Gnome', moves: 27, kinds: 5, goals: [{ type: 'gnomes' }, { type: 'weeds' }],
    layout: ['...g....', '........', 'w......w', '.w....w.', '........', '........', '........', '........'],
    stars: starsFor(27), target: targetFor(34),
  },
  {
    id: 35, name: 'Woodpecker Holes', moves: 24, kinds: 6, goals: [{ type: 'stones' }, { type: 'weeds' }],
    layout: ['..w..w..', '.#....#.', '........', '..S..S..', '.#....#.', '..s..s..', '........', '.w....w.'],
    stars: starsFor(24), target: targetFor(35),
  },
  {
    id: 36, name: 'Leafy Landing', moves: 26, kinds: 5, goals: [{ type: 'collect', kind: 'clover', count: 24 }],
    layout: ['........', '........', '........', '...ww...', '...ww...', '........', '........', '........'],
    stars: starsFor(26), target: targetFor(36),
  },
  {
    id: 37, name: 'Hollow Log', moves: 28, kinds: 5, goals: [{ type: 'weeds' }],
    layout: ['........', '.WWWWWW.', '.W####W.', '.W####W.', '.W####W.', '.WWWWWW.', '........', '........'],
    stars: starsFor(28), target: targetFor(37),
  },
  {
    id: 38, name: 'Twig Gnomes', moves: 28, kinds: 5, goals: [{ type: 'gnomes' }],
    layout: ['..g..g..', '...gg...', '........', '#......#', '##....##', '........', '........', '........'],
    stars: starsFor(28), target: targetFor(38),
  },
  {
    id: 39, name: 'Sap Stones', moves: 28, kinds: 6, goals: [{ type: 'stones' }],
    layout: ['........', '........', '........', '.S....S.', '..S..S..', '...SS...', '........', '........'],
    stars: starsFor(28), target: targetFor(39),
  },
  {
    id: 40, name: 'The Crow\'s Nest', moves: 24, kinds: 6,
    goals: [{ type: 'gnomes' }, { type: 'stones' }, { type: 'weeds' }],
    layout: ['..g..g..', '........', '.W....W.', '#.w..w.#', '##....##', '#s....s#', '.S....S.', '........'],
    stars: starsFor(24), target: targetFor(40),
  },
  {
    id: 41, name: 'Squirrel Stash', moves: 26, kinds: 5, goals: [{ type: 'collect', kind: 'acorn', count: 26 }],
    layout: ['........', '........', '..#..#..', '........', '........', '..#..#..', '........', '........'],
    stars: starsFor(26), target: targetFor(41),
  },
  {
    id: 42, name: 'Mossy Rungs', moves: 28, kinds: 5, goals: [{ type: 'weeds' }, { type: 'stones' }],
    layout: ['ww....ww', '........', 'WW....WW', '........', 'ww....ww', '........', '..s..s..', '...ss...'],
    stars: starsFor(28), target: targetFor(42),
  },
  {
    id: 43, name: 'Owl Hollow', moves: 28, kinds: 6, goals: [{ type: 'gnomes' }, { type: 'collect', kind: 'berry', count: 18 }],
    layout: ['..g..g..', '........', '........', '#......#', '##....##', '........', '........', '........'],
    stars: starsFor(28), target: targetFor(43),
  },
  {
    id: 44, name: 'Splinter Deck', moves: 28, kinds: 6, goals: [{ type: 'stones' }, { type: 'weeds' }],
    layout: ['........', '.w.ww.w.', '........', '........', '#S....S#', '#s.SS.s#', '........', '........'],
    stars: starsFor(28), target: targetFor(44),
  },
  {
    id: 45, name: 'Storm in the Oak', moves: 24, kinds: 6,
    goals: [{ type: 'weeds' }, { type: 'gnomes' }],
    layout: ['g......g', '........', '.WW..WW.', '........', 'W.W..W.W', '........', '........', '........'],
    stars: starsFor(24), target: targetFor(45),
  },

  // ---- Shell Cove (46-60). Wide "tide" holes, stones as barnacled rocks, gnomes washed out to sea. ----
  {
    id: 46, name: 'Low Tide', moves: 26, kinds: 5, goals: [{ type: 'collect', kind: 'gem', count: 24 }],
    layout: ['........', '........', '........', '........', '........', '........', '#......#', '##....##'],
    stars: starsFor(26), target: targetFor(46),
  },
  {
    id: 47, name: 'Seaweed Shore', moves: 27, kinds: 5, goals: [{ type: 'weeds' }],
    layout: ['........', '........', '........', '........', 'ww....ww', 'wwW..Www', '........', '........'],
    stars: starsFor(27), target: targetFor(47),
  },
  {
    id: 48, name: 'Barnacle Rocks', moves: 28, kinds: 5, goals: [{ type: 'stones' }],
    layout: ['........', '........', '........', '........', 's......s', 'Ss....sS', '.S....S.', '........'],
    stars: starsFor(28), target: targetFor(48),
  },
  {
    id: 49, name: 'Castaway Gnomes', moves: 28, kinds: 5, goals: [{ type: 'gnomes' }],
    layout: ['..gg.g..', '........', '........', '........', '........', '#......#', '#......#', '##....##'],
    stars: starsFor(28), target: targetFor(49),
  },
  {
    id: 50, name: 'Shipwreck Reef', moves: 24, kinds: 6,
    goals: [{ type: 'stones' }, { type: 'weeds' }, { type: 'collect', kind: 'daisy', count: 16 }],
    layout: ['........', '.W....W.', '........', '#.SSSS.#', '##....##', '#.w..w.#', '..s..s..', '........'],
    stars: starsFor(24), target: targetFor(50),
  },
  {
    id: 51, name: 'Paddling Pool', moves: 26, kinds: 5, goals: [{ type: 'collect', kind: 'daisy', count: 24 }],
    layout: ['........', '........', '..####..', '..####..', '........', '........', '........', '........'],
    stars: starsFor(26), target: targetFor(51),
  },
  {
    id: 52, name: 'Kelp Forest', moves: 28, kinds: 5, goals: [{ type: 'weeds' }],
    layout: ['.W.W.W.W', '........', 'W.W.W.W.', '........', '.w.w.w.w', '........', '........', '........'],
    stars: starsFor(28), target: targetFor(52),
  },
  {
    id: 53, name: 'Lighthouse Rock', moves: 28, kinds: 6, goals: [{ type: 'stones' }, { type: 'gnomes' }],
    layout: ['...g....', '....g...', '........', '........', '........', 'ss....ss', 'sS....Ss', '........'],
    stars: starsFor(28), target: targetFor(53),
  },
  {
    id: 54, name: 'Crab Cove', moves: 28, kinds: 6, goals: [{ type: 'weeds' }, { type: 'collect', kind: 'berry', count: 18 }],
    layout: ['##....##', '#......#', '........', '.w.WW.w.', '.w....w.', '........', '#......#', '##....##'],
    stars: starsFor(28), target: targetFor(54),
  },
  {
    id: 55, name: 'Riptide', moves: 24, kinds: 6, goals: [{ type: 'gnomes' }, { type: 'stones' }],
    layout: ['...gg...', '........', '........', '#.s..s.#', '##....##', '#.S..S.#', '........', '........'],
    stars: starsFor(24), target: targetFor(55),
  },
  {
    id: 56, name: 'Sandcastle', moves: 26, kinds: 5, goals: [{ type: 'collect', kind: 'clover', count: 24 }, { type: 'stones' }],
    layout: ['........', '........', '........', '........', '..s..s..', '.ssssss.', '........', '........'],
    stars: starsFor(26), target: targetFor(56),
  },
  {
    id: 57, name: 'Tide Pools', moves: 28, kinds: 5, goals: [{ type: 'weeds' }, { type: 'stones' }],
    layout: ['........', '.##..##.', '.#w..w#.', '........', '........', '.#S..S#.', '.##..##.', '........'],
    stars: starsFor(28), target: targetFor(57),
  },
  {
    id: 58, name: 'Message in a Bottle', moves: 28, kinds: 6, goals: [{ type: 'gnomes' }, { type: 'weeds' }],
    layout: ['g......g', '........', '........', '..W..W..', '.w....w.', '........', '........', '........'],
    stars: starsFor(28), target: targetFor(58),
  },
  {
    id: 59, name: 'Coral Garden', moves: 28, kinds: 6, goals: [{ type: 'stones' }, { type: 'collect', kind: 'mushroom', count: 20 }],
    layout: ['........', '........', '........', '.S....S.', '..s..s..', '.S.SS.S.', '........', '........'],
    stars: starsFor(28), target: targetFor(59),
  },
  {
    id: 60, name: 'The Great Wave', moves: 24, kinds: 6,
    goals: [{ type: 'weeds' }, { type: 'stones' }, { type: 'gnomes' }],
    layout: ['...gg...', '........', '.W....W.', '#.w..w.#', '##....##', '#.s..s.#', '.S....S.', '........'],
    stars: starsFor(24), target: targetFor(60),
  },
];

/** Apply measured tuning (moves, collect goal size, star scores) on top of a hand-designed level. */
export function applyTuning(level: LevelDef, t: LevelTuning | undefined): LevelDef {
  if (!t) return level;
  const goals = level.goals.map((g) => ({ ...g }));
  if (t.collect) {
    const kind = t.collect.kind as TileKind;
    const g = goals.find((x) => x.type === 'collect' && x.kind === kind);
    if (g && g.type === 'collect') g.count = t.collect.count;
    else if (t.collect.count > 0) goals.push({ type: 'collect', kind, count: t.collect.count });
  }
  return { ...level, moves: t.moves, goals: goals.filter((g) => g.type !== 'collect' || g.count > 0), stars: t.stars };
}

/** The levels the game plays: BASE_LEVELS with LEVEL_TUNING applied. */
export const LEVELS: LevelDef[] = BASE_LEVELS.map((l) => applyTuning(l, LEVEL_TUNING[l.id]));

const CELL_CHARS = '.#wWsSg';

/** Readable problems with a level list. An empty array means the list is valid. */
export function validateLevels(levels: LevelDef[] = LEVELS): string[] {
  const problems: string[] = [];
  levels.forEach((lv, i) => {
    const where = `level ${lv.id} (${lv.name})`;
    if (lv.id !== i + 1) problems.push(`${where}: id should be ${i + 1}`);
    if (!Number.isInteger(lv.moves) || lv.moves < 1) problems.push(`${where}: moves must be a positive integer`);
    if (!Number.isInteger(lv.kinds) || lv.kinds < 3 || lv.kinds > 6) problems.push(`${where}: kinds must be 3..6, got ${lv.kinds}`);
    if (lv.target !== targetFor(lv.id)) problems.push(`${where}: target ${lv.target} is not targetFor(${lv.id}) = ${targetFor(lv.id)}`);
    const [s1, s2, s3] = lv.stars;
    if (!(s1 < s2 && s2 < s3)) problems.push(`${where}: stars must increase, got ${lv.stars.join(', ')}`);
    if (lv.goals.length === 0) problems.push(`${where}: no goals`);

    const rows = lv.layout ?? Array.from({ length: 8 }, () => '.'.repeat(8));
    if (rows.length !== 8 || rows.some((row) => row.length !== 8)) {
      problems.push(`${where}: layout must be 8 strings of length 8`);
      return;
    }
    const unknown = [...new Set(rows.join('').split('').filter((ch) => !CELL_CHARS.includes(ch)))];
    if (unknown.length > 0) {
      problems.push(`${where}: unknown layout characters ${unknown.join(' ')}`);
      return;
    }
    const has = (chars: string) => rows.some((row) => [...row].some((ch) => chars.includes(ch)));

    for (const goal of lv.goals) {
      if (goal.type === 'weeds' && !has('wW')) problems.push(`${where}: weeds goal but no w/W in layout`);
      if (goal.type === 'stones' && !has('sS')) problems.push(`${where}: stones goal but no s/S in layout`);
      if (goal.type === 'gnomes' && !has('g')) problems.push(`${where}: gnomes goal but no g in layout`);
      if (goal.type === 'collect') {
        const index = TILE_KINDS.indexOf(goal.kind);
        if (index < 0 || index >= lv.kinds) {
          problems.push(`${where}: collect ${goal.kind} is not among the first ${lv.kinds} kinds`);
        }
        if (goal.count < 1) problems.push(`${where}: collect ${goal.kind} count must be at least 1`);
      }
    }

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (rows[r][c] !== 'g') continue;
        for (let below = r + 1; below < 8; below++) {
          if ('#sS'.includes(rows[below][c])) {
            problems.push(`${where}: gnome at row ${r} col ${c} has a hole or stone below it`);
            break;
          }
        }
      }
    }
  });
  return problems;
}
