# Director's notes: `tundra-intro`

| | |
| --- | --- |
| Scene | `tundra-intro` in `src/cutscene/scenes/story/ch3c.ts` |
| Played by | quest `ch3-tundra-drift-run` ("Volatile on Ice", story row 53) as its intro, given at the Frozen Birdbath Basin |
| Kind and length | `intro`, aim 30-60 s; 38.0 s at Normal text speed, no faults |
| Where, when | stage `birdbath-basin` (the parked ice-packed Zero-Turn); dusk, `sky: 'golden'` |
| Before / after | before: the Test Cut and the night the longest day was named (row 52). After: the drive east across the Ring Road with the Stone; then `tundra-outro` |

## 1. Purpose in the story

The Previously, in one breath (the Combine cut its test line, Vesper named the day), and one sincere beat: Elder Bracken
lends the Stopping Stone. Lent, not given. The only thing that ever stopped one of the machines goes into a Zero-Turn
seat, and Bracken says so in words. Pip, steadier with his glued arm, is told to "hold the arm level": the elder who
shamed him in Mossy Wood now trusts him with a sentence. No jokes near Bracken; the horn gag comes after, and Bracken
does not blink.

## 2. The player's feeling

- **In:** the worst night in the story, still in the legs.
- **Out:** carrying something that is not theirs. The job is careful, not fast.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Elder Bracken | to lend the Stone and know it comes back | the Stone is all his people have kept | short statements, no softening | trusts Pip with one line |
| Father Loam | to send them off steadied | the day Vesper named | a blessing | none |
| Pip | to be trusted with something | the old shame in front of Bracken | "Yes, Elder." | stands up |
| The player | to take the load | none | a flat promise | none |

## 4. Subtext

- "One. Nothing since." is Bracken saying the Stone is a promise, not a weapon.
- "Hold the arm level" is Bracken forgiving Pip without using the word.

## 5. Beat sheet

| # | Time | Beat | What happens (picture first, then words) |
| --- | --- | --- | --- |
| 1 | 0-6 | Hook | Bracken carries the Stone across the basin ice, slow |
| 2 | 6-13 | Previously | Loam: the cut line, the named day |
| 3 | 13-18 | Loading | The Stone goes into the seat; a thud, a creak; Loam bows |
| 4 | 18-30 | Turn | "I lend it. I do not give it." The player's promise; Bracken's nod |
| 5 | 30-38 | Button | Bracken to Pip; Loam's blessing; Pip honks; Bracken does not blink |

## 6. Shot list

Arrival wide, then a high insert of the loading from the mower's far side; Bracken low mcu (`coverage('bracken',
'player', 1)`), the player's reaction mcu held a pause; Bracken to Pip in `coverage('bracken', 'pip', -1)`; Loam mcu;
Pip ms for the horn; Bracken mcu held, unmoved.

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Loam | The Combine cut its line through Hedgeworth. Vesper has named the day. | the Previously |
| Bracken | This Stone stopped one machine. One. Nothing since. | |
| Bracken | I lend it. I do not give it. Bring it back uncracked. | |
| Player | Uncracked. I will. | |
| Bracken | Potsworth. Hold the arm level, and the load will follow. | |
| Pip | Level. Yes, Elder. | |
| Loam | Go with the Kiln, and keep the ice under you. | |

## 8. Music and sound

| Time | Cue | Why |
| --- | --- | --- |
| 0 | wind bed, `frost`; crunch of Bracken's boots | the ice |
| 15 | thud and creak on the mower | the Stone lands |
| 36 | the Zero-Turn horn | the only joke |

## 9. Blocking and vehicles

Mower parked at the basin mark. Bracken walks in from the west to the mower's west side, Loam stands east of it, Pip
sits on the bench mark, the player arrives from the south. A salt-sack is roped by the seat; the Stone settles in the
seat. The player ends one step from the mower, facing it.

## 10. The button

Bracken's face after the horn: nothing moves. The right last moment: the solemn man does not join the joke and does
not stop it either.

## 11. Self-check

- [x] The Previously is in the first beat; Bracken has no joke.
- [x] Every line is under 16 words.
- [x] One side of the line per conversation.
- [x] `npm run cutscene-report` shows the scene OK.
- [x] `direction.notes` in the scene points at this file.
