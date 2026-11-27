# Director's notes: `four-taps-intro`

| | |
| --- | --- |
| Scene | `four-taps-intro` in `src/cutscene/scenes/story/m63-four-taps.ts` |
| Played by | quest `m63-four-taps` (Four Taps), as its intro at the Mulch Club |
| Kind and length | `intro`, aim 30-60 s; about 44 s at Normal text speed |
| Where, when | stage `mulch-club-door` (the side door of row 11), noon (`sky: noon`) |
| Before / after | before: Cam is out of the lockup (row 62); after: the drive west to Pardonlin |

## 1. Purpose in the story

Big Lou lets the player in, and the Don taps four times, in slow time, which nobody has seen (one mower, two acorns, three crack a hat, four the war). The price of the Club's crews and money is the Mayor's signature, and the Mayor has sent a postcard from Pardonlin (R-234). The objective sits in the button, in Lou's voice.

## 2. The player's feeling

- **In:** back at a door last passed in row 11, with a coalition half built.
- **Out:** the Don has joined the war; a Mayor to fetch from a place the HOA cannot reach.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Big Lou | to keep every hat dry and in order | the Don's fourth tap, never heard before | arms crossed, one word at a time | flinches for the first time |
| Don Compost | to buy a signature with a war | silence (R-025) | taps | taps four |
| The player | to learn the price | none | short questions | takes the postcard job |

## 4. Subtext

- Lou's "Hat. ...Dry." is row 11's greeting paid back.
- The Don never speaks: the room's fear is the menace.

## 5. Beat sheet

| # | Beat | What happens (picture first, then words) |
| --- | --- | --- |
| 1 | Hook | Lou, low and wide, arms crossed; the player's boots come into frame. |
| 2 | Setup | "Hat." "Dry." He steps aside a quarter-turn at a time. |
| 3 | Turn | Music out. Push-in on the Don; three taps, a long gap, the fourth lands on Lou, who flinches. |
| 4 | Price | Crews, money, the Mayor's signature in ink. |
| 5 | Button | The postcard, "Weather fine. Coffee pending." The address, the order, one last tap. |

## 6. Shot list

Coverage on `coverage('lou','player',1)` throughout; one slow `pushIn` on the Don for the taps (6.4 s).

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Lou | Hat. | greeting |
| Player | Dry. | |
| Lou | ...Dry. Back door. Don is waiting. | |
| Lou | ...Four. Nobody has seen four. | the flinch |
| Player | What is four? | |
| Lou | War. Club lends everything. Crews. Money. | |
| Player | Price? | |
| Lou | Mayor signs the counter-order. In ink. | |
| Player | Where is the Mayor? | |
| Lou | Postcard. "Weather fine. Coffee pending." | the gag |
| Player | Where from? | |
| Lou | Cafe Pardon. West, past the Wickets. Bring him dry. | the objective |

## 8. Music and sound

`heist` music, `street` bed; music out for the taps (held silence), `knock` for each tap, `danger` stinger on the fourth, `cloth` for the postcard, `crunch` for boots.

## 9. Blocking and vehicles

Lou at (-13.4,-30.6), then aside at (-16.1,-33.0); the Don in the doorway at (-17.5,-30); the player walks in from (-7.6,-30.2) to (-12.6,-30.4).

## 10. The button

The Don's last single tap after the address, held on his face: he has said all he is going to say.

## 11. Self-check

- [x] Want, obstacle and a turn; not a briefing.
- [x] Hook inside 3 s, opening on a picture.
- [x] Every line 16 words or fewer; no coordinates read out.
- [x] Each character in their own voice (bible section 2, characters.md).
- [x] Speakers MCU or closer, facing the lens; one side of the line per exchange.
- [x] Running jokes climb a rung (see section 1).
- [x] `npm run cutscene-report` shows the scene OK; line of sight passes.
- [x] `direction.notes` points here.
