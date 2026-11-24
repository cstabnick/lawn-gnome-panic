# Crossover portals: the Gnomecino first

Goal: the Gnomecino in Gnome Theft Auto and the Gnomecino in Club Gnome are one building. A GTA player walks through
the velvet rope door in Turfton and is inside Club Gnome's Gnomecino, in the same room as the Club Gnome players
there; walking out puts them back at the rope in GTA, with what they won or bought recorded once. The mechanic
(`@lawn/portal`: stack, registry, ledger, hand-off protocol) is generic, so later buildings take a few lines.

Design and research answers (boot and navigation, multiplayer across games, gear, the stack, edge cases):
[docs/design/crossover-portals.md](../design/crossover-portals.md). Package rules: `packages/portal/README.md`.

Decision in one line: the visiting game frames the host game's interior page over itself (no reload), the instance
is the host game's own mp room, the origin page keeps a return stack in sessionStorage and a ledger in localStorage.

## Shape

| Epic | Done when | Issues |
|---|---|---|
| 0 Foundation (planner) | `npm test -w packages/portal`, `npx tsc --noEmit -p packages/portal` | planner: `packages/portal`, both games' package.json deps, the docs |
| 1 Integrations | `npx tsc --noEmit` for both games, `npm test -w packages/achievements`, `npm run lore` | 4 parallel |
| 2 Wire-up and two-client check (planner) | GTA `app.ts` hooks; both games build and test; smoke both; `node tools/portal-e2e.mjs` passes | planner |

Hot-file edits (planner, Epic 2), GTA `src/app.ts` only: import and create the door after `net`/`remotes`/`tracker`
exist, an early branch at the top of `frame()` while inside, the door prompt in the prompt chain and the E chain, and
`portal` on `window.__gta`. No edits to GTA's `net.ts`, `remotes.ts`, `types.ts`, `config.ts`, `hud.ts`, save files.
Club Gnome: `src/main.ts` (visitor mode, Issue 1.1).

## Epic 1 issues

Shared block pasted into every issue:

~~~~text
## Environment
Working directory C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\elkhorn (Git Bash; if node is not found:
export PATH="/c/Program Files/nodejs:$PATH"). Monorepo of browser games (Vite + TypeScript, vitest). Other workers
and other planners are editing other files (much of games/gnome-theft-auto) at the same time: touch ONLY the files
under Change. If tsc shows errors in files you did not touch, ignore them; your files must have none. Do not commit,
do not run `vite build` / `npm run build`, do not start servers or browsers unless the issue says so.

## Background: @lawn/portal (already built in packages/portal/src; do not edit it)
A crossover building: a door in game A opens game B's interior page in a full-screen iframe over game A (no reload).
- The Gnomecino portal: id 'gnomecino', host game 'club-gnome' (dev port 5197), doors: Club Gnome 'native',
  Gnome Theft Auto 'visit'. `import { GNOMECINO } from '@lawn/portal'`.
- Origin side: `createPortalHost({ game, ui, apply, returnLabel, onExit?, onShown?, title? })` returns
  { active, current, enter(portalId, ret: {x,y,z,yaw,extra?}, who?: { room?, name?, look? }): PortalFrame | null,
    exit(), resume(): { frame, settled, summary }, insideCount(portalId): number | null }.
  apply is a LedgerAdapter { chips?(delta), acorns?(delta), item?(id), achievement?(id), note?(text) }.
  onExit(frame, settled: LedgerEntry[], summary: string[]) runs once the player is back: put them at frame.ret.
  resume() at boot pops a frame left by a reload inside and settles leftover ledger entries.
- Host side (the interior page): `joinPortalVisit()` returns null on a normal load, or a PortalVisit
  { info: { portal, visit, from, depth, name, look, room }, framed, record(kind, { amount?, ref?, text? }),
    ready(), presence(inside), exit(reason?: 'door' | 'back') }.
  record kinds: 'chips' | 'acorns' (signed integer deltas), 'item' (ref = Oakcount item id),
  'achievement' (ref = achievement id), 'note' (text).
