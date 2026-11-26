# Director's notes: `m26-the-knot-hole-mid`

Watch it at `http://localhost:5310/?no-intro&cutscene=m26-the-knot-hole-mid`.

| | |
| --- | --- |
| Scene | `m26-the-knot-hole-mid` in `src/cutscene/scenes/story/m26-the-knot-hole.ts` |
| Played by | quest `m26-the-knot-hole`, objective 2 (hold the action button at the knot-hole), when the hold completes |
| Kind and length | `arrival`, aim 10-35 s; now 24.7 s, no faults, no lines |
| Where, when | stage `knot-hole-recording` (the old west fence in Mossy Wood, a few metres from Nora's post); night, `sky: 'night'` |
| Before / after | before: the drive west, Pip silent. After: the drive home, where Pip is talking again (the laugh) |

## 1. Purpose in the story

The sincere centre of the act's middle run: Pip looks at what he left (and does not say what it is), takes out the vial of
Fescue soil, and does not pour it. Silent: no dialogue, no music, no gag, no stinger. It must not say what the vial holds
beyond that it is Fescue soil, nor what lies beyond the Fence.

## 2. The player's feeling

- **In:** worried for Pip, and holding a button for six seconds that feels like holding a breath.
- **Out:** quiet. A friend has been shown something he will not explain, and the player has been trusted to stand there.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Pip | to look, and to decide what to do with the vial | years of not looking | walks slowly; takes the vial out; opens it; closes it | does not pour it |
| Sorrel | to record the rain and let him have it | her own wish to speak | silence; headphones on and off | puts the headphones back on |
| The player | to be there | nothing | stillness | witness |

## 4. Subtext

Everything is in what is not done: not pouring is the whole scene. The rain is a sound from the other side of the boards that
never falls on this side. Nothing explains the amber glow.

## 5. Beat sheet

| # | Time | Beat | What happens |
| --- | --- | --- | --- |
| 1 | 0-2.2 | Hook | A creak of cedar; three small figures under a tall fence, a knot glowing above them |
| 2 | 2.2-7.5 | Walk | Pip walks the last few paces, slowly; footsteps |
| 3 | 7.5-10 | The look | Up at the glowing knot; the far rain comes up under it |
| 4 | 10-12 | Sorrel | Her recorder clicks; she nods once |
| 5 | 12-14 | The vial | Insert on his hands; the vial is out |
| 6 | 14-17.5 | Open | The stopper pops; he leans over it; silence (once) |
| 7 | 17.5-19 | The witness | The player's face |
| 8 | 19-21 | Closed | The stopper back in; he did not pour it |
| 9 | 21-22.5 | Sorrel | Headphones back on |
| 10 | 22.5-24.7 | Button | The wide again, the three of them under the fence |

## 6. Shot list

`spot('knot-hole-recording','wide')` (hook and button), `frame` fs on Pip walking (camera on his far side from the crate),
`spot(...,'glow')` low up at the knot, Sorrel mcu, `insert('pip')`, Pip mcu and cu, the player mcu, Sorrel mcu low. Ten shots,
none held longer than the checker allows.

## 7. Dialogue pass

None. There is no line anywhere in the scene.

## 8. Music and sound

No music. `night` bed, then `rain` fades in over 3 s at the look (a rain heard from beyond the boards). Foley: `creak` (x3),
`footsteps`, `latch` (x3), `cloth` (x2), `pop` (x2). No stinger.

## 9. Blocking and vehicles

Knot at (-594.4, -120), 4 m up the old fence. Pip walks from (-584.8, -122.6) to (-589.8, -122), a pace from the crate; Sorrel
at (-587, -117.2) by her microphone; the player at (-587.6, -124). No vehicles.

## 10. The button

The wide: three small shapes under a tall fence, the rain going on. Nothing is said before or after in the scene.

## 11. Self-check

- [x] No music, no joke, no stinger; one held silence; no explanation.
- [x] The vial holds Fescue soil and no more is said; nothing is said of what is beyond the Fence.
- [x] No speaker, so no facing faults; cameras clear the crate and the fence colliders (scenes.test).
- [x] Checker: no faults. `direction.notes` points here.
