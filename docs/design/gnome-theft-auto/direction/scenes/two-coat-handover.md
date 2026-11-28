# Director's notes: `two-coat-handover`

Watch it at `http://localhost:5310/?no-intro&cutscene=two-coat-handover`.

| | |
| --- | --- |
| Scene | `two-coat-handover` in `src/cutscene/scenes/story/ch1b.ts` |
| Played by | quest `ch1-two-coat-tail` as its arrival (the visit objective, Patio Heights courtyard, radius 12) |
| Kind and length | `arrival`, aim 10-35 s; now 23.4 s (was 17.1 s, 5 faults) |
| Where, when | stage `patio-gallery` (Vesper's gallery, the green and the north plinths); night, `sky: 'golden'` |
| Before / after | before: the tail (`two-coat-intro`), the field camera in the player's hands. After: the guards come for the player; the crack objective ("Crack Vesper's HOA bodyguards") |

## 1. Purpose in the story

Vesper Thorne's first scene on screen: a polite, still man who files rather than fights, and who notices the one
photograph that matters. It plants the hat ladder (rung one) and the coats ladder (the Mayor's rung), and it starts the
crack objective by sending the guards at the player.

The old scene put Vesper and the Mayor 23 m apart, shot both in wides, and gave the threat as a dialogue line over a
standing wide.

## 2. The player's feeling

- **In:** tailed the Mayor across town, quietly pleased with the camera.
- **Out:** caught, and unsettled by a man who compliments things. The guards are coming and the photos are now at risk.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Mayor Mulch | to close the median deal and keep his coats matching the winners | Vesper's cold eye; the flash | bluster, then a pleading "That was a different glaze!" | caught, and no longer in control |
| Vesper Thorne | to take the leases and keep the handover quiet | the flash | politeness, a pointed joke, a compliment that is a threat | sends the guards after the photographer |
| HOA Bodyguards | to hold the handover | the player's camera | watching, then coming | run at the player |
| The player | to finish the photos and get away | Vesper's stillness | (silent) | caught, and in the guards' path |

## 4. Subtext

- Vesper is not surprised. "A second coat, Barnaby? Streaky." is the first crack in the Mayor's show (the coats ladder,
  rung one). His real interest is the photographer, not the Mayor.
- The Mayor's "That was a different glaze!" is the one line where his joke turns on him.
- "Nice hat." is curiosity, not yet a threat (hat ladder, rung one). The full threat comes in `tax-break-in-intro`.

## 5. Beat sheet

| # | Time | Beat | What happens |
| --- | --- | --- | --- |
| 1 | 0.0-4.0 | Hook | The Mayor, mcu, over the ledger: "The median leases, Vesper. Every one signed in ink. Mostly." |
| 2 | 4.0-6.0 | The hand-over | The ledger and the sealed letter change hands between the two (`give`), and the scene settles. |
| 3 | 6.0-8.3 | Vesper, first seen | The villain stinger and his theme. Low, still, alone in frame: "A second coat, Barnaby? Streaky." |
| 4 | 8.3-9.5 | The flash | The player's camera (`shutter`), a shake, a pause. |
| 5 | 9.5-11.7 | Caught | The Mayor: "That was a different glaze!"; the player's reaction (pause). |
| 6 | 11.7-16.0 | The turn | The guards turn on the player. Vesper: "Gentlemen. We have a photographer." |
| 7 | 16.0-18.9 | Button | Silence (music out); a low close-up; the hat tipped: "Nice hat." Then the chase music and the guards running. |
| 8 | 18.9-23.4 | After the button | The player, medium, the guards coming in. The scene ends on the chase. |

## 6. Shot list

| # | Shot | Lens / distance | Move | On | Motivation |
| --- | --- | --- | --- | --- | --- |
| 1 | `LEDGER.single('mayor','mcu')` | 35 | locked | the Mayor | the hook is his line |
| 2 | `give` ledger, sealed letter | (no cut) | | the two | the handover is an action |
| 3 | `LEDGER.single('vesper','mcu',{height:'low'})` | 35, low | locked | Vesper | the first look at him: from below, alone |
| 4 | `cut` from the player's camera position at 1.0 m | 50 | locked | Vesper | the photograph; a flash cut held for 1.2 s |
| 5 | `LEDGER.single('mayor','mcu')` | 35 | locked | the Mayor | caught |
| 6 | `reaction('player')` | 35 | locked | the player | the audience's seat |
| 7 | `face` both guards to the player; `LEDGER.single('vesper','mcu',{height:'low'})` | 35, low | locked | Vesper | "We have a photographer." |
| 8 | music out; `LEDGER.single('vesper','cu',{height:'low'})` | 30, low | locked | Vesper | the threat, close and still |
| 9 | `shot('player','ms',{toward:'vesper'})` | 40 | locked | the player | the guards come into the frame |

Sides of the line: the Mayor and Vesper on `coverage('mayor','vesper', 1)` for every line. No crossings. The guards are
never in a line, so there is no line to cross.

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Mayor | The median leases, Vesper. Every one signed in ink. Mostly. | the hook: a deal with a joke in it |
| Vesper | A second coat, Barnaby? Streaky. | the coats ladder, rung one; kept word for word |
| Mayor | That was a different glaze! | the one line where his joke goes wrong; kept |
| Vesper | Gentlemen. We have a photographer. | sets the guards on the player |
| Vesper | Nice hat. | hat ladder, rung one: curious, nothing more; said alone (no repeat-line) |
| ~~Vesper~~ | ~~Nice hat. Shame if it cracked.~~ | cut here: the full threat is `tax-break-in-intro`, the one time; repeating it here would waste the rung |
| ~~Mayor~~ | ~~The median leases... (old) / a second coat...~~ | kept only as above |

Names checked: `npm run lore -- find "Vesper"`, `"Mayor"`, `"Patio Heights"`, `"Glaze"` and ruling R-071 (the hat line).

## 8. Music and sound

| Time | Cue | Why |
| --- | --- | --- |
| 0.0 | `heist` music, `night` ambience, `sky: golden` | the night is lit by the gold of the patio; the heist is the mood of the handover |
| 6.0 | stinger `villain`; music `villain` (fade 0.6) | Vesper's first appearance: his theme, once |
| 8.3 | `shutter` sfx (the camera), `shake` 0.03 | the flash gives them away |
| 16.0 | music out (fade 0.5) | silence before the threat line |
| 17.2 | music `chase` (fade 0.5) as the guards come | the chase begins after the button |

## 9. Blocking and vehicles

- Vesper at (145, -156) facing the Mayor; the Mayor at (151, -156) facing Vesper. Both are closer than the stage marks
  (the stage marks put Vesper 23 m from the Mayor, which no handover can use). The `give` steps need that distance.
- The player at (146, -146) at the edge of the green, facing the gallery.
- Guard A at (157, -158) turns to the player and runs in to (149, -148). Guard B at (166, -158) turns to the player and
  runs to (150, -150).
- The Mayor's and Vesper's parked cars (`vesper-car`, `mayor-ride`) stay on their marks at the gate.
- The player's scene ends with the guards coming in; the player is not walked anywhere (the quest's next objective is the
  cracking).

