# Director's notes: `dons-cigars-outro`

Watch it at `http://localhost:5310/?no-intro&cutscene=dons-cigars-outro`.

| | |
| --- | --- |
| Scene | `dons-cigars-outro` in `src/cutscene/scenes/story/m11-the-dons-cigars.ts` |
| Played by | quest `m11-the-dons-cigars` as its outro (the crates delivered, the player on foot at the side door) |
| Kind and length | `outro`, aim 15-45 s; 17.9 s at Normal text speed, no faults |
| Where, when | stage `mulch-club-door`; dusk (`sky: 'golden'`) |
| Before / after | before: the van drive past the HOA. After: the debt is a little lighter; row 12 is Juniper's morning |

## 1. Purpose in the story

A small test of trust (Lou's hat check) and the war with Vesper shown, not told: the Don lights a cigar and looks at an
HOA van parked across the road; its inspector lowers his binoculars; the van drives away. Plants the Mulch Club's war
with the HOA for later acts (rows 63 and 70). Vesper is never named or shown.

## 2. The player's feeling

- **In:** the crates are in, the cops are not.
- **Out:** accepted, and aware of a larger fight.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Big Lou | to check the hat and the crates | none | one word | "Don says yes. I say hat." |
| Don Compost | to light a cigar in front of the HOA | the van | a tap, a long look | the van leaves |
| HOA inspector | to cite the doorstep | the Don's look | binoculars | lowers them and goes |
| The player | to be let in | the hat test | stands still | accepted |

## 4. Subtext

- The hat check is a test of whether the player is theirs.
- The Don's one tap at the van is the whole war: a mower, a mob, a pink slip against a cigar.

## 5. Beat sheet

| # | Time | Beat | What happens |
| --- | --- | --- | --- |
| 1 | 0-5 | Hook | Lou, low: "Hat." He steps in and looks at the player's hat |
| 2 | 5-9 | Verdict | "Dry." The player's stillness; "Is that good?" "Don says yes. I say hat." |
| 3 | 9-14 | Turn | The Don opens the box; two latches, a lighter; the music drops |
| 4 | 14-17 | The war | The cut to the HOA van across the road, its inspector's binoculars; one tap; the van's lights go out and it leaves |
| 5 | 17-18 | Button | "Hat." |

## 6. Shot list

| # | Shot | Lens / distance | Move | On | Motivation |
| --- | --- | --- | --- | --- | --- |
| 1 | `HAT_CHECK.single('lou','mcu',low)` | 35 | locked | Lou | the hook, as he steps in |
| 2 | `shot('lou','cu')` | 30 | locked | Lou | the inspection |
| 3 | `reaction('player','mcu')` | 35 | locked | the player | the stillness |
| 4 | `HAT_CHECK.single('player','mcu')` | 35 | locked | the player | the question |
| 5 | `HAT_CHECK.single('lou','mcu',low)` | 35 | locked | Lou | the verdict |
| 6 | `DON_VIEW.single('don','mcu',low)` | 35 | locked | the Don | the lighter |
| 7 | `cut` across the road, long lens | 30 | locked | the HOA van | the war, shown |
| 8 | `track` the van | 46 | tracks | the van | it leaves |
| 9 | `HAT_CHECK.single('lou','mcu',low)` | 35 | locked | Lou | the button |

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Lou | Hat. | greeting |
| Lou | Dry. | verdict |
| Player | Is that good? | the straight man |
| Lou | Don says yes. I say hat. | his own line (characters.md) |
| Lou | Hat. | farewell: greeting, verdict, farewell in one scene |

## 8. Music and sound

| Time | Cue | Why |
| --- | --- | --- |
| 0 | `heist` music, `night` bed | the Mulch Club at dusk |
| 9 | music out | the held silence before the lighter |
| 11, 12 | `latch` x2 | the lighter |
| 14 | `tap` | the Don's tap |
| 16 | `engine-rev` | the van leaves |
| 17 | `turfton-dusk` | the button |

## 9. Blocking and vehicles

- The player at (-9, -30) facing the door; Lou at (-17.5, -33) steps to (-12.4, -31.4); the Don at (-17.5, -30); the HOA
  van (`hoa-van`, headlights on) at (2.5, -52) facing south, an inspector with binoculars at (1.2, -49.6). The van drives
  north to (2.5, -96). The cone-van the player drove is still at the pull-up in the world.

## 10. The button

Lou's "Hat." and the van's lights going out up the road.

## 11. Self-check

- [x] Want, obstacle, turn, button.
- [x] Hook in 3 s: a word and a motion.
- [x] Lines under 16 words.
- [x] Lou's voice: one or two words, never a question.
- [x] MS or closer; one side of the line.
- [x] One held silence (the music drop).
- [x] Night scenes are lit: the van's headlights are the practical light, a lamp at the door is the other.
- [x] Dusk, `sky: 'golden'`.
- [x] Report OK.
- [x] `direction.notes` points here.
