Epic: E17 wave 2 (quests)
Depends on: none (places and probes are wired by other workers; quests reference ids and points)

## Environment
Read `docs/roadmaps/gta-batch-3/E17/_common.md` first (who the Underspanners and the Flock are).

## Goal
Four side quests: Hogweed Sprocket's "Unauthorised Verticality" (build the Updraft and ride it) and "The Scrap Run"
(a borrowed Local 404 flatbed), and the Flock's "Errands for the Flock" (join, gently) and "The Long Vigil" (stand all
night, or sit down and leave, gently). Radical-but-brilliant; harmless, satirical and funny.

## Read first
- `games/gnome-theft-auto/src/societies/config.ts` (`SOCIETY_QUESTS`, `SOCIETY_PROBES`, `SOCIETY_ACH`,
  `SOCIETY_INTERIORS`, `UNDERSPAN`, `WORKSHOP_ROOM`, `WADERS_REST`, `TENT_ROOM`, `SOCIETY_CAST`)
- `games/gnome-theft-auto/src/quests/types.ts` lines 50-260 (`DialogueLine`, `CutsceneSpec`, every `ObjectiveDef`
  kind, especially 'visit' (with `interior`), 'probe', 'steal-deliver' and 'choice' with `ChoiceOption`; `QuestDef`
  incl. `achievement`)
- `games/gnome-theft-auto/src/quests/rootwellQuests.ts` (a complete side-quest file: copy its shape)
- `games/gnome-theft-auto/src/highways/skyways.ts` lines 215-230 (`SKYWAY_SITES`: 'airfield-works' Local 404 Works yard
  centre (438, 0), 'beltway-works' Beltway Works yard centre (300, -118))
- `games/gnome-theft-auto/src/types.ts` line ~13 (`VehicleKind` values: pick a small flatbed/pickup-like kind that exists)
- `docs/design/gnome-theft-auto/characters.md` sections "Hogweed Sprocket" and "Mother Saxifrage Wader" (voices)
- `games/gnome-theft-auto/src/quests/societyQuests.ts` (yours: the stub, already registered in `quests/defs.ts`; givers
  'hogweed' and 'saxifrage' and the unlock rows exist)

## Change
- `games/gnome-theft-auto/src/quests/societyQuests.ts`: fill `SOCIETY_QUEST_DEFS` with four `QuestDef`s (dialogue
  `room: 'street'`; Hogweed's look `{ hat: 0x6b4a2e, shirt: 0x8a5a3a, beard: 0xd2691e, glasses: true }`, Saxifrage's
  `{ hat: 0xb8b8c0, shirt: 0x8d9096, beard: 0xd8d8dc }`).
  1. `SOCIETY_QUESTS.verticality` "Unauthorised Verticality", giver 'hogweed', reward 300, `hoa: 'off'`. Intro: Hogweed
     (breathless, three ideas at once, forgets the end of his sentence) has designed the Updraft, Mk. 7; needs three
     parts nobody will give him. Objectives (visit, radius 6 unless said): "Borrow a bicycle wheel from the Beltway Works
     yard" at (300, -118) (toast: a Local 404 note on it says "PROPERTY OF THE UNION. ASK FIRST." You ask the wheel. It
     says nothing.); "Borrow an umbrella from the Local 404 Works yard" at (438, 0); "Dig a garden hose out of the scrap
     heap" at `UNDERSPAN.scrapHeap` (radius 4); "Hand the parts in at Hogweed's bench" (interior
     `SOCIETY_INTERIORS.workshop`, at `WORKSHOP_ROOM.bench` + (0, 1.5), radius 2.5); probe `SOCIETY_PROBES.updraft`
     count 1 ("Ride the Updraft onto the Roost", hint "Hogweed's Workshop"). Outro: an HOA inspector's citation flutters
     down; Hogweed frames it ("Unauthorised verticality! That's the good one!"). doneText. (The achievement
     `gta-unauthorised-verticality` fires on its own on the ride.)
  2. `SOCIETY_QUESTS.scrapRun` "The Scrap Run", giver 'hogweed', prereq verticality, reward 450. Intro: the workshop is
     out of parts; Local 404 have a flatbed full of offcuts "they are definitely not using". Objectives: 'steal-deliver'
     of that flatbed-like vehicle spawned in the Local 404 Works yard (`spawnAt` [438, 0, 0] with a yaw-free y 0 as the
     type wants; read the field docs) to the Underspan (`dropAt` (580, -26), radius 6, `heatOnEnter` 0.5, banter lines
     from Hogweed on the radio: "Gently! The offcuts have feelings!"); then a visit at Hogweed (`UNDERSPAN.hogweed`,
     radius 4). Outro: "We'll give it back. Improved." Dialogue mentions Local 404 as estranged cousins.
  3. `SOCIETY_QUESTS.flockErrands` "Errands for the Flock", giver 'saxifrage', reward 250, `achievement:
     SOCIETY_ACH.birdsOfAFeather`, `hoa: 'off'`. Intro: Saxifrage (slow sing-song, "so it is stood") likes anyone who can
     stand still; a few errands and you may stand with them. Objectives: visit `WADERS_REST.washingLine` (radius 4,
     "Bring in the grey washing", toast: one sock is pink; you put it back and say nothing); visit `WADERS_REST.teaUrn`
     ("Fetch a cup of reed tea for Brother Godwit", toast: he has wobbled again); probe `SOCIETY_PROBES.sermon` count 1
     ("Stand through a sermon on one leg in the circle", at the circle centre, hint 'the ritual circle'); visit the tent
     (interior `SOCIETY_INTERIORS.tent`, at `TENT_ROOM.shrine` + (0, -2), radius 2.5, "Bow to the Lady's shrine").
     Outro: you are one of the Flock now; a grey hood; "pink is for the Lady only, so it is stood."
  4. `SOCIETY_QUESTS.flockVigil` "The Long Vigil", giver 'saxifrage', prereq flockErrands, reward 300. Intro: tonight
     the Flock keep the Long Vigil on one leg until dawn; it is, unfortunately, a Tuesday. Objectives: probe
     `SOCIETY_PROBES.sermon` count 1 ("Stand the vigil sermon (it is longer at night)"); then a 'choice': optionA
     "Keep standing" at the circle centre, endingText "You stand until dawn. Your leg has opinions. So it is stood.",
     bonusAcorns 150; optionB "Sit down on the Tuesday bench" at `WADERS_REST.tuesdayBench`, endingText "You sit. The
     Flock gasp, then pour you a cup of reed tea. You have left the Flock, gently. They wave with one hand and stand on
     one leg.", `achievement: SOCIETY_ACH.satDown`. Funny first, a little ominous only in one line of the intro about
     "the Even Cut, on the longest day", never explained.
- `games/gnome-theft-auto/src/quests/societyQuests.test.ts` (new): four quests with the ids above; prereqs verticality ->
  scrapRun and flockErrands -> flockVigil; probe ids come from `SOCIETY_PROBES`; the vigil has a choice whose option B
  carries `SOCIETY_ACH.satDown`; every point lies inside its site or is a named yard point.

## Contract
`SOCIETY_QUEST_DEFS` with the four ids from `SOCIETY_QUESTS`.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/quests/societyQuests.test.ts src/quests/unlocks.test.ts` passes
  (unlocks.test may fail only on the `sq-burrow-post`/`sq-loamdeep-*` ids another worker is adding: say so).
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in your files.

## Out of scope
Every other file (loamdeepQuests.ts is another worker's; defs.ts and unlocks.ts are the lead's).