## 10. The button

Vesper's close-up, still, the top hat tipped: "Nice hat." The silence before it is the threat; the chase music and the
guards running in are the answer. It is the right moment: the first hat line is curious and the first threat in chapter 1
is a compliment.

## 11. Self-check

- [x] Want, obstacle, turn: the handover against the flash; the Mayor caught; the guards turn.
- [x] Hook at 0 s on a character (the Mayor's ledger line); no narration.
- [x] Every line under 16 words (longest 11); nobody says what the picture shows.
- [x] Voices: the Mayor's bluster, Vesper's slow complete sentences (no contractions, no exclamation marks), the player silent.
- [x] Vesper is framed low, alone, still; no handheld on him; never in a two-shot with the player.
- [x] One side of the line (`coverage('mayor','vesper', 1)`) for the whole exchange.
- [x] Music: `heist`, then Vesper's `villain` (his theme), out for the threat, then `chase` for the guards. Two stingers at most (one: `villain`; `shutter` is an sfx, not a stinger).
- [x] Ladders: the coats (Vesper's "Streaky", kept word for word); the hat (rung one, "Nice hat." alone).
- [x] Night scene lit: `sky: 'golden'`.
- [x] Checker: all shots pass; the camera-in-actor fault is fixed (the flash moved to 147.5, -143.5).
- [x] `direction.notes` points here.
Intro cards: Mayor Mulch on a cu after the ledger line; Vesper right after "Nice hat." (before the chase music).
