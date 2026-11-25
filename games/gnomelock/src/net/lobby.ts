// Pure lobby state machine for Gnomelock 2v2 multiplayer & solo skirmish.
import type { PlayerInfo } from '@lawn/mp';
import type { HeroId, Team } from '../sim/config';
import { HEROES } from '../sim/heroes';
import type { SlotSetup } from '../sim/world';
import { BOT_DIFFICULTY_SKILL, DEFAULT_BOT_HEROES, type BotDifficulty } from './protocol';

export type LobbySlotKind = 'empty' | 'human' | 'bot';

export interface LobbySlot {
  slot: number; // 0..1 = Amber (team 0), 2..3 = Sapphire (team 1)
  team: Team;
  kind: LobbySlotKind;
  playerId: number | null;
  name: string;
  heroId: HeroId;
  botSkill: number;
  userId?: string;
  characterCode?: string;
}

export interface LobbyState {
  roomCode: string | null; // null = public online lobby or offline skirmish
  isOnline: boolean;
  hostId: number;
  difficulty: BotDifficulty;
  started: boolean;
  slots: [LobbySlot, LobbySlot, LobbySlot, LobbySlot];
}

const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const BALANCED_FILL_ORDER = [0, 2, 1, 3] as const;
const ALL_HERO_IDS: readonly HeroId[] = [
  'bramble',
  'tansy',
  'fernwick',
  'potsworth',
  'hookwort',
  'buckshot',
  'thistle',
  'loam',
];

function teamForSlot(slot: number): Team {
  return slot < 2 ? 0 : 1;
}

function makeEmptySlot(slot: number, difficulty: BotDifficulty): LobbySlot {
  return {
    slot,
    team: teamForSlot(slot),
    kind: 'empty',
    playerId: null,
    name: 'Open Slot',
    heroId: DEFAULT_BOT_HEROES[slot] ?? 'bramble',
    botSkill: BOT_DIFFICULTY_SKILL[difficulty],
  };
}

function makeBotSlot(slot: number, heroId: HeroId, skill: number): LobbySlot {
  const heroName = HEROES[heroId]?.name ?? heroId.charAt(0).toUpperCase() + heroId.slice(1);
  return {
    slot,
    team: teamForSlot(slot),
    kind: 'bot',
    playerId: null,
    name: `${heroName} Bot`,
    heroId,
    botSkill: skill,
  };
}

function makeHumanSlot(slot: number, player: PlayerInfo, heroId: HeroId, skill: number): LobbySlot {
  return {
    slot,
    team: teamForSlot(slot),
    kind: 'human',
    playerId: player.id,
    name: player.name,
    heroId,
    botSkill: skill,
    userId: player.userId,
    characterCode: player.character,
  };
}

function pickUnusedBotHero(lobby: LobbyState, slot: number): HeroId {
  const used = new Set(
    lobby.slots
      .filter((s) => s.slot !== slot && s.kind !== 'empty')
      .map((s) => s.heroId),
  );
  const preferred = DEFAULT_BOT_HEROES[slot];
  if (preferred && !used.has(preferred)) return preferred;
  for (const h of ALL_HERO_IDS) {
    if (!used.has(h)) return h;
  }
  return preferred ?? 'bramble';
}

/** Generates a random 6-character room code matching ROOM_CODE_RE. */
export function generateRoomCode(): string {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += ROOM_CODE_ALPHABET[Math.floor(Math.random() * ROOM_CODE_ALPHABET.length)];
  }
  return code;
}

/** Creates an initial 2v2 LobbyState with the host in slot 0. */
export function createLobbyState(opts: {
  isOnline: boolean;
  roomCode: string | null;
  hostPlayer: PlayerInfo;
  hostHero: HeroId;
  difficulty?: BotDifficulty;
  fillBots?: boolean;
}): LobbyState {
  const difficulty = opts.difficulty ?? 'normal';
  const skill = BOT_DIFFICULTY_SKILL[difficulty];
  const slots: [LobbySlot, LobbySlot, LobbySlot, LobbySlot] = [
    makeHumanSlot(0, opts.hostPlayer, opts.hostHero, skill),
    makeEmptySlot(1, difficulty),
    makeEmptySlot(2, difficulty),
    makeEmptySlot(3, difficulty),
  ];

  const lobby: LobbyState = {
    roomCode: opts.roomCode,
    isOnline: opts.isOnline,
    hostId: opts.hostPlayer.id,
    difficulty,
    started: false,
    slots,
  };

  if (opts.fillBots) {
    fillEmptyWithBots(lobby);
  }
  return lobby;
}

