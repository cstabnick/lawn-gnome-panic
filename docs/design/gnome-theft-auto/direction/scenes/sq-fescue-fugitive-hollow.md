# Director's notes: `sq-fescue-fugitive-hollow`

| | |
| --- | --- |
| Scene | `sq-fescue-fugitive-hollow` in `src/cutscene/scenes/side/fescueFugitive.ts` |
| Played by | quest `sq-fescue-fugitive` as its outro on the honest ending (option A: the stone back in the ring) |
| Kind and length | `outro`, aim 30-45 s, max 60 s; now about 40 s at Normal text speed (was 55.9 s, 7 faults) |
| Where, when | stage `unmowed-hollow` (Mossy Wood), dusk held at `sky: 'golden'` |
| Before / after | before: the drive back from Patio Heights with the stone. After: the quest is complete; the player is free to go |

## 1. Purpose in the story

The honest payoff. The stone goes back in the ring, Bracken forgives the player, and the blessing is given. It closes the
ritual that the intro opened, and it pays off Bracken's "question" (the replica answers it, and the ring answers back).

The old scene had a 14 s moving track on the lowrider, a 15 s wide, a shot with the player's back to the camera, a
Bracken single at 24%, and a 17-word forgiveness line.

## 2. The player's feeling

- **In:** relieved, a bit ashamed (they drove here), with the stone in their hands.
- **Out:** forgiven, and a little humbled. The stone is home; the old man is at peace; the moss is still to be minded.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Bracken | to put the stone in the ring | the replica is only a replica | ritual: the stone set, the bow | from the stone's arrival to the forgiveness and the blessing |
| Sorrel | to keep the radio on the frequency | nothing | calm, one line | none |
| The player | to be forgiven and go | their own engine | short thanks | accepts the blessing |

## 4. Subtext

- Bracken forgives the player because the stone matters more than the player's car; the forgiveness is a rule, not a gift.
- The fire flares because the ring answers: the replica is good enough for the ring. The old man's sincerity is the twist.

## 5. Beat sheet

| # | Time | Beat | What happens |
| --- | --- | --- | --- |
| 1 | 0.0-3.0 | Hook | Low MS of Bracken and the fire as the player climbs out of the lowrider. |
| 2 | 3.0-12.0 | Setup | "It's a replica." / "It is a replica of the thing that jammed the Mower. Give it here." The stone is given. |
| 3 | 12.0-22.0 | Turn | Bracken walks to the ring; the stone is set; the thud, the triumph stinger, the fire whoosh, Bracken's bow. |
| 4 | 22.0-35.0 | Forgiveness | Sorrel's "back in the ring"; "You drove here. I can smell the engine on you." / "Sit by the fire and be forgiven." A held silence. "Thanks." |
| 5 | 35.0-40.0 | Button | "The blessing is yours. The acorns are under the moss." Low CU of Bracken: "Mind the moss." Held 2.5 s on the ring. |

## 6. Shot list

| # | Shot | Lens / distance | Move | On | Motivation |
| --- | --- | --- | --- | --- | --- |
| 1 | `shot('bracken','ms',{toward:'you',side:40,height:'low'})` | 40 | locked | Bracken | the hook: the fire on his face |
| 2 | `HOLLOW_TALK.single('you','mcu')` | 35 | locked | the player | the replica line |
| 3 | `HOLLOW_TALK.single('bracken','mcu',low)` | 35 | locked | Bracken | the rule of the stone |
| 4 | `shot('sorrel','mcu',{toward:'bracken',side:-30})` | 35 | locked | Sorrel | the radio's dry calm |
| 5 | `HOLLOW_TALK.single('bracken','mcu',low)` | 35 | locked | Bracken | the forgiveness |
| 6 | `beat('silence')` on the forgiveness | | | | the held silence |
| 7 | `HOLLOW_TALK.single('you','mcu')` | 35 | locked | the player | "Thanks." |
| 8 | `shot('bracken','cu',{toward:'you',side:25,height:'low'})` | 34 | locked | Bracken | the button |

Side of the line: Bracken and the player on `coverage('bracken','you',1)`. The stone, the ring and the fire are seen from
the same side.

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| The player | It's a replica. | the straight man; shot from the front (was from behind) |
| Bracken | It is a replica of the thing that jammed the Mower. Give it here. | unchanged (15 words) |
| Sorrel | That is the stone, back in the ring. Eighty-eight point seven. Dial it in. | her calm; was a radio aside, now said on her mark |
| Bracken | You drove here. I can smell the engine on you. | was 17 words, split at the engine |
| Bracken | Sit by the fire and be forgiven. | the forgiveness, split from the first half |
| The player | Thanks. | |
| Bracken | The blessing is yours. The acorns are under the moss. | the reward, the button's setup |
| Bracken | Mind the moss. | the button |
| ~~Caption~~ | ~~Unmowed Hollow. The stone comes home.~~ | cut: the stone and the fire say it |

Names checked: `npm run lore -- find "stopping stone"`, `find bracken`.

## 8. Music and sound

| Time | Cue | Why |
| --- | --- | --- |
| 0.0 | `forest` ambience, `fescue` music | the hollow's theme |
| 12 | `thud` sfx at the ring stone | the stone is set |
| 13 | `triumph` stinger, a small shake (0.02), `whoosh` at the fire | the ring answers |
| 35 | the silence after "be forgiven" (held 2 s) | the one held silence |

## 9. Blocking and vehicles

- The player's lowrider stands at (-332, 26), facing the hollow. The player climbs out and walks to (-345, 36).
- Bracken stands at (-349, 38.5), walks to the ring stone point (-349, 34) to set the stone, and bows.
- Sorrel sits on her mark (-346, 44), facing Bracken.
- The jar-carrier walks the jar loop behind the fire throughout (not on screen for the lines).
- The player ends at the fire, by Bracken; the lowrider is the player's own.

## 10. The button

Bracken, low and close, saying "Mind the moss," with the stone in the ring behind him, still. It is right because the
ritual ends on a rule: the moss is still there and the player must mind it.

## 11. Self-check

- [x] Want, obstacle and turn (the stone set in the ring).
- [x] Hook in 1 s: the fire and a low old man.
- [x] Every line under 16 words (longest 15).
- [x] Bracken sincere and measured; Sorrel calm; the player short.
- [x] Every speaker framed MS or closer, facing the camera.
- [x] One side of the line.
- [x] Music: `fescue` through; one triumph stinger; one held silence.
- [x] Dusk held at golden; the fire is the light.
- [ ] Report OK and removed from `pacing.baseline.ts` (the planner removes the baseline entry).
- [ ] Watched at 960x600 and 390x844 (see the worker report).
- [x] `direction.notes` points here.
