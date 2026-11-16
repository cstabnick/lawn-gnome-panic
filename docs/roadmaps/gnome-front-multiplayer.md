# Gnome Front: online multiplayer

Goal: up to 24 people play one conquest match over the shared matchmaking server (`packages/mp-server`, game id
`gnome-front`: 2-24 players, public queue or room code, join in progress). Humans take over bot slots, bots fill
the rest. Solo play is unchanged.

## Design

- **Host authority.** One browser (the server's `hostId`) runs bots, conquest, health, deaths, respawns, tickets
  and vehicle respawns, and sends a snapshot plus the events since the last one, 15 times a second.
- **Owner movement.** Each guest moves, aims, drives and fires its own soldier locally (no input lag), sends its
  state 15 times a second ('me'), and sends **damage claims** for its own hits. The host applies the claims.
- **Human slots.** `netState.humans` maps soldier slots to server player ids. The host decides them (team with
  fewer humans, lowest bot slot); guests copy them from snapshots. `applyHumans` sets `isPlayer`, `remote`, the
  name and `game.player`.
- **Lives.** Each soldier's spawn count (`netState.lives`) travels with 'spawn' events and 'me', so a guest's
  stale position from a previous life never drags a respawned soldier back.
- **Host leaves:** the server names a new host; it already has the world from snapshots and starts running it.
  **Guest loses the connection:** the page reloads after a message. **Host loses it:** it keeps playing solo.

## Shape

| Epic | Done when | Issues |
|---|---|---|
| 1. Foundation (written directly, not by workers) | `npm run build -w games/gnome-front` passes; solo smoke test OK | 0 (done) |
| 2. Net modules | build passes; two browsers on a local server play one match | 4, parallel |

Epic 1 (done): `isBot`, mutable `isPlayer`/`remote`/`name`/`botName` on soldiers, mutable `game.player`;
`net/state.ts` (netState, netLink, netHooks, lobby, applyHumans, freeSlot, r2, angleDelta, SMOOTH_RATE, SNAP_DIST);
`net/protocol.ts` (messages, `encodeEvent`); guest guards in `damageSoldier`, `damageVehicle`, `updateSoldiers`
(no respawns), `updateVehicles` (`simulatedHere`), `updateConquest` (visuals only); `markDead`, `placeSpawned`,
`spawnGrenade` helpers; remote throwers' grenades do no damage; HUD reads `game.player` live; `main.ts` wiring
(session, panel, `netHooks.startMatch`, the match keeps running while paused online); stubs for the four files below.

## Epic 2 issues

~~~~text
Epic: 2. Net modules
Issue: 2.1 net/session.ts: connection, lobby and roster
Depends on: none

## Environment
Repo: C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\gnome-front-mp (Git Bash). If node is not found:
export PATH="/c/Program Files/nodejs:$PATH". Do not run git commit. Do not start a dev server.
Three other workers are editing games/gnome-front/src/net/host.ts, net/guest.ts and ui/online.ts at the same time.
Change only games/gnome-front/src/net/session.ts.

## Goal
session.ts owns the WebSocket to the matchmaking server: it turns the online panel's requests into queueing,
tracks the match roster and the host, sets netState.role, and hands relay messages to host.ts or guest.ts.

## Read first
- games/gnome-front/src/net/session.ts: the stub; keep its exports exactly.
- games/gnome-front/src/net/state.ts: netState, netLink, netHooks, lobby, applyHumans. All shared state lives here.
- games/gnome-front/src/net/host.ts and net/guest.ts: only the HostSync / GuestSync interfaces (stubs now).
- games/gnaft/src/net.ts: functions join(), leave(), leaveRaft(), onServer(): the same connection pattern to copy
  (the `link === client` checks, connect().then(queue), onClose handling).
- packages/mp/src/protocol.ts: ServerMsg (welcome, queued, match, joined, left, host, relay, ended, error).

## Change
games/gnome-front/src/net/session.ts. Imports:
  import { createNetClient, serverUrl, type NetClient } from '@lawn/mp/client';
  import type { ServerMsg } from '@lawn/mp/protocol';
  import { applyHumans, lobby, netHooks, netLink, netState } from './state';
  import type { FrontMsg, GuestMsg, HostMsg } from './protocol';

createSession(game, host, guest) keeps `link: NetClient<FrontMsg> | null` and `queued: boolean`, and returns
{ update(dt) }:

update(dt):
1. If lobby.request !== null: take it, set lobby.request = null; 'leave' -> leave(); else join(req.name, req.code).
2. If lobby.status === 'in' or 'joining': netState.role === 'host' -> host.update(dt); 'guest' -> guest.update(dt).

join(name, code):
- url = serverUrl(); if '' -> lobby.status = 'error', lobby.message = 'Online play is not set up for this build.'; return.
- If lobby.status is 'in' or 'joining', return. Drop any old link (set link = null first, then old.drop()).
- client = createNetClient<FrontMsg>(url, 'gnome-front', { name, character: 'gnorman' }); link = client; queued = false.
- lobby.status = 'connecting'; lobby.message = ''; lobby.code = code.
- client.onMessage(m => { if (link === client) onServer(client, m); })
- client.onClose(() => { if (link !== client) return; if lobby.status is 'in' or 'joining': link = null;
  leaveMatch('Lost the connection to the match.'); else if queued: link = null; lobby.status = 'error';
  lobby.message = 'Lost the connection to the matchmaking server.'; })
- client.connect().then(() => { if (link !== client) return; queued = true; client.queue(code, 'gnorman', name);
  lobby.status = 'queued'; }, (err) => { if (link !== client) return; link = null; lobby.status = 'error';
  lobby.message = err instanceof Error ? err.message : 'Could not reach the matchmaking server.'; })

onServer(client, m: ServerMsg<FrontMsg>):
- 'queued': lobby.players = m.players; lobby.startsInS = m.startsInS; lobby.code = m.code; lobby.status = 'queued'.
- 'match': netLink.me = m.you; netLink.hostId = m.hostId; netLink.roster = m.players.map(p => ({ ...p }));
  netLink.send = (to, d) => { if (link === client) client.send(to, d); };
  If m.hostId === m.you: netState.role = 'host'; guest.reset(); host.reset(); host.reconcile(); lobby.status = 'in';
  netHooks.startMatch?.().
  Else: netState.role = 'guest'; host.reset(); guest.reset(); lobby.status = 'joining'
  (guest.ts sets 'in' and calls startMatch once the first snapshot places this player).
- 'joined': add m.player to netLink.roster unless its id is already there; if role 'host' -> host.reconcile().
- 'left': remove that id from netLink.roster; if role 'host' -> host.reconcile().
- 'host': netLink.hostId = m.hostId. If m.hostId === netLink.me and netState.role === 'guest': netState.role = 'host';
  guest.reset(); host.reset(); host.reconcile(); if lobby.status === 'joining' { lobby.status = 'in'; netHooks.startMatch?.(); }
- 'relay': role 'host' -> host.onRelay(m.from, m.d as GuestMsg); role 'guest' and m.from === netLink.hostId ->
  guest.onRelay(m.from, m.d as HostMsg).
- 'ended': if (link === client) link = null; client.drop(); if lobby.status is 'in' or 'joining' -> leaveMatch(m.reason);
  else lobby.status = 'error', lobby.message = m.reason.
- 'error': if lobby.status is not 'in' and not 'joining': lobby.status = 'error'; lobby.message = m.message.
- everything else: ignore.

leaveMatch(msg): const wasGuest = netState.role === 'guest';
  netLink.me = -1; netLink.hostId = -1; netLink.roster = []; netLink.send = () => {};
  host.reset(); guest.reset(); netState.humans = []; applyHumans(game, -1);
  If wasGuest: netState.role = 'solo'; lobby.status = 'error'; lobby.message = msg + ' Reloading...';
    setTimeout(() => location.reload(), 2500)   (the world on screen was the host's, so start fresh)
  Else: netState.role = 'solo'; lobby.status = 'off'; lobby.message = msg   (the host keeps playing; remote humans
    became bots again through applyHumans).

leave(): const old = link; link = null; if (old) { old.leave(); old.drop(); }
  if lobby.status is 'in' or 'joining' -> leaveMatch('You left the match.'); else { lobby.status = 'off'; lobby.message = ''; }
  Note: drop() runs the close listeners, but they return early because link !== client.

## Contract
Keep the stub's exports exactly:
  export interface Session { update(dt: number): void; }
  export function createSession(game: Game, host: HostSync, guest: GuestSync): Session
HostSync: reconcile(), onRelay(from, d: GuestMsg), update(dt), reset().  GuestSync: onRelay(from, d: HostMsg), update(dt), reset().
Other workers may be mid-edit in host.ts / guest.ts, but those keep these signatures.

## Done when
- npx tsc --noEmit -p games/gnome-front passes (run from the repo root).
- Reading session.ts, every ServerMsg case above is handled and every lobby.status change above is made.

## Out of scope
net/host.ts, net/guest.ts, net/state.ts, net/protocol.ts, ui/online.ts, main.ts, and every other file.
~~~~

~~~~text
Epic: 2. Net modules
Issue: 2.2 net/host.ts: run the match for everyone
Depends on: none

## Environment
Repo: C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\gnome-front-mp (Git Bash). If node is not found:
export PATH="/c/Program Files/nodejs:$PATH". Do not run git commit. Do not start a dev server.
Three other workers are editing net/session.ts, net/guest.ts and ui/online.ts at the same time.
Change only games/gnome-front/src/net/host.ts.

## Goal
On the host's browser, host.ts gives each human a soldier slot, applies the guests' 'me', damage, vehicle and
grenade messages to their soldiers, smooths the remote humans' movement, and sends a snapshot with the latest
events to everyone 15 times a second.

## Read first
- games/gnome-front/src/net/host.ts: the stub; keep its exports exactly.
- games/gnome-front/src/net/state.ts: netState (role, humans, lives), netLink (me, roster, send), applyHumans,
  freeSlot, r2, angleDelta, SMOOTH_RATE, SNAP_DIST.
- games/gnome-front/src/net/protocol.ts: SnapMsg, SoldierSnap, VehicleSnap, FlagSnap, GuestMsg, MeMsg, BIT_*,
  WEAPON_IDS, CAUSES, CLASS_IDS, SNAP_HZ, encodeEvent.
- games/gnome-front/src/config.ts: Soldier, Vehicle, FlagState, Game, GameEvent, weaponOf.
- games/gnome-front/src/vehicles.ts: enterVehicle, exitVehicle, damageVehicle, simulatedHere (exports only).

## Change
games/gnome-front/src/net/host.ts. Imports you will need:
  import * as THREE from 'three';
  import { weaponOf, type Game, type Soldier } from '../config';
  import { damageSoldier } from '../soldiers';
  import { damageVehicle, enterVehicle, exitVehicle, simulatedHere } from '../vehicles';
  import { spawnGrenade } from '../combat';
  import { angleDelta, applyHumans, freeSlot, lobby, netLink, netState, r2, SMOOTH_RATE, SNAP_DIST, type HumanSlot } from './state';
  import { BIT_ADS, BIT_GROUNDED, BIT_SPRINT, CAUSES, CLASS_IDS, encodeEvent, SNAP_HZ, WEAPON_IDS, type GuestMsg, type NetEvent, type SnapMsg } from './protocol';

State inside createHostSync(game):
- pending: NetEvent[] (events since the last snap).
- targets: Map<number /*soldierId*/, { x, y, z, yaw, pitch, bits }> from the latest 'me' of each remote human.
- vTargets: Map<number /*vehicleId*/, { x, z, yaw, speed }> for vehicles remote humans drive.
- snapAcc = 0.

Event capture (subscribe once in createHostSync with game.on(e => ...)):
- Only when netState.role === 'host' and lobby.status === 'in'.
- If e.type === 'spawn': netState.lives.set(e.soldier.id, (netState.lives.get(e.soldier.id) ?? 0) + 1) BEFORE encoding.
- const n = encodeEvent(e, (id) => netState.lives.get(id) ?? 0); if (n) pending.push(n).
- If pending.length > 600, drop the oldest 'shot' entries until it is 600 or less (never drop other kinds).

reconcile():
1. const roster = netLink.roster; const me = netLink.me.
2. Keep only slots whose playerId is still in the roster: netState.humans = netState.humans.filter(...).
3. If no slot has playerId === me: push { soldierId: game.player.id, playerId: me, name: <my roster name> }.
4. applyHumans(game, me).
5. For each roster player (join order) with no slot: const s = freeSlot(game); if (!s) break;
   if (s.vehicle) exitVehicle(game, s); push { soldierId: s.id, playerId: p.id, name: p.name }; applyHumans(game, me).
6. Delete targets / vTargets entries for soldiers that are no longer remote.

onRelay(from, d: GuestMsg):
- const slot = netState.humans.find(h => h.playerId === from); if none, ignore. const s = game.soldiers[slot.soldierId].
- 'me':  if (CLASS_IDS[d.cls]) s.nextClassId = CLASS_IDS[d.cls].
  Ignore the rest unless d.a === 1 and s.alive and d.life === (netState.lives.get(s.id) ?? 0).
  targets.set(s.id, { x: d.p[0], y: d.p[1], z: d.p[2], yaw: d.p[3], pitch: d.p[4], bits: d.p[5] }).
  If this is the first target for s (none before), copy it straight into s.pos / s.yaw / s.pitch.
  If d.veh >= 0 and d.vp and s.vehicle and s.vehicle.id === d.veh: vTargets.set(d.veh, { x: d.vp[0], z: d.vp[1], yaw: d.vp[2], speed: d.vp[3] }).
  Shots: for i = 0; i + 5 < d.sh.length; i += 6: game.emit({ type: 'shot', shooter: s, weapon: weaponOf(s).id,
    from: new THREE.Vector3(d.sh[i], d.sh[i+1], d.sh[i+2]), to: new THREE.Vector3(d.sh[i+3], d.sh[i+4], d.sh[i+5]) }).
- 'dmg': const victim = game.soldiers[d.v]; if (!victim) return; amount = Math.min(Math.max(d.d, 0), 1000);
  damageSoldier(game, victim, amount, s, CAUSES[d.c] ?? 'gun', d.h === 1, d.w >= 0 ? (WEAPON_IDS[d.w] ?? null) : null).
- 'vdmg': const v = game.vehicles[d.v]; if (v) damageVehicle(game, v, Math.min(Math.max(d.d, 0), 2000), s).
- 'enter': const v = game.vehicles[d.v]; if (v && v.alive && !v.driver && s.alive && !s.vehicle) enterVehicle(game, s, v).
- 'exit': if (s.vehicle) exitVehicle(game, s).
- 'gren': if (s.alive) spawnGrenade(game, s, new THREE.Vector3(...d.p), new THREE.Vector3(...d.vel)).
  (spawnGrenade emits 'grenadeThrown', which is forwarded; the explosion does no damage here because s.remote.)

update(dt): return unless netState.role === 'host'.
1. Smooth remote humans. k = 1 - Math.exp(-SMOOTH_RATE * dt). For each soldier s with s.remote && s.alive && !s.vehicle
   and a target t: if distance(s.pos, t) > SNAP_DIST copy t into s.pos; else remember the old pos, lerp each axis by k,
   then s.vel = (new - old) / dt (dt > 0). s.yaw += angleDelta(s.yaw, t.yaw) * k; s.pitch += (t.pitch - s.pitch) * k;
   s.sprinting = (t.bits & BIT_SPRINT) !== 0; s.grounded = (t.bits & BIT_GROUNDED) !== 0; s.ads = (t.bits & BIT_ADS) !== 0.
   Remote soldiers in a vehicle: only yaw/pitch from the target (updateSoldiers seats them on the vehicle).
2. Smooth vehicles: for each alive vehicle v with !simulatedHere(game, v) and a vTarget t: same lerp for x and z
   (snap if farther than SNAP_DIST), v.yaw += angleDelta(v.yaw, t.yaw) * k, v.speed = t.speed. Leave v.pos.y alone
   (updateVehicles sets it from the terrain).
3. snapAcc += dt; if snapAcc >= 1 / SNAP_HZ: snapAcc = 0; netLink.send(null, buildSnap()); pending = [].

buildSnap(): SnapMsg =
  { k: 'snap', t: r2(game.time), tk: [Math.ceil(game.tickets[0]), Math.ceil(game.tickets[1])],
    over: game.over ? 1 : 0, win: game.winner === null ? -1 : game.winner,
    hu: netState.humans.map(h => [h.soldierId, h.playerId, h.name]),
    s: game.soldiers.map(s => [r2(s.pos.x), r2(s.pos.y), r2(s.pos.z), r2(s.yaw), r2(s.pitch), Math.round(s.hp),
        s.alive ? 1 : 0, s.vehicle ? s.vehicle.id : -1, CLASS_IDS.indexOf(s.classId), s.kills, s.deaths,
        (s.sprinting ? BIT_SPRINT : 0) | (s.grounded ? BIT_GROUNDED : 0) | (s.ads ? BIT_ADS : 0)]),
    v: game.vehicles.map(v => [r2(v.pos.x), r2(v.pos.z), r2(v.yaw), r2(v.speed), Math.round(v.hp), v.alive ? 1 : 0,
        v.driver ? v.driver.id : -1, v.team]),
    f: game.flags.map(f => [r2(f.progress), f.owner === null ? -1 : f.owner, f.contested ? 1 : 0]),
    ev: pending }

reset(): pending = []; targets.clear(); vTargets.clear(); snapAcc = 0. (Do not clear netState.lives or netState.humans.)

## Contract
Keep the stub's exports exactly:
  export interface HostSync { reconcile(): void; onRelay(from: number, d: GuestMsg): void; update(dt: number): void; reset(): void; }
  export function createHostSync(game: Game): HostSync
The message shapes are fixed in net/protocol.ts and must not change (guest.ts decodes them).

## Done when
- npx tsc --noEmit -p games/gnome-front passes (run from the repo root).
- buildSnap's arrays follow SoldierSnap / VehicleSnap / FlagSnap in protocol.ts element by element.

## Out of scope
Every file except net/host.ts. Do not edit protocol.ts or state.ts; if something there seems wrong, say so in your report.
~~~~

~~~~text
Epic: 2. Net modules
Issue: 2.3 net/guest.ts: show the host's world, send my soldier
Depends on: none

## Environment
Repo: C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\gnome-front-mp (Git Bash). If node is not found:
export PATH="/c/Program Files/nodejs:$PATH". Do not run git commit. Do not start a dev server.
Three other workers are editing net/session.ts, net/host.ts and ui/online.ts at the same time.
Change only games/gnome-front/src/net/guest.ts.

## Goal
On a guest's browser, guest.ts applies the host's snapshots and events to the world, smooths everyone else's
movement, and sends this player's soldier ('me'), shots, damage claims, vehicle entries/exits and grenades to the host.
The guest's own soldier is moved by player.ts locally; guest.ts never moves it except when first placed.

## Read first
- games/gnome-front/src/net/guest.ts: the stub; keep its exports exactly.
- games/gnome-front/src/net/state.ts: netState (role, humans, lives), netLink (me, hostId, send), netHooks
  (sendDamage, sendVehicleDamage, startMatch), lobby, applyHumans, r2, angleDelta, SMOOTH_RATE, SNAP_DIST.
- games/gnome-front/src/net/protocol.ts: SnapMsg, NetEvent (every tuple layout is documented there), MeMsg,
  GuestOnlyMsg, BIT_*, WEAPON_IDS, CAUSES, CLASS_IDS, ME_HZ.
- games/gnome-front/src/config.ts: Soldier, Vehicle, Game, GameEvent (the event shapes you emit), TUNING.
- games/gnome-front/src/soldiers.ts (exports markDead, placeSpawned), combat.ts (export spawnGrenade),
  vehicles.ts (exports exitVehicle, simulatedHere). Exports only.

## Change
games/gnome-front/src/net/guest.ts. Imports you will need:
  import * as THREE from 'three';
  import { TUNING, type Game, type Soldier, type Team } from '../config';
  import { markDead, placeSpawned } from '../soldiers';
  import { spawnGrenade } from '../combat';
  import { exitVehicle, simulatedHere } from '../vehicles';
  import { angleDelta, applyHumans, lobby, netHooks, netLink, netState, r2, SMOOTH_RATE, SNAP_DIST } from './state';
  import { BIT_ADS, BIT_GROUNDED, BIT_SPRINT, CAUSES, CLASS_IDS, ME_HZ, WEAPON_IDS, type HostMsg, type NetEvent, type SnapMsg } from './protocol';

State inside createGuestSync(game): placed = false; applying = false; shots: number[] = [];
targets: Map<soldierId, { x, y, z, yaw, pitch }>; vTargets: Map<vehicleId, { x, z, yaw, speed }>; meAcc = 0.

In createGuestSync, set the damage hooks (core code only calls them on a guest, for game.player's own hits):
  netHooks.sendDamage = (c) => netLink.send(netLink.hostId, { k: 'dmg', v: c.victim.id, d: r2(c.amount),
    c: CAUSES.indexOf(c.cause), w: c.weapon ? WEAPON_IDS.indexOf(c.weapon) : -1, h: c.headshot ? 1 : 0 });
  netHooks.sendVehicleDamage = (id, amount) => netLink.send(netLink.hostId, { k: 'vdmg', v: id, d: r2(amount) });

Local actions (subscribe once with game.on(e => ...)); return if applying, if netState.role !== 'guest' or !placed:
- 'shot' with e.shooter === game.player: push r2 of from.x, from.y, from.z, to.x, to.y, to.z onto shots,
  unless shots.length >= 120.
- 'grenadeThrown' with e.thrower === game.player: send { k: 'gren', p: [r2 pos.x, y, z], vel: [r2 vel.x, y, z] } to netLink.hostId.
- 'enterVehicle' with e.soldier === game.player: send { k: 'enter', v: e.vehicle.id }.
- 'exitVehicle' with e.soldier === game.player: send { k: 'exit' }.

onRelay(from, d: HostMsg): only d.k === 'snap' exists. applySnap(d):
1. Humans: netState.humans = d.hu.map(([soldierId, playerId, name]) => ({ soldierId, playerId, name }));
   applyHumans(game, netLink.me).
2. First placement: if !placed and some slot has playerId === netLink.me: placed = true; const p = game.player;
   const row = d.s[p.id]; set p.pos from row[0..2], p.yaw = row[3], p.pitch = row[4], p.classId and p.nextClassId =
   CLASS_IDS[row[8]]; if row[6] === 0 { markDead(p) } else { p.alive = true; p.hp = row[5]; p.model.setDead(false); }
   lobby.status = 'in'; netHooks.startMatch?.().
3. game.time = d.t; game.tickets = [d.tk[0], d.tk[1]].
4. Events, in order, with applying = true (set back to false after, use try/finally). For each NetEvent n (see
   protocol.ts for the layouts; S(i) = game.soldiers[i] or null when i < 0; V(i) = game.vehicles[i]; vec = new THREE.Vector3):
   - 'shot': skip if S(n[1]) === game.player; emit { type: 'shot', shooter, weapon: WEAPON_IDS[n[2]], from: vec(n[3..5]), to: vec(n[6..8]) }.
   - 'hit': emit { type: 'hit', shooter: S(n[1]), victim: S(n[2]), damage: n[3], headshot: n[4] === 1 }.
   - 'vhit': emit { type: 'vehicleHit', shooter: S(n[1]), vehicle: V(n[2]), damage: n[3] }.
   - 'kill': victim = S(n[2]); if victim.alive markDead(victim); emit { type: 'kill', killer: S(n[1]), victim,
     cause: CAUSES[n[3]], weapon: n[4] >= 0 ? WEAPON_IDS[n[4]] : null, headshot: n[5] === 1 }.
   - 'spawn': s = S(n[1]); netState.lives.set(s.id, n[7]); targets.delete(s.id);
     placeSpawned(game, s, n[2], n[3], n[4], n[5], CLASS_IDS[n[6]]) (it emits 'spawn' itself).
   - 'gren': skip if S(n[1]) === game.player; spawnGrenade(game, S(n[1]), vec(n[2..4]), vec(n[5..7])).
   - 'vdead': v = V(n[1]); if v.alive: v.alive = false; v.hp = 0; v.speed = 0; v.respawnT = v.def.respawnS;
     v.model.group.visible = false; if v.driver { v.driver.vehicle = null; v.driver = null; }
     emit { type: 'explosion', pos: v.pos.clone(), radius: v.def.radius * 2 }; emit { type: 'vehicleDestroyed', vehicle: v, by: S(n[2]) }.
   - 'enter': skip if S(n[1]) === game.player; s.vehicle = V(n[2]); V(n[2]).driver = s; emit { type: 'enterVehicle', soldier: s, vehicle: v }.
   - 'exit': skip if S(n[1]) === game.player; if v.driver === s, v.driver = null; s.vehicle = null; emit { type: 'exitVehicle', soldier: s, vehicle: v }.
   - 'flag': emit { type: n[3] === 1 ? 'flagCaptured' : 'flagLost', flag: game.flags[n[1]], team: n[2] as Team }.
   - 'over': game.over = true; game.winner = n[1] as Team; emit { type: 'gameOver', winner: n[1] as Team }.
   Skip any event whose soldier or vehicle index is out of range.
5. Flags: for each i: f.progress = d.f[i][0]; f.owner = d.f[i][1] < 0 ? null : d.f[i][1] as Team; f.contested = d.f[i][2] === 1.
6. game.over = d.over === 1; game.winner = d.win < 0 ? null : d.win as Team.
7. Soldiers, for each i (row = d.s[i], s = game.soldiers[i]): s.kills = row[9]; s.deaths = row[10]; s.hp = row[5].
   - s === game.player (when placed): if row[6] === 0 && s.alive -> markDead(s). Nothing else (player.ts moves it).
   - any other s: s.classId = CLASS_IDS[row[8]] ?? s.classId.
     If row[6] === 0 && s.alive -> markDead(s). If row[6] === 1 && !s.alive -> s.alive = true; s.model.setDead(false);
     s.pos.set(row[0], row[1], row[2]) (a spawn we missed, e.g. joined mid-match).
     targets.set(s.id, { x: row[0], y: row[1], z: row[2], yaw: row[3], pitch: row[4] }); if no target existed before,
     also copy x/y/z/yaw/pitch straight into s.
     s.sprinting = (row[11] & BIT_SPRINT) !== 0; s.grounded = (row[11] & BIT_GROUNDED) !== 0; s.ads = (row[11] & BIT_ADS) !== 0.
     Vehicle seat: row[7] >= 0 -> s.vehicle = game.vehicles[row[7]]; that vehicle's driver = s.
     row[7] < 0 and s.vehicle -> if s.vehicle.driver === s, s.vehicle.driver = null; s.vehicle = null.
8. Vehicles, for each i (row = d.v[i], v = game.vehicles[i]): v.hp = row[4]; v.team = row[7] as Team.
   - row[5] === 0 && v.alive -> v.alive = false; v.model.group.visible = false; v.speed = 0.
   - row[5] === 1 && !v.alive -> v.alive = true; v.model.group.visible = true; v.pos.x = row[0]; v.pos.z = row[1]; v.yaw = row[2].
   - If simulatedHere(game, v) (this player drives it): if row[6] >= 0 && row[6] !== game.player.id, the host gave
     it to someone else: exitVehicle(game, game.player). Otherwise leave its position alone.
   - Else: vTargets.set(v.id, { x: row[0], z: row[1], yaw: row[2], speed: row[3] }) (copy straight in the first time);
     v.driver = row[6] >= 0 ? game.soldiers[row[6]] : null.

update(dt): return unless netState.role === 'guest'.
1. k = 1 - Math.exp(-SMOOTH_RATE * dt). Soldiers other than game.player, alive, not in a vehicle, with a target:
   snap if farther than SNAP_DIST, else lerp x/y/z by k and set s.vel = (new - old) / dt (dt > 0) so the walk cycle
   plays; s.yaw += angleDelta(s.yaw, t.yaw) * k; s.pitch += (t.pitch - s.pitch) * k.
2. Vehicles alive with !simulatedHere(game, v) and a vTarget: lerp x/z the same way (snap past SNAP_DIST),
   v.yaw += angleDelta(v.yaw, t.yaw) * k; v.speed = t.speed. Leave v.pos.y alone.
3. If placed: meAcc += dt; if meAcc >= 1 / ME_HZ: meAcc = 0; send to netLink.hostId:
   const p = game.player; const v = p.vehicle;
   { k: 'me', life: netState.lives.get(p.id) ?? 0, a: p.alive ? 1 : 0,
     p: [r2(p.pos.x), r2(p.pos.y), r2(p.pos.z), r2(p.yaw), r2(p.pitch), bits as in snapshots],
     cls: CLASS_IDS.indexOf(p.nextClassId), veh: v ? v.id : -1,
     ...(v ? { vp: [r2(v.pos.x), r2(v.pos.z), r2(v.yaw), r2(v.speed)] } : {}), sh: shots }; then shots = [].

reset(): placed = false; applying = false; shots = []; targets.clear(); vTargets.clear(); meAcc = 0.

TUNING is only needed if you use it; drop unused imports so tsc stays clean (noUnusedLocals is off, but keep it tidy).

## Contract
Keep the stub's exports exactly:
  export interface GuestSync { onRelay(from: number, d: HostMsg): void; update(dt: number): void; reset(): void; }
  export function createGuestSync(game: Game): GuestSync
The message shapes are fixed in net/protocol.ts and must not change (host.ts encodes them).

## Done when
- npx tsc --noEmit -p games/gnome-front passes (run from the repo root).
- Every NetEvent kind listed in protocol.ts is handled in applySnap.

## Out of scope
Every file except net/guest.ts. Do not edit protocol.ts, state.ts or the core modules; if something there seems
wrong, say so in your report.
~~~~

~~~~text
Epic: 2. Net modules
Issue: 2.4 ui/online.ts: the online panel on the title screen
Depends on: none

## Environment
Repo: C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\gnome-front-mp (Git Bash). If node is not found:
export PATH="/c/Program Files/nodejs:$PATH". Do not run git commit. Do not start a dev server.
Three other workers are editing net/session.ts, net/host.ts and net/guest.ts at the same time.
Change only games/gnome-front/src/ui/online.ts. Repo rule: UI modules append their own container to the shared
#ui element; never restyle or hide #ui itself.

## Goal
A compact panel at the bottom of the title screen: a name box, an optional room code box, QUICK MATCH, JOIN ROOM
and LEAVE buttons, and a status line. It talks to the network code only through the `lobby` object.

## Read first
- games/gnome-front/src/ui/online.ts: the stub; keep its exports exactly.
- games/gnome-front/src/net/state.ts: the Lobby interface and the `lobby` object (status, message, players,
  startsInS, code, request).
- games/gnome-front/src/ui/hud.ts lines 150-160: the title screen's CSS (#gf-title has z-index 20, yellow buttons
  #ffd23f with a 3px black border, "Trebuchet MS" 800 weight). Match that look.
- games/gnome-front/src/config.ts: DOM_IDS.online ('gf-online').

## Change
games/gnome-front/src/ui/online.ts:
- createOnlinePanel(root): inject a <style id="gf-online-style"> once (skip if it exists), build a <div id={DOM_IDS.online}>
  and root.appendChild it. Style: position absolute; left 50%; bottom 16px; transform translateX(-50%);
  width min(560px, calc(100vw - 32px)); z-index 30 (above the title overlay); pointer-events auto; dark translucent
  background rgba(10,20,10,.88); 2px solid #ffd23f border; border-radius 12px; padding 10px 14px; white text;
  same font as the title. Buttons smaller than PLAY: font-size 16px, padding 6px 14px, same yellow look.
- Contents, top to bottom:
  - A heading "PLAY ONLINE" (small, yellow) and a one-line hint "Up to 24 gnomes. Bots fill the empty spots."
  - A row: name <input> (maxlength 16, placeholder "Your name"), room code <input> (maxlength 8, placeholder
    "Room code (optional)", upper-cased and stripped to A-Z0-9 on every input event).
  - A row of buttons: QUICK MATCH, JOIN ROOM, LEAVE.
  - A status <div>.
- Name: initial value from localStorage 'gnome-front-name' (wrap every localStorage access in try/catch), else
  'Gnome' + a random number 100-999. Save it whenever a button sends a request.
- QUICK MATCH: lobby.request = { name: trimmed name or 'Gnome', code: null }.
- JOIN ROOM: the code must match /^[A-Z0-9]{4,8}$/; if not, show "Room codes are 4 to 8 letters or digits." in the
  status line and send nothing; else lobby.request = { name, code }.
- LEAVE: lobby.request = 'leave'.
- Keys typed in the inputs must not reach the game: add a keydown listener on each input that calls
  e.stopPropagation() (the game listens on window and calls preventDefault on Space and Tab).
- update() (called every frame): set the status text and which controls show, from lobby.status:
  - 'off': lobby.message if not empty, else ''. QUICK MATCH and JOIN ROOM shown, LEAVE hidden, inputs enabled.
  - 'connecting': "Connecting...". Only LEAVE shown; inputs disabled.
  - 'queued': `Waiting for players: ${lobby.players} here, starting in ${lobby.startsInS}s` plus
    ` (room ${lobby.code})` when lobby.code is set. Only LEAVE shown; inputs disabled.
  - 'joining': "Joining the match...". Only LEAVE shown.
  - 'in': hide the whole panel (display none) regardless of setVisible.
  - 'error': lobby.message in #ff8a80. QUICK MATCH and JOIN ROOM shown, LEAVE hidden, inputs enabled.
  Only touch the DOM when the text or state changed since the last frame (compare with the previous values).
  A local validation message (bad room code) stays until the next button press or lobby.status change.
- setVisible(v): the panel shows only while v is true and lobby.status !== 'in'.
- Phones: at max-width 600px use a single column (inputs full width, buttons wrap). Inputs: font-size 16px
  (stops iOS zoom on focus), padding 6px 8px, border-radius 6px, border 2px solid #000.

## Contract
Keep the stub's exports exactly:
  export interface OnlinePanel { setVisible(v: boolean): void; update(): void; }
  export function createOnlinePanel(root: HTMLElement): OnlinePanel
The panel's element id is DOM_IDS.online ('gf-online'); tools/smoke.sh checks for it.

## Done when
- npx tsc --noEmit -p games/gnome-front passes (run from the repo root).
- The panel never writes anything to `lobby` except `request`.

## Out of scope
Every file except ui/online.ts (hud.ts, main.ts and the net/ files belong to others).
~~~~
