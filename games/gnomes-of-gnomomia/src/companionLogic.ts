// Pure logic for independent MMO-style gnome companions: personalities, name flavors,
// quest-window selection (current + recent prior quests), objective resolution, and zone routing.
import type {
  ClassId, EnemyDef, NpcDef, QuestDef, SpawnGroup, WorldObjectDef, ZoneDef, ZoneExit, ZoneId,
} from './config';
import type { QuestProgress } from './state';

export type CompanionPersonalityId = 'tryhard' | 'lorehound' | 'lootgoblin' | 'wanderer' | 'helper';

export interface PersonalityDef {
  readonly id: CompanionPersonalityId;
  readonly label: string;
  readonly names: readonly string[];
  readonly plateColor: string;
  readonly hatColors: readonly number[];
  readonly shirtColors: readonly number[];
  readonly beardColors: readonly number[];
  readonly preferredClasses: readonly ClassId[];
  readonly speedMult: number;
  readonly attackCooldownMult: number;
  readonly forageChance: number;
  readonly admireChance: number;
  readonly detourChance: number;
  readonly talkPauseS: readonly [number, number];
  readonly lines: {
    readonly idle: readonly string[];
    readonly combat: readonly string[];
    readonly quest: readonly string[];
    readonly forage: readonly string[];
    readonly respawn: readonly string[];
  };
}

