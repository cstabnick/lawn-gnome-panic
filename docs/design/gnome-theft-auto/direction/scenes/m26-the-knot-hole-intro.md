# Director's notes: `m26-the-knot-hole-intro`

Watch it at `http://localhost:5310/?no-intro&cutscene=m26-the-knot-hole-intro`.

| | |
| --- | --- |
| Scene | `m26-the-knot-hole-intro` in `src/cutscene/scenes/story/m26-the-knot-hole.ts` |
| Played by | quest `m26-the-knot-hole` ("The Knot-Hole") as its intro, given at Side-Valve Salvage |
| Kind and length | `intro`, aim 30-60 s; now 31.0 s at Normal text speed, no faults |
| Where, when | stage `side-valve-bay` (the apron and the bench); dusk, `sky: 'golden'`, `turfton-dusk`, radio nearly off |
| Before / after | before: the tablet (row 23) and the one-leg sermon (row 25); Pip has not been himself since. After: the player drives him to the Fence gap in Mossy Wood |

## 1. Purpose in the story

Act II's sincere beat for Pip (the bible's arc: "ch2 shamed by Bracken in Mossy Wood, the first time he goes quiet"). This scene
shows the quiet without explaining it: the loudest gnome in Turfton with nothing in his hands and nothing to say. It sets up
the Knot-Hole as something Pip chose. It does not say what the vial is, or what he wants to see.

## 2. The player's feeling

- **In:** the tablet is behind them; Pip has been quiet for days and the crew has stopped asking.
- **Out:** worried, and a little honoured to be asked. Sure of the job: drive Pip to the Fence gap.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Pip | to be driven to the Fence gap before he loses his nerve | his own mouth, which has stopped | jokes at himself ("saving my voice"), a fast ask so it cannot be refused | stands with the toolbox in both arms, looking west |
| The player | to find out what is wrong | Pip's deflection | one dry observation | takes the job on one word: "Now?" |
| Cam | to sweep the apron | nothing | the broom | stops sweeping when Pip does not answer |

## 4. Subtext

- "I have a lot of voice" is Pip admitting he has not been speaking because something is pressing on it, said as a joke.
- "Before I talk myself out of it" is the sincere line, with the joke's shape left on it as a handrail.
- Pip never says "Okay, hear me out." Its absence is the news; it comes back in the quest's drive home.

## 5. Beat sheet

| # | Time | Beat | What happens |
| --- | --- | --- | --- |
| 1 | 0-2.4 | Hook | Pip's fingers drumming on his knee with nothing in them; the tap is the sound |
| 2 | 2.4-5 | Setup | The bay at dusk; Cam sweeps behind; Pip a small shape on a crate |
| 3 | 5-12 | The question | "You have been quiet since the tablet." "I am saving my voice. I have a lot of voice." |
| 4 | 12-14 | Reaction | Cam stops sweeping and looks |
| 5 | 14-24 | Turn | Pip: the Fence gap, tonight. "Now?" "Before I talk myself out of it." |
| 6 | 24-31 | Button | The toolbox in both arms; he faces west; a slow push-in |

## 6. Shot list

Insert (cu, high) on Pip, wide `spot('side-valve-bay','wide')`, then `coverage('player','pip')` singles for every exchange (one
side of the line), a mcu of Cam, and a `pushIn` on Pip as the button.

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Player | You have been quiet since the tablet. | straight man; no accusation |
| Pip | I am not quiet. I am saving my voice. | deflection |
| Pip | I have a lot of voice. | the joke that is not a joke |
| Pip | Sorrel records the rain at the Fence gap tonight. I want to go. Drive me? | the objective, in his hurry |
| Player | Now? | one word |
| Pip | Before I talk myself out of it. I could. I am very good at it. | the sincere line with a joke on its back |

## 8. Music and sound

`turfton-dusk` (the crew's world, slowed); `street` bed; radio at 0.05 (the bench radio is off). `tap` x2 (the hook), a broom
`rustle`, a `clatter` when the broom stops. No stinger.

## 9. Blocking and vehicles

Pip on his crate at (-135.5, 74); the player walks in from (-147, 73.6) to (-140.8, 73.5); Cam sweeps at (-157..-153, 68). The
shut toolbox (`glaze-extra-toolbox`) at his boot. No vehicles.

## 10. The button

Pip with the toolbox in both arms, facing the dark west, and a slow push-in that gives him nothing to say. The quest then asks
the player to drive.

## 11. Self-check

- [x] Want, obstacle, turn; the objective is said by Pip, in his own voice.
- [x] Hook in 3 s on a picture and a sound. No narration.
- [x] Every line under 16 words (longest 15); no coordinates; one place name.
- [x] Voices: Pip fast, with the tic missing; the player dry.
- [x] One side of the line per conversation (coverage).
- [x] Checker: no faults. `direction.notes` points here.
