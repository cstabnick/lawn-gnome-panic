# Gnome Theft Auto: online sync

Goal: what the 2026-11 batch left local per browser becomes shared online. Everyone in a room sees the same
emotes, rods, binoculars, street events, sky traffic and banner plane, hunting quarry, bird flocks and Sling-Lift
deliveries, and remote aircraft pitch and roll. Offline play does not change and costs nothing: with no peers the hub
returns straight away.

## How it works (foundation, written by the planner)

- `src/net.ts` (additive, backward compatible): tracks the server's `hostId` (`match`, `welcome.resumed`, `host`),
  `onHost`, a new `{ k: 'w', d: WireMsg }` message (`sendWire` / `onWire`), an aircraft attitude `r: [pitch, roll]`
  (signed bytes) on `pos` while flying, and the position bound raised from 700 to 950. At 700, players beyond 700 m on
  the 1800 m map had all their poses dropped.
- `src/online/protocol.ts`: `WireMsg` (`ent` records, `cmd` commands, `pay`), quantizers (positions in integer
  decimetres, angles as bytes), the activity codec. `parseWireMsg` rejects anything malformed or oversized.
- `src/online/authority.ts`: players are **ranked**: the server's host first, then lower id (join order).
  - **Lead** (street events, flocks, sky traffic): a player spawns new things only while no higher-ranked player is
    within 200 m. It gives the lead up at 200 m and takes it back past 260 m, so it does not flicker at the edge. Players
    far apart each lead their own patch, so nobody plays in an empty world.
  - **Owner** of a fixed thing (hunting quarry, which every client already has from the same seeded plan): the
    highest-ranked player within 220 m (kept to 280 m).
- `src/online/replicate.ts`: the generic channel. The **publisher** (owner) sends each peer only the entities within
  the system's interest radius of that peer, and only records that changed. Every 2 s it sends a keyframe, so a
  mirror never goes stale. A peer that is new or walks into range gets everything (its "sent" book starts empty). A
  message holds at most 48 records. The **mirror** (other clients) keeps the last record per owner and id, and removes
  anything not refreshed for 6 s.
- `src/online/hub.ts`: one per game. Peers' positions, the lead (recomputed 4x a second), one publisher and mirror per
  system at that system's rate, `cmd` and `pay` routing. When a player leaves, the hub waits 400 ms for the server's
  `host` message, then hands that player's mirrored entities to the adapters with `adopt(x, z)`: true where I am now
  the owner. If the last peer leaves while I am still connected, I adopt everything they had near me.
- `src/online/install.ts`: wires the hub and the six adapters. `app.ts` calls it once.

### Rates and sizes

| System | Owner | Radius | Rate | Record |
|---|---|---|---|---|
| Activity (emote, rod, binoculars) | each player | 300 m | 8 Hz, changes only | 12 ints + `emote\|rod` string |
| Hunting quarry | highest-ranked player within 220 m | 160 m | 5 Hz, changes only | ~13 ints |
| Bird flocks | lead that spawned it | 160 m | 4 Hz | ~13 ints |
| Sky traffic + banner | lead that spawned it | 650 m | 4 Hz | ~13 ints + ad id |
| Street events | lead that runs the director | 200 m | 6 Hz | header + one record per gnome, car or prop (+ look code or prefab id once) |
| Sling-Lift | the caller | 450 m | 8 Hz while flying | 11 ints |

Unchanged entities cost one keyframe every 2 s. Records are integers, so "did it change" is exact.

## Decisions: every system

| System | Before | Now | Notes |
|---|---|---|---|
| Player pose, vehicle, gun, glaze look, radio, parachute, ride seat | synced | unchanged | |
| Emotes (src/anim/, emote menu, `lawn:` emotes) | local | **synced**: each player's activity record (emote id + a start counter) | Remote gnomes play the same row through the animator. `playQuiet` fidgets are not sent. Pair animations stay NPC-only. Walk styles (`onMove`) are not sent. |
| Fishing (rod out, cast, bobber, hooked, landed) | local | **synced**: activity record (rod id, phase, charge, bobber) | The remote gnome holds the rod (fishPose) with bobber and line. Catches, cards and the journal stay with the angler. |
| Binoculars / scope pose | local | **synced**: activity record (mode scope, look yaw/pitch) | Remote gnome raises both hands to the eyes. |
| Remote riders' seat poses | none | **added**: `createRideAnimator` on remote riders and drivers | From the anim round 3 note. |
| Aircraft pitch/roll of other players | level | **synced**: `r` on `pos` | Riders in a remote aircraft see it bank. |
| Aircraft passenger seat | synced (seat book) | unchanged | Aircraft specs have `passengerSeats`. Remote aircraft now tilt. |
| Craft paint | synced as a glaze `look` | unchanged | Handling tuning is the pilot's physics, so others just see the pose. |
| Hunting quarry | local | **owner per quarry** (highest rank near it) | A guest's shot or comb goes to the owner as a `cmd`. The guest sees the result at once (prediction). The bag, journal and achievements stay with whoever combed. Trainer-spawned quarry (`?hunt=`, Spawn) get ids from 100000 and stay local. |
| Bird flocks | local | **lead spawns, others mirror** | Mirrored flocks flap and settle locally, steered by the owner's centre and target. A guest's flush is sent to the owner. Sightings, photos and the life list are the viewer's own. |
| Street events (23, actors, cars, props) | local | **lead runs the director, others see ghosts** | Guests can shoot an event's gnomes (crack) and cars (damage), which goes to the owner. When the event script pays, the guest who acted in the last 30 s is paid (`pay`). Ghost cars cannot be stolen. A guest's car does not knock event gnomes over. Events do not move to a new owner when the lead leaves: they end. |
| Sky traffic + banner plane | local | **lead spawns, others mirror** | Guests can damage planes and tear the banner (`cmd`). When the owner leaves, the new lead adopts its aircraft (same behaviour, placed where it was). Spray and smoke puffs are drawn only by the owner. |
| Sling-Lift chopper and load | local | **synced**: the caller publishes it | The delivered vehicle is a parked vehicle once down. Parked vehicles are not relayed (unchanged). |
| Perks | local | local, on purpose | Each player's own progress. |
| Save Trainer | local | local, on purpose | Spawned sky traffic, street events and flocks are ordinary entities of the player who spawned them, so others see them. Trainer quarry are local only. Progress edits stay local. |
| Traffic, police, NPC boats, critters, ambient gnomes | local | local | Out of scope; same as before. |
| Map blips of mirrored events and planes | n/a | not added | Map icons belong to another workstream. |