export const PERSONALITIES: Record<CompanionPersonalityId, PersonalityDef> = {
  tryhard: {
    id: 'tryhard',
    label: 'Speedrunner',
    names: [
      'xX_DewSlayer_Xx', 'GnomeMeta', 'CritHappens', 'SpeedrunPip',
      'OptimalTrowel', 'ParseGnome', 'NoWasteDPS', 'BisOrBust',
    ],
    plateColor: '#ffaa88',
    hatColors: [0xa53b3b, 0x3b3b4f, 0xc46b28],
    shirtColors: [0x2f2f3a, 0x5c2c2c, 0x3f4a5a],
    beardColors: [0x8f5d38, 0x4a3b32, 0xb88c5a],
    preferredClasses: ['slinger', 'mage'],
    speedMult: 1.12,
    attackCooldownMult: 0.8,
    forageChance: 0.06,
    admireChance: 0.03,
    detourChance: 0.0,
    talkPauseS: [0.8, 1.4],
    lines: {
      idle: ['Where is the mount NPC?', 'Lfg? Nvm soloing.', 'Checking DPS.', 'Need faster boots.'],
      combat: ['Pulling two.', 'Rotation is clean.', 'Need more crit!', 'Tagging!'],
      quest: ['Fastest route is north.', 'Spawn rate is slow...', 'Skipping dialogue.', 'Onto the next!'],
      forage: ['Vendor trash.', 'Quick grab.'],
      respawn: ['Lag spike!', 'Healer?! Oh right, solo.', 'Resetting aggro.'],
    },
  },
  lorehound: {
    id: 'lorehound',
    label: 'Lorehound',
    names: [
      'Barnaby of Mossbottom', 'Alder Leafwalker', 'Ser Thimblewick', 'Bramblewise',
      'Clover the Patient', 'Brother Turnip', 'Mist-Watcher', 'Fescue Bard',
    ],
    plateColor: '#f2d98d',
    hatColors: [0x3b6ea5, 0x6b4ca5, 0x3b8a57],
    shirtColors: [0x3f5475, 0x57416b, 0x6e5438],
    beardColors: [0xe8e2d5, 0xd8c8a8, 0xc4b08a],
    preferredClasses: ['mage', 'warden'],
    speedMult: 0.9,
    attackCooldownMult: 1.1,
    forageChance: 0.14,
    admireChance: 0.42,
    detourChance: 0.15,
    talkPauseS: [2.2, 3.6],
    lines: {
      idle: ['The moss looks lovely today.', 'Hail, fellow traveller!', 'Did you read the ledger?', 'Old stonework here.'],
      combat: ['For the Hearth!', 'Have at thee, beast!', 'A noble skirmish!'],
      quest: ['The Elder spoke of this...', 'Fascinating history.', 'Let me read the plaque.', 'Another chapter unfolds.'],
      forage: ['A curious trinket.', 'Might be an heirloom.'],
      respawn: ['Tis but a grass stain.', 'The shrines are kind.', 'Humbled by the lawn.'],
    },
  },
  lootgoblin: {
    id: 'lootgoblin',
    label: 'Loot Goblin',
    names: [
      'ShinySnatcher', 'DibbsMcGee', 'PocketFullOfBugs', 'CoinGoblin',
      'LootHoarder', 'PebbleCounter', 'Yoinkimus', 'BagFullSendHelp',
    ],
    plateColor: '#d9a6ff',
    hatColors: [0xc49e28, 0x8b4ca5, 0xc46b28],
    shirtColors: [0x6e5438, 0x5c4b2c, 0x4b6344],
    beardColors: [0xb88c5a, 0x8f5d38, 0x7a6855],
    preferredClasses: ['slinger', 'warden'],
    speedMult: 1.04,
    attackCooldownMult: 0.95,
    forageChance: 0.78,
    admireChance: 0.08,
    detourChance: 0.12,
    talkPauseS: [1.0, 1.8],
    lines: {
      idle: ['Bag space is full...', 'Any chests around here?', 'Counting my coins.', 'Smells like loot.'],
      combat: ['Drop something good!', 'Empty pockets?!', 'Gimme that shell!'],
      quest: ['Does this quest pay well?', 'Only here for the reward.', 'Show me the gold!'],
      forage: ['Ooh, shiny!', 'Dibbs!', 'Yoink!', 'Found a coin!'],
      respawn: ['Did I drop my coins?!', 'Worth it for the loot.', 'Back for my stuff!'],
    },
  },
  wanderer: {
    id: 'wanderer',
    label: 'Wanderer',
    names: [
      'LostInTheGrass', 'Wobbles', 'WaitHowDoIJump', 'WrongTurnWilbur',
      'PuddleStomper', 'DewBoots', 'UhOhBeetle', 'AccidentalPull',
    ],
    plateColor: '#b8f2a6',
    hatColors: [0x3b8a57, 0x2f8f8f, 0xc49e28],
    shirtColors: [0x4b6344, 0x6e5438, 0x5f5f5f],
    beardColors: [0xd8c8a8, 0xb88c5a, 0xe8e2d5],
    preferredClasses: ['warden', 'slinger'],
    speedMult: 0.92,
    attackCooldownMult: 1.15,
    forageChance: 0.34,
    admireChance: 0.35,
    detourChance: 0.32,
    talkPauseS: [1.5, 2.8],
    lines: {
      idle: ['I forgot why I came here.', 'Ooh, a butterfly.', 'How do I open the map?', 'My boots are full of dew.'],
      combat: ['Wait, why is it mad?!', 'Did I help?', 'Whoa, slippery grass!'],
      quest: ['Where is Fernwick again?', 'Is this the right zone?', 'I think I passed it.', 'Wait for me!'],
      forage: ['Is that a beetle or a pebble?', 'Ooh, free stuff!'],
      respawn: ["I'm okay!", 'Nap time over!', 'How did I get here?'],
    },
  },
  helper: {
    id: 'helper',
    label: 'Helper',
    names: [
      'CoachBramble', 'TankyToadstool', 'HelpfulHank', 'ShieldBro',
      'MedicSprout', 'GoodVibesGnome', 'CarryMeNot', 'OakheartPal',
    ],
    plateColor: '#88e8ff',
    hatColors: [0x2f8f8f, 0x3b8a57, 0x3b6ea5],
    shirtColors: [0x3f5475, 0x4b6344, 0x5f5f5f],
    beardColors: [0xe8e2d5, 0xd8c8a8, 0xb88c5a],
    preferredClasses: ['warden', 'mage'],
    speedMult: 1.0,
    attackCooldownMult: 0.95,
    forageChance: 0.14,
    admireChance: 0.14,
    detourChance: 0.05,
    talkPauseS: [1.4, 2.4],
    lines: {
      idle: ['Heya! Good luck out there.', 'Safe travels, friend.', 'Always repair your boots.', 'Anyone need a tank?'],
      combat: ['I got aggro!', 'Watch your toes!', 'Nice hit!'],
      quest: ['You got this!', 'Heading to turn in.', 'Need a hand with that?', 'Clearing the path.'],
      forage: ['Saving this for later.', 'Tidying up the lawn.'],
      respawn: ['Back on my feet!', 'All good, keep going!'],
    },
  },
};

