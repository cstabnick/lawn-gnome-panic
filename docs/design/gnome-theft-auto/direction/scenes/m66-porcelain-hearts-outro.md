# Director's notes: `m66-porcelain-hearts-outro`

| | |
| --- | --- |
| Scene | `m66-porcelain-hearts-outro` in `src/cutscene/scenes/story/m66-porcelain-hearts.ts` |
| Played by | quest `m66-porcelain-hearts`, as its outro, after the player returns to Clara on the porch steps |
| Kind and length | `outro`, aim 15-45 s; about 25 s |
| Where, when | stage `m66-porch-log`, the porch steps, deeper dusk (`sky: 'golden'`, `night` bed) |
| Before / after | before: the photograph; after: the quest list ("Emergency Assessment" opens with Hedda's gag) |

## 1. Purpose in the story

**Clara asks that Vesper be stopped, not broken.** Every sentence ends early or ends in a hush. The player is given the
photograph, which the finale shows. This is the first time the player learns the man in the throne has a hairline crack
and a history. Achievement `gta-hairline` unlocks here.

## 2. The player's feeling

- **In:** careful; they have just seen the photograph.
- **Out:** the weight of it. They have been asked to do something hard in a gentle way. Tension 3.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Clara | to be understood without saying the worst thing | she cannot finish the sentence | understatement, stopping early | gives away the photograph |
| The player | to promise | none | one short line | takes it by the frame |

## 4. Subtext

- "I saw it first": she knew by the first crack, and said nothing; that is her guilt, never named.
- "Do not..." and a restart: the hardest word in the scene, and it is "break".
- "By the frame. The picture scratches." is tenderness about a photograph said in place of tenderness about him.
- "We break in the small places": the instruction for how to treat him and the reason for her whole refuge.

## 5. Beat sheet

| # | Time | Beat | What happens |
| --- | --- | --- | --- |
| 1 | 0-4 | The photograph | "He was one of us on the porch." The player listens. |
| 2 | 4-9 | The hair | Push-in: "Under the hat. A hair. I saw it first." |
| 3 | 9-15 | The ask | "Stop him. Please. Do not..." "I will." "Do not break him." |
| 4 | 15-20 | The gift | The photograph passes hands. "By the frame. The picture scratches." |
| 5 | 20-26 | Button | A last medium shot of her, the lantern at her feet unlit. "Slowly, please. We break in the small places." Music out. |

## 6. Shot list

| # | Shot | Lens / distance | Move | On | Motivation |
| --- | --- | --- | --- | --- | --- |
| 1 | `PLEA.single('clara','mcu',{height:'low'})` | 35 | locked | Clara | line one |
| 2 | `shot('player','mcu')` | 35 | locked | the player | listening |
| 3 | `pushIn('clara','mcu' to 'cu')` | 35 | slow push | Clara | "I saw it first" |
| 4 | `PLEA.single('clara','mcu')` | 35 | locked | Clara | the ask |
| 5 | `shot('player','mcu')` | 35 | locked | the player | "I will." |
| 6 | `PLEA.single('clara','cu')` | 30 | locked | Clara | "Do not break him." |
| 7 | `insert('clara')` | 30 | locked, high | the hands | the gift |
| 8 | `PLEA.single('clara','mcu')` | 35 | locked | Clara | the handling |
| 9 | `shot('clara','ms',{height:'low'})` | 40 | locked | Clara and the lantern | the button |

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Clara | He was one of us on the porch. | the outline's line |
| Clara | Under the hat. A hair. I saw it first. | |
| Clara | Stop him. Please. Do not... | breaks off |
| Player | I will. | the only player line |
| Clara | Do not break him. | the bible's "Stop him. Do not break him." |
| Clara | By the frame. The picture scratches. | from the prefab's own note |
| Clara | Slowly, please. We break in the small places. | her bible line, the last words |

## 8. Music and sound

| Time | Cue | Why |
| --- | --- | --- |
| 0.0 | `sad` music, `night` bed (radio 0.08) | the quietest scene in the act |
| 1 | `paper` | the photograph under her thumb |
| 17 | `cloth` | it changes hands |
| 22 | music out (3.0 s) | the last line has no score |

## 9. Blocking and vehicles

No vehicles. Clara on the porch steps with the photograph; the player on the grass below facing her; a porcelain lantern
on the step beside her, unlit from the first shot to the last.

## 10. The button

She says the instruction as an instruction, then nothing: three seconds of her small in the frame beside a dark lantern.

## 11. Self-check

- [x] Want (to be understood), obstacle (the word), turn ("Do not...").
- [x] Hook in 3 s: paper under a thumb, then her first line.
- [x] Every line 12 words or fewer; Clara never speaks more than three in a row.
- [x] No gag; no "Tall House".
- [x] One held silence at the end, no stinger.
- [x] `npm run cutscene-report` OK; line of sight passes.
- [x] `direction.notes` points here.
