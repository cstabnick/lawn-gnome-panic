# Review: Small-group and mobile player

I play zombie survival with two or three friends in 30–90 minute evenings, mostly on a phone. I want a world we can log into, get something done in, and leave safely, and I want to play alone when my friends are busy.

## User stories

1. **As a casual player with 45 minutes, I want each session to end on a finished small thing, so that I feel I got somewhere before logging off.**
   Acceptance: 90% of 45-minute playtest sessions contain one completed goal; a log-off screen summarises what changed.
   Design today: Missing (`survival.md`, `quests.md` have no session loop).

2. **As a player, I want to log off somewhere safe, so that my gnome is not killed while I'm away.**
   Acceptance: logging out in a haven or bed sets safe sleep; in the open, the gnome walks to a hideout first; zero logout deaths in playtest.
   Design today: Partly (`havens.md` safe sleep; `simulation-lod.md` leaves a logged-off gnome in the field).

3. **As a friend, I want to join my group's world from an invite or room code, so that we are never split across shards.**
   Acceptance: 100% of invited friends land in the same world; invite-to-play under 30 seconds on a phone.
   Design today: Missing (`multiplayer.md`: a full room "opens a new shard"; no invites).

4. **As a group, I want a private world that runs and saves when none of our browsers are open, so that we can resume.**
   Acceptance: any member resumes on their own device with no host online; a phone loads it in under 15 seconds.
   Design today: Partly (`multiplayer.md` saves private worlds locally or to cloudsave; the headless host is described only for public worlds).

5. **As a casual player, I want to cross the 16 km map in minutes, so that a session is not spent walking.**
   Acceptance: 80% of haven-to-haven trips under 10 real minutes; a cart, ferry or caravan ride on each main road.
   Design today: Partly (`world.md` gives "about 70 min"; caravans and the Willow ferry exist in `economy.md`, `regions.md`).

6. **As someone who plays a few hours a week, I want the world to still look like the one I left, so that I can make progress on return.**
   Acceptance: after 7 real days away, at least half of the containers near my last haven are still unlooted.
   Design today: Missing (`world.md`: 1 game-day = 60 real minutes, and the headless host keeps the world running).

7. **As a player in a group, I want loot each of us can find, so that one friend doesn't empty a crypt before I arrive.**
   Acceptance: T0–T2 interior rolls are per player or on a claim timer; no crypt in a 3-player playtest is emptied by one player while another is in the zone.
   Design today: Missing (`loot.md`: a container is rolled once and stays empty).

8. **As a casual player, I want death to cost less than an evening, so that I can take risks.**
   Acceptance: each haven gives a free home cache that survives death; median kit recovery under 20 minutes of play.
   Design today: Partly (`survival.md` caches survive death, but there is no default cache).

9. **As a player whose gnome shattered, I want to find the Hatless wearing my gear, so that I can get it back.**
   Acceptance: the owner sees the rising Hatless's last position on the paper map; 100% of such events reported.
   Design today: Missing (`hatless.md` describes the rise, not how the owner finds it).

10. **As a player who doesn't want PvP, I want a friends-only or PvE room, so that strangers can't reach us.**
    Acceptance: room mode chosen at creation; zero player-on-player damage in PvE rooms.
    Design today: Missing (`multiplayer.md` offers only the "friendly unless you're a raider" norm and havens).

11. **As a solo player, I want real NPC contact within 10 minutes, so that the world doesn't feel empty.**
    Acceptance: first trade or conversation under 10 real minutes; three named NPCs known by hour one.
    Design today: Partly (`evaluation.md` bot metric; `quests.md` verb menu; no human playtest target).

12. **As a new player, I want a first hour that tells me what to do, so that I'm not lost without markers.**
    Acceptance: a guided first 30 minutes with three objectives and a "what now" hint that can be turned off; 4 of 5 playtesters find the first haven unaided.
    Design today: Missing (`survival.md`: "no quest markers by default"; `quests.md`: "no hand-written main quest").

## What works