Host migration and late join: a late joiner gets everything near it on the next tick, because the publisher has no
book for it yet. When the host leaves, the server names the next host. The hub waits 400 ms for that, re-ranks, and
offers the leaver's entities to whoever now owns their spot. Sky traffic and flocks are adopted; quarry are owned by
position anyway; events end. Two clients never both adopt the same entity, because `adopt` is `pickOwner(x, z) === me`
over the same ranking.

## Shape

| Epic | Done when | Issues |
|---|---|---|
| 0 Foundation (planner) | `tsc` + `vitest run src/online src/net.test.ts` pass | (planner) |
| 1 Adapters | `npm run build -w games/gnome-theft-auto`, `npm test -w games/gnome-theft-auto` | 7 parallel |
| 2 Two-client check | `node tools/gta-mp-e2e.mjs` passes, results below | planner |

Hot-file edits (app.ts): import and call `installOnline`, `onlineSync?.noteEmote`, the `onWire` / `peerPose` /
`peerLeave` / `reset` forwards, `onlineSync?.update` after `net.setPose`, the `tilt` field on `setPose`,
`onlineSync?.hitTest` in the bullet chain, and `online`, `streetEvents`, `hunting` on `window.__gta` (debug).

## Epic 1 issues

Every issue starts with this shared block (pasted into each worker prompt):

~~~~text
## Environment
Working directory C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\elkhorn (Git Bash). If node is not found:
export PATH="/c/Program Files/nodejs:$PATH". Game: games/gnome-theft-auto (three.js + TypeScript, Vite, vitest).
Other workers and other planners are editing OTHER files of this same game at the same time: touch only the files
listed under Change. If `npx tsc --noEmit -p games/gnome-theft-auto` shows errors in files you did not touch, ignore
them (they are mid-edit) and make sure your own files have none. Do not commit, do not run `vite build` or `npm run
build`, do not start any server or browser. Keep every exported signature of the stub you fill exactly as it is.

## Online sync background (already built: do NOT edit src/online/protocol.ts, replicate.ts, authority.ts, hub.ts,
## install.ts, online.test.ts, or src/net.ts)
- One client OWNS an entity and publishes it as an integer record (number[], rec[0] = the entity id) plus an optional
  string. Every other client within the adapter's `radius` MIRRORS it. src/online/hub.ts calls your adapter
  (interface SyncAdapter):
  - collect(out, f): at `hz`, push an OwnedEnt { id, x, z, rec, str? } for each entity you own (x, z = where it is).
  - receive(ch, f): mirrors were added / changed / removed. ch.added / ch.changed / ch.removed are MirrorEnt
    { owner, id, rec, str, seenAt, sentAt, view? }. `view` is yours: keep your mesh or state there. Dispose the views
    of removed ones. f may be null.
  - command?(from, id, c, a): a peer asks you (the owner) to do command c to your entity id; a = integer args.
  - ownerGone(owner, ents, adopt): that owner left. For each ent, adopt(x, z) true = make it yours (simulate and
    publish it from now on), else dispose it.
  - update(dt, f): every frame while online.
  - hitTest?(x, y, z): a player bullet. Return true when it hit one of your mirrors (and send the command yourself).
  - reset(): back to offline: dispose every mirror view and restore local spawning. Offline, nothing else is called.
- SyncFrame f: { now (ms), myId, hostId, isHost, lead, me: {id, x, z}, peers: [{id, x, z}], ownerOf(x, z, current) }.
  f.lead = this client may spawn new things here. ownerOf = the highest-ranked player near (x, z), or null.
- SyncLink link (the first argument of your create function): link.command(owner, id, c, args?) sends a command to that
  entity's owner; link.pay(to, n, reason); link.online(); link.myId().
- Quantizers in src/online/protocol.ts (records must be integers): qPos(m) -> integer decimetres, uqPos(q) -> m;
  qAngle(rad) -> 0..255, uqAngle(q) -> rad; qSigned(v, max) -> -127..127, uqSigned(q, max); qUnit(0..1) -> 0..100,
  uqUnit(q). Also SYS codes, ACT, FISH_PHASES, RemoteActivity, encodeActivity, decodeActivity.
- Smooth mirrored motion with `Interp` from '@lawn/mp/interp': new Interp({ pos: [0, 1, 2], angles: [3], snapDist: 50 });
  interp.push(values, e.sentAt) on every record; interp.sample(out) each frame (returns false while it has no sample).
- The game must play exactly as before offline.
~~~~

### Issue 1.1: activity adapter (emote, rod, binoculars) + fishing wire hook

~~~~text
Epic: 1 Adapters
Depends on: none
(Paste the shared Environment + Online sync background block here.)

## Goal
Each player publishes one SYS.act record about what their hands are doing (emote, fishing rod, binoculars), and
mirrors are handed to remotes.setActivity so remote gnomes show it.

## Read first
- games/gnome-theft-auto/src/online/actSync.ts: the stub you fill (keep ActSyncDeps, ActSync and createActSync as they are).
- games/gnome-theft-auto/src/online/protocol.ts: ACT, RemoteActivity, encodeActivity, decodeActivity.
- games/gnome-theft-auto/src/online/hub.ts: SyncAdapter, SyncFrame, SyncLink.
- games/gnome-theft-auto/src/fishing/fishing.ts: the Fishing interface; inside createFishing: `active`, `s` (FishingState:
  phase, charge, bobX, bobY, bobZ), `env.rod` (the RodDef in hand, field `id`).
- games/gnome-theft-auto/src/anim/playerEmote.ts: PlayerEmote.active.

