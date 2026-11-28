Epic: FX11 A (coast fixes, parallel) · Issue A7: coast side quests match their places (G3#14 text, G3#15, G3#16, G3#31)
Depends on: none · Agent: Haiku · No dev server

(The Environment section the lead gave you applies.)

## Goal
The four Saltbucket side quests stop contradicting the world: the right stall keeper, a slalom title that fits where the course is, a tour stop that is where its text says, and treasure-step text that matches where the chest now is.

## Read first
- `games/gnome-theft-auto/src/quests/coastQuests.ts` (the whole file, 197 lines).
- `games/gnome-theft-auto/src/quests/stages/coast.ts` (the three coast stages: marks, cameras, `look` lines).
- `games/gnome-theft-auto/src/coast/config.ts` (`COAST.boardwalk.stalls`: Plank & Pickle is at (-95, 1105.5), its counter front about z 1107; `COAST.pier.bowl`: x 289..311, z 1236..1254; `COAST.spokewheel.bell`).

## Change: `src/quests/coastQuests.ts`
1. G3#15, The Wobbly Gondola: the Plank & Pickle's keeper is **Gil Brinewater** (a new lore person; the lore worker records him). Change Marram's third line to `'Then fetch a spanner from the Plank & Pickle. Gil Brinewater swears it is a pickle fork. It is a spanner.'` and the toast to `'A spanner, wrapped in a pickle napkin. Gil looks innocent.'`. `PICKLE_STALL` becomes `[-95, 1110]` (on the deck in front of the counter; the deck runs z 1102..1132). Keep Marram's outro `'Ride free, any time. Within reason. I decide the reason.'` (another worker makes the wheel free after this quest).
2. G3#16, `coast-boardwalk-tubing`: retitle to `'The Buoy Run'`; Driftwood's second line becomes `'I have set a new slalom out past the boardwalk. Buoys, mostly. Lawn sharks, I hope not.'`; `doneText` becomes `"The Buoy Run is open. Driftwood's rack is yours at a friend's price."`. Update the file's top comment (it names the quest). The id stays `coast-boardwalk-tubing`.
3. G3#31, Pirate Tours, Mostly, step 4: the patrol is at the gangplank, so the stop moves onto the pier bowl by the gangplank: `at: [300, 1250]`, radius 6; text `"Draw the Hat Watch patrol off Bilge's gangplank, at the end of the pier"`; keep `heatOnEnter: 1` and the toast.
4. Same quest, stop three: `SALTCUT_MOUTH` becomes `[746, 1186]` (the Saltcut is being bent this epic; its mouth's east bank, where a daymark will stand). Keep radius 20.
5. G3#14, The Queen's Treasure: step 2 text becomes `"Open the sea chest at the foot of Bilge's bed, in her cabin"` (the chest moves to the bed this epic). Keep the step-1 toast `'Only a boot.'` (a boot is being placed at the X).

## Change: `src/quests/stages/coast.ts`
- Top comment: the tubing quest is now 'The Buoy Run'.
- `coast-spokewheel` stage: Marram's mark `[-252, 1112]` -> `[-252.5, 1111.5]` facing the player, note `'at the boarding platform, one hand on the bell rope'` (the bell is at `COAST.spokewheel.bell` (-253.5, 1110)). Leave the rest.
- `coast-pier`: no position change (Bilge stands at the head of the pier at (300, 1168) by a chalk tour board, which another worker places at (302.5, 1166)); make the `look` mention "a chalk A-board of tour times".

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/quests/stages.test.ts src/quests/quests.test.ts` passes (if a file name differs, run every test under `src/quests` whose name contains `stage` or `quest`; rerun alone if one times out under load). Also run `npx vitest run src/questSim` only if it finishes in a few minutes; otherwise say so.
- `npx tsc --noEmit -p games/gnome-theft-auto` clean in your files.
- `grep -rn "Tubing the Long Spoon\|Sal swears\|Sal looks innocent" games/gnome-theft-auto/src` finds nothing.

## Out of scope
`src/coast/*` (the chest, the bell, the boot, the daymark are other workers'), `docs/lore` (the lore worker).
