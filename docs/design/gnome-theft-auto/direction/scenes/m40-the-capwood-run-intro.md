# Director's notes: `m40-the-capwood-run-intro`

Watch it at `?no-intro&cutscene=m40-the-capwood-run-intro`.

| | |
| --- | --- |
| Scene | `m40-the-capwood-run-intro` in `src/cutscene/scenes/story/m40-the-capwood-run.ts` |
| Played by | quest `m40-the-capwood-run` as its intro, given by Lugnut Lulu (giver `capwood-lulu`) |
| Kind and length | `intro`, aim 30-60 s; 40.3 s at Normal text speed |
| Where, when | stage `capwood-start-line` (the Capwood Run paddock in the Frostbite Fells); dawn (`golden` sky) |
| Before / after | before: the couch, the drain and the four parts (row 39). After: the race itself (E14's Capwood Run), then the Great Ring |

## 1. Purpose in the story

The Carburettors finally get their own scene. Lulu has been Cam's rival (rows 5, 30) and Pip's friend at the edges of
the story; here she names the cost of refusing the HOA charter (most of the club signed for the free tyres, three stayed)
and sets the price of her help: win the Run. It also plants Cam's charter and the plate he stared at, with one slump from
the player.

## 2. The player's feeling

- **In:** the crew is hiding at the edges; the player has driven north to ask for help.
- **Out:** a dare, and a team: three named rivals who will race clean and want to be beaten.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Lulu | to keep the Carburettors loud and unchartered | the HOA, and the player's friend who signed | teases, then lets the joke go and sets the dare | sets her terms; the player owes her a race |
| The player | the Carburettors | Lulu's price | short lines; a slump at Cam's name | agrees by taking the line |
| Bertha, Dunstan, Fennimore | to be introduced and to win | the player | one tic each: a nod, a wave, a cheer | the row becomes a team |

## 4. Subtext

- "Your Cam took one home" is a wound for both of them: Lulu "watches Cam with small, worried contempt".
- "The ones who stayed" is a count with a hole in it: three of forty.
- The race is not for Lulu's pride. She needs the town to see the Carburettors win with a friend.

## 5. Beat sheet

| # | Time | Beat | What happens |
| --- | --- | --- | --- |
| 1 | 0-3 | Hook | A row of headlights in the blue-gold dawn; an engine revs over a tuba; a horn; the player walks up. |
| 2 | 3-17 | Setup | "Look who climbed the mountain." "I need the Carburettors." "Everybody does. The HOA sent a charter." |
| 3 | 17-23 | The sting | "Your Cam took one home. Read my plate all night, once." The player's slump. |
| 4 | 23-29 | Turn | "I do not sign. I race. Win the Capwood Run, and the Carburettors are yours." |
| 5 | 29-37 | The row | Three singles: Bertha, Dunstan, Fennimore. "The ones who stayed. Mind the fords, and do not bruise the caps." |
| 6 | 37-40 | Button | Four horns and a tuba; the row of cars catching the first sun. |

## 6. Shot list

| # | Shot | On | Motivation |
| --- | --- | --- | --- |
| 1 | cut, stage `wide` | the row of cars at the line | place |
| 2-6 | mcu singles on `coverage('lulu','player',1)`, Lulu low | Lulu / the player | the exchange; she is the stronger party |
| 7 | mcu, reaction | the player | the slump at Cam's name |
| 8 | push-in mcu, low | Lulu | the dare |
| 9 | cut, stage `row` | the Carburettors along the line | the row, from the west end |
| 10-12 | mcu singles | Bertha, Dunstan, Fennimore | one beat each |
| 13 | cut, stage `hood` | Lulu in front of her car from the grid | the button |

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Lulu | Look who climbed the mountain. Hat on straight and everything. | teasing |
| Player | I need the Carburettors. | |
| Lulu | Everybody needs the Carburettors. The HOA sent a charter. Beige paper, one line. | |
| Lulu | Your Cam took one home. Read my plate all night, once. | the row 5 plant |
| Lulu | I do not sign. I race. Win the Capwood Run, and the Carburettors are yours. | the objective, in her voice |
| Bertha | Bertha. Thirty years on this road. | |
| Dunstan | Dunstan! Sorry about the mud, in advance. | |
| Fennimore | Fennimore! Youngest! Loudest! | |
| Lulu | The ones who stayed. Mind the fords, and do not bruise the caps. | plants the outro's fine |

## 8. Music and sound

| Time | Cue | Why |
| --- | --- | --- |
| 0 | music `turfton`, ambience `wind` | lively, outdoors |
| 1-2 | `engine-rev`; a horn | the hook |
| 30 | `engine-rev` | the row |
| 38 | four horns and the `triumph` stinger | the button |

## 9. Blocking and vehicles

Lulu leans on the nose of her lowrider at (85.4, -762.2), facing the grid. The three rivals stand at their cars in a
row 8 m behind her (z -754.4); the cars face the road. The player walks up from the grid to a pace in front of her.
Cutscene-only cars and two pennants (L95): the row of cars at dawn is the picture.

## 10. The button

Four horns, a boom box's tuba, and a row of cars catching the first sun.

## 11. Self-check

- [x] Want, obstacle, turn; the objective is said in the turn, in her voice.
- [x] Hook by 3 s on a picture; every line under 16 words.
- [x] One side of the line; the player's reaction is a slump, once.
- [x] Lulu sounds like Lulu: short, easy, a laugh that comes early (the laugh is saved for the outro).
- [x] `npm run cutscene-report`: OK.
