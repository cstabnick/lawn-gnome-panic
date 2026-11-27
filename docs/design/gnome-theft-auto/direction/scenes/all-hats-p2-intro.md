# Director's notes: `all-hats-p2-intro`

| | |
| --- | --- |
| Scene | `all-hats-p2-intro` in `games/gnome-theft-auto/src/cutscene/scenes/story/m64a-all-hats.ts` |
| Played by | quest `m64-all-hats-p2` (By Air) as its intro |
| Kind and length | `intro`, aim 30-60 s; 57 s |
| Where, when | stages `m64a-overlook-rail` (open and close) and `m64a-airfield-line` (the apron), noon |
| Before / after | before: p1 outro; after: the drive east to the apron (the player is never on the apron, so they stay at the overlook) |

## 1. Purpose in the story

The outline's comedy beat: Hogweed's ratios against Wally's "just fly it". Plants R-234: the beacon on the Bobble, the highest ground and the only range the HOA never named, lit at dawn on the longest day. The Dewdrop ladder's #64 p2 rung: it rolls past ahead of the Underspanners. Hogweed goes ahead by road (Velma counts him later).

## 2. The player's feeling

- **In:** water done, a call on the radio.
- **Out:** what the beacon is for and why the Bobble; a stall speed is the password.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Hogweed | to be right, with ratios | Wally | three ideas at once, a blackboard | goes up by road |
| Wally | to fly | ratios | stall speeds as comfort | asks for the kid |
| Tansy | to send help | | one word | |

## 4. Subtext

- Wally and Hogweed respect each other (the rig in #56, the flares in #55); the argument is a friendship.

## 5. Beat sheet

| # | Time | Beat | What happens |
| --- | --- | --- | --- |
| 1 | 0-7 | Hook | Tansy, radio static: "The Queen's in." "And air?" "Air is arguing." |
| 2 | 7-30 | Setup | The Hedge-Hopper, the board, point-four; just fly it; the Bobble, never named; the beacon. |
| 3 | 30-40 | Turn | The Dewdrop rolls between them. "That isn't a plane." "That isn't anything." |
| 4 | 40-52 | Turn | Hogweed off by road in the Barrow Buggy. Wally on the radio. |
| 5 | 52-57 | Button | Tansy: "Twenty-two." |

## 6. Shot list

`coverage(tansy, player, -1)` at the overlook; stage `wide` at the apron; `coverage(hogweed, wally, 1)` singles; a fixed insert on the chalk board; `pushIn` on the beacon line; `track` shots for the Dewdrop and the buggy; Wally straight-on for the radio line.

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Tansy | The Queen's in. Water's done. | previously |
| You | And air? | |
| Tansy | Air is arguing. | |
| Hogweed | Point-four of a turn! The ratios say point-four! Look at them! | |
| Wally | Stall speed's twenty-two, kid. Just fly it. | his tic |
| Hogweed | Fly it where, Wally? The Bobble is the highest ground in the yard! | R-234 |
| Wally | Highest, and never named. The HOA forgot it. | |
| Hogweed | Nobody can ban it! A beacon on top, lit at dawn on the longest day! | |
| Wally | Then just fly it up there. | |
| Hogweed | With RATIOS! | |
| Hogweed | Ignore that. That isn't a plane. | |
| Wally | That isn't anything. | |
| Hogweed | I am going up by road to build the fire. Roads have ratios. | |
| Wally | Tansy. Send the kid. And a stall speed. | |
| Tansy | Twenty-two. | button |

## 8. Music and sound

`wind` bed, `turfton`. Sfx: `static` three times, `clatter`, `squeak` (chalk, Dewdrop), `engine-rev`. No stinger.

## 9. Blocking and vehicles

Overlook: Tansy and the player on their rail marks. Apron: Wally (451.8, -79.2) and Hogweed (458.4, -79.6) either side of the Hedge-Hopper's nose (455, -84), the board at (461, -81.6), two Underspanners. The Dewdrop runs along z -78; the buggy goes down the spur. All aircraft cutscene-only, clear of the two live Crop Dusters (x 415 and 440).

## 10. The button

Tansy's one word: the stall speed, the password, the go.

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
