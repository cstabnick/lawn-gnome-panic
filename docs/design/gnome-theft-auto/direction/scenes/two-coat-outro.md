# Director's notes: `two-coat-outro`

Watch it at `http://localhost:5310/?no-intro&cutscene=two-coat-outro`.

| | |
| --- | --- |
| Scene | `two-coat-outro` in `src/cutscene/scenes/story/ch1b.ts` |
| Played by | quest `ch1-two-coat-tail` as its outro (the payoff, at City Hall, before the CONTRACT COMPLETE banner) |
| Kind and length | `outro`, aim 15-45 s; now 41.5 s (was 41.1 s, 6 faults). Inside the aim; the double act needs the length |
| Where, when | stage `city-hall-steps`; day |
| Before / after | before: the photos delivered to City Hall. After: free roam; `ch1-tax-break-in` opens |

## 1. Purpose in the story

The siblings' double act. The photos prove the Mayor's deal; Juniper's line about the medians sets up the chapter's
turn; Reginald, the Code-Enforcement officer, shows that the HOA's enforcement is also a family business. It delivers
the payoff of the Mayor's coats (his Ding, his deal) and gives the player a reason to trust Juniper.

The old scene opened on a stage wide, had Reginald shot back-of-hat, held the van's track for 20 s, and ended on an
errand (Big Lou's embargo), which is the errand hook the bible forbids as a last line.

## 2. The player's feeling

- **In:** the photos are in Juniper's hand: the job worked.
- **Out:** the Trowel and her brother are both funnier than they should be; Juniper has the last word; the player is
  still the one who did the job.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Juniper | to get the Mayor's deal into the record | her brother's enforcement | paperwork, a one-liner | has the last word, as the van leaves |
| Reginald | to measure the grass and enforce a quarter-inch | his sister's contempt | municipal code, numbers, calipers | writes a ticket for an insult; leaves |
| The player | to be paid, and to leave | (silent) | (silent) | walks off to (4.5, -70.5) |

## 4. Subtext

- Juniper is angry at the Mayor, not at Reginald: her "Your boss is a crook" is about Vesper's money in Reginald's van.
- Reginald does not want to be doing this (he will not say so until the finale). His numbers are his way of not
  answering.
- The siblings never look at each other while insulting each other. Each speaks to the lawn, the player's side.

## 5. Beat sheet

| # | Time | Beat | What happens |
| --- | --- | --- | --- |
| 1 | 0.0-1.0 | Hook | The field camera changes hands (`give`): an action at 0 s. |
| 2 | 1.0-4.8 | Juniper's read | "Signing the medians straight over to Vesper. Barnaby, Barnaby." |
| 3 | 4.8-13.7 | Arrival | Reginald's Code-Enforcement van drives the z = -60 road (track, 9 s), to the City Hall steps. |
| 4 | 13.7-19.4 | Measuring | Juniper watches him climb out and walk to the lawn (exit and walk, in her shot). |
| 5 | 19.4-20.8 | Crouch | Reginald measures the lawn with the calipers (`think`), high single. |
| 6 | 20.8-23.6 | The first line | "Juniper. Your grass is a quarter-inch proud." (high, measuring) |
| 7 | 23.6-25.9 | The reply | "Reginald. Your boss is a crook." |
| 8 | 25.9-29.4 | Enforcement | Reginald, low: "Calling an officer a crook is four-oh-four dash B." (the one low angle) |
| 9 | 29.4-34.3 | The turn | Juniper: "Then write it, Reginald. Slowly." He gets in the van; the track follows it out. |
| 10 | 34.3-41.5 | Button | The van pulls away west on the track; Juniper's last line, "Drive carefully, Reginald. Mind the grass." (38.9) |

## 6. Shot list

| # | Shot | Lens / distance | Move | On | Motivation |
| --- | --- | --- | --- | --- | --- |
| 1 | `spot('city-hall-steps','two-shot')` | 46 | locked | the player and Juniper | the give is an action in a stage wide, held 1 s |
| 2 | `shot('juniper','mcu',{toward:'player'})` | 35 | locked | Juniper | her read of the photos |
| 3 | `track` the van (`who: 'van'`) | 50 | tracks west to the steps | the van | Reginald's arrival: a moving shot, 9 s |
| 4 | `shot('juniper','mcu',{toward:'player'})` | 35 | locked | Juniper | she watches him get out (holds through exit and walk) |
| 5 | `shot('reginald','ms',{height:'high',toward:'player'})` | 40, high | locked | Reginald | measuring: shot from above |
| 6 | `shot('juniper','mcu',{toward:'player'})` | 35 | locked | Juniper | the reply |
| 7 | `shot('reginald','ms',{height:'low',toward:'player'})` | 40, low | locked | Reginald | enforcing: the only low angle |
| 8 | `shot('juniper','mcu',{toward:'player'})` | 35 | locked | Juniper | "Then write it, Reginald." |
| 9 | `track` the van as it leaves (`who: 'van'`) | 50 | tracks west | the van | the button's motion |
| 10 | `shot('juniper','mcu',{toward:'player'})` | 35 | locked | Juniper | the last word |

Sides and eyelines: the siblings are shot on separate singles, each with the eyeline set to the player's side of the
lawn, so neither looks at the other. Their lines are paired on `coverage('juniper','reginald', 1)` for the side of the
line; no crossings are needed.

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Juniper | Signing the medians straight over to Vesper. Barnaby, Barnaby. | the hook's read; the Mayor's coats payoff |
| Reginald | Juniper. Your grass is a quarter-inch proud. | kept: the calipers line |
| Juniper | Reginald. Your boss is a crook. | kept (the bible's line) |
| Reginald | Calling an officer a crook is four-oh-four dash B. | the code, the enforcement; a ticket for the insult |
| Juniper | Then write it, Reginald. Slowly. | the devastating one-liner; insults him by agreeing |
| Juniper | Drive carefully, Reginald. Mind the grass. | the button: the last word, a callback to his measuring |
| ~~Juniper~~ | ~~Speaking of the Glazier's errand boys. My brother.~~ | cut: a hook lead-in; the siblings' scene needs no introduction |
| ~~Juniper~~ | ~~Big Lou at the Gnomecino says the Glaze & Tax boys are squeezing him too.~~ | cut: an errand hook as the last line (the bible forbids it); Lou's embargo is a side quest's hook, not this one's |

Names checked: `npm run lore -- find "Reginald"`, `"four-oh-four"`, `"Code-Enforcement"`, `"Glaze & Tax"`.

## 8. Music and sound

| Time | Cue | Why |
| --- | --- | --- |
| 0.0 | `warm` music, `street` ambience | the payoff: the city's day, warm |
| 4.8 | van engine (the drive) | Reginald's arrival |
| 27.7 | (no change) | the bite of the line is in the words |
| 36.1 | the van's engine leaves | the button's sound |

No stingers. No threat, no reveal, no sincere beat: the scene plays on the siblings' dryness.

## 9. Blocking and vehicles

- Juniper at (14, -71), the podium; the player gives the field camera and then walks to (4.5, -70.5) (the quest's exit,
  set in the first 10 s so the player is off the steps before Reginald's line).
- Reginald's van (`van`, hidden, a Code-Enforcement van with Reginald seated in it) starts at (120, -62.5), drives the
  z = -60 road west to (14, -62.5). He exits, walks to (10, -64.5) and measures the lawn.
- After the enforcement line he gets back in the van; the van drives out west (14, -62.5) to (-50, -62.5) at speed 14.

## 10. The button

The van leaving west on the z = -60 road, and Juniper's last line, to camera: "Drive carefully, Reginald. Mind the
grass." It is the right last moment: she has the last word, the joke is the family's dryness, and the lawn he measured
is the lawn she is still standing on.

## 11. Self-check

- [x] Want, obstacle, turn: the photos delivered; Reginald's measuring against Juniper's contempt; the van leaves.
- [x] Hook in 3 s (the give, at 0 s); no narration.
- [x] Every line under 16 words (longest 11); nobody says what the picture shows; no coordinates; no errand hook.
- [x] Voices: Juniper's one-liners and insults by agreement; Reginald's code and numbers.
- [x] Reginald shot from a high angle except for his enforcing line (low).
- [x] The siblings never look at each other: separate singles, eyelines to the player's side of the lawn.
- [x] One side of the line for their exchange; no crossings.
- [x] Music: `warm` only; no stingers; no held silence needed.
- [x] Running jokes: the Mayor's coats (the deal is the payoff); Reginald's quarter-inch (set for the finale).
- [x] Day scene.
- [x] Checker: all shots pass; the Juniper-to-Reginald track holds under 12 s; the outro's long holds are fixed by cutting to Juniper's watching shot.
- [x] `direction.notes` points here.
