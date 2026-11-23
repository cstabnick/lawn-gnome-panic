# Director's notes: `founders-boot-outro`

Watch it at `http://localhost:5310/?no-intro&cutscene=founders-boot-outro`.

| | |
| --- | --- |
| Scene | `founders-boot-outro` in `src/cutscene/scenes/story/ch1d.ts` |
| Played by | quest `ch1-founders-boot` as its outro; it closes chapter 1 (before `END OF CHAPTER 1`) |
| Kind and length | `chapter-close`, aim 40-80 s, fault above 100; now 55.7 s (was 67 s, 8 faults) |
| Where, when | stages `side-valve-bay`, `bodega-front`, `patio-gallery` (world); `sky: 'golden'` (dusk) for the whole scene |
| Before / after | before: the Boot is in the jury box; the crew escapes in the Combine. After: `END OF CHAPTER 1`; chapter 2 (Black Dew) |

## 1. Purpose in the story

Close chapter 1: the Boot heist worked, and Vesper answers it. Chapter 1's question was "can the player pay their way out?";
the answer is "no, and now Vesper is watching". Three things this scene owes:

- **The deed**: "Stamped. Filed. Ours." The crew's win, in the bay.
- **Asphalt's bottlecap** (ladder rung 1, "she knew"): John reports the Boot in the jury box; Asphalt knew (the cat is on the
  counter, showing the bottlecap is the town's barometer).
- **Vesper's threat**: "Freeze the Black Dew. Cloverfield first." and "Then we stop asking." (the chapter's button).
  Reginald's calipers and report set it up.

## 2. The player's feeling

- **In:** pleased: the Boot is theirs; Pip's lap of joy is funny.
- **Out:** cold. The laugh is at the start; the scene ends on a threat, not a gag. Vesper's last line hangs.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Tansy | to file the deed and keep the bay | the crew's noise | flat, short, holds the ledger | the crew has a win she will guard |
| Pip | to be praised for the lap; to keep being useful | Tansy's flat tone | a lap, a run, a volume | none: he celebrates |
| John Bodega | to report the town's gossip | none | dry, a sentence or two | none |
| Asphalt (cat) | to be left alone on the counter | the bottlecap | (a prop; the cap is the barometer) | none |
| Vesper | a silent, beige Turfton and the Acorn | the crew; the Boot | soft, complete, never a contraction, no exclamation | none: he decides |
| Reginald | to report the tribunal was crashed | Vesper's silence | calipers, municipal, a question | asks the question that gives Vesper his last line |

## 4. Subtext

- Tansy is glad and frightened; the deed is a thing she can keep, which is not the same as being safe.
- Reginald reports the boot as an insult to the code; he is afraid of Council questions (his question sets up "we stop asking").
- Vesper does not care about the boot. He cares about the Black Dew and Cloverfield. The threat is that the crew
  embarrassed the Council, and the Council's answer is to be ended (not argued with).

## 5. Beat sheet

Times from the checker at Normal text speed (`TIMELINE=1`).

| # | Time | Beat | What happens (picture first, then words) |
| --- | --- | --- | --- |
| 1 | 0-8 | Hook | The Combine rolls onto the apron (track, 4 s); the player steps down (exit) |
| 2 | 8-10 | Deed | Tansy MCU-ish with the ledger in her hand: "Stamped. Filed. Ours." |
| 3 | 10-12 | Joy | Locked wide track on Pip's lap of joy: "Lap of joy! Lap of joy!" |
| 4 | 12-15 | Asphalt | A slow dolly onto the cat and her bottlecap, close; a knock (gain 0.3) |
| 5 | 15-21 | Bodega | John MCU: "Turfton FM says the Boot parked itself in the jury box." "Asphalt says she knew." |
| 6 | 21-24 | Vesper alone | Dusk; a villain stinger; a low dolly on Vesper alone, pushing in. He is still |
| 7 | 24-32 | Reginald arrives | Van track (5 s), exit, calipers in hand; he walks in; a wait, then his report |
| 8 | 34-37 | Report | Reginald MCU: "They crashed the tribunal, sir. With a boot." |
| 9 | 37-40 | Vesper threat | Low dolly on Vesper: "Freeze the Black Dew. Cloverfield first." |
| 10 | 40-42 | The question | Reginald MCU: "And when the Council asks questions, sir?" |
| 11 | 42-44 | Button | Low dolly on Vesper, alone: "Then we stop asking." |
| 12 | 52-56 | Title | the music fades out on Vesper's push-in; `END OF CHAPTER 1` over him (review pass: the empty Lowrider leaving was cut, the chapter ends on his face) |

