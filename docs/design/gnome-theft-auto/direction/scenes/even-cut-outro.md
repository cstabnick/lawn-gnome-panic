# Director's notes: `even-cut-outro`

The epilogue: the last scene of the game. Re-directed for E22: it now opens with Clara (row 66's plea, paid) and ends on
the coalition's hat rail instead of the empty spot in the dust (the player picked the hat up in `even-cut-hat`). Watch it
at `?no-intro&cutscene=even-cut-outro`.

| | |
| --- | --- |
| Scene | `even-cut-outro` in `src/cutscene/scenes/story/ch5.ts` |
| Played by | quest `ch5-even-cut` as its outro, after the Golden Acorn choice (it plays for both endings, so it shows neither: W17 draws the clover or the neon after it) |
| Kind and length | `chapter-close`, aim 40-80 s, fault above 100 (about 92 s: the last scene of seventy rows, one shot per thread) |
| Where, when | `e70-crossing`, `side-valve-bay`, `city-hall-steps`, `gnomecino-door`, `bodega-front`, `bus-stop`, the coalition camp at the overlook (`dust-safehouse`, W16); dusk on the longest day, `sky: 'golden'` |
| Before / after | before: `even-cut-hat` and the choice. After: the free world in its epilogue state (W17, W19 Cam's line) and the Club Gnome hook |

## 1. Purpose in the story

Release (tension 10 -> 2), and every thread's last rung, one shot each, in the order the city settles:

- **Vesper, stopped, not shattered** (Clara's plea): Clara comes up the road with her lantern and sits beside him on the
  throne's step, as two gnomes once sat on a porch step in her photograph. The first shared frame Vesper ever gets (bible:
  never in a two-shot with the crew until the finale). Two porcelain lanterns side by side: his lamp and hers.
- **Reginald's arc**: "...It's uneven." / Juniper: "Good." (they never look at each other).
- **The forty-eighth wrench**: back on the wall. Pip raises a finger for one more plan; "No."; "...Go on."
- **The Mayor's coats**: the third coat, still wet, "on your side the whole time".
- **Diggs**: off duty at Big Lou's rope, a drink in his hand; "Then you're in."
- **Asphalt**: back on the counter.
- **Granny's pie** (for the crew) and **Mabel's taxi** ("on the house", the player: "...Finally.").
- **Club Gnome** on Pip's phone: the hook the doneText keeps.
- **The hat**: the button. Vesper's top hat on the last post of the coalition's hat rail at the overlook, among
  everybody else's caps. All hats.

## 2. The player's feeling

- **In:** the choice made. **Out:** home, and a laugh, and the hat where it belongs.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Clara | reach him | years, the porch | sits down; three short lines | she came back |
| Vesper | — | — | stillness | says her name |
| Juniper / Reginald | measure / win | each other | agreement as insult | Reginald tells the truth |
| Tansy / Pip | close up / one more plan | Tansy | "No." | "...Go on." |
| Mulch, Lou, Diggs, John, Granny, Mabel | one line each | — | their own tics | — |

## 4. Subtext

"It is only a hair. It holds." is Bracken's "It holds." from the jam, now about a gnome. Porcelain does not glue back,
Vesper believed; a hairline does not need glue.

## 5. Beat sheet

| # | Time | Beat | What happens |
| --- | --- | --- | --- |
| 1 | 0-3 | Hook | dusk at the crossing: a lantern coming up the road to a throne with a bare-headed gnome on it |
| 2 | 3-18 | | Clara and Vesper: "There you are." "...Clara." She sits. "It is only a hair, Vesper." "It holds." Silence |
| 3 | 18-22 | | the tune comes back slow; the crane over the two lanterns and the stopped machine |
| 4 | 22-32 | | the siblings measure the scar |
| 5 | 32-45 | Turn | Side-Valve: "Forty-eight."; Pip's plan, "No.", "...Go on." |
| 6 | 45-58 | | the Mayor; the Gnomecino rope; Asphalt |
| 7 | 58-80 | | the bus stop: pie, Mabel, "...Finally.", Club Gnome, "What could possibly go wrong." |
| 8 | 80-92 | Button | the overlook camp at dusk: the top hat goes on the rail's last post; up and away; THE END |

## 6. Shot list

A wide from the east kerb on Clara's walk; `coverage('clara', 'vesper')` singles (Vesper `high`), then their two-shot; a
dolly up and out; the siblings' singles (Reginald `high`), the bay, the Mayor `low`, the rope coverage, the barometer insert
(the same frame as the intro's cutaway), the bus-stop coverage, the taxi track; at the camp, a close cut on the rail, then
a dolly up and away for the titles.

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Clara | There you are. | her register: short, ends early |
| Vesper | ...Clara. | |
| Clara | It is only a hair, Vesper. / It holds. | the sincere beat; nothing on top of it |
| Juniper | The Even Cut, he called it. Go on, Reginald. Measure it. | |
| Reginald | ...It's uneven. | |
| Juniper | Good. | |
| Tansy | Forty-eight. | |
| Pip | So. There's a bowling alley— | the finger, not the phrase (Tansy has spent it) |
| Tansy | No. / ...Go on. | |
| Mulch | Ding, ding! Third coat! I was on your side the whole time! | |
| Big Lou / Diggs | Commander. Rope's up. / Off duty, Lou. / Then you're in. | |
| John | Asphalt's back on the counter. Bottlecap and all. | |
| Granny | Pie, sugar. For the crew. | |
| Mabel | Hop in, dear. This one's on the house. | |
| Player | ...Finally. | |
| (caption) | Club Gnome: "Heard you're good with heavy machinery. Need a gnome for a bowling alley." | the one caption |
| Pip | Bowling? What could possibly go wrong. | the last laugh is Pip's (bible) |
| ~~the empty hat spot~~ | | cut: the player holds the hat now (Clara's plea); the rail replaces it |

## 8. Music and sound

No music for Clara (bed `wind`; footsteps, cloth); `turfton-dusk` after the silence; `turfton` at the bay; `triumph` at the
bus stop; `turfton-dusk` again at the camp; `triumph` stinger under the titles. Clink (the wrench on its peg, Diggs's
glass), horn, phone, tap (the hat on the post). Beds change with the place: `wind`, `street`, `room` (Bodega), `wind`.

## 9. Blocking and vehicles

Vesper bare-headed on the throne at (3.5, -9) in front of the jammed Combine (0, -26); Clara walks from (2.8, 2.5) to the
throne's step (2.4, -8.0) and sits. Juniper (-6, -12.4) and Reginald (-3.4, -16) by the Stone. The bay, City Hall, rope,
Bodega and bus-stop blocking as before. At the camp the player stands at (244.5, 89.2) by the hat rail's west post
(243.6, 87.35): the rail is W16's (coalitionCamp.ts), so the scene only adds the hat.

## 10. The button

A black top hat on a wooden post at the end of a rail of mismatched caps, at dusk, and the camera going up and away over
the camp. Everyone's hat is on the rail.

## 11. Self-check

- [x] Clara's beat has no gag and a held silence; one caption; at most one stinger plus the titles.
- [x] Works for both endings and both Cam choices (W17 and W19 show those after it).
- [x] `cutscene-report` OK; line of sight passes.
