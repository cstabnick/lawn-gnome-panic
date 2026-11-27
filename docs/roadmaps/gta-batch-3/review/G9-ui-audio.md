# G9 UI, audio and feel: editorial review, round 1

Editor: G9 (UI, audio and feel). Branch `gta-batch-3` at 0db911aa. Dev server `:5409`, headless Edge, my own puppeteer
scripts at 1280x800, 390x844 (touch) and 844x390 (touch). Each pass opened every Gnomlet app, Options (scrolled
through), the big map, the journal, a vehicle, heat 2, and the first quest (cutscene, then comms). Overlaps were
measured from DOM rects (`shots/G9/*-rects.json`). Shots are in `shots/G9/` (paths below are relative to it):
`<size>-NN-*.png`, with size `desk`, `port` or `land`. Audio was judged from the code: `sound/`, `voice/`, `radio/`,
`cutscene/cueAudio.ts`, and the mix table in `docs/design/gnome-theft-auto/sound-design.md`. Not done: a real phone,
real ears, night or snow by eye, the radio dial UI, the 3D buildings map view, pinch and drag on the map (synthetic
clicks on + and Legend did not register, so I make no claim about them). The `🛠` button in the shots is the
`?debug` trainer button, so I ignore it.

## Verdict

The bones are good. The Gnomlet looks like a real tablet. Its home screen is calm and readable on all three sizes, and
the registry worked: 24 apps from a dozen epics all reach it. Options is one panel, built from a registry, with honest
one-line descriptions. The comms card is the right size on a desktop. The sound bible is unusually disciplined: a
loudness budget, ducking rules, procedural recipes and a sleep rule for beds. Radio Adagio is a delight ("you have
missed nothing slowly").

The growing pains are in the parts no single epic owned:

- **Three things collide on a phone.** In landscape the 🔭 button sits on top of the Drive/Steal button. In portrait
  the objective text runs under the pinned shortcuts. The birding pill draws over the big map and over every panel.
- **The big map cannot be read.** About a dozen landmark names skip the label layout, so they print on top of each
  other. On a phone the map uses a third of the screen.
- **The Gnomlet is a launcher, not a tablet.** Two apps in three close the tablet and open an older panel. Those
  panels come in five visual styles. The apps that do live inside it use unstyled browser buttons.
- **Audio is sound by design, but there are gaps.** There is no music or radio volume. The radio is not ducked under
  mission calls. Footsteps never sound like wood or stone. The UI makes no sound at all.

None of this needs a rewrite. Most fixes are CSS, a shared kit, or one routing rule.

Counts: **5 blockers, 22 polish, 7 nits**. **27 craft, 7 spirit**.

## Findings

### 1. Landscape phone: the 🔭 binoculars button covers the Drive / Steal button
- **What:** at 844x390 on foot, the dock button `.gta-dock-btn` (🔭, x 324..368, y 318..362) is drawn on top of the
  context button that appears left of Jump when you are near a vehicle ("Drive" / "Steal"). The word "Drive" shows
  through under the binoculars icon. In portrait the two sit apart.
- **Where:** `land-41-heat.png` (Drive under 🔭), `land-rects.json`; the dock layout is in `ui/dock.ts`, and the
  touch cluster is in the HUD bottom row.
- **Why:** on a landscape phone, the main verb (getting into a car) can land on the binoculars instead.
- **Fix:** in landscape, put dock buttons into the cluster's flow (one row left of the context button), or move the
  dock column above the cluster's top-left corner. Add a rect-overlap assertion for the 844x390 cluster to the smoke
  run.
- **Severity:** blocker · **craft**

### 2. Big map: landmark names skip the label layout and print on top of each other
- **What:** `drawBig` sends PlaceKind blips and quest blips through `layoutMapLabels`, which skips colliding names.
  Any other blip with a `label` falls into the "another player's name" branch (`hud.ts` ~1546-1560). That branch
  draws its text with no collision check. Several places land in it: The Bathtub Queen, The Spokewheel
  (`coast/*.ts`), The Top Hat, The Bobble, The Keyhole (`mountainRoutes/*.ts`), the living-world pins
  (`living/runtime.ts:101`) and "Your <vehicle>" (`app.ts:2677`). The result is "The Bathtub Queen" over "Long Spoon
  Pier", and "The Brim Walk / The Top Hat / The High Tarn / Hatband" in one smear. The fitted view is also simply
  too dense.
- **Where:** `desk-17-app-map.png`, `port-17-app-map.png`, `land-17-app-map.png`.
- **Why:** L26/L27 were about making the map usable, and the map is the game's main way to find anything.
- **Fix:** keep the player-name branch for `b.player` only. Every other labelled blip becomes a wish (give the
  coast and mountain places a PlaceKind, e.g. `landmark` / `ride`). At the fitted zoom, show only quest names, region
  names and service names. Show the others from about 1.6x zoom (wish `minZoom`).
- **Severity:** blocker · **craft**

### 3. Portrait phone: the objective text runs under the pinned shortcut buttons
- **What:** at 390x844 the top-left card grows with the active objective ("Follow Pip Potsworth past The Gnomecino to
  Side-Valve Salvage"). It reaches x ~200. The pins row (`#gta-more-pins`, 📜 🚕 at x 136..232, y 122..166) is
  drawn over that text.
- **Where:** `port-50-comms-0.png`, `port-53-map-zoom.png` (background), `gnomlet.ts` `#gta-more-pins` CSS, and the
  `.gta-tl` card in `hud.ts`.
- **Why:** this happens in every mission on a portrait phone, and the objective is the text you most need to read.
- **Fix:** in portrait, either cap `.gta-tl` at `max-width: calc(100vw - 190px)` so it wraps, or move the pins into
  the right-hand column under ☰ (it has room above the gun block). Hiding pins while an objective shows is the
  cheaper option.
- **Severity:** blocker · **craft**

### 4. Kerbside Exchange: the contract rows squash and their text overlaps
- **What:** `.ex-body` is a scrolling flex column. Its `.ex-row` children keep the default `flex-shrink: 1`, so with
  many locked contracts each row is squeezed below its content height. Each row's price and "After …" line then
  print across the row above's border and title.
- **Where:** `desk-14-app-kerbside-exchange.png`, `port-14-app-kerbside-exchange.png`, `city/exchangeApp.ts` CSS
  (~line 108).
- **Why:** this is the city's job board, and it reads as broken.
- **Fix:** add `#gta-exchange .ex-row{flex:none}`. The same trap probably exists in other flex scroll lists; grep
  for `flex-direction:column` combined with `overflow-y:auto`.
- **Severity:** blocker · **craft**

### 5. The Gnomlet is mostly a launcher: 15 of 24 apps close it and open an older panel in another style
- **What:** only 9 apps open inside the tablet (Home, Farm, Unmown Checklist, Race Club, Gnomey Bird, Snowdrop,
  Founders' Green, Hedgeworth, Options). The rest are `run()` apps that close it: Bag, Kiln-Shield and Ledger
  (grey bottom sheet), Jobs (right drawer), Kerbside Exchange and Quest Journal (yellow-bordered modal), Field
  journal (teal modal), Hunting and Catch journals, Sling-Lift and the map. That makes five shells, five header
  styles and two close-button styles, and the tablet keeps disappearing under your thumb.
- **Where:** `desk-12-app-bag.png`, `desk-14…`, `desk-16-app-ledger.png`, `desk-19-app-jobs.png`,
  `desk-21-app-journal.png`, `desk-22-app-birdJournal.png`; `gnomlet/gnomlet.ts` `BRIDGED`, `launch()`.
- **Why:** L94 asked for "a tablet with apps that give the different options… more real GTA like". As it stands it
  is a menu of shortcuts to the old menus. This is the most visible inconsistency in the batch.
- **Fix:** add an `open` adapter so a panel can render its body into the tablet's `root` (most of these panels
  already build one DOM subtree; give them a `mount(root)` and drop their own backdrop and close button). Do the
  menu-like ones first: Bag, Ledger, Kiln-Shield, Jobs, Exchange, the four journals. The map and the taxi stay
  `run()`. Back and ⌂ then work everywhere.
- **Severity:** blocker · **spirit** (direction: is the tablet the home of every menu? L94 says yes)

### 6. Apps inside the tablet share no visual kit; four use bare browser buttons
- **What:** Race Club, Snowdrop, Founders' Green and Hedgeworth build their UI with inline `style.cssText`, and
  their buttons are user-agent defaults: light grey, black system text, square. Cards use `border:1px solid
  currentColor`. Home and Farm are bare text. The Unmown Checklist is properly styled, and Options has its own
  cards. These are four different looks in one tablet.
- **Where:** `desk-26-app-race-club.png`, `desk-28-app-ski-runs.png`, `desk-29-app-founders-green.png`,
  `desk-30-app-hedgeworth.png`; `winter/winterApp.ts:40-42`, `streetRace/raceApp.ts`, `sports/app.ts`,
  `golf/golfApp.ts`.
- **Why:** "hand-crafted" fails at the first tap. Grey browser buttons on a green glass tablet look unfinished.
- **Fix:** add a small kit to `GNOMLET_CSS`: `.gnl-card`, `.gnl-btn` (primary is yellow-outline like Options,
  secondary is ghost), `.gnl-stat` (label / value rows), `.gnl-empty` and `.gnl-section`. Convert the six apps to
  classes (no inline CSS). Use the same kit for finding 5.
- **Severity:** polish · **craft**

### 7. Empty states are bare
- **What:** Home shows one line ("Pip says the bench at Side-Valve is not a home…") on an otherwise empty 780x560
  tablet. Farm shows three lines. Kiln-Shield says "Nothing in your garages to cover yet." Quest Journal Active says
  "No active quest…". There is no picture, no next step and no way to act.
- **Where:** `desk-11-app-home.png`, `desk-13-app-farm.png`, `desk-15-app-kiln-shield.png`.
- **Why:** an empty state is the first thing a new player sees in these apps, and it should invite them in.
- **Fix:** a `.gnl-empty` block with a big icon, one line of flavour, and one action button: "Show on map" (sets
  the waypoint to the For Sale board, the bank or Pip), or "Open Ledger".
- **Severity:** polish · **craft**

### 8. Options names the wrong key for first person
- **What:** the First person row says "V or the eye button switches it too." V is the binoculars (`keys.ts:52`), and
  first person is F5 (`keys.ts:68`). The Gnomlet tile says F5 correctly.
- **Where:** `viewPrefs.ts:59`; `desk-31-app-options.png`.
- **Why:** the hint sends players to the wrong key.
- **Fix:** build the hint with `fillHint('{firstPerson}')`, like the Sound row does, so it follows the device.
- **Severity:** polish · **craft**

### 9. Journal empty state points at a tab that does not exist
- **What:** "No active quest. Walk up to any glowing marker on the map or check the Available tab." The tab is called
  **Open**.
- **Where:** `quests/journal.ts:143`; `desk-21-app-journal.png`. The comment at `quests/quests.ts:85` is stale too.
- **Fix:** "…or check the Open tab." Better still, make "Open" a link that switches to that tab.
- **Severity:** nit · **craft**

### 10. Ledger: "buy it in the Ledger app" is a dead end, and owned/for-sale state is unclear
- **What:** Windfall Croft's `buyHint` reads "Signed for at the For Sale board by the croft gate, or in the Ledger
  app". Any `buyHint` suppresses the Buy button (`ledger.ts:227-233`), so the Ledger shows that sentence and no button.
  The Farm app repeats the promise. Flat 3B shows a price and "Signed for at the First Kiln Bank counter", with no
  "Yours" and no "For sale", so you cannot tell whether you own it.
- **Where:** `ledger.ts:216-235`, `farm/farmApp.ts`; `desk-16-app-ledger.png`, `desk-13-app-farm.png`.
- **Fix:** show Buy whenever the property can be bought remotely (a flag on the def rather than the hint's presence),
  and drop "or in the Ledger app" where it can't. Give every row a status chip: Yours / For sale / Locked.
- **Severity:** polish · **craft**

### 11. The birding pill ("0/36 · Blustery") draws over the big map and over every panel
- **What:** the life-list and wind pill in `birding/scopeUi.ts:116-130` is `position:fixed; z-index:40`. The big map
  overlay is z 30, and the Jobs drawer and journals sit at similar levels. The pill appears on top of the map
  (`port-17`, `port-54`) and the Jobs drawer (`port-19-app-jobs.png`). The bird-call arrow ("▲ ♪ ?") also floats
  over the big map and over the Jump button (`land-54-map-legend.png`, `land-50-comms-1.png`).
- **Why:** it looks like a leak, and on a phone it hides part of the map.
- **Fix:** hide the pill and the call arrow while `body[data-more="open"]`, the big map or any panel is open (or
  drop both below the panel layer; see finding 12). Spirit side, for the decider: the pill is always on screen
  for a side hobby. Show it only with the binoculars up or within ~60 m of a hide or birding spot.
- **Severity:** polish · **craft**

### 12. There is no z-order scale, so layers fight
- **What:** z-index values across `src/` run from 6 to 70 with no shared table (10 modules at 60, 9 at 40, 8 at 30).
  The results include: the comms card (45) on top of the open big map (30) (`desk-53-map-zoom.png`), the
  achievement toast over the minimap and pins (`desk-22-app-birdJournal.png`), and finding 11.
- **Where:** `grep -o "z-index:[0-9]*" src` across `hud.ts`, `briefing/briefing.ts`, `gnomlet/gnomlet.ts`,
  `birding/*`, `city/exchangeApp.ts`, `ledger.ts` and the others.
- **Fix:** one `ui/layers.ts` with named layers: world-HUD 10, prompts 20, HUD-chrome 30, toasts 35, big-map 40,
  panels/tablet 50, comms 55, cutscene 60, modal-confirm 70. Each module imports its layer. While the map or tablet
  is open, the comms card collapses to a one-line strip at the top ("📞 Pip Potsworth · tap to read").
- **Severity:** polish · **craft**

### 13. On phones the big map uses a third of the screen
- **What:** the map is a square `px = min(innerWidth-24, innerHeight-120)`. In portrait that is about 370x370 with
  the lower half of the screen empty (`port-17`). In landscape it is about 300x300 in the middle of an 844 px wide
  screen (`land-17`). Labels, controls and legend all fight for that square.
- **Why:** a phone is where the map most needs every pixel, and L27 was a phone complaint.
- **Fix:** on coarse pointers, make the map viewport the full safe area (a rectangle, not a square; `bigMapView.ts`
  already handles pan and zoom). Float the ✕, +/− and 3D controls in the corners, and make the legend a bottom
  sheet over it.
- **Severity:** polish · **craft**

### 14. Desktop legend: one long column that clips and runs off the screen
- **What:** at 1280x800 the legend is a single column of about 20 chips from y 45 to the bottom edge. "Mossbank
  Boathouse (your boat" is cut at the right, and the column overlaps the minimap's x range.
- **Where:** `desk-17-app-map.png`, `desk-53-map-zoom.png`; `hud.ts` `drawLegend` / `paintLegend`.
- **Fix:** group the chips (Services, Shops, Sport, Your things, Story), use two columns when the height runs out,
  set `max-height` with scroll, and list only the kinds in view. Never let a chip run past the viewport.
- **Severity:** polish · **craft**

### 15. The minimap is a wall of icons downtown
- **What:** `drawMap` draws every PlaceKind blip in range as a 6-7 px badge, with no cap and no priority. In
  downtown Turfton the 128 px minimap holds about 25 badges (towers, shops, services), with the player arrow and
  objective lost among them.
- **Where:** `desk-01-hud.png`, `port-01-hud.png` (the 96 px phone minimap is worse); `hud.ts` ~1140-1152.
- **Why:** the minimap's job is "where am I going". At the moment it is decoration.
- **Fix:** on the minimap, draw quest and objective pins, services (`RIM_PLACES`), and at most the six nearest other
  places. Never draw `tower` landmarks. Fade badges toward the edge.
- **Severity:** polish · **craft**

### 16. Heat and health meters look like buttons, and the heat level is unreadable
- **What:** the wanted meter (a cop face in a ring) and the life meter (your gnome in a ring) sit in the same row and
  the same round chrome as the tappable pins (📜 🚕) and ☰. Heat shows only as a blue arc around the cop. There
  are no pips and no number. The evade state is a tiny "Units en route 2s" with a 64 px bar, tucked under the gun
  block.
- **Where:** `desk-41-heat.png`, `port-41-heat.png`, `land-41-heat.png`; `hud.ts` `.gta-meters`, `.gta-evade`.
- **Why:** in a chase you need to know your heat level at a glance. Tapping a meter does nothing, which feels like a
  broken button.
- **Fix:** give the meters a distinct, borderless shape, put heat on its own line as 1-5 hat pips (GTA stars, gnome
  style), and put the evade label and bar right under the pips at readable size (13 px, bar 96 px). Keep the pins
  as the only round buttons.
- **Severity:** polish · **craft**

### 17. The top-left stats card is always on and growing
- **What:** "🌰 50 / Kiln-Debt: 5,000 / Cracked: 0 / Noon Stunts: 0/13" is always shown, with the objective block
  under it. "Noon" (the time) and "Stunts: 0/13" share a line and read as "Noon Stunts". "Cracked: 0" is on screen
  from minute one.
- **Where:** `desk-01-hud.png`, `port-01-hud.png`; `hud.ts` ~940-960, 1797-1810.
- **Why:** GTA's HUD shows money and a short-lived context line, not a ledger. The charm is in the world, and this
  card hides part of it, especially in portrait.
- **Fix:** keep acorns always. Show debt only in the Ledger and for 4 s after a payment. Show "Cracked" only while
  heat > 0. Show stunts only for 5 s after one lands or in a stunt area. Put the time on its own line (or in the
  Gnomlet bar; see 27).
- **Severity:** polish · **spirit**

### 18. Phone HUD overlaps around the gun block
- **What:** in landscape the gun block (x 718..810, y 222..303) overlaps the Fire button (x 684..768, y 290..374)
  by 13 px, and "Pistol" sits right on Fire's rim. In portrait the toast line (x 55..336, y 210..240) runs across
  the gun block (x 280..372, y 174..255), so "A contract is waiting at Pip Potsworth" prints over "12 / 12".
- **Where:** `land-rects.json`, `port-rects.json`; `land-01-hud.png`, `port-01-hud.png`.
- **Fix:** in landscape, lift `.gta-gunblock` so its bottom clears the cluster top (`bottom: cluster + 8px`). In
  portrait, cap `.gta-toasts` at `right: 100px`, or move toasts to y ≥ 270.
- **Severity:** polish · **craft**

### 19. The portrait comms card covers the ammo and the objective
- **What:** in portrait the comms card starts at `map + 60px` (about y 178) and spans the full width, up to 28vh
  (to about y 414). It covers the gun block and the lower part of the objective block, which is exactly when the
  objective is being explained.
- **Where:** `briefing/briefing.ts` CSS (`@media (max-width:700px) and (orientation:portrait)`); compare
  `port-50-comms-*`.
- **Fix:** anchor it under the gun block (`top: map + 140px`), or at the bottom just above the touch cluster (the
  thumbs are already there to tap Next). Keep the 44 px icon buttons.
- **Severity:** polish · **craft**

### 20. Acorn amounts are written four different ways
- **What:** the HUD says "Kiln-Debt: 5,000". The Ledger says "5000 🌰" and "price 1500 · 0 down". Sling-Lift says
  "from 70 Acorns". The Exchange says "500 Acorns". The Gnomlet tile says "50 🌰 · owe 5000".
- **Where:** `desk-02-gnomlet.png`, `desk-14…`, `desk-16…`.
- **Fix:** add one `formatAcorns(n)` → "5,000 🌰" and use it in every panel, and capitalise "Price".
- **Severity:** polish · **craft**

### 21. Option labels and section styling are inconsistent
- **What:** values appear as "Screen shake: Normal", "Water waves: high", "Time of day: Auto Cycle", "Profile &
  Upload: OFF" (which becomes "Profiling & Upload: ON" when toggled), and "Radio text: on". Section headings are
  yellow and cramped (the heading touches the card above), with no gap before a new section. The Sound section's
  explanation ("World: other vehicles… U mutes everything") floats under Radio voice, two rows away from the
  sliders it explains. "Radio voice" is under Sound, but "Radio text" is under Dialogue and radio.
- **Where:** `desk-31-app-options*.png`, `port-31-app-options-p2.png`; `options.ts`, `sound/volumeUi.ts`.
- **Fix:** values in Title case ("On / Off / High / Normal / Auto"); 14 px top margin on sections; the note right
  under the sliders (order 45); Radio voice moved next to Radio text; one label for the profiler toggle.
- **Severity:** nit · **craft**

### 22. No music or radio volume
- **What:** Options has Sound on/off and World, Ambience and Voices sliders. There is no slider for the radio or
  `@lawn/music`, none for cutscene music (`CUE_LEVEL` 0.9), and player SFX and UI go straight to the master.
- **Where:** `sound/volumeUi.ts`; sound bible §2.
- **Why:** turning the radio down while keeping voices and the world is the most common audio setting in any GTA.
  Today the only way is per-station off.
- **Fix:** add a "Radio and music" slider (radio player plus `@lawn/music`, `gta.vol.music`) and route cutscene
  music pads through it. Keep the bible's ratios at 100 %.
- **Severity:** polish · **craft**

### 23. The radio is not ducked under mission calls
- **What:** cutscenes duck the radio to 0.25, but a comms briefing or call does not touch it (`setRadioVoiceBusy`
  only stops host chatter, `app.ts:714`). Voices sit at `VOICE_LEVEL` 0.5 under master 0.5 (−12 dB), and the radio
  is at full under master (−6 dB). While driving with music on, Pip's call plays 6 dB under the song.
- **Where:** `briefing/briefing.ts`, `radio/player.ts`, `sound/index.ts` duck rules.
- **Why:** the bible's own rule 5 is "One thing leads", and a mission call is the thing that leads.
- **Fix:** while `briefing.active`, ramp the radio to 0.35 (0.3 s in, 0.6 s out), the same way the cutscene step
  does. Add the row to the bible's ducking table.
- **Severity:** polish · **craft**

### 24. Footsteps ignore what you are standing on
- **What:** the player's step sound is `surfaceAt(p.x, p.z)`, the ground under the column (`sound/watchLife.ts:122`).
  On the boardwalk and Long Spoon Pier you hear sand. On rooftops you hear the street. Interiors are at x ≥ 5000,
  which counts as city biome, so you hear `grass` on a flat's floorboards. Turfton pavements are also `grass`
  (`surfaces.ts` default branch). There is no wood, stone or floor step at all.
- **Where:** `sound/watchLife.ts:113-127`, `surfaces.ts:93-130`, `sound/recipes/world.ts:280-290`.
- **Why:** footsteps are the sound you hear most. L31 asked for them quieter, and they should also be right.
- **Fix:** add `step-wood` and `step-stone` recipes. When the player stands on a collider (grounded above terrain),
  use that box's surface tag (boardwalk, pier, floors → wood; roofs, pavements, plazas → stone). Otherwise fall back
  to the ground. NPC steps can stay as they are.
- **Severity:** polish · **craft**

### 25. The UI makes no sound at all
- **What:** the Gnomlet has no open, close or tap sound, and Gnomey Bird has no flap, score or crash sound. An
  incoming call "rings" for 0.6 s but only on screen (`briefing.ts` `RING_SECONDS`, no audio). The player SFX bus
  has the horn and shop sounds, but the tablet is silent.
- **Why:** on a phone, a tablet that clicks feels real. A silent call ring reads as a bug.
- **Fix:** four tiny, dry recipes on the player SFX path: tablet unlock (a soft clay "tok" and a rising blip), tap
  tick, a double "burr-burr" call ring through the radio filter, and a Gnomey Bird flap and point. Follow the
  "a little too earnest" rule.
- **Severity:** polish · **spirit**

### 26. Rain falls from a blue sky
- **What:** `WEATHER_LOOK.rain.overcast` 0.75 is scaled by intensity, so light-to-mid rain gives a clear blue sky,
  hard sun shadows and long white rain streaks.
- **Where:** `desk-41-heat.png`, `land-41-heat.png`, `port-41-heat.png`; `weather/config.ts:24-29`,
  `atmosphere.ts` `applyWeatherLook`.
- **Why:** it reads as a rendering glitch rather than weather.
- **Fix:** give rain an overcast floor (e.g. `0.45 + 0.4 * i`) and soften the sun shadow with overcast. Use
  shorter, thinner streaks on small screens.
- **Severity:** polish · **craft**

### 27. The Gnomlet clock shows real time
- **What:** the tablet bar shows the device clock (17:58) while the HUD says "Noon" and the sky agrees.
- **Where:** `gnomlet.ts` `paintClock()`.
- **Fix:** show the game time from the time-of-day system ("12:04", or the HUD's label). It is the natural home for
  the clock if the HUD drops it (17).
- **Severity:** nit · **craft**

### 28. The Gnomlet's groups and names don't hang together
- **What:** "Kerbside Exchange" (the contract board) is under *Money and things*, and its icon is 📌, the same glyph
  as the pin marker on pinned tiles. "Jobs" is under *Out and about*. Race Club, Snowdrop, Founders' Green and
  Hedgeworth are under *Games* next to Gnomey Bird and Emotes. "Turfton Taxi" (the app) is a different brand from
  "Kerbstone Cabs" (the job). The checklist calls the Field journal "your binocular journal". Detail lines are cased
  three ways ("no runs yet", "No card yet", "Nothing on the court yet").
- **Where:** `desk-02-gnomlet.png`, `desk-03-gnomlet-bottom.png`, `desk-25-app-unmown-checklist.png`;
  `gnomlet/gnomlet.ts` `BRIDGED`, each app's `group`.
- **Fix:** regroup as Calls (Taxi, Sling-Lift), Work (Jobs, Kerbside Exchange 📋), Money and home (Bag, Ledger,
  Kiln-Shield, Home, Farm), Sport and places (Race Club, Snowdrop, Founders' Green, Hedgeworth), Journals, Fun
  (Gnomey Bird, Emotes, Party), Settings. Use sentence case for every detail line, and settle the taxi brand with
  lore.
- **Severity:** polish · **spirit**

### 29. Options shows the profiler to players, and "Cheats" holds the default handling
- **What:** the last Options section is "Profiler" (Profile & Upload, Perf overlay, Upload now, "View reports at
  /admin/profiler/"), and it always shows. "Cheats" contains Driving realism, including "Casual … The default".
- **Where:** `options.ts:329-360`; `desk-31-app-options-p3.png`.
- **Why:** dev tools in the player's settings break the fiction, and calling the default handling a cheat is odd.
- **Fix:** put Profiler inside a collapsed "For developers" disclosure (or behind `?debug`; the user does use it, see
  L88). Rename the section "Handling", with "Silly handling (cheats)" as its sub-head.
- **Severity:** polish · **spirit**

### 30. The loading screen stops at the old world
- **What:** 36 facts and 5 concept-art pages cover Turfton, the kiln, mowers, Tessie and the coast. There is nothing
  for Rootwell, the Anthill, Capwood, Snowcap Rise, Hedgeworth, the Unmown, Trellisdown or Pardonlin's sights (the
  Bean Tower, Radio Adagio). The stage still says "Building Turfton…". One fact is garbled: "Parallel parking
  followed by morning."
- **Where:** `loading/facts.ts`, `loading/pages.ts`, `main.ts:6,16`; `desk-00-loading.png`.
- **Why:** the loading screen is the game's first impression and the cheapest place to show the batch's new world.
- **Fix:** add about 12 facts from the batch-3 lore (one per new place) and 3 pages (Anthill Observatory, Pardonlin
  rooftops, the Unmown from a hide). Rename the stage "Building the Yard". Fix or cut the garbled fact.
- **Severity:** polish · **spirit**

### 31. The arrival title card is spent behind the loading fade
- **What:** the region card "Turfton · Downtown Turfton", the welcome line and the first toast all start while the
  loading screen is still fading out, so the texts stack (`port-00-loading.png`). The label also repeats the town
  name.
- **Where:** `hud.ts` `showBiome`, `loading/loader.ts` `hideLoading`.
- **Fix:** start the HUD's first region card after the fade ends. Drop the biome when the district name already
  contains it ("Downtown Turfton").
- **Severity:** nit · **craft**

### 32. The Field journal's "?" badge looks like a help button
- **What:** unseen and heard-only species carry a round "?" rarity badge in the top-right of the card, the size and
  shape of an info button. It does nothing. Heard-but-not-seen birds still show "?".
- **Where:** `desk-22-app-birdJournal.png`; `birding/journalUi.ts:195-201`.
- **Fix:** write "Rarity unknown" in small text, or drop the badge until the bird is seen.
- **Severity:** nit · **craft**

### 33. Kerbside Exchange lists every locked contract and the mission that unlocks it
- **What:** the Locked section lists all of them, each with "After 'Kiln-Resin & Black Ice'", "After 'The Don's
  Cigars'" and so on, which shows story mission titles hours ahead.
- **Where:** `desk-14-app-kerbside-exchange.png`.
- **Fix:** show the next one or two locked contracts, then "and 7 more". Show only the unlocking titles of missions
  already seen in the journal.
- **Severity:** nit · **spirit**

### 34. Small text inconsistencies across the apps
- **What:** "–" (Hedgeworth table) next to "—" (Best round). "the Wool Run" and "the Tea-Tray Run" are lower-case
  card titles. "Kerb Row Circuit - Street" uses a hyphen as a separator. "Games: 0. Wins: 0." uses full stops between
  stats. The Unmown checklist uses tappable-looking checkboxes that tick themselves.
- **Where:** `desk-26…`, `desk-28…`, `desk-29…`, `desk-30…`, `desk-25…`.
- **Fix:** handle all of these with the kit from finding 6: a stat row (label / value), "—" for none, Title case
  titles, a "·" separator, and a non-interactive tick glyph for auto-ticks.
- **Severity:** nit · **craft**

## Fine as is (checked, no finding)

- The Gnomlet home grid at 390x844 and 844x390: the 44 px bar buttons, 88 px tiles, safe-area padding and the dock
  all fit.
- The comms card on desktop: size, portrait ring, "BRIEFING · FRESH OUT THE KILN" tag, Skip and Next.
- The cutscene subtitle card and letterbox in portrait (`port-42-quest-4.png`).
- The vehicle touch cluster in both orientations (`port-40-vehicle.png`, `land-40-vehicle.png`).
- Options at 390x844: the cards stack to one column and every row is ≥ 44 px.
- Gnomey Bird: it is a good toy, the right size, with a big Flap button and the score in a clean outlined font.
- Radio Adagio's writing and the radio voice rules: hosts in their own voices through the radio filter, and the
  160-character cut.
