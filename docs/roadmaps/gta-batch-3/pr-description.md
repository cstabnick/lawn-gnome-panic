## Gnome Theft Auto, batch 3: the laundry list

One large feature PR built from the user's list of 118 requests (L01–L118, verbatim in `docs/roadmaps/gta-batch-3.md`), planned as 33 epics and run by Opus leads on Haiku/Sonnet workers in parallel waves. Every epic merged into this branch with a build and full test run; the branch is kept merged with `main`. **Status: all 33 feature epics are in; the editorial review fix round is in progress (9 of 24 fix epics merged). The PR is safe to merge at any point: everything on the branch builds and passes its tests.**

How it was run: `docs/process/big-batch-orchestration.md`. Tracking: `docs/roadmaps/gta-batch-3.md`. Per-epic plans, contracts and screenshot passes: `docs/roadmaps/gta-batch-3/<epic>/`.

### What's in it
- **World:** the map grows from 1800 m to 3600 m: four new bands (Snowcap Rise, Saltbucket Shore, Rootwell, Trellisdown), the European-style town of **Pardonlin** on the river Thymes (dense districts, café terraces, Radio Adagio 96.1, classical music), **the Unmown** nature preserve, the **Hatbrim** mountain routes, Founders' Green and the Double Pot in Turfton, roundabouts and HOA-hat traffic wardens, a site registry for all content. The Wasm terrain kernel sizes itself to the world.
- **Places:** the coast (the Saltwater sea, boardwalk, Long Spoon Pier, the Spokewheel, the Bathtub Queen, water-skiing); winter sports (sledding, skiing, ice fishing, chill polar bears); Rootwell University, the Anthill observatory and the Dean's Leap, a second runway, wind pinwheels; the Rutbottom Dirt Bowl, Capwood toadstool forest and the Capwood Run rally; Hedgeworth Links (nine holes, real golf, clubhouse); Trellisdown Vineyard, Brassknock Manor, Windfall Croft farm; Loamdeep's moles with DJ Moleman, the Flock of the One Leg, the Underspan; Drainpipe Court basketball and the Gutter Bowls skate park; homes and workplaces for every character and the player's Flat 3B.
- **Systems:** walk-in interiors and walkable rooftops (helicopter landing); weather (rain, snow, mist, clouds) and the cutscene time-lapse; the Gnomlet tablet replacing the Tab menu and phone (with Gnomey Bird); zoomable big map, options registry, loading screen, position save; dealerships, insurance, repair, garage, inventory, property loans, money rebalance; character intro cards, radio/comms in each character's own voice, sound design bible; quest checkpoints with auto-retry, pinned quest vehicles, a quest fuzzer (`npm run quest-fuzz`), HOA rebalance with an evade meter; side-quest pacing with a journal "Later" shelf; world changes that follow the story.
- **Vehicles and driving:** round colliders, firmer airtime, first-person mode, NPC cars on the casual chassis, parts breaking off, acorn shell casings, skimming over water, bushes you can drive over, five European rides, dirt bike, skateboard, bubble-mobile, bin lorry, fire engine and more.
- **Activities:** jobs (chef, mechanic, comedy stage, bin crew, firefighter with a reusable fire system, Gnomazon packing), street racing with pickup races, time trials with ghosts and online player races, golf, basketball, skateboarding.
- **Story:** the main story grows from 17 to **70 quests** in four acts, with six extended pivotal quests, intro cards at first appearances, and a final lore pass (~830 entries).
- **Shared packages:** `@lawn/golf` (from Gnome Golf), `@lawn/jam` (from GBA GJAM), `@lawn/trickboard` (from Aether Board). Each source game imports them; golden tests captured before the move are unchanged.

### Editorial review (in progress)
Twelve Opus editors reviewed by content group (~375 findings, `docs/roadmaps/gta-batch-3/review/G*.md`); a decider ruled on the 59 spirit questions (`review/decisions.md`); triage produced 24 fix epics (`review/fix-plan.md`). Merged so far: FX01 (readable signs, lit undersides, rain sky), FX02 (interior cameras and cut-away walls), FX03 (touch activity mode, holstering, activity HUDs), FX04 (vehicle capsule collision, drive camera scaled to the vehicle, lit stunt ramps), FX06 (speech bubbles, residents on decks, scenery off routes, softer ground paint), FX05 (story sets only while their quest runs, clear weather and warm key light in scenes, close-shot checks), FX11 (the coast: bucket gateway, sand and dunes, a dressed promenade with keepers, silver pier, bath-toy Queen, night lights, sound), FX12 (Snowcap white with thawed hollows, ice that reads, a longer Wool Run from the summit, a sleeping bear), FX21 (journal recap lines and reward chips for all 70 quests, catch-up order for old saves). The remaining fix epics, a re-review, and a requirements audit of every item L01–L118 are planned and tracked.

### How to run
`npm install`, then `npm run dev -w games/gnome-theft-auto` (port 5198). Many epics document dev URLs in their contracts (e.g. `?golf=1..9`, `?winter=wool-run`, `?streetrace=skyway-sprint`, `?interior=<id>`, `?weather=rain`).

### Tested
- After every merge: `npm run build -w games/gnome-theft-auto` and the full game suite (5394 tests at the last merge), plus prefabs, gnome, achievements and the new packages; builds of gnome-golf, gba-gjam, aether-board, gnome-billiards, gnome-set-radio after shared changes; `npm run lore`; cutscene report; quest sim and fuzzer for story epics.
- Smoke checks in headless Edge and screenshot passes per area (desktop and 390x844).
- **Not tested:** hand play-throughs in a real browser and on a real phone; many rides, shifts and quests were exercised only by tests and the quest sim.

### Mobile and online
Mobile: every new action has a touch control; phone layouts checked by screenshot (no real device). Online: new vehicles relay as usual; street races have an online mode over `@lawn/mp`; most activities, the farm, homes and fires are per player by design (recorded in each epic's contracts).

🤖 Generated with [Claude Code](https://claude.com/claude-code)
