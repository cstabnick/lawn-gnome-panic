# Director's notes: `two-coat-intro`

Watch it at `http://localhost:5310/?no-intro&cutscene=two-coat-intro`.

| | |
| --- | --- |
| Scene | `two-coat-intro` in `src/cutscene/scenes/story/ch1b.ts` |
| Played by | quest `ch1-two-coat-tail` ("Two-Coat Tail") as its intro, given at City Hall |
| Kind and length | `intro`, aim 30-60 s; now 56.5 s at Normal text speed (was 70.8 s, 18 faults) |
| Where, when | stage `city-hall-steps` (the forecourt and the z = -60 road); day |
| Before / after | before: Mowers' Keepers and the first errands paid off, the player is still a hired hand. After: the tail to Patio Heights (`two-coat-handover`), with the field camera in the player's hands and Mabel's taxi gone |

## 1. Purpose in the story

Chapter 1 asks whether the player can pay their way out. This scene introduces the City Hall power bloc: Juniper, who
wants the HOA beaten on paper and needs a street driver, and the Mayor, who wants to be on the winning side. It plants
two running threads: the Mayor's coats (his joke, paid off in the epilogue) and Mabel Kerbstone's taxi (the first rung of
her ladder, lore ruling R-071: "Not on a job, dear.").

The old scene was a briefing with three wide-shot monologues, a reporter nobody could see, and a 20-word line about
her own nickname that she would never explain.

## 2. The player's feeling

- **In:** the job is mob work and the player is a hired hand; they were sent here by the debt.
- **Out:** amused by Juniper's dryness, sure of the job (tail the Mayor to Patio Heights, photograph the handover, bring
  the photos to City Hall), and mildly insulted by Mabel.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Juniper | to get a photograph of the Mayor's deal, with a driver she does not have | the Mayor's showmanship; her brother's opinion of her | paperwork voice, one-liners, never hurries | hands the player the field camera |
| Mayor Mulch | to be seen posing at the statement | Juniper's contempt, which he does not notice | poses, slogans, "Ding, ding!" | rides off east to the handover |
| Reporter | one answer about the medians | Juniper's deflection | one question | (gone after one line) |
| Mabel Kerbstone | to sell the player a ride | the player's indifference to the taxi | cheerful salesmanship | refused, and takes it cheerfully |
| The player | to know why they are being sent | Juniper's brisk assignment | one dry question | takes the camera |

## 4. Subtext

- Juniper hides her need for a driver behind "You have no reputation to lose." Her fear: being seen to need the player.
- The Mayor's posing is his only interest: the cameras he poses for are not there, and Juniper's refusal to look at him is
  the joke.
- Mabel's "Not on a job, dear." is her first refusal of the crew (the ladder); nothing in her voice says she minds.

## 5. Beat sheet

| # | Time | Beat | What happens |
| --- | --- | --- | --- |
| 1 | 0.0-4.0 | Hook | Juniper's statement, mcu, the grass line. A deadpan opener with a character, no narration. |
| 2 | 4.0-10.4 | Setup | The reporter's one question; Juniper's deflection, "Mayor, the scissors." |
| 3 | 10.4-14.9 | Comedy | The Mayor poses (cheer gesture, a held pause) and says "Snip!"; Juniper's Trowel line, not explained. |
| 4 | 19.0-27.3 | Exit | "Ta-ta, Trowel! Ding, ding!"; the Mayor climbs on, the track follows the Ride-On east, the horn. |
| 5 | 27.3-33.0 | Turn (the job) | Juniper: "He is off to Patio Heights. Follow him and photograph the handover." The field camera passes. |
| 6 | 33.0-38.5 | The player's question | "Why me?" "You have no reputation to lose. Bring me the photos." |
| 7 | 38.5-50.6 | Obstacle | Mabel's taxi tracks in; "Turfton Taxi! Hop in, dear." "They are on a job, Mabel." |
| 8 | 50.6-56.5 | Button | "Not on a job, dear. Suit yourself." on Mabel's mcu; the taxi drives off west while she says it. |

## 6. Shot list

| # | Shot | Lens / distance | Move | On | Motivation |
| --- | --- | --- | --- | --- | --- |
| 1 | `shot('juniper','mcu')` | 35 | locked | Juniper | the hook is her face and her line |
| 2 | `PRESS.single('press-a','mcu')` | 35 | locked | the reporter | one question |
| 3 | `PRESS.single('juniper','mcu')` | 35 | locked | Juniper | her deflection, same side as the question |
| 4 | `MAYOR_COV.single('mayor','ms')` | 40 | locked; cheer gesture | the Mayor | posing for the absent cameras |
| 5 | `face` Juniper to the Mayor, then `MAYOR_COV.single('juniper','mcu')` | 35 | locked | Juniper | she turns, and she does not look at him for long |
| 6 | `MAYOR_COV.single('mayor','mcu')` | 35 | locked | the Mayor | "Ta-ta, Trowel!" |
| 7 | `track` the Ride-On (`mayor-ride`) | 50 | tracks east | the Ride-On | the tail starts; a moving shot, under 12 s |
| 8 | `shot('juniper','mcu')` | 35 | locked | Juniper | the objective, in her voice |
| 9 | `JPLAYER.single('player','mcu')` | 35 | locked | the player | the straight man |
| 10 | `face` Juniper to the player, then `JPLAYER.single('juniper','mcu')` | 35 | locked | Juniper | the one-liner |
| 11 | `track` the taxi (`who: 'taxi'`) | 50 | tracks west | the taxi | arrival, under 12 s |
| 12 | `MABEL_COV.single('mabel','mcu')` | 35 | locked | Mabel | the offer |
| 13 | `MABEL_COV.single('juniper','mcu')` | 35 | locked | Juniper | "They are on a job, Mabel." |
| 14 | `MABEL_COV.single('mabel','mcu')` | 35 | locked | Mabel | the button; the taxi leaves under the line |

