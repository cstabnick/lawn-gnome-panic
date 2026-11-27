# Director's notes: `even-cut-intro`

Re-directed for E22, when the finale became four parts. It used to open the whole finale at the Overlook map table; the
first scene of the finale is now `even-cut-p1-intro` (which also carries the "CHAPTER 5 — THE EVEN CUT" title card, so
this scene has none). This scene now opens the **final part** (The Jam & The Choice), right after the deck fight, in the
street the Combine is coming down. Its payoffs stay: the PA, the kazoo, Asphalt, the forty-eighth wrench, Tansy saying
Pip's line, and Pip's line that sends them in.

| | |
| --- | --- |
| Scene | `even-cut-intro` in `src/cutscene/scenes/story/ch5.ts` |
| Played by | quest `ch5-even-cut` (the final part) as its intro |
| Kind and length | `intro`, aim 30-60 s (about 53 s) |
| Where, when | stage `e70-jam-street` (the x = 0 road between the blocks south of the z = -120 crossing); a cutaway to `bodega-front`; day, `sky: 'noon'` |
| Before / after | before: `even-cut-p3-outro` (the Guard down, the lamp lit). After: the jam (`boss-combine` phase `jam`), then `even-cut-jam` |

## 1. Purpose in the story

The last setup before the jam: the Stone goes into the player's hands (Bracken), the crew's biggest heist gets its wrench
(Tansy's ladder), Tansy finally lets Pip's plan-voice be hers (his ladder: she says it, he is speechless), and the plan
carries Clara's plea ("Nobody shatters."). Vesper loses the hat line itself: he tries it on the PA and cannot finish it.

## 2. The player's feeling

- **In:** the deck fight won, a lamp lit on the roof. **Out:** the whole crew is in the street with you, and it is time.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Vesper (PA) | make them move | his own voice | patience, then the old line | the line will not come |
| Pip | be useful | nerves | the kazoo, then the line | speechless, then the voice back |
| Bracken | hand on the Stone | it is his people's | archaic, heavy | trusts the player with it |
| Tansy | send them in | — | the box, then Pip's words | she runs the plan in his phrase |
| John | report | — | dry | — |

## 4. Subtext

"Okay, Potsworth. Hear me out." is Tansy admitting she listened all along. "Nobody shatters." is Clara's, said by the
crew's hardest voice.

## 5. Beat sheet

| # | Time | Beat | What happens |
| --- | --- | --- | --- |
| 1 | 0-6 | Hook | the street, the crew small, the Combine filling the top of it with its lamp lit; the PA: "extremely patient" |
| 2 | 6-13 | | the PA on the player's face: "Nice... Nice h—"; static; silence; the kazoo ("...Sorry. Nerves.": the gag) |
| 3 | 13-20 | | Bodega & Sons: Asphalt has left the counter |
| 4 | 20-29 | Setup | Bracken gives the Stone: "Cut for one mouth in all the world." "Heavy." "It is meant to be." |
| 5 | 29-38 | Turn | the cigar box opens; the finale theme; the forty-eighth wrench; "It's big enough." |
| 6 | 38-47 | | Tansy: "Okay, Potsworth. Hear me out."; Pip has nothing; the plan in three clauses |
| 7 | 47-53 | Button | Pip: "Let's go jam a god-machine with a rock!"; the player walks up the road into it with the Stone |

## 6. Shot list

Stage spot `canyon` (low, long lens up the street); low MCU on the player for the PA; `coverage('tansy', 'pip', -1)` and
`coverage('tansy', 'player', 1)` singles (Pip asks about the wrench before Tansy answers, which keeps the line between
Bracken's and Tansy's shots); low singles on Bracken; inserts on the give and the cigar box; the Bodega barometer insert
(as the prologue framed it); a low wide behind the player for the button.

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Vesper (PA) | Turfton. Friends. I have been extremely patient with all of you. | the last of the polite register |
| Vesper (PA) | Nice... Nice h— | the hat ladder: he cannot finish it any more |
| Pip | ...Sorry. Nerves. | the golden kazoo, at the worst moment (the one gag) |
| John | Asphalt just hopped off the counter. / Twelve years. Never once. | the barometer: something is truly wrong |
| Bracken | Gnorwin's Stone. Cut for one mouth in all the world. | |
| Player | Heavy. | the straight man |
| Bracken | It is meant to be. | |
| Pip | Is that... the forty-eighth? | |
| Tansy | I said it waits for a big enough heist. | |
| Pip | Is it? | |
| Tansy | It's big enough. | |
| Tansy | Okay, Potsworth. Hear me out. | Pip's line in her mouth; the surname so it is hers (and not the founders-boot line word for word) |
| Tansy | Stone in its mouth. Hat off the man. Nobody shatters. | the plan, and Clara's plea |
| Pip | Let's go jam a god-machine with a rock! | Pip's chapter 5 line |
| ~~Granny, Diggs~~ | ~~the canal, the Guard~~ | cut: part 1's beacon montage now shows every faction |

## 8. Music and sound

`villain` under the PA, out for the silence; `finale` from the cigar box on (bible: "from the brass wrench on"). Engine,
static, whistle (the kazoo), glass (the Bodega window), thud (the Stone), door-creak (the box). Beds `street`, `room` for
Bodega.

## 9. Blocking and vehicles

The Combine prop at (0, -129) then (0, -125) for the button, the throne on its bridge turned round, the lamp lit. The
player at (-0.2, -100.6) facing north, walking to (-0.2, -104.5) at the end; Bracken (-2.6, -98.2) with the Stone; Tansy
(2.6, -99.2) by a crate with the cigar box on it; Pip (0.6, -95.8) with the kazoo; Tansy's orange Zero-Turn slewed across
the east kerb.

## 10. The button

The player's back, the Stone in their hands, walking up the middle of the road into a machine the width of it.

## 11. Self-check

- [x] Hook by 3 s; lines under 16 words; one gag; one held silence; no chapter title (part 1 has it).
- [x] `cutscene-report` OK; line of sight passes.
