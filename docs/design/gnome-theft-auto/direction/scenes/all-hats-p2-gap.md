# Director's notes: `all-hats-p2-gap`

| | |
| --- | --- |
| Scene | `all-hats-p2-gap` in `games/gnome-theft-auto/src/cutscene/scenes/story/m64a-all-hats.ts` |
| Played by | quest `m64-all-hats-p2`, beat on step 3 (as the flight home starts, after the kit drop) |
| Kind and length | `arrival`, aim 10-35 s; 33 s |
| Where, when | stages `m64a-brim-gap` (the Top Hat lookout) and `m64a-bobble-summit`, noon |
| Before / after | before: the flight to the Bobble; after: the flight back to the overlook |

## 1. Purpose in the story

R-232 and R-234 on screen: Velma Crown (intro card, her first story appearance) counts every car, and counts the Crop Duster. The kit comes down under Hogweed's parachute ("almost certainly", #56/#57: it opened), and the beacon (`hatbrim-beacon`, cutscene-only) goes up on the top of the yard.

## 2. The player's feeling

- **In:** a flight north and a drop.
- **Out:** the beacon is there, waiting for the longest day; Velma's card is honest.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Velma | to keep the count honest | a car that flies | counting | counts it |
| Hogweed | to be proved right | gravity | joy | is |
| Wally | to fly | | calm | |

## 4. Subtext

- The count is the only honest figure about the Pass (R-232); counting a plane is integrity, not a mistake.

## 5. Beat sheet

| # | Time | Beat | What happens |
| --- | --- | --- | --- |
| 1 | 0-3 | Hook | The saddle, the café, a cup; an engine drone. |
| 2 | 3-10 | Setup | "Cars today: three." Velma's card. |
| 3 | 10-16 | Turn | The plane over the gap; she looks up: "Cars today: four." |
| 4 | 16-29 | Drop | Wally: kit away. Summit: chute and crate land; "It opened!"; the beacon goes up. |
| 5 | 29-33 | Button | "Cars: four. Fires: one. Both honest." |

## 6. Shot list

Stage `wide` (gap), Velma MCU (eye, then low), stage `sky`, Wally MS in the plane, stage `wide` (summit), Hogweed MCU and MS, Velma MCU low for the button.

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Velma | Cars today: three. | card follows |
| Velma | Cars today: four. | the gag |
| Wally | Over the summit, kid. Kit away. Do not look, it only worries it. | |
| Hogweed | It opened! I said almost certainly! Almost is a kind of certainly! | #56 thread |
| Hogweed | Lit at dawn on the longest day. Not one minute sooner. Ratios. | R-234 |
| Velma | Cars: four. Fires: one. Both honest. | her plaque, "(Both honest.)" |

## 8. Music and sound

`wind` bed, `turfton`. Sfx: `clink`, `whoosh`, `paper` twice, `latch`, `thud`, `flutter`, `clatter`. Only the intro card's own stinger.

## 9. Blocking and vehicles

Velma at the coin telescope (693.6, -1550.4): the ambient resident Velma (brimGapPlan.ts) sweeps by the café door about 7 m away, out of these frames. Hogweed on the summit (695.6, -1685.4); the kit at (694, -1683) and the beacon at (697.4, -1688.4), clear of the cairn and the Summit Register. The plane flies from (701, 128, -1470) to (688, 134, -1760) with the player and Wally seated.

## 10. The button

Velma's honest card: four cars, one fire. The fire is not lit yet; it only glows.

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
