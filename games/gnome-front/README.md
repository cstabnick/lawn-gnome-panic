# Gnome Front

A gnome-scale conquest FPS where Red Caps and Blue Caps (12 a side, you plus bots) fight over five lawn landmarks. Holding more flags drains the enemy's tickets. Ride the green, yellow and red riding mowers or THE COMBINE from Lawn Gnome Panic to get around fast and run gnomes over.

## Controls

- WASD: move
- Mouse: aim
- Right mouse (hold): aim down sights (zoom; the sniper scopes in)
- 1-4: pick a class for your next spawn (also on the title and death screens)
- Click: fire
- R: reload
- G: throw a pinecone grenade
- Space: jump
- Shift: sprint
- E: ride or hop off a vehicle
- Tab: scoreboard
- M: mute music

## Classes

| Key | Class | Gun | Pinecones | Notes |
|---|---|---|---|---|
| 1 | Rifleman | Acorn Rifle | 2 | accurate full-auto all-rounder |
| 2 | Gunner | Seed Sprayer | 1 | 80-round drum, good against mowers, slow |
| 3 | Sniper | Pea Shooter | 1 | scoped, semi-auto, a headshot kills |
| 4 | Brawler | Pinecone Blunderbuss | 3 | 9-pellet shotgun, fastest on foot |

Weapon and class numbers live in `WEAPONS` and `CLASSES` in `src/config.ts`.

## Bots

Bots fight in squads of four that share a flag and spread across the map, defend flags under attack, fall back to cover when hurt, steer around cover, and keep their gun's preferred range. Aiming is in `src/botAim.ts` (reaction time, aim that settles while tracking, worse at range and on the move, bursts, grenades at vehicles and groups); movement and squads are in `src/bots.ts`.

### Phones and tablets

Play in landscape. Left thumb anywhere on the left half: move (push all the way up to sprint). Right thumb: look. Hold FIRE and drag to aim while shooting. AIM toggles aiming down sights; RIDE gets on or off a mower; GREN, JUMP and RELOAD do what they say; SCORES (top left) shows the scoreboard. The controls live in `src/ui/touch.ts` and write into the same input state as the keyboard.

## Run and build

- Dev server: `npm run dev -w games/gnome-front` (port 5182)
- Type-check and build: `npm run build -w games/gnome-front`
- Add `?autoplay=1` to the URL to skip the Play click

## Tuning

Numbers live in `src/config.ts`: `TUNING`, `RIFLE`, `GRENADE`, `VEHICLES`, `FLAGS`, `VEHICLE_SLOTS`.

## Reused from Lawn Gnome Panic

- Gnome and mower models are copied unchanged into `src/models/`.
- The terrain is adapted from Lawn Gnome Panic.
- Music comes from the shared `@lawn/music` package (`packages/music`).

## Online

The title screen's PLAY ONLINE panel joins the shared matchmaking server (`packages/mp-server`): QUICK MATCH for the
public queue, or a room code for friends. Up to 24 players; humans take over bot slots (team with fewer humans first),
bots fill the rest, and friends can join a running match. One browser hosts: it runs bots, flags, health and respawns
and sends snapshots 15 times a second. Everyone moves, aims and fires their own gnome locally and sends hits to the
host. If the host leaves, another player takes over. Code: `src/net/` (state, protocol, session, host, guest) and
`src/ui/online.ts`. Plan: `docs/roadmaps/gnome-front-multiplayer.md`.

Local test: `npm run dev -w packages/mp-server`, `npm run dev -w games/gnome-front`, open two tabs, QUICK MATCH in
both (the public queue starts 15 s after the first player). Headless check: `node tools/gnome-front-mp-e2e.mjs`.

## Not done yet

- No ragdolls, no destructible cover, no crouch or prone.
