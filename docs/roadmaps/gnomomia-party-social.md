# Gnomomia: parties and the social side

Goal: a gnome in Gnomes of Gnomomia can form a **party** of up to four (self included) from Wayfarers (the AI
adventurers in `src/companions.ts`) and, online, from other players. Wayfarers in your party follow you, join your
fights and respawn beside you. Kills near party members are shared: everyone in range gets XP at a split rate (a
group of players earns a little more in total than solo), kill-quest credit, and online party members get a personal
loot roll. There is party chat (`/p`, or a Party channel toggle in the chat box), a party frame with HP bars, a party
panel to invite and dismiss, an invite prompt, and two animated emotes (`@lawn/emotes`: wave, cheer, plus any the
player has unlocked) that other players see. Three achievements reward it.

## What "social" means here (decided)

| Piece | Rule |
|---|---|
| Party size | `PARTY.max` = 4 gnomes, me included. |
| Wayfarer helpers | Hired locally ("Ask along" in the party panel, within 30 m). Personality decides: tryhards refuse a gnome more than one level below them, loot goblins say yes 80% of the time, the rest always. A helper is set to (your level - 1), follows behind you, assists your attack target or anything fighting near you, never forages or quests, and respawns beside you 8 s after going down. Only the online party's leader may keep helpers; online players take helper slots (a helper steps aside when a player joins a full party). Helpers are not saved (the Wayfarer roster is rolled each session). |
| Online party | Leader-authoritative over the relay: `pinv` invite, `pans` answer, `prost` roster (leader to each member), `pleave` leave/kick/disband, `pchat` party chat. Leader leaves or drops: the lowest remaining player id leads. Not persisted; going offline ends it. |
| Shared kills | A gnome shares a kill when it is in the party and within 60 m of the dead enemy (same zone for players). Each player gets `killXp x killShare(players, helpers)`, `killShare = (1 + 0.3 x (players - 1)) / (players + 0.25 x helpers)`, solo = 1. Examples: 2 players 0.65 each, 1 player + 1 helper 0.8, 1 player + 3 helpers 0.57, 4 players 0.475 each. Shared kills also count for kill quests. The killer keeps the normal loot pile; each other online party member in range rolls a personal pile at `share` (drop chance and gold x share). |
| Chat | Public chat already exists (`src/net/mmo.ts`, `src/ui/online.ts`). Added: party chat (relay, censored on receipt with `@lawn/mp/textFilter`), and helpers answer party lines that mention following, help or thanks. |
| Emotes | `@lawn/emotes`: the player's loadout (`loadMyEmotes()`, at least `wave` and `cheer`) as chips in the chat box and `/wave`, `/cheer`, `/emote <id>`; relayed as `{ k: 'emo', e }`; remote gnomes play it. |
| Mobile | Every new action has a button of at least 44 px on touch (party button, panel buttons, invite prompt, channel toggle, emote chips). Checked at 390x844 and landscape 844x390. |
| Online | Yes, on the existing `gnomomia` relay room (`@lawn/mp`, already in `GAMES`); no server change. New message kinds are ignored by older clients (the relay handler falls through), so `NET_VERSION` stays 2. |
| Achievements | `gnomomia-fellowship` (form a party), `gnomomia-road-friends` (party with another online player), `gnomomia-many-hands` (25 shared kills). Gnomomia's first achievements. |
| Party slice | No change: the backlog row `gnomomia-skirmish` says "later" and this feature does not make it easier. |

Not in scope: saving the party, party quest sharing beyond kill credit, need/greed loot rolls, voice, friend lists,
party markers on the minimap.

## For the other three Gnomomia roadmaps (sequencing notes)

- **Raids roadmap (NPC helpers after the second town):** read the party instead of always spawning helpers. Contract
  (from `games/gnomes-of-gnomomia/src/party/party.ts`, exists after Epic 1 as a stub, real after Epic 2):
  `partyMembers(): readonly PartyMember[]` (empty when not in a party, otherwise me first) and
  `onPartyChange(fn: () => void): void`. Suggested rule: spawn `max(0, RAID_HELPERS - (partyMembers().length - 1))`
  raid helpers. Wayfarers in the party already follow and fight, so a raid needs no extra code for them.
- **Adventurer idle/travel roadmap:** it and this roadmap both edit `src/companions.ts` (here: issue 1A appends two
  stub exports, issue 2B adds the `'party'` activity). Run its companions epic before this Epic 2, or re-check 2B's
  line references after it lands. 2B only adds a branch, a field and two exports; it does not change questing,
  travel or level code except to skip party members.
- **Rebalance roadmap:** this roadmap edits `src/progression.ts` (the `enemy-killed` handler multiplies kill XP by a
  share) and `src/events.ts` (optional `share` on `enemy-killed`). The constants live in `PARTY` in
  `src/party/partyLogic.ts`, so the sim can import them. Finding while reading: any local Wayfarer kill within 35 m
  of the player already gives the player full kill XP (`killEntity` emits `enemy-killed` whoever struck), party or
  not; this roadmap does not change that for non-party Wayfarers.
- **Quest roadmap:** this roadmap does not edit `src/quests.ts`. Shared kills reach it through the normal
  `enemy-killed` event (with an extra optional `share` field it can ignore).
- Shared files with any roadmap: `packages/achievements/src/catalog.ts` (1C appends three defs),
  `docs/lore/rulings.md` (1D appends one ruling; take the next free number at the time), `src/net/mmo.ts` and
  `src/net/protocol.ts` (1B, 2C), `src/player.ts` (2C: emote player only), `src/input.ts` (2E: one menu line),
  `src/ui/online.ts` (2E).

## Shape

| Epic | Done when | Issues |
|---|---|---|
| 0 Setup (planner) | `npm install` at the repo root (this worktree has no `node_modules`) | none |
| 1 Foundation | `npx tsc --noEmit -p games/gnomes-of-gnomomia`, `npm test -w games/gnomes-of-gnomomia`, `npm test -w packages/achievements`, `npm run lore` | 4: 1A party rules + stubs, 1B protocol, 1C achievements + deps, 1D lore |
| 2 Party, net, UI | `npm run build -w games/gnomes-of-gnomomia`, `npm test -w games/gnomes-of-gnomomia`, smoke check, phone-viewport check | 5: 2A party runtime, 2B Wayfarer helpers, 2C net + emotes, 2D party UI, 2E chat/commands/menu |

Files per issue (no file is under two issues in one epic):

| Issue | Files changed |
|---|---|
| 1A | `src/party/partyLogic.ts` (new), `src/party/partyLogic.test.ts` (new), `src/party/party.ts` (new stub), `src/ui/party.ts` (new stub), `src/companions.ts` (append two stubs) |
| 1B | `src/net/protocol.ts`, `src/net/partyProtocol.test.ts` (new) |
| 1C | `packages/achievements/src/catalog.ts`, `games/gnomes-of-gnomomia/package.json`, `src/party/partyAchievements.ts` (new); a prefab file under `packages/prefabs/src/catalog/` only if no free prefab fits |
| 1D | `docs/lore/entries/fescue/wayfarers.md`, `docs/lore/rulings.md` |
| 2A | `src/party/party.ts`, `src/party/party.test.ts` (new), `src/progression.ts`, `src/events.ts` |
| 2B | `src/companions.ts` |
| 2C | `src/net/mmo.ts`, `src/player.ts` |
| 2D | `src/ui/party.ts` |
| 2E | `src/ui/online.ts`, `src/input.ts` |

(`src/...` is `games/gnomes-of-gnomomia/src/...`.) After Epic 2 the planner also runs `npm install` once more (the
lockfile picks up the two new workspace deps), adds the plan to the Gnomomia row of `AGENT_INDEX.md`, records a demo
(`docs/demos.md`, GIF only, uploaded through the media-upload MCP) and opens the PR.

Checks that run in parallel: every issue uses `npx tsc --noEmit -p games/gnomes-of-gnomomia` and `vitest run` on
its own test file; none runs `vite build`. Only 2D and 2E start a dev server, on ports 5401 and 5402.

---

## Epic 1: Foundation

### 1A Party rules (pure) and stubs

~~~~text
Epic: 1 Foundation
Depends on: none

## Environment
- Working directory: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\taniwha (a git worktree; stay in it; do not commit).
- Git Bash: if `node` is not found, `export PATH="/c/Program Files/nodejs:$PATH"`. `npm install` was already run at the repo root.
- The game is `games/gnomes-of-gnomomia` (three.js + TypeScript, Vite). Paths below are relative to it unless they start with `packages/` or `docs/`.
- Other workers are editing other files of this game at the same time (src/net/protocol.ts, package.json, docs). Touch only the files under Change.
- Do not run `vite build` or `npm run build` (it writes dist/ and others are compiling). Use the commands under Done when.

## Goal
A pure module of party rules (sizes, kill sharing, who joins, where a helper walks, which enemy it fights, what it
says), with tests, plus stub files whose exports other workers will fill next: `src/party/party.ts`,
`src/ui/party.ts`, and two stub functions at the end of `src/companions.ts`.

