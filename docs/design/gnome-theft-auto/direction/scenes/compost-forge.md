# Director's notes: `compost-forge`

Watch it at `http://localhost:5310/?no-intro&cutscene=compost-forge`.

| | |
| --- | --- |
| Scene | `compost-forge` in `src/cutscene/scenes/story/ch2c.ts` |
| Played by | quest `ch2-unmowed-tablet` as its visit objective ("Scout the Compost Heap armor forge", at (-255, -60), radius 14, `scene: 'compost-forge'`) |
| Kind and length | `arrival`, aim 10-35 s, fault above 45; now 21.1 s (was 30.2 s, 5 faults: two narrator lines describing the forge, two dead shots, a line crossing) |
| Where, when | stage `compost-heap` (the forge at night, the furnace glow); `sky` left as the stage's own lighting, which the checker accepts |
| Before / after | before: the player's approach down the west highway and the forge track. After: the player is crouched at the heap, and the quest's next objective (the tablet, the armor rig) takes over |

## 1. Purpose in the story

Show the Grand Combine's armour being made, with the HOA welders as the voices of it, so the player learns what the
forge is for without a narrator. Ernie is the comic relief in the middle of it (his chestnuts). The reveal is the
plates themselves; Vesper's name is said once ("HIM"), so the villain comes in as a dread, not a label. Lore:
`docs/lore/rulings.md` R-072: the armour plates are riveted by HOA welders at the Compost Heap forge, scratch-proof
on Vesper's orders, while Ash-Shovel Ernie stokes the furnace and minds his own chestnuts.

## 2. The player's feeling

- **In:** just came through the forest on foot, unseen so far, a little on edge.
- **Out:** a jolt (the plates are real, not a lawnmower), a laugh (Ernie, the scratch-proof joke), and a clear
  unease: "HIM" wants it scratch-proof.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Ash-Shovel Ernie | to roast his chestnuts | the furnace; nobody asks | the granddad anecdote | none; he stays busy with his chestnuts |
| HOA Welder 1 | to get the thirty plates done by Friday | the deadline; the Glazier | bluster, the order | sends the message: "Tell HIM that." |
| HOA Welder 2 | to say the joke about the harvester | the other welder's seriousness | the deadpan | none |
| The player | (not heard) | | | sees the plates; crouches ready |

## 4. Subtext

- The welders are not evil; they are workers who know what the armour is for and joke about it so they can keep
  welding it. "Scratch-proof? It's a harvester." is the joke that says so.
- Ernie is not part of the plot, and minds his own business. His chestnuts are the most honest thing in the forge.
- "HIM" is Vesper, unnamed, and that is the point: the welders are careful, and the player should hear the caution.

## 5. Beat sheet

