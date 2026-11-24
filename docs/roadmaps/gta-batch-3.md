# Gnome Theft Auto, batch 3: the laundry list

The master plan and tracking document for the third big Gnome Theft Auto batch: a single user list of about 92
requests (fixes, engine work, new places, activities, a 70-quest main story) grouped into 22 epics and run in waves of
at most 3 parallel workstreams. Process: [docs/process/big-batch-orchestration.md](../process/big-batch-orchestration.md).
Epic briefs: [gta-batch-3/](gta-batch-3/). Each workstream lead adds its own decompose roadmap and issue files under
`gta-batch-3/<epic-id>/`.

- **Branch:** `gta-batch-3` on `cstabnick/lawn-gnome-panic`. Every epic merges here. The branch merges into `main`
  once, as one large feature PR.
- **Game:** `games/gnome-theft-auto` (shared packages as the briefs allow; `gba-gjam`, `aether-board` and `gnome-golf`
  only through extracting shared code into a package, which the user asked for: "share code if possible").

## Next session starts here

Wave 1: E04 merged; E01, E02 running. E08 (wave 2, no open dependencies) started early in the free slot. When E01 lands start E05; when E02 lands start E03. Keep at most 3 leads running.

## Tracking

Status: `planned` → `running` (lead started) → `review` (lead branch done, not merged) → `merged` / `partial` (merged
with deferred items listed).

| Epic | Name | Kind | Wave | Depends on | Status | Branch | Merge | Notes / deferred |
|---|---|---|---|---|---|---|---|---|
| E01 | World expansion and site plan | Engine | 1 | – | running | epic/E01-* | | |
| E02 | Vehicle feel, combat and camera | Fix + Engine | 1 | – | running | epic/E02-* | | |
| E04 | Story bible and world writing | Story (docs) | 1 | – | merged | epic/E04-story | c9a94025 | names final (see E04/spine.md); new objective types needed (golf-hole, jam-game, skate-line, ski-run, tow-ski, ride-passenger, dig, interior-visit) each with a fallback; E18 builds the journal 'Later' shelf; rulings R-158..R-167 taken |
| E03 | Bugs and quest reliability sweep | Fix | 2 | – | planned | | | |
| E05 | Interiors and rooftops | Engine | 2 | E01 | planned | | | |
| E08 | Economy, ownership and inventory | Engine | 2 | – | running | epic/E08-economy | | |
| E06 | Sky, weather and time | Engine | 3 | – | planned | | | |
| E07 | Map, options, mobile UI and loading | Polish | 3 | E01 (map extent) | planned | | | |
| E09 | Sound, voice, animation and direction | Polish | 3 | – | planned | | | |
| E10 | Homes and downtown life | Content | 4 | E01, E04, E05, E08 | planned | | | |
| E11 | Coast and boardwalk | Content | 4 | E01 | planned | | | |
| E12 | Winter sports | Content | 4 | E01, E06 | planned | | | |
| E13 | Campus and skyline | Content | 5 | E01, E05 | planned | | | |
| E14 | Dirt, rally and toadstools | Content | 5 | E01, E02 | planned | | | |
| E15 | Golf course | Content | 5 | E01, E05 | planned | | | |
| E16 | Countryside, fauna and the farm | Content | 6 | E01, E08 | planned | | | |
| E17 | Underground societies | Content | 6 | E01, E05, E04 | planned | | | |
| E19 | Courts and skate park | Content | 6 | E01 | planned | | | |
| E18 | Activities and side-quest pacing | Content | 7 | E04, E05, E08 | planned | | | |
| E20 | Story acts I–II (quests 1–35) | Story | 7 | E04, E10 | planned | | | |
| E21 | Story act III (quests 36–53) | Story | 8 | E11–E17, E20 | planned | | | |
| E22 | Story act IV (quests 54–70), lore and finish | Story + Finish | 9 | everything | planned | | | |

## Engine work (built first, others build on it)

