# DayG UI: user stories

These stories drive the UI redesign ([design.md](design.md), roadmap
[dayg-11-ui-redesign.md](../../../roadmaps/dayg-11-ui-redesign.md)). Five personas come from the reviews in
[../feedback/](../feedback/). Two more cover players the reviews missed.

| Code | Persona | What they bring to the screen |
|---|---|---|
| DZ | DayZ veteran (feedback/dayz-veteran.md) | wants a quiet screen, no markers, a paper map and to know how loud they are |
| PZ | Project Zomboid veteran (feedback/zomboid-veteran.md) | wants numbers on demand: containers next to the pack, recipes, infection clock, death recap |
| SV | Survivalist (feedback/survivalist.md) | wants the body, water, warmth and bearings to be readable, with reasons |
| SE | Sim and economy fan (feedback/sim-economist.md) | wants time, season, weight and the life's statistics |
| SG | Small-group mobile player (feedback/small-group-mobile.md) | plays 45 minutes on a phone in portrait or landscape, often with friends |
| FT | First-time casual player on a phone, one thumb (new) | has never played a survival game; holds the phone in one hand on a bus |
| AV | Player with a screen reader or low vision (new) | needs large text, high contrast, words instead of colours, a labelled and keyboard-reachable UI |

Each story has a code, a priority (**must**, **should**, **could**), the screens it touches and a test that runs on a
phone (390x844 portrait and 844x390 landscape, `?touch=1`) and on desktop (1280x800). Screens: HUD, pack, prompt
(interaction prompt), map, recap, touch, camera, build (build menu), interior (interior prompt). "The audit" means
`node games/dayg/scripts/ui-audit.mjs` (roadmap issue 11.4); it checks names, target sizes, font sizes and overflow.

## HUD

- **S01** (must; HUD). As a DZ, I need my four needs readable at a glance without opening a menu, so that I can keep
  my eyes on the grass and not on a screen.
  Test: phone and desktop, every need shows its name and a bar in the top-left status cluster; no menu is open.
- **S02** (should; HUD). As a DZ, I need what is not urgent hidden (stamina when full, carry when light, place name
  after 4 s), so that the world takes most of the screen.
  Test: phone and desktop, standing still with full stamina and under 80% carry, the stamina row and carry line are
  absent from the DOM or `display:none`.
- **S03** (should; HUD). As a DZ, I need to see how loud I am, so that I can sneak past a herd.
  Test: phone and desktop, the status cluster has a "Noise" word (quiet / heard nearby / loud) that changes from
  "quiet" when crouched still to "loud" when sprinting.
- **S04** (must; HUD). As a SV, I need the body figure to say in words which part is cracked, so that I know what to
  glue before I limp.
  Test: phone and desktop, after a fall that cracks a leg, the HUD shows "Left leg cracked" (or the part hit) under
  the figure.
- **S05** (must; HUD). As a PZ, I need the moss infection stage, the part, the time since the bite and what treats it,
  so that I can act while I still can.
  Test: phone and desktop, with an infection set (debug hook), the HUD shows "Moss: <stage>" and the status sheet shows
  the part, the hours since the bite and the treatment line.
- **S06** (could; HUD). As a SE, I need time, day and weather always on and season and temperature on demand, so that
  I can plan a trip around the light.
  Test: phone and desktop, the clock zone shows `hh:mm · Day n` and the weather word; the status sheet shows the
  season.
- **S07** (should; HUD). As a SG, I need a "Safe" badge with a word and a shape while I am in a haven, so that I know
  where I can sleep and log off.
  Test: phone and desktop, on the Gate Roof the clock zone shows "SAFE · Lychgate Waystation"; in the Forecourt it is
  gone.
