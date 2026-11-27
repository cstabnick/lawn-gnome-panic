# Director's notes: `diggs-medal-outro`

| | |
| --- | --- |
| Scene | `diggs-medal-outro` in `src/cutscene/scenes/story/m61-diggs-medal.ts` |
| Played by | quest `m61-diggs-medal` as its outro, after the player walks the medal up the yard |
| Kind and length | `outro`, aim 15-45 s; about 45 s |
| Where, when | stage `diggs-yard`, dusk (`sky: 'golden'`) |
| Before / after | before: the drive home in the clerks' van; after: row 62 (the laugh) |

## 1. Purpose in the story

Why Diggs stayed. The hardliner sits down for the first time in fifteen years, holds the medal, and says the sandpit was somebody's idea of a garden once and he stayed in case they came back (the Tall Ones are never named: loose thread). Then the medal goes on the nail. Sincere, no gag on top: the next row is the laugh.

## 2. The player's feeling

- **In:** a gentle drive, a tin star.
- **Out:** the quietest moment of the act; tension 3 to 4.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Diggs | to hang the medal where it was | fifteen years of standing | numbers, then plain words | sits, speaks, stands down until morning |
| The player | to listen | nothing | one question | stands witness |
| Yarrow | to witness | nothing | bows (silent) | no lines |

## 4. Subtext

"A guard who sits has left his post" is the reason he never sat. The deck chair has stood at the edge of his hole since the hole was dug. "In case they came back" is the whole of his loyalty; nobody says who "they" are.

## 5. Beat sheet

| # | Time | Beat | What happens |
| --- | --- | --- | --- |
| 1 | 0-5 | Hook | Insert: the medal swinging from the player's hand in the last light. |
| 2 | 5-10 | Setup | Wide at the gate: Diggs at his door, the player coming, Yarrow by the fence. |
| 3 | 10-18 | The tag | The give; "Tag four-four-seven-one. Unclaimed." |
| 4 | 18-35 | Turn | He walks to the chair and sits; "A guard who sits has left his post." / "Why did you stay?" / music out / "The sandpit was somebody's idea of a garden once." / "I stayed in case they came back." One held silence. |
| 5 | 35-45 | Button | He stands: "The fort can spare me until morning." Music back; he hangs the medal on the nail and salutes it; the last shot is the star on its nail, the tin ticking. |

## 6. Shot list

| # | Shot | Lens | Move | On | Motivation |
| --- | --- | --- | --- | --- | --- |
| 1 | `insert('player')` | 30 | locked | the medal | hook |
| 2 | stage `gate-wide` | 46 | locked | yard | setup |
| 3 | `CONF.single('player','mcu')` then `diggs cu high` | 35/30 | locked | the give, the tag | the handover |
| 4 | track from the east side | 46 | follows | Diggs to the chair | the walk |
| 5 | across the hole: cut, dolly, cut tighter | 36/34/28 | 5.4 s dolly | Diggs seated, spade in the foreground | the confession |
| 6 | `shot('player','mcu')` | 35 | locked | the question | |
| 7 | `CONF.single('diggs','mcu',{height:'low'})` | 35 | locked | "morning" | release |
| 8 | track, then a close cut on the nail | 44/30 | | the hang | |
| 9 | `pullOut('diggs','ms')` | | 3 s | the salute | |
| 10 | cut on the nail | 28 | locked | the button | |

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Diggs | Tag four-four-seven-one. Unclaimed. | reads the HOA tag |
| Diggs | Fifteen years I have not sat. A guard who sits has left his post. | |
| Player | Why did you stay? | |
| Diggs | The sandpit was somebody's idea of a garden once. | |
| Diggs | I stayed in case they came back. | |
| Diggs | The fort can spare me until morning. | says he stays in Pebblewick tonight |

## 8. Music and sound

`turfton-dusk` in, `clink`, `crunch`, `paper`, `chair` + `sad` stinger at the sit, music out for the confession, one `silence` beat, music back, `tap`, `clink`, `creak` (the hut cooling).

## 9. Blocking and vehicles

Diggs at (615, 217.4) walks to the E10 deck chair at (611.9, 215.8) facing west; Yarrow stands at (617.3, 212.6) with his ledger. The roster-wall prop at (613.1, 218.4); the hung medal prop sits with its star at the nail. Diggs hangs it standing at (613.1, 217.3).

## 10. The button

A tin star on a brass-capped nail in the last light, and a tin hut ticking as it cools.

## 11. Self-check

- [x] Want, obstacle, turn (the question).
- [x] Every line 14 words or fewer; no gag; Diggs has no contractions.
- [x] One silence; one stinger.
- [x] Dusk lit by `sky: 'golden'`.
- [x] `cutscene-report` OK; line of sight passes.
- [x] `direction.notes` points here.
