# Director's notes: `runway-intro`

Re-directed in the Story B pass against [../bible.md](../bible.md), following the reference [mowers-keepers-intro.md](mowers-keepers-intro.md).
Watch it at `http://localhost:5312/?no-intro&cutscene=runway-intro`.

| | |
| --- | --- |
| Scene | `runway-intro` in `src/cutscene/scenes/story/ch4b.ts` |
| Played by | quest `ch4-runway-flares` ("Runway Flares") as its chapter-open, the first scene of chapter 4 |
| Kind and length | `chapter-open`, aim 45-70 s (bible section 4; fault above 100 s); 48.5 s at Normal text speed (was 46.7 s, 10 faults) |
| Where, when | stages `dust-safehouse` (the map table, the Overlook) and `airfield-apron` (the Desert Airfield); golden hour at the safehouse, day at the airfield |
| Before / after | before: chapter 3's close (the reunion with Pip's resin arm, the Stopping Stone recovered). After: the player walks to the Overlook and takes the quest; `sandpit-drop-intro` follows as the giver line for the next quest |

## 1. Purpose in the story

Chapter 4 asks whether a crew of outcasts can take a fort. This opener states the question in a picture (the crane over
the Dust Flats onto Fort Sandpit's walls, the title card) and then gives the crew the first step: clear the airfield, steal
a Crop Duster. It plants Commander Diggs through Wally and the guard ("Nobody tells the Commander anything"): feared, by the
book, and nobody's friend. It also climbs rung 2 of Pip's golden kazoo running joke (rung 1 was his wanting one since
chapter 1; the bolt-on purchase is the second rung, the toot is the third, paid off later).

The old scene opened with a long Tansy line about the front gate, a Pip line that restated the mission as a waypoint
read-out, and a flash cut to a windsock with no speaker in frame. The new one makes each line a face.

## 2. The player's feeling

- **In:** fresh from the chapter-3 close, a little tired, expecting a fight.
- **Out:** excited by the plan (we fly), amused by Pip, and with a clear first job: a Crop Duster at the airfield, past two
  guards and one lawn chair. The kazoo gag is the last laugh before the work.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Tansy | to get the Unmowed to see the crew coming | the gate, five snipers | flat, short sentences, a plan in three clauses | accepts Pip's air plan |
| Pip | to fly, and to be the one who plans it | Tansy's dismissal | enthusiasm, a bit too much | gets the kazoo out, gets the flat stare |
| The player | to know the first job | Tansy's indirection | one question | nods, walks off to the airfield |
| Wally | to read the wind, undisturbed | the guard's arrival, Diggs' name | dry, tetchy, mild | still reading the windsock |
| Guard-a | to report the chair and the tie-downs | Wally's ribbing, Diggs' rules | flat deadpan | stays by the book |

## 4. Subtext

- Tansy is worried about the snipers and will not say so: "Five snipers" is the fear, "we're not driving in" the decision.
- Pip wants to be the plan, and the kazoo is his way of asking for the crew's attention when he is not the one with it.
- Wally's chair is the one thing in the Dust Flats nobody moves. The guard's "nobody tells the Commander anything" says
  Diggs has made the whole airfield afraid of him, which is why the crew is not going through the gate.

## 5. Beat sheet

| # | Time | Beat | What happens (picture first, then words) |
| --- | --- | --- | --- |
| 1 | 0-9 | Hook | Crane over the Dust Flats onto Fort Sandpit's walls; `chapter` stinger and the title at 0-3 s of it. |
| 2 | 9-14 | Safehouse | Wide of the Overlook; Tansy leans on the map table with the Stopping Stone. |
| 3 | 14-22 | Want, obstacle | Tansy MCU: "Five snipers on the wall. One gate. We're not driving in." |
| 4 | 22-33 | Turn | Pip runs in (moving MS, then the table single): "Planes don't use gates..." Tansy: "...Drop them flares." |
| 5 | 33-37 | The question | The player, MCU: "And the guards?" Pip: "Two. Sleepy. Probably." |
| 6 | 37-52 | Airfield | Wide of the apron; guard-a walks up to Wally in his chair. Wally: the windsock, then Diggs' tie-downs. The guard: "Nobody tells the Commander anything, Wally." |
| 7 | 52-62 | Kazoo | Back at the table: Pip holds up the golden kazoo; Tansy: "You bought a kazoo." Pip: "A golden kazoo." |
| 8 | 62-66 | Button | Locked MS of Pip, the `whistle` sfx and the `comic` stinger; "Toot." Music out; Tansy's flat stare, held in silence, the player walks to the end mark. |

## 6. Shot list

| # | Shot | Lens / distance | Move | On | Motivation |
| --- | --- | --- | --- | --- | --- |
| 1 | `dolly` from the crane to the fort walls | 54 | 9 s crane | the fort | the chapter question in a picture |
| 2 | `spot(SAFE,'wide')` | 46-ish, high | locked | the Overlook | place and crew in one picture |
| 3 | `TABLE.single('tansy','mcu')` | 35 | locked | Tansy | the want and the obstacle |
| 4 | `shot('pip','ms',{toward:'tansy', side:-40, handheld:0.02})` | 40 | leads Pip as he runs in | Pip | energy: he runs in, we stay on his side |
| 5 | `TABLE.single('pip','ms')` | 40 | locked | Pip | he stops at the table; the MS is the arrival |
| 6 | `TABLE.single('tansy','mcu')` | 35 | locked | Tansy | the flares, the answer to Pip |
| 7 | `TABLE.single('player','mcu')` | 35 | locked | the player | the straight man's question |
| 8 | `TABLE.single('pip','mcu')` | 35 | locked | Pip | "Two. Sleepy. Probably." |
| 9 | `spot(FIELD,'wide')` | 46 | locked, guard-a walks in | the apron | the airfield, the walk-up |
| 10 | `FIELD_TALK.single('wally','mcu', {height:'high'})` | 35, high | locked | Wally | the windsock; the tie-downs. Raised, so the deck chair's leg rest does not fill the lower frame |
| 11 | `FIELD_TALK.single('guard-a','mcu')` | 35 | locked | the guard | the flat rebuke |
| 12 | `TABLE.single('pip','mcu')` | 35 | locked | Pip | the kazoo, handed up |
| 13 | `TABLE.single('tansy','mcu')` | 35 | locked | Tansy | "You bought a kazoo." |
| 14 | `TABLE.single('pip','mcu')` | 35 | locked | Pip | "A golden kazoo." |
| 15 | `TABLE.single('pip','ms')` | 40 | locked | Pip | the blow: the locked MS, the whistle |
| 16 | `TABLE.single('tansy','mcu')` | 35 | locked | Tansy | the button: the flat stare, held 2 s |

Sides of the line: Tansy and Pip are shot from one side of their line, `coverage('tansy','pip', 1)`, which keeps the player on
the same side; the airfield pair, Wally and the guard, is `coverage('wally','guard-a', 1)`. No crossings.

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Tansy | Five snipers on the wall. One gate. We're not driving in. | was "I've got the Stopping Stone..." (17 words); the issue's line gives the want and the obstacle in 11 |
| Pip | Planes don't use gates. The Desert Airfield has Crop Dusters. | the turn: the air plan |
| Tansy | The Unmowed have to see us coming. Drop them flares. | the quest's reason, short |
| Player | And the guards? | the straight man |
| Pip | Two. Sleepy. Probably. | the joke on the guards |
| Wally | Wind west, four knots. Stall speed twenty-two. | was "Wind's west at four knots..." with "kid" cut; the speed is the picture of a pilot's mind |
| Wally | Tell Commander Diggs his tie-downs are loose. | plants Diggs by name and his rules |
| Guard-a | Nobody tells the Commander anything, Wally. | Diggs's reputation, in a guard's mouth |
| Pip | Ammu-Gnation bolt-on. Forty acorns. | the kazoo, rung 2 |
| Tansy | You bought a kazoo. | the flat line |
| Pip | A golden kazoo. | the escalation |
| Pip | Toot. | rung 3; the whole joke in one word |
| ~~Narrator~~ | none | no narration in this scene; the title card carries the chapter |
| ~~Tansy~~ | ~~I've got the Stopping Stone. We're not driving a combine through Fort Sandpit's front gate.~~ | cut: the picture shows the stone; the gate line is now "not driving in" |
| ~~Pip~~ | ~~Then we don't drive. We fly.~~ | cut: said in `tundra-outro`; repeating it here would double the payoff |
| ~~Pip~~ | ~~Steal a Crop Duster, then buzz the Dust Flats...~~ | cut: a waypoint read-out; the quest log says it |
| ~~Wally~~ | ~~Don't clip my lawn chair on the way up.~~ | cut: the guard's arrival does the picture; kept the chair as a picture |
| ~~Pip~~ | ~~Toot. That is the sound of a lethal, shiny plan.~~ | cut: the joke is the toot alone |

Names checked: `npm run lore -- find "Commander Diggs"`, `find Wally`, `find Ammu-Gnation`, `find "Stopping Stone"` (Fescue
Stopping Stone; Diggs is Spade Guard commander at Fort Sandpit).

## 8. Music and sound

| Time | Cue | Why |
| --- | --- | --- |
| 0 | `sandpit` music (the chapter theme), `wind` ambience | the chapter's theme and the open air |
| 0-9 | `chapter` stinger at the hook | the chapter's own card, once |
| 33 | `whistle` sfx, locked MS of Pip | the kazoo; one sfx, gain 0.6 |
| 33 | `comic` stinger | the only comic stinger in chapter 4's opener, as the bible allows |
| 62 | music out (fade 0.4) | the button needs silence |

## 9. Blocking and vehicles

- Safehouse: Tansy at her mark (268, 43) leaning on the table, the Stopping Stone in hand. Pip starts at (278, 56), runs to
  (277, 46) at the table's far side. The player starts at (272, 50), walks to (274, 44) during the button and faces the table.
- Airfield: Wally in his lawn chair at (565, -110), facing west, binoculars up (a `sit` gesture). Guard-a starts at (536, -102)
  and walks at 2 m/s to (552, -107), arriving as Wally's second line lands. The Crop Duster (`wally-crop-duster`) stays on its
  north-apron mark; the duster is the scene's plane.
- Vehicles: none move in the scene. The safehouse Whirligig and the crew's plane are stage dressing and stay out of the lens.

## 10. The button

Tansy's flat stare, held two seconds of silence after Pip's toot, with the music gone and the player walking to his mark
behind her. It is the right last moment because it is the one thing Tansy says without words, and it tells the player
the joke has landed and the job is theirs.

## 11. Self-check

- [x] The scene has a want (clear the airfield, the crew needs the Duster), an obstacle (five snipers, one gate, the
      guards) and a turn (Pip's air plan); it is not a briefing.
- [x] The hook lands in 3 s (the crane and the chapter stinger); no narration; the first line is Tansy's.
- [x] Every line under 16 words (longest 11); nobody describes the picture; no coordinates or waypoint read-outs.
- [x] Voices: Tansy short and flat, Pip loud and bright, the player two words, Wally dry, the guard by the book.
- [x] Every speaker MS or closer and facing the camera for their line (the report is clean: 0 faults).
- [x] One side of the line per conversation (`coverage('tansy','pip', 1)`, `coverage('wally','guard-a', 1)`); no crossings.
- [x] Music has a reason at each change; one `chapter` stinger, one `comic` stinger; one held silence (the button).
- [x] Ladders: the kazoo climbs rung 2 (bought) and rung 3 (toot); Diggs' reputation planted for chapter 4's Spade Truce.
- [x] Day scene at the airfield; golden hour at the safehouse.
- [x] Report OK (0 faults, `[baseline]` marker still present for the planner to remove); `npx tsc --noEmit -p .` passes.
- [x] `npx vitest run src/cutscene/scenes/scenes.test.ts -t "runway-intro"` passes (line of sight).
- [x] Watched on a desktop (960x600) and a phone-sized window (390x844); every speaker's face is in frame. Two things seen
      and left: the player's own look has a grey beard that covers the face in its close-ups (the player's gnome, not the
      scene); Wally's chair leg rest shows at the bottom of his close-ups (the raised camera keeps his face clear).
- [x] `direction.notes` points here.

## 12. Act IV revision (E22, row 55)

The scene is no longer the chapter opener: row 54 (the Heist Board) opens act IV, so the crane keeps its picture but the
`CHAPTER 4` title and the `chapter` stinger are gone (a quiet `whoosh` carries the crane); `direction.kind` is now
`intro`. It plays at dusk (`sky: 'golden'` for the whole scene, the airfield included).

- Tansy's first line carries the Previously-beat: "Three sides scouted, Wally fetched. Five snipers, one gate. We're not
  driving in."
- Wally, with a `static` crackle at his chair (he is on the radio in the briefing), names Diggs in full: "Commander Diggs
  runs that fort on fifteen years of orders." then a closer MS and "Tell him his tie-downs are loose." The guard's line
  stays; a new Tansy MCU files it: "Diggs is not ours. Not yet."
- The golden kazoo ladder is untouched: "Toot." is still the one comic stinger and the button. Length 54.9 s (aim 30-60).
- Quest comms (row 55): step 0 Wally (Previously, Diggs) and Tansy (place, reward), step 1 Wally (Crop Duster, flares),
  step 2 Tansy + Bracken ("Seen the first one, thank you").
