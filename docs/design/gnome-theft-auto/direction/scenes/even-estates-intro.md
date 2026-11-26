# Director's notes: `even-estates-intro`

Watch it at `http://localhost:5310/?no-intro&cutscene=even-estates-intro`.

| | |
| --- | --- |
| Scene | `even-estates-intro` in `src/cutscene/scenes/story/m07-even-estates.ts` |
| Played by | quest `m07-even-estates` ("Even-Estates") as its intro, given at City Hall |
| Kind and length | `intro`, aim 30-60 s; now 32.3 s at Normal text speed, no faults |
| Where, when | stage `city-hall-steps`, dusk (`sky: 'golden'`) |
| Before / after | before: Two-Coat Tail (the Mayor caught handing Vesper the medians). After: the player fetches a ride and picks Juniper up on the steps (passenger objective) |

## 1. Purpose in the story

Act I asks whether the player can pay their way out and where Vesper's money flows. This scene turns Juniper from a client into
a partner with a stake: the money is going somewhere beige, and somebody is using her brother's stamp. It plants Reginald's
signature, which the outro pays off, and her need for a street driver (bible section 2: she needs to accept it). Ladder: Juniper's
brother insults.

## 2. The player's feeling

- **In:** the Mayor has just been caught; the player expects another tail.
- **Out:** amused by Juniper defending Reginald by insulting him, sure of the job (drive her to the building site at the edge of town,
  at dusk), and aware that the site is Vesper's.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Juniper | a driver who cannot be traced to City Hall | her own Ride-On has a flag on it | numbers, deadpan, "You drive. I arrive." | has her driver |
| The player | to know where the money goes | Juniper's brisk answers | two dry questions | agrees |

## 4. Subtext

- "My brother cannot sign a birthday card without measuring it" is a defence: she is sure Reginald would never sign this. She is
  not as sure as she sounds.
- "You drive. I arrive." covers a real need to be driven by somebody who will not ask why.

## 5. Beat sheet

| # | Time | Beat | What happens |
| --- | --- | --- | --- |
| 1 | 0-4 | Hook | the map on the steps, her number: forty thousand acorns, the medians unchanged |
| 2 | 4-12 | Setup | "Where does it go?" "Somewhere with a crane. Reginald's stamp is on every page." |
| 3 | 12-20 | Turn | "Your brother?" and her defence of him: someone is using his stamp |
| 4 | 20-27 | The job | the ring road, "You drive. I arrive." |
| 5 | 27-32 | Button | "Mine has a flag." The camera finds the flag, fluttering over the parked Ride-On |

## 6. Shot list

All `coverage('juniper', 'player', 1)`: Juniper's singles on the +25 side, the player's reactions on the -25 side. The hook is
`shot('juniper','mcu')` straight on. The turn pushes in on Juniper (`pushIn`). The button is a still of the Ride-On's flag from
the kerb (a 'cut' on the vehicle), the only non-frame shot. No crossings.

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Juniper | Median money. Forty thousand acorns a year. The medians look exactly the same. | the hook: the joke is in the arithmetic |
| Player | Where does it go? | the straight man |
| Juniper | Somewhere with a crane. Reginald's stamp is on every page. | plants the stamp |
| Player | Your brother? | |
| Juniper | My brother cannot sign a birthday card without measuring it. Someone is using his stamp. | the defence by insult |
| Juniper | The site is out on the ring road. You drive. I arrive. | the objective, in her voice |
| Player | Your Ride-On? | |
| Juniper | Mine has a flag. Nobody sneaks anywhere with a flag. | button; why she needs the player's ride |

Names checked: `npm run lore -- find "Vance"`, `"Even-Estates"`.

## 8. Music and sound

| Time | Cue | Why |
| --- | --- | --- |
| 0.0 | `turfton-dusk` music, `street` bed, `paper` foley on the map | dusk on the steps, the slow tune |
| 29 | `flutter` on the flag | the button sound |

## 9. Blocking and vehicles

Juniper at the stage mark (14, -71) with the folded map; the player at (10.4, -67.2), 5 m from her (the stage mark is 8 m away).
Her navy Ride-On (`juniper-ride`) stays parked at (24, -68.5). The player ends where they stand: the objective that follows is
the pickup on these steps.

## 10. The button

The flag fluttering on a spotless parked Ride-On. The right last moment: it is the whole reason she needs somebody else's wheels.

## 11. Self-check

- [x] Want (a driver), obstacle (the flag), turn (Reginald's stamp).
- [x] Hook in 3 s on a character and a joke; no narration.
- [x] Lines under 16 words (longest 15); nobody says what the picture shows.
- [x] Juniper brisk, formal, one-liners; the player two to four words.
- [x] One side of the line (coverage); checker: zero faults.
- [x] Dusk (`sky: 'golden'`), `turfton-dusk`, no stinger.
- [x] `direction.notes` points here.
