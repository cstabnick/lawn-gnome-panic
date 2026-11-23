# Director's notes: `sq-snail-rigging-outro`

The payoff: the photo finish on the alley grass, by a whisker. Re-directed against [../bible.md](../bible.md); the
template is [../TEMPLATE.md](../TEMPLATE.md). Watch it at `http://localhost:5310/?no-intro&cutscene=sq-snail-rigging-outro`.

| | |
| --- | --- |
| Scene | `sq-snail-rigging-outro` in `src/cutscene/scenes/side/snailRigging.ts` |
| Played by | quest `sq-snail-rigging` as its outro (the payoff, on the return to the alley) |
| Kind and length | `outro`, aim 15-45 s; now about 29 s at Normal text speed (was 48.2 s, 8 faults) |
| Where, when | stage `shelldon-alley`, late morning; `sky: 'noon'`, `crowd` ambience |
| Before / after | before: the player returns to the alley (the visit objective). After: the quest is done, and the tinfoil brim is in the player's kit; the bulletin plays on the radio |

## 1. Purpose in the story

The race was rigged, and it won by the width of a whisker. The payoff gives the player the brim and Shelldon's
satisfaction, and it lands the bookies' menace from the intro: the snails won, and nobody knows how long it lasts.

The old scene held two wides for 11 and 24 s, crossed the line twice and ended on Shelldon's back.

## 2. The player's feeling

- **In:** the excitement of a close race they had a hand in.
- **Out:** rewarded, and a little amused by the brim.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Shelldon | to see his snails win, and to pay the player | the paving (he walks on grass only) | deadpan, one claim (the satellites) | gives the brim, sends the player home |
| The player | to know what the brim does | Shelldon's answers | one dry question | wears the brim (the give is the proof) |
| Snail Fans | to cheer the courier | the crowd of two | cheer, gesture | (background, cheer on the photo) |

## 4. Subtext

- Shelldon is proud and a little frightened: the bookies will know the snails won. The brim is his way of saying thank you
  without saying so.
- "The snails will tell me when you are done" is a promise that he is watching. It is his button.

## 5. Beat sheet

| # | Time | Beat | What happens (picture first, then words) |
| --- | --- | --- | --- |
| 1 | 0-1 | Hook | The starter's whistle (`whistle`); the camera creeps low over the grass. |
| 2 | 1-9 | The race | A low dolly alongside the track: couriers and a slug, stop-motion across the alley. The player walks in on the grass. |
| 3 | 9-10 | Picture | The finish line, at snail height, two seconds with no words. Silence (music out). |
| 4 | 10-14 | The photo | `triumph` stinger; the fans cheer; the Judge: "Photo finish. The courier wins by the width of a whisker." |
| 5 | 14-19 | Reaction | Shelldon, low, deadpan: "Two hundredths of a whisker. Victory. Wear this." The brim is given. |
| 6 | 19-23 | Question | The player: "What does it do?" Shelldon: "It blocks the satellites that are not watching you." |
| 7 | 23-29 | Button | A reaction beat on the player, then Shelldon's face: "Go home. Walk. The snails will tell me when you are done." |

## 6. Shot list

| # | Shot | Lens / distance | Move | On | Motivation |
| --- | --- | --- | --- | --- | --- |
| 1 | `dolly` low (0.5 m) along the grass, 8 s | 40 | creeps alongside | the courier | the race at snail height |
| 2 | `parallel` spawns over the dolly | - | - | the couriers, the slug | stop-motion, the picture is the race |
| 3 | `cut` low on the finish line, 0.4 m | 34 | locked | the finish | picture first, before a word |
| 4 | the fans cheer (async), the Judge's line over the finish | 34 | locked | the finish | the reveal sits on the picture |
| 5 | `TALK.single('shelldon','mcu',{height:'low'})` | 35, low | locked | Shelldon | his reaction and his deadpan |
| 6 | `TALK.single('you','mcu')` | 35 | locked | the player | the straight man's question |
| 7 | `reaction('you', {hold:'pause'})` then Shelldon low | 35 | locked | the player, then Shelldon | the button is his face |

One side of the line for the hand-over: `coverage('shelldon', 'you', 1)`. Shelldon walks to the grass mark before the
hand-over; the exchange is re-faced (`exchangeLooks`) so every single is taken on the same side.

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Judge | Photo finish. The courier wins by the width of a whisker. | was 17 words with a slime joke; cut the joke (the deadpan does it) and the picture carries the whisker |
| Shelldon | Two hundredths of a whisker. Victory. Wear this. | the hand-over line, short |
| Player | What does it do? | the straight man's question |
| Shelldon | It blocks the satellites that are not watching you. | was 21 words; split and cut to the claim |
| Shelldon | Go home. Walk. The snails will tell me when you are done. | the button; the promise (he is watching) |
| ~~Judge~~ | ~~The race is under way. Snails do not believe in time, so nobody knows how long it lasts.~~ | cut: the picture is the race; the sound of the whistle starts it |
| ~~Shelldon~~ | ~~It is conspiracy grade. It blocks the satellites that are not watching you. I have never once been struck by one.~~ | cut: 21 words, and the joke was already in the intro's reward line |

Names checked: `npm run lore -- find "snail-mail"` and `npm run lore -- find shelldon`: the photo finish on the grass
strip is the lore's stated payoff (the couriers racing a decaf slug from the paddock).

## 8. Music and sound

| Time | Cue | Why |
| --- | --- | --- |
| 0 | `whistle` sfx (the starter); `heist` music, `crowd` ambience | the race starts |
| 9 | music out (fade 0.5) | silence before the photo: the picture is the reveal |
| 10 | `triumph` stinger on the Judge's line | the one sting: the whisker is a victory |

Silence after the stinger is the last 3 s of the scene: none, the button is a line on his face.

## 9. Blocking and vehicles

- The race: couriers spawn on the track from (-91, 70) to (-76, 70); slugs from (-93, 72.5) to (-76.4, 72.5). Both end on
  the finish, which the picture is on.
- Fans: fan1 at (-73.5, 74.5), fan2 at (-74, 68), both cheer on the photo.
- Shelldon: from (-79.5, 74) walks to (-78, 70.2) on the grass, turns to the player for the hand-over.
- The player: walks in from (-62, 64.5) to (-76.5, 68.5) during the race; faces Shelldon for the hand-over.
- The coach is parked where it always is; no vehicle moves in the outro.

## 10. The button

Shelldon's face, low, deadpan: "Go home. Walk. The snails will tell me when you are done." It is the right last moment
because it is his: a promise that he is watching, and it reuses the intro's "Walk, not run". No walk-off, so the last
image is his face.

## 11. Self-check

- [x] The scene has a want (the photo), an obstacle (the paving) and a turn (the whisker's victory).
- [x] The hook lands in 1 s (the whistle); no opening narration.
- [x] Every line under 16 words (longest 12); nobody says what the picture shows.
- [x] Shelldon sounds like his bible entry (deadpan, the satellites); the player's line is short.
- [x] Every speaker MCU or closer, facing the camera, for their line.
- [x] One side of the line for the hand-over; the crossing is gone.
- [x] Music: silence before the reveal, one stinger, no held silence.
- [x] Day scene (`noon`).
- [ ] `npm run cutscene-report` shows OK; the id now passes (see the issue report: remove it from `pacing.baseline.ts`).
- [x] `direction.notes` points here.
