# Director's notes: `sq-porcelain-blues-outro`

| | |
| --- | --- |
| Scene | `sq-porcelain-blues-outro` in `src/cutscene/scenes/side/porcelainBlues.ts` |
| Played by | quest `sq-porcelain-blues` as its payoff (the player is back at the porch, on foot or in a vehicle) |
| Kind and length | `outro`, aim 15-45 s; now 39.4 s (was 95.7 s, the longest scene in the game, 13 faults) |
| Where, when | stage `tall-house-porch`, `sky: 'golden'` |
| Before / after | before: `sq-porcelain-blues-ledger`, the drive back. After: the CONTRACT COMPLETE banner |

## 1. Purpose in the story

The payoff, played sincerely: the lanterns come home, and the thing in the house answers. It must land the one quiet
emotional beat of the quest (Clara's relief), then end on dread rather than a reward speech. The quest's doneText says
the porch door is sealed, so the lanterns go to the door, not back on the hooks.

The old scene held one wide for 78 s while Clara walked to three hooks counting out loud, with lanterns spawning on top
of the set lanterns that were already there (nothing visibly changed).

## 2. The player's feeling

- **In:** a job done, expecting thanks.
- **Out:** moved for a second, then cold: the house is closer to the door than it was.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Clara | to seal the door before dark | her own fear of it | does the job herself, quietly; thanks with a gift, not with words | steps back from the door she just sealed |
| The player | to see it through | none | hands over, asks one question | knows there are people still inside |

## 4. Subtext

- "Now the ones still inside can find the door." The lanterns are for the refugees still in the house. The knock may be
  one of them, or may not.
- "Enough." Clara will not count them out loud; she was one of them.

## 5. Beat sheet

| # | Time | Beat | What happens |
| --- | --- | --- | --- |
| 1 | 0.0-2.0 | Hook | A lantern chinks into frame in the player's hand; Clara turns before she believes it. |
| 2 | 2.0-8.0 | Setup | "You came back. With all three."; the player's dry line. `warm` in. |
| 3 | 8.0-19.0 | The work | The hand-over; Clara walks to the boarded door; three lanterns set down, three chinks (the sound is the count). |
| 4 | 19.0-31.5 | The sincere beat | Music out. CU: "Now the ones still inside can find the door."; held silence; "How many are still in there?"; "Enough. Take my charm..." |
| 5 | 31.5-36.0 | Turn | The knock, closer, from behind the lanterns; she flinches back; `mystery` sting; "That was closer." |
| 6 | 36.0-39.4 | Button | Slow push on the house: three small lights at a boarded door. |

## 6. Shot list

| # | Shot | Lens | Move | On | Motivation |
| --- | --- | --- | --- | --- | --- |
| 1 | `shot('clara','ms',{toward:'you',side:35})` | 40 | locked | Clara | she hears the chink first |
| 2, 3 | `PORCH_TALK` singles (MCU) | 35 | locked | Clara / the player | the greeting |
| 4 | `shot('clara','fs',{side:70})` | 45 | locked | Clara walking | the walk to the door, kept short |
| 5 | cut, low on the door's foot | 40 | locked | the three lanterns | the sealing, as inserts |
| 6-8 | CU / MCU singles | 30-35 | locked | Clara / the player | tenderness: eye level, long holds |
| 9 | `shot('clara','ms',{side:130,height:'low'})` | 40 | locked | Clara and the door | the knock and her step back |
| 10 | dolly toward the door | 42 | slow push | the house | the button |

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Clara | You came back. With all three. | was "...Nobody comes back from the Mossy Wood trail with all their hats." (a gag) |
| The player | The scavengers send their regrets. | the straight man's one dry line, before the sincere beat |
| Clara | Now the ones still inside can find the door. | the sincere beat; was "Now the refugees can find the way home" (said what we knew) |
| The player | How many are still in there? | |
| Clara | Enough. Take my charm. It is the only thing of mine never cracked. | the gift, moved here from the intro |
| Clara | That was closer. | kept: the button line |
| ~~Caption~~ | ~~The lanterns go back up.~~ | cut: the picture does it |
| ~~Clara~~ | ~~One. / Two. / Three. Look at them, all lit...~~ | cut: the chinks count |
| ~~Clara~~ | ~~...Keep it dry, and away from the toaster.~~ | cut: a gag in the sincere beat |

## 8. Music and sound

| Time | Cue | Why |
| --- | --- | --- |
| 0.0 | `wind`; `glass` chink | the hook is the sound of porcelain arriving |
| 2.0 | `warm` (1.5) | relief |
| 13-17 | three `glass` chinks at the door | the count |
| 19.0 | music out (0.8); held silence after her line | the sincere beat |
| 31.5 | `knock` (full), shake 0.05, `mystery` sting | the turn |
| 36.0 | `mystery` back (1.5) | the button |

## 9. Blocking and vehicles

- The player's vehicle (`from: 'player'`, fallback Lowrider) is parked off the porch at (-546, 26); the player starts on
  foot at (-539, 37) holding a lantern and walks to (-542.5, 39.5).
- Clara from her mark to the door (-550.2, 40), facing it to set the lanterns at (-551.8, 37.6), (-551.6, 40),
  (-551.8, 42.4), then turns to the player.

## 10. The button

Three small lights at the foot of a boarded door, and the camera easing toward it after the knock. Right because the
quest was about keeping that door lit, and it is now lit, and something on the other side knows.

## 11. Self-check

- [x] Want, obstacle, turn (the knock, closer).
- [x] Hook (the chink) at 0 s; no narration.
- [x] Lines under 16 words.
- [x] Clara sincere; no gags on her lines; the player's one dry line comes before the sincere beat.
- [x] Speakers MS or closer, facing the camera.
- [x] One held silence; one sting; music changes motivated.
- [x] Golden sky; the button shot looks at the lit door, not under the porch roof.
- [x] Report OK; out of the baseline.
- [x] `npm test` passes; watched at desktop size.
- [x] `direction.notes` points here.