export const PERSONALITY_ORDER: readonly CompanionPersonalityId[] = [
  'tryhard', 'lorehound', 'lootgoblin', 'wanderer', 'helper',
];

export interface CompanionIdentity {
  personality: PersonalityDef;
  name: string;
  hatColor: number;
  shirtColor: number;
  beardColor: number;
  classId: ClassId;
}

/** Picks a varied roster of companion personalities and unique flavor-matched names. */
export function createCompanionRoster(count: number, rng: () => number = Math.random): CompanionIdentity[] {
  const usedNames = new Set<string>();
  const roster: CompanionIdentity[] = [];
  for (let i = 0; i < count; i++) {
    const pid = PERSONALITY_ORDER[i % PERSONALITY_ORDER.length];
    const p = PERSONALITIES[pid];
    const available = p.names.filter((n) => !usedNames.has(n));
    const pool = available.length > 0 ? available : p.names;
    const name = pool[Math.floor(rng() * pool.length)];
    usedNames.add(name);
    const hatColor = p.hatColors[Math.floor(rng() * p.hatColors.length)];
    const shirtColor = p.shirtColors[Math.floor(rng() * p.shirtColors.length)];
    const beardColor = p.beardColors[Math.floor(rng() * p.beardColors.length)];
    const classId = p.preferredClasses[Math.floor(rng() * p.preferredClasses.length)];
    roster.push({ personality: p, name, hatColor, shirtColor, beardColor, classId });
  }
  return roster;
}

export interface QuestPools {
  /** Quests the player is actively doing right now (or local zone starter quests if none active). */
  current: string[];
  /** The last few quests prior to the player (recently completed or slightly lower-level nearby quests). */
  prior: string[];
}

/**
 * Computes the two quest pools companions draw from so the world feels like an MMO:
 * - `current`: quests the player is actively doing
 * - `prior`: the last few quests prior to the player (most recent / highest-level completed quests,
 *   supplemented by lower-level quests in the player's zone when the player has few completed quests).
 */
