# Director's notes: `m22-off-air-outro`

Watch it at `http://localhost:5310/?no-intro&cutscene=m22-off-air-outro`.

| | |
| --- | --- |
| Scene | `m22-off-air-outro` in `src/cutscene/scenes/story/m22-off-air.ts` |
| Played by | quest `m22-off-air` ("Off Air") as its outro, after the van is brought to the booth |
| Kind and length | `outro`, aim 15-45 s; now 19.1 s at Normal text speed, no faults |
| Where, when | stage `sorrel-radio-booth`, night, `sky: 'night'`, two porcelain lanterns on the crates |
| Before / after | before: the van delivered at the lay-by by the booth. After: free roam; the next quest (the Cracked Tablet) is at the Unmowed Hollow |

## 1. Purpose in the story

The payoff of the rescue: the tapes are home and one is played on the air. The sound is the point: rain filling 88.7 in
the dark wood, never explained. It also sets up the Hollow: Sorrel asks the player to take Pip to meet the Elder, and Pip
stands silent at the door, which row 23 turns into the first time he has nothing to say.

## 2. The player's feeling

- **In:** the chase and the guards are done, the van is a trophy.
- **Out:** a quiet, earned warmth; a question hanging over Pip.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Sorrel | to put the rain back on the air | the HOA's ban | one dry line, then the tape | sends the player and Pip to the Elder |
| Pip | to stay out of it | the rain, and what it is near | stands at the door | silent: he has no joke |

## 4. Subtext

- "They filed it under crime. I filed it under rain." is her whole defence of the broadcast.
- Pip at the door, not inside: he stood at the edge of the place he is afraid of, and the rain sounds like somewhere he knows.
- The scene never names where the rain falls.

## 5. Beat sheet

| # | Time | Beat | What happens |
| --- | --- | --- | --- |
| 1 | 0-1.4 | Hook | Close on the deck: a tape clicks in (`latch`) |
| 2 | 1.4-6 | Setup | Sorrel, dry: "They filed it under crime. I filed it under rain." |
| 3 | 6-8 | Play | The deck, the `tap`, the static; music out, the `rain` bed swells (2.5 s), the radio up |
| 4 | 8-12 | Pip | Pip at the door, listening; the one held silence (2.0 s) |
| 5 | 12-14.5 | The booth | A wide: rain on the canvas, far thunder |
| 6 | 14.5-17 | Turn | Sorrel, low: "Elder Bracken is waiting at the Hollow. Take Pip with you." |
| 7 | 17-19 | Button | A slow push-in on Pip, who has nothing to say |

## 6. Shot list

| # | Shot | Lens | Move | On | Motivation |
| --- | --- | --- | --- | --- | --- |
| 1 | `spot('sorrel-radio-booth','close')` | stage | locked | the deck and Sorrel's hands | the hook |
| 2 | `shot('sorrel','mcu')` | 35 | locked | Sorrel | her line |
| 3 | `cut` at (-377.6, 45.4) on the deck | 36 | locked | the cassette deck | the tape plays |
| 4 | `shot('pip','mcu',{toward:'sorrel'})` | 35 | locked | Pip | the listener |
| 5 | `spot('sorrel-radio-booth','wide')` | stage | locked | the booth | the picture holds while it plays |
| 6 | `shot('sorrel','mcu',{height:'low'})` | 35 | locked | Sorrel | the turn |
| 7 | `pushIn('pip','ms',3.5)` | 40 to 35 | push-in | Pip | the button |

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Sorrel | They filed it under crime. I filed it under rain. | 10 words |
| Sorrel | Elder Bracken is waiting at the Hollow. Take Pip with you. | the next errand; said gently, after the rain, not as a waypoint |

Pip says nothing. No gag.

## 8. Music and sound

| Time | Cue | Why |
| --- | --- | --- |
| 0 | `fescue`, `night` bed; `latch` | the booth at night |
| 6 | `tap`, `static`; music out (0.8 s); `rain` bed up (2.5 s); radio level up | the tape plays; the rain is the payoff |
| 8 | silence (2.0 s) | Pip's beat |
| 12 | `thunder` | far, on the wide |

## 9. Blocking

Sorrel at her desk mark (-375, 47). Pip at the booth door (-371, 61) facing her. The player at the booth mark (-375, 58).
Lanterns on the crates at (-369.4, 56) and (-380.6, 45.5).

## 10. The button

Pip, in the rain sound, nothing to say. It is the right last moment because Pip's silence is what the next quest answers.

## 11. Self-check

- [x] A want (the tape on air), a turn (the Elder), no briefing.
- [x] The hook lands in 1.4 s; the first thing is a picture.
- [x] No line over 16 words; never says what the rain is.
- [x] One held silence only; music out for the rain.
- [x] Night scene lit (`sky: 'night'`, two lanterns).
- [x] `cutscene-report` shows the scene OK; `direction.notes` points here.