## Change
- games/gnome-theft-auto/src/fishing/fishing.ts: add to the Fishing interface and the returned object:
    /** Online (online/actSync.ts): the rod and line as other players should see them, or null while the rod is away. */
    wire(): { rod: string; phase: FishPhase; charge: number; bobber: { x: number; y: number; z: number } | null } | null;
  Implementation: active ? { rod: env.rod.id, phase: s.phase, charge: s.charge, bobber: (s.phase === 'wait' ||
  s.phase === 'bite' || s.phase === 'reel') ? { x: s.bobX, y: s.bobY, z: s.bobZ } : null } : null. Nothing else changes.
- games/gnome-theft-auto/src/online/actSync.ts: implement createActSync:
  - State: emoteId (string | null), emoteSeq (number, starts 0), a Set of owner ids whose activity was set, and a
    scratch THREE.Vector3 (import * as THREE from 'three', a value import).
  - noteEmote(id): emoteId = id; emoteSeq++.
  - collect(out, f): build a RemoteActivity:
    emote = d.emote.active ? emoteId : null; emoteSeq;
    const w = d.fishing.wire(); mode = w ? ACT.rod : d.birding.viewing() ? ACT.scope : ACT.none;
    rod = w?.rod ?? ''; phase = w?.phase ?? 'idle'; phaseT = 0; charge = w?.charge ?? 0; bobber = w?.bobber ?? null;
    lookYaw / lookPitch: only in ACT.scope, from d.camera.getWorldDirection(v): yaw = Math.atan2(v.x, v.z),
    pitch = Math.asin(clamp(v.y, -1, 1)); otherwise 0 and 0 (so the record does not change when the camera turns).
    const { rec, str } = encodeActivity(a); out.push({ id: 0, x: f.me.x, z: f.me.z, rec, str }).
  - receive(ch): for each added and changed e: d.remotes.setActivity(e.owner, decodeActivity(e.rec, e.str)) and add
    e.owner to the Set. For each removed e: d.remotes.setActivity(e.owner, null).
  - ownerGone(owner): d.remotes.setActivity(owner, null); delete owner from the Set.
  - update(): nothing.
  - reset(): setActivity(id, null) for every id in the Set; clear it. emoteSeq is kept.
  - radius 300, hz 8, sys SYS.act (as in the stub).
- games/gnome-theft-auto/src/online/actSync.test.ts (new): with plain fake deps objects (cast with `as unknown as
  ActSyncDeps`): (1) after noteEmote('wave') with emote.active true, collect pushes one record that decodeActivity reads
  back as emote 'wave', emoteSeq 1; (2) with fishing.wire() returning a rod in 'wait' with a bobber, mode is ACT.rod
  and the bobber round-trips within 0.1; (3) receive with an added MirrorEnt calls remotes.setActivity(owner, ...) and
  a removed one calls setActivity(owner, null); (4) reset clears what was set. Use a fake camera
  { getWorldDirection: (v) => v.set(0, 0, 1) }.

## Contract
remotes.setActivity(id: number, a: RemoteActivity | null) and remotes.activityOf(id) already exist (stubs; another
worker draws them). Fishing.wire() as above.

## Done when
- npx vitest run --root games/gnome-theft-auto src/online src/fishing passes.
- npx tsc --noEmit -p games/gnome-theft-auto shows no errors in fishing/fishing.ts or online/actSync*.ts.