- **E01 World expansion:** grows the world past `worldHalf` 900, adds region documents for the new areas, and a
  **site registry** of reserved footprints (coast, campus + observatory mound, golf yard, dirt track, rally route,
  toadstool forest, ski hill, vineyard + mansion, new runway, wind farm, cult camp, mole entrance, construction sites,
  basketball court, skate park, character homes) so content epics fill a slot instead of fighting for ground. Also the
  downtown restructure (3 blocks → one park; a 2x1 mega block with a tunnel).
- **E05 Interiors and rooftops:** a generic way to enter a building and be in a furnished interior (and leave), plus
  walkable rooftops and helicopter landing on them. Homes, clubhouse, university, mansion, mole tunnels and shops use it.
- **E08 Economy, ownership and inventory:** a purchase/ownership framework (vehicle shops, insurance, repair, garage
  with many of one type, property purchase with debt), an inventory with consumables, and the money rebalance. Home,
  farm, chef job and shops use it.
- **E06 Sky, weather and time:** weather states (rain, snow, clouds) with an Options switch, a time-lapse transition into
  cutscenes set at another time of day, and the sky/world-life cadence (headlights, intermittent planes, bird paths,
  event frequency). Winter sports and the story's cutscenes use it.
- **E02** includes camera work (first-person mode, the camera-jump fix) and vehicle physics (landing, collision) that the
  dirt/rally tracks build on.

## Dependency graph

```
E01 ──┬─> E05 ──┬─> E10 ──> E20 ──> E21 ──> E22
      │         ├─> E13         ^       ^
      │         ├─> E15         |       |
      │         ├─> E17         E04 ────┘ (story bible feeds every story epic)
      │         └─> E18 <── E08
      ├─> E11, E12 (<─ E06), E14 (<─ E02), E16 (<─ E08), E19
      └─> E07 (map extent)
E08 ──> E10, E16, E18
E11..E17, E19 ──> E21 (act III visits the new areas)
```

## Waves

| Wave | Epics | Why together |
|---|---|---|
| 1 | E01, E02, E04 | world engine, vehicle/camera code and pure writing touch different files |
| 2 | E03, E05, E08 | bug sweep after the vehicle pass; interiors need E01; economy is independent |
| 3 | E06, E07, E09 | sky/world cadence, UI/options, audio/animation: separate modules |
| 4 | E10, E11, E12 | first content wave, uses all engines |
| 5 | E13, E14, E15 | |
| 6 | E16, E17, E19 | |
| 7 | E18, E20 | activities and the first story build after the homes exist |
| 8 | E21 | story act III, visits all new places |
| 9 | E22 | final story act, lore pass, full checks, demos |

## Epic map (every source item has one owner)

| Epic | Source items |
|---|---|
| E01 | L92, plus site slots for L12, L17, L35, L37, L43, L51, L52, L56, L58, L59, L61, L74, L81, L82, L85, L40, L50 |
| E02 | L01, L13, L14, L18, L53, L55, L57, L76, L77, L78, L91, L93 |
| E03 | L03, L07, L08, L09, L10, L16, L23, L24, L41, L49, L79, L80, L88 |
| E04 | L04, L83, L84 (writing: docs, direction, characters, 70-quest outline), L86 (first pass), L58 (who lives where), L67 + L68 (design) |
| E05 | L36, L75 |
| E06 | L02, L05, L06, L11, L19, L20, L71 |
| E07 | L26, L27, L34, L48, L65, L70, L87, L89, L94 |
| E08 | L15, L25, L29, L32, L33, L90 |
| E09 | L31, L46, L47, L63, L64, L73 |
| E10 | L21, L22, L58 (build homes and workplaces) |
| E11 | L35, L51 |
| E12 | L38, L42, L43, L44 |
| E13 | L52, L74, L82 |
| E14 | L17, L56, L81 |
| E15 | L85 |
| E16 | L12, L37, L39, L69, L72 |
| E17 | L28, L40, L50 |
| E18 | L30, L54, L66, L67, L68 |
| E19 | L59, L60, L61, L62 |
| E20 | L04 (applied), L45, L58 (quest pickups/drop-offs at homes), L84 quests 1–35 (rewrites the existing 17 main quests in place where the bible says so) |
| E21 | L45, L83, L84 quests 36–53 |
| E22 | L84 quests 54–70 with the extended pivotal quests, L86 final lore pass, batch finish |

