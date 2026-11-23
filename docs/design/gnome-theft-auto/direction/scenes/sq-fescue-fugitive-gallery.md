# Director's notes: `sq-fescue-fugitive-gallery`

| | |
| --- | --- |
| Scene | `sq-fescue-fugitive-gallery` in `src/cutscene/scenes/side/fescueFugitive.ts` |
| Played by | quest `sq-fescue-fugitive` as its arrival at Vesper's gallery (the visit objective, the stone on the plinth) |
| Kind and length | `arrival`, aim 30-40 s, max 45 s; now about 33 s at Normal text speed (was 68.5 s, 12 faults) |
| Where, when | stage `patio-gallery` (Patio Heights, Turfton), dawn held at `sky: 'golden'` |
| Before / after | before: the drive into the compound, Zero-Turns on the lawn. After: the chase out through the gate; the Granny choice |

## 1. Purpose in the story

A heist in deadpan. The player is the visitor who is not on the list, and the grab is the first crime of the quest. It
also gives the player the two ways to spend the stone (the hollow for thanks, the barn for cash): Granny's line on the
phone is the hand-off to the next scene.

The old scene opened on an 8.7 s wide, had one speaker at 13% of the frame, a speaker with his back to the camera, a
23 s hold on the grab wide, and a 23-word line from Granny.

## 2. The player's feeling

- **In:** casual, a little nervous (a gallery, a green, two guards).
- **Out:** caught, with the stone in their hands, the alarm going, and a voice on the phone that wants it.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Guard 1 (Porcelain) | to keep the visitors out | the visitor is not on the list | a formal challenge, then a flat order | from a list to an alarm |
| Guard 2 (Porcelain) | to keep the list correct | nothing | arms crossed; the one-line verdict | none |
| Granny Gnertrude (phone) | to have the stone for cash | the player's choice | a price, two options, no pleasantries | none; the choice is made |
| The player | to get the stone | two guards | a flat question, then a run | leaves with the stone |

## 4. Subtext

- The guards are porcelain and deadpan: they are not cruel, they are procedure. Guard 1's "That is a doorstop" is the same
  joke the bible allows once a scene: the stone is a doorstop to them too.
- Granny's price is the real temptation (cash); the hollow is the honest one. The phone line states both plainly.

## 5. Beat sheet

| # | Time | Beat | What happens |
| --- | --- | --- | --- |
| 1 | 0.0-3.0 | Hook | Low, wide, the guards on the north wall; the player walks in; Guard 1: "Sir. Madam. Gnome. Are you on the list?" |
| 2 | 3.0-12.0 | Setup | "I'm a visitor." / "Visitors are on the list. You are not on the list." (Guard 2's arms cross). |
| 3 | 12.0-20.0 | Turn | The grab: the steal sfx, the stone in the player's hands, the danger stinger and the alarm. |
| 4 | 20.0-28.0 | Turn | Guard 1: "Put that down. That is a doorstop." Granny on the phone, off screen: five hundred acorns. |
| 5 | 28.0-33.0 | Button | "Bring it to the hollow for thanks, or my barn for cash." The track on the player legging it through the gate, alarm still going. |

## 6. Shot list

| # | Shot | Lens / distance | Move | On | Motivation |
| --- | --- | --- | --- | --- | --- |
| 1 | `cut` low wide from the north (152, -184, h 1.0) | 40 | locked | the guards | the picture: deadpan, in front |
| 2 | `TALK_GATE.single('guard1','mcu',low)` | 35 | locked | Guard 1 | the challenge |
| 3 | `TALK_GATE.single('you','mcu')` | 35 | locked | the player | the straight man |
| 4 | `shot('guard2','mcu',{toward:'you',side:25,height:'low'})` | 35 | locked | Guard 2 | the verdict |
| 5 | `cut` on the plinth (150, -155, h 1.4) looking at the player | 34 | locked | the player | the grab insert |
| 6 | `TALK_GATE.single('guard1','mcu',low)` | 35 | locked | Guard 1 | "That is a doorstop." |
| 7 | `TALK_GATE.single('you','mcu')` | 35 | locked | the player | the phone call's listener |
| 8 | `track` on the player | 40 | moving | the player | the run, with the alarm |

Side of the line: Guard 1 and the player on `coverage('guard1','you',1)`. Guard 2 is shot on his own side with the
player in the frame (his shot is the same side).

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Guard 1 | Sir. Madam. Gnome. Are you on the list? | the hook; unchanged, the picture first |
| The player | I'm a visitor. | |
| Guard 2 | Visitors are on the list. You are not on the list. | |
| Guard 1 | Put that down. That is a doorstop. | was "Porcelain does not glue back." (used elsewhere); the doorstop joke is the stone's name |
| Granny Gnertrude (phone) | Lovey. Five hundred acorns for that stone. Cash. | was 17 words; split off the choice |
| The player | Who is this? | |
| Granny Gnertrude (phone) | Bring it to the hollow for thanks, or my barn for cash. | was 23 words; the choice said plainly |
| ~~Caption~~ | ~~The gallery placard: nothing on this lawn is for sale, except everything.~~ | cut: the placard is a joke; the guards say it with their faces |
| ~~Granny~~ | ~~The guards are slow, not stupid. Choose quick, lovey.~~ | cut: a second order after the choice |

Names checked: `npm run lore -- find "patio heights"`, `find granny`, `find stopping stone`.

## 8. Music and sound

| Time | Cue | Why |
| --- | --- | --- |
| 0.0 | `street` ambience, `mystery` music | a gallery on the green: the place's theme |
| 12 | `steal` sfx at the player | the grab |
| 13 | `danger` stinger, `alarm` sfx | the alarm, once to start |
| 27 | `alarm` again under the run | the chase |
| 28 | `phone` sfx on Granny's first line | the call |

## 9. Blocking and vehicles

- The player starts on the gallery green at (146, -146) and walks to (145, -151) during the hook.
- Guard 1 stands at (141, -156), facing the player; Guard 2 stands at (166, -158), facing west (the gallery).
- The stone is on the plinth beside the player at the grab; the player holds it.
- The player runs south through the gate: (150, -138) to (150, -118).
- No vehicles in the scene: the player's car is parked by the gate (the quest's pull-up mark).

## 10. The button

The player running through the gate with the stone and the alarm going, the camera tracking them. It is right because the
heist has a result: the player is now a thief, and the next scene is the hollow or the barn.

## 11. Self-check

- [x] Want, obstacle and turn (the grab).
- [x] Hook in 1-3 s: the guards, a picture, then a line.
- [x] Every line under 16 words (longest 15).
- [x] Guards deadpan, Granny sharp; the player's lines short.
- [x] Every speaker framed MS or closer, facing the camera.
- [x] One side of the line for the guards and the player.
- [x] Music changes: `mystery` through, one danger stinger, the alarm.
- [x] No held silence; no waits over 2.5 s without a move.
- [x] Golden sky held; the gallery is lit by the sky.
- [ ] Report OK and removed from `pacing.baseline.ts` (the planner removes the baseline entry).
- [ ] Watched at 960x600 and 390x844 (see the worker report).
- [x] `direction.notes` points here.