## Out of scope
remotes.ts, src/anim/*, app.ts, every other src/online file.
~~~~

### Issue 1.2: remotes.ts draws activities, seat poses and aircraft tilt

~~~~text
Epic: 1 Adapters
Depends on: none
(Paste the shared Environment + Online sync background block here.)

## Goal
Remote players' gnomes show their emote, fishing rod with bobber and line, binocular pose, the seat/driver ride pose
(anim round 3), and a remote aircraft pitches and rolls as its pilot's does.

## Read first
- games/gnome-theft-auto/src/remotes.ts: the whole file (Puppet, updateDriver, updateRider, join/leave/clear, and the
  stubbed setActivity / activityOf at the end with the `acts` Map).
- games/gnome-theft-auto/src/online/protocol.ts: RemoteActivity, ACT.
- games/gnome-theft-auto/src/anim/animator.ts: createAnimator(), Animator.play(id) / stop() / cancel(model) /
  apply(model, dt) / active / current.
- games/gnome-theft-auto/src/anim/playerEmote.ts: how 'lawn:' ids play via createEmotePlayer from '@lawn/emotes'
  (setModel, play(id), stop(), update(dt, moving), current).
- games/gnome-theft-auto/src/fishing/fishPose.ts: createFishPose(): setRod(rod), apply(model, phase, phaseT, charge, dt),
  tip(model, out), clear(model). games/gnome-theft-auto/src/fishing/tackle.ts: RODS, rodById(id).
- games/gnome-theft-auto/src/anim/rideAuto.ts: createRideAnimator(): update(model, info, dt) / cancel(model);
  games/gnome-theft-auto/src/player.ts lines ~360-380 show how the local player fills the info
  (kind, flies, fixedWing, boat, closed = isClosed(v.spec) from './seats', seat, speedFrac, seed).
- games/gnome-theft-auto/src/net.ts: RemotePose.tilt?: { pitch, roll } (radians).

## Change (only games/gnome-theft-auto/src/remotes.ts, plus a test file)
- Puppet gets: act: RemoteActivity | null; anim: Animator (createAnimator()); lawn: EmotePlayer | null (created lazily
  with createEmotePlayer(p.model)); seq: number (last emoteSeq started, -1 at first); fish: FishPose | null (lazy);
  rodId: string; phase: string; phaseT: number (own clock, reset to 0 when act.phase changes); bobber: THREE.Mesh |
  null (SphereGeometry 0.07, MeshStandardMaterial white with a red top is optional, one colour is fine); line:
  THREE.Line | null (BufferGeometry with 2 points, LineBasicMaterial 0x222222), both added to the scene lazily;
  ride: RideAnimator (createRideAnimator()); riding: boolean.
- setActivity(id, a): store in `acts` (keep it) AND on the puppet if it exists; join() picks up a stored one.
- updateDriver, on foot and not chute, not hurt, y <= 2 (after the existing gun pose, before poseHands):
  - Emote: if act?.emote and act.emoteSeq !== p.seq: p.seq = act.emoteSeq; if it starts with 'lawn:' stop the animator
    (cancel) and lawn.play(id.slice(5)); else stop lawn and p.anim.play(id). If !act?.emote and (p.anim.active or a lawn
    emote plays): p.anim.stop(); lawn?.stop(). Every frame: p.anim.apply(p.model, dt); lawn?.update(dt, pose.moving).
  - Rod (act.mode === ACT.rod): fish ??= createFishPose(); when act.rod !== p.rodId: fish.setRod(rodById(act.rod) ??
    RODS[0]). fish.apply(p.model, act.phase, p.phaseT, act.charge, dt). Bobber visible at act.bobber when not null,
    line from fish.tip(p.model, v) to the bobber (update the 2 positions, needsUpdate = true, computeBoundingSphere()).
    When the mode is no longer rod: fish.clear(p.model), hide bobber and line.
  - Binoculars (ACT.scope): arms.left.rotation.x = -2.3, arms.right.rotation.x = -2.3, arms.left.rotation.z = -0.35,
    arms.right.rotation.z = 0.35.
  - While an emote or the rod is showing: hide the held gun (p.held.visible = false) and skip the gun pose; show it again
    otherwise.
  - In a vehicle or under a chute: cancel the emote (p.anim.cancel(p.model); lawn stop + update(1, false)), clear the
    rod pose, hide bobber/line.
- Aircraft tilt: in updateDriver, before syncVehicleMesh, if p.vehicle.air: ease p.vehicle.air.pitch / .roll toward
  pose.tilt?.pitch ?? 0 / pose.tilt?.roll ?? 0 with k = 1 - Math.exp(-10 * dt).
- Ride poses: after poseHands(p.model, p.vehicle, 0, dt) in updateDriver, call p.ride.update(p.model, info, dt) with
  info filled like player.ts (seat 0, speedFrac from |v.speed| / max(1, spec.maxSpeed), seed p.id). In updateRider,
  when seated in a host vehicle, call it with seat = ride.seat and the host vehicle. When the puppet gets out (on foot,
  or rider with no host), p.ride.cancel(p.model) once (track p.riding).
- leave / clear / drop: remove and dispose bobber and line, fish?.clear, delete from acts (leave) / acts.clear() (clear).
- activityOf(id): acts.get(id) ?? null (keep).
- games/gnome-theft-auto/src/remotes.test.ts (new, only if it can run under vitest without WebGL): at least test that
  easePitch still works and that setActivity / activityOf store and clear. If importing remotes.ts in vitest fails
  for a WebGL reason, skip the file and say so.

## Contract
Remotes.setActivity(id: number, a: RemoteActivity | null): void; Remotes.activityOf(id: number): RemoteActivity | null
(already declared; keep them).

## Done when
- npx tsc --noEmit -p games/gnome-theft-auto shows no errors in remotes.ts.
- npx vitest run --root games/gnome-theft-auto src/online src/net.test.ts passes.

## Out of scope
src/anim/*, src/fishing/*, src/online/*, app.ts, net.ts, seats.ts.
~~~~

### Issue 1.3: hunting quarry sync

~~~~text
Epic: 1 Adapters
Depends on: none
(Paste the shared Environment + Online sync background block here.)

## Goal
Everyone near a quarry sees the same animal. The highest-ranked player near it steps it and publishes it; others
mirror it. A guest's shot or comb goes to the owner.

## Read first
- games/gnome-theft-auto/src/hunting/hunting.ts: createHunting (list, spawn(), hitTest, comb(), update loop that
  calls stepQuarry per quarry with `frame`, nextId).
- games/gnome-theft-auto/src/hunting/quarry.ts: Quarry fields (x y z yaw speed mode modeT awareness tip lift combedT),
  QuarryMode, shootQuarry(q, fromX, fromZ, dist), combQuarry(q, px, pz), QuarryFrame.
- games/gnome-theft-auto/src/hunting/species.ts: SPECIES (array).
- games/gnome-theft-auto/src/online/huntSync.ts (stub to fill), src/online/hub.ts, src/online/protocol.ts.

## Change
- games/gnome-theft-auto/src/hunting/hunting.ts:
  - export interface HuntNet {
      /** False: another player owns q; it is mirrored here, not stepped. */
      owns(q: Quarry): boolean;
      /** The player the owner steps q against (the nearest one); null = the local player. */
      focus(q: Quarry): { x: number; z: number; noise: number } | null;
      /** I shot (downed or bounced) a quarry another player owns. */
      shot(q: Quarry, fromX: number, fromZ: number, dist: number): void;
      /** I combed a quarry another player owns. */
      combed(q: Quarry): void;
    }
  - Hunting gets: setNet(n: HuntNet | null): void; remoteShot(q: Quarry, fromX: number, fromZ: number, dist: number):
    void (shootQuarry + the same smash/sound as a local downing, no achievements); remoteComb(q: Quarry, fromX: number,
    fromZ: number): void (combQuarry only).
  - update loop: if net && !net.owns(q), skip stepQuarry (keep leavePrints, calls and flush sound). If it owns q and
    net.focus(q) is not null, step it with a reused second frame object whose playerX/playerZ/noise come from focus
    (no allocation per quarry).
  - hitTest: after a non-'miss' result, if net && !net.owns(q) call net.shot(q, px, pz, dist).
  - comb(): after combQuarry, if net && !net.owns(q) call net.combed(q).
  - spawn() (trainer / ?hunt=): ids from a separate counter starting at 100000 (the seeded plan keeps nextId), so they
    never clash with the plan's ids on other clients.
