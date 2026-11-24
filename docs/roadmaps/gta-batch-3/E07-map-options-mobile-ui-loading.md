# E07 Map, options, mobile UI and loading
Wave: 3 · Depends on: E01 (map extent: the world grows past `worldHalf` 900) · Kind: Polish
Source items:
- L26 add option to zoom in on map and navigate around it. google maps style. bonus for 3d building option (but much lower res)
- L27 the key on the map on mobile takes up the entire map making it unusable
- L34 add option to hide bird popup sound
- L48 reduce the height of quest markers, add option to make them higher again in options
- L65 add option to disable bird sounds in additon to disabling bird sound icon.
- L70 remember where player is when logging in/out
- L87 loading takes a while. figure out a way to show a loaidng screen with some fun faccts and little concept-art like menu pages.
- L89 TALKING HEAD chat pop ups on mobile take up most of the screen
- L94 i am unable to click the optisno on the tab menu, add a phone/tab menu redeisgn where we introduce a gnomlet that is a tablet with apps that give the different optiosn serviced by the phone and tab menu today. this will be more real gta like and is a good way of solving the problem. also include one fun app that is just gnomey bird.

## Goal
Make the player-facing shell comfortable: a map you can zoom and pan, a legend that does not eat a phone screen,
one Options panel with a registry every epic can add rows to (E06 weather, E02 first-person, E08 and more all need rows),
quest markers that are not skyscraper-tall, bird alert and bird sound toggles, the game remembering where you
stood, a real loading screen, and comms pop-ups that leave the game visible on a phone.

## Scope
In:
- Big map zoom and pan (wheel, pinch, drag, +/- buttons, recenter), labels re-laid out per zoom; optional low-res 3D
  buildings view (bonus, last, behind a toggle).
- Legend behaviour on phones, including landscape phones.
- Options registry (`src/optionsRegistry.ts`) and the panel rebuilt on it; existing rows migrated (not rewritten).
- Bird toggles (L34, L65), quest-marker height option (L48).
- Position persistence (L70).
- Loading screen with fun facts and concept-art pages (L87).
- Comms/talking-head pop-up size on mobile (L89).

Out: new options owned by other epics (they add rows through the registry); the profiler :8080 bug (L88, E03);
the map's *content* (new POIs for new sites: each content epic adds its own `PlaceKind`/blips).

## Code pointers (confirmed)
- Big map lives in `src/hud.ts` (1381 lines): `buildBackground(world)` (~line 700-760, pre-renders the whole world to
  `bgCanvas`, buildings drawn from `world.boxes` with `bx.h >= 2`), `drawBig(s)` (~1036) draws the canvas square of
  `px = min(innerWidth-24, innerHeight-120)`, markers via `drawMarker`/`drawPlaceIcon`, labels via
  `layoutMapLabels` (`src/mapIcons.ts:68`, wishes with `prio`), region names (`REGIONS`, `LABEL_AT`), legend via
  `drawLegend` (~477) with `LEGEND` rows (`PLACE_ROWS` from `PLACE_STYLE`). Coordinates: `X(x) = (W/2 - x)*k`,
  mirrored. `setBig(open)` (~1021); **any pointerdown on the overlay closes the map** (`big.addEventListener('pointerdown', ...
  setBig(false))`), so drag/pinch must stop that. Map POIs: `src/mapPois.ts` (`placeBlips`, `landmarkBlips`), icons in
  `src/mapIcons.ts` (`PlaceKind` union, `PLACE_STYLE`, `RIM_PLACES`).
- L27 cause: `legendOn = window.innerWidth >= 600` (hud.ts ~872) decides the default, so a landscape phone (>=600 wide,
  ~390 high) opens with the legend on; `drawLegend` is sized from `px` (small if `px < 360`) and covers up to 60 percent
  of the map height, and the toggle button `.gta-legendbtn` is the only escape. Use height as well as width, default
  off under 700 px on either side, and make the legend a collapsible chip list drawn outside the map square when room.
  The `LEGEND` array also grows with E01-E19's new `PlaceKind`s: cap the legend to kinds present, grouped.
