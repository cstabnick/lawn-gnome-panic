# Director's notes: `dons-cigars-intro`

Watch it at `http://localhost:5310/?no-intro&cutscene=dons-cigars-intro`.

| | |
| --- | --- |
| Scene | `dons-cigars-intro` in `src/cutscene/scenes/story/m11-the-dons-cigars.ts` |
| Played by | quest `m11-the-dons-cigars` ("The Don's Cigars") as its intro, given at the Mulch Club |
| Kind and length | `intro`, aim 30-60 s; 24.6 s at Normal text speed, no faults (short on purpose: the Don never speaks and Lou says one fact at a time) |
| Where, when | stage `mulch-club-door` (the side door); day (`sky: 'noon'`) |
| Before / after | before: Pip's jammer (row 10). After: the drive to the New Puddle canal |

## 1. Purpose in the story

Row 11 turns the Mulch Club's war with the HOA from a rumour into a pink slip on a doorstep. This scene gives the job
(fetch the Don's crates from the canal) and the reason (the HOA cited his cigar boats for "unlicensed smoke"), in the
Don's own language: taps, translated.

## 2. The player's feeling

- **In:** light relief after the Underspan; the Don's name still carries weight.
- **Out:** amused (a citation for smoke), clear on the job, aware that Brenda takes a toll and that Lou wants them dry.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Don Compost | to get his crates out of the HOA's reach | the citation; he cannot speak | taps | gets a driver |
| Big Lou | to translate and keep it dry | the player's questions | one fact a line, deadpan | hands over the job |
| The player | to know what the job is | the Don's silence | two plain questions | takes it |

## 4. Subtext

- The Don is cornered by a pink slip and has not changed his face. The fear is Lou's careful voice.
- "Now it does." is the whole bureaucratic horror of the HOA, in two words.

## 5. Beat sheet

| # | Time | Beat | What happens |
| --- | --- | --- | --- |
| 1 | 0-4 | Hook | The Don, low and still; two taps |
| 2 | 4-10 | Setup | "Two taps. Acorns." "For what?" |
| 3 | 10-16 | The picture | The pink citation on the doorstep, a cigar stubbed on it; "HOA cited the boats. Unlicensed smoke." |
| 4 | 16-19 | Gag | "Smoke needs a licence?" "Now it does." |
| 5 | 19-25 | Turn and button | One tap: "Crates, on the canal. Brenda tolls the road." "Do I pay her?" "Don pays. You bring them dry." |

## 6. Shot list

| # | Shot | Lens / distance | Move | On | Motivation |
| --- | --- | --- | --- | --- | --- |
| 1 | `shot('don','ms',low)` | 40 | locked | the Don | the hook is the hand and the silence |
| 2 | `DON_AND_LOU.single('lou','mcu',low)` | 35 | locked | Lou | translator, low (his authority) |
| 3 | `DON_AND_LOU.single('player','mcu')` | 35 | locked | the player | the plain question |
| 4 | `cut` on the citation | 36 | locked | the citation | the insert, 1.4 s |
| 5 | Lou, then the player, then Lou | 35 | locked | each | the gag; the player never looked down on |
| 6 | `shot('don','mcu',low)` | 35 | locked | the Don | the tap that gives the job (1.3 s) |
| 7 | `DON_AND_LOU` pair | 35 | locked | each | the answer |

One side of the line (`coverage('lou','player',1)`) for every Lou and player single; the Don's two shots are on his own axis.

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Lou | Two taps. Acorns. | slow, no question |
| Player | For what? | |
| Lou | HOA cited the boats. Unlicensed smoke. | the picture answers first |
| Player | Smoke needs a licence? | |
| Lou | Now it does. | the deadpan |
| Lou | One tap. Crates, on the canal. Brenda tolls the road. | the job, one place |
| Player | Do I pay her? | |
| Lou | Don pays. You bring them dry. | his tic, "dry", set up for the outro |

Names checked: `npm run lore -- find "Brenda"`, `"cigar"`, `"Mulch Club"`. R-025: the Don never speaks.

## 8. Music and sound

| Time | Cue | Why |
| --- | --- | --- |
| 0 | `heist` music, `street` bed | the Mulch Club |
| 2, 3 | `knock` x2 | the two taps |
| 11 | `paper` | the citation |
| 20 | `knock` | the one tap |
| 24 | `cloth` | Lou's coat |

## 9. Blocking and vehicles

- The Don at (-17.5, -30) facing east; Lou at his guard mark (-17.5, -33) turned to the player; the player at (-9, -30).
  Props on the step: a stack of cigar boxes (-15.4, -27.8) and the citation (-16.2, -32.6). No vehicles.

## 10. The button

Lou's "Don pays. You bring them dry." The tic sets the outro.

## 11. Self-check

- [x] Want, obstacle, turn (one tap), button.
- [x] Hook in 3 s: the two taps.
- [x] Lines under 16 words; the Don is silent.
- [x] Lou's voice (slow, low, never a question); the Don only taps.
- [x] Speakers MS or closer; one side of the line.
- [x] Music `heist`, no stinger.
- [x] Lou and the Don had their cards in the first contract: none here.
- [x] Day scene.
- [x] Report OK.
- [x] `direction.notes` points here.
