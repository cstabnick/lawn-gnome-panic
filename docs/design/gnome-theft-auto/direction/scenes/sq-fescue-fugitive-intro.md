# Director's notes: `sq-fescue-fugitive-intro`

| | |
| --- | --- |
| Scene | `sq-fescue-fugitive-intro` in `src/cutscene/scenes/side/fescueFugitive.ts` |
| Played by | quest `sq-fescue-fugitive` ("The Fescue Fugitive") as its intro, given at Unmowed Hollow |
| Kind and length | `intro`, aim 45-60 s, max 75 s; now about 50 s at Normal text speed (was 85.3 s, 14 faults) |
| Where, when | stage `unmowed-hollow` (Mossy Wood), dusk held at `sky: 'golden'` |
| Before / after | before: the drive west into Mossy Wood, the birds. After: the gallery job at Patio Heights, `sq-fescue-fugitive-gallery` |

## 1. Purpose in the story

A folk ritual that makes the player the outsider. Bracken sets the rule of the hollow (you do not step on the moss), and
the job: take the replica Stopping Stone from Vesper's gallery and bring it back to the ring. It plants Granny's bid
(the two endings) and the dry on-air voice of Sorrel. Bracken's last line promises the reward: the blessing.

The old scene was a nine-second establishing dolly, a caption, a two-line exchange shot wide, and four lines over 16
words. Bracken was at 23% of the frame and the player at 13%.

## 2. The player's feeling

- **In:** wary, a little out of place, arriving by car in a place where nothing is mown.
- **Out:** a job they have agreed to, a warning about Granny, and a sense that the old man is right about something.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Bracken | to have the stone returned to the ring | the player is an outsider with an engine | measured statements, rules, a long look | from "stop there" to giving the blessing |
| The player | to find out what the stone is for | Bracken will not say it plainly | short practical questions | takes the job |
| Sorrel | to keep the radio on schedule | nothing (she is calm) | one dry aside | none |

## 4. Subtext

- Bracken's outrage at the doorstop is grief: the stone is holy to people who have lost the mower's yard.
- The "question" is the real reason he sends a stranger: he cannot take it himself.
- Sorrel never says "mower"; she says "replica" out loud, which is her quiet way of disagreeing with Bracken.

## 5. Beat sheet

| # | Time | Beat | What happens |
| --- | --- | --- | --- |
| 1 | 0.0-3.0 | Hook | Low MS of Bracken at the moss line; the player walks up through the firelight; "Stop there. Don't step on the moss." |
| 2 | 3.0-12.0 | Setup | "I'm here about a stone." / "Everyone is here about a stone..." / the replica doorstop under a sprinkler / "A replica?" / Sorrel's radio line. |
| 3 | 12.0-30.0 | Turn | "A replica of something holy is not a doorstop. It is a question." (the mystery stinger); the job and the catch, the player asking each one. |
| 4 | 30.0-50.0 | Button | Granny's bid warning; the reward line; a low CU of Bracken: "Spend the blessing on nothing with an engine." Held 2.5 s. |

## 6. Shot list

| # | Shot | Lens / distance | Move | On | Motivation |
| --- | --- | --- | --- | --- | --- |
| 1 | `shot('bracken','ms',{toward:'you',side:35,height:'low'})` | 36 | locked | Bracken | the hook: a low old man at the moss line |
| 2 | `TALK_RING.single('bracken','mcu',low)` | 35 | locked | Bracken | his rules, close |
| 3 | `TALK_RING.single('you','mcu')` | 35 | locked | the player | the straight man |
| 4 | `shot('sorrel','mcu',{toward:'bracken',side:-30})` | 35 | locked | Sorrel | the radio voice from her mark |
| 5 | `TALK_RING.single('bracken','mcu',low)` | 35 | locked | Bracken | the turn: "It is a question." |
| 6 | `shot('bracken','cu',{toward:'you',side:25,height:'low'})` | 34 | locked | Bracken | the button: the car, the engine, the old man |

Side of the line: Bracken and the player on `coverage('bracken','you',1)` throughout. No cut is hand-placed on a speaker.

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Bracken | Stop there. Don't step on the moss. | the hook; was "...That moss is older than your lawn." (cut: a second rule) |
| The player | I'm here about a stone. | |
| Bracken | Everyone is here about a stone. Most of them want to sell it. | |
| Bracken | Vesper Thorne keeps a replica Stopping Stone as a doorstop. Under a sprinkler. | was 17 words; split off the "On his patio" clause |
| The player | A replica? | |
| Sorrel | Fescue Public Radio, eighty-eight point seven. We say "replica" out loud. | was "We are the only station that says..."; shortened to under 12 |
| Bracken | A replica of something holy is not a doorstop. It is a question. | the turn, with the mystery stinger |
| The player | What's the job? | the straight man asks |
| Bracken | Go into his gallery. Take the stone off the plinth. | was 20 words ("...before anyone notices a stone is missing") |
| The player | What's the catch? | |
| Bracken | Granny Gnertrude will hear and bid. Do not let her buy it with pie. | was 19 words; the "Do not let her buy it with pie" warning kept |
| Bracken | Six hundred and fifty acorns, and an old man's blessing. | the reward, split from the button |
| Bracken | Spend the blessing on nothing with an engine. | the button |
| ~~Caption~~ | ~~Unmowed Hollow, Mossy Wood. Dusk. Nothing here has been mown since the Planting.~~ | cut: the picture and the ritual say it |
| ~~Bracken~~ | ~~Vesper Thorne ... On his patio.~~ | the patio is not needed |
| ~~Sorrel~~ | ~~Vesper's gallery collects Fescue relics. Nothing on that lawn is for sale, except everything.~~ | cut: a second Sorrel line; the gallery caption is the place for the joke |

Names checked: `npm run lore -- find "stopping stone"`, `find sorrel` (Sorrel Tillbrook, the radio), `find bracken`.

## 8. Music and sound

| Time | Cue | Why |
| --- | --- | --- |
| 0.0 | `forest` ambience, `fescue` music | the hollow's own theme, not the generic mystery bed |
| 12-14 | `mystery` stinger on "It is a question." | the turn |
| 38 | none | the button is a line in silence |

## 9. Blocking and vehicles

- Bracken stands on his mark at the moss line (-357.5, 38.6), facing the player's start (-337, 37.5); he holds his face on the
  player through the talk.
- The player starts at (-337, 37.5) and walks to the moss line at (-346, 38.5) during the hook.
- Sorrel sits at her mark (-346, 44) and winds the reel; the jar-carrier walks the jar loop behind the fire.
- No vehicles in the scene (the player's car is parked off screen).
- The player ends by the moss line, where the quest's gallery objective begins.

## 10. The button

Bracken, low and close, saying the last word about the engine. It is right because the scene is about the old man's
rule: the player is the one thing in the ring he does not trust.

## 11. Self-check

- [x] Want, obstacle and turn (the question).
- [x] Hook in 1 s: a low old man at the moss line; the first line by 3 s.
- [x] Every line under 16 words (longest 15).
- [x] Each character sounds like their bible entry; the player's lines are short.
- [x] Every speaker framed MS or closer, facing the camera (the frame shots, not hand cuts).
- [x] One side of the line.
- [x] Music: `fescue` through, one stinger, no held silence.
- [x] Dusk held at golden; the fire is the light.
- [x] Report OK; removed from `pacing.baseline.ts`.
- [x] Watched at 960x600 in the planner review (intro and granny also at 390x844); line of sight passes.
- [x] `direction.notes` points here.
