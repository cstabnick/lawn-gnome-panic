# Director's notes: `m29-the-kicked-board-mid`

Watch it at `?no-intro&cutscene=m29-the-kicked-board-mid`.

| | |
| --- | --- |
| Scene | `m29-the-kicked-board-mid` in `src/cutscene/scenes/story/m29-the-kicked-board.ts` |
| Played by | quest `m29-the-kicked-board` as its arrival: the visit step on the fairway |
| Kind and length | `arrival`, aim 10-35 s; now 28.0 s at Normal text speed |
| Where, when | stage `hedgeworth-ninth-fairway` (the first fairway inside the Kicked Board), day |
| Before / after | before: the player breaks the board and walks onto the course; after: the flee back through the board |

## 1. Purpose in the story

The first sight of Hedgeworth: a hush of mown grass, a sprinkler, a groundskeeper who talks to the fairway. Thrift Hosepipe shouts the player off it. Dame Peony is glimpsed on the clubhouse terrace with a driver for a cane. Thrift hides something and does not say what: a molehill pops up and ducks, and he stands in front of the place. Nobody says whose garden it is.

## 2. The player's feeling

- **In:** the board has just cracked and the player has run through.
- **Out:** the hush, the first laugh at the shout, the sense that the place is kept by someone who loves it and is hiding something.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Thrift | to keep the fairway whole and his secret quiet | the player walking on it | gruff, slow, tender to the grass | chases the player off |
| The player | to look | the shout | dry | runs |

## 4. Subtext

- "Nothing under there. Nobody lives under there" is the whole secret and the whole lie.
- Peony does not speak: a glimpse, and the bell is her only voice.

## 5. Beat sheet

| # | Beat | What happens (picture first, then words) |
| --- | --- | --- |
| 1 | Hook | a ground-level shot through the blades; Thrift murmurs to the grass; his card |
| 2 | Setup | the player steps onto the stripes; a crunch |
| 3 | Turn | "OFF! Off the damp!" "It's grass." "It is a fairway. It has a tee time." |
| 4 | Glimpse | a long lens on the terrace; a small figure, a faint bell |
| 5 | The hidden thing | a molehill rises and ducks; "Nothing under there. Nobody lives under there. Off." |
| 6 | Button | the player runs; "And mind the edges!"; a wide of the board standing open |

## 6. Shot list

A low ground-level signature shot, a long-lens (fov 14) glimpse at the clubhouse, a low insert on the molehill, `coverage('thrift','player',1)` singles; a wide of the fence to end.

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Thrift | Morning, my dear. Nobody will walk on you today. | to the grass; his card follows |
| Thrift | OFF! Off the damp! | the shout |
| Player | It's grass. | |
| Thrift | It is a fairway. It has a tee time. | |
| Thrift | Nothing under there. Nobody lives under there. Off. | the lie |
| Thrift | And mind the edges! | the button's shout |

Names and canon: `npm run lore -- find` on Juniper, Reginald, Hedda, Frank, Thrift, Peony, the Kicked Board and Hedgeworth; nothing here contradicts those entries and nothing new is named.

## 8. Music and sound

`garden` bed, no music (a hush is the signature). Foley: rustle, crunch, a faint bell for Peony, a shovel and a squeak for the mole.

## 9. Blocking and vehicles

Thrift at (-1034, 640) facing the player; the player at (-1019, 637) walks to (-1026, 638.4), then runs to (-1005, 639). The real Peony stands on the terrace; the real Thrift is at his shed (far enough to stay out of frame).

## 10. The button

The board standing open behind the running player while a groundskeeper shouts after them.

## 11. Self-check

- [x] Want, obstacle and a turn; not a briefing.
- [x] The hook lands inside 3 s on a picture or a character; no opening narration.
- [x] Every line is 16 words or fewer; nobody says what the picture shows; no coordinates or waypoint read-outs.
- [x] Voices match the character bible: gruff, slow, tender; talks to the grass in a lower voice (Thrift). His intro card follows his first line.
- [x] Coverage on one side of the line per pair; the checker reports the scene OK (`npm run cutscene-report`), no waivers.
- [x] Lit and readable: day, or `golden` for dusk and dawn.
- [x] `direction.notes` in the scene points at this file.
