# Director's notes: `diner-route-south-mid`

| | |
| --- | --- |
| Scene | `diner-route-south-mid` in `src/cutscene/scenes/story/m13-*.ts` (m13-diner-on-route-south.ts) |
| Played by | quest `m13-diner-on-route-south` (arrival at the diner) |
| Kind and length | `arrival`, 21.5 s (aim 10-35) at Normal text speed |
| Where, when | stage `diner-rush`; noon rush, sky noon |
| Before / after | after: Frank's sign. Before: six plates |

## 1. Purpose in the story
The noon coach rolls in, the pass bell goes, and Sage Ladle (intro card after her first line) pays the fryer debt in plates and hands over a tray. The forty breakfasts pay off. Cutscene-only (L95): the coach arriving.

## 2. The player's feeling
Out: knows the job: six tables, mind the soup.

## 3. Beats
Coach down the highway; horn; bell; "Do not eat the garnish. It is decorative." (card); "Tansy owes me forty breakfasts, love. I pay in plates."; tray; "Six tables. Mind the soup."

## 4. Shots
A wide of the coach, then DOOR coverage mcus, a shrug reaction, a push-in on the order.

## 5. Music and sound
warm, wind; engine-rev, bell, clink, horn x2.

## 6. The button
The player with the tray, ms, and a coach horn.

## 7. Self-check
- [x] Hook within 3 s on a sound or a character; no narration.
- [x] Every line under 16 words; no coordinates; one side of the line per conversation (`coverage`).
- [x] Voices follow bible section 2; the player's lines are short questions.
- [x] `npm run cutscene-report`: no fault; the line-of-sight check passes (scenes.test.ts).