/** Adds a human player to the lobby in balanced team order, or updates them if already present. */
export function addHumanToLobby(
  lobby: LobbyState,
  player: PlayerInfo,
  preferredHero?: HeroId,
): number {
  const existing = lobby.slots.find((s) => s.kind === 'human' && s.playerId === player.id);
  if (existing) {
    existing.name = player.name;
    existing.userId = player.userId;
    existing.characterCode = player.character;
    if (preferredHero) existing.heroId = preferredHero;
    return existing.slot;
  }

  let target = BALANCED_FILL_ORDER.find((idx) => lobby.slots[idx].kind === 'empty');
  if (target === undefined) {
    target = BALANCED_FILL_ORDER.find((idx) => lobby.slots[idx].kind === 'bot');
  }
  if (target === undefined) return -1;

  const heroId = preferredHero ?? DEFAULT_BOT_HEROES[target] ?? 'bramble';
  lobby.slots[target] = makeHumanSlot(target, player, heroId, BOT_DIFFICULTY_SKILL[lobby.difficulty]);
  return target;
}

/** Removes a human from the lobby (to 'empty' in lobby, or 'bot' if match already started). */
export function removeHumanFromLobby(lobby: LobbyState, playerId: number): number {
  const slotObj = lobby.slots.find((s) => s.kind === 'human' && s.playerId === playerId);
  if (!slotObj) return -1;
  const idx = slotObj.slot;
  if (lobby.started) {
    lobby.slots[idx] = makeBotSlot(idx, slotObj.heroId, BOT_DIFFICULTY_SKILL[lobby.difficulty]);
  } else {
    lobby.slots[idx] = makeEmptySlot(idx, lobby.difficulty);
  }
  return idx;
}

/** Moves a human player to a target slot if it is empty or occupied by a bot. */
export function moveHumanToSlot(lobby: LobbyState, playerId: number, targetSlot: number): boolean {
  if (targetSlot < 0 || targetSlot >= 4) return false;
  const current = lobby.slots.find((s) => s.kind === 'human' && s.playerId === playerId);
  if (!current) return false;
  if (current.slot === targetSlot) return true;

  const dest = lobby.slots[targetSlot];
  if (dest.kind === 'human') return false;

  lobby.slots[targetSlot] = {
    ...current,
    slot: targetSlot,
    team: teamForSlot(targetSlot),
  };
  lobby.slots[current.slot] = makeEmptySlot(current.slot, lobby.difficulty);
  return true;
}

/** Moves a human player to the first available empty (or bot) slot on the opposite team. */
export function swapHumanTeam(lobby: LobbyState, playerId: number): boolean {
  const current = lobby.slots.find((s) => s.kind === 'human' && s.playerId === playerId);
  if (!current) return false;
  const targetSlots = current.team === 0 ? [2, 3] : [0, 1];
  const emptyTarget = targetSlots.find((idx) => lobby.slots[idx].kind === 'empty');
  if (emptyTarget !== undefined) return moveHumanToSlot(lobby, playerId, emptyTarget);
  const botTarget = targetSlots.find((idx) => lobby.slots[idx].kind === 'bot');
  if (botTarget !== undefined) return moveHumanToSlot(lobby, playerId, botTarget);
  return false;
}

/** Updates a human player's selected hero. */
export function setHumanHero(lobby: LobbyState, playerId: number, heroId: HeroId): boolean {
  const current = lobby.slots.find((s) => s.kind === 'human' && s.playerId === playerId);
  if (!current) return false;
  current.heroId = heroId;
  return true;
}

