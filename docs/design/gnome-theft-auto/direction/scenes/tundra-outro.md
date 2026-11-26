# Director's notes: `tundra-outro`

| | |
| --- | --- |
| Scene | `tundra-outro` in `src/cutscene/scenes/story/ch3c.ts` |
| Played by | quest `ch3-tundra-drift-run` (story row 53) as its outro, at the Dust Flats Overlook (stage `dust-safehouse`) |
| Kind and length | `chapter-close`, aim 40-80 s; 39.7 s at Normal text speed, no faults |
| Where, when | stage `dust-safehouse` (the overlook, the map table, the ridge); night, `sky: 'night'` |
| Before / after | before: the spotters cracked. After: act IV (row 54, `m54-the-heist-board`) at this same overlook |

## 1. Purpose in the story

Act III ends on cold air, not on the threat. The overlook is dark but for one lamp over the map table. Pip, steadier,
carries the Stone the last metres in both hands and sets it down whole. Tansy calls from the ridge above: the Combine
cannot be outdriven or outdug, it needs air power, and the air is at Fort Sandpit (it has a Whirligig). The old hug and
the Combine-on-the-horizon cut are gone: Tansy is back in the crew since the Test Cut, and the threat was already shown
in row 52. The title closes chapter 3.

## 2. The player's feeling

- **In:** the Stone delivered, the spotters gone, the night quiet.
- **Out:** a way forward that is up and east, and the sense that the crew has stopped running.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Pip | to deliver the Stone unbroken | his own hands | counting, then pride | wants the plan |
| Tansy | to turn the crew's eyes up and east | the crew thinks in roads | dry commands from above | sets the next act |
| The player | to ask the question | none | "Where do we get air?" | none |

## 4. Subtext

- "Both hands. Didn't drop it once." is Pip counting his own recovery.
- Tansy calls instead of coming down: she is already one step ahead of the others.

## 5. Beat sheet

| # | Time | Beat | What happens (picture first, then words) |
| --- | --- | --- | --- |
| 1 | 0-8 | Hook | One lamp over the map table; Pip walks the Stone in |
| 2 | 8-18 | Setup | He sets it down, turns: "Level, level, whole!"; the player's "You carried it well." |
| 3 | 18-28 | Turn | Everyone looks up; Tansy on the ridge: "Come up", "air power", the fort |
| 4 | 28-34 | Button | Pip points at the fort: "Then we don't drive." A pause |
| 5 | 34-40 | Title | The lamp, the Stone beneath it, END OF CHAPTER 3 |

## 6. Shot list

High wide from the dust side (lamp in the middle ground); Pip and the player in `coverage('pip', 'player', -1)` mcu
singles; a low ms of Tansy on the rim; Tansy and the player in `coverage('tansy', 'player', 1)` for the plan; Tansy low
mcu looking east; Pip ms pointing; the final close on lamp and table.

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Pip | Level, level, whole! Not a chip. Bracken gets it back with a bow on. | the delivery |
| Player | You carried it well. | |
| Pip | Both hands. Didn't drop it once. | |
| Tansy | Stone's here? Good. Now come up. Both of you. | the ridge call |
| Tansy | We can't outdrive that. We can't outdig it either. We need air power. | |
| Player | Where do we get air? | |
| Tansy | East. The Dust Flats. Fort Sandpit has a Whirligig. | the line moved from row 36 |
| Pip | Then we don't drive. | kept from the old scene |

## 8. Music and sound

| Time | Cue | Why |
| --- | --- | --- |
| 0 | wind bed, `warm`; crunch of Pip's steps | the dust at night |
| 8 | thud, the Stone on the table | landed whole |
| 17 | whoosh of wind | they look up |
| 37 | a lamp creak under the title | the last sound |

## 9. Blocking and vehicles

Pip enters from the east, the player stands at the table, Tansy stands on the ridge north of the camp. The lamp stands
by the table. The Zero-Turn stays where the player left it. The player ends at the table.

## 10. The button

The lamp over the Stone and the title. The right last image: a small light, and a thing kept whole.

## 11. Self-check

- [x] The scene has a want, an obstacle and a turn; the hook is the lamp, not narration.
- [x] Every line is under 16 words; no speaker is framed from behind.
- [x] `npm run cutscene-report` shows the scene OK.
- [x] `direction.notes` in the scene points at this file.