## Source list (verbatim)

- L01 fix collission in vehicles again. driving around circular or just larger prefabs is hard. i cannot getm y vehicle close to them without getting stuck. another example is clog cruiser cannot get through the little canal entrance
- L02 when headlights come on, stagger them so they don't ll turn on at once.
- L03 make sure very follow quest is completable. many times they get stuck
- L04 make sure dialog is written in such a way that player has enough context
- L05 reduce the ambient particles a little bit
- L06 add weather and snow and such. clouds are a bonus too. add option to disable in options
- L07 the plane with the ad gets stuck in cutscene but banner keeps moving
- L08 birds also stay stuck floating in cutscenes
- L09 when doing a quest, spawn players vehicle naerby so they are good to drive
- L10 the little sprinkler things in the starting area are glitchy and ahve tall water cone shooting out of them
- L11 add a neat transition where time sepeds up rapidly and when a cutscene is expected to start during a different time of day. this shouldn't effect the overall world unless intentional
- L12 add some construction sites. make them gnome themed and lore appropriate
- L13 reduce the amount of screenshake
- L14 allow slowly backing up in planes
- L15 add insurance, so that I can reclaim my vehicle for a price
- L16 i cannot jump over the wall into the sandpit. there is invisible wall above the ramp
- L17 add a toadstool forest somewhere
- L18 fix gnome not staying put in vheicle while driving fast. they often clip through
- L19 more variation in bird flying path. don't just have follow static route
- L20 make some of the world stuff like the planes not always present and sometimes make appearances
- L21 introduce the player's own home. make it one of hte earlier quests and have it be loaned to them increasing their debt
- L22 allow player to customize it. for now just make an apartment in the downtown available but we will have future options like for those out in the field
- L23 fix bridges - they go all the way to the bottom of hte canal atm. can drive through though, but visually fucked
- L24 give way around the raft int he canal it's annoying s hell
- L25 garage and persoanl vehicle - personal vehicle shouldn't be very car of same type. allow storage of multiple cars of same type. also mark it on map where to store
- L26 add option to zoom in on map and navigate around it. google maps style. bonus for 3d building option (but much lower res)
- L27 the key on the map on mobile takes up the entire map making it unusable
- L28 build a society underneath the highway. give a quest or two. make them a bit crazy and radical but brilliant
- L29 give a shop where i can buy new cars. new shop for boats too. new shop for aircraft
- L30 add a chef job, so that players can cook and make some dishes. should be fun.
- L31 ake footsteps a little quieter
- L32 rebalance money a little. equipment should be a bit more expensive. make sure we have soem gridn but don't have to endlessly grind
- L33 introduce an inventory for snacks that heal and maybe some other fun things
- L34 add option to hide bird popup sound
- L35 add an ocean region with skiing and tubing so that gnomes can have fun. not sure hwo this will reconcile with the world but surely it won't matter. add some new quests, maybe tie in to some other quests. boardwalk too for sure. ferris wheel as well.
- L36 start developing the interiors of some of these buildings
- L37 add a vineyard and mansion somewhere appropriate
- L38 make sure we do have polar bears and they are really chill
- L39 make sure we have more fauna and deer
- L40 add a cult somewhere.
- L41 fix the fac that a amillion gnomes sometimes are just chilling in one area
- L42 add the option to go sledding
- L43 add a ski hill and skiing
- L44 add ice fishing
- L45 add some more quests to the main story that interact with these nwere areas so they are all tied in. ensure same quality with cutscnes and character development
- L46 try and add more sound in cutscenes
- L47 add charactger voices using the shared voice pack. kind of implemented but could be better. maybe make it so radio text is read out at text speed and a little bit more on the screen. don't actually read it using the `news bulletin` voice just the gnome voice, but more radio sounding.
- L48 reduce the height of quest markers, add option to make them higher again in options
- L49 big lous car loses its mods after the cutscene
- L50 add an underground society. this will have a small mini-questline for moles and doing mole jobs. amke them fun innocent little fellas that are rather cute but misunderstood broadly by gnomes and tall ones. make dj moleman make an appearnace.
- L51 add a pirate ship somewhere
- L52 add a research university somewhere. should have a good number of buildings. may require map extension to support. also ensure it has an observatory. observatory should be on a giant hill (perhaps giant ant hill or termite mound?) and have a ramp that allows players to drive off it
- L53 add more ways for vehicles to break and lose parts. doesn't need to be fulyl realistic for dynamic, but the more parts we lsoe the better
- L54 add a bubble-boy style vehicle quest where the player unlocks the bubble-mobiel or ability to unlock one. should just allow them to roll around hamster style
- L55 improve the vehicle gravity situation when we go off ramps. it just kind of feels floaty atm. and when we land we bounce a good bit
- L56 add a dirt race track that is rather bumpy with big banked turns. add some new dirt-bike liek vehicle. may require map extension.
- L57 mkaei t so when fire bullets, acorn shells appaer on the ground
- L58 introduce buildings or apartments or stuff wher ethe main characters and side characteres live and work. Right now we have just work in most cses ,but no homes. I'd like to have it be that we can recognize special aplces where people live and groudn us in the world. all characters should have a home. some may never be acknolwedged. some quests should be rew-written or extended to have us pick up or drop people off at homes, places of work, etc.
- L59 add public basketball court
- L60 add ability to play basketball (steal mechanics from GBA GJAMj, share code if possible)
- L61 add public skate park
- L62 add ability to skateboard (ather board tie in)
- L63 add more varitions to existing high-usage animations
- L64 start exploring the sonic deisgn some more. build sound design bible. start adding more sound content.
- L65 add option to disable bird sounds in additon to disabling bird sound icon.
- L66 add quests to introduce player to birding, hunting, fihsing
- L67 rework the side quests available to player so that they aren't overwhelemd. unlock some as game progresses and other characters make sense to appear
- L68 when completing a series of quests, make some change in the world so the player can feel the world devloping
- L69 add the ability to buy a farm and start growing produce/farming/whatever as a way to make money. player can farm and sell stuff or just straightu p grow an oak tree and get acorns (though it takes awhile)
- L70 remember where player is when logging in/out
- L71 make the world events slightly less frequent
- L72 add like little random hunter shacks and tents and other stuff to the more sparse parts of the map so they are less sparse.
- L73 I really like the intent and angles with the directed shots, but review them and add a bit more variation. I like what we are expressing, but want a bit more variety.
- L74 in one of hte new areas added, make an ew runway.
- L75 allow landing on top of buildings in helicopter and letting me run around.
- L76 add first person mode
- L77 fix camera sometimes jumping and turning randomly. I think due to when I turn my camera near close objects or edges/corners
- L78 allow me to crack gnomes who are driving
- L79 the parade float quest foot float is not on orange marker. the whole quest seems bugged.
- L80 golden acorn near spawn near hospital is not accessible
- L81 add a rally race track that goes up and down mountain through toadstool stuff and also has some water crossing parts (but also special water that cannot fully wtaerlog car).
- L82 add wind turbines somewhere
- L83 in general, make it so quests explore the world some and not just the main city.
- L84 add more quests to the main questline. I think we need some more character development. write out the docs, write out the direction, the characters, then start developing. I'm looking for 70 main quests, with a few extended quests at pivotal moments.
- L85 add a golf course. should have a club house interior. player can actually play golf using improted mechanics from gnome golf. will need a lot of new land space. add by breaking through a fence into someone elses yard. with big hedges and tall grass and large plants that line the course. still letp layer drive through it. add some quests and make owenr and pro and groundskeeper fun people with interesting stuff going on.
- L86 take another pass writing out menial lore for the new extended world.
- L87 loading takes a while. figure out a way to show a loaidng screen with some fun faccts and little concept-art like menu pages.
- L88 profiler always attempts to route user to port :8080 which doesn't work (i think is internal pod port but not exteranl)
- L89 TALKING HEAD chat pop ups on mobile take up most of the screen
- L90 add repair option to pay and glaze
- L91 make civilian cars ocassionaly have a mod or two.
- L92 take out 3 of the blocks in the main square and make a contiguous park. then make one mega 2x1 with a tunnel underneath somewhere else.
- L93 (added later) also, fix the npc driving. its pretty shite. they turn like its arcade mode still but we have been liking the casual mode a lot. but they should be able ot drive on all ideally.
- L94 (added later) i am unable to click the optisno on the tab menu, add a phone/tab menu redeisgn where we introduce a gnomlet that is a tablet with apps that give the different optiosn serviced by the phone and tab menu today. this will be more real gta like and is a good way of solving the problem. also include one fun app that is just gnomey bird.

