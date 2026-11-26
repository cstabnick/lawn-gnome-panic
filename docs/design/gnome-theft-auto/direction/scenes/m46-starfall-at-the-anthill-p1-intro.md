# Director's notes: `m46-starfall-at-the-anthill-p1-intro`

Watch it at `http://localhost:5310/?no-intro&cutscene=m46-starfall-at-the-anthill-p1-intro`.

| | |
| --- | --- |
| Scene | `m46-starfall-at-the-anthill-p1-intro` in `src/cutscene/scenes/story/m46-starfall-at-the-anthill.ts` |
| Played by | quest `m46-starfall-at-the-anthill-p1` (Night Class) as its intro, taken from Professor Sextant (giver `betony-library`) |
| Kind and length | `intro`, aim 30-60 s; 58.3 s, no faults |
| Where, when | stage `rootwell-library-steps` (the Long Shelf's front steps, the quad gate below); night, `sky: 'night'` |
| Before / after | before: Rootwell Admissions (row 45): Betony on these steps at dusk, "the lens that reads it is still up there". After: cross the quad in the gown to the Anthill's north door (checkpoints) |

## 1. Purpose in the story

Opens act III's one long adventure and says what the guidance part is, in a picture: two stars, a line between them,
the Combine cutting along it. Gives the player the disguise (the gown hides the hat) and tests it at once on the Dean,
who passes the player without looking, which plants his guilt for p3's work order.

## 2. The player's feeling

- **In:** curious, a little out of place at a university at night.
- **Out:** in on a caper with a professor; the Dean is a joke, and also the one who let them in.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Betony | get the player to the Anthill unseen tonight | the Dean on his rounds; the hat | explains in figures, then a gown | says out loud what she thinks of the Dean |
| Lovage | the quad tidy, the optics managed | a colleague out late with a stranger | smooth committee-speak, a goodnight | none: he never looks, which is the point |
| Player | understand the job | | questions | wearing a gown |

## 4. Subtext

Betony is not a rebel; she wants her work back the way a person wants a borrowed book back. The Dean signed it away
and cannot look at anything that reminds him: the lantern stops a hand short of the hat because he does not want to see.

## 5. Beat sheet

| # | Beat | What happens (picture first, then words) |
| --- | --- | --- |
| 1 | Hook | Rootwell's signature: the library dead centre on the quad axis, one window lit; the night bell |
| 2 | Setup | Betony looking past the player at the sky: "They have the survey. Tonight they read it, through my lens." |
| 3 | The Even Line | She points; the crane rises over the quad to the Anthill and its little lit dome (the act's high wide); the Dean's lantern starts up the path below. "And the Combine?" "Cuts along it. The line is level. That is the whole problem." |
| 4 | The gown | Insert: the folded gown handed over. "Faculty walk the quad at night. Hats do not." "Over the hat?" "Professors have hats too. Some of us have two." |
| 5 | Turn | Gravel at the gate; music out; the Dean with his lantern, low. "With a colleague?" "A visiting astronomer, Dean. Very mature." The lantern swings to the player and stops short. "We must be mindful of the optics. Goodnight." |
| 6 | Button | Betony: "He never looks at anything he has signed." The player's nod |

## 6. Shot list

| # | Shot | Lens | Move | On | Motivation |
| --- | --- | --- | --- | --- | --- |
| 1 | `spot` library-axis | 50 | locked | the library front | the area's signature shot, symmetrical |
| 2-3 | `coverage(betony, player)` singles mcu | 35 | locked | the first exchange | |
| 4 | Betony ms | 40 | locked | the point | her arm in frame |
| 5 | dolly up from 6 m to 16 m, panning to the Anthill | 54 | crane | the quad, the Anthill | batch-3 6.4: the Anthill from the quad, one of the five crane wides |
| 6-7 | Betony mcu, then `pushIn` | 35 | push on "the whole problem" | the thesis | a decision |
| 8 | `insert` on Betony's hands | 30 | locked | the gown | the prop of the quest |
| 9-11 | singles mcu | 35 | locked | the hat gag | |
| 12 | `spot` gate | 40 | locked | the lantern at the gate | the threshold |
| 13-16 | `coverage(lovage, betony)` singles; Lovage low | 35 | locked | the exchange | he holds the power on his quad |
| 17 | `two('fs')` | 45 | locked | the Dean gliding off | the gag held wide |
| 18 | Betony mcu + player reaction | 35 | locked | the button | |

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Betony | They have the survey. Tonight they read it, through my lens. | the previously-line and the stakes in one breath |
| Betony | Two stars at the horizon. The lens draws a line between them. | the Even Line, said in figures |
| Player | And the Combine? | the straight man's question |
| Betony | Cuts along it. The line is level. That is the whole problem. | her line from characters.md |
| Betony | Some of us have two. | the gag comes from character (precise, a little vain) |
| Lovage | We must be mindful of the optics. Goodnight. | his voice; he never answers a question |
| Betony | He never looks at anything he has signed. | the button, and the plant for p3's work order |

Lore: `find Even Line`, `find gown`, `find Long Shelf`; the gown is `faculty-gown` (the achievement's reward), nothing new named.

## 8. Music and sound

`night` bed and `mystery` from the first frame; the night `bell`; `creak` (the lantern handle) and `crunch` (gravel)
for the Dean; `cloth` on the gown. Music out before the Dean speaks, back in as he leaves.

## 9. Blocking and vehicles

Betony on the bottom step (1111.6, -271.5), the player on the path below (1108.6, -269.6). The Dean starts on the quad
path (1110.5, -247), walks his round to the gate (1110.5, -264.4), then a few steps back down the path. Night lighting: the Dean's
`night-shift-lantern` is the practical light; Betony's white beard is the pale foreground. No vehicles.

## 10. The button

Betony's verdict on the Dean, then the player's nod: the caper is on, and the Dean is the reason it has to be.

## 11. Self-check

- [x] Want (the lens), obstacle (the Dean, the hat), turn (the Dean at the gate).
- [x] Hook by 0 s: the signature shot and the bell.
- [x] Lines under 16 words; Betony's figures, the Dean's committee-speak, the player's questions.
- [x] Betony and Lovage are carded in row 45: no intro card here.
- [x] The crane is one of the act's five.