/** Configures a non-human slot as a bot. */
export function setSlotBot(lobby: LobbyState, slot: number, heroId?: HeroId, skill?: number): boolean {
  if (slot < 0 || slot >= 4) return false;
  const cur = lobby.slots[slot];
  if (cur.kind === 'human') return false;
  const nextHero = heroId ?? (cur.kind === 'bot' ? cur.heroId : pickUnusedBotHero(lobby, slot));
  const nextSkill = skill ?? (cur.kind === 'bot' ? cur.botSkill : BOT_DIFFICULTY_SKILL[lobby.difficulty]);
  lobby.slots[slot] = makeBotSlot(slot, nextHero, nextSkill);
  return true;
}

/** Clears a bot slot back to empty. */
export function clearSlotBot(lobby: LobbyState, slot: number): boolean {
  if (slot < 0 || slot >= 4) return false;
  if (lobby.slots[slot].kind !== 'bot') return false;
  lobby.slots[slot] = makeEmptySlot(slot, lobby.difficulty);
  return true;
}

/** Fills all empty slots in the lobby with bots using distinct heroes and lobby difficulty. */
export function fillEmptyWithBots(lobby: LobbyState): void {
  const skill = BOT_DIFFICULTY_SKILL[lobby.difficulty];
  for (let i = 0; i < 4; i++) {
    if (lobby.slots[i].kind === 'empty') {
      const heroId = pickUnusedBotHero(lobby, i);
      lobby.slots[i] = makeBotSlot(i, heroId, skill);
    }
  }
}

/** Clears all bot slots in the lobby back to empty. */
export function clearAllBots(lobby: LobbyState): void {
  for (let i = 0; i < 4; i++) {
    if (lobby.slots[i].kind === 'bot') {
      lobby.slots[i] = makeEmptySlot(i, lobby.difficulty);
    }
  }
}

/** Updates the lobby's default bot difficulty and applies it to all existing bots. */
export function setLobbyDifficulty(lobby: LobbyState, difficulty: BotDifficulty): void {
  lobby.difficulty = difficulty;
  const skill = BOT_DIFFICULTY_SKILL[difficulty];
  for (const s of lobby.slots) {
    s.botSkill = skill;
  }
}

/** Converts a LobbyState into 4 SlotSetups for createMatchState, auto-filling any empty slots with bots. */
export function lobbyToMatchSlots(lobby: LobbyState): {
  slots: SlotSetup[];
  slotForPlayerId: Map<number, number>;
  botSkills: [number, number, number, number];
} {
  const slotForPlayerId = new Map<number, number>();
  const usedHeroes = new Set<HeroId>(
    lobby.slots.filter((s) => s.kind !== 'empty').map((s) => s.heroId),
  );
  const slots: SlotSetup[] = [];
  const defaultSkill = BOT_DIFFICULTY_SKILL[lobby.difficulty];
  const botSkills: [number, number, number, number] = [
    defaultSkill,
    defaultSkill,
    defaultSkill,
    defaultSkill,
  ];

  for (let i = 0; i < 4; i++) {
    const s = lobby.slots[i];
    if (s.kind === 'human' && s.playerId !== null) {
      slotForPlayerId.set(s.playerId, i);
      slots.push({
        heroId: s.heroId,
        name: s.name,
        isBot: false,
        userId: s.userId,
        characterCode: s.characterCode,
      });
    } else if (s.kind === 'bot') {
      botSkills[i] = s.botSkill;
      slots.push({
        heroId: s.heroId,
        name: s.name,
        isBot: true,
      });
    } else {
      let heroId = DEFAULT_BOT_HEROES[i] ?? 'bramble';
      if (usedHeroes.has(heroId)) {
        const alt = ALL_HERO_IDS.find((h) => !usedHeroes.has(h));
        if (alt) heroId = alt;
      }
      usedHeroes.add(heroId);
      const heroName = HEROES[heroId]?.name ?? heroId.charAt(0).toUpperCase() + heroId.slice(1);
      botSkills[i] = defaultSkill;
      slots.push({
        heroId,
        name: `${heroName} Bot`,
        isBot: true,
      });
    }
  }

  return { slots, slotForPlayerId, botSkills };
}