export function selectQuestPools(
  quests: Record<string, QuestDef>,
  playerQuests: Record<string, QuestProgress>,
  playerZone: ZoneId,
  playerLevel: number,
  priorLimit = 4,
): QuestPools {
  const baseZone = (playerZone.includes('/') ? playerZone.split('/')[0] : playerZone) as ZoneId;
  const active: string[] = [];
  const completedEntries: { id: string; order: number; level: number }[] = [];

  let order = 0;
  for (const [id, prog] of Object.entries(playerQuests)) {
    const def = quests[id];
    if (!def) continue;
    if (!prog.done) {
      active.push(id);
    } else {
      completedEntries.push({ id, order: order++, level: def.level });
    }
  }

  // Sort completed quests so the most recent / highest-level prior quests come first.
  completedEntries.sort((a, b) => (b.order - a.order) || (b.level - a.level));
  const prior = completedEntries.slice(0, priorLimit).map((e) => e.id);

  // If the player has no active quests yet, fall back to undone quests in their zone near their level.
  if (active.length === 0) {
    const fallback = Object.values(quests)
      .filter((q) => !playerQuests[q.id]?.done && q.zone === baseZone && q.level <= playerLevel + 3)
      .sort((a, b) => Math.abs(a.level - playerLevel) - Math.abs(b.level - playerLevel));
    for (const q of fallback.slice(0, 4)) active.push(q.id);
    if (active.length === 0) {
      const anyUndone = Object.values(quests)
        .filter((q) => !playerQuests[q.id]?.done && q.level <= playerLevel + 3)
        .sort((a, b) => Math.abs(a.level - playerLevel) - Math.abs(b.level - playerLevel));
      for (const q of anyUndone.slice(0, 3)) active.push(q.id);
    }
  }

  // If the player has fewer than `priorLimit` completed quests, supplement with earlier/lower-level quests.
  if (prior.length < priorLimit) {
    const activeSet = new Set(active);
    const priorSet = new Set(prior);
    const extra = Object.values(quests)
      .filter((q) => !activeSet.has(q.id) && !priorSet.has(q.id) && q.level <= Math.max(playerLevel, 4))
      .sort((a, b) => {
        const aZone = a.zone === baseZone ? 0 : 1;
        const bZone = b.zone === baseZone ? 0 : 1;
        if (aZone !== bZone) return aZone - bZone;
        return Math.abs(a.level - Math.max(1, playerLevel - 1)) - Math.abs(b.level - Math.max(1, playerLevel - 1));
      });
    for (const q of extra) {
      if (prior.length >= priorLimit) break;
      prior.push(q.id);
    }
  }

  return { current: active, prior };
}

export interface StageTarget {
  zone: ZoneId;
  x: number;
  z: number;
  kind: 'enemy' | 'npc' | 'object' | 'point';
  enemyId?: string;
  npcId?: string;
  objectId?: string;
  count: number;
  radius: number;
}

/** Resolves a quest stage's objective into a world position, zone, and target metadata. */
export function resolveStageTarget(
  questId: string,
  stageIdx: number,
  tables: {
    quests: Record<string, QuestDef>;
    npcs: Record<string, NpcDef>;
    objects: Record<string, WorldObjectDef>;
    spawns: readonly SpawnGroup[];
    enemies: Record<string, EnemyDef>;
  },
): StageTarget | null {
  const q = tables.quests[questId];
  const stage = q?.stages[stageIdx];
  if (!q || !stage) return null;
  const o = stage.objective;

  switch (o.type) {
    case 'kill': {
      const sg = tables.spawns.find((s) => s.enemy === o.enemy && s.zone === q.zone)
        ?? tables.spawns.find((s) => s.enemy === o.enemy);
      if (sg) {
        return {
          zone: sg.zone, x: sg.x, z: sg.z, kind: 'enemy',
          enemyId: o.enemy, count: o.count, radius: Math.max(4, sg.spread),
        };
      }
      const giver = tables.npcs[q.giver];
      return giver ? { zone: giver.zone, x: giver.x, z: giver.z, kind: 'enemy', enemyId: o.enemy, count: o.count, radius: 8 } : null;
    }
    case 'collect': {
      // Check if an object gives this item first.
      const obj = Object.values(tables.objects).find((ob) => ob.giveItem?.item === o.item);
      if (obj) {
        return { zone: obj.zone, x: obj.x, z: obj.z, kind: 'object', objectId: obj.id, count: o.count, radius: 2.2 };
      }
      // Otherwise find an enemy that drops it and has a spawn group.
      const dropperIds = new Set(
        Object.values(tables.enemies)
          .filter((e) => e.loot.some((l) => l.item === o.item))
          .map((e) => e.id),
      );
      const sg = tables.spawns.find((s) => dropperIds.has(s.enemy) && s.zone === q.zone)
        ?? tables.spawns.find((s) => dropperIds.has(s.enemy));
      if (sg) {
        return {
          zone: sg.zone, x: sg.x, z: sg.z, kind: 'enemy',
          enemyId: sg.enemy, count: o.count, radius: Math.max(4, sg.spread),
        };
      }
      const giver = tables.npcs[q.giver];
      return giver ? { zone: giver.zone, x: giver.x, z: giver.z, kind: 'point', count: o.count, radius: 5 } : null;
    }
    case 'talk': {
      const npc = tables.npcs[o.npc];
      return npc ? { zone: npc.zone, x: npc.x, z: npc.z, kind: 'npc', npcId: o.npc, count: 1, radius: 2.5 } : null;
    }
    case 'interact': {
      const obj = tables.objects[o.object];
      return obj ? { zone: obj.zone, x: obj.x, z: obj.z, kind: 'object', objectId: o.object, count: o.count, radius: 2.2 } : null;
    }
    case 'reach':
      return { zone: o.zone, x: o.x, z: o.z, kind: 'point', count: 1, radius: Math.max(2.5, o.r) };
    case 'escort': {
      const npc = tables.npcs[o.npc];
      return {
        zone: o.zone, x: npc ? npc.x : o.x, z: npc ? npc.z : o.z,
        kind: 'point', count: 1, radius: Math.max(3, o.r),
      };
    }
    case 'defend':
      return { zone: o.zone, x: o.x, z: o.z, kind: 'point', count: 1, radius: Math.max(3, o.r) };
    case 'choice': {
      const giver = tables.npcs[q.giver];
      return giver ? { zone: giver.zone, x: giver.x, z: giver.z, kind: 'npc', npcId: q.giver, count: 1, radius: 2.5 } : null;
    }
  }
}