- Options panel: `src/options.ts` (309 lines): `createOptions(ui, onPickMode, onPickTime)` builds `#gta-options` with
  hand-appended sections (touch layout, controls, radio text, Dialogue/text speed, Multiplayer map-players, Time of
  Day, then `mountSoundOptions(panel)` (`src/sound/volumeUi.ts`), `mountWaveOptions(panel)` (`src/waveOptions.ts`),
  `mountCloudStatus(panel)` (`src/cloudSave.ts:354`)). Called once at `src/app.ts:2134`. Per-browser prefs are one tiny
  module each (`mapPrefs.ts` keys `gta.mapPlayers`; `cutscene/textSpeed.ts` `gta.textSpeed`; `radio/prefs.ts`
  `gta.radioText`), each firing a `window` event on change. These keys are settings, deliberately outside
  `GTA_SAVE_KEYS` (`saveIO.ts` header comment); keep new options out of the cloud save too.
- Birds (L34/L65): calls are played in `src/birding/birding.ts` ~line 538-548 (`playAt(birdSoundId(s.id), fl, {bus: 'ambience'...})`
  then `scopeUi.showCall(...)`, the screen-edge arrow with "♪ / ♪ ?", `src/birding/scopeUi.ts:~380`); ambient bird beds
  `bird-chirp` / `bird-song` / `crow` come from `src/sound/ambience.ts` (~line 175) and `sound/ids.ts`; flush sound
  `BIRD_SFX.flush`; "NEW ON THE LIFE LIST" callout at `birding.ts:232`. There is no existing toggle. Decision: two
  options, "Bird alerts" (the ♪ arrow and its pop-up chime/callout sound) and "Bird sounds" (flock calls, flush, the
  ambience bird beds); "Bird sounds off" also silences the alert sound, "Bird alerts off" hides only the icon and its chime.
- Quest markers (L48): giver markers in `src/quests/quests.ts` ~line 420-460: `beam` is a 90 m tall open cylinder
  (`CylinderGeometry(0.9, 0.9, 90, 12, 1, true)` positioned at `heightAt + 45`), `star` at +4, letter badge at +2.7,
  ground ring. Objective beams are 40 m cylinders in `quests/objectivesAction.ts:29`, `objectivesCity.ts:66`,
  `objectivesTessie.ts:70`; `visitRun` ring at `quests.ts:249`. Add one `markerScale` setting (low default ~0.35 of the
  current height, "tall" restores 90/40) read by all five places through a tiny `src/questMarkerPrefs.ts`
  (`getMarkerHeight()` returns the beam length) so the sites are not edited separately by later epics.
- Position persistence (L70): player is spawned with `player.respawn(world.spawn.x, world.spawn.z, world.spawn.yaw)`
  (`src/app.ts:263`); `introTour.ts` (key `gta-intro-seen-v1`) runs on first start; `main.ts` awaits
  `startCloudSave()` before importing `app`. Save keys are listed in `src/saveIO.ts` `GTA_SAVE_KEYS` (cloud mirrors the
  same list, `cloudSave.ts` `mergeEntry` is last-write-wins per key). Add `'gta-position-v1'` there: `{x, z, yaw, region,
  vehicleId?, t}` written every ~5 s while stationary/moving and on `pagehide`/`visibilitychange` (hook pattern in
  `src/net.ts:311`, `saveHook.ts`).
- Loading: `index.html` has only `<canvas id=game>` and `<div id=ui>`; `src/main.ts` is 10 lines
  (`await loadMyGnome()`, `await startCloudSave()`, `await import('./app')`). `app.ts` runs the whole world build at
  module top level (`buildWorld`, ~line 255 on) before `requestAnimationFrame(frame)` (last line ~2293), so the screen is
  blank for the build. `public/` has only `favicon.svg`.
- Comms pop-up (L89): `src/briefing/briefing.ts` (`createBriefing(ui)`; CSS block ~line 58-96). Desktop card is
  `min(560px, 100vw-24px)` at `bottom: 150px`; `@media (max-width:700px)` moves it to `top: 300px` below the minimap with
  `min-height: 4.2em` text and 44 px buttons; `@media (max-height:500px)` is the landscape variant (`width: min(440px, 52vw)`).
  Reported as "most of the screen": check the portrait path at 390x844 with a 2-3 line `briefing` (title row + 62 px
  portrait + text + Skip/Next row), and `quests/comms.ts` lines (<=16 words per the direction bible). Also the
  `CHARS_PER_SECOND = 40` constant here ignores the Options text speed; consume `cutscene/textSpeed.ts` while you are in it.