The turn is at about 60% (Vesper's first threat, after the report). The button is Vesper's last line in the last 12 s
of the scene and the title; the threat, not the gag.

## 6. Shot list

| # | Shot | Lens | Move | On | Motivation |
| --- | --- | --- | --- | --- | --- |
| 1 | `track` the Combine (pos [-160, 50, 4]), drive, `exit` player | 50 | track | the Combine, the player steps down | the arrival, under 12 s |
| 2 | `cut` pos (-139, 70.5, 1.8), look Tansy | 46 | locked | Tansy with the ledger | the deed, in her face |
| 3 | `track` pos (-128, 50, 5) on Pip | 52 | locked-off track | Pip's lap, centred | the physical gag, the widest that reads |
| 4 | `dolly` (-76.4, 90.4, 0.9) to (-77.2, 89.6, 0.8), look at the cat, 2.4 s | 40 | slow dolly | Asphalt and the bottlecap | an insert of the prop (1-2 s rule, held 2.4 s) |
| 5 | `cut` pos (-76.9, 1.25, 88.8), look John | 46 | locked | John, the gossip | the chorus's reporting shot |
| 6 | `dolly` low from (146, -152, 0.7) to (142, -152, 0.7), look Vesper, 5 s, then 3 s wait | 34 | slow push-in | Vesper alone | the threat, alone in the frame |
| 7 | `track` van (pos [120, -130, 4]), drive, exit Reginald | 50 | track | the van and Reginald getting out | the arrival, under 12 s |
| 8 | `frame` Reginald MCU, toward Vesper; 2.2 s wait; report | 35 | locked | Reginald reports | the speaker in the frame |
| 9 | `dolly` low on Vesper, (142.5, -150) to (140.5, -151.5), 4 s | 34 | slow push-in | Vesper: "Freeze the Black Dew..." | no cut while he talks |
| 10 | `frame` Reginald MCU, toward Vesper | 35 | locked | Reginald's question | the question he asks |
| 11 | `dolly` low on Vesper, (143.5, -150) to (140.5, -151.5), 4 s | 33 | slow push-in | Vesper: "Then we stop asking." | the last line, the button |
| 12 | (the last Vesper dolly holds) | 33 | slow push | Vesper | the title over the threat |

Sides: Vesper's shots are all on the east side of him (the camera at +x, the open green), so he faces the lens. Reginald
is shot from the line to Vesper (toward Vesper), so the camera is on the same side each time. No deliberate crossings.

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| ~~Narrator~~ | ~~Bodega & Sons. Asphalt the cat bats a bottlecap off the crate.~~ | cut: described the picture; the cat and the cap are shown |
| Tansy | Stamped. Filed. Ours. | kept: the deed, one line |
| Pip | Lap of joy! Lap of joy! | kept: the gag; Pip in frame (wide track, speaker-small waived: physical gag) |
| John | Turfton FM says the Boot parked itself in the jury box. | kept: the gossip; the chorus's commentary |
| John | Asphalt says she knew. | kept: Asphalt ladder rung 1 |
| Reginald | They crashed the tribunal, sir. With a boot. | kept: the report |
| Vesper | Freeze the Black Dew. Cloverfield first. | kept: the order; no contraction, no exclamation |
| Reginald | And when the Council asks questions, sir? | new: sets up the last line |
| Vesper | Then we stop asking. | kept: the chapter's button |

Names checked: `npm run lore -- find Asphalt`, `find "Black Dew"`, `find Cloverfield`, `find "Founder"`. The Boot is
`Gnorwin Clayfoot Boot` (`founders-trim-day.md`).

## 8. Music and sound

| Time | Cue | Why |
| --- | --- | --- |
| 0.0 | `triumph` music, `street` ambience | the win, in the bay |
| 0.0 | the Combine's engine (the drive) | the arrival |
| 8.4 | `triumph` continues | the deed: the win |
| 12.5 | `turfton-dusk` (fade 1.5) begins; `knock` sfx at the cat, gain 0.3 | the soft tune for the chapter's end; the bottlecap, the barometer |
| 21.1 | `villain` music (fade 1), `villain` stinger | Vesper's arrival: once in the scene |

One stinger (`villain`), and no held silence. Vesper's motif carries the scene from 21 s to the end. The title is a
`title` step only (no stinger on the title).

## 9. Blocking and vehicles

- The Combine (`from: 'player'`, the player's ride) drives from (-122.5, 57.5) along z = 57.5 to (-150, 72) into the bay.
  The player exits to (-148, 67) (async walk). The Combine stays where the scene leaves it (the player's vehicle).
- Tansy at her mark (-143, 73), holds the ledger from her hand (`hold`).
- Pip runs a lap (-130, 72) -> (-126, 76) -> (-130, 70) -> (-134, 70) and cheers at the start.
- John at his mark (-80, 88) facing the cat; the cat prop at (-78.4, 88.4), 1.65 m from him, size 0.55.
- Vesper's mark (137, -152) facing east (+x). The camera is on the green's east side.
- Reginald's van spawns at (110, -117.5) and drives east on z = -117.5 to (150, -124); Reginald exits, then walks to
  (146, -136) to face Vesper.

## 10. The button

Vesper, alone in the frame, low, his voice slow: "Then we stop asking." The music fades and
the title comes up over him. It is a threat with no joke in it: the chapter ends on Vesper, not on the boot.

## 11. Self-check

- [x] The scene has a want (Vesper: a silent Turfton), an obstacle (the crew, the Boot) and a turn (the report: the tribunal was crashed).
- [x] The hook lands in 0 s on the Combine's arrival (the track) and the deed line; no narration first.
- [x] Every line under 16 words; the longest is "Turfton FM says the Boot parked itself in the jury box." (10 words); no coordinates; no narration (the narrator line is cut; zero narration).
- [x] Vesper: soft, complete sentences, no contractions, no exclamation marks, alone in the frame for his lines.
- [x] Every speaker framed and facing the camera for their line; reactions and the report on Reginald's MCU.
- [x] One side of the line: Vesper is always shot from the east; Reginald toward Vesper.
- [x] Music: `triumph` out at the bodega, `villain` at Vesper only; one `villain` stinger; no held silence.
- [x] Running jokes: Asphalt's "she knew" (rung 1); Vesper's threat (the chapter button); the coats and the hat ladder are not here.
- [x] Dusk: `sky: 'golden'`.
- [x] Checker: all shots pass, zero pacing faults; one waived speaker-small (Pip's lap, a physical gag, shot wide and locked off); length 55.7 s.
- [x] `direction.notes` in the scene points at this file.

## Review pass (planner)

Watched at 960x600. Vesper's two closing lines are `frame` shots (MCU, then CU, low): the old dollies held him small at mid-distance. The empty Lowrider leaving was cut; the title comes up over his face. Reginald's van track moved so the van does not pass through the lens.
