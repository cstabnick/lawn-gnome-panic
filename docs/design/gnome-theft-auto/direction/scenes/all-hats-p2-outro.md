# Director's notes: `all-hats-p2-outro`

| | |
| --- | --- |
| Scene | `all-hats-p2-outro` in `games/gnome-theft-auto/src/cutscene/scenes/story/m64a-all-hats.ts` |
| Played by | quest `m64-all-hats-p2` as its outro |
| Kind and length | `outro`, aim 15-45 s; 30 s |
| Where, when | stages `m64a-overlook-rail` and `m64a-airfield-line` (cutaway), noon |
| Before / after | before: the flight back; after: p3 By Road (64-all-hats.ts) |

## 1. Purpose in the story

"A line of planes and one Dewdrop parked on the apron" (L95, cutscene-only): the coalition's air force. Tansy ticks the second cross. Wally's tic (he stands only for things in the air) is the button.

## 2. The player's feeling

- **In:** landing on the dust.
- **Out:** air is done; the triumph is building toward the camp.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Wally | to report, briefly | | numbers | sits down |
| Tansy | the count | | one word | ticks a cross |
| Pip | to cheer | a ball | lists | |

## 4. Subtext

- Wally fears his knees going: standing twice is a lot.

## 5. Beat sheet

| # | Time | Beat | What happens |
| --- | --- | --- | --- |
| 1 | 0-5 | Hook | The Crop Duster rolls in and stops; Wally and the player climb out. |
| 2 | 5-12 | Setup | At the rail (a time cut): "Twenty-three on the landing. Show-off." "Air?" |
| 3 | 12-19 | Reveal | Cutaway: the line on the apron, the Dewdrop rolling into place. |
| 4 | 19-26 | Turn | Pip's list; four that fly, one that rolls; Tansy ticks the sock: "That's air." |
| 5 | 26-30 | Button | "Stood up twice today. Wake me for the beacon." He sits. |

## 6. Shot list

Stage `landing`; `coverage(wally, tansy, -1)` singles; stage `line` cutaway; Pip MCU; `insert(tansy)` on the sock; Wally MS for the button.

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Wally | Twenty-three on the landing. Show-off. | stall-speed tic |
| Tansy | Air? | |
| Wally | Look at the airfield, kid. | |
| Pip | Planes! A copter! A dandelion! And a... ball? | |
| Wally | Four that fly. One that rolls. Hogweed calls it an air force. | |
| Tansy | That's air. | the second cross |
| Wally | Stood up twice today. Wake me for the beacon. | button |

## 8. Music and sound

`wind` bed, `triumph` (All Hats). Sfx: `skid`, `squeak`, `paper`.

## 9. Blocking and vehicles

The player's plane (`from: player`) rolls to the landed mark (262, 22); Wally and the player exit and are re-spawned at the rail marks (a cut on the walk). Tansy and Pip on their rail marks; a deck chair by Wally's mark (284, 41.2). The line: Hedge-Hopper, Sycamore Copter, a second Crop Duster, Dandelion Drifter, Dewdrop, two Underspanners. The player ends on foot at the rail.

## 10. The button

An old pilot sitting down, binoculars on the sky.

## 11. Self-check

- [x] Want, obstacle and turn; not a briefing.
- [x] Hook in 3 s on a picture and a sound, not narration.
- [x] Every line under 16 words; no coordinates; nobody describes the picture.
- [x] Voices per bible section 2 and characters.md.
- [x] Speakers MCU/MS on the eyeline; reactions after the big lines.
- [x] One side of the line per pair (`coverage`), no crossing faults.
- [x] Music changes have reasons; at most one stinger; no held silence (not a sincere scene).
- [x] Running jokes climb a rung (section 1).
- [x] Day scene: no lighting problem.
- [x] `npm run cutscene-report`: OK, not in Variety or Sound; `scenes.test.ts` (line of sight) passes.
- [x] `direction.notes` points here.
