// Raid ("horn call") and reforging types. Design: docs/design/gnomomia/raids.md. Types only.
import type { ClassId, Condition, OutdoorZoneId } from './config';

/** Who sits in a raid seat: the local player, a real party member (the party system), or a spawned helper. */
export type RaidSeatKind = 'player' | 'party' | 'helper';
/** What a seat does in the fight: Warden = tank, Hedge-Mage = healer, Slinger = damage. */
export type HelperRole = 'tank' | 'healer' | 'damage';

export interface RaidSeat {
  kind: RaidSeatKind;
  /** 'me' for the player, the member id for a party seat, 'helper-<n>' (n = 0, 1, 2 ...) for helpers. */
  id: string;
  name: string;
  classId: ClassId;
  level: number;
  role: HelperRole;
  /** Helpers only: gnome colours for createGnomeModel(look(hat, shirt, beard)). */
  colors?: { hat: number; shirt: number; beard: number };
}

/** A real party member, as the party system reports them through raidRoster.setPartySource(). */
export interface RaidPartyMember { id: string; name: string; classId: ClassId | null; level: number; zone: string; x: number; z: number }
/** Plugged in by the party system. Until then there is none, and every free seat is a helper. */
export interface PartySource { members(): readonly RaidPartyMember[] }

export interface RaidWave {
  /** ENEMIES id. */
  enemy: string;
  count: number;
  /** Seconds after the pull (the boss comes at 0). */
  at: number;
}

export interface RaidDef {
  id: string;
  /** Shown in the HUD and chat. */
  name: string;
  zone: OutdoorZoneId;
  /** Raid level: its enemies, its clear XP, its drops (ilvl = level + 1). */
  level: number;
  /** The horn refuses players below this level. */
  minLevel: number;
  /** Arena centre and radius. Zone-local in the pack; content.ts moves x and z to world coordinates. */
  x: number; z: number; r: number;
  /** ENEMIES id of the boss: spawned at the arena centre at the pull; the raid is won when it dies. */
  boss: string;
  /** Adds, spawned on the arena edge at their time. */
  waves: readonly RaidWave[];
  /** OBJECTS id of the horn post that starts it. */
  horn: string;
  /** ITEMS ids; on a win each drops with chance RAID_TUNING.dropChance. */
  drops: readonly string[];
  /** Chat lines at the horn and on the win. */
  intro: string;
  victory: string;
}

/** Reforging: raid gear (plus coins) becomes a new piece at a reforging anvil. */
export interface RecipeDef {
  id: string;
  /** OBJECTS id of the reforging anvil (model 'anvil') that offers it. */
  station: string;
  /** ITEMS id made. */
  makes: string;
  needs: readonly { item: string; count: number }[];
  /** Coins taken: packs use craftGold(ilvl of `makes`) from src/economy.ts. */
  gold: number;
  when?: Condition;
}

/** What a raid pack exports beside its ContentPack. */
export interface RaidPack { raids?: readonly RaidDef[]; recipes?: readonly RecipeDef[] }