## Standing decisions (leads do not ask about these)

- Today the main story has 17 quests over 5 chapters (`src/quests/chapter1.ts`–`chapter5.ts`). E04 writes the 70-quest
  outline; existing quests are kept, renumbered and rewritten where the outline says so. "Extended" pivotal quests are
  multi-part quests with several cutscenes.
- New land: E01 decides geometry. Planned new areas (names are placeholders until E04/lore settle them): the ocean
  coast with boardwalk, ferris wheel and pirate ship; the research university with an observatory on a giant ant-hill
  mound with a drive-off ramp and a new runway; a neighbour's yard behind a broken fence for the golf course; a dirt
  track and a rally route that climbs the north mountain through a toadstool forest; a ski hill in or beside Frostbite
  Fells; vineyard and mansion in the farm/forest edge; wind turbines on a ridge.
- Shared code from other games (`gba-gjam` basketball, `aether-board` skateboard, `gnome-golf` golf, `cooking-gnoma`
  cooking) is moved into a package and both games import it; the source game's build and tests must still pass. If an
  extraction would need behavioural changes to the source game, the lead copies nothing and writes the GTA version
  against the package API instead, and notes it.
- Every new place and person goes through lore (`npm run lore -- find`), prefabs (`@lawn/prefabs`), achievements
  (`packages/achievements`), mobile controls and the online pattern (`docs/roadmaps/gta-online-sync.md`).