Sides of the line: juniper and the reporter on `coverage('juniper','press-a', 1)`; juniper and the Mayor on
`coverage('juniper','mayor', -1)` (the -1 side keeps Juniper's face to the camera once she turns to him); juniper and the
player on `coverage('juniper','player', 1)`; juniper and Mabel on `coverage('juniper','mabel', 1)`. No deliberate
crossings.

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Juniper | Citizens. The grass is growing at a healthy, legal height. | the hook: a character, a joke that is deadpan |
| Reporter | Councilwoman, what about the medians? | the one press question (`press-a` coverage) |
| Juniper | The medians are in very capable hands. Mayor, the scissors. | cut "show them": the scissors are on screen |
| Mayor | Snip! Fresh paint, fresh paving, fresh promises! | kept: his slogan |
| Juniper | Reginald calls me The Trowel. For once, he has a point. | replaces the 20-word line; agrees with her brother, does not explain the nickname |
| Mayor | Ta-ta, Trowel! Ding, ding! | kept: his ding |
| Juniper | He is off to Patio Heights. Follow him and photograph the handover. | the objective, one place name, in her voice |
| Player | Why me? | the straight man's dry question |
| Juniper | You have no reputation to lose. Bring me the photos. | kept; the devastating one-liner |
| Mabel | Turfton Taxi! Hop in, dear. | kept: the ladder's first rung |
| Juniper | They are on a job, Mabel. | the Councilwoman's reason, not a joke |
| Mabel | Not on a job, dear. Suit yourself. | ruling R-071; the refusal is her button |
| ~~Juniper~~ | ~~They call me The Trowel. Reginald says it is because I dig...~~ | cut: 20 words, and she would not explain her own nickname |
| ~~Juniper~~ | ~~My brother calls Vesper's 400-page grass study light reading.~~ | cut: the Reginald beat is carried by the Trowel line |
| ~~Narrator~~ | none | the scene opens on a character; no narration |

Names checked: `npm run lore -- find "Mabel"`, `"Trowel"`, `"Patio Heights"` (R-071 and the story canon).

## 8. Music and sound

| Time | Cue | Why |
| --- | --- | --- |
| 0.0 | `turfton` music, `crowd` ambience | the statement: the city's noon |
| 10.4 | the `mayor` posing: no sound; the cheer | the posing is silent; the joke is the lack of cameras |
| 23.8 | horn on the Ride-On; `turfton` continues | the tail starts |
| 46.3 | (no change) | Mabel's taxi is ordinary business |

No stingers; the scene has no reveal and no threat, so none is needed.

## 9. Blocking and vehicles

- Juniper at her mark (14, -71) on the forecourt; the Mayor at (18, -71), beside her, with the hedge shears; the reporter
  at (11, -65) and the photographer at (17, -65) (the photographer does not speak; his mark is in the crowd).
- The player at (6, -68), at the edge of the press scrum; Juniper hands them the field camera at the end of the Mayor
  exchange.
- The Mayor enters his candy-red Ride-On (`mayor-ride`, parked at (40, -68.5)) and drives east: (40, -68.5) to
  (40, -57.5) to (100, -57.5), then out of shot.
- Mabel's taxi (`taxi`, a hidden Ride-On with her seated in it) starts at (120, -62.5) and drives the z = -60 approach
  to (14, -62.5), then leaves west to (-50, -62.5) during the button.
- The player ends the scene walking to (4.5, -70.5): the quest's exit.

## 10. The button

Mabel's mcu, the taxi pulling away west under her line: "Not on a job, dear. Suit yourself." It is the right last moment:
the first rung of her ladder, and the one refusal the player will think about when they get to the epilogue ("on the house").

## 11. Self-check

- [x] Want, obstacle, turn: Juniper's job against the Mayor's posing; the job given; Mabel refused.
- [x] Hook in 3 s on a character (Juniper's line at 0 s); no opening narration.
- [x] Every line under 16 words (longest 11); nobody says what the picture shows; no coordinates or road names.
- [x] Voices: Juniper brisk and one-liner; the Mayor's slogan and ding; the player two words; Mabel cheerful.
- [x] Every speaker MCU or MS, facing the camera for their line (a `face` step turns Juniper to the Mayor and to the player).
- [x] One side of the line per conversation (coverage per pair).
- [x] Music: `turfton` only, no reveal, no threat, no stinger.
- [x] Ladders: Mabel's taxi (rung one, "Not on a job, dear."); the Mayor's ding planted; Juniper's Reginald beat sets up the outro.
- [x] Day scene.
- [x] Checker: all shots pass; zero pacing faults (the last run, see the report).
- [x] `direction.notes` points here.

## Review pass (planner)

Watched at 960x600. Mabel's two lines were framed from inside her own taxi (a black frame): they are now a still shot from the steps side of the kerb, looking at her in the driver's seat.