## Contracts this epic provides
- `src/optionsRegistry.ts`: `registerOption({section, id, label, desc, kind: 'toggle'|'cycle'|'slider', get, set, order?})`
  and `registerOptionsSection(id, title, mount)`; `createOptions` renders the registry (so call order of epics does not
  matter) and keeps the 44 px rows, the landscape two-column layout and `buttons.set(id, el)` focus map for the gamepad.
  Existing sections are migrated to it without changing keys or behaviour.
- Pref helpers with the event-on-change pattern: `getBirdAlerts/getBirdSounds`, `getMarkerHeight()`.
- `bigMap.zoomTo(x, z, scale)` (for a quest "show me on the map" and E10-E19 POIs), and `hud.setWorld` still the entry.
- `showLoading(steps)` / `loadingProgress(n, label)` (`src/loading/`): content is data (`facts.ts`, `pages.ts`), so
  later epics append facts about their areas.
- `gta-position-v1` save key.

## Contracts consumed
- E01: the new `worldHalf` and region polygons (map extent, `buildBackground` size, `LABEL_AT`), site-registry names for POIs.
- `lore`: facts and page text must come from `docs/lore/` (`npm run lore -- find <word>`), not invented.

## Online / mobile / achievements / prefabs / lore notes
- Online: all options and the map view are local. Position persistence is local plus the cloud save; online rooms spawn
  at the host-agreed spot (`online/install.ts`): ignore a saved position when joining a room, and never restore into a
  vehicle owned by someone else. Other players on the map keep honouring `getMapPlayers()`.
- Mobile: map gestures are one-finger drag, two-finger pinch, double-tap to zoom; the close action moves to the existing
  "close" hint plus an X button (44 px) because tap-anywhere-closes must go. Keep `touch-action: none` and `e.preventDefault()`
  on the canvas. Check 390x844 and 844x390, and a short desktop window.
- Achievements: none required. Optional "Cartographer" (visit every region, zoom the map). Skip unless trivial.
- Prefabs: UI and effects only. The 3D-buildings view reads `world.boxes` (no prefabs).
- Lore: loading facts and concept-art pages are story content: follow `docs/lore/canon.md`, run `npm run lore` after
  adding any lore entry. Concept art is self-generated (canvas/SVG drawn in code, prefab icons via `prefabIcon`): no
  external art, per `docs/assets.md`.

## Risks and open questions (decisions taken)
- Loading screen must show *before* the heavy import. Decision: put a lightweight DOM loader in `index.html` (inline CSS
  + a small script, no imports) that `main.ts` updates between its awaits, and `app.ts` dismisses on the first rendered
  frame. Progress is coarse (named stages), not a percentage of bytes. Facts rotate every ~4 s; keyboard/tap pages for
  the "menu pages" with a "Press any key" gate only when audio unlock is wanted (reuse it to call `unlockAudio`).
- The 3D buildings map: low-res extruded boxes in a second small three.js scene on its own canvas would double GPU use on
  phones. Decision: draw it as a canvas 2.5D oblique extrusion of the same `world.boxes` (pre-rendered per zoom
  level), behind a "Buildings: flat / raised" toggle, default flat; do it last and drop it if the zoom/pan work runs long.
- Zoom needs sharp text and badges at scale: re-rasterise `bgCanvas` per zoom step into tiles (or draw vectors) rather
  than scaling one bitmap. Cap the offscreen canvas to the iOS limit (~4096 square).
- Quest marker default: the user said "reduce the height", so default is low and the option raises it.
- Saved position can be inside a now-blocked or underwater place after an update; validate with `heightAt`/`waterAt`
  and fall back to `world.spawn`. Do not restore mid-cutscene or into the Lock-Up/interiors (E05): restore to the nearest street.
- Registry migration touches `options.ts` which every epic edits: land the registry first in this epic, small commit.
- Comms: do not shrink text below 13 px. Decision: portrait variant collapses to a one-row strip (portrait 40 px + name +
  text, max 28 percent of viewport height, scrollable) with Skip/Next as icon buttons at 44 px.