- **S08** (should; HUD). As a SG, I need alerts that do not cover the controls, stack at most three and fade, so that
  a burst of news never hides a button.
  Test: phone and desktop, five `hint` events in one second leave three alert lines in the alerts zone, none
  overlapping a button rectangle (the audit's overlap check).
- **S09** (should; HUD). As a FT, I need a "what now" hint for the first hour that I can turn off, so that I am not
  lost without quest markers.
  Test: phone and desktop, a fresh profile shows the first hint within 10 s; "No more hints" hides it and it stays
  hidden after a reload.
- **S10** (must; HUD). As an AV, I need every state to be shown by a word or a shape as well as a colour, so that I can
  read it without telling amber from red.
  Test: phone and desktop, at water 20 the row reads "Water ! low", at 5 "Water !! critical"; the audit in the
  `contrast` theme passes.

## Interaction prompt and interior prompt

- **S11** (must; prompt, touch). As a FT, I need the prompt to name the verb and the thing ("Search the crate"), and
  the ACT button to show the same verb, so that I know what my thumb will do.
  Test: phone, next to the forecourt crate the prompt reads "Search the crate" and the ACT button reads "SEARCH";
  desktop, the prompt reads "E  Search the crate".
- **S12** (must; prompt). As a FT, I need every action at a spot listed when there is more than one, so that "Fill
  your containers" is not hidden behind "Drink from the Tap".
  Test: phone, at the Tap the prompt shows "+1"; a long press on ACT opens a list with both actions; desktop, holding
  E opens the same list and the 1 and 2 keys pick.
- **S13** (should; prompt). As a SV, I need the prompt to state a consequence that matters (dirty water, too high to
  climb, needs a rope), so that I choose before I act.
  Test: phone and desktop, at a puddle the prompt carries the note "dirty"; at a 13 gm headstone without a rope it
  shows "Too high to climb: needs a rope" and is not tappable.
- **S14** (should; interior). As a DZ, I need the prompt at a door or crypt mouth to say what I know of the inside
  (dark, something heard), so that going in is a decision.
  Test: phone and desktop, a prompt shown with `kind: 'enter'` and a note renders the note on its own line under the
  verb (prompt debug hook `?prompt=enter`).
- **S15** (could; interior, camera). As a PZ, I need the camera to pull in when walls close round me, so that a
  crypt's walls never hide my gnome.
  Test: phone and desktop, walking against a wall keeps the gnome visible in a screenshot (camera pull-in already
  exists; the camera issue must not break it).

## Pack (inventory) and build menu

- **S16** (must; pack). As a PZ, I need a container's contents in a tab next to my own pack, with Take and Take all,
  so that looting needs no drag.
  Test: phone, searching the forecourt crate opens the pack on the crate's tab; desktop, the crate and the pack show
  side by side; Take moves one stack.
- **S17** (must; pack). As a PZ, I need each recipe I cannot make to say what is missing in words, so that I know what
  to look for.
  Test: phone and desktop, the Make tab shows "Needs SALT" beside "Salt wash a crack" with a start kit.
- **S18** (should; pack). As a PZ, I need each item's condition as a word and a bar and its weight, so that I can drop
  the right thing.
  Test: phone and desktop, every pack row has a weight in kg and a condition word (good, worn, failing).
- **S19** (could; pack). As a SE, I need the weight and bulk totals as numbers, with "Overloaded" in words past the
  limit, so that I can plan a haul.
  Test: phone and desktop, the pack footer reads "2.3 / 8 kg · 3.6 / 16 L".
- **S20** (must; pack). As a SG, I need the pack to fit portrait and landscape without covering the stick side in
  landscape, so that I can still see the world while sorting.
  Test: 390x844, the sheet covers at most 85% of the height; 844x390, the sheet sits on the right, at most 62% wide.
- **S21** (should; pack). As a SG, I need filter chips (food, water, medicine, tools, fuel), so that a full pack is
  quick to search on a small screen.
  Test: phone and desktop, tapping "Food" leaves only food rows.
- **S22** (should; pack). As a DZ on desktop, I need the mouse released while a sheet is open and Esc to close it, so
  that I can click items and get straight back to the game.
  Test: desktop, Tab opens the pack, `document.pointerLockElement` is null, Esc closes it; phone, the Close button
  (48 px) closes it.
- **S23** (should; pack). As a SG, I need every panel (pack, status, map, settings, talk, board, room, build) to open
  and close the same way, so that I learn one gesture.
  Test: phone and desktop, every panel root has `role="dialog"`, a titled header and a Close button in the same
  place (the audit's dialog check with each `?open=` value).
- **S24** (should; build). As a PZ, I need the build menu to list each piece with materials had and needed and the
  reason a piece is greyed out, so that I can plan a wall.
  Test: phone and desktop, a piece without enough planks reads "Needs 2 planks (you have 1)".

## Map

- **S25** (must; map). As a DZ, I need a map that shows only places I have been and the havens, with no quest
  marker, so that knowing the ground stays a skill.
  Test: phone and desktop, a fresh start shows the Gate Roof and both havens named; other regions are blank until
  walked into.
- **S26** (should; map). As a SV, I need my heading and each known place's distance and bearing in words, so that I
  can navigate by compass and paces.
  Test: phone and desktop, the map's list view reads "The Tap: 180 gm north" style lines.
- **S27** (must; map). As an AV, I need the map as a text list as well as a picture, so that a screen reader or a
  zoomed screen can use it.
  Test: phone and desktop, the List toggle shows a `role="list"` of known places; the audit passes with
  `?open=map`.

## Touch and camera

- **S28** (must; touch). As a SG, I need every action reachable with targets of at least 44 px inside the safe areas,
  in portrait and landscape, so that I can play the whole game on a phone.
  Test: 390x844 and 844x390, the audit's target and overflow checks pass with `?touch=1`.
- **S29** (must; touch). As a FT, I need buttons that never move or vanish, and a disabled button that says why, so
  that my thumb learns where things are.
  Test: phone, the touch buttons' rectangles are the same with and without a climb hint; UP reads "CLIMB" when a climb
  is possible and dims otherwise.
- **S30** (must; camera, touch). As a FT with one thumb, I need the camera to turn behind me while I walk, so that I
  never need a second finger to look.
  Test: phone, with "Camera follows" on, walking right for 2 s turns the camera to face the walk direction; desktop,
  the setting is off by default and mouse look is unchanged.
- **S31** (should; touch). As a FT, I need a left-handed layout, so that I can play with whichever hand is free.
  Test: phone, with Hand: left, the buttons are bottom-left and the stick zone is on the right.
- **S32** (should; camera, touch). As a DZ, I need first and third person on a reachable control on both devices, so
  that I can look round a corner in a crypt.
  Test: phone, the VIEW button (48 px) toggles; desktop, V toggles.

## Recap

- **S33** (must; recap). As a PZ, I need the death recap as an ordered list of the last events with where and when, so
  that I learn what killed me.
  Test: phone and desktop, `?open=recap` shows a `<ol>` of up to 8 events and a "Day n, hh:mm, in the <place>" line.
- **S34** (should; recap). As a SE, I need the life's statistics and one tip for the cause, so that each death teaches
  something.
  Test: phone and desktop, the recap shows Hatless cracked, containers searched and climbs, and a tip line.
- **S35** (must; recap). As a SG, I need one large button to walk again in a new world and one for the same world, so
  that a death costs a minute, not an evening.
  Test: phone and desktop, both buttons are at least 56 px tall; "Same world" keeps `seed`, "Walk again" changes it.

## Accessibility (all screens)

- **S36** (must; HUD, pack). As an AV, I need text sizes of 100%, 125%, 150% and 200% without overlap or cut-off
  text, so that I can read the game.
  Test: phone and desktop, with `?ui-scale=2` the audit's overflow and font-size checks pass for every `?open=` value.
- **S37** (must; HUD). As an AV, I need a high-contrast theme where all text and controls reach 7:1, so that I can see
  the UI against a bright sky.
  Test: `npm test -w games/dayg` (theme contrast test); phone and desktop screenshots with `?ui-theme=contrast`.
- **S38** (must; pack). As an AV, I need every control to have an accessible name and a visible focus ring, and every
  sheet to be usable with Tab, Enter and Esc, so that I can use it with a keyboard or a screen reader.
  Test: the audit's name check passes; desktop, Tab through the pack reaches every button in reading order; phone, a
  Bluetooth keyboard is not needed (touch covers it).
- **S39** (should; HUD, recap). As an AV, I need important changes (a need turning critical, a hit, a new prompt,
  death) read out through a live region, so that I hear them without looking.
  Test: phone and desktop, `#dayg-live-polite` and `#dayg-live-assertive` exist and receive the text (DOM check after
  a `hint` event).
- **S40** (should; HUD). As an AV, I need a reduce-motion setting (and the system setting honoured) that stops pulsing
  and sliding, so that the UI does not make me ill.
  Test: phone and desktop, with `?ui-motion=reduce` no element has a running CSS animation (audit `--motion` check).
