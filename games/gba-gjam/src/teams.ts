import { GNORMAN_LOOK, getMyGnome, type GnomeLook } from '@lawn/gnome';
import { readSave, writeSave } from './save';
import type { CareerStats, CustomGnomeData, GnomePlayerProfile, PlayerBoxScore, ProTeam } from './types';

export const CUSTOM_STAT_BUDGET = 180;
export const STAT_MIN = 0;
export const STAT_MAX = 100;
export const POINTS_PER_GAME = 3;
export const POINTS_PER_WIN_BONUS = 2;
export const POINTS_PER_TOURNAMENT_WIN = 20;

function makeLook(
  hat: number,
  shirt: number,
  pants: number,
  skin: number,
  beard: number | null,
  opts: Partial<GnomeLook> = {},
): GnomeLook {
  return {
    ...GNORMAN_LOOK,
    hat,
    shirt,
    pants,
    skin,
    boots: 0x1e1e24,
    beard,
    hair: null,
    freckles: false,
    dress: false,
    glasses: false,
    ...opts,
  };
}

export const PRO_TEAMS: readonly ProTeam[] = [
  {
    id: 'mossbottom',
    city: 'Mossbottom',
    name: 'Mowers',
    abbr: 'MOS',
    primary: 0x228b22,
    secondary: 0xf4c430,
    primaryHex: '#228b22',
    secondaryHex: '#f4c430',
    emblem: '🌿',
    motto: 'Cut Down the Net!',
    roster: [
      {
        id: 'mos-1', name: 'Bramble Stoutpot', nickname: 'THE BLADE', number: 34,
        look: makeLook(0x228b22, 0x228b22, 0xf4c430, 0xf1c27d, 0xf4f4f4),
        stats: { speed: 60, threePt: 50, dunk: 90, defense: 80 },
      },
      {
        id: 'mos-2', name: 'Clover Clayfoot', nickname: 'FOUR-LEAF', number: 11,
        look: makeLook(0xf4c430, 0x228b22, 0x1f5f1f, 0xe0ac69, null, { hair: { color: 0x6b3e26, style: 'pigtails' }, freckles: true }),
        stats: { speed: 90, threePt: 80, dunk: 50, defense: 60 },
      },
      {
        id: 'mos-3', name: 'Thistle Turf', nickname: 'SODBUSTER', number: 21,
        look: makeLook(0x228b22, 0x1b6e1b, 0xf4c430, 0xc68642, 0x3b2a1a, { glasses: true }),
        stats: { speed: 70, threePt: 70, dunk: 70, defense: 70 },
      },
    ],
  },
  {
    id: 'redcap',
    city: 'Redcap',
    name: 'Rockets',
    abbr: 'RED',
    primary: 0xd92b2b,
    secondary: 0xf5f5f5,
    primaryHex: '#d92b2b',
    secondaryHex: '#f5f5f5',
    emblem: '🚀',
    motto: 'Ignition From Downtown!',
    roster: [
      {
        id: 'red-1', name: 'Poppy Ashbell', nickname: 'SKYHOOK', number: 7,
        look: makeLook(0xd92b2b, 0xd92b2b, 0xf5f5f5, 0xffdbac, null, { hair: { color: 0x222222, style: 'pigtails' } }),
        stats: { speed: 80, threePt: 90, dunk: 60, defense: 50 },
      },
      {
        id: 'red-2', name: 'Sorrel Brick', nickname: 'RIM BREAKER', number: 55,
        look: makeLook(0xd92b2b, 0xb81f1f, 0x222222, 0x8d5524, 0xe8e8e8),
        stats: { speed: 60, threePt: 40, dunk: 90, defense: 90 },
      },
      {
        id: 'red-3', name: 'Tansy Potsworth', nickname: 'CLUTCH', number: 23,
        look: makeLook(0xf5f5f5, 0xd92b2b, 0xd92b2b, 0xf1c27d, 0x7c4a26, { glasses: true }),
        stats: { speed: 70, threePt: 80, dunk: 70, defense: 60 },
      },
    ],
  },
  {
    id: 'thatchford',
    city: 'Thatchford',
    name: 'Thunder',
    abbr: 'THA',
    primary: 0x1e64d8,
    secondary: 0xffd21f,
    primaryHex: '#1e64d8',
    secondaryHex: '#ffd21f',
    emblem: '⚡',
    motto: 'High Voltage Jams!',
    roster: [
      {
        id: 'tha-1', name: 'Fernwick Bolts', nickname: 'AIR FERN', number: 1,
        look: makeLook(0x1e64d8, 0x1e64d8, 0xffd21f, 0xe0ac69, 0xf4f4f4),
        stats: { speed: 90, threePt: 60, dunk: 90, defense: 50 },
      },
      {
        id: 'tha-2', name: 'Lichen Sparks', nickname: 'STATIC', number: 14,
        look: makeLook(0xffd21f, 0x1e64d8, 0x163f8a, 0xf1c27d, null, { hair: { color: 0xf4c430, style: 'pigtails' }, freckles: true }),
        stats: { speed: 80, threePt: 90, dunk: 40, defense: 70 },
      },
      {
        id: 'tha-3', name: 'Sedge Glaze', nickname: 'THE WALL', number: 42,
        look: makeLook(0x1e64d8, 0x163f8a, 0xffd21f, 0xc68642, 0x2c2c34),
        stats: { speed: 50, threePt: 50, dunk: 80, defense: 90 },
      },
    ],
  },
  {
    id: 'acorn',
    city: 'Acorn Alley',
    name: 'Alphas',
    abbr: 'ACO',
    primary: 0xe6681c,
    secondary: 0x4b2e19,
    primaryHex: '#e6681c',
    secondaryHex: '#4b2e19',
    emblem: '🌰',
    motto: 'Crack the Backboard!',
    roster: [
      {
        id: 'aco-1', name: 'Oakley Nutkin', nickname: 'OAK TREE', number: 33,
        look: makeLook(0xe6681c, 0x4b2e19, 0xe6681c, 0x8d5524, 0xd8c3a5),
        stats: { speed: 50, threePt: 50, dunk: 90, defense: 90 },
      },
      {
        id: 'aco-2', name: 'Hazel Scone', nickname: 'SWEET SHOT', number: 8,
        look: makeLook(0x4b2e19, 0xe6681c, 0x4b2e19, 0xf1c27d, null, { hair: { color: 0x8b4513, style: 'pigtails' }, glasses: true }),
        stats: { speed: 80, threePt: 90, dunk: 50, defense: 60 },
      },
      {
        id: 'aco-3', name: 'Alder Crumb', nickname: 'PICKPOCKET', number: 4,
        look: makeLook(0xe6681c, 0xe6681c, 0x4b2e19, 0xe0ac69, 0x5c3a21),
        stats: { speed: 90, threePt: 60, dunk: 60, defense: 80 },
      },
    ],
  },
  {
    id: 'dewdrop',
    city: 'Dewdrop',
    name: 'Dynamos',
    abbr: 'DEW',
    primary: 0x0e9aa7,
    secondary: 0xdce6ed,
    primaryHex: '#0e9aa7',
    secondaryHex: '#dce6ed',
    emblem: '💧',
    motto: 'Splash Zone Certified!',
    roster: [
      {
        id: 'dew-1', name: 'Reed Splash', nickname: 'WET JUMPER', number: 30,
        look: makeLook(0x0e9aa7, 0x0e9aa7, 0xdce6ed, 0xffdbac, 0xc8d2da),
        stats: { speed: 70, threePt: 90, dunk: 70, defense: 50 },
      },
      {
        id: 'dew-2', name: 'Mallow Puddle', nickname: 'SLIPSTREAM', number: 2,
        look: makeLook(0xdce6ed, 0x0e9aa7, 0x0a6c75, 0xc68642, null, { hair: { color: 0x1a1a22, style: 'pigtails' } }),
        stats: { speed: 90, threePt: 60, dunk: 60, defense: 80 },
      },
      {
        id: 'dew-3', name: 'Willow Mist', nickname: 'DRIFT', number: 15,
        look: makeLook(0x0e9aa7, 0x0a6c75, 0xdce6ed, 0xf1c27d, 0xeaeaea, { glasses: true }),
        stats: { speed: 70, threePt: 70, dunk: 70, defense: 70 },
      },
    ],
  },
  {
    id: 'pebblebrook',
    city: 'Pebblebrook',
    name: 'Pistons',
    abbr: 'PEB',
    primary: 0x7b3fe4,
    secondary: 0xffc83d,
    primaryHex: '#7b3fe4',
    secondaryHex: '#ffc83d',
    emblem: '🪨',
    motto: 'Hardwood & Granite!',
    roster: [
      {
        id: 'peb-1', name: 'Flint Cobble', nickname: 'BEDROCK', number: 50,
        look: makeLook(0x7b3fe4, 0x7b3fe4, 0xffc83d, 0xe0ac69, 0x44444d),
        stats: { speed: 50, threePt: 40, dunk: 90, defense: 90 },
      },
      {
        id: 'peb-2', name: 'Heather Slate', nickname: 'ARC QUEEN', number: 12,
        look: makeLook(0xffc83d, 0x7b3fe4, 0x4e2499, 0xffdbac, null, { hair: { color: 0xaa4422, style: 'pigtails' }, freckles: true }),
        stats: { speed: 80, threePt: 90, dunk: 50, defense: 60 },
      },
      {
        id: 'peb-3', name: 'Gorse Quarry', nickname: 'HAMMER', number: 9,
        look: makeLook(0x7b3fe4, 0x4e2499, 0xffc83d, 0x8d5524, 0xf0f0f0),
        stats: { speed: 70, threePt: 50, dunk: 80, defense: 80 },
      },
    ],
  },
  {
    id: 'bramble',
    city: 'Bramble Bush',
    name: 'Ballers',
    abbr: 'BRM',
    primary: 0xc82376,
    secondary: 0x1e1e26,
    primaryHex: '#c82376',
    secondaryHex: '#1e1e26',
    emblem: '🫐',
    motto: 'No Easy Buckets!',
    roster: [
      {
        id: 'brm-1', name: 'Brier Thorns', nickname: 'LOCKDOWN', number: 91,
        look: makeLook(0xc82376, 0x1e1e26, 0xc82376, 0xc68642, 0x222228),
        stats: { speed: 70, threePt: 50, dunk: 80, defense: 90 },
      },
      {
        id: 'brm-2', name: 'Nettle Sting', nickname: 'DAGGER', number: 5,
        look: makeLook(0x1e1e26, 0xc82376, 0x1e1e26, 0xf1c27d, null, { hair: { color: 0x3a1f2d, style: 'pigtails' } }),
        stats: { speed: 90, threePt: 80, dunk: 60, defense: 60 },
      },
      {
        id: 'brm-3', name: 'Yarrow Snap', nickname: 'SWISH', number: 20,
        look: makeLook(0xc82376, 0xc82376, 0x1e1e26, 0xffdbac, 0xd4c0a1, { glasses: true }),
        stats: { speed: 60, threePt: 80, dunk: 70, defense: 70 },
      },
    ],
  },
  {
    id: 'sunpatch',
    city: 'Sunpatch',
    name: 'Suns',
    abbr: 'SUN',
    primary: 0xf5a623,
    secondary: 0xb83b1e,
    primaryHex: '#f5a623',
    secondaryHex: '#b83b1e',
    emblem: '☀️',
    motto: 'Always On Fire!',
    roster: [
      {
        id: 'sun-1', name: 'Marigold Blaze', nickname: 'SOLAR FLARE', number: 13,
        look: makeLook(0xf5a623, 0xb83b1e, 0xf5a623, 0xe0ac69, 0xfff0c2),
        stats: { speed: 80, threePt: 90, dunk: 80, defense: 40 },
      },
      {
        id: 'sun-2', name: 'Dandelion Drift', nickname: 'FLOATER', number: 3,
        look: makeLook(0xb83b1e, 0xf5a623, 0xb83b1e, 0xffdbac, null, { hair: { color: 0xffe066, style: 'pigtails' }, freckles: true }),
        stats: { speed: 90, threePt: 80, dunk: 50, defense: 60 },
      },
      {
        id: 'sun-3', name: 'Gourd Scorch', nickname: 'INFERNO', number: 44,
        look: makeLook(0xf5a623, 0xf5a623, 0xb83b1e, 0x8d5524, 0x3b2214),
        stats: { speed: 60, threePt: 50, dunk: 90, defense: 80 },
      },
    ],
  },
];

