# Director's notes: `dons-cigars-mid`

Watch it at `http://localhost:5310/?no-intro&cutscene=dons-cigars-mid`.

| | |
| --- | --- |
| Scene | `dons-cigars-mid` in `src/cutscene/scenes/story/m11-the-dons-cigars.ts` |
| Played by | quest `m11-the-dons-cigars`, objective 0 (a visit: plays on arrival at the New Puddle waterfront) |
| Kind and length | `arrival`, aim 10-35 s; 25.3 s at Normal text speed, no faults |
| Where, when | stage `brenda-throne` (the Vinyl Lounge on the canal's north bank); day |
| Before / after | before: Lou's two-tap briefing. After: the crates in an ice-cream van, with an HOA van across the road |

## 1. Purpose in the story

Brenda's first appearance: the Republic's toll, shown, not tolled in the economy. It also shows the HOA arriving
(the one outside move of the scene), so the heat when the van drives off has a face.

## 2. The player's feeling

- **In:** dry amusement at being taxed by a lawn chair.
- **Out:** the toll paid, the crates on the quay, and a van where nobody wants it.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Baroness Brenda | to collect fifty acorns and a bow | the HOA, which she fears in law | proclamations, a feather duster | afraid, in a proclamation |
| The player | the crates | the toll | pays | walks on |
| HOA inspector | to cite the Don's boats | none | drives up and parks across the road | the van is there |

## 4. Subtext

- Brenda's fear is an HOA fine for "excessive leisure". Her last line is a proclamation because that is how she is afraid.
- The crates beside the quay and the dinghy at the water are the Don's, and the HOA has read the same citation.

## 5. Beat sheet

| # | Time | Beat | What happens |
| --- | --- | --- | --- |
| 1 | 0-3 | Hook | The waterfront: boombox, flamingo, the pink bike gang |
| 2 | 3-12 | Setup | "By decree: the Republic taxes cigars, boats and hats." Her card. "The Don sent me. For his crates." |
| 3 | 12-18 | Toll | "The Don is a friend. Friends pay fifty acorns. By decree." The player's pause; the cash |
| 4 | 18-26 | Turn and button | An HOA van up the road; "An HOA van! By decree, nobody has seen you." |

## 6. Shot list

| # | Shot | Lens / distance | Move | On | Motivation |
| --- | --- | --- | --- | --- | --- |
| 1 | `spot('brenda-throne','wide')` | 52 | locked | the waterfront | the establishing shot, from the road |
| 2 | `BRENDA_TALK.single('brenda','mcu')` | 35 | locked | Brenda | the proclamation; the card |
| 3 | `BRENDA_TALK.single('player','mcu')` | 35 | locked | the player | the request |
| 4 | `BRENDA_TALK.single('brenda','mcu')` | 35 | locked | Brenda | the toll |
| 5 | `reaction('player','mcu')` | 35 | locked | the player | the pause |
| 6 | `track` the HOA van | 48 | tracks | the van | the turn, 4.4 s |
| 7 | `BRENDA_TALK.single('brenda','mcu')` | 35 | locked; flinch | Brenda | the button |

`coverage('brenda','player',-1)` throughout.

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Brenda | By decree: the Republic taxes cigars, boats and hats. | her tic, her voice |
| Player | The Don sent me. For his crates. | |
| Brenda | The Don is a friend. Friends pay fifty acorns. By decree. | the toll, told |
| Brenda | An HOA van! By decree, nobody has seen you. | fear in a proclamation |

Names checked: `npm run lore -- find "Brenda"`, `"New Puddle"`, `"Vinyl Lounge"`. Wenna's bait stall is by the canal's south bank, out of shot (80 m), so no cameo.

## 8. Music and sound

| Time | Cue | Why |
| --- | --- | --- |
| 0 | `turfton` music, `water` bed | the canal |
| 2 | `squeak` at the biker | a flamingo toy |
| 14 | `cash` | the toll |

## 9. Blocking and vehicles

- The player at (-40, 214); Brenda stands at (-44.8, 218) with a feather duster; a biker at (-52, 216). Three cigar crates
  stacked at (-32, 220) and a post at (-38.6, 217.4) mark the toll. The HOA van drives (-2.5, 150) to (-2.5, 188) to (-6, 198).

## 10. The button

Brenda's flinch, mid-proclamation: the Republic's first and last enemy.

## 11. Self-check

- [x] Want, obstacle, turn (the van), button.
- [x] Hook in 3 s: a waterfront with sound.
- [x] Lines under 16 words.
- [x] Brenda's "By decree."
- [x] MS or closer; one side of the line.
- [x] Music `turfton`, no stinger beyond the card.
- [x] Intro card: `brenda`, her first story appearance.
- [x] Day scene.
- [x] Report OK.
- [x] `direction.notes` points here.