- games/gnome-theft-auto/src/online/huntSync.ts: implement createHuntSync:
  - owners: Map<number, number | null> (quarry id -> owner). lastFrame: SyncFrame | null. MODES =
    ['graze','walk','wary','flee','rolled','flying','burrowed','down','hidden'] as const (index = wire code).
  - HuntNet given to d.hunting.setNet(...) at creation:
    owns(q) = q.id >= 100000 || !link.online() || (owners.get(q.id) ?? null) === null || owners.get(q.id) === link.myId();
    focus(q): the nearest of lastFrame.me and lastFrame.peers to q; null when that is me or there is no frame;
    otherwise { x, z, noise: 0.45 }.
    shot(q, fx, fz, dist): owner = owners.get(q.id); if owner is a number: link.command(owner, q.id, 1, [qPos(fx),
    qPos(fz), qPos(dist)]). combed(q): link.command(owner, q.id, 2, [qPos(q.x), qPos(q.z)]).
  - update(dt, f): lastFrame = f. For quarry with id < 100000 within 400 m of f.me: owners.set(id, f.ownerOf(q.x, q.z,
    owners.get(id) ?? null)); farther ones: owners.delete(id). Then, for quarry not owned by me with a target from a
    record, ease x, y, z toward the target (k = 1 - exp(-8 dt)) and yaw along the shortest arc.
  - collect(out, f): each quarry with id < 100000 whose owner is f.myId: rec = [id, SPECIES.indexOf(q.species),
    qPos(x), qPos(y), qPos(z), qAngle(yaw), MODES.indexOf(mode), min(9999, round(modeT*10)), qUnit(awareness clamped
    0..1), round(tip*100), round(lift*100), min(9999, round(combedT*10)), round(speed*10)].
  - receive(ch): for added/changed: find q by id in d.hunting.list (keep a Map id -> Quarry built once). Skip if missing,
    if the species index does not match, or if I own it. Else set mode, modeT, awareness, tip, lift, combedT, speed from
    the record and store the position/yaw as its target (snap when farther than 20 m).
  - command(from, id, c, a): my quarry by id: c 1 -> d.hunting.remoteShot(q, uqPos(a[0]), uqPos(a[1]), uqPos(a[2]));
    c 2 -> d.hunting.remoteComb(q, uqPos(a[0]), uqPos(a[1])).
  - ownerGone(owner): delete owners entries equal to owner (quarry stay; ownership is recomputed next frame).
  - reset(): clear owners and targets, lastFrame = null.
- games/gnome-theft-auto/src/online/huntSync.test.ts (new): with a fake Hunting ({ list: [two quarry-like objects],
  setNet(n) { captured = n }, remoteShot, remoteComb } cast as unknown as Hunting) and a fake link: owns() is true while
  offline; after update with f.ownerOf returning another id, owns() is false and shot() sends command c 1 to that id;
  collect only pushes quarry owned by f.myId; receive applies mode from a record; command c 1 calls remoteShot.

## Done when
- npx vitest run --root games/gnome-theft-auto src/online src/hunting passes.
- npx tsc --noEmit -p games/gnome-theft-auto shows no errors in hunting/*.ts or online/huntSync*.ts.

## Out of scope
app.ts, src/online files other than huntSync*.ts, every other system.
~~~~

### Issue 1.4: bird flock sync

~~~~text
Epic: 1 Adapters
Depends on: none
(Paste the shared Environment + Online sync background block here.)

## Goal
Flocks near players are spawned by the lead only and mirrored by everyone near, so all players watch the same birds.

## Read first
- games/gnome-theft-auto/src/birding/birding.ts: createBirding: flocks, addFlock, trySpawn, the update loop (despawn,
  stepFlock, flush sound), the returned object.
- games/gnome-theft-auto/src/birding/types.ts: Flock, FlockMode ('perched'|'flying'|'circling'|'swimming'|'running'),
  PerchKind ('roof'|'fence'|'tree'|'ground'|'water'|'shore').
- games/gnome-theft-auto/src/birding/flock.ts: flushFlock(f, fromX, fromZ, env), sendFlock, circleFlock.
- games/gnome-theft-auto/src/birding/species.ts: BIRDS, birdById.
- games/gnome-theft-auto/src/online/birdSync.ts (stub), hub.ts, protocol.ts.

## Change
- games/gnome-theft-auto/src/birding/birding.ts:
  - export interface BirdNet {
      /** False: another player leads this patch; do not spawn new flocks. */
      spawning(): boolean;
      /** A mirrored flock flushed here (my shot or noise): tell its owner. */
      flushed(fl: Flock, fromX: number, fromZ: number): void;
    }
  - Birding gets: setNet(n: BirdNet | null): void; flockList(): readonly Flock[]; isMirror(fl: Flock): boolean;
    addMirrorFlock(speciesId: string, size: number, x: number, y: number, z: number, mode: FlockMode): Flock | null
    (null for an unknown species; uses addFlock and marks it in a `mirrors` Set); removeFlock(fl: Flock): void (removes
    from flocks and mirrors); adoptMirror(fl: Flock): void (mirrors.delete: it becomes an ordinary local flock);
    flush(fl: Flock, fromX: number, fromZ: number): void (flushFlock with the birding env + the flush sound).
  - update: call trySpawn only when !net || net.spawning(). The distance despawn skips mirror flocks (the adapter
    removes them). After stepFlock, if it flushed a mirror flock, call net?.flushed(fl, px, pz).
- games/gnome-theft-auto/src/online/birdSync.ts: implement createBirdSync:
  - MODES and KINDS arrays as above (index = wire code). lead = true (from the last update).
  - At creation: d.birding.setNet({ spawning: () => !link.online() || lead, flushed: (fl, x, z) => { const e = mirror
    entity of fl (keep Map<Flock, MirrorEnt>); if (e) link.command(e.owner, e.id, 1, [qPos(x), qPos(z)]); } }).
  - collect(out): for fl of d.birding.flockList() that are not mirrors: rec = [fl.id, BIRDS.indexOf(fl.species),
    fl.members.length, MODES.indexOf(fl.mode), qPos(fl.x), qPos(fl.y), qPos(fl.z), qAngle(fl.heading), qPos(fl.tx),
    qPos(fl.ty), qPos(fl.tz), KINDS.indexOf(fl.targetKind)].
  - receive(ch): added -> d.birding.addMirrorFlock(BIRDS[rec[1]].id, rec[2], x, y, z, mode); store the Flock in e.view and
    the map; set its target. changed -> set mode, tx/ty/tz, targetKind and the centre target. removed ->
    d.birding.removeFlock(view).
  - update(dt, f): lead = f.lead; ease each mirror flock's x/y/z toward its target (k = 1 - exp(-6 dt)); heading eases
    along the shortest arc.
  - command(from, id, 1, a): my flock with fl.id === id -> d.birding.flush(fl, uqPos(a[0]), uqPos(a[1])).
  - ownerGone(owner, ents, adopt): per ent with a view: adopt(fl.x, fl.z) ? d.birding.adoptMirror(fl) : removeFlock(fl).
  - reset(): remove every mirror flock; lead = true.
  - radius 160, hz 4.
