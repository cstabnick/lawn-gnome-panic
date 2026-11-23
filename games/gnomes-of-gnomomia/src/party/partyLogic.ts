// Party rules (pure): sizes, kill sharing, who joins, where a helper walks, what it fights and says.
// No three, DOM, state or other runtime imports, so the economy sim can use it.
import type { EnemyDef, InvSlot } from '../config';
import type { CompanionPersonalityId } from '../companionLogic';
import { enemyGoldRange } from '../economy';

/** Party tuning. The economy sim may import these. */
export const PARTY = {
  /** Gnomes in a party, me included. */
  max: 4,
  /** m: a party gnome this close to a dead enemy shares the kill. */
  shareRadius: 60,
  /** A Wayfarer helper counts as this much of a gnome when a kill is split. */
  helperWeight: 0.25,
  /** Each extra online player in range makes the whole kill worth this much more. */
  groupBonus: 0.3,
  /** m: how close a Wayfarer must be to be asked along. */
  inviteRange: 30,
  /** s: an unanswered player invite expires. */
  inviteTtlS: 30,
  /** m: where a helper walks behind the player. */
  followDist: 2.6,
  /** m: a helper farther than this from its spot walks 1.3x faster. */
  catchUpDist: 6,
  /** m: a helper farther than this from the player (or in another zone) appears beside them. */
  teleportDist: 45,
  /** m around the player a helper looks for enemies already fighting. */
  assistRadius: 10,
  /** m: the player's own attack target is assisted while it is this close to the player. */
  assistTargetRange: 25,
  /** s: a downed helper gets up beside the player after this long. */
  helperRespawnS: 8,
  /** ms between two party chat lines from me. */
  chatGapMs: 800,
} as const;

/** Colour of party chat lines in the chat log. */
export const PARTY_CHAT_COLOR = '#8fd0ff';

/**
 * XP (and personal-loot) multiplier for each player sharing a kill. players >= 1 (floored, min 1), helpers >= 0
 * (floored, min 0). Solo (1, 0) is exactly 1. Otherwise (1 + groupBonus * (players - 1)) / (players + helperWeight * helpers).
 */
export function killShare(players: number, helpers: number): number {
  const p = Math.max(1, Math.floor(players));
  const h = Math.max(0, Math.floor(helpers));
  if (p === 1 && h === 0) return 1;
  return (1 + PARTY.groupBonus * (p - 1)) / (p + PARTY.helperWeight * h);
}

/** Level a hired Wayfarer is set to: one below the player, at least 1. */
export function helperLevel(playerLevel: number): number {
  return Math.max(1, playerLevel - 1);
}

/**
 * Would this Wayfarer join? helper, lorehound, wanderer: always. lootgoblin: rng() < 0.8.
 * tryhard: only if playerLevel >= companionLevel - 1 (rng not called).
 */
export function wouldJoin(
  personality: CompanionPersonalityId, companionLevel: number, playerLevel: number, rng: () => number,
): boolean {
  switch (personality) {
    case 'tryhard':
      return playerLevel >= companionLevel - 1;
    case 'lootgoblin':
      return rng() < 0.8;
    default:
      return true;
  }
}

const FAN = [0, -0.75, 0.75] as const;

/**
 * Where helper number `index` (0, 1, 2; taken modulo 3) stands: PARTY.followDist behind the player, fanned out.
 * Facing follows the game's convention: forward is (sin(facing), cos(facing)). Angle = facing + PI + [0, -0.75, 0.75][index % 3];
 * returns { x: px + sin(angle) * followDist, z: pz + cos(angle) * followDist }.
 */
export function followSlot(px: number, pz: number, facing: number, index: number): { x: number; z: number } {
  const i = ((index % 3) + 3) % 3;
  const angle = facing + Math.PI + FAN[i];
  return {
    x: px + Math.sin(angle) * PARTY.followDist,
    z: pz + Math.cos(angle) * PARTY.followDist,
  };
}

export interface AssistCandidate { id: number; x: number; z: number; dead: boolean; inCombat: boolean; enemy: boolean }

/**
 * Which enemy a helper should fight. 1) playerTargetId, if a candidate with that id is an enemy, alive, and within
 * PARTY.assistTargetRange of (px, pz). 2) Otherwise the alive enemy with inCombat true nearest to (px, pz) within
 * `radius`. 3) Otherwise null.
 */
export function pickAssistTarget(
  px: number, pz: number, playerTargetId: number | null, candidates: Iterable<AssistCandidate>, radius: number = PARTY.assistRadius,
): number | null {
  const list = [...candidates];
  if (playerTargetId !== null) {
    const t = list.find((c) => c.id === playerTargetId);
    if (t && t.enemy && !t.dead && Math.hypot(t.x - px, t.z - pz) <= PARTY.assistTargetRange) return t.id;
  }
  let best: number | null = null;
  let bestD = Infinity;
  for (const c of list) {
    if (!c.enemy || c.dead || !c.inCombat) continue;
    const d = Math.hypot(c.x - px, c.z - pz);
    if (d > radius || d >= bestD) continue;
    bestD = d;
    best = c.id;
  }
  return best;
}

