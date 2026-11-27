# Director's notes: `m67-emergency-assessment-intro`

| | |
| --- | --- |
| Scene | `m67-emergency-assessment-intro` in `src/cutscene/scenes/story/m67-emergency-assessment.ts` |
| Played by | quest `m67-emergency-assessment` (Emergency Assessment), as its intro, when the player talks to Hedda at the Tattler's desk |
| Kind and length | `intro`, aim 30-60 s; about 36 s at Normal text speed |
| Where, when | stage `m67-tattler-desk` (the Founders' Green north gate, R-229), day (`sky: 'noon'`) |
| Before / after | before: Clara's plea (row 66); after: the drive to City Hall's side door |

## 1. Purpose in the story

**The declaration.** The row opens with Hedda's gag, after the hush of row 66: she types the story as it happens and the
HOA van's loudspeaker confirms it. The facts follow in telegrams: Vesper has seized City Hall, Juniper is held, Reginald has
telephoned Hedda himself. That last line is where Reginald's doubt from row 12 starts to pay.

## 2. The player's feeling

- **In:** the weight of Clara's photograph.
- **Out:** jolted back to a job, with a laugh in the middle and dread at the end. Tension climbs to 6.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Hedda | to file, and to get the player to City Hall | the loudspeaker getting there first | telegrams, typing as she talks | sends the player and goes back to the keys |
| The HOA crier | to announce | nobody is listening | the official voice | rolls on |
| The player | to learn the job | none | short questions | nods |

## 4. Subtext

- Hedda has typed the fee before the crier says it: she files as it happens, and slightly before.
- "Reginald. Telephoned me. Himself. First time." is the surprise: her one unconfirmed source, doubting out loud.
- The crier's "remain even" is Vesper's religion used as a public notice.

## 5. Beat sheet

| # | Time | Beat | What happens |
| --- | --- | --- | --- |
| 1 | 0-4 | Hook | The printer, her fingers on the keys, an HOA van creeping up the road. "Emergency. HOA. City Hall. Seized." |
| 2 | 4-11 | The announcement | The van idles by the gate; the crier: "Residents, remain even. City Hall is under emergency assessment. A small fee applies." |
| 3 | 11-15 | The gag | Hedda: "Small fee. Typed. Filed." |
| 4 | 15-27 | The facts | "Juniper. Held. Inside. Side door, west wall." "Who opens it?" "Reginald. Telephoned me. Himself. First time." |
| 5 | 27-36 | Button | A nod. "Drive. I file." The van rolls on; keys. |

## 6. Shot list

| # | Shot | Lens / distance | Move | On | Motivation |
| --- | --- | --- | --- | --- | --- |
| 1 | stage camera `road` | 50 | locked | the desk and the road, the van arriving | hook |
| 2 | `FILING.single('hedda','mcu')` | 35 | locked | Hedda | the headline |
| 3 | `shot('crier','mcu',{toward:'hedda'})` | 35 | locked | the crier at the van window | the PA |
| 4 | `FILING.single('hedda','mcu')` | 35 | locked | Hedda | the gag |
| 5 | `pushIn('hedda','mcu' to 'cu')` | 35 | slow push | Hedda | the facts |
| 6 | `FILING.single('player','mcu')` | 35 | locked | the player | the question |
| 7 | `FILING.single('hedda','mcu')` | 35 | locked | Hedda | Reginald |
| 8 | `FILING.single('player','mcu')` | 35 | locked | the player | the nod |
| 9 | `FILING.single('hedda','mcu')` | 35 | locked | Hedda | "Drive. I file." |
| 10 | stage camera `road` | 50 | locked | the van gone on, the keys | the button |

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Hedda | Emergency. HOA. City Hall. Seized. | no verbs of her own: a headline |
| Crier | Residents, remain even. City Hall is under emergency assessment. A small fee applies. | the satire; "even" is Vesper's word |
| Hedda | Small fee. Typed. Filed. | the row's only gag |
| Hedda | Juniper. Held. Inside. Side door, west wall. | |
| Player | Who opens it? | |
| Hedda | Reginald. Telephoned me. Himself. First time. | |
| Hedda | Drive. I file. | |

Names checked: `npm run lore -- find Tattler`, `find Hedda`, `find "Founders' Green"`.

## 8. Music and sound

| Time | Cue | Why |
| --- | --- | --- |
| 0.0 | `tension` music, `street` bed (radio 0.1) | the act turns |
| 1 | `tap`, `clatter` | typing and the printer |
| 5 | van `horn` | the announcement |
| 15 | `tap` | the gag's keystrokes |
| 33 | `tap` | she files |

## 9. Blocking and vehicles

An `hoa-van` with the crier seated drives in along the eastbound lane to about 10 m from the desk, idles, and rolls on at
the end. Hedda stands behind the desk facing the street; the player is at the front of it.

## 10. The button

The keys, again, with the van's sound dying away up the road.

## 11. Self-check

- [x] Want (to file; to send the player), obstacle (the loudspeaker), turn (Reginald telephoned).
- [x] Hook in 3 s: typing, the van, the first headline.
- [x] Every line 14 words or fewer.
- [x] One gag, and it is Hedda's.
- [x] `npm run cutscene-report` OK; line of sight passes.
- [x] `direction.notes` points here.
