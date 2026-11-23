# Director's notes: `sq-hoa-audit-intro`

| | |
| --- | --- |
| Scene | `sq-hoa-audit-intro` in `src/cutscene/scenes/side/hoaAudit.ts` |
| Played by | quest `sq-hoa-audit` ("The HOA Audit") as its intro, given at Bodega & Sons |
| Kind and length | `intro`, aim 30-60 s; now 50.5 s at Normal text speed (was 56.7 s, 13 faults) |
| Where, when | stage `bodega-front` (Turfton downtown), noon |
| Before / after | before: the player's errand to the bodega counter. After: five petty HOA officers to crack (the clipboards), then the payoff `sq-hoa-audit-outro` at Burt's returns yard |

## 1. Purpose in the story

A side quest in the deadpan register. Burt, the ex-HOA citation writer, is the only person in town who knows how the
HOA's paperwork works, and he has been docked overtime for a cactus and a snowman. The quest gives the player five
clipboards to take and a reward, and it plants the main story's HOA (its officers, its Tall Ones, its forms).

The old scene was a briefing on wides: a 16 s wide over the bodega for the first line, five 13 s to 16 s wides for the
rest, a 21-word line, a 17-word line, an off-screen player, and the lines spoken across the line of action.

## 2. The player's feeling

- **In:** amused, a little bored (a form number, a man with a broom).
- **Out:** ready to be deputised by an official nobody has checked. The job is clear (five officers, five clipboards),
  and so is the one odd fact (nobody has ever seen a Tall One).

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Burt | to come clean, and get his overtime back | he is a clerk, not a fighter; the HOA docked him | jargon, apologises mid-sentence ("Sorry. Per policy."), stamps | from a stamped rejection to a deal with a stranger |
| The player | to get the job | the grievance makes no sense | two questions ("Docked for what?", "So what is the grievance?"), one flat agreement | takes the clipboards |
| John Bodega (extra) | to sweep | none | sweeps in the background | nothing; he is the town going on |

## 4. Subtext

- Burt's overtime is the real grievance. The cactus and the snowman are what the HOA docked him for, and he says it
  like an apology.
- "I checked twice" is his nerve: he is not sure, and he has checked anyway.
- The Tall Ones are not on the board. Nobody has seen one. The line is the first crack in the HOA's paperwork.

## 5. Beat sheet

| # | Time | Beat | What happens |
| --- | --- | --- | --- |
| 1 | 0.0-3.0 | Hook | Burt, mcu, on the form: "FORM 404-B: GRIEVANCE" title card; the stamp thud at about 0.6 s. John sweeps behind. |
| 2 | 3.0-9.0 | Setup | "Form four-oh-four B. Grievance. Filed in triplicate, and read by nobody." Stamp, "Rejected." Wide of the bodega, two seconds, John sweeping. |
| 3 | 9.0-18.0 | The grievance | Burt: "Sorry. Per policy. Three weeks of overtime, docked." The player: "Docked for what?" Burt: "A cactus in the Dust Flats. A snowman in Frostbite Fells." The player: "So what is the grievance?" |
| 4 | 18.0-27.0 | The job | "The job is the grievance. Five petty HOA officers." "Crack all five. Bring me their clipboards." The player: "Five clipboards. Got it." Music in (`mystery`, fade 3). |
| 5 | 27.0-37.0 | The turn | "They are not on the board, you understand." "The Tall Ones. I checked. Sorry. I checked twice." |
| 6 | 37.0-50.5 | Button | The player: "What is the reward?" Burt, shrugging: "My old badge. Still shiny." "I would rather it were in the right hands." The player: "Deal." Beat, then the stamp thud: "Stamped." |

## 6. Shot list

Every singles is on one side of the line: `coverage('burt', 'you', -1)`, the side that frames Burt against the red and
white sign and the blue warehouse (the brown bodega wall behind him read as dark on dark on the other side).