export function getTeamById(id: string): ProTeam {
  return PRO_TEAMS.find((t) => t.id === id) ?? PRO_TEAMS[0];
}

export function emptyCareerStats(): CareerStats {
  return { pts: 0, fgm: 0, fga: 0, tpm: 0, tpa: 0, dunks: 0, steals: 0, blocks: 0, rebounds: 0 };
}

export function defaultCustomGnome(): CustomGnomeData {
  const mine = getMyGnome();
  const baseLook: GnomeLook = mine?.look
    ? { ...mine.look }
    : { ...GNORMAN_LOOK, hat: 0xd93636, shirt: 0x2f64c9, pants: 0x222230 };
  return {
    name: mine?.name || 'My Gnome',
    nickname: 'ROOKIE',
    number: 99,
    look: baseLook,
    stats: { speed: 45, threePt: 45, dunk: 45, defense: 45 },
    progression: {
      gamesPlayed: 0,
      wins: 0,
      tournamentWins: 0,
      bonusPoints: 0,
      career: emptyCareerStats(),
    },
  };
}

export function getProgressionTier(totalBudget: number): { label: string; color: string } {
  if (totalBudget >= 300) return { label: '🔥 GBA LEGEND', color: '#ffd21f' };
  if (totalBudget >= 240) return { label: '⭐ PRO LEVEL', color: '#44ff88' };
  return { label: '🌱 ROOKIE', color: '#8fd3ff' };
}