- LedgerEntry: { id, visit, portal, kind, amount?, ref?, text?, at, store }.
~~~~

### Issue 1.1: Club Gnome visitor mode (the interior side)

~~~~text
Epic: 1 Integrations
Depends on: none
(shared Environment + Background block)

## Goal
When Club Gnome is opened with ?portal=gnomecino&visit=... (by Gnome Theft Auto's Gnomecino door), it starts inside
the Gnomecino map in the normal Club Gnome room, reports what the player gains to the opening page, and its exit
door sends the player back instead of to the town square. A normal load plays exactly as before.

## Read first
- games/club-gnome/src/main.ts (whole file: startup, enterMap, usePortal, hud onTravel, frame(), the start block)
- games/club-gnome/src/config.ts: MapId, STORAGE, PortalDef
- packages/oakcount/src/oakcount.ts: getOakcount(), onOakcountChange(cb), winChips(n); OakState in ledger.ts
- packages/achievements/src/store.ts + types.ts: createAchievementStore().getState() -> { records: { [id]: { unlockedAt? } } }
- packages/gnome/src/resolve.ts: resolveLook({ id, character }) (character = a look code) returns GnomeLook | null
- packages/portal/src/child.ts

## Change
- games/club-gnome/src/portalVisit.ts (new): 
  export function watchVisitLedger(visit: PortalVisit): () => void
    Snapshot getOakcount() (acorns, chips, owned) now. onOakcountChange(s): acorns delta != 0 ->
    visit.record('acorns', { amount }), chips delta != 0 -> visit.record('chips', { amount }), every id in s.owned not
    in the snapshot -> visit.record('item', { ref: id }); then update the snapshot. Achievements: read the unlocked
    ids (records with unlockedAt) once at start, then every 2000 ms (setInterval); each newly unlocked id ->
    visit.record('achievement', { ref: id }). Returns a stop function (unsubscribe + clearInterval).
  export function visitorName(visit: PortalVisit): string | null — visit.info.name if checkName (from
    '@lawn/mp/textFilter') accepts it (return c.name), else null.
- games/club-gnome/src/main.ts:
  - After `await loadOakcount();`: `const visit = (() => { const v = joinPortalVisit(); return v && v.info.portal === 'gnomecino' ? v : null; })();`
    (import joinPortalVisit, type PortalVisit from '@lawn/portal').
  - startingName(): if visit, prefer visitorName(visit).
  - Look: if visit?.info.look and getMyGnome() is null, myCharacter = visit.info.look and
    myLook = resolveLook({ id: ME, character: visit.info.look }) ?? GNORMAN_LOOK.
  - Start map: if visit, mapId = 'gnomecino' (ignore the saved session map) and do not write STORAGE.map while
    visiting (in enterMap, skip the sessionStorage write when visit is set).
  - usePortal(p): if visit && p.to !== 'gnomecino': stop the walker, call visit.exit('door') and return (do not
    enterMap). Otherwise unchanged.
  - hud onTravel: if visit, hud.system('You are visiting from Turfton: walk out the door to go back.') and return.
  - Start block: if visit, skip showGuestPrompt(ui) and say
    hud.system(`Welcome to The Gnomecino, ${myName}! Walk out the door to go back to Turfton.`) instead of the
    usual welcome line; call watchVisitLedger(visit).
  - frame(): after the first world.render() call visit?.ready() once (a boolean flag). Every 1 s (accumulate dt) while
    mapId === 'gnomecino': visit?.presence(othersHere() + 1).
  - Debug hook, only when new URLSearchParams(location.search).has('debug'):
    (window as unknown as Record<string, unknown>).__club = {
      mapId: () => mapId,
      peersOn: (m: MapId) => { let n = 0; for (const x of peerMap.values()) if (x === m) n++; return n; },
      myId: () => net.myId,
      enterMap: (to: MapId) => enterMap(to, MAPS[to].spawn.x, MAPS[to].spawn.z),
      visit,
      exitPortal: () => { const p = map.portals.find((q) => q.to !== mapId); if (p) usePortal(p); },
      winChips: (n: number) => winChips(n),
    };
    (check net exposes myId; if not, use whatever net field holds my id, or drop myId.)
- games/club-gnome/README.md: a short "Visitors from other games (crossover portals)" section: ?portal=gnomecino
  starts in the Gnomecino, the exit door returns to the visiting game, gains are reported through @lawn/portal.

## Done when
- cd games/club-gnome && npx tsc --noEmit passes
- npm test -w games/club-gnome passes
- A normal load (no ?portal) behaves exactly as before (read your diff: every new branch is guarded by `visit`).

## Out of scope
packages/portal (read only), every other game, games/club-gnome/package.json (already has @lawn/portal).
~~~~

### Issue 1.2: GTA Gnomecino door module

~~~~text
Epic: 1 Integrations
Depends on: none
(shared Environment + Background block)

## Goal
A self-contained module games/gnome-theft-auto/src/portal/gnomecinoDoor.ts that puts a portal door at the
Gnomecino's velvet rope in Turfton: a prompt when on foot at the door, walking in opens the shared Gnomecino over the
game (via @lawn/portal), freezes nothing itself (app.ts does that by checking `active`), keeps the player's GTA pose
parked inside the building while in, fades the GTA audio out and back, and on the way out puts the player back
outside the door with a summary toast. The planner wires it into app.ts later; you do NOT edit app.ts.

## Read first
- games/gnome-theft-auto/src/interactables.ts (how a prompt/interact module looks)
- games/gnome-theft-auto/src/types.ts: Player (x, y, z, yaw, vehicle, airborne, respawn(x, z, yaw)), Hud.toast(text, ms?)
- games/gnome-theft-auto/src/net.ts: GtaNet.setPose(p: RemotePose), RemotePose fields
- games/gnome-theft-auto/src/audio.ts: getAudioOutput(): { ctx, master: GainNode, muted } | null
- packages/portal/src/host.ts, packages/oakcount/src/oakcount.ts (loadOakcount, winChips, spendChips, earnAcorns,
  spendAcorns, buyItem)

## Change
- games/gnome-theft-auto/src/portal/gnomecinoDoor.ts (new), exactly this API:
  import type { GtaNet } from '../net'; import type { Hud, Player } from '../types';
  export const GNOMECINO_DOOR = { x: 74.5, z: -30, range: 2.6 } as const;      // the rope's door, building west face
  export const GNOMECINO_RETURN = { x: 72.3, z: -30, yaw: -Math.PI / 2 } as const; // outside, facing west (forward = (sin yaw, cos yaw))
  export const GNOMECINO_INSIDE = { x: 84, z: -30 } as const;                   // parked pose, hidden by the walls
  /** The building's footprint (x 77..103, z -43..-17): GTA players parked in it count as inside. */
  export function insideFootprint(x: number, z: number): boolean
  export interface GnomecinoDoorDeps {
    ui: HTMLElement; hud: Hud; player: Player; net: GtaNet;
    remotes: { blips(): { x: number; z: number; name: string; id: number }[] };
    tracker: { unlock(id: string): Promise<unknown> };
    room: string | null; me: { name: string; code: string } | null;
  }
  export interface GnomecinoDoor {
    readonly active: boolean;
    readonly door: { x: number; z: number };
    /** Door prompt or null. Must cost almost nothing away from the door: return null at once when
        |dx| > 12 or |dz| > 12. Null when player.vehicle or player.airborne. heat > 0 ->
        'The Gnomecino: no heat past the rope'. Otherwise `Enter The Gnomecino` plus ` (${n} inside)` when n > 0,
        n = max(GTA remotes with insideFootprint(x, z), host.insideCount('gnomecino') ?? 0), recomputed at most
        every 0.5 s (cache it). */
    prompt(heat: number): string | null;
    /** E / action at the door. heat > 0: hud.toast("Big Lou: 'No heat past the rope.'"). Else enterNow(). */
    interact(heat: number): void;
    /** Every frame while active, instead of the world: net.setPose with the parked pose (x/z GNOMECINO_INSIDE,
        y = player.y, yaw = player.yaw, veh -1, tint 0, moving/aiming/hurt/chute false, ride null, pitch 0). */
    idle(dt: number): void;
    /** Walk in from where the player stands (tests use it). False when already inside. */
    enterNow(): boolean;
  }
  export function createGnomecinoDoor(deps: GnomecinoDoorDeps): GnomecinoDoor
  Implementation:
  - import { createPortalHost, getAchievement? } — use createPortalHost from '@lawn/portal' with game
    'gnome-theft-auto', ui, returnLabel 'Back to Turfton', title: (id) => getAchievement(id)?.title ?? id
    (getAchievement from '@lawn/achievements').
  - apply (LedgerAdapter): chips(d) -> void loadOakcount().then(() => d > 0 ? winChips(d) : spendChips(-d));
    acorns(d) same with earnAcorns / spendAcorns (these are Oakcount acorns, NOT GTA's economy acorns: never touch
    economy.ts); item(id) -> void loadOakcount().then(() => buyItem(id, 0, 'chips')); achievement(id) ->
    void deps.tracker.unlock(id); note(t) -> nothing (shown in the summary).
  - enterNow(): host.enter('gnomecino', { x: GNOMECINO_RETURN.x, y: player.y, z: GNOMECINO_RETURN.z,
    yaw: GNOMECINO_RETURN.yaw }, { room: deps.room, name: deps.me?.name ?? null, look: deps.me?.code ?? null });
    on success fade the master gain to 0 over 0.3 s (getAudioOutput(); remember the previous gain.value;
    use master.gain.setTargetAtTime(0, ctx.currentTime, 0.08)).
  - onShown: void deps.tracker.unlock('gta-gnomecino-visit').
  - onExit(frame, settled, summary): player.respawn(frame.ret.x, frame.ret.z, frame.ret.yaw); restore the gain
    (setTargetAtTime(previous, ...)); hud.toast(summary.length ? `Back from The Gnomecino: ${summary.join(', ')}`
    : 'Back on the Greenhouse Strip.', 5000); if the net of 'chips' entries in settled is > 0,
    void deps.tracker.unlock('gta-gnomecino-winnings').
  - On creation: const r = host.resume(); if r.frame, player.respawn at r.frame.ret and toast
    'You stepped back out of The Gnomecino.'
  - active = host.active.
- games/gnome-theft-auto/src/portal/gnomecinoDoor.test.ts (new, vitest, node env: no DOM): test insideFootprint
  (inside, outside, edges) and that GNOMECINO_DOOR and GNOMECINO_RETURN are outside the footprint and the INSIDE point
  is inside. Do not call createGnomecinoDoor in the test (it needs a DOM).

## Done when
- cd games/gnome-theft-auto && npx tsc --noEmit shows no errors in src/portal/
- cd games/gnome-theft-auto && npx vitest run src/portal passes

## Out of scope
app.ts, net.ts, remotes.ts, types.ts, config.ts, hud.ts, audio.ts, economy.ts (read only), packages/*,
games/gnome-theft-auto/package.json (already has @lawn/portal and @lawn/oakcount).
~~~~

### Issue 1.3: achievements and lore for the crossover

~~~~text
Epic: 1 Integrations
Depends on: none
(shared Environment block; the Background block is context only)

## Goal
Two GTA achievements for the crossover with unique cosmetic rewards, and the lore saying the two Gnomecinos are one
building.

## Read first
- packages/achievements/README.md (rules for rewards: each reward prefab used by no other achievement, slot matches
  its wear-* tag), packages/achievements/src/catalog.ts (look at the last 'gnome-theft-auto' entries for the format)
- docs/cosmetics.md (inventory of rewards) and packages/prefabs/src/catalog/casino.ts, club-gnome-shop.ts,
  gta-brands.ts (pick reward prefabs)
- docs/lore/entries/the-yard/gnomecino.md, docs/lore/entries/apocrypha/big-lou-gta.md, docs/lore/rulings.md (format
  at the top; the last ruling number at the bottom), docs/lore/canon.md

## Change
- packages/achievements/src/catalog.ts: append, next to the other 'gnome-theft-auto' entries, exactly two defs
  (use the Edit tool on a small unique anchor; other planners also append to this file):
  - id 'gta-gnomecino-visit', title 'Through the Velvet Rope', description 'Walk into The Gnomecino from Turfton.'
  - id 'gta-gnomecino-winnings', title 'House Money', description 'Walk out of The Gnomecino with more chips than you took in.'
  Both game 'gnome-theft-auto', gameTitle 'Gnome Theft Auto', each with a reward of a prefab no achievement uses yet
  (grep the catalog for the prefabId first), slot matching the prefab's wear tag. If none fits, add a small
  PrefabDef to packages/prefabs/src/catalog/casino.ts (follow the file's existing defs; rules in
  docs/roadmaps/prefab-library/_common.md) and run npm test -w packages/prefabs. Update docs/cosmetics.md if it lists rewards.
- docs/lore/entries/the-yard/gnomecino.md: add gnome-theft-auto to games, and under "In the games" a line: Gnome Theft
  Auto: the velvet rope on the Greenhouse Strip in Turfton (Big Lou's door) opens into this same hall; gnomes from
  Turfton and from the town square play at the same tables. Add the ruling to sources.
- docs/lore/entries/apocrypha/big-lou-gta.md: one line: the door behind his rope opens into the Gnomecino of the
  Yard; he turns away anyone with heat.
- docs/lore/rulings.md: append ONE ruling at the very end, numbered one above the highest R-number in the file at the
  moment you write it (re-read the tail right before editing; other planners append too):
  Question: Turfton's Gnomecino and Club Gnome's Gnomecino: two casinos or one?
  Ruling: one building with two front doors: Big Lou's velvet rope in Turfton and the town square door in the Yard.
  Whoever walks in, from either, is in the same hall. Chips stay chips: winnings never turn into Turfton acorns
  (the Oakcount rule: chips never buy acorns back).
  Applies to: club-gnome, gnome-theft-auto. Date: 2026-11-23. Why: the crossover portal (docs/design/crossover-portals.md).

## Done when
- npm test -w packages/achievements passes
- npm run lore passes
- (if you added a prefab) npm test -w packages/prefabs passes

## Out of scope
games/*, packages/portal, any other lore entry.
~~~~

### Issue 1.4: two-client end-to-end script

~~~~text
Epic: 1 Integrations
Depends on: none (the script is run by the planner after the epic)
(shared Environment + Background block)

## Goal
tools/portal-e2e.mjs: one headless browser in Club Gnome and one in Gnome Theft Auto, the same room code; the GTA
player walks into the Gnomecino and both see each other there; the visitor wins chips; the visitor walks out and is
back in GTA with the stack popped and the ledger applied once.

## Read first
- tools/gta-mp-e2e.mjs (copy its browser finding, launch args, open(), until(), check(), the exit code pattern)

## Contract (built by other issues at the same time; code against exactly this)
- Servers (started by whoever runs the script): mp relay `PORT=8797 node packages/mp-server/dist/server.mjs`,
  GTA vite on 5443, Club Gnome vite on 5444.
- Usage: node tools/portal-e2e.mjs [gtaUrl=http://localhost:5443/] [clubUrl=http://localhost:5444/] [mp=ws://localhost:8797/ws]
- Club Gnome page with ?debug exposes window.__club = { mapId(), peersOn(mapId), myId(), enterMap(mapId), visit,
  exitPortal(), winChips(n) }.
- GTA page with ?debug exposes window.__gta (player with x, z, respawn(x, z, yaw); net with myId) and
  window.__gta.portal = { active, door: {x, z}, enterNow(): boolean, prompt(heat) }.
- GTA opens the interior in an iframe with attribute data-portal="frame" (inside a div data-portal="layer");
  the frame's URL carries portal=gnomecino. Find it with page.frames().find((f) => f.url().includes('portal=gnomecino')).
- localStorage keys on the GTA page: 'lawn.portal.ledger.v1:gnome-theft-auto' (JSON { pending: [], applied: [ids] })
  and sessionStorage 'lawn.portal.stack.v1:gnome-theft-auto' (JSON { frames: [] }).

## Change
- tools/portal-e2e.mjs (new). Steps (fail with a clear message on each):
  1. ROOM = `PT${random 4 digits}`. Open club: `${club}?room=${ROOM}&debug&mp=${enc(mp)}`; wait for
     window.__club?.myId?.() != null; call __club.enterMap('gnomecino'); check mapId() === 'gnomecino'.
  2. Open gta: `${gta}?room=${ROOM}&no-intro&debug&quality=low&mp=${enc(mp)}&portalBase=${enc(club)}`; wait for
     __gta.net.myId != null; respawn the player at (portal.door.x - 1, portal.door.z); check prompt(0) starts with
     'Enter The Gnomecino'.
  3. enterNow() returns true; __gta.portal.active is true; wait (60 s) for the portal frame to exist and for
     frame.evaluate(() => window.__club?.mapId?.() === 'gnomecino' && window.__club.myId() != null).
  4. Both see each other: club page __club.peersOn('gnomecino') >= 1 and the frame's __club.peersOn('gnomecino') >= 1
     (until() up to 20 s).
  5. In the frame: __club.winChips(25). Wait until the GTA page's ledger book has an entry (pending or applied) of
     kind chips... (read the pending list: an entry with kind 'chips' and amount 25).
  6. In the frame: __club.exitPortal(). On the GTA page wait until __gta.portal.active === false; check the player is
     within 3 m of the door; the stack's frames is empty; the ledger has no pending entry and its applied list
     contains that chips entry's id exactly once.
  7. The club page's peersOn('gnomecino') drops back to 0 within 15 s (the visitor left the room).
  8. Reload the GTA page (same URL); after __gta.net exists, the ledger's applied list still holds the id once and
     pending is empty (nothing applied twice).
  9. No console errors on either page (ignore WebGL/GPU stall warnings and favicon 404s).
  Close both browsers in a finally block. Exit 1 on any failure, 0 otherwise, printing ok/FAIL lines.

## Done when
- node --check tools/portal-e2e.mjs passes (do NOT run it: the servers and the other issues are not ready).

## Out of scope
Every other file.
~~~~

## Epic 2 (planner)

1. `app.ts` wiring (listed above). 2. `npm run build` and `npm test` for both games, `npm test -w packages/portal`,
`npm test -w packages/achievements`, `npm run lore`. 3. `bash tools/smoke.sh` for both games. 4. Start mp-server
(8797), GTA (5443) and Club Gnome (5444) with `--strictPort`, run `node tools/portal-e2e.mjs`, kill everything.

## Open (not built)

- GTA party members are not offered to follow you in (they can walk in through the same door into the same room).
- The browser Back button is not hooked while inside.
- A Club Gnome player cannot walk out into Turfton (the Gnomecino's Club Gnome door is native, it exits to the
  town square). A future GTA-hosted building would add a visit door in Club Gnome the same way.
- No map icon count; the count is on the door prompt only.
