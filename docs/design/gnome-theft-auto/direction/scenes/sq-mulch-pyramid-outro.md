# Director's notes: `sq-mulch-pyramid-outro`

| | |
| --- | --- |
| Scene | `sq-mulch-pyramid-outro` in `src/cutscene/scenes/side/mulchPyramid.ts` |
| Played by | quest `sq-mulch-pyramid` as its outro (the payoff at Side-Valve Salvage, the player returning the spreader) |
| Kind and length | `outro`, aim 15-45 s; now 44.4 s at Normal text speed (was 46.8 s, 10 faults) |
| Where, when | stage `side-valve-bay` (Side-Valve Salvage), mid-morning, `sky: 'noon'`, no infomercial |
| Before / after | before: the player drives the spreader back to the bay. After: Cedric is told "No." and the bay goes back to work |

## 1. Purpose in the story

The scheme collapses. Tansy, who runs the bay, finds the sawdust and the wasp in a bag and says so; Pip, who was right all
along about Father Loam, says so too. The payoff lands the Chapel of Mulch quota as a dead end and Cedric as a man who
has to give the spreader back.

## 2. The player's feeling

- **In:** tired, the rig back in the bay, a little grubby.
- **Out:** relieved and a little amused: the scheme is busted, and the spreader stays with Tansy.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Tansy | to keep her bay and her Zero-Turn glitter-free | Cedric's patter | three short clauses, arms crossed, works while she talks | from working to turning on Cedric, once |
| Cedric | to keep the spreader and the upline | Tansy's flat no | the patter, "A misunderstanding.", "Can I at least keep the spreader?" | gets the no |
| Pip | to be right about Father Loam | nobody listens to him | fast, loud, never cruel | is right |
| The player | to return the spreader and leave | the chatter | silent, leaves the rig (`exit`) | leaves |

## 4. Subtext

- Tansy's whole bay runs on honest work; a glitter bag is an insult to the one thing in the bay that runs.
- Cedric is a salesman with no product, so his only move is to ask to keep the spreader.
- Pip's line about Father Loam is Pip being right: the sincere beat of a silly character.

## 5. Beat sheet

| # | Time | Beat | What happens (picture first, then words) |
| --- | --- | --- | --- |
| 1 | 0-3 | Hook | Tansy, low, beside her Zero-Turn, a spanner clank (`thud`), "You brought the spreader back." |
| 2 | 3-9 | Setup | the player exits the rig (2.2 s); Tansy: "No glitter on the Zero-Turn. It is the only thing here that runs." |
| 3 | 9-20 | The pitch | Cedric slides in: "Tansy, love. A misunderstanding. The bags are artisanal. Hand-dyed."; Tansy's "sawdust, glitter, and a wasp"; Cedric: "It is a funnel, Tansy. Everybody is on it." |
| 4 | 20-27 | Pip | Pip's "Father Loam warned the whole Chapel about that funnel!" and "Nobody listens to a man on a snowmobile." |
| 5 | 27-38 | Turn | the `mystery` stinger; Tansy: "The Chapel quota is due Friday. You sold them sawdust."; a pause on Cedric; "The whole scheme is busted, Cedric. It is glitter all the way down." |
| 6 | 38-44 | Button | Cedric: "Can I at least keep the spreader?"; Tansy: "No."; Cedric's facepalm, hold 1.5 s |

The turn is at about 60% (the sawdust, then the quota). The button is Cedric's facepalm: the scheme has no exit left.

## 6. Shot list

| # | Shot (size, `frame`/`cut`/`track`/...) | Lens / distance | Move | On | Motivation |
| --- | --- | --- | --- | --- | --- |
| 1 | `shot('tansy','ms',{toward:'pip',side:30,height:'low'})` | 40 | locked | Tansy | the hook: low, from the bay side, clear of her Zero-Turn |
| 2 | `exit` the player, 2.2 s | - | - | the player | the rig is cleared before the next shot |
| 3 | `shot('tansy','mcu',{toward:'pip',side:30,height:'low'})` | 40 | locked | Tansy | "No glitter on the Zero-Turn." |
| 4 | `BAY_TALK.single('cedric','mcu')` | 40 | locked | Cedric | "A misunderstanding." (he walks in while the shot holds) |
| 5 | `BAY_TALK.single('tansy','mcu')` | 40 | locked | Tansy | "I opened one." |
| 6 | `BAY_TALK.single('cedric','ms')` | 40 | locked | Cedric | "It is a funnel, Tansy." |
| 7 | `shot('pip','ms',{toward:'cedric',side:25})` | 40 | locked | Pip | Pip's two lines |
| 8 | `BAY_TALK.single('tansy','mcu')` | 40 | locked | Tansy | the quota |
| 9 | `BAY_TALK.single('cedric','mcu')` + 1.2 s pause | 40 | locked | Cedric | the reaction to the quota |
| 10 | `BAY_TALK.single('tansy','mcu')` | 40 | locked | Tansy | the turn: "It is glitter all the way down." |
| 11 | `BAY_TALK.single('cedric','mcu')` | 40 | locked | Cedric | "Can I at least keep the spreader?" |
| 12 | `BAY_TALK.single('tansy','mcu')` | 40 | locked | Tansy | "No." |
| 13 | `shot('cedric','mcu',{toward:'tansy',side:25})` | 40 | locked | Cedric | the button: the facepalm |