- **`survival.md` (Controls):** a full touch map where the action wheel replaces every keyboard-only verb, with 44 px and safe-area rules.
- **`havens.md`:** safe sleep and a market inside a haven give a small group a place to log off and trade.
- **`multiplayer.md` (Host hand-off):** replaying inputs from a snapshot suits a phone that backgrounds.
- **`society.md`:** "solo survival is impossible without company" makes solo and group runs feel different.

## Concerns and gaps

1. **The clock runs in real time, so the world outruns casual players.** `world.md` sets 1 game-day = 60 real minutes, and public worlds run with nobody online. Taken literally, a 120-day world ends in about five real days. Change: advance world time only while someone is online, plus a slow published offline rate (for example 1 game-day per 6 real hours).
2. **Private worlds have no defined home.** Saves go to cloudsave or one friend's browser, so the group's world dies with one device. Change: private worlds run on the headless host by default, with cloudsave as the resume path for any member.
3. **Groups can't find each other.** Change: invite links or room codes, a friend list showing each friend's haven and status, and a rule that a friend group always lands in one shard.
4. **Griefing is priced for a world, not a group.** A three-gnome raider band can kill a lone player in the open, and the standing cost only bites if a faction hears of it. Change: a per-room PvE or friends-only mode, plus a public "bounty window" on a raider's kill so a group can answer it.
5. **The crossing is slower than stated.** 16,000 gm at walk speed (2 gm/s, `survival.md`) is about 2 h 13 min; "about 70 min" is jog speed. Change: fix the figure, then add rides (carts, caravans, the Willow ferry) and rumour-revealed routes so most trips take under 10 minutes.
6. **Death costs an evening.** Change: a free home cache in every haven (it survives death), a shattered gnome's last position on the map, and recovery counted in minutes of play.
7. **Logging out in the open is unsafe.** Change: logging out in a haven is instant; in the open, the gnome walks to the nearest hideout first, with a visible timer.
8. **Onboarding is absent.** Change: a guided first 30 minutes (the Last Sexton storylet can be the tutorial), a hint that can be turned off, and the first haven marked on the paper map.
9. **Phone hosting has hidden costs.** A host phone hands off when backgrounded, and clients get a snapshot every 5 minutes. Change: a battery and data target for a 45-minute phone host, a warning before hand-off, and a headless host as the default for groups.
10. **The start is overwhelming.** 4,000–9,000 Hatless against 1,000–1,400 gnomes (`history.md`). Change: a quiet start radius around the Lychgate, with herds growing with distance.

## Economy and balance

Scarcity drives the story, but the clock makes it unfair to part-time players: a three-hours-a-week player cannot keep up with a world that runs all week, and first-come containers punish groups who play at different times.

Suggested extra metrics and knobs:

- **Offline catch-up ratio** (a knob) and "share of T1–T2 containers near a returning player's last haven still unlooted after 7 real days", target 50% or more.
- **Contested-loot share**: finds in a shared zone that two or more players reached within 10 minutes of each other; knob is the per-player roll fraction; target under 20%.
- **Gear loss per death in play time**: minutes of play to rebuild a basic kit, median under 20, with the home cache as the main knob.
- **Useful finds per 45-minute casual session**: floor of 3 for a solo bot, on day 1 and day 60.

## Scores

- **Session fit: 2.** No defined session ending, and a 16 km walk eats most of an evening.
- **Co-op fun: 3.** Group-size design is promising, but joining, finding and keeping a private world are not designed.
- **Solo without players: 4.** NPC society and the solo-survival rule give a real single-player game, though talk is untested with humans.
- **PvP safety: 2.** Havens protect inside walls only; no PvE room or consent setting.
- **Mobile controls: 3.** The control table is solid; climbing, gliding, prone and aiming on a phone are unspecified.
- **Onboarding: 2.** No first-hour design, and the no-marker rule makes the start harder.
- **Economy fairness: 2.** Real-time clock, first-come shared loot and no home cache feel punitive to part-time players.
- **Measurement plan: 3.** The headless sim, golden seeds and bot bands are strong, but nothing measures human session fit, return rate or group loot contests.
