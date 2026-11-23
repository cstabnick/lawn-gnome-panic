# Gnome Theft Auto: Hangar Two and the Mossbank Boathouse (hangar-and-boathouse)

Request: "Player should be able to buy a hangar and boathouse as well to store their stuff and store up to 3 vehicles and
call them in".

## What it is

- **Hangar Two** (Desert Airfield, east of the old hangar at (428, -64); centre (480, -64), door facing the runway).
  Sold by Wind-Sock Wally for 1200 Acorns. 3 bays for aircraft (`StorageKind 'air'`). A real walk-in building
  (prefab `hangar-two`: the airfield hangar with its roller door rolled up), wall colliders, a concrete floor and apron.
- **The Mossbank Boathouse** (Loch Moss south shore, 25 m east of Driftwood's dock; centre (-690, -566), open to the
  loch). Let by Driftwood for 800 Acorns. 3 slips for boats (`'water'`). Prefab `boathouse`: a slip between two
  walkways, back door to the shore. Boats drive into the slip; gnomes walk in through the back door.
- Buying: on foot at the site, E / the action button ("Buy Hangar Two · 1200 Acorns"). Once owned, the same spot opens
  the Lock-Up sheet for that kind (Take out / Scrap), and driving an aircraft / boat in shows "Store" (T).
- **Call-in**: the phone's Sling-Lift app has tabs per owned garage (Lock-Up / Hangar Two / Mossbank Boathouse).
  - Rotor craft and the Dandelion Drifter: lowered on clear flat ground near you (clear radius 4.5 m). Fee 80.
  - Fixed-wing (Hedge-Hopper, Crop Duster): lowered at the start of a 60 m clear flat dry strip near you, facing down it;
    when there is none within 160 m it is taken to the Desert Airfield instead (toast says so). Fee 80.
  - Boats: lowered onto open water at least 1 m deep near you (within 160 m), else refused ("No open water near you").
    Fee 60.
- Saves: the vehicles stay in `gta-lockup-v1` (air and water slots, capacity now 3 each); the deeds are a new key
  `gta-estates-v1` `{ v: 1, owned: { air, water } }` (saveIO.ts GTA_SAVE_KEYS, cloudSave.ts MERGES, saveIO.test.ts).
  Records keep kind, variant, name, paint (tint), Glaze look, hp, engine pitch, uid (one instance per uid). The
  Slipway's tuning and paint are owned per model (`gta-craft-tune-v1`, `gta-glaze-v1`), so a stored craft keeps them.
- Achievements: `gta-landed-gnome` (own both; head `harbourmaster-cap`), `gta-hangar-full` (3/3 aircraft; back
  `windsock-quiver`), `gta-boathouse-full` (3/3 boats; neck `cork-key-float`).
- Online: nothing new on the wire (delivered vehicles are normal vehicles; deeds and garages are local).

## Shape

| Epic | Done when | Issues |
| --- | --- | --- |
| 0 Foundation (planner) | lockup/types.ts + config.ts (ESTATES, capacities, sites, delivery.air/water), stubs deeds/waterSpot/stripSpot/estates, save key; tsc clean | planner |
| 1 Modules | deeds, spot finders, buildings, prefabs + achievements, sheet tabs, lore; each test passes | 6 parallel |
| 2 Runtime + wiring | runtime.ts uses all of it (planner: app.ts, map icons) ; game tests + tsc + build | 1 + planner |

Status: all epics done. Lockup tests (10 files, 65 tests), mapIcons/saveIO/cloudSave tests, prefabs tests and game tsc
pass; smoke OK. Not checked: zfight at the two buildings (the scan timed out loading the page), a real phone.

No dependency inside an epic: everything codes against `lockup/types.ts` and `lockup/config.ts` (Epic 0).

Hot-file edits (small, additive): saveIO.ts, cloudSave.ts, saveIO.test.ts (key), app.ts (estates boxes + debug),
mapPois.ts / mapIcons.ts / mapIcons.test.ts / types.ts Blip kind (two place icons), packages/achievements catalog.ts
(3 entries), packages/prefabs catalog index.ts (1 import).

## Epic 1 issues

~~~~text
ENVIRONMENT (pasted into every issue)
Repo: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\elkhorn (Windows, Git Bash; use absolute paths). Game:
games/gnome-theft-auto (Vite + TypeScript + three.js). If node/npx is not found: export PATH="/c/Program Files/nodejs:$PATH".
Other workers edit other files of this game and repo at the same time: touch ONLY the files listed under Change. Do not
commit, push, stash, switch branches, run vite build / npm run build, or start a dev server. Do not edit AGENT_INDEX.md.
tsc over the whole game may show errors in files other workers are editing; only errors in YOUR files matter.
~~~~

The six Epic 1 issue texts are in `gta-hangar-boathouse/` beside this file (1A-deeds.md ... 1F-lore.md), exactly as
given to the haiku-worker agents. Epic 2's issue is 2A-runtime.md.