Timings at Normal text speed (the report prints the scene's length). Hook by 3 s, turn at about 60%, button in the
last 3 s.

| # | Time | Beat | What happens (picture first, then words) |
| --- | --- | --- | --- |
| 1 | 0.0-1.4 | Hook | A `smash` on the plate at the anvil (welder 1), the furnace glow; the wide of the heap from the player's cover |
| 2 | 1.4-5.8 | Setup | Ernie, MCU: "Chestnut? Nearly edible. Roasted on a trowel, like my granddad did." |
| 3 | 5.8-11.9 | Setup | The welders, one coverage for the pair: "Thirty plates by Friday..." / "Scratch-proof? It's a harvester." / "Tell HIM that." |
| 4 | 13.8-16.8 | Turn | Music out; `thud` on the plate; `reveal` stinger; a dolly onto the plates ('pot-lid-shield', 'millstone') |
| 5 | 15.4-16.8 | Turn | `villain` music under the plates, after the picture |
| 6 | 16.8-21.1 | Button | The player moves into cover at (-266, -60) with a run and a lean; the last image is his face |

## 6. Shot list

| # | Shot (size, `frame`/`cut`/`track`/...) | Lens / distance | Move | On | Motivation |
| --- | --- | --- | --- | --- | --- |
| 1 | `cut` `spot('compost-heap','wide')` | 52 (stage camera) | locked | the forge and the heaps | the establishing picture, held 1.4 s after the smash |
| 2 | `shot('ernie','mcu')` | 35 | locked | Ernie, the trowel | the chestnut line |
| 3-5 | `coverage('welder1','welder2', 1)` singles, MCU | 35 | locked | welder 1, welder 2, welder 1 | one side of the line for the whole exchange |
| 6 | `dolly` from above the player's cover onto the plates (`look: 'plate1'`, 3 s) | 48 | dolly | the plates | the reveal is a picture |
| 7 | `shot('player','mcu')` | 35 | locked | the player, lean | the last image, the player's face |

Sides: the welders on `coverage('welder1', 'welder2', 1)`; no crossings. Ernie is a single, no coverage needed.

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| ~~Narrator~~ | ~~Under the furnace glow, something big is being welded together that is not a lawnmower.~~ | cut: narration first and describes the picture; the plates say it |
| Ernie | Chestnut? Nearly edible. Roasted on a trowel, like my granddad did. | kept: the comic relief (11 words) |
| Welder 1 | Thirty plates by Friday. The Glazier wants it scratch-proof. | kept: the job and the boss (12 words); "Glazier" is Vesper (`docs/lore/INDEX.md`, vesper-thorne) |
| Welder 2 | Scratch-proof? It's a harvester. | kept: the joke |
| Welder 1 | Tell HIM that. | kept: the threat, "HIM" unnamed |
| ~~Narrator~~ | ~~Thirty plates. One Glazier. Not a single square inch of lawn left unpolished.~~ | cut: describes the picture; the plates are the picture |

The scene has no narrator line at all: the zero-narration rule for an arrival.

## 8. Music and sound

| Time | Cue | Why |
| --- | --- | --- |
| 0.0 | `smash` sfx at welder 1; `mystery` music; `forest` ambience | the hook: a plate hit, the forge's own sound |
| 13.8 | music out (0.6 fade) | the beat before the reveal: no music under the plates |
| 13.8 | `thud` sfx on the plate; `reveal` stinger | the plates are there |
| 15.4 | `villain` music (0.6 fade) | Vesper ("HIM") is the threat; after the picture, not before |

## 9. Blocking and vehicles

- The player starts at (-280, -50), facing the forge; moves at a run to (-266, -60) at the end.
- Ernie at the furnace, (-244, -54) facing (-250, -56); the welders on the anvil: welder 1 at (-252, -57) facing the
  anvil (-254, -62), welder 2 at (-258, -56) facing (-252, -57).
- Plates: `pot-lid-shield` at (-270, -50) and `millstone` at (-258, -46), spawned hidden and revealed at the stinger.
- The armour rig (`armor-rig`, parked) is the stage's own vehicle; it is not moved in this scene.

## 10. The button

The player's face in the cover at the heap, after the plates: he is ready, and the last image is his face. The forge
is still at work behind him.

## 11. Self-check

- [x] The scene has a want (the welders want the plates done; the player wants to see the plates) and a turn (the
      reveal); it is not a briefing.
- [x] The hook lands in 0 s: a smash, the furnace glow; the first line is at 1.4 s, Ernie's, from a character.
- [x] Every line is under 16 words (the longest is 12); nobody says what the picture shows; no coordinates.
- [x] Zero narrator lines; the plates are shown, not described.
- [x] Voices: Ernie folksy; the welders blunt; "HIM" never named.
- [x] Every speaker is framed MCU, facing the camera; the welders on one side of their line.
- [x] Music: `mystery` to none (under the reveal) to `villain` (after the picture); one `reveal` stinger; no held silence.
- [x] Night forge: lit by the furnace and the stage's own lighting (no `sky` change needed; the checker accepts it).
- [x] scene checker (`scenecheck.dev.test.ts`): OK, all shots pass, zero faults.
- [x] `direction.notes` in the scene points at this file.

## Review pass (planner)

Watched at 960x600. The plates were too small to read as armour: `pot-lid-shield` at size 2.4 and `millstone` at 2.2, stacked by the heap at (-268.5, -53) and (-266.2, -50.8), with a low dolly onto them. The welders' coverage moved to side -1: on side 1 a forge post covered half of each face.