- games/gnome-theft-auto/src/online/birdSync.test.ts (new), with a fake Birding: collect skips mirrors; receive(added)
  calls addMirrorFlock with the right species id; spawning() is false when online and not lead; command 1 calls flush.

## Done when
- npx vitest run --root games/gnome-theft-auto src/online src/birding passes.
- npx tsc --noEmit -p games/gnome-theft-auto shows no errors in birding/*.ts or online/birdSync*.ts.

## Out of scope
app.ts, other src/online files, every other system.
~~~~

### Issue 1.5: sky traffic + banner plane sync

~~~~text
Epic: 1 Adapters
Depends on: none
(Paste the shared Environment + Online sync background block here.)
NOTE: another planner also works in src/skyTraffic/ right now. Your edit to skyTraffic/runtime.ts must be ONLY the small
additions below (no reformatting, no other changes). Do not touch any other skyTraffic file.

## Goal
NPC aircraft and the banner tow are spawned by the lead only. Everyone near sees the same planes and the same advert.
A guest can damage a plane or tear the banner.

## Read first
- games/gnome-theft-auto/src/skyTraffic/runtime.ts: Rec, spawn(), think(), tear(), stepBanner() (how the banner tow
  point is computed: b.x - sin(yaw)*r, b.y + 0.5, b.z - cos(yaw)*r with r = v.spec.radius), hitTest, setEnabled, the
  returned object and the SkyTraffic interface.
- games/gnome-theft-auto/src/skyTraffic/banner.ts: SkyBanner (setAd, update(dt, tx, ty, tz, yaw, speed, time, near),
  hitTest, tearLoose, gone(), setVisible, dispose), createBanner(scene).
- games/gnome-theft-auto/src/skyTraffic/ads.ts (SKY_ADS), behaviours.ts (SKY_BEHAVIOURS, skyBehaviour).
- games/gnome-theft-auto/src/vehicles.ts: createVehicle(scene, kind, x, z, yaw, tint?), removeVehicle(scene, v),
  syncVehicleMesh(v, dt); Vehicle.air (pitch, roll). src/net.ts VEHICLE_CODES.
- games/gnome-theft-auto/src/online/skySync.ts (stub), hub.ts, protocol.ts.

## Change
- games/gnome-theft-auto/src/skyTraffic/runtime.ts (additions only):
  - export interface SkyNetRec { key: number; id: string; v: Vehicle; body: SkyBody; state: Rec['state']; adId: string |
    null; banner: 0 | 1 | 2 } (0 none, 1 towing, 2 torn).
  - Rec gets `key: number` (from a `let keySeq = 0`, `key: ++keySeq` in spawn()).
  - `let spawning = true;` and think() returns before picking when `!enabled || !spawning`.
  - SkyTraffic gets: setSpawning(on: boolean): void (sets the flag only, clears nothing); netList(): SkyNetRec[] (one per
    record; banner 1 when rec.banner, 2 when rec.def.banner but rec.banner is null, else 0); adopt(id: string, x: number,
    y: number, z: number, yaw: number, speed: number): boolean (false for an unknown id or one already flying; else
    refreshCtx(); spawn(def, true); then set the new record's body and v x/y/z/yaw and body.speed); tearBanner(key:
    number): void (tear(rec) for that key).
- games/gnome-theft-auto/src/online/skySync.ts: implement createSkySync:
  - collect(out): for r of d.sky.netList() with state !== 'wreck': rec = [r.key, SKY_BEHAVIOURS index of r.id,
    VEHICLE_CODES.indexOf(r.v.kind), qPos(body.x), qPos(body.y), qPos(body.z), qAngle(body.yaw), qSigned(body.pitch, 1.6),
    qSigned(body.roll, 1.6), STATES.indexOf(r.state) (STATES = ['flying','leaving','downed','wreck']),
    round(body.speed*10), r.banner, qUnit(r.v.hp)], str = r.adId ?? ''.
  - receive: added -> a view { v: createVehicle(d.scene, kind, x, z, yaw) with v.driver = 'remote' (NOT pushed into any
    vehicle list), interp: new Interp({ pos: [0,1,2], angles: [3,4,5], snapDist: 200 }), banner: SkyBanner | null,
    flag, speed }. banner flag 1 and an ad found in SKY_ADS by str -> createBanner(d.scene) + setAd. changed -> push
    [x, y, z, yaw, pitch, roll] with e.sentAt; flag 2 on a towing view -> banner.tearLoose(); a new ad id -> setAd.
    removed -> dispose (removeVehicle, banner.dispose).
  - update(dt, f): d.sky.setSpawning(f.lead). Per view: sample; set v.x/y/z/yaw, v.speed, v.air pitch/roll if v.air;
    syncVehicleMesh(v, dt); banner.update(dt, tow point as in stepBanner, yaw, speed, f.now / 1000, near = distance to
    f.me < 300). Torn banners: dispose when gone().
  - hitTest(x, y, z): a towing banner's hitTest -> link.command(owner, id, 2), d.fx.spark(x, y, z), true. A plane
    (flat distance < v.spec.radius, y between v.y - 0.5 and v.y + 1 + v.spec.radius*0.6) -> link.command(owner, id, 1,
    [15]), d.fx.spark(x, y, z), true.
  - command(from, id, c, a): rec = netList() by key; c 1 -> d.damage(rec.v, (a[0] ?? 15) / 100); c 2 ->
    d.sky.tearBanner(id).
  - ownerGone(owner, ents, adopt): per ent: if adopt(x, z) and state is flying or leaving: d.sky.adopt(SKY_BEHAVIOURS[rec[1]].id,
    x, y, z, yaw, speed); dispose the view either way.
  - reset(): dispose every view; d.sky.setSpawning(true).
  - radius 650, hz 4.
- games/gnome-theft-auto/src/online/skySync.test.ts (new), pure parts only (fake SkyTraffic returning one SkyNetRec
  with a plain object vehicle): collect pushes the right behaviour index and banner flag; command 2 calls tearBanner;
  reset calls setSpawning(true). Skip anything that needs WebGL; three.js objects without a renderer are fine.

## Done when
- npx vitest run --root games/gnome-theft-auto src/online src/skyTraffic passes.
- npx tsc --noEmit -p games/gnome-theft-auto shows no errors in skyTraffic/runtime.ts or online/skySync*.ts.

## Out of scope
Every skyTraffic file except runtime.ts; app.ts; other src/online files.
~~~~

### Issue 1.6: street event sync

~~~~text
Epic: 1 Adapters
Depends on: none
(Paste the shared Environment + Online sync background block here.)

## Goal
The lead runs the street-event director. Guests near an event see its gnomes, cars and props as ghosts, get its
callout, and can shoot the gnomes and cars (the owner applies it). A guest who acted gets the event's reward.

## Read first
- games/gnome-theft-auto/src/events/director.ts: createEventDirector, Running, start(), update(), setEnabled.
- games/gnome-theft-auto/src/events/kit.ts: createKit, KitDeps, RunKit, actors / cars / props arrays, prop(), reward().
- games/gnome-theft-auto/src/events/types.ts: EventDef (title, hint), EventStatus; src/events/catalog (STREET_EVENTS).
- games/gnome-theft-auto/src/gnomes.ts: makeGnome(scene, look), gnomeState(x, y, z, yaw, speed), randomTownLook().
- @lawn/gnome look codes: encodeLook(fromModelLook(look)) -> string; toModelLook(decodeLook(code)) (decodeLook may
  return null).
- games/gnome-theft-auto/src/vehicles.ts: createVehicle, removeVehicle, syncVehicleMesh. src/net.ts VEHICLE_CODES.
  src/terrain.ts heightAt(x, z). @lawn/prefabs buildPrefab(id, { scale }).
- games/gnome-theft-auto/src/online/eventSync.ts (stub), hub.ts, protocol.ts.

## Change
- games/gnome-theft-auto/src/events/kit.ts:
  - KitDeps gets `onReward?(acorns: number, reason: string): boolean;`. In reward(), after computing n and returning on
    n <= 0: `if (deps.onReward?.(n, reason)) return;` (someone else gets paid).
  - prop(): set o.userData.prefab = id and o.userData.scale = scale ?? 1 (whatever the default scale is there).
  - RunKit gets `pieces(): { actors: Npc[]; cars: Vehicle[]; props: THREE.Object3D[] }`: alive actors' npcs, every car's
    vehicle, every prop.
- games/gnome-theft-auto/src/events/director.ts:
  - Running gets `key: number` (++keySeq in start()).
  - setSpawnGate(on: boolean): random spawns need enabled && gate (forced triggers still work); separate from setEnabled.
  - netList(): { key: number; defId: string; x: number; z: number; status: EventStatus; kit: RunKit }[] (running and
    lingering ones; x/z = the anchor).
  - setRewardHook(fn: ((key: number, acorns: number, reason: string) => boolean) | null): start() creates the kit with
    { ...deps, onReward: (n, r) => rewardHook?.(key, n, r) ?? false }.
  - Add the three to the EventDirector interface.
- games/gnome-theft-auto/src/online/eventSync.ts: implement createEventSync:
  - Ids: event key * 32 + piece number. Piece 0 = header. Pieces get numbers 1..31 from a WeakMap<object, number> per
    key in order of first sight (skip any past 31).
  - collect(out): for each netList() entry: header [id, 3, qPos(x), qPos(z), STREET_EVENTS index of defId,
    STATUS.indexOf(status)] (STATUS = ['running','done','failed','gone']). Actor [id, 0, qPos(npc.x), 0, qPos(npc.z),
    qAngle(npc.yaw), NPC_STATES.indexOf(npc.state)] (NPC_STATES = ['walk','idle','flee','ragdoll']), str =
    encodeLook(fromModelLook(npc.look)). Car [id, 1, qPos(v.x), qPos(v.y), qPos(v.z), qAngle(v.yaw),
    VEHICLE_CODES.indexOf(v.kind), qUnit(v.hp), v.exploded ? 1 : 0, round(|v.speed|*10), v.tint]. Prop [id, 2,
    qPos(o.position.x), qPos(o.position.y), qPos(o.position.z), qAngle(o.rotation.y), round(scale*100)], str = prefab.
    Remember id -> Npc / Vehicle in a Map for command().
  - Ghosts (receive): actor -> makeGnome(d.scene, look from str or randomTownLook()) + Interp; each frame
    model.update(gnomeState(x, heightAt(x, z), z, yaw, speed from the interp delta)); state ragdoll -> lay the model
    flat (object.rotation.x = -Math.PI / 2). Car -> createVehicle(d.scene, kind, x, z, yaw, tint), driver 'remote', NOT in
    any vehicle list; syncVehicleMesh each frame; exploded -> d.fx.explode(x, y, z) once, then remove it. Prop ->
    buildPrefab(prefab, { scale }) added to d.scene at (x, y, z), rotation.y. Header -> when f.me first comes within 45 m
    of it while status is running: d.hud.callout?.(def.title, def.hint) once per event. Removed -> dispose (scene.remove,
    removeVehicle).
  - hitTest(x, y, z): a ghost actor (flat distance < 0.45, y between ground and ground + 1.1) -> link.command(owner,
    id, 1), d.fx.crack(x, y, z), d.play('crack'), true. A ghost car (flat distance < v.spec.radius*0.9, y between v.y and
    v.y + 1 + radius*0.6) -> link.command(owner, id, 2, [25]), d.fx.spark(x, y, z), true.
  - command(from, id, c, a) (owner): c 1 -> the actor's npc: d.npcs.crack(npc, npc.x, npc.z) if still in d.npcs.list;
    c 2 -> d.damage(v, (a[0] ?? 25) / 100). Either records lastBy.set(Math.floor(id / 32), { from, t: performance.now() }).
  - At creation: d.director.setRewardHook((key, n, reason) => { const by = lastBy.get(key); if (by && link.online() &&
    performance.now() - by.t < 30000) { link.pay(by.from, n, reason); return true; } return false; }).
  - update(dt, f): d.director.setSpawnGate(f.lead); draw ghosts.
  - ownerGone(owner, ents): dispose every ghost (events do not move to a new owner; they end).
  - reset(): dispose all ghosts; d.director.setSpawnGate(true).
  - radius 200, hz 6.
- games/gnome-theft-auto/src/online/eventSync.test.ts (new), pure parts with fakes (a fake director with netList()
  returning one event whose kit.pieces() has one plain-object npc): collect pushes a header and an actor record; command
  1 calls npcs.crack; the reward hook pays the last actor within 30 s and returns false otherwise; reset sets the gate true.

## Done when
- npx vitest run --root games/gnome-theft-auto src/online src/events passes.
- npx tsc --noEmit -p games/gnome-theft-auto shows no errors in events/*.ts or online/eventSync*.ts.

## Out of scope
app.ts, npcs.ts, other src/online files, every other system.
~~~~

### Issue 1.7: Sling-Lift sync

~~~~text
Epic: 1 Adapters
Depends on: none
(Paste the shared Environment + Online sync background block here.)

## Goal
Other players see a player's Sling-Lift chopper fly in and lower the vehicle.

## Read first
- games/gnome-theft-auto/src/lockup/runtime.ts: the Lockup interface, `flight` ({ uid, plan, state, rig, load }).
- games/gnome-theft-auto/src/lockup/sling.ts: createSlingRig(scene) -> { update(state, dt), dispose() }.
- games/gnome-theft-auto/src/lockup/types.ts: SlingState (phase, t, hx, hy, hz, heading, loadY, released), SlingPhase
  ('inbound'|'lowering'|'release'|'outbound'|'done').
- games/gnome-theft-auto/src/vehicles.ts: createVehicle, removeVehicle, syncVehicleMesh. src/net.ts VEHICLE_CODES.
- games/gnome-theft-auto/src/online/slingSync.ts (stub), hub.ts, protocol.ts.

## Change
- games/gnome-theft-auto/src/lockup/runtime.ts: Lockup gets
    /** Online (online/slingSync.ts): the Sling-Lift flight in the air now, or null. */
    slingWire(): { state: SlingState; kind: VehicleKind; tint: number } | null;
  returning flight ? { state: flight.state, kind: flight.load.kind, tint: flight.load.tint } : null.