## Read first
- src/companionLogic.ts: `CompanionPersonalityId` ('tryhard' | 'lorehound' | 'lootgoblin' | 'wanderer' | 'helper') and the style of a pure module with tests (src/companionLogic.test.ts).
- src/economy.ts: `enemyGoldRange(def: Pick<EnemyDef, 'level' | 'gold'>): [number, number]`.
- src/config.ts: `EnemyDef` (fields `loot: readonly LootDrop[]`, `gold`, `level`), `LootDrop` ({ item, chance, count? }), `InvSlot`, `ClassId`, `ZoneId`.
- src/entities.ts lines 727-745 (`killEntity`): how a normal loot roll works (drop.chance, drop.count ?? 1, gold in [lo, hi]).

## Change
- src/party/partyLogic.ts (new): exactly the exports in Contract. No imports of three, DOM, state or other runtime modules; only types from '../config' and '../companionLogic', and `enemyGoldRange` from '../economy'.
- src/party/partyLogic.test.ts (new, vitest): tests listed under Done when.
- src/party/party.ts (new): paste the STUB below verbatim.
- src/ui/party.ts (new): paste the UI STUB below verbatim.
- src/companions.ts: append the two COMPANION STUBS below at the very end of the file. Change nothing else in it.

## Contract

src/party/partyLogic.ts:

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
    export function killShare(players: number, helpers: number): number;

    /** Level a hired Wayfarer is set to: one below the player, at least 1. */
    export function helperLevel(playerLevel: number): number;

    /**
     * Would this Wayfarer join? helper, lorehound, wanderer: always. lootgoblin: rng() < 0.8.
     * tryhard: only if playerLevel >= companionLevel - 1 (rng not called).
     */
    export function wouldJoin(personality: CompanionPersonalityId, companionLevel: number, playerLevel: number, rng: () => number): boolean;

    /**
     * Where helper number `index` (0, 1, 2; taken modulo 3) stands: PARTY.followDist behind the player, fanned out.
     * Facing follows the game's convention: forward is (sin(facing), cos(facing)). Angle = facing + PI + [0, -0.75, 0.75][index % 3];
     * returns { x: px + sin(angle) * followDist, z: pz + cos(angle) * followDist }.
     */
    export function followSlot(px: number, pz: number, facing: number, index: number): { x: number; z: number };

    export interface AssistCandidate { id: number; x: number; z: number; dead: boolean; inCombat: boolean; enemy: boolean }

    /**
     * Which enemy a helper should fight. 1) playerTargetId, if a candidate with that id is an enemy, alive, and within
     * PARTY.assistTargetRange of (px, pz). 2) Otherwise the alive enemy with inCombat true nearest to (px, pz) within
     * `radius`. 3) Otherwise null.
     */
    export function pickAssistTarget(
      px: number, pz: number, playerTargetId: number | null, candidates: Iterable<AssistCandidate>, radius?: number,
    ): number | null;   // radius defaults to PARTY.assistRadius

    /**
     * A personal loot roll for a shared kill: each drop with rng() < drop.chance * share gives { item, count: drop.count ?? 1 };
     * gold = Math.round((lo + Math.floor(rng() * (hi - lo + 1))) * share) with [lo, hi] = enemyGoldRange(def).
     * Drops are rolled first, in order, then gold (one rng() call for gold).
     */
    export function rollPersonalLoot(
      def: Pick<EnemyDef, 'loot' | 'level' | 'gold'>, share: number, rng: () => number,
    ): { items: InvSlot[]; gold: number };

    /** The new leader when `leaving` leaves: the lowest remaining id, or null when fewer than 2 remain. */
    export function nextLeader(members: readonly number[], leaving: number): number | null;

    /**
     * Which hired helpers must go (ids, newest last) when the online party has `onlineCount` players.
     * Not the leader and onlineCount > 1: all of them. Otherwise keep the first max(0, PARTY.max - max(1, onlineCount))
     * and return the rest (helperIds is in hire order).
     */
    export function helpersToDismiss(onlineCount: number, helperIds: readonly number[], isLeader: boolean): number[];

    export type PartyLineKind = 'join' | 'decline' | 'leave' | 'follow' | 'help' | 'thanks';

    /** What a Wayfarer says in a party, by personality. Paste exactly (see PARTY_LINES below). */
    export const PARTY_LINES: Record<CompanionPersonalityId, Record<PartyLineKind, readonly string[]>>;

    /**
     * Which kind of line a helper answers a party chat line with, or null. Case-insensitive, tested in this order:
     * /\b(follow|come|on my way|this way)\b/ -> 'follow'; /\b(help|aggro|heal|save me)\b/ -> 'help';
     * /\b(thanks|thank you|ty|gg|nice|well done)\b/ -> 'thanks'; otherwise null.
     */
    export function helperReplyKind(text: string): 'follow' | 'help' | 'thanks' | null;

PARTY_LINES (verbatim):

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

STUB for src/party/party.ts (verbatim; every export keeps this signature when it is filled in later):

    // Parties: up to PARTY.max gnomes (me included) who share kills. Wayfarer helpers (src/companions.ts) are hired
    // locally; online players join through relay messages (src/net/protocol.ts: pinv, pans, prost, pleave, pchat).
    // STUB (Epic 1): every export has its final signature; Epic 2 fills the bodies.
    import type { ClassId, ZoneId } from '../config';
    import type { GnoMsg } from '../net/protocol';

    export interface PartyMember {
      /** self: me. npc: my hired Wayfarer. player: an online player. peer-npc: a Wayfarer the online leader hired. */
      kind: 'self' | 'npc' | 'player' | 'peer-npc';
      /** self: 0. npc: the companion id (localCompanions()). player: the online player id. peer-npc: -1. */
      id: number;
      name: string;
      level: number;
      classId: ClassId | null;
      hp: number;
      /** 0 when unknown (peer-npc): the party frame hides the HP bar. */
      hpMax: number;
      dead: boolean;
      zone: ZoneId | null;
      x: number;
      z: number;
      leader: boolean;
    }

    /** What the net layer tells the party about another online player. */
    export interface PartyPeer {
      id: number;
      name: string;
      color: number;
      zone: ZoneId | null;
      x: number;
      z: number;
      dead: boolean;
      level: number | null;
      classId: ClassId | null;
      hp: number | null;
      hpMax: number | null;
    }

    export interface PartyNetBridge {
      isOnline(): boolean;
      myId(): number;
      getPeer(id: number): PartyPeer | null;
      send(to: number, msg: GnoMsg): void;
      /** Shows a speech bubble over player `id` (my own id for me). */
      bubble(id: number, text: string): void;
    }

    export interface PartyInvite {
      pid: string;
      fromId: number;
      fromName: string;
      /** performance.now() ms. */
      expiresAt: number;
    }

    export function initParty(): void {}
    export function setPartyNet(_bridge: PartyNetBridge | null): void {}
    export function onPartyChange(_fn: () => void): void {}
    /** Empty when not in a party; otherwise me first, then online players, my helpers, the leader's helpers. */
    export function partyMembers(): readonly PartyMember[] { return []; }
    export function inParty(): boolean { return false; }
    /** True when solo or leading. */
    export function isPartyLeader(): boolean { return true; }
    export function isPartyPeer(_peerId: number): boolean { return false; }
    export function partyHelperIds(): readonly number[] { return []; }
    export function hireHelper(_companionId: number): boolean { return false; }
    export function dismissHelper(_companionId: number): void {}
    export function invitePlayer(_peerId: number): boolean { return false; }
    export function pendingInvite(): PartyInvite | null { return null; }
    export function acceptInvite(): void {}
    export function declineInvite(): void {}
    export function kickPlayer(_peerId: number): void {}
    export function leaveParty(): void {}
    export function sayToParty(_text: string): void {}
    export function partyKillShare(_entityId: number): number { return 1; }
    export function partyOnRemoteKill(_killerId: number, _syncKey: string): void {}
    export function handlePartyMessage(_fromId: number, _msg: GnoMsg): void {}
    export function handlePartyPeerLeft(_peerId: number): void {}
    export function handlePartyOffline(): void {}
    export function updateParty(_dt: number): void {}

UI STUB for src/ui/party.ts (verbatim):

    // Party UI: the 👥 dock button, the party frame, the party panel and the invite prompt. STUB until Epic 2.
    export function createPartyUi(_parent: HTMLElement): void {}
    export function updatePartyUi(): void {}

COMPANION STUBS appended to src/companions.ts (verbatim):

    /** Puts companion `id` into (on) or out of my party. False when there is no such companion. STUB until Epic 2. */
    export function setCompanionPartyMember(id: number, on: boolean): boolean {
      void id;
      void on;
      return false;
    }

    /** A speech bubble over companion `id` (shown only within plate range). STUB until Epic 2. */
    export function companionSay(id: number, text: string): void {
      void id;
      void text;
    }

