# Director's notes: `all-hats-p4-roots`

| | |
| --- | --- |
| Scene | `all-hats-p4-roots` in `src/cutscene/scenes/story/m64-all-hats.ts` |
| Played by | quest `m64-all-hats`, visit objective 0 (the camp's west edge) |
| Kind and length | `arrival`, aim 10-35 s (allowed up to 45: two factions arrive) |
| Where, when | stage `m64-camp-night`, night |
| Before / after | the intro's lanterns / the Spade Guard's arrival at the east edge |

## 1. Purpose in the story

By Root: the Unmowed walk on the roots, the Burrowfolk under them. Bracken names the engines (his old accusation) and
the lent Stone (R-233). Tumblesoil's ladder ("nobody has ever asked", #24, #49) pays: somebody asked, so they came.

## 5. Beat sheet

| # | Beat | What happens |
| --- | --- | --- |
| 1 | Hook | track on Bracken and two lanterns walking out of the scrub |
| 2 | Setup | "Engines. At the foot of your hill." Pip: "Friendly engines!" "Potsworth." "Elder." |
| 3 | Memory | "I lent you a stone. I have come to see it used." "You will." |
| 4 | Turn | the ground heaves; Tumblesoil climbs out of a molehill: "We came the short way." |
| 5 | Gag | "The Unmowed walk upon the roots of the wood." "And we walk under them, Elder. Mind your boots." Held two-shot: he looks at his feet |
| 6 | Button | "Somebody asked us, dear one. So we came." The Elder, who always stands higher, bows to a mole; shot from her eye level |

## 6. Shot list

Moles at their own eye height (batch-3 notes 6.5): every shot with Tumblesoil is at 0.5-0.6 m, and Bracken is seen
from below. `coverage(bracken, player, 1)`, `coverage(tumblesoil, bracken, -1)`.

## 8. Music and sound

`fescue` (the Unmowed), bed `night`; rustle, crunch, gulp, shovel, shake 0.05.

## 10. The button

Bracken bowing into a mole's-eye frame: the proudest gnome in the wood comes down to the height of the ones who dug.
