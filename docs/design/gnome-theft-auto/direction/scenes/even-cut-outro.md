# Director's notes: `even-cut-outro`

The epilogue: the last scene of the game. Watch it at `http://localhost:5312/?no-intro&cutscene=even-cut-outro`.

| | |
| --- | --- |
| Scene | `even-cut-outro` in `src/cutscene/scenes/story/ch5.ts` |
| Played by | quest `ch5-even-cut` as its outro, after the Golden Acorn choice (it plays for both endings, so it shows neither) |
| Kind and length | `chapter-close`, aim 40-80 s; now about 80 s (was 46 s, 19 faults) |
| Where, when | `meridian-finale`, `side-valve-bay`, `city-hall-steps`, `gnomecino-door`, `bodega-front`, `bus-stop`; the morning after, `sky: 'golden'` |
| Before / after | before: the jam, Vesper cracked, the choice. After: the free world (and the Club Gnome hook) |

## 1. Purpose in the story

Release (the tension curve's 10 -> 2): every thread gets its last rung, one shot each, in the order the city wakes up.
Then one last sting so the ending has a threat in it, as a closer must.

- **Vesper's top hat comes off**: the first picture, his tall black hat in the dust by the jammed intake (the finale knocked
  it off). The last picture is the same frame with the hat gone.
- **Reginald's arc**: "...It's uneven." / Juniper: "Good." (they do not look at each other).
- **The brass wrench**: Tansy hangs it back up: "Forty-eight."
- **"Okay, hear me out"**: Pip tries one more ("Okay, so, hear me out. There's a bowling alley-"), Tansy: "No." Slump.
  "...Go on." The last word on their relationship is her letting him talk.
- **The Mayor's coats**: a third coat of glossy red: "Ding, ding! I was on your side the whole time!"
- **Diggs** off duty at Big Lou's rope.
- **Asphalt**: back on the counter, bottlecap and all.
- **Granny's pie** for the crew; **Mabel's taxi**: "This one's on the house." The player, who refused her in chapter 1:
  "...Finally."
