# Director's notes: `diner-route-south-outro`

| | |
| --- | --- |
| Scene | `diner-route-south-outro` in `src/cutscene/scenes/story/m13-*.ts` (m13-diner-on-route-south.ts) |
| Played by | quest `m13-diner-on-route-south` (outro at Frank's outdoor counter) |
| Kind and length | `outro`, 26.3 s (aim 15-45) at Normal text speed |
| Where, when | stage `diner-rush`; dusk, sky golden |
| Before / after | after: six plates. Before: Drainpipe Court (row 14, the sincere beat) |

## 1. Purpose in the story
Frank rings the end-of-rush bell, reads the player's engine before meeting them (his intro card after his first line) and names Granny Gnertrude, the only gnome Vesper cannot buy. The coach pulls away south into the gold. This row supplies the laugh before row 14.

## 2. The player's feeling
Out: knows where to go next and who Vesper cannot buy.

## 3. Beats
Bell; "Chain pulls left. ...Nice." (card); "I hear everything on this road."; "Vesper is buying it. A block, a silo, a canal bank."; "Granny Gnertrude. Only one Vesper cannot buy."; "Why not?" / "She does not sell. She bakes."; the coach leaves.

## 4. Shots
COUNTER coverage; a push-in on the turn; a low single on the button; a wide as the coach leaves.

## 5. Music and sound
turfton-dusk, wind; bell, gulp, engine-rev.

## 6. The button
Wide: the coach leaving south, the diner behind it.

## 7. Self-check
- [x] Hook within 3 s on a sound or a character; no narration.
- [x] Every line under 16 words; no coordinates; one side of the line per conversation (`coverage`).
- [x] Voices follow bible section 2; the player's lines are short questions.
- [x] `npm run cutscene-report`: no fault; the line-of-sight check passes (scenes.test.ts).