## Done when
- `npx tsc --noEmit -p games/gnomes-of-gnomomia` passes (run from the repo root).
- `cd games/gnomes-of-gnomomia && npx vitest run src/party/partyLogic.test.ts` passes, with tests for:
  - killShare(1,0) === 1; killShare(2,0) ≈ 0.65; killShare(1,1) ≈ 0.8; killShare(1,3) ≈ 0.5714; killShare(4,0) ≈ 0.475; killShare(0,0) === 1.
  - helperLevel(1) === 1, helperLevel(10) === 9.
  - wouldJoin: tryhard level 10 refuses player level 8, accepts 9; lootgoblin with rng () => 0.9 refuses, () => 0.1 accepts; helper always.
  - followSlot(0, 0, 0, 0) ≈ { x: 0, z: -2.6 }; index 1 and 2 are mirror images in x.
  - pickAssistTarget: prefers the player's target in range; falls back to nearest in-combat enemy; ignores dead, non-enemy, not-in-combat and far ones; null when none.
  - rollPersonalLoot with rng () => 0 and share 0.5: every drop with chance > 0 drops, gold = Math.round(lo * 0.5).
  - nextLeader([3, 5, 9], 3) === 5; nextLeader([3, 5], 3) === null.
  - helpersToDismiss(1, [4, 2, 5], true) → []; (2, [4, 2, 5], true) → [5]; (3, [4, 2, 5], true) → [2, 5]; (2, [4, 2], false) → [4, 2].
  - helperReplyKind('follow me') 'follow', 'Help!' 'help', 'gg' 'thanks', 'hello' null.
  - every PARTY_LINES list is non-empty.

## Out of scope
- src/net/protocol.ts, package.json, packages/achievements, docs/lore (other workers own them).
- Any other change to src/companions.ts beyond appending the two stubs.
~~~~

### 1B Party and emote messages on the wire

~~~~text
Epic: 1 Foundation
Depends on: none