/** Finds the first ZoneExit out of `fromZone` along a shortest zone-graph path to `toZone`. */
export function nextZoneExit(
  fromZone: ZoneId,
  toZone: ZoneId,
  zones: Record<ZoneId, ZoneDef>,
): ZoneExit | null {
  if (fromZone === toZone) return null;
  const visited = new Set<ZoneId>([fromZone]);
  const queue: { zone: ZoneId; firstExit: ZoneExit | null }[] = [{ zone: fromZone, firstExit: null }];

  while (queue.length > 0) {
    const cur = queue.shift()!;
    const def = zones[cur.zone];
    if (!def) continue;
    for (const exit of def.exits) {
      if (exit.to === cur.zone || visited.has(exit.to)) continue;
      const first = cur.firstExit ?? exit;
      if (exit.to === toZone) return first;
      visited.add(exit.to);
      queue.push({ zone: exit.to, firstExit: first });
    }
  }
  return null;
}

/** How many companions stroll in town while the player is in one. */
export const TOWN_STROLLERS = 2;

/** Which companion indexes stroll: the first TOWN_STROLLERS of the 'prior' role, falling back to any. */
export function pickTownStrollers(roles: readonly ('current' | 'prior')[], count: number = TOWN_STROLLERS): number[] {
  const want = Math.max(0, Math.min(count, roles.length));
  const out: number[] = [];
  roles.forEach((r, i) => { if (r === 'prior' && out.length < want) out.push(i); });
  roles.forEach((r, i) => { if (r !== 'prior' && out.length < want) out.push(i); });
  return out;
}

/** A stroller does not pick a waypoint closer than this to where it stands (m). */
export const STROLL_MIN_DIST = 6;

/** Next waypoint for a strolling companion: a random waypoint at least 6 m from (x, z), avoiding the last `recent` ids; null when the town has none. */
export function nextStrollWaypoint<T extends { id: string; x: number; z: number }>(
  waypoints: readonly T[],
  x: number,
  z: number,
  recent: readonly string[],
  rng: () => number,
): T | null {
  if (waypoints.length === 0) return null;
  const far = waypoints.filter((w) => Math.hypot(w.x - x, w.z - z) >= STROLL_MIN_DIST);
  const fresh = far.filter((w) => !recent.includes(w.id));
  // Relax the rules in order (recent ids first, then distance) rather than stand still in a tiny town.
  const pool = fresh.length > 0 ? fresh : far.length > 0 ? far : waypoints;
  return pool[Math.min(pool.length - 1, Math.floor(rng() * pool.length))];
}