- **Club Gnome** texts about a bowling alley (the story bible's hook), which Pip's bowling plan at the bay set up.

The old scene opened with four dead shots in a row, played every line on a wide (Juniper at 11% of the frame), had
Reginald and the Mayor talk with their backs to the camera, used `comic` stingers twice, and a caption for the wrench.

## 2. The player's feeling

- **In:** victory, and a choice just made.
- **Out:** warmth (the town is crooked, loud and alive), the laugh of each payoff, and a last chill: somebody took the hat.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Juniper | to have the scar on record as uneven | her brother's habits | an order | gets "uneven" |
| Reginald | to measure honestly | his whole career | calipers, a pause | says it |
| Tansy | to put the wrench back | Pip's next plan | "No." | "...Go on." |
| Pip | to pitch the next job | Tansy | "Okay, so, hear me out" | gets to |
| Mayor Mulch | to be on the winning side | the record | a third coat | |
| Big Lou / Diggs | the rope / a night off | the rope | two words each | Diggs is in |
| Granny | to feed the crew | | pie | |
| Mabel | to finally give the player a ride | | "on the house" | the player gets in, at last |

## 4. Subtext

- Juniper's "Good." is the Vance double act made sincere: she is proud of him and will not say so.
- The empty spot where the hat was: Vesper is porcelain, and rumoured to have come from the Tall House. He is not done.

## 5. Beat sheet

| # | Time | Beat | What happens |
| --- | --- | --- | --- |
| 1 | 0-2 | Hook | The hat in the dust. Wind. |
| 2 | 2-7 | Reveal | A crane up to the jammed Combine and the Stone in its intake; `turfton-dusk` in. |
| 3 | 7-20 | The siblings | Juniper: "The Even Cut, he called it. Go on, Reginald. Measure it." He leans in, a beat: "...It's uneven." Juniper, CU: "Good." |
| 4 | 20-36 | The bay | `turfton`. Tansy hangs the wrench: "Forty-eight." Pip runs in with a plan; "No."; slump; "...Go on." |
| 5 | 36-40 | City Hall | The Mayor, low, waving, in his third coat. |
| 6 | 40-47 | The rope | Lou: "Commander. Rope's up." Diggs: "Off duty, Lou." Lou: "Then you're in." |
| 7 | 47-50 | Bodega | "Asphalt's back on the counter. Bottlecap and all." |
| 8 | 50-72 | Bus stop | `triumph`. Granny's pie; Mabel's taxi pulls in: "Hop in, dear. This one's on the house." "...Finally." The phone: the Club Gnome text. Pip: "Bowling? What could possibly go wrong." |
| 9 | 72-80 | Button | Music out. The opening frame again: the hat is gone. A low hum from the Combine; one `mystery` sting. Crane up for THE END, GNOME THEFT AUTO. |

## 6. Shot list

| # | Shot | Lens | Move | On | Motivation |
| --- | --- | --- | --- | --- | --- |
| 1 | insert `cut` on the hat (`HAT_SHOT`) | 36 | locked | the hat | the payoff, picture first |
| 2 | `dolly` crane up | 52 | rising | the Combine and the Stone | scale and stillness |
| 3-5 | `coverage('juniper','reginald',1)` singles; Reginald high (looking down on him) | 35/30 | cut in to CU | the siblings | the measure, the verdict |
| 6 | `shot('tansy-bay','mcu')` | 35 | locked | the wrench | sincere, one word |
| 7-10 | `coverage('tansy-bay','pip-bay',1)` | 40/35/30 | handheld on Pip's run | the bay | the last exchange of the crew |
| 11 | `shot('mulch','mcu',{height:'low'})` | 35 | locked | the Mayor | he poses for cameras that are not there |
| 12-14 | `coverage('big-lou','diggs-off',1)` | 35 | locked | the rope | two-word sentences |
| 15a | `cut` insert on Asphalt (`asphalt-cat`), the prologue's framing | 44 | locked | the cat, back | the barometer reads fair, in a picture |
| 15 | `shot('john','mcu',{toward:'cat'})` | 35 | locked | John | his line confirms it |
| 16-21 | singles at the kerb (`coverage('player','pip',1)`), a `track` on the taxi | 35/48 | locked / pans | the bus stop | where the game began |
| 22 | `HAT_SHOT` again | 36 | locked | the empty spot | the match cut is the threat |
| 23 | `dolly` crane up | 52 | rising | the Combine | end titles |

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Juniper | The Even Cut, he called it. Go on, Reginald. Measure it. | names the chapter in passing |
| Reginald | ...It's uneven. | his arc, after a held lean |
| Juniper | Good. | no stinger now: deadpan |
| Tansy | Forty-eight. | the wrench count, paid; replaces the caption |
| Pip | Okay, so, hear me out. There's a bowling alley- | his catchphrase, varied (not word for word), and the set-up for the text |
| Tansy | No. / ...Go on. | |
| Mayor Mulch | Ding, ding! I was on your side the whole time! | "Ding, ding!" is his tic |
| Big Lou | Commander. Rope's up. / Then you're in. | two-word sentences |
| Diggs | Off duty, Lou. | |
| John | Asphalt's back on the counter. Bottlecap and all. | |
| Granny | Pie, sugar. For the crew. | pie payoff |
| Mabel | Hop in, dear. This one's on the house. | taxi payoff |
| Player | ...Finally. | the straight man, one word |
| Caption | Club Gnome: "Heard you're good with heavy machinery. Need a gnome for a bowling alley." | the one narration item |
| Pip | Bowling? What could possibly go wrong. | kept |
| ~~Tansy~~ | ~~The Even Cut. Everybody gets the same lawn: their own.~~ | the thesis is in the pictures; the phrase moves to Juniper |
| ~~Caption~~ | ~~Zip-tied lawn chairs, a new pegboard, and one brass wrench...~~ | described the picture |

## 8. Music and sound

| Time | Cue | Why |
| --- | --- | --- |
| 0 | `wind`, no music | the morning after is quiet |
| 2 | `turfton-dusk` | a quiet win |
| 20 | `turfton` | the crew's world is back |
| 50 | `triumph` | the bus stop, the free ride |
| 72 | music out; `engine-rev` low; `mystery` stinger | the hat is gone: the only sting |

## 9. Blocking and vehicles

- Meridian: the Combine prop jammed at (0, -26), the Stopping Stone at (-2, -19), Vesper's hat (`pilgrim-hat`, the tall black
  buckled hat) at (8.2, -17.4), out of the Combine's shadow, despawned before the last insert. Juniper at (4.6, -13.4) facing the machine; Reginald
  at (0.8, -16.6) facing the scar.
- Bay: Tansy at (-155.9, 74.3) facing her wrench wall (`wrench-rack`, the prologue's, at (-157.6, 74.2)) with the wrench for its empty peg; Pip appears at (-146, 69) and runs in to (-153.6, 72.6).
  Brenda's deck chairs on the apron.
- City Hall: the Mayor on his mark. Gnomecino: Lou at the rope, Diggs (off-duty shirt) at (67.2, -30.4).
- Bus stop: the player and Pip on their marks; Granny walks in from (-14, 9) with the pie and gives it to the player;
  Mabel's yellow taxi drives up the x = 2.5 lane to (2.5, 21). The player ends at the bus stop.

## 10. The button

The opening frame, empty: the hat is gone, and the jammed machine hums once. The game ends happy and crooked, with one
loose thread for the next one.

## 11. Self-check

- [x] Want, obstacle, turn: a montage of payoffs, turned by the empty spot.
- [x] Hook in 3 s (the hat); no opening narration.
- [x] Lines under 16 words; no coordinates.
- [x] Voices per the bible.
- [x] Every speaker framed MS or closer, facing the camera.
- [x] One side of the line per exchange.
- [x] One stinger (mystery); no comic stingers.
- [x] Every running joke's payoff: hat, kazoo (in the intro), wrench, hear-me-out, pie, Mabel, coats, Asphalt.
- [x] Golden sky.
- [x] Report OK; removed from the baseline.
- [x] LOS passes; watched at both sizes.
- [x] `direction.notes` points here.
