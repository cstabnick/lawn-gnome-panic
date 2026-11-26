# Director's notes: `m29-the-kicked-board-intro`

Watch it at `?no-intro&cutscene=m29-the-kicked-board-intro`.

| | |
| --- | --- |
| Scene | `m29-the-kicked-board-intro` in `src/cutscene/scenes/story/m29-the-kicked-board.ts` |
| Played by | quest `m29-the-kicked-board` as its intro, given by Frank at his sign |
| Kind and length | `intro`, aim 30-60 s; now 32.4 s at Normal text speed |
| Where, when | stage `frank-sign-road` (Frank's welcome sign on Route South), dawn, `sky: 'golden'` |
| Before / after | before: the sibling rivalry's laugh; after: the fence road drive |

## 1. Purpose in the story

The balls from over the fence: the first rung of the Combine's cutting-deck thread ("nobody golfs like a clock", the test is already under way). Frank reviews a golf ball the way he reviews an engine. He says the fence has another gap and a sign that says no; he stays at his sign.

## 2. The player's feeling

- **In:** the player has come from downtown; the road is quiet.
- **Out:** curious, sure of the errand (find the loose board in the fence west of Tallgrass Commons) and faintly uneasy about the clock.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Frank | quiet; to know who is hitting the balls | he stays at his sign | slow drawl, an engine-reviewer's ear | sends the player |
| The player | to know where they come from | Frank's slowness | short questions | takes the job |

## 4. Subtext

- Frank hears the board in the wind, and has not gone to it for years. "I stay at my sign" is the sign talking.
- Nobody is told whose garden it is.

## 5. Beat sheet

| # | Beat | What happens (picture first, then words) |
| --- | --- | --- |
| 1 | Hook | ground level on the empty road: a hiss, the ball bounces three times |
| 2 | Setup | "Fourth since sunrise." "Two-piece. Soft cover. Expensive. ...Nice." |
| 3 | Turn | where from; "Same angle. Same gap. Nobody golfs like a clock." |
| 4 | Errand | "I stay at my sign." The loose board; "I will find it." |
| 5 | Button | a second ball lands on the first; "...Nice." |

## 6. Shot list

Ground-level insert for the ball, then `coverage('frank','player',-1)` singles with one ms low on the clock line and a push-in on the board line.

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Frank | Fourth since sunrise. | |
| Frank | Two-piece. Soft cover. Expensive. ...Nice. | his engine review, applied to a ball |
| Player | Where are they coming from? | |
| Frank | Over the fence. West, past Tallgrass Commons. | one place name |
| Frank | Same angle. Same gap. Nobody golfs like a clock. | the plant |
| Player | Why not go and look? | |
| Frank | I stay at my sign. That is the arrangement. | |
| Frank | A board is loose in that fence. A sign says no. It is wrong. | lore: the sign has been wrong for years |
| Player | I will find it. | |
| Frank | ...Nice. | the button |

Names and canon: `npm run lore -- find` on Juniper, Reginald, Hedda, Frank, Thrift, Peony, the Kicked Board and Hedgeworth; nothing here contradicts those entries and nothing new is named.

## 8. Music and sound

`warm` music, `wind` ambience. Foley and sfx: a whoosh, taps for each bounce (three decreasing), cloth, the second ball's taps.

## 9. Blocking and vehicles

Frank leans on the sign at (-7.7, 259.4) facing east; the player at (1.8, 262.6); the ball lands at (-2.5, 263.6) in the middle of the road. The second ball lands on the first.

## 10. The button

The second ball lands exactly on the first, and Frank approves. It is the joke and the threat at once.

## 11. Self-check

- [x] Want, obstacle and a turn; not a briefing.
- [x] The hook lands inside 3 s on a picture or a character; no opening narration.
- [x] Every line is 16 words or fewer; nobody says what the picture shows; no coordinates or waypoint read-outs.
- [x] Voices match the character bible: slow drawl, a grass blade, an appreciative grunt after naming a model (Frank). He has his intro card from row 13, so none here.
- [x] Coverage on one side of the line per pair; the checker reports the scene OK (`npm run cutscene-report`), no waivers.
- [x] Lit and readable: day, or `golden` for dusk and dawn.
- [x] `direction.notes` in the scene points at this file.
