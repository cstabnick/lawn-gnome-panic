# Director's notes: `m67-emergency-assessment-outro`

| | |
| --- | --- |
| Scene | `m67-emergency-assessment-outro` in `src/cutscene/scenes/story/m67-emergency-assessment.ts` |
| Played by | quest `m67-emergency-assessment`, as the beat of the passenger objective (`beats: { 2 }`): it plays when the enforcers are cracked and Juniper is about to leave the side door |
| Kind and length | `outro`, aim 15-45 s; about 20 s |
| Where, when | stage `m67-side-door-yard`, late afternoon (`sky: 'golden'`) |
| Before / after | before: the crack in the yard; after: the drive to Founders' Green (Hedda's "filed" on arrival) |

## 1. Purpose in the story

**Juniper walks out without him.** City Hall has fallen, and the Vances, who in the whole game have never looked at each
other while insulting each other, look at each other once, plainly. Reginald stays behind to measure something. The row
ends sincere; row 68 opens with Hyssop's laugh. No gag.

## 2. The player's feeling

- **In:** adrenaline from the yard.
- **Out:** a hush. Tension drops from 9 to a held 4. Something has been left behind.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Juniper | to get her brother out; to leave if he will not come | he will not | brisk thanks, then one instruction | walks on without looking back |
| Reginald | to stay and measure | the sister he cannot argue with | exact words, one repeated word | closes the door |
| The player | to be there | none | stays out of it | follows |

## 4. Subtext

- The look is the scene. Thirty years of insult, then two seconds of silence.
- "Measure it twice" is her love, in his language: she agrees with him, which is how she insults him, and for once it is a blessing.
- "Twice." is his reply: he will be careful, and he will come back.

## 5. Beat sheet

| # | Time | Beat | What happens |
| --- | --- | --- | --- |
| 1 | 0-4 | Hook | The open door; Juniper steps out into the light, a folded order under her arm. |
| 2 | 4-9 | Thanks | "Thank you. I have a signature to deliver." Reginald: "I will stay. There is something to measure." |
| 3 | 9-12 | The look | Profile two-shot, music out, a held silence of two seconds: they look at each other. |
| 4 | 12-16 | The word | "Measure it twice." "Twice." |
| 5 | 16-20 | Button | The door closes; she walks on; the latch; a wide on an empty yard. |

## 6. Shot list

| # | Shot | Lens / distance | Move | On | Motivation |
| --- | --- | --- | --- | --- | --- |
| 1 | stage camera `door-low` | 40 | locked, low | the open door; Juniper stepping out | hook |
| 2 | `shot('juniper','mcu',{toward:'player',height:'low'})` | 35 | locked | Juniper | the thanks |
| 3 | `SIBLINGS.single('reginald','mcu')` | 35 | locked | Reginald | "I will stay" |
| 4 | `shot('juniper','ms',{toward:'reginald',side:90})` | 40 | locked, profile | both, side on | **the look** |
| 5 | `SIBLINGS.single('juniper','cu')` | 30 | locked | Juniper | "Measure it twice" |
| 6 | `SIBLINGS.single('reginald','cu')` | 30 | locked | Reginald | "Twice." |
| 7 | stage camera `yard-wide` | 50 | locked | the closed door, the empty yard | button |

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Juniper | Thank you. I have a signature to deliver. | brisk, formal |
| Reginald | I will stay. There is something to measure. | the outline's "measure something" |
| Juniper | Measure it twice. | the quiet one |
| Reginald | Twice. | |

Neither insults the other; this is the one scene where they do not. Names checked: `npm run lore -- find Vance`.

## 8. Music and sound

| Time | Cue | Why |
| --- | --- | --- |
| 0.0 | `sad` music, `street` bed (radio 0.08) | the hush after the fall |
| 1 | `door-creak`, `footsteps` | the door, her steps |
| 9 | music out (0.6 s), `tap` of the caliper, held `silence` | the look; once in the scene |
| 12 | music back in (2.0 s) | the word |
| 16 | `door-creak`, `latch` | the door closing |

## 9. Blocking and vehicles

No vehicles. The open door leaf; Reginald in the doorway behind it; Juniper steps out and stands about 2 m from him, in the
yard; the player is on the other side of her. At the end the leaf is removed and the door is shut.

## 10. The button

The latch, then three seconds of a swept yard.

## 11. Self-check

- [x] Want (to leave; to stay), obstacle (each other), turn (the look).
- [x] Hook in 3 s: a door and a step into the light.
- [x] Every line 12 words or fewer.
- [x] No gag: Hedda's is the only one in the row.
- [x] One held silence, no stinger.
- [x] `npm run cutscene-report` OK; line of sight passes.
- [x] `direction.notes` points here.