/**
 * A personal loot roll for a shared kill: each drop with rng() < drop.chance * share gives { item, count: drop.count ?? 1 };
 * gold = Math.round((lo + Math.floor(rng() * (hi - lo + 1))) * share) with [lo, hi] = enemyGoldRange(def).
 * Drops are rolled first, in order, then gold (one rng() call for gold).
 */
export function rollPersonalLoot(
  def: Pick<EnemyDef, 'loot' | 'level' | 'gold'>, share: number, rng: () => number,
): { items: InvSlot[]; gold: number } {
  const items: InvSlot[] = [];
  for (const drop of def.loot) {
    if (rng() < drop.chance * share) items.push({ item: drop.item, count: drop.count ?? 1 });
  }
  const [lo, hi] = enemyGoldRange(def);
  const gold = Math.round((lo + Math.floor(rng() * (hi - lo + 1))) * share);
  return { items, gold };
}

/** The new leader when `leaving` leaves: the lowest remaining id, or null when fewer than 2 remain. */
export function nextLeader(members: readonly number[], leaving: number): number | null {
  const rest = members.filter((m) => m !== leaving);
  if (rest.length < 2) return null;
  return Math.min(...rest);
}

/**
 * Which hired helpers must go (ids, newest last) when the online party has `onlineCount` players.
 * Not the leader and onlineCount > 1: all of them. Otherwise keep the first max(0, PARTY.max - max(1, onlineCount))
 * and return the rest (helperIds is in hire order).
 */
export function helpersToDismiss(onlineCount: number, helperIds: readonly number[], isLeader: boolean): number[] {
  if (!isLeader && onlineCount > 1) return [...helperIds];
  const keep = Math.max(0, PARTY.max - Math.max(1, onlineCount));
  return helperIds.slice(keep);
}

export type PartyLineKind = 'join' | 'decline' | 'leave' | 'follow' | 'help' | 'thanks';

/** What a Wayfarer says in a party, by personality. Paste exactly (see PARTY_LINES below). */
export const PARTY_LINES = {
  tryhard: {
    join: ['Fine, but we pull fast.', 'Invite accepted. Keep up.'],
    decline: ['Lfg? Nvm, you are underlevelled.', 'Soloing is faster, sorry.'],
    leave: ['gtg, queue popped.', 'Thanks for the carry. Mine, I mean.'],
    follow: ['On you. Move it.', 'Following. Pathing is bad.'],
    help: ['Pulling it off you!', 'On it, watch my DPS.'],
    thanks: ['np', 'gg, efficient.'],
  },
  lorehound: {
    join: ['I should be honoured to walk your road.', 'A fellowship! Like the old ledgers tell.'],
    decline: ['Forgive me, I am mid-chapter.', 'Another time, friend; the plaques call.'],
    leave: ['Our chapter ends here. Fare well!', 'I shall write of this road.'],
    follow: ['Lead on, I am at your heel.', 'After you, good gnome.'],
    help: ['For the Hearth, I come!', 'Hold fast, I am with you!'],
    thanks: ['The honour was mine.', 'Well met, truly.'],
  },
  lootgoblin: {
    join: ['Do I get a share? I get a share.', 'Party loot? Count me in!'],
    decline: ['No loot, no help.', 'Busy. Pockets need filling.'],
    leave: ['Off to sell all this!', 'My bag is full, bye!'],
    follow: ['Right behind you. And your coins.', 'Following the money!'],
    help: ['Is it carrying anything good?', 'Coming! Dibs on the drop!'],
    thanks: ['Thank me in coins.', 'Anytime, for a price.'],
  },
  wanderer: {
    join: ['Ooh, a group! Where are we going?', "Yes! I'm terrible at maps."],
    decline: ['Wait, who are you?', 'I think I am lost already, sorry.'],
    leave: ['Ooh, a butterfly! Bye!', 'I will find you later. Probably.'],
    follow: ['Wait for me!', 'Following! Which way is forward?'],
    help: ['Coming! Which one do I hit?', 'Whoa, okay, helping!'],
    thanks: ['Did I help? Yay!', 'Thank you too!'],
  },
  helper: {
    join: ['Always happy to help!', 'Tank reporting for duty!'],
    decline: ['Sorry, promised someone else.', 'Next time, friend!'],
    leave: ['Good luck out there!', 'Safe travels, friend.'],
    follow: ['Right behind you!', 'Lead the way!'],
    help: ['I got aggro!', 'Hang on, coming!'],
    thanks: ['Anytime!', 'Teamwork!'],
  },
} as const satisfies Record<CompanionPersonalityId, Record<PartyLineKind, readonly string[]>>;

/**
 * Which kind of line a helper answers a party chat line with, or null. Case-insensitive, tested in this order:
 * /\b(follow|come|on my way|this way)\b/ -> 'follow'; /\b(help|aggro|heal|save me)\b/ -> 'help';
 * /\b(thanks|thank you|ty|gg|nice|well done)\b/ -> 'thanks'; otherwise null.
 */
export function helperReplyKind(text: string): 'follow' | 'help' | 'thanks' | null {
  const t = text.toLowerCase();
  if (/\b(follow|come|on my way|this way)\b/.test(t)) return 'follow';
  if (/\b(help|aggro|heal|save me)\b/.test(t)) return 'help';
  if (/\b(thanks|thank you|ty|gg|nice|well done)\b/.test(t)) return 'thanks';
  return null;
}
