# Director's notes: `tax-break-in-intro`

Vesper's first visit in person: the lien, the one full hat threat, and the crew's plan for the Glaze & Tax break-in.
Re-directed against [../bible.md](../bible.md). Watch it at `http://localhost:5310/?no-intro&cutscene=tax-break-in-intro`.

| | |
| --- | --- |
| Scene | `tax-break-in-intro` in `src/cutscene/scenes/story/ch1c.ts` |
| Played by | quest `ch1-tax-break-in` ("The Glaze & Tax Break-In") as its intro, given at Side-Valve Salvage |
| Kind and length | `intro`, aim 30-60 s; now 61.7 s at Normal text speed (was 62.2 s, 12 faults; just over the 60 s aim, under the 75 s fault line) |
| Where, when | stage `side-valve-bay` (the apron, the z = 60 road, the barrel at (-132, 77)); day, no `sky` |
| Before / after | before: `ch1-mowers-keepers` outro (the eviction notice, Vesper's car with nobody driving). After: the drive to Thorne Tower and the Glaze & Tax crack, then `tax-break-in-outro` |

## 1. Purpose in the story

Chapter 1 asks whether the player can pay their way out, and the answer changes here: Vesper stops being a rumour and
serves the lien in person. It is the bible's first full threat ("Nice hat. Shame if it cracked.", said to the player,
the one time) and the first time the player is the one he speaks to. The scene also sets the job: the deed is filed at
the Glaze & Tax Office in Thorne Tower, so the crew will crack the auditors, take the deed and steal the Buck-Iron
Combine; and it plants the golden kazoo (Pip's want) that the outro's golden acorn will pay off.

The old scene was one wide held for 32 s with six lines and Pip unseen; Vesper was never in a close shot; the crate line
was said in a wide; the plan was a briefing shown from a single distant shot.

## 2. The player's feeling

- **In:** just cleared Mower's Keepers, a little pleased, still broke.
- **Out:** cold. Vesper has been in the bay and has spoken to the player directly; the crew is going to rob someone
  powerful, and the player is in the job now.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Vesper | to serve the lien and be obeyed | Tansy's hat and her bay | the threat as a compliment, a hat tip, a slow push-in | leaves without raising his voice |
| Tansy | to keep her bay and not be the one to panic | the lien in her hand; the crate | take it, arms crossed, a sharp warning to Pip | decides on the raid |
| Pip | to be useful and not to be the one seen | Vesper's arrival | hide behind the barrel, then the butter knives, then the kazoo | wants the golden kazoo |
| The player | (silent until the plan) | Vesper's threat | still; a look | in the job |
| Turncoat Cam | (background) | (none) | sweeps the apron | (the crate line lands near him) |

## 4. Subtext

- Vesper knows about the Seed-Cell crate: someone told him. The line is a threat and an intelligence leak in one.
- "Forty-eight hours" is a deadline and a grave; Tansy's crossed arms are fear dressed as contempt.
- Pip hiding behind a barrel is a boy who wants to be useful and is scared of a man in a pearl car.
- The kazoo is Pip's secret want (a toy he wants more than the money).

## 5. Beat sheet

Timings at Normal text speed (checker, 60.5 s).

| # | Time | Beat | What happens (picture first, then words) |
| --- | --- | --- | --- |
| 1 | 0.0-2.5 | Hook | The Lowrider rolls in along the z = 60 road on a `track`; a `villain` stinger on its first frame. No narration. |
| 2 | 2.5-8.2 | Setup | Pip, low and quick: "A clean car. In Turfton. That's never good news." Tansy: "Vesper Thorne. Hide the toast." |
| 3 | 8.2-12.5 | Pip's shot | Pip runs behind the gta-dew-barrel and flinches (`cut` from the east, the barrel between him and the lens). |
| 4 | 12.5-17.5 | Arrival | Vesper steps out, walks to the apron (`ms`, low); he hands the lien over. A slow push-in on him for "Forty-eight hours, Ms. Clayfoot." |
| 5 | 17.5-20.9 | Turn | Tansy takes the lien, arms crossed. Vesper turns to the player: a hat tip, "Nice hat. Shame if it cracked." The player's reaction. |
| 6 | 22.5-25.2 | The crate | Vesper, low and alone: "And do not open that Seed-Cell crate." Tansy's reaction, the sweeper in the background. |
| 7 | 25.2-33.5 | Vesper leaves | `enter` the Lowrider, a `follow` on the getaway, `heist` in. |
| 8 | 33.5-44.0 | The plan | Tansy: the deed at the Glaze & Tax Office, then "We crack the auditors, take the deed, and steal the Buck-Iron Combine." Pip nods. "Famous for opening with a butter knife." |
| 9 | 44.0-52.0 | Pip's knives, Tansy's guns | Pip: "I brought two butter knives..." Tansy: "Guns are free at Ammu-Gnation... The shiny bits are not." |
| 10 | 52.0-60.5 | Button | Pip close, "I want the golden kazoo." Tansy's look at him; held. |

The turn is the lien and Vesper's first threat; the plan, at about 55% of the length, is what the threat sets off.

## 6. Shot list

| # | Shot | Lens / distance | Move | On | Motivation |
| --- | --- | --- | --- | --- | --- |
| 1 | `track` on `vesper-car` from (-135, 49, 3) | 50 | tracks | the Lowrider | the hook: a car with the villain motif |
| 2 | `CREW.single('pip','mcu')` | 35 | locked | Pip | the line |
| 3 | `CREW.single('tansy','mcu')` | 35 | locked | Tansy | the line |
| 4 | `cut` from (-124, 70.5, 1.1), look (-134.2, 77.8, 0.5) | 40 | locked (Pip runs through it) | Pip behind the barrel | physical comedy, its own shot |
| 5 | `shot('vesper','ms',{toward:'tansy', height:'low'})` | 40, low | walks with him | Vesper alone | the arrival; he is never in a two-shot |
| 6 | `dolly` from (-144.5, 67.5, 0.9) to (-146.2, 68.6, 0.9), look `vesper` | 36 | slow push-in, 3.2 s | Vesper alone | the threat: the push-in carries the line |
| 7 | `reaction('tansy', {toward:'vesper', gesture:'crossArms'})` | 35 | locked | Tansy | she takes the lien and does not give ground |
| 8 | `shot('vesper','mcu',{toward:'player', height:'low'})` | 35, low | locked | Vesper alone | the hat threat: a tip of the hat, then the line |
| 9 | `reaction('player', {toward:'vesper'})` | 35 | locked | the player | the straight man's stillness |
| 10 | `shot('vesper','mcu',{toward:'tansy', height:'low'})`, `face` to Tansy first | 35, low | locked | Vesper alone | the crate line |
| 11 | `cut` from (-137.5, 72.5, 1.3), look `tansy` | 40 | locked | Tansy, the sweeper behind | the reaction; Turncoat Cam in the background |
| 12 | `follow` on `vesper-car` | 50 | follows the getaway | the car | the drive off |
| 13 | `CREW.single('tansy','mcu')` / `'cu'`, `CREW.single('pip','mcu')` | 35 / 30 | locked | Tansy and Pip | the plan, and Pip's nod |
| 14 | `CREW.single('pip','cu')` then `reaction('tansy', {toward:'pip'})` | 30 / 35 | locked | Pip, then Tansy | the button |

Sides of the line: Tansy and Pip are on `CREW = coverage('tansy','pip', 1)` for every exchange. Vesper is always
alone in frame. The Vesper-to-player shot is on the player's side, not the crew's; Vesper and the player are not on the
same line as the crew, so no crossing.

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Pip | A clean car. In Turfton. That's never good news. | kept: his bit about the car; the car is the picture |
| Tansy | Vesper Thorne. Hide the toast. | kept: she names him and tells Pip to hide the toast |
| Vesper | Forty-eight hours, Ms. Clayfoot. | kept: the lien; the push-in is on this line |
| Vesper | Nice hat. Shame if it cracked. | the hat ladder's rung 2, said to the player; the variant "Nice hat, by the way." is cut |
| Vesper | And do not open that Seed-Cell crate. | kept: he knows about the crate |
| Tansy | He filed my deed at the Glaze & Tax Office, in Thorne Tower. | plan clause 1 |
| Tansy | We crack the auditors, take the deed, and steal the Buck-Iron Combine. | plan clause 2 and 3 |
| Tansy | Famous for opening with a butter knife. | the setup for Pip's knives |
| Pip | I brought two butter knives. One for the ignition, one for emergency toast. | kept |
| Tansy | Guns are free at Ammu-Gnation on the east road. The shiny bits are not. | kept once, as the gameplay pointer; not the last line |
| Pip | I want the golden kazoo. | kept: the button and the plant for the runway's "Toot" |
| ~~Vesper~~ | ~~Nice hat, by the way. Shame if it cracked.~~ | cut: the hat ladder's full threat is said once, to the player |
| ~~Pip~~ | ~~Okay, hear me out.~~ | not used: it belongs to `founders-boot-intro` (the bible's once-a-chapter tic) |
| ~~Narrator~~ | (old opening narration) | cut: the picture and the car do it |

Names checked: `npm run lore -- find "Glaze"`, `"Thorne Tower"`, `"Seed-Cell"`, `"Buck-Iron"`, `"golden kazoo"`. The
Ammu-Gnation line is the old pointer kept as written.

## 8. Music and sound

| Time | Cue | Why |
| --- | --- | --- |
| 0.0 | music out (fade 0.4), `street` ambience; `villain` stinger at 0.0 | the cold open is the Lowrider; silence before the threat |
| 0.0 | `villain` music in (fade 0.8) | Vesper's motif, while he is on the road and on the apron |
| 25.2 | `heist` music in (fade 1) | after he drives off, the crew goes to work |

## 9. Blocking and vehicles

- Tansy at her mark (-143, 73), facing the north-east road, arms crossed on the lien. Pip sits on his crate, then runs to
  (-134.2, 78.2), behind the barrel at (-132, 77) (his path avoids the barrel's solid box). He flinches there, and comes
  back to the crate (-134.5, 74.8) for the plan.
- Vesper's `vesper-car` spawns at (-120, 57.5) on the z = 57.5 road and drives to the pull-up at (-150, 72). He exits, walks
  to (-148, 70.5), serves the lien, turns to the player at (-156, 70) for the hat line, turns back to Tansy for the
  crate line, then enters the car and drives the getaway west and north.
- Turncoat Cam is the stage's sweeper; he is on his apron walk in the background of the crate reaction.
- The player stays on their mark (-156, 70) for the whole scene; the quest's exit is the player's walk off the apron.

## 10. The button

Pip's close-up, the golden kazoo; then Tansy's look at him, held. The last image is the plant for the runway's kazoo toot,
and the last sound is Pip's line, not a walk-off. The bible asks for a threat or a punchline at a closer; here the
threat has already happened, so the button is the want the crew is about to pay for.

## 11. Self-check

- [x] The scene has a want, an obstacle and a turn: the lien; then the plan.
- [x] The hook lands in 3 s (the car and the stinger); the first thing is not narration.
- [x] Every line under 16 words (longest 14: the Ammu-Gnation line); no coordinates.
- [x] Vesper: soft, no contractions, no exclamation marks, low and alone in frame; no handheld; a push-in on the threat.
- [x] Each character sounds like their bible entry; Tansy's three clauses are the plan.
- [x] Every speaker framed MCU or closer; reactions after the big lines.
- [x] One side of the line for Tansy and Pip (`CREW`); Vesper is never in a two-shot.
- [x] Music: `villain` with Vesper, `heist` once he is gone; one `villain` stinger; no held silence.
- [x] Ladders: the hat line is rung 2 (the only full threat); the crate line is the intelligence leak; the kazoo is planted.
- [x] Pip's shot behind the barrel: its own shot (4).
- [ ] `npm run cutscene-report` / `pacing.baseline.ts`: left to the planner (out of scope for this issue).
- [ ] `npm test` and a watched run in the browser: not done in this issue (no dev server, per the common rules).
- [x] `direction.notes` in the scene points at this file.

## Review pass (planner)

Watched at 960x600. Vesper's Lowrider now stops at the foot of the pull-up (-150, 65), south of the action: parked at (-150, 72) its body (scene vehicles are not in the line-of-sight colliders) sat between Vesper and the lens, and "Nice hat. Shame if it cracked." played on a black frame. Vesper turns to Tansy before the lien line so the push-in sees his face.
