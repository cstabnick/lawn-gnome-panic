# Director's notes: `m30-cams-big-night-outro`

Watch it at `http://localhost:5310/?no-intro&cutscene=m30-cams-big-night-outro`.

| | |
| --- | --- |
| Scene | `m30-cams-big-night-outro` in `src/cutscene/scenes/story/m30-cams-big-night.ts` |
| Played by | quest `m30-cams-big-night` as its outro, after Cam is dropped at the storeroom door |
| Kind and length | `outro`, aim 15-45 s; now 23.8 s |
| Where, when | stage `side-valve-apron`, night, `sky: 'night'` |
| Before / after | before: the drive home from the Speedway; after: the credits of the quest; the envelope is not seen again until row 34 |

## 1. Purpose in the story

The envelope: a man in a beige vest hands Cam a racing-charter envelope and says nothing. The player sees it and does not
understand. It is the first sight of the sale (bible: Cam sells the crew out from chapter 2) and it must be a small,
silent moment. It also closes his night with the broom: he sweeps, a little slower.

## 2. The player's feeling

- **In:** fond of Cam after his last place.
- **Out:** a small chill they cannot name; the beige of Patio Heights where it should not be.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Cam | to take the envelope without anyone knowing what it is | the player is standing right there | flat deflection ("Parts.") | says it is nothing |
| The vest | to hand it over | none | silence, a tip of the hat | leaves |
| The player | to understand | Cam's flat answer | one look | knows something happened |

## 4. Subtext

"Last is still finished" is Cam's one hope. "Parts. Nothing." is a lie said too quickly. The vest's silence is the HOA's
idea of manners.

## 5. Beat sheet

| # | Time | Beat | What happens |
| --- | --- | --- | --- |
| 1 | 0-4 | Hook | The apron at night, the bay lamp; Cam thanks the player. |
| 2 | 4-12 | Setup | "You finished." "Last is still finished." |
| 3 | 12-18 | Turn | Footsteps; Cam's eyes go past the player; the vest steps in and tips his hat. |
| 4 | 18-22 | Beat | The envelope changes hands: an insert, a stinger. The player's look. |
| 5 | 22-30 | Button | "Parts. Nothing. Thanks again." The broom comes up; Cam sweeps, slower. |

## 6. Shot list

| # | Shot | On | Motivation |
| --- | --- | --- | --- |
| 1 | `spot(apron-night)` | the apron | establishing at night |
| 2 | `HANDOVER` singles | Cam, player | the thanks; the exchange on one side of the line |
| 3 | `shot('cam','cu')` | Cam's eyes | the turn: he sees something over the player's shoulder |
| 4 | `shot('vest','ms', low)` | the vest | a low, polite threat |
| 5 | `insert('cam')` | the envelope | the object, 1-2 s |
| 6 | reaction `player` (think) | the player | they saw it |
| 7 | `pushIn('cam','ms', low)` | Cam | the broom and the slower sweep |

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Cam | Thanks. For the stint. | |
| Player | You finished. | |
| Cam | Last is still finished. | the hope |
| (vest) | none | the man says nothing |
| Cam | Parts. Nothing. Thanks again. | the lie |

## 8. Music and sound

| Time | Cue | Why |
| --- | --- | --- |
| 0 | `mystery` music, `night` ambience | quiet, uneasy |
| 12 | `footsteps` from the dark | the vest arrives |
| 18 | `paper`, `mystery` stinger | the handover |
| 26 | `crunch` | the broom |

## 9. Blocking and vehicles

Player at (-149.4, 72.4), Cam at (-153.4, 72.4). The vest comes from (-170, 77) to (-157.4, 73.4) and leaves the same way. No vehicles. Props: the `sealed-letter` (the envelope), held by the vest and then Cam.

## 10. The button

Cam, low and medium, sweeping the apron under the bay lamp at a slower pace than at the start of the quest. The sound is the broom.

## 11. Self-check

- [x] Want, obstacle, turn, button.
- [x] No gag on the handover; the one joke is "Last is still finished", sincere.
- [x] Every line under 12 words.
- [x] The envelope is shown and not explained.
- [x] One side of the line.
- [x] Night scene lit by the bay lamp.
- [x] `npm run cutscene-report` OK; `direction.notes` points here.