## Environment
- Working directory: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\taniwha (a git worktree; stay in it; do not commit).
- Git Bash: if `node` is not found, `export PATH="/c/Program Files/nodejs:$PATH"`. `npm install` was already run at the repo root (the workspace package `@lawn/emotes` resolves from node_modules; another worker adds it to the game's package.json at the same time).
- The game is `games/gnomes-of-gnomomia`. Paths below are relative to it.
- Other workers are editing other files of this game at the same time. Touch only the files under Change.
- Do not run `vite build` or `npm run build`.

## Goal
Gnomomia's relay protocol gains the party messages (invite, answer, roster, leave, party chat) and an emote
message, each with a reader that validates what comes off the wire, plus tests.

## Read first
- src/net/protocol.ts: the `GnoMsg` union (add to it), and the reader style (`finite`, `readTradeId`, `readLootSync`). Nothing in it may change shape.
- packages/mp/src/textFilter.ts: `tidyText(raw)`, `censorText(text)`, `CHAT_MAX` (120). Import path from the game: '@lawn/mp/textFilter' (src/net/mmo.ts already imports `checkName` from it).
- packages/emotes/src/catalog.ts: `isEmoteId(id: unknown): id is string`. Import from '@lawn/emotes'.
- src/net/trade.test.ts: test style.

## Change
- src/net/protocol.ts: add the types, union members and readers in Contract. Do not change `NET_VERSION` (older clients ignore unknown kinds).
- src/net/partyProtocol.test.ts (new): tests listed under Done when.

## Contract
Add to src/net/protocol.ts:

    import { CHAT_MAX, censorText, tidyText } from '@lawn/mp/textFilter';
    import { isEmoteId } from '@lawn/emotes';

    /** Most players in an online party (the leader included). */
    export const PARTY_WIRE_MAX = 4;
    /** A Wayfarer the leader hired, as members see it: [name, level]. */
    export type PartyHelperWire = [string, number];

Append to the `GnoMsg` union (keep the doc comments):

      /** Party invite from the (would-be) leader. pid = '<leaderId>:<seq>'. */
      | { k: 'pinv'; pid: string }
      /** The invited player's answer, sent to the inviter. */
      | { k: 'pans'; pid: string; ok: boolean }
      /** Leader -> each member: the party now. m = online member ids, leader included; h = the leader's Wayfarer helpers. */
      | { k: 'prost'; pid: string; lead: number; m: number[]; h: PartyHelperWire[] }
      /** Member -> leader: I left. Leader -> member: you are out (kicked, disbanded, or the party was full). */
      | { k: 'pleave'; pid: string }
      /** A party chat line, sent to each member. */
      | { k: 'pchat'; pid: string; t: string }
      /** An animated emote (@lawn/emotes id), broadcast to everyone. */
      | { k: 'emo'; e: string }

Readers (exported):

    /** A party id from the wire: a string of 3..32 chars matching /^\d+:\d+$/, else null. */
    export function readPartyId(raw: unknown): string | null;

    /**
     * A roster from the wire, else null. lead: integer 0..1e6. m: array of 2..PARTY_WIRE_MAX distinct integers 0..1e6
     * that includes lead; returned sorted ascending. h: array of at most PARTY_WIRE_MAX - 1 entries [name, level], name a
     * string (tidyText, then sliced to 24 chars, must be non-empty), level an integer 1..99; anything malformed -> null.
     */
    export function readPartyRoster(lead: unknown, m: unknown, h: unknown): { lead: number; m: number[]; h: PartyHelperWire[] } | null;

    /** A party chat line from the wire: tidyText, censorText, sliced to CHAT_MAX; null when not a string or empty after tidying. */
    export function readPartyChat(raw: unknown): string | null;

    /** An emote id from the wire when @lawn/emotes knows it, else null. */
    export function readEmoteId(raw: unknown): string | null;

## Done when
- `npx tsc --noEmit -p games/gnomes-of-gnomomia` passes (run from the repo root).
- `cd games/gnomes-of-gnomomia && npx vitest run src/net/partyProtocol.test.ts` passes, covering: readPartyId accepts '12:3', rejects '', 'x:1', 42, a 40-char string; readPartyRoster sorts members, rejects a list without the lead, duplicates, 5 members, a non-integer id, a helper with level 0 or 100, more than 3 helpers; readPartyChat trims and caps at 120 chars, returns null for '   ' and for 7; readEmoteId('wave') === 'wave', readEmoteId('moonwalk-nope') === null.
- `cd games/gnomes-of-gnomomia && npx vitest run src/net` (the existing net tests) still passes.

## Out of scope
- src/net/mmo.ts and src/net/trade.ts (no wiring yet; another epic does it).
- package.json (another worker adds @lawn/emotes to it).
~~~~

### 1C Achievements and dependencies

~~~~text
Epic: 1 Foundation
Depends on: none

## Environment
- Working directory: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\taniwha (a git worktree; stay in it; do not commit).
- Git Bash: if `node` is not found, `export PATH="/c/Program Files/nodejs:$PATH"`. `npm install` was already run at the repo root; do not run it again (the planner does after this epic).
- Other workers are editing other files of games/gnomes-of-gnomomia at the same time. Touch only the files under Change.
- Do not run `vite build` or `npm run build`.
- Repo rule: every achievement reward is its own prefab: one no other achievement uses (the catalog test fails on a shared one), with the matching `wear-*` use tag for its slot. If none fits, add a `PrefabDef` to the right file in `packages/prefabs/src/catalog/` (rules in `docs/roadmaps/prefab-library/_common.md`) and make `npm test -w packages/prefabs` pass.

## Goal
Gnomes of Gnomomia gets its first three achievements, for parties, and a small module the game calls to award them.
The game's package.json declares the two workspace packages the party feature uses.

## Read first
- packages/achievements/README.md: how a game adds achievements.
- packages/achievements/src/types.ts: `AchievementDef` ({ id, game, gameTitle, title, description, target?, reward?: { slot, prefabId, label, exclusive? }, emote? }).
- packages/achievements/src/catalog.ts: the `ACHIEVEMENTS` array (append at its end, before the closing `];`), and every `prefabId` already used (do not reuse one).
- packages/achievements/src/tracker.ts: `createAchievementTracker(options: { ui?: HTMLElement | null; store?; onUnlock? })` returns `{ unlock(id), increment(id, by?), isUnlocked(id) }`, all Promises. There is NO `game` option.
- packages/prefabs/src/catalog/ (browse the gear files for `wear-head`, `wear-back`, `wear-neck` tags) to pick unused prefabs.

## Change
- packages/achievements/src/catalog.ts: append three defs (game 'gnomes-of-gnomomia', gameTitle 'Gnomes of Gnomomia'):
  - id 'gnomomia-fellowship', title 'Fellowship', description 'Form a party in Gnomomia: ask a Wayfarer along or join another gnome.', reward: an unused 'neck' or 'back' prefab that suits travelling companions (label = the prefab's display name).
  - id 'gnomomia-road-friends', title 'Road Friends', description 'Be in a party with another online player in Gnomomia.', reward: an unused 'head' prefab.
  - id 'gnomomia-many-hands', title 'Many Hands', description 'Share 25 kills with your party in Gnomomia.', target 25, reward: an unused 'back' or 'hand' prefab, exclusive: true.
- games/gnomes-of-gnomomia/package.json: add `"@lawn/achievements": "*"` and `"@lawn/emotes": "*"` to dependencies (keep alphabetical order).
- games/gnomes-of-gnomomia/src/party/partyAchievements.ts (new): exactly the Contract.

## Contract
games/gnomes-of-gnomomia/src/party/partyAchievements.ts:

    // Gnomomia's party achievements (packages/achievements/src/catalog.ts). party.ts calls partyAchievement() from its events.
    import { createAchievementTracker, type AchievementTracker } from '@lawn/achievements';

    export type PartyAchievementEvent = 'formed' | 'online' | 'shared-kill';

    export const PARTY_ACHIEVEMENTS = {
      formed: 'gnomomia-fellowship',
      online: 'gnomomia-road-friends',
      sharedKill: 'gnomomia-many-hands',
    } as const;

    /** Records the event: 'formed' and 'online' unlock, 'shared-kill' increments by one. Never throws, never awaits. */
    export function partyAchievement(event: PartyAchievementEvent): void;

Implementation notes: create the tracker lazily on first call, inside try/catch, with
`{ ui: typeof document !== 'undefined' ? document.getElementById('ui') : null }`; if creating it throws, do nothing
(and do not retry every call: remember the failure). Call `void promise.catch(() => {})` on each unlock/increment so a
missing localStorage in tests cannot raise an unhandled rejection.

## Done when
- `npm test -w packages/achievements` passes.
- `npm test -w packages/prefabs` passes if you added a prefab.
- `npx tsc --noEmit -p games/gnomes-of-gnomomia` passes (run from the repo root).

## Out of scope
- Calling partyAchievement from the game (another issue does it in src/party/party.ts).
- Any other game's achievements; src/main.ts.
~~~~

### 1D Lore: Wayfarers who walk your road

~~~~text
Epic: 1 Foundation
Depends on: none

## Environment
- Working directory: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\taniwha (a git worktree; stay in it; do not commit).
- Git Bash: if `node` is not found, `export PATH="/c/Program Files/nodejs:$PATH"`. `npm install` was already run at the repo root.
- Other workers are editing game code at the same time. You only edit the two lore files under Change.
- Repo rule: follow docs/lore/canon.md and the Fescue setting; after any change under docs/lore/, `npm run lore` must pass.

## Goal
The lore records that Wayfarers will travel with a gnome who asks (a party), so the game's new party feature has a
canon footing.

## Read first
- docs/lore/entries/fescue/wayfarers.md: the entry to extend (front matter, sections "What gnomes say", "The truth", "In the games", "Loose threads").
- docs/lore/rulings.md: the format of a ruling (the last ones, R-132 to R-135 or later). Use the next free number when you write.
- docs/lore/canon.md: tone and the canon rules.

## Change
- docs/lore/rulings.md: append one ruling, titled like the others, saying: Wayfarers travel with a gnome who asks them, up to three at a time, and with other gnomes on the road; a band like that is called a party (plain word, used in the game UI). A party shares its fights: on Fescue a fight shared is work shared, so each gnome near the kill is reckoned a share of it. Wayfarers in a party keep the Bound-Peace like everyone else; they ask no pay (they say they like the company; loot goblins still ask). A Wayfarer who goes down gets up again beside the gnome they walk with. Entry: `wayfarers`.
- docs/lore/entries/fescue/wayfarers.md: add one bullet to "What gnomes say" (a short quote from Reeve Yarrow Burlap or another existing named gnome about Wayfarers tagging along; check the name with `npm run lore -- find <name>`), one sentence to "The truth" (they walk with a gnome who asks; see the new ruling), and one bullet to "In the games": "Parties (`src/party/`): the player can ask up to three Wayfarers along, or party with online players; party Wayfarers follow, fight beside the player and get up beside them. Kills near the party are shared." Add the ruling id to the entry if the entry lists rulings anywhere, and keep the front matter valid.

## Done when
- `npm run lore` passes.
- `npm run lore -- find party` lists the Wayfarers entry or the new ruling.

## Out of scope
- Any code. Any other lore entry.
~~~~

---

## Epic 2: Party, net, UI

Before starting: the planner re-reads `src/companions.ts` (the adventurer roadmap may have changed it) and corrects
2B's line references; checks that the 1A stubs and 1B protocol landed as written.

### 2A Party runtime

~~~~text
Epic: 2 Party, net, UI
Depends on: none

## Environment
- Working directory: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\taniwha (a git worktree; stay in it; do not commit).
- Git Bash: if `node` is not found, `export PATH="/c/Program Files/nodejs:$PATH"`. `npm install` was already run at the repo root.
- The game is `games/gnomes-of-gnomomia`. Paths below are relative to it.
- Four other workers are editing src/companions.ts, src/net/mmo.ts, src/player.ts, src/ui/party.ts, src/ui/online.ts and src/input.ts at the same time. They call the exports of src/party/party.ts by the signatures already in the stub: keep every exported name and signature exactly as it is.
- Do not run `vite build` or `npm run build`.

## Goal
src/party/party.ts goes from a stub to the real party: hiring and dismissing Wayfarer helpers, the online party
(invites, roster, leave, kick, leader hand-over), party chat with helper replies, shared kill XP and kill-quest credit,
personal loot for online party kills, and achievements. Kill XP is multiplied by the party share.

## Read first
- src/party/party.ts: the stub (types and signatures you must keep).
- src/party/partyLogic.ts: PARTY, PARTY_CHAT_COLOR, killShare, helperLevel (not needed here), wouldJoin, rollPersonalLoot, nextLeader, helpersToDismiss, PARTY_LINES, helperReplyKind.
- src/net/protocol.ts: GnoMsg kinds 'pinv' | 'pans' | 'prost' | 'pleave' | 'pchat', and readPartyId, readPartyRoster, readPartyChat.
- src/net/trade.ts lines 1-100 and 425-560: the pattern to copy (module state, `listeners` + notify, a net bridge set from mmo.ts, handleXMessage / handleXPeerLeft / handleXOffline). src/net/trade.test.ts: how to test with a fake bridge.
- src/progression.ts lines 50-70 (`initProgression`, the 'enemy-killed' handler) and src/events.ts ('enemy-killed' payload).

## Change
- src/events.ts: 'enemy-killed' payload becomes `{ defId: string; entityId: number; /** Set for a kill shared with a party member (party.ts): this gnome's XP multiplier. */ share?: number }`.
- src/progression.ts: add
      let killShareFn: ((entityId: number) => number) | null = null;
      /** party.ts registers the XP multiplier for kills on this client. */
      export function setKillShare(fn: ((entityId: number) => number) | null): void { killShareFn = fn; }
  and change the 'enemy-killed' handler to
      bus.on('enemy-killed', ({ defId, entityId, share }) => {
        const def = ENEMIES[defId];
        if (!def) return;
        const mult = share ?? (killShareFn ? killShareFn(entityId) : 1);
        grantXp(Math.round(killXp(def.level, def.rank) * mult));
      });
  Nothing else in progression.ts changes.
- src/party/party.ts: implement every export (rules below). Imports you need: `PLAYER_ID`, `UI`, `ClassId`, `ZoneId` from '../config'; `ENEMIES` from '../content'; `localCompanions`, `setCompanionPartyMember`, `companionSay` from '../companions'; `entityIdBySyncKey`, `getEntity`, `spawnLoot` from '../entities'; `bus`, `say` from '../events'; `player` from '../player'; `state`, `maxHp` from '../state'; `setKillShare` from '../progression'; `censorText`, `tidyText`, `CHAT_MAX` from '@lawn/mp/textFilter'; `partyAchievement` from './partyAchievements'; and partyLogic / protocol as above.
- src/party/party.test.ts (new): tests under Done when.

## Rules for party.ts
Module state:
    let net: PartyNetBridge | null = null;
    /** The online party, null when not in one. members includes me, sorted ascending. */
    let roster: { pid: string; lead: number; members: number[] } | null = null;
    /** The leader's helpers while I am a member (from 'prost'). */
    let peerHelpers: [string, number][] = [];
    /** My hired companion ids, in hire order. */
    const helpers: number[] = [];
    let incoming: PartyInvite | null = null;
    /** Invites I sent: peer id -> { pid, expiresAt }. */
    const outgoing = new Map<number, { pid: string; expiresAt: number }>();
    /** The pid I said yes to and wait a 'prost' for. */
    let joining: string | null = null;
    let seq = 1;
    let lastChatAt = -Infinity;
    const listeners: (() => void)[] = [];
  `notify()` calls every listener. Every function that changes state calls it.
  `me()` = net?.myId() ?? -1. `online()` = net !== null && net.isOnline() && me() >= 0.
  `peerName(id)` = net?.getPeer(id)?.name ?? 'A gnome'. `pick(list)` = random element.
  `companionById(id)` = localCompanions().find((c) => c.id === id).

- initParty(): setKillShare(partyKillShare). Safe to call once.
- setPartyNet(bridge): store it. onPartyChange(fn): push.
- inParty(): helpers.length > 0 || (roster !== null && roster.members.length > 1).
- isPartyLeader(): roster === null || roster.lead === me().
- isPartyPeer(id): roster !== null && id !== me() && roster.members.includes(id).
- partyHelperIds(): helpers.
- partyMembers(): [] when !inParty(). Otherwise, in this order:
  self { kind 'self', id PLAYER_ID, name 'You', level state.level, classId state.classId, hp state.hp, hpMax maxHp(), dead player.dead, zone state.zone, x/z player.position, leader isPartyLeader() };
  each roster member other than me with a peer from net.getPeer: { kind 'player', id, name, level ?? 1, classId, hp ?? 0, hpMax ?? 0, dead, zone, x, z, leader id === roster.lead } (skip ids with no peer);
  each helper with a companion: { kind 'npc', id, name, level, classId, hp, hpMax, dead, zone state.zone, x/z position, leader false };
  each peerHelpers entry: { kind 'peer-npc', id -1, name, level, classId null, hp 0, hpMax 0, dead false, zone null, x 0, z 0, leader false }.
- hireHelper(id): refuse (say why in UI.textDim, return false) when: no such companion or it is dead; already hired; distance from player > PARTY.inviteRange; roster has > 1 member and I am not the leader ("Only the party leader can ask Wayfarers along."); (roster?.members.length ?? 1) + helpers.length >= PARTY.max ("Your party is full."). If !wouldJoin(c.personality, c.level, state.level, Math.random): companionSay(id, pick(PARTY_LINES[c.personality].decline)); say(`${c.name} would rather not.`, UI.textDim); return false. If setCompanionPartyMember(id, true) returns false: return false. Else helpers.push(id); companionSay(id, pick(join)); say(`${c.name} joins your party.`, UI.good); partyAchievement('formed'); broadcastRoster(); notify; return true.
- dismissHelper(id): if hired: remove it, setCompanionPartyMember(id, false), companionSay(id, pick(leave lines)), say(`${name} leaves your party.`, UI.textDim), broadcastRoster(), notify.
- broadcastRoster() (internal): only when online() and roster && roster.lead === me(): msg { k: 'prost', pid, lead: me(), m: roster.members, h: helpers mapped to [name, level] from their companion }; net.send(id, msg) to every member except me.
- dropHelpersFor(onlineCount, isLeader) (internal): for each id in helpersToDismiss(onlineCount, helpers, isLeader): dismissHelper(id) but with the line `${name} steps aside for the party.`.
- invitePlayer(peerId): refuse with a UI.textDim message and return false when: !online() ("You are not online."); no peer; isPartyPeer(peerId); roster && roster.lead !== me() ("Only the party leader can invite."); (roster?.members.length ?? 1) >= PARTY.max; outgoing.has(peerId). pid = roster?.pid ?? (any pid already in outgoing values) ?? `${me()}:${seq++}`. net.send(peerId, { k: 'pinv', pid }); outgoing.set(peerId, { pid, expiresAt: performance.now() + PARTY.inviteTtlS * 1000 }); say(`You invited ${name} to your party.`, UI.textDim); notify; return true.
- pendingInvite(): incoming.
- acceptInvite(): if !incoming return. If roster has > 1 member, leaveParty() first. net.send(incoming.fromId, { k: 'pans', pid, ok: true }); joining = incoming.pid; incoming = null; notify.
- declineInvite(): send { k: 'pans', pid, ok: false } to incoming.fromId; incoming = null; notify.
- kickPlayer(peerId): only leader and member: net.send(peerId, { k: 'pleave', pid }); remove from members; if members.length < 2: roster = null else broadcastRoster(); say(`${name} was removed from the party.`, UI.textDim); notify.
- leaveParty(): if roster: if I lead: remaining = members without me; if remaining.length >= 2, send { k: 'prost', pid, lead: Math.min(...remaining), m: remaining, h: [] } to each of them, else send { k: 'pleave', pid } to the one left; if I do not lead: send { k: 'pleave', pid } to roster.lead. Then roster = null, peerHelpers = [], joining = null. Dismiss every helper. say('You left the party.', UI.textDim). notify.
- handlePartyMessage(from, msg): ignore unless online().
  - 'pinv': pid = readPartyId(msg.pid); null -> ignore. If (roster && roster.members.length > 1) || incoming || joining: send { k: 'pans', pid, ok: false } back. Else incoming = { pid, fromId: from, fromName: peerName(from), expiresAt: now + inviteTtlS * 1000 }; say(`${name} invites you to their party. Tap 👥 to answer.`, UI.quest).
  - 'pans': out = outgoing.get(from); ignore unless out and out.pid === readPartyId(msg.pid). outgoing.delete(from). ok false: say(`${name} said no to your invite.`, UI.textDim). ok true: if roster && (roster.pid !== out.pid || roster.lead !== me()) -> send { k: 'pleave', pid: out.pid } to from and stop. If !roster: roster = { pid: out.pid, lead: me(), members: [me()] }. If members.length >= PARTY.max: send pleave to from, say('Your party is full.'), stop. Add from (sorted); dropHelpersFor(members.length, true); broadcastRoster(); say(`${name} joined your party.`, UI.good); partyAchievement('formed'); partyAchievement('online').
  - 'prost': pid = readPartyId; r = readPartyRoster(msg.lead, msg.m, msg.h); ignore if either null. Accept only when (joining === pid && from === r.lead) or (roster && roster.pid === pid && (from === roster.lead || from === r.lead)). Not accepted -> ignore. If !r.m.includes(me()): roster = null, peerHelpers = [], say('You are no longer in the party.', UI.textDim). Else: const first = roster === null; roster = { pid, lead: r.lead, members: r.m }; peerHelpers = r.lead === me() ? [] : r.h; joining = null; if r.lead !== me() dropHelpersFor(r.m.length, false); if r.lead === me() and from !== me() broadcastRoster() (I was handed the lead: say('You lead the party now.', UI.quest)); if first: say(`You joined ${peerName(r.lead)}'s party.`, UI.good), partyAchievement('formed'), partyAchievement('online').
  - 'pleave': pid must equal roster?.pid, or equal joining (then: joining = null, say('That party is full.', UI.textDim), stop). If I lead and from is a member: remove from; members.length < 2 -> roster = null else broadcastRoster(); say(`${name} left the party.`, UI.textDim). Else if from === roster.lead: roster = null, peerHelpers = [], say('The party has broken up.', UI.textDim).
  - 'pchat': roster && pid === roster.pid && roster.members.includes(from): text = readPartyChat(msg.t); if text: say(`[Party] ${peerName(from)}: ${text}`, PARTY_CHAT_COLOR); net.bubble(from, text).
  - any other kind: ignore.
- handlePartyPeerLeft(id): outgoing.delete(id); if incoming?.fromId === id: incoming = null. If roster includes id: if id === roster.lead: nl = nextLeader(members, id); nl === null -> roster = null, peerHelpers = []; else roster = { pid, lead: nl, members: without id }, peerHelpers = [], and if nl === me(): broadcastRoster(), say('You lead the party now.', UI.quest). Otherwise remove id; members.length < 2 -> roster = null; else if I lead broadcastRoster(). notify.
- handlePartyOffline(): roster = null, peerHelpers = [], incoming = null, outgoing.clear(), joining = null; helpers stay. notify.
- sayToParty(text): t = tidyText(text).slice(0, CHAT_MAX); empty -> return. If !inParty(): say('You are not in a party. Tap 👥 to find one.', UI.textDim); return. If performance.now() - lastChatAt < PARTY.chatGapMs: say('Slow down a little.', UI.textDim); return. lastChatAt = now. If online() and roster has > 1 member: send { k: 'pchat', pid, t } to every member except me, and net.bubble(me(), censorText(t)). say(`[Party] You: ${censorText(t)}`, PARTY_CHAT_COLOR). Then kind = helperReplyKind(t); if kind and there is an alive hired helper: pick one at random and companionSay(id, pick(PARTY_LINES[c.personality][kind])).
- partyKillShare(entityId): e = getEntity(entityId); if !e return 1. players = 1 + number of roster members other than me whose peer is !dead, zone === state.zone and within PARTY.shareRadius of e.position (x/z). helpersNear = hired helpers alive within PARTY.shareRadius of e + (roster && roster.lead !== me() && leader peer within PARTY.shareRadius ? peerHelpers.length : 0). If players + helpersNear > 1: partyAchievement('shared-kill'). return killShare(players, helpersNear).
- partyOnRemoteKill(killerId, syncKey): only when isPartyPeer(killerId) and !player.dead. id = entityIdBySyncKey(syncKey); e = id !== undefined ? getEntity(id) : undefined; def = e && e.kind === 'enemy' ? ENEMIES[e.defId] : undefined; none -> return. If the distance from player to e > PARTY.shareRadius: return. share = partyKillShare(e.id). bus.emit('enemy-killed', { defId: def.id, entityId: e.id, share }) (progression and quests count it). loot = rollPersonalLoot(def, share, Math.random); if items or gold: spawnLoot(e.position.x + 0.6, e.position.z, loot.items, loot.gold). say(`Your party defeated the ${def.name}.`, UI.good).
- updateParty(dt): now = performance.now(). incoming expired -> send pans ok false, say(`The invite from ${incoming.fromName} ran out.`, UI.textDim), incoming = null. Each outgoing expired -> delete, say(`${name} did not answer.`, UI.textDim); if roster has only me then roster = null. Drop helper ids whose companion no longer exists (without lines). notify only if something changed. dt is unused (keep the parameter).

## Contract
Every export of src/party/party.ts keeps its stub signature. New export in src/progression.ts:
`export function setKillShare(fn: ((entityId: number) => number) | null): void`.
src/events.ts 'enemy-killed': `{ defId: string; entityId: number; share?: number }`.

## Done when
- `npx tsc --noEmit -p games/gnomes-of-gnomomia` passes (run from the repo root).
- `cd games/gnomes-of-gnomomia && npx vitest run src/party/party.test.ts` passes. Tests (fake bridge as in src/net/trade.test.ts; me = 1, peers 2 and 3 in zone state.zone near the player; reset state between tests by calling handlePartyOffline() and newGameState()):
  - invitePlayer(2) sends 'pinv'; handlePartyMessage(2, pans ok) makes inParty() true, isPartyLeader() true, and sends 'prost' with m [1, 2] to 2.
  - handlePartyMessage(2, pinv) sets pendingInvite(); acceptInvite() sends 'pans' ok; a 'prost' from 2 with lead 2, m [1, 2] makes isPartyPeer(2) true and isPartyLeader() false; a 'prost' from 3 (not the leader) is ignored.
  - handlePartyPeerLeft(2) when 2 led [1, 2, 3]: I (1) lead and a 'prost' goes to 3.
  - 'pchat' from a member is shown (spy on bus 'message'), from a non-member is ignored.
  - handlePartyOffline() empties partyMembers().
- `cd games/gnomes-of-gnomomia && npx vitest run` (all game tests) passes.

## Out of scope
- src/companions.ts, src/net/mmo.ts, src/ui/*, src/input.ts, src/player.ts (other workers).
- src/quests.ts (shared kills reach it through 'enemy-killed').
~~~~

### 2B Wayfarer helpers follow and fight

~~~~text
Epic: 2 Party, net, UI
Depends on: none

## Environment
- Working directory: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\taniwha (a git worktree; stay in it; do not commit).
- Git Bash: if `node` is not found, `export PATH="/c/Program Files/nodejs:$PATH"`. `npm install` was already run at the repo root.
- The game is `games/gnomes-of-gnomomia`. Paths below are relative to it.
- Other workers are editing src/party/party.ts, src/net/mmo.ts, src/player.ts, src/ui/* and src/input.ts at the same time. You own src/companions.ts only.
- Do not run `vite build` or `npm run build`.

## Goal
A Wayfarer (AI companion) put into the player's party follows the player, fights what the player fights (or anything
fighting near the player), is set to the player's level minus one, does not forage, admire, stroll or quest, and
gets up beside the player after going down. Taken out of the party, it goes back to questing.

## Read first
- src/companions.ts (whole file; line numbers below are from before your change): `Companion` (78-122), `Activity` type (43), `maxHpForLevel` (143), `sayBubble` (148), `followTargetWithPath` (325), `respawnAtShrine` (369), `swingAtEnemy` (400), `checkPlayerTown` (566), `stepCompanion` (622-725: dead branch 629-646, activity dispatch 677-700, stuck handling 702-714), `refreshQuestAssignments` (727), `initCompanions` (743), and the two STUB functions at the end of the file (`setCompanionPartyMember`, `companionSay`), which you replace.
- src/party/partyLogic.ts: PARTY (followDist, catchUpDist, teleportDist, assistRadius, helperRespawnS), helperLevel, followSlot, pickAssistTarget, AssistCandidate.
- src/entities.ts: `allEntities()`, `getEntity(id)`, `isTownFight(id)`; src/towns.ts: `townAt(x, z)`.
- src/player.ts: `player.action` (an attack is `{ type: 'attack', target: entityId }`), `player.facing`, `player.dead`, `player.position`.

## Change (src/companions.ts only)
- `type Activity = 'quest' | 'forage' | 'admire' | 'stroll' | 'party';`
- `Companion` gets `inParty: boolean` (init false in initCompanions).
- Replace the two stubs with real bodies (same signatures):
  - `setCompanionPartyMember(id, on)`: c = companions.find((o) => o.id === id); none -> false. on: c.inParty = true; c.activity = 'party'; c.targetEntityId = null; c.strollTarget = null; c.path = []; c.pauseTimer = 0; syncHelperLevel(c); if c.zone !== state.zone or it is farther than PARTY.teleportDist from the player: placeBesidePlayer(c). off: c.inParty = false; c.activity = 'quest'; assignQuest(c). Return true.
  - `companionSay(id, text)`: find it; sayBubble(c, [text], 1).
- New internal helpers:
  - `syncHelperLevel(c)`: lv = helperLevel(state.level); if c.level !== lv: c.level = lv; prev = c.hpMax; c.hpMax = maxHpForLevel(lv, c.classId); c.hp = Math.min(c.hpMax, Math.max(1, c.hp + (c.hpMax - prev))).
  - `partyIndex(c)`: companions.filter((o) => o.inParty).indexOf(c).
  - `placeBesidePlayer(c)`: s = followSlot(player.position.x, player.position.z, player.facing, partyIndex(c)); spot = findFreeSpot(s.x, s.z, 4); y = standY(spot.x, spot.z, heightAt(spot.x, spot.z)) ?? heightAt(spot.x, spot.z); c.zone = state.zone; c.position.set(spot.x, y, spot.z); c.lastProgressPos = { x: spot.x, z: spot.z }; c.path = []; c.stuckTimer = 0.
  - `stepParty(c, speed, dt, distToPlayer)`:
    1. syncHelperLevel(c).
    2. If player.dead: face the player and return.
    3. liveZone = zoneAt(c.position.x, c.position.z); if liveZone c.zone = liveZone. If c.zone !== state.zone or distToPlayer > PARTY.teleportDist: placeBesidePlayer(c); return.
    4. Assist: candidates = allEntities() mapped to { id, x, z, dead, inCombat, enemy: e.kind === 'enemy' } for entities within PARTY.assistTargetRange + 5 of the player; playerTarget = player.action?.type === 'attack' ? player.action.target : null; id = pickAssistTarget(player.position.x, player.position.z, playerTarget, candidates). If id !== null and the player stands in a town (townAt(player.position.x, player.position.z)) and !isTownFight(id): id = null (the Bound-Peace). If id !== null: e = getEntity(id); if alive: d = distance; d > MELEE_RANGE -> followTargetWithPath(c, e.position.x, e.position.z, speed * 1.15, dt); else swingAtEnemy(c, e, distToPlayer). Return.
    5. Follow: s = followSlot(player.position.x, player.position.z, player.facing, partyIndex(c)); d = distance to s; d > 0.8 -> followTargetWithPath(c, s.x, s.z, d > PARTY.catchUpDist ? speed * 1.3 : speed, dt); else c.facing = player.facing.
- `stepCompanion`:
  - dead branch: a party member uses PARTY.helperRespawnS (set where `hurt` sets respawnS: in `hurt`, `c.respawnS = c.inParty ? PARTY.helperRespawnS : RESPAWN_S`), and on getting up calls placeBesidePlayer(c) instead of respawnAtShrine(c) and keeps c.activity = 'party' (others unchanged).
  - dispatch: add `else if (c.activity === 'party') stepParty(c, baseSpeed, dt, distToPlayer);` before the 'stroll' branch.
  - stuck handling: the `placeAtQuestStart` re-placement must not run for a party member (add `!c.inParty &&`).
- `checkPlayerTown`: inside the forEach, `if (c.inParty) return;` first, so party members never stroll.
- `refreshQuestAssignments`: skip party members (`if (c.inParty) continue;`).
- Imports to add: `PARTY, followSlot, helperLevel, pickAssistTarget, type AssistCandidate` from './party/partyLogic'; `getEntity, isTownFight` from './entities' (allEntities is already imported); `zoneAt` is already imported from './terrain'.

## Contract
    export function setCompanionPartyMember(id: number, on: boolean): boolean;
    export function companionSay(id: number, text: string): void;
`localCompanions()`, `companionPoses()`, `initCompanions()`, `updateCompanions()` and `CompanionView` do not change.

## Done when
- `npx tsc --noEmit -p games/gnomes-of-gnomomia` passes (run from the repo root).
- `cd games/gnomes-of-gnomomia && npx vitest run src/companionLogic.test.ts src/townPeace.test.ts` passes.
- Reading stepCompanion: a companion with inParty never reaches stepQuesting, stepStrolling, the forage/admire switch or placeAtQuestStart.

## Out of scope
- src/companionLogic.ts and src/party/* (read only).
- Questing, travel, level-to-quest and stroll behaviour of companions not in a party.
~~~~

### 2C Net wiring and emotes

~~~~text
Epic: 2 Party, net, UI
Depends on: none

## Environment
- Working directory: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\taniwha (a git worktree; stay in it; do not commit).
- Git Bash: if `node` is not found, `export PATH="/c/Program Files/nodejs:$PATH"`. `npm install` was already run at the repo root.
- The game is `games/gnomes-of-gnomomia`. Paths below are relative to it.
- Other workers are editing src/party/party.ts (it keeps its stub signatures), src/companions.ts, src/ui/* and src/input.ts at the same time. You own src/net/mmo.ts and src/player.ts.
- Do not run `vite build` or `npm run build`.

## Goal
The relay carries the party: mmo.ts gives src/party/party.ts its net bridge, routes party messages to it, tells it
when players leave or the link drops, credits party kills, and ticks it. Gnomes can play animated emotes
(`@lawn/emotes`): mine locally and relayed, other players' on their models.

## Read first
- src/net/mmo.ts (whole file). Key places: `RemotePlayer` (91-116), `ensureModel` (259), `dropModel` (235), `detach` (412), `onServer` cases 'left' (468), 'relay' (477-600, 'ekill' at 529), 'chat' (602-608, the bubble formula), `initMmo` (655, `setTradeNet` at 708 is the pattern), `updateMmo` (839-913).
- src/party/party.ts: `PartyNetBridge`, `PartyPeer`, and the functions initParty, setPartyNet, handlePartyMessage, handlePartyPeerLeft, handlePartyOffline, partyOnRemoteKill, updateParty.
- src/net/protocol.ts: kinds 'pinv' 'pans' 'prost' 'pleave' 'pchat' 'emo', `readEmoteId`.
- packages/emotes/README.md and packages/emotes/src/player.ts: `createEmotePlayer(model)` -> { current, play(id): boolean, stop(), update(dt, moving?), setModel(model) }; `loadMyEmotes(): Promise<EmoteDef[]>`; `EMOTES` (each has `free?`), `type EmoteDef` ({ id, label, icon, ... }).
- src/player.ts lines 110-135 (`createPlayer`, where `player.model` is set) and 296-470 (`updatePlayer`).

## Change
- src/player.ts:
  - `let emote: EmotePlayer | null = null;` created with `createEmotePlayer(model)` right after `player.model = model` in createPlayer.
  - `export function playPlayerEmote(id: string): boolean` — false when player.dead, player.sitting, no model or `emote.play(id)` is false; else true.
  - In updatePlayer: in the dead branch and the sitting branches call `emote?.stop()`; after the attack/block pose in step 6 call `emote?.update(dt, velocity.lengthSq() > 0.09 || player.swing > 0 || player.action !== null)`.
- src/net/mmo.ts:
  - `RemotePlayer` gets `emote: EmotePlayer | null` (null in addRemote). ensureModel creates it with createEmotePlayer(model); dropModel sets it to null.
  - Extract the bubble code of the 'chat' case into `function setBubble(id: number, text: string): void` and use it there.
  - In initMmo, after setTradeNet: `setPartyNet({ isOnline, myId: () => me, getPeer(id) { ... }, send(to, msg) { if (!link || status !== 'online') return; link.send(to, msg); }, bubble: setBubble })`, getPeer returning `{ id, name, color, zone, x, z, dead, level: r.card?.level ?? null, classId: r.card?.classId ?? null, hp: r.card?.hp ?? null, hpMax: r.card?.hpMax ?? null }` (x/z/dead as in the trade bridge's getPeer), then `initParty()`. Also start `void loadMyEmotes().then((l) => { emotes = l; changed(); }, () => {})`.
  - `let emotes: readonly EmoteDef[] = EMOTES.filter((e) => e.free);` and `export function myEmotes(): readonly EmoteDef[] { return emotes; }`.
  - `export function playEmote(id: string): void` — if playPlayerEmote(id) and status === 'online' and link: link.send(null, { k: 'emo', e: id }).
  - 'left': call `handlePartyPeerLeft(m.id)` right after `handleTradePeerLeft(m.id)`.
  - detach(): call `handlePartyOffline()` right after `handleTradeOffline()`.
  - 'relay': route `d.k === 'pinv' || 'pans' || 'prost' || 'pleave' || 'pchat'` to `handlePartyMessage(m.from, d)`. 'emo': `const id = readEmoteId(d.e); if (id) r.emote?.play(id);`.
  - 'ekill': before `applyRemoteEnemyKill(d.e, d.by)`, read `const eid = entityIdBySyncKey(d.e); const wasAlive = eid !== undefined && getEntity(eid)?.dead === false;` and after it `if (wasAlive && d.by !== me) partyOnRemoteKill(d.by, d.e);` (import getEntity from '../entities').
  - updateMmo: call `updateParty(dt)` right after `updateTrade()`. In the remote loop, after applyAttackAndBlockPose / cosmetics, `r.emote?.update(dt, Math.hypot(vx, vz) > 0.3 || r.swing > 0 || isSitting || isDead)`.
- Imports: `createEmotePlayer, EMOTES, loadMyEmotes, type EmoteDef, type EmotePlayer` from '@lawn/emotes'; party functions from '../party/party'; `playPlayerEmote` from '../player'; `readEmoteId` from './protocol'.

## Contract
New exports: src/net/mmo.ts `playEmote(id: string): void`, `myEmotes(): readonly EmoteDef[]`; src/player.ts
`playPlayerEmote(id: string): boolean`. Wire messages: `{ k: 'emo', e: string }` broadcast (to null).

## Done when
- `npx tsc --noEmit -p games/gnomes-of-gnomomia` passes (run from the repo root).
- `cd games/gnomes-of-gnomomia && npx vitest run src/net` passes (existing animSync, enemySync, lootSync, trade tests).

## Out of scope
- src/party/party.ts (read only), src/ui/* (another worker adds the emote and party buttons), src/companions.ts.
- Changing any existing message shape or NET_VERSION.
~~~~

### 2D Party UI

~~~~text
Epic: 2 Party, net, UI
Depends on: none

## Environment
- Working directory: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\taniwha (a git worktree; stay in it; do not commit).
- Git Bash: if `node` is not found, `export PATH="/c/Program Files/nodejs:$PATH"`. `npm install` was already run at the repo root.
- The game is `games/gnomes-of-gnomomia`. Paths below are relative to it.
- Other workers are editing src/party/party.ts (keeps its stub signatures; returns empty data until it lands), src/net/mmo.ts, src/companions.ts, src/ui/online.ts and src/input.ts at the same time. You own src/ui/party.ts only. src/ui/online.ts will call your createPartyUi(parent) and updatePartyUi() (another worker adds those calls).
- Repo rules: mobile by default (every button at least 44 px tall and wide on touch, no hover-only UI, fits 390x844 portrait and 844x390 landscape, safe-area insets via EDGE); UI modules append their own container, never restyle or hide #ui.
- Do not run `vite build`. If you start the dev server for a look, use `npm run dev -w games/gnomes-of-gnomomia -- --port 5401` (another worker uses 5402) and stop it when done.

## Goal
src/ui/party.ts draws the party: a 👥 dock button, a party frame (members with HP bars), a party panel (members with
Dismiss/Kick, Leave, Wayfarers nearby with "Ask along", online gnomes nearby with "Invite"), and an invite prompt
(Join / No thanks).

## Read first
- src/ui/party.ts: the stub (keep both signatures).
- src/ui/layout.ts: TOUCH, compact(), EDGE, onLayout, dock(parent), dockBottom(), dockButton(parent, face, title).
- src/ui/online.ts lines 1-60 and 120-135 (`make` helper, `btnCss`, the who-list rows with a Trade button): copy the look (UI colours, fonts) from there.
- src/party/party.ts: partyMembers, inParty, isPartyLeader, isPartyPeer, partyHelperIds, hireHelper, dismissHelper, invitePlayer, pendingInvite, acceptInvite, declineInvite, kickPlayer, leaveParty, onPartyChange, PartyMember.
- src/party/partyLogic.ts: PARTY.inviteRange.
- src/companions.ts: `localCompanions(): readonly CompanionView[]` (id, name, personality, classId, position, level, hp, hpMax, dead); src/companionLogic.ts PERSONALITIES[p].label; src/data/classes.ts CLASSES[id].name; src/net/mmo.ts `remotePlayers()` (RemotePlayer: id, name, color, card, model) and `mmoStatus()`.

## Change (src/ui/party.ts only)
- createPartyUi(parent):
  - root container (`position: absolute; inset: 0; pointer-events: none; font-family: UI.font`), id `party-ui`, appended to parent.
  - Dock button: `dockButton(dock(parent), '👥', 'Party')`, id `party-button`; on TOUCH set width and minHeight to 44px. Click toggles the panel. While pendingInvite() is set, its border is UI.gold.
  - Party frame `#party-frame`: absolute, left EDGE.left, top `${dockBottom() + 4}px` (recomputed in onLayout and whenever it is redrawn), width 170px (150px when compact()), zIndex 4, pointer-events none, background UI.panelBg, border 2px UI.border, padding 4px 6px, font 12px (11px compact). One row per partyMembers() entry: a 👑 before the leader's name, the name, ` Lv ${level}`, and under it a 4px HP bar (fill = hp / hpMax, colour UI.good, under 30% UI.bad) unless hpMax is 0; a dead member's name in UI.textDim with ☠. Hidden when partyMembers() is empty or the panel is open.
  - Party panel `#party-panel`: absolute, left EDGE.left, top dockBottom() + 4, width 280px, maxWidth calc(100vw - 16px), maxHeight 55vh, overflowY auto, zIndex 7, pointer-events auto, panel styling as the who list in online.ts. Sections, each with a small heading:
    1. "Your party": members except self, each with a button: kind 'npc' -> "Dismiss" (dismissHelper(id)); kind 'player' and isPartyLeader() -> "Remove" (kickPlayer(id)); kind 'peer-npc' -> no button. When inParty(): a "Leave party" button (leaveParty()). When empty: "Nobody yet. Ask a Wayfarer along, or invite a gnome."
    2. "Wayfarers nearby": localCompanions() that are alive, not in partyHelperIds() and within PARTY.inviteRange of player.position: `${name} · Lv ${level} ${class name} · ${PERSONALITIES[personality].label}` and an "Ask along" button (hireHelper(id), then redraw). None: "No Wayfarers close by."
    3. "Gnomes online nearby" (only when mmoStatus() === 'online'): remotePlayers() with a model and !isPartyPeer(id): name in its colour and an "Invite" button (invitePlayer(id)). None: "No other gnomes close by."
    4. A hint line in UI.textDim: "Party chat: /p <text>. Wayfarers in your party follow you and join your fights. Kills near your party are shared."
    Buttons: font inherit, bold, UI.panelBgDark background, 1px UI.borderLight border, `touch-action: manipulation`, minHeight and minWidth 44px on TOUCH (padding 1px 6px otherwise).
    A close button "✕" at the top right of the panel (44px on touch). The panel also closes on Escape.
  - Invite prompt `#party-invite`: shown while pendingInvite() is set; absolute, top `${dockBottom() + 4}px`, centred horizontally (left 50%, translateX(-50%)), maxWidth calc(100vw - 16px), zIndex 8, pointer-events auto, panel styling, gold border. Text `${fromName} invites you to their party.` and a countdown in seconds, two buttons "Join" (acceptInvite()) and "No thanks" (declineInvite()), 44px on touch.
  - onPartyChange(redraw). Build DOM with createElement and textContent only (names come from other players: never innerHTML with them).
- updatePartyUi() (called every frame): cheap. Update the frame's HP bar widths and dead marks from partyMembers() without rebuilding when the member list (kinds+ids+names) is unchanged; rebuild when it changed. While the panel is open, rebuild its "nearby" sections at most once per second. Update the invite countdown and show/hide the prompt.

## Contract
    export function createPartyUi(parent: HTMLElement): void;
    export function updatePartyUi(): void;
Element ids: `party-ui`, `party-button`, `party-frame`, `party-panel`, `party-invite`.

## Done when
- `npx tsc --noEmit -p games/gnomes-of-gnomomia` passes (run from the repo root).
- Reading the file: every button has a 44px minimum on TOUCH; no innerHTML with names; nothing touches #ui's own style.
- (Optional, if the browser tools work) with the dev server on 5401, `?zone=mossbottom&offline` at 390x844: the 👥 button is in the dock. The panel only fills with data once the other Epic 2 issues land.

## Out of scope
- src/ui/online.ts (another worker calls your functions from it), src/main.ts, src/party/*, src/net/*.
~~~~

### 2E Chat commands, party channel, emote chips, invite menu

~~~~text
Epic: 2 Party, net, UI
Depends on: none

## Environment
- Working directory: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\taniwha (a git worktree; stay in it; do not commit).
- Git Bash: if `node` is not found, `export PATH="/c/Program Files/nodejs:$PATH"`. `npm install` was already run at the repo root.
- The game is `games/gnomes-of-gnomomia`. Paths below are relative to it.
- Other workers are editing src/party/party.ts and src/ui/party.ts (both keep their stub signatures), src/net/mmo.ts (adds `playEmote(id: string): void` and `myEmotes(): readonly EmoteDef[]`), src/player.ts and src/companions.ts at the same time. You own src/ui/online.ts and src/input.ts.
  Because mmo.ts gains playEmote/myEmotes in parallel, `tsc` may fail on those two imports until that worker lands; everything else must compile. If they are missing when you finish, say so in your report.
- Repo rules: mobile by default (touch targets at least 44 px, no hover-only UI, 390x844 and 844x390); never restyle #ui.
- Do not run `vite build`. If you start the dev server, use `npm run dev -w games/gnomes-of-gnomomia -- --port 5402` and stop it when done.

## Goal
The chat box speaks to the party (a Party/All channel toggle and `/p`), has emote chips, and new commands
(/p, /party, /invite, /leave, /wave, /cheer, /emote). The who list gets Invite buttons, the right-click / long-press
menu on another player gets "Invite to party", and the party UI is created and ticked from the online UI.

## Read first
- src/ui/online.ts (whole file): HELP, QUICK, refresh() (who-list rows with the Trade button, around line 120), command() (around 132), the composer (buildComposer, submit, keepFocus), createOnlineUi, updateOnlineUi (drawPlate for remote players).
- src/input.ts lines 250-268 (`openMenu`, the `hit.remotePlayer` branch).
- src/party/party.ts: inParty, isPartyPeer, invitePlayer, leaveParty, sayToParty, onPartyChange.
- src/ui/party.ts: createPartyUi(parent), updatePartyUi().
- packages/emotes/src/catalog.ts: `getEmote(id)`, `isEmoteId(id)`; `EmoteDef` has `id`, `label`, `icon`.

## Change
- src/ui/online.ts:
  - createOnlineUi: at the end, `createPartyUi(parent)`. updateOnlineUi: first line `updatePartyUi()`.
  - Who list (refresh): beside each row's Trade button add an "Invite" button with the same style, hidden when isPartyPeer(r.id); click -> hide the list, invitePlayer(r.id). On TOUCH both row buttons get minHeight 44px.
  - Channel toggle: `let channel: 'all' | 'party' = 'all'`. In the composer form, before the input, a button (id `chat-channel`) showing "All" or "Party" (party text in '#8fd0ff'), shown only while inParty(); click flips the channel (keepFocus on it). onPartyChange: when !inParty() set channel = 'all'; update the button. Placeholder text says "Say something to your party..." in the party channel. On TOUCH the button is at least 44px wide and tall.
  - submit(): a line starting with '/' -> command(); else channel === 'party' ? sayToParty(text) : sendChat(text).
  - Emote chips: a row under the QUICK chips: one chip per `myEmotes()` entry, text `${icon} ${label}`, click -> playEmote(id) and closeChat(). Rebuild the row when the composer opens (myEmotes() may load late). Same chip style as QUICK; on TOUCH minHeight 44px.
  - command(): add
    - 'p' and 'party': with text -> sayToParty(arg); without -> flip the channel and say which one is on.
    - 'invite': like 'trade' (find the online gnome by exact then prefix name) -> invitePlayer(target.id); without arg, say 'Type /invite <player name>, or tap 👥.'.
    - 'leave': leaveParty().
    - 'wave', 'cheer': playEmote(cmd). 'emote': with a known id (isEmoteId) -> playEmote(arg); otherwise list the ids in myEmotes().
    - HELP becomes: `Chat: ${TOUCH ? 'tap 💬' : 'Enter or 💬'}, type, send. Commands: /p <text> (party), /invite <name>, /leave, /wave, /cheer, /emote <id>, /name <new name>, /trade <name>, /who, /unstuck, /offline, /online.`
  - Name plates: a remote player who isPartyPeer gets the text prefixed with '★ '.
- src/input.ts, in openMenu's `hit.remotePlayer` branch, after the Trade line:
  `if (!isPartyPeer(rp.id)) opts.push({ label: \`Invite ${rp.name} to party\`, onSelect: () => invitePlayer(rp.id) });`
  (import invitePlayer and isPartyPeer from './party/party').
- Imports in online.ts: from '../party/party' (inParty, isPartyPeer, invitePlayer, leaveParty, sayToParty, onPartyChange); from './party' (createPartyUi, updatePartyUi); from '../net/mmo' add playEmote, myEmotes; from '@lawn/emotes' isEmoteId.

## Contract
Uses, does not define: party.ts exports (stub signatures), `createPartyUi(parent: HTMLElement): void`,
`updatePartyUi(): void`, mmo.ts `playEmote(id: string): void`, `myEmotes(): readonly EmoteDef[]`.
Element id added: `chat-channel`.

## Done when
- `npx tsc --noEmit -p games/gnomes-of-gnomomia` passes (run from the repo root), apart from the two mmo.ts imports noted in Environment if that worker has not landed yet.
- Reading the file: every new button is at least 44px on TOUCH; party text goes through sayToParty, public through sendChat.

## Out of scope
- src/ui/party.ts, src/party/*, src/net/mmo.ts, src/player.ts, src/companions.ts, src/main.ts.
~~~~

---

## End of Epic 2 (planner)

1. `npm install` at the repo root (lockfile picks up the two deps).
2. `npm run build -w games/gnomes-of-gnomomia` and `npm test -w games/gnomes-of-gnomomia`; `npm test -w packages/achievements`; `npm run lore`.
3. Dev server up (`npm run dev -w games/gnomes-of-gnomomia`), then
   `bash tools/smoke.sh "http://localhost:5291/?zone=mossbottom&offline" '#party-button' '#online-pill' '#chat-button'`.
4. By hand or headless at 390x844 and 844x390: open 👥, ask a Wayfarer along, walk: it follows; attack a beetle
   outside town: it joins; the frame shows its HP. Two tabs online (`npm run dev -w packages/mp-server`): invite,
   join, party chat, a shared kill gives both XP and quest credit, `/wave` shows on the other tab.
5. `npm run zfight` is not needed (no new scenery).
6. PR: say mobile yes (44 px targets, checked at phone viewports), online yes (relay messages on the existing
   `gnomomia` room), what was not tested (no real phone), and that the party is not saved. Demo GIF via the
   media-upload MCP.