export function getTotalStatBudget(data: CustomGnomeData): number {
  return CUSTOM_STAT_BUDGET + (data.progression?.bonusPoints ?? 0);
}

export function getUsedStatPoints(data: CustomGnomeData): number {
  return data.stats.speed + data.stats.threePt + data.stats.dunk + data.stats.defense;
}

export function getRemainingStatPoints(data: CustomGnomeData): number {
  return Math.max(0, getTotalStatBudget(data) - getUsedStatPoints(data));
}

export function awardMatchProgression(
  data: CustomGnomeData,
  opts: { won: boolean; tournamentWon?: boolean; box?: PlayerBoxScore },
): { earned: number; gamePoints: number; winPoints: number; tournamentPoints: number } {
  const gamePoints = POINTS_PER_GAME;
  const winPoints = opts.won ? POINTS_PER_WIN_BONUS : 0;
  const tournamentPoints = opts.tournamentWon ? POINTS_PER_TOURNAMENT_WIN : 0;
  const earned = gamePoints + winPoints + tournamentPoints;

  data.progression.gamesPlayed += 1;
  if (opts.won) data.progression.wins += 1;
  if (opts.tournamentWon) data.progression.tournamentWins += 1;
  data.progression.bonusPoints += earned;
  if (opts.box) {
    const c = data.progression.career;
    c.pts += opts.box.pts;
    c.fgm += opts.box.fgm;
    c.fga += opts.box.fga;
    c.tpm += opts.box.tpm;
    c.tpa += opts.box.tpa;
    c.dunks += opts.box.dunks;
    c.steals += opts.box.steals;
    c.blocks += opts.box.blocks;
    c.rebounds += opts.box.rebounds;
  }
  saveCustomGnome(data);

  return { earned, gamePoints, winPoints, tournamentPoints };
}