Side of the line: `coverage('tansy','cedric',1)` (`BAY_TALK`) for every Tansy and Cedric single, so the camera never crosses.

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Tansy | You brought the spreader back. | the hook; a flat fact |
| Tansy | No glitter on the Zero-Turn. It is the only thing here that runs. | her bay's whole rule (bible: short, dry, three clauses) |
| Cedric | Tansy, love. A misunderstanding. The bags are artisanal. Hand-dyed. | the patter, split from the old 20-word version |
| Tansy | I opened one. It is sawdust, glitter, and a wasp. | the reveal, three clauses |
| Cedric | It is a funnel, Tansy. Everybody is on it. | the pitch, unchanged |
| Pip | Father Loam warned the whole Chapel about that funnel! | Pip being right; under 16 words (was 17) |
| Pip | Nobody listens to a man on a snowmobile. | Pip's second line; the snowmobile joke kept |
| Tansy | The Chapel quota is due Friday. You sold them sawdust. | the turn, split from the old 28-word line |
| Tansy | The whole scheme is busted, Cedric. It is glitter all the way down. | the turn's last line; a clause each |
| Cedric | Can I at least keep the spreader? | the button's question |
| Tansy | No. | the button's answer |
| ~~Caption~~ | ~~SIDE-VALVE SALVAGE. MID-MORNING. NO INFOMERCIAL.~~ | cut: the place is the picture; this is the infomercial's ending, not a caption |

Names checked: `npm run lore -- find "chapel of mulch"`, `find father-loam` (the Chapel quota, Loam's funnel talk), `find tansy`
(Side-Valve Clayfoot). No new facts added: no lore entry change.

## 8. Music and sound

| Time | Cue | Why |
| --- | --- | --- |
| 0.0 | `warm` music, `street` ambience | the bay in the morning; the infomercial's warmth fades into work |
| 0.0 | `thud` sfx (Tansy's spanner on the bench) | the hook: a work sound |
| 27 | `mystery` stinger | the turn: the quota is a dead end |
| 40+ | no change | the button is talk and a facepalm: no music needed |

Stingers: one (`mystery`), at the turn. No comic stinger: the sincere beats are played straight.

## 9. Blocking and vehicles

- Tansy at her bay mark, facing Pip (yaw set to Pip), beside her Zero-Turn (`castRide('tansy','zero')`).
- Pip on his bay mark, facing Tansy (yaw set to her), standing: his two lines get their own medium shot.
- The player's spreader (`castRide('cedric','rig',...,{from:'player'})`) is parked at (-150, 72). The player exits before
  Cedric arrives, so the rig is never in the frame of a speaker.
- Cedric walks from (-158, 66) to (-147, 69) during the pitch and stops in front of Tansy's bench.
- The player ends off the rig, on foot, next to the bay (the quest's exit).

## 10. The button

Cedric's facepalm after "No.": the salesman with no way out, held for 1.5 s. It is right because the scheme's whole
joke is that Cedric always has a pitch, and here the last picture is his one pitch failing.

## 11. Self-check

- [x] Want, obstacle, turn (the sawdust, then the quota); not a briefing.
- [x] Hook in 3 s (a spanner sound and Tansy's line); no narration.
- [x] Every line under 16 words (longest 13); no waypoint read-out.
- [x] Tansy sounds like her bible entry (short, dry, three clauses); Pip is fast and never cruel; Cedric is patter.
- [x] Every speaker medium or closer, facing the camera (Tansy and Cedric exchange looks before the pitch; Tansy faces Pip).
- [x] One side of the line (`coverage('tansy','cedric',1)`).
- [x] Music changes have reasons; one stinger, at the turn; no held silence needed.
- [x] Running joke climbs: the funnel, the sawdust, the quota, the spreader.
- [x] Scene lit: noon, no night.
- [x] `npm run cutscene-report` shows the scene OK (0 faults; was 10); id still in `pacing.baseline.ts` until the planner removes it.
- [x] `npx vitest run ... -t "sq-mulch-pyramid"` passes (line of sight).
- [x] Watched at 960x600 and 390x844; fixes made (Tansy's camera moved off her Zero-Turn to Pip's side, and her yaw turned
      to face the camera; the player's exit moved so no shot holds a rig in front of a speaker).
- [x] `direction.notes` points here.