## Done when
- `npm run build -w games/gnome-theft-auto`, `npm test -w games/gnome-theft-auto` pass; new tests for the registry,
  map transform (zoom/pan clamp, screen to world), label layout at zoom, position save/restore validation, marker height pref.
- `bash tools/smoke.sh <url> <markers>` with the loader gone and `#gta-options` present; checked at 390x844, 844x390 and
  desktop: map zooms and pans without closing, legend toggle usable, comms card leaves at least 60 percent of the view.
- Demo GIF (`npm run demo -- <demo.json> --gif`, uploaded with the media-upload MCP) of the map zoom and the loader.
- PR notes: Options registry usage for other epics, defaults for each new option.

## L94 addendum: the Gnomlet tablet (owned by this epic; fix the click bug FIRST)
- Today: the Tab / More menu is `src/ui/moreMenu.ts` (412 lines; `#gta-more` overlay z-index 44, grid of tiles from
  `ACTIONS` in `src/ui/actions.ts` with `inMore: true`, up to 3 pinned tiles, a tile click does `close(); runAction(id)`,
  ~line 271). The phone is `src/phone/phone.ts` (`PhoneApp {id,label,icon,detail?,run}`, `addApp`, panel `#gta-phone`
  z 36). Apps added today: taxi (`app.ts:680`), Exchange (`city/exchangeApp.ts:212`), jobs (`jobs/runtime.ts:610`),
  Lock-Up (`lockup/runtime.ts:396`), tubing (`tubing/runtime.ts:640`). Options is `registerAction('options', { run: toggle })`
  (`options.ts:296`), panel `#gta-options` z 30.
- Likely causes of "cannot click Options" (reproduce at 390x844 and with a mouse first): (1) the More button
  `#gta-more-btn` and the options root `#gta-options` are anchored at the same `right:10px; top: ... var(--gta-map) + 8px`
  with the same z-index 30, so one covers the other; (2) the options panel (z 30) opens beneath any overlay above it
  (More 44, phone 36); (3) `index.html` sets `#ui * { touch-action: none }` and the `#gta-options` root has
  `pointer-events:none`, so any child missing `pointer-events:auto` is dead; (4) `input.ts` pointer handling swallowing
  the first tap. Fix the real cause, add a DOM-probe test, and land the fix as its own early commit.
- Redesign: a tablet called the Gnomlet (`src/gnomlet/`): one overlay (landscape and portrait layouts, safe areas, 44 px+
  app icons, home grid, back/home buttons, gamepad focus) that replaces the More menu and the phone list as the way to
  reach everything. Every More tile and phone app becomes an app: Phone/Taxi, Emotes, Quest Journal, Map, Pocket Kit,
  Party, the three nature journals, Mute, Options, Save Trainer, Lock-Up, Exchange, Jobs, Tubing. Keep `ActionId` and
  `registerAction` so keyboard and pad shortcuts work; `phone.addApp` becomes a shim onto
  `registerGnomletApp({id, label, icon, badge?, detail?, open(root) | run()})`, so E08 shops, E10's home customiser, E18
  and later epics add apps without editing the menu. Options opens as an app (the registry content inside the tablet).
  Pins stay as dock apps. Tab, long-press or pad View opens it; pad Start still opens Options directly.
- Gnomey Bird: `src/gnomlet/apps/gnomeyBird.ts`, a small original flap-through-the-gaps game: tap, Space or A flaps, a
  gnome in a hat falls under gravity, gaps in hedges or fences, one point per gap, best score saved in `gta-gnomeybird-v1`
  (add to `GTA_SAVE_KEYS`). Original canvas art, no external assets and nothing borrowed from any existing game's look or
  names; the gnome wears the player's colours (`getMyGnome()?.look`). It pauses nothing it should not and releases input
  when closed. Achievement "Flappy Gnome" (score 10, reward a `head` prefab) in `packages/achievements/src/catalog.ts`;
  `npm test -w packages/achievements`.
- Extra done-when: Options reachable by tap on a phone in both orientations; an app-registry test; the Gnomey Bird score
  persists; every former More tile reachable from the Gnomlet. Mobile first; no online (single-player toy).
