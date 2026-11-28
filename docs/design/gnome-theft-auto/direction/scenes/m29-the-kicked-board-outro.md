# Director's notes: `m29-the-kicked-board-outro`

Watch it at `?no-intro&cutscene=m29-the-kicked-board-outro`.

| | |
| --- | --- |
| Scene | `m29-the-kicked-board-outro` in `src/cutscene/scenes/story/m29-the-kicked-board.ts` |
| Played by | quest `m29-the-kicked-board` as its outro, back at the sign |
| Kind and length | `outro`, aim 15-45 s; now 22.5 s at Normal text speed |
| Where, when | stage `frank-sign-road`, day, `sky: 'noon'` |
| Before / after | before: the flee and the long road home; after: the CONTRACT COMPLETE banner |

## 1. Purpose in the story

The report, and one plant: "Golf stops for tea. That did not stop." (the Combine's cutting-deck test, unnamed). Frank keeps the ball (a bucket at the foot of his sign). The Kicked Board stays broken and the course stays open for the golf side quests.

## 2. The player's feeling

- **In:** a long drive, a shout, a clean escape.
- **Out:** the dry laugh at Frank keeping the ball and a sliver of unease about the tea.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Frank | his ball and his answer | none; he is calm | slow drawl | keeps the ball |
| The player | to report | Frank's economy | short | is told it is nothing to do with them |

## 4. Subtext

- "Golf stops for tea" is Frank's fear in his own register: a silence that does not come.
- "It is mine" ends the question of returning it.

## 5. Beat sheet

| # | Beat | What happens (picture first, then words) |
| --- | --- | --- |
| 1 | Hook | Frank looks at the ball, not the road; an engine in the distance |
| 2 | Setup | "Heard you coming back. Hedge in the grille. ...Nice." "It's a golf course. Nine holes." |
| 3 | Turn | "Golf stops for tea. That did not stop." |
| 4 | Button | "It landed in my road. It is mine." The bucket clinks; a tock far to the west. |

## 6. Shot list

`coverage('frank','player',1)` singles, one push-in on the tea line, a wide at the end.

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Frank | Heard you coming back. Hedge in the grille. ...Nice. | |
| Player | It's a golf course. Nine holes. | |
| Frank | Nine. And a man shouted at you about grass. | |
| Frank | Golf stops for tea. That did not stop. | |
| Player | Should I take the ball back? | |
| Frank | It landed in my road. It is mine. | |

Names and canon: `npm run lore -- find` on Juniper, Reginald, Hedda, Frank, Thrift, Peony, the Kicked Board and Hedgeworth; nothing here contradicts those entries and nothing new is named.

## 8. Music and sound

`turfton` music, `wind` ambience. Foley: an engine, a clink into the bucket, a distant thud for the last tock.

## 9. Blocking and vehicles

Frank at the sign (-7.7, 259.4) holding the ball; he walks to the bucket at (-9.9, 262.2) on his last line; the player at (1.8, 262.6).

## 10. The button

The bucket's clink and a faint tock a long way west: the gap in the fence is still open and something is still hitting.

## 11. Self-check

- [x] Want, obstacle and a turn; not a briefing.
- [x] The hook lands inside 3 s on a picture or a character; no opening narration.
- [x] Every line is 16 words or fewer; nobody says what the picture shows; no coordinates or waypoint read-outs.
- [x] Voices match the character bible: slow drawl, grass blade, an appreciative grunt (Frank). No card: he has one from row 13.
- [x] Coverage on one side of the line per pair; the checker reports the scene OK (`npm run cutscene-report`), no waivers.
- [x] Lit and readable: day, or `golden` for dusk and dawn.
- [x] `direction.notes` in the scene points at this file.
