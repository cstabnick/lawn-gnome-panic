# Director's notes: `m27-heap-of-trouble-intro`

Watch it at `http://localhost:5310/?no-intro&cutscene=m27-heap-of-trouble-intro`.

| | |
| --- | --- |
| Scene | `m27-heap-of-trouble-intro` in `src/cutscene/scenes/story/m27-heap-of-trouble.ts` |
| Played by | quest `m27-heap-of-trouble` ("Heap of Trouble") as its intro, given at the Compost Heap furnace |
| Kind and length | `intro`, aim 30-60 s; now 38.4 s, no faults |
| Where, when | stage `compost-heap-furnace` (the furnace mouth and the head of the forge track); dusk, `sky: 'golden'`, `fescue` |
| Before / after | before: the Knot-Hole (row 26). After: the tail north up the Ring Road |

## 1. Purpose in the story

Introduces Ash-Shovel Ernie (L105 card) and plants act III: the plates leave the Heap at night in four directions, and nobody
tells the stoker where. Tansy wants to know. It answers nothing.

## 2. The player's feeling

- **In:** just back from the fence; a night-job feels like a change of weather.
- **Out:** curious, and a little uneasy: four vans, four ways, and one of them is theirs.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Ernie | to tell someone what he has seen | nobody tells the stoker anything | a chestnut as a full stop; repeats the last word; hums | points at the van to follow |
| Tansy (phone) | to know where the plates go | the crew's size; her rule of staying out of wars | three short clauses | gives the order |
| The player | to understand | | one question | takes the job |

## 4. Subtext

Ernie hums an old Fescue work-song and cannot find the next line: the loose thread the character note keeps (he fears
remembering the words). The cross of plates on the yard is the whole plan, left lying around.

## 5. Beat sheet

| # | Time | Beat | What happens |
| --- | --- | --- | --- |
| 1 | 0-2.6 | Hook | A loaded van pulls out of the yard, headlights sweeping the heaps |
| 2 | 2.6-9 | Ernie | "Chestnut? Tastes of petrol. Better." Intro card |
| 3 | 9-20 | The stake | "Third van tonight." "Where do they go?" "Four ways. North, south, east, west." |
| 4 | 20-22 | Insert | Four plates in a cross, the loading sheet on top |
| 5 | 22-31 | Turn | Tansy by phone: "Ernie rang the bay..." "Pick one van. Follow it north. Do not get close." |
| 6 | 31-38.4 | Button | The second van starts up; "That one. North. Hmm, hm, hm..." The track follows it out |

## 6. Shot list

Track on the first van, then `coverage('player','ernie')` singles for the exchange, `spot('compost-heap-furnace','plates')`
as the insert, a track on the second van to end. Tansy's lines play over the player and Ernie in turn (she is off screen).

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Ernie | Chestnut? Tastes of petrol. Better. | his own line from the characters note; the card lands on it |
| Ernie | Third van tonight. Plates, leaving. Hmm, hm, hm. | repeats the last word |
| Player | Where do they go? | |
| Ernie | Four ways. North, south, east, west. Nobody tells the stoker. | the stake |
| Tansy | Ernie rang the bay. I want to know where those plates go. | |
| Tansy | Pick one van. Follow it north. Do not get close. | three short clauses |
| Ernie | That one. North. Hmm, hm, hm... | the button; the tune that will not finish |

## 8. Music and sound

`fescue`; `forest` bed; radio 0.08. `engine-rev` x2, `crunch` (the chestnut), `paper` (the sheet), `phone` on Tansy's first line.

## 9. Blocking and vehicles

Ernie at (-246.2, -55) at the furnace mouth; the player at (-251, -57.8). Van A (headlights on) leaves from (-252, -43.5) by
the forge track to the west highway; van B waits at (-247, -36) and leaves under the button. The four plates in a cross at
(-243.2, -59.4); nothing is solid.

## 10. The button

The second van's taillights going out along the forge track, with Ernie's humming still in the air.

## 11. Self-check

- [x] Ernie's intro card on his first line (mcu); one card ever.
- [x] Lines under 16 words; Tansy never raises her voice; Ernie warm and gruff.
- [x] One side of the line per conversation; the off-screen voice does not break it.
- [x] Checker: no faults. `direction.notes` points here.