export function normalizeCustomGnome(raw: unknown): CustomGnomeData {
  const def = defaultCustomGnome();
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return def;
  const parsed = raw as Partial<CustomGnomeData>;
  const mine = getMyGnome();

  const rawStats = parsed.stats;
  // Migrate legacy 3-9 stat scale to 0-100 scale
  const isLegacyScale =
    rawStats !== undefined &&
    rawStats.speed <= 10 &&
    rawStats.threePt <= 10 &&
    rawStats.dunk <= 10 &&
    rawStats.defense <= 10;
  const scale = isLegacyScale ? 10 : 1;

  const prog = parsed.progression;
  const rawCareer = prog?.career;
  const numOr0 = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.round(v)) : 0);
  const progression = {
    gamesPlayed: numOr0(prog?.gamesPlayed),
    wins: numOr0(prog?.wins),
    tournamentWins: numOr0(prog?.tournamentWins),
    bonusPoints: numOr0(prog?.bonusPoints),
    career: {
      pts: numOr0(rawCareer?.pts),
      fgm: numOr0(rawCareer?.fgm),
      fga: numOr0(rawCareer?.fga),
      tpm: numOr0(rawCareer?.tpm),
      tpa: numOr0(rawCareer?.tpa),
      dunks: numOr0(rawCareer?.dunks),
      steals: numOr0(rawCareer?.steals),
      blocks: numOr0(rawCareer?.blocks),
      rebounds: numOr0(rawCareer?.rebounds),
    },
  };

  const stats = {
    speed: clampStat((rawStats?.speed ?? def.stats.speed / scale) * scale),
    threePt: clampStat((rawStats?.threePt ?? def.stats.threePt / scale) * scale),
    dunk: clampStat((rawStats?.dunk ?? def.stats.dunk / scale) * scale),
    defense: clampStat((rawStats?.defense ?? def.stats.defense / scale) * scale),
  };

  // Enforce budget cap in case of corrupted or legacy data
  const maxBudget = CUSTOM_STAT_BUDGET + progression.bonusPoints;
  const used = stats.speed + stats.threePt + stats.dunk + stats.defense;
  if (used > maxBudget) {
    const ratio = maxBudget / used;
    stats.speed = clampStat(stats.speed * ratio);
    stats.threePt = clampStat(stats.threePt * ratio);
    stats.dunk = clampStat(stats.dunk * ratio);
    stats.defense = clampStat(stats.defense * ratio);
  }

  return {
    name: typeof parsed.name === 'string' && parsed.name.trim() ? parsed.name.trim().slice(0, 18) : def.name,
    nickname: typeof parsed.nickname === 'string' && parsed.nickname.trim() ? parsed.nickname.trim().slice(0, 14) : def.nickname,
    number: typeof parsed.number === 'number' ? Math.max(0, Math.min(99, Math.round(parsed.number))) : def.number,
    look: {
      ...def.look,
      ...(parsed.look ?? {}),
      // Always keep unlocked achievement equipment from @lawn/gnome if present
      equipment: parsed.look?.equipment ?? mine?.look.equipment,
    },
    stats,
    progression,
  };
}

