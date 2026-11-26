# Director's notes: `m52-the-test-cut-p2-intro`

| | |
| --- | --- |
| Scene | `m52-the-test-cut-p2-intro` in `src/cutscene/scenes/story/m52-the-test-cut.ts` |
| Played by | quest `m52-the-test-cut-p2` (Mow Line) as its intro |
| Kind and length | `intro`, aim 30-60 s; 32.9 s |
| Where, when | stage `m52-ninth-test` (the ninth green), dusk, `sky: 'golden'` |
| Before / after | p1 mid (Vesper: "Thank you, caddy") / drive Tumblesoil's family to the Burrow Door |

## 1. Purpose in the story

The machine wakes. The first time the Grand Combine is seen at Hedgeworth: its crown and its cutting deck rising behind
the hedge's tail, on the line of little flags. Peony starts giving orders against Vesper's machine (tenant to ally), and
the Burrowfolk's "moles first" sets the evacuation order (L58).

## 2. The player's feeling

- **In:** a comic gala, a cold dismissal.
- **Out:** dread, and a clear job: moles first, then the rest.

## 3. Characters

| Character | Objective | Obstacle | Tactic(s) | Change |
| --- | --- | --- | --- | --- |
| Thrift | keep the grass calm | the ground is shaking | talks to the grass, lower voice | refuses to leave a green that is "theirs" |
| Tumblesoil | get her family out first | gnomes decide things | formal, gentle, "if it pleases the Hall" | asks, and is answered |
| Basil | understand | the flags | states it | drops his club |
| Peony | get her people off the green | Thrift | orders | agrees: moles first |

## 4. Subtext

Thrift's fear (an even cut) is arriving. Peony's "Moles first" is the first time she gives way to anyone at Hedgeworth.

## 5. Beat sheet

| # | Time | Beat | What happens |
| --- | --- | --- | --- |
| 1 | 0-3 | Hook | ground level through the blades: the moles' teacup rattles by the hole; Thrift hushes it |
| 2 | 3-8 | Setup | "That is not the gala, dear one." |
| 3 | 8-17 | Turn | a harder tremor; everyone turns west; music out; the hedge's tail against the dusk; a long engine note; Peony's face; the same view: the Combine is there |
| 4 | 17-30 | Orders | Basil: the flags run across the ninth; Peony: off my green; Thrift: it is theirs; Tumblesoil: moles first; Peony: moles first, fetch a cart |
| 5 | 30-33 | Button | low, alone: the machine over the hedge's tail, discs turning, `villain` |

## 6. Shot list

Moles at their own eye height (batch-3 notes 6.5): Tumblesoil's singles are eye level for her scale.
`coverage(tumblesoil, thrift, 1)` and `coverage(peony, thrift, -1)`. The reveal is two matched long-lens cuts on the same
view, before and after (the machine is moved between cuts, never in a shot). Ends low and alone on the machine.

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Thrift | Hush now. It is only the gala. | to the grass |
| Tumblesoil | That is not the gala, dear one. | |
| Basil | The little flags, ma'am. They run straight across the ninth. | he works it out |
| Peony | Basil. Thrift. Off my green. | |
| Thrift | It is not your green, ma'am. It is theirs. | the moles |
| Tumblesoil | Moles first, if it pleases the Hall. Then the rest. | outline comms 2 |
| Peony | ...Moles first. Fetch a cart, my dear. Quickly. | the objective in the button |

## 8. Music and sound

Bed `garden`; `clink` and `clatter` (the teacup), two `shake`s; music out before the reveal; `engine-rev` far, then
near; `reveal` stinger on the picture; `villain` music on the last shot (his machine).

## 9. Blocking

Thrift kneeling by the hole, Tumblesoil at the green's west edge with five pups, Peony at the top of the green, Basil by
the pin, the player by the shed side (the quest's pickup is beside them). Combine prop spawned at the line's start
behind the hedge's south end.

## 10. The button

The machine low and alone over the hedge's tail, its brass discs turning: the threat, not a face.

## 11. Self-check

- [x] Hook by 3 s. - [x] The reveal is on the picture, the line comes after. - [x] Lines under 16. - [x] Two stingers
at most (one). - [x] `npm run cutscene-report`: OK.