| # | Shot | Lens / distance | Move | On | Motivation |
| --- | --- | --- | --- | --- | --- |
| 1 | `TALK.single('burt','mcu')` | 35 | locked | Burt | the hook: the form and the stamp on his face |
| 2 | title card, stamp | n/a | locked | Burt | the form number is the hook |
| 3 | `TALK.single('burt','mcu')` | 35 | locked | Burt | the grievance, read out |
| 4 | `stageCut('bodega-front','wide')` | wide | locked | the bodega | a two-second breather; John sweeps |
| 5 | `TALK.single('burt','mcu')` | 35 | locked | Burt | "Rejected." and the apology |
| 6 | `TALK.single('you','ms')` | 40 | locked | the player | the straight man's question |
| 7 | `TALK.single('burt','mcu')` | 35 | locked | Burt | the cactus and the snowman |
| 8 | `TALK.single('you','mcu')` | 35 | locked | the player | "So what is the grievance?" |
| 9 | `TALK.single('burt','mcu')` | 35 | locked | Burt | the job, two lines |
| 10 | `TALK.single('you','mcu')` | 35 | locked | the player | "Five clipboards. Got it." |
| 11 | `TALK.single('burt','mcu')` | 35 | locked | Burt | the Tall Ones: "I checked twice" |
| 12 | `TALK.single('you','mcu')` | 35 | locked | the player | "What is the reward?" |
| 13 | `TALK.single('burt','mcu')` | 35 | locked | Burt | badge, and the right hands |
| 14 | `TALK.single('you','mcu')` | 35 | locked | the player | "Deal." |
| 15 | `TALK.single('burt','mcu')`, stamp | 35 | locked | Burt | the button: "Stamped." |

Side of the line: Burt and the player on `coverage('burt','you',-1)` throughout.

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Burt | Form four-oh-four B. Grievance. Filed in triplicate, and read by nobody. | was the same line; kept, it is the best joke in the scene |
| Burt | Rejected. | the stamp is the reply |
| Burt | Sorry. Per policy. Three weeks of overtime, docked. | was "The HOA docked three weeks of my overtime...", 21 words: now his apology, 9 words |
| The player | Docked for what? | the straight man asks the question the picture raises |
| Burt | A cactus in the Dust Flats. A snowman in Frostbite Fells. | the answer, 13 words |
| The player | So what is the grievance? | was the player's line; kept |
| Burt | The job is the grievance. Five petty HOA officers. | was 17 words; split |
| Burt | Crack all five. Bring me their clipboards. | cut "They are out ticketing cacti", "Every stamp" (repetition) |
| The player | Five clipboards. Got it. | kept |
| Burt | They are not on the board, you understand. | was 21 words; split |
| Burt | The Tall Ones. I checked. Sorry. I checked twice. | his nerve, in his voice |
| The player | What is the reward? | new: the question that gets the badge line |
| Burt | My old badge. Still shiny. | was "The reward is my old badge. Still shiny. I would rather..." (17 words), split |
| Burt | I would rather it were in the right hands. | kept |
| The player | Deal. | kept |
| Burt | Stamped. | was "Stamped. Go on."; one word on the stamp |

Names checked: `npm run lore -- find burt` (burt-hoa), `find "Thorne"` (Thorne Lawn & Order; Vesper's company), and the
Tall Ones are in the bible's canon. No new lore fact was added.

## 8. Music and sound

| Time | Cue | Why |
| --- | --- | --- |
| 0.0 | `street` ambience, no music | downtown noon, nothing sung |
| 0.0 | title card, then the stamp thud at 0.6 s | the form is the hook |
| 27.0 | `mystery` in (fade 3) | sparse music under the job, once the player agrees |
| 2.0 total (38-40 s) | the stamp thud before "Stamped." | the rubber stamp is the button |

No stingers: the thud is the sting.

## 9. Blocking and vehicles

- Burt starts on his mark (`BURT`) facing the player; the player on `PLAYER`, facing Burt, with `exchangeLooks` first.
- John Bodega sweeps on the walk loop in the background throughout; no lines, no frame.
- No vehicles.

## 10. The button

Burt, locked off on the stamp: "Stamped." The last image is the stamp on his face, the player's deal already made. It
is the bureaucrat's way of saying yes.

## 11. Self-check

- [x] Want, obstacle, turn (the Tall Ones: nobody has seen one), button (the stamp).
- [x] Hook in 0.6 s (the title card and the stamp thud on a frame of Burt).
- [x] Every line under 16 words (longest 13).
- [x] Burt's nerves in his voice: jargon, an apology mid-sentence.
- [x] Every speaker framed on a `frame` shot, facing the camera side; no speaker-back, no speaker-small.
- [x] One side of the line (`coverage('burt','you',-1)`).
- [x] No narration or captions; titles only for the form number.
- [x] Music changes with reasons; one stinger-free scene.
- [x] Length 50.5 s (aim 40-55).
- [x] Report OK; line-of-sight passes.
- [x] `direction.notes` points here.