- games/gnome-theft-auto/src/online/slingSync.ts: implement createSlingSync:
  - collect(out): w = d.lockup.slingWire(); if w: out.push({ id: 1, x: hx, z: hz, rec: [1, PHASES.indexOf(phase),
    qPos(hx), qPos(hy), qPos(hz), qAngle(heading), qPos(loadY), released ? 1 : 0, VEHICLE_CODES.indexOf(kind), tint] }).
  - receive: added -> view { rig: createSlingRig(d.scene), state: a SlingState object, interp: new Interp({ pos: [0,1,2],
    angles: [3], snapDist: 80 }) over [hx, hy, hz, heading, loadY], load: createVehicle(d.scene, kind, hx, hz, heading,
    tint) with driver 'remote' (not in any list) }. changed -> push and set phase / released. removed -> dispose.
  - update(dt): sample into the state; rig.update(state, dt); the load hangs at (hx, loadY, hz) with yaw = heading and
    syncVehicleMesh(load, 0) until released, then removeVehicle it (the owner's parked vehicle is not relayed).
  - ownerGone / reset: dispose every view. radius 450, hz 8.
- games/gnome-theft-auto/src/online/slingSync.test.ts (new): with a fake Lockup, collect pushes nothing when slingWire()
  is null and one 10-number record otherwise.

## Done when
- npx vitest run --root games/gnome-theft-auto src/online src/lockup passes.
- npx tsc --noEmit -p games/gnome-theft-auto shows no errors in lockup/runtime.ts or online/slingSync*.ts.

## Out of scope
app.ts, other lockup files, other src/online files.
~~~~

## Epic 2: two-client check (planner)

`tools/gta-mp-e2e.mjs`: starts nothing itself. Needs a local mp-server (`PORT=8431`) and the game dev server on 5430.
It opens two headless Edge pages on the same `?room=` with `&debug&mp=ws://localhost:8431/ws` and checks:
emote visible on the other client, a street event visible on both, the banner plane visible on both, an animal shot by
the guest reacts on the host, and no console errors.

## Results (2026-11-23)

All 7 Epic 1 issues landed; each worker's `vitest` run passed. The planner then fixed one thing: flock ids on the wire
are now the sync's own counter, because an adopted flock's local id could clash with one of the adopter's own flocks.

`node tools/gta-mp-e2e.mjs` (mp-server `PORT=8431`, vite on 5430 with `hmr: false`), two headless Edge pages in one
`?room=`:

```
ok   both clients see each other (host 5, guest 6)
ok   the first client is the host
ok   host leads
ok   guest near the host does not lead
ok   guest sees the host's emote (wave)
ok   street event street-busker on the host (1 running) and mirrored on the guest (6 pieces)
ok   banner plane spawned on the host and mirrored on the guest (4)
ok   guest's shot (hit true, guest saw graze) knocks quarry 1 over on the host (down)
ok   no console errors (0)
all passed
```

Traffic over the roughly 30 s run: the host sent about 11 KB in 81 messages (under 0.5 KB/s with an event, the sky
traffic and the quarry). The guest sent about 3.4 KB.

Gotcha: with `watch: null`, Vite keeps serving modules it has already transformed. Restart the dev server after
workers change files, or a run tests stale stubs.

Not tested: a real phone, more than two clients, and the host leaving mid-session. Host migration is covered by the
hub unit test, not by a browser run.