export function loadCustomGnome(): CustomGnomeData {
  return readSave().custom;
}

export function saveCustomGnome(data: CustomGnomeData): void {
  const cur = readSave();
  writeSave({
    ...cur,
    updatedAt: Date.now(),
    custom: normalizeCustomGnome(data),
  });
}

export function customGnomeToProfile(data: CustomGnomeData, team?: ProTeam): GnomePlayerProfile {
  return {
    id: 'custom-player',
    name: data.name || 'My Gnome',
    nickname: data.nickname || 'CUSTOM',
    number: data.number,
    look: team
      ? { ...data.look, pants: team.secondary }
      : { ...data.look },
    stats: { ...data.stats },
    isCustom: true,
  };
}

function clampStat(v: number): number {
  return Math.max(STAT_MIN, Math.min(STAT_MAX, Math.round(v)));
}

export const CUSTOM_SWATCHES: readonly number[] = [
  0xd92b2b, 0xe6681c, 0xf5a623, 0x228b22, 0x0e9aa7, 0x1e64d8,
  0x7b3fe4, 0xc82376, 0xf5f5f5, 0x1e1e26, 0x6b4a2e, 0xffd21f,
];

export const SKIN_SWATCHES: readonly number[] = [
  0xffdbac, 0xf1c27d, 0xe0ac69, 0xc68642, 0x8d5524, 0x5c3a21,
];

export const BEARD_SWATCHES: readonly number[] = [
  0xf4f4f4, 0xd8c3a5, 0x8b4513, 0x3b2a1a, 0x222228, 0xc84b22,
];