- Cross-epic findings from the briefs (binding):
  - E01 raises the online position bound (`POS_BOUND` in `net.ts`, 950 today) to cover the new land, and reserves the
    off-map interior coordinate block (x >= 5000) that E05 uses; E05 exempts interiors from `clampToWorld`.
  - E01 also reserves sites for the car, boat and aircraft dealerships (E08) and treats the L92 tunnel roof as a
    walkable rooftop for E05. E01 adds `AIRFIELDS[]`; E13 converts consumers that need the second runway.
  - E05's `defineInterior` and the quest `interior:` gate are fixed contracts for E10, E11, E15, E17, E18; E05 states
    whether a large underground cell (mole tunnels) is supported.
  - E08 owns the property-purchase + loan contract (`registerProperty` / `buyProperty`) used by E10 and E16.
  - Save keys (`saveIO.ts`, `cloudSave.ts` MERGES, `saveIO.test.ts`) are additive; merge order follows the waves.
  - Gnomlet (L94, E07) becomes the home for app-like menus; epics before it add phone apps through the existing phone
    registry, E07 migrates them. Shared packages: `@lawn/golf` (E15), `@lawn/jam` + `@lawn/trickboard` (E19); cooking
    shares pure logic only (Cooking Gnoma is Phaser, GTA is three.js).
- Options added by this batch (weather, quest-marker height, bird sounds, bird pop-up sound, first-person) live in the
  existing Options panel; E07 owns the panel layout, the other epics add their own rows through whatever registry the
  panel has (or E07 adds one).
