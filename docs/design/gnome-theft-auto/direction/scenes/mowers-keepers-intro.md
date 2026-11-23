# Director's notes: `mowers-keepers-intro`

The reference scene for the direction pass: re-directed end to end against [../bible.md](../bible.md). Watch it at
`http://localhost:5310/?no-intro&cutscene=mowers-keepers-intro`.

| | |
| --- | --- |
| Scene | `mowers-keepers-intro` in `src/cutscene/scenes/story/ch1.ts` |
| Played by | quest `ch1-mowers-keepers` ("Mower's Keepers") as its intro, given at Side-Valve Salvage |
| Kind and length | `intro`, aim 30-60 s; now 45 s at Normal text speed (was 41 s, 8 faults) |
| Where, when | stages `picnic-median` (the crossing at x 60, z -60) and `side-valve-bay`; day |
| Before / after | before: First Contract's payoff (the player is a Made Gnome, 1,000 Acorns lighter). After: the drive to the Picnic Median, then `mowers-keepers-outro` (the eviction notice on Tansy's door, Vesper drives past) |

## 1. Purpose in the story

Chapter 1 asks whether the player can pay their way out. This scene shows who the HOA really squeezes (farmers, not
crooks), and makes Tansy say the line the outro will punish: "Not my bay, not my problem." Two plants: the eviction
irony (paid off in `mowers-keepers-outro`) and Turncoat Cam watching the bay (paid off in chapter 2's close and the
chapter 3 raid).

The old scene was a briefing: Tansy read the objective with a grid coordinate, a narrator described the median, two
flash cuts went nowhere, and it ended on the player walking off.

## 2. The player's feeling

- **In:** fresh from a mob job, a little proud, still broke.
- **Out:** amused and slightly indignant (the HOA is petty and powerful), clear on the job (unclamp three bikes at the
  Picnic Median, bring them to the bay), and with a small itch about the gnome with the broom.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Enforcer 1 | to make the ticket stick | the junior's conscience | rank, deadpan escalation | tickets the boot as well |
| Enforcer 2 | to be let off the hook for the farmer | his boss | a timid excuse | silenced |
| Tansy | to get the bikes back without it being her fight | her own rule (stay out of wars), Pip | dismiss, then talk herself round with a proverb; put Pip down | gives the job, insisting it is not her problem |
| Pip | to be the one who rides the bikes | Tansy's low opinion of his driving | enthusiasm, volume | slumps, recovers next scene |
| The player | to know what they are being asked to do | Tansy's indirection | one short question | takes the job |
| Turncoat Cam | to know what the crew is up to | nobody tells the sweeper anything | watching | (unseen by the crew) |

## 4. Subtext

- Tansy is angrier than she sounds: it is a farmer's bike today, her bay tomorrow (her fear: losing the place). "Not my
  problem" is a lie she tells herself; the push-in on "Still." is where she stops lying.
- Pip wants the player to see him as useful (he pitches to the player, not to Tansy).
- Cam's look says he listens to everything said in the bay.

## 5. Beat sheet

| # | Time | Beat | What happens |
| --- | --- | --- | --- |
| 1 | 0.0-2.2 | Hook | Wide of the crossing; the clamp ratchets shut on a bike (`handbrake` sfx) before a word is said. |
| 2 | 2.2-11.5 | Setup (the crime) | Enforcer 1, low and proud: "Wheel clamped." The junior's excuse. The OTS escalation: "Then the boot gets a ticket too. Code-enforced." |
| 3 | 11.5-18.0 | Match cut | The same two words in Tansy's flat voice at the bay, the same ticket in her hand; the theme comes in. She names the job. |
| 4 | 18.0-27.8 | Want and dodge | "Your bikes?" "Their bikes. Not my bay, not my problem." A think; the push-in to CU: "Still. A clamp is just a lock in a uniform." |
| 5 | 27.8-37.4 | Turn | Pip charges in, pitching to the player; Tansy puts him down without turning round; his slump. |
| 6 | 37.4-42.6 | The job | Tansy gives the job to the player in three clauses; the player nods. |
| 7 | 42.6-45.2 | Button | Music out. Turncoat Cam stops sweeping and turns to watch the player go; one soft `mystery` sting; held silence. |

## 6. Shot list

| # | Shot | Lens / distance | Move | On | Motivation |
| --- | --- | --- | --- | --- | --- |
| 1 | `spot('picnic-median','wide')` WS | 52, high | locked | the crossing | place and crime in one picture; the sound tells us what happened |
| 2 | `HOA.single('enf-1','ms',{height:'low'})` | 40, low | locked | enforcer 1 | petty power is shot from below |
| 3 | `HOA.single('enf-2','mcu')` | 35, eye | locked | enforcer 2 | the junior, smaller, closer |
| 4 | `HOA.ots('enf-1')` over enforcer 2 | 38 | locked | enforcer 1 | the escalation lands with the junior in the foreground; a `beat` before it |
| 5 | `BRIEF.single('tansy','mcu')` | 35 | locked | Tansy | match cut on "Code-enforced." |
| 6 | `BRIEF.single('player','mcu')` | 35 | locked | the player | the straight man's question |
| 7 | `BRIEF.single('tansy','mcu')` | 35 | locked | Tansy | the dodge |
| 8 | `BRIEF.single('tansy','cu')` | 30 | cut in | Tansy | the push-in is her decision |
| 9 | `shot('pip','ms',{toward:'player', side:-20, handheld:0.02})` | 40 | leads him (backs away as he runs) | Pip | energy: he runs at us and pulls up in front of the player |
| 10 | `BRIEF.single('tansy','cu')` | 30 | locked | Tansy | she answers without looking at him |
| 11 | `reaction('pip', { gesture: 'slump' })` | 35 | locked | Pip | the reaction is the joke |
| 12 | `BRIEF.single('tansy','mcu')` | 35 | locked | Tansy | back to business, back to the player |
| 13 | `BRIEF.single('player','mcu')` | 35 | locked | the player | the nod: the job is taken |
| 14 | `shot('turncoat','fs',{side:15})` | 45 | locked | Turncoat Cam | the plant, held in silence |

Sides of the line: the enforcers on `coverage('enf-1','enf-2', 1)`; Tansy and the player on
`coverage('tansy','player', 1)`; Pip and Tansy on `coverage('pip','tansy', -1)`, the player's side of their line, which is
where Tansy's answer (shot on her eyeline to the player) is taken from. No crossings.

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Enforcer 1 | Wheel clamped. Ticket on the handlebars. | was "Clamped to the crossing light, wheel locked. Ticket's on the handlebars. Code-enforced." Split: the phrase is saved for the button of the beat |
| Enforcer 2 | He only stopped to tie his boot, sir. | new: gives the boss something to escalate |
| Enforcer 1 | Then the boot gets a ticket too. Code-enforced. | the escalation, and the phrase for the match cut |
| Tansy | "Code-enforced." | reading the ticket: the match cut |
| Tansy | Three Cloverfield farmers. Three bikes, clamped at the Picnic Median. | replaces the 17-word line with "block (60, -60)": the HUD shows the place |
| Player | Your bikes? | the straight man |
| Tansy | Their bikes. Not my bay, not my problem. | the plant for the outro's eviction notice |
| Tansy | Still. A clamp is just a lock in a uniform. | her twisted proverb; she has decided |
| Pip | Husky-Blade two-strokes! I'll ride one back. I'll ride all three! | kept his old brand line, now with a want |
| Tansy | You'll ride one. Into a lamp-post. | the put-down |
| Tansy | Unclamp them. Bring them to my bay. Mind the Hat Watch. | the job, in three clauses |
| ~~Narrator~~ | ~~The Neutral Picnic Median. Two gangs of bells, one clamp ratchet...~~ | cut: described the picture; the sound does it |
| ~~Tansy~~ | ~~Technically my chicory coffee hasn't kicked in.~~ | cut: already said in `prologue-outro`; the coffee is her stress tell, rationed to two uses |
| ~~Tansy~~ | ~~...and watch out for process servers.~~ | cut: tells the outro's twist before it happens |

Names checked: `npm run lore -- find "Picnic Median"` (the Neutral Picnic Median), `husky-blade`, `tansy-clayfoot`.

## 8. Music and sound

| Time | Cue | Why |
| --- | --- | --- |
| 0.0 | `street` ambience, no music; `handbrake` sfx at the clamped bike | the HOA's world is cold and procedural; the hook is a sound |
| 11.5 | `turfton` in on the match cut (fade 0.3) | we are home, with the crew |
| 42.6 | music out (fade 0.6) | silence makes the button land |
| 43.2 | `mystery` stinger | the only sting in the scene: something is off about the sweeper |

## 9. Blocking and vehicles

- Picnic Median: enforcer 1 at (57.6, -57.2) beside the clamped bike (60, -56), enforcer 2 at (55.4, -54.6); they face
  each other. The second clamped bike stays across the crossing as dressing.
- Side-Valve: Tansy at her mark (-143, 73) facing the player, the HOA ticket in hand. The player at (-146.4, 70.4), facing
  her, walks to the bay exit (-146.5, 67.8) in the button, so the quest leaves them there. Pip starts sitting on his crate
  at (-135.5, 74), stands and runs to (-140.2, 72.4), turns to the player. Turncoat Cam at his mark (-156, 68) with the
  broom, turns to watch the player in the button. Both Zero-Turns parked on their marks.

## 10. The button

Turncoat Cam, broom still, turning his head to watch the player leave, in silence but for one soft sting. It is the right
last moment because it is the only thing in the scene nobody on screen noticed, and the player will remember it when the
broom comes out of the HOA van in chapter 3.

## 11. Self-check

- [x] Want, obstacle, turn: Tansy's "not my problem" against the clamp; Pip's interruption; the job given anyway.
- [x] Hook in 3 s (the clamp sound); no opening narration.
- [x] Every line under 16 words (longest 11); no coordinates.
- [x] Voices: Tansy short and proverbial, Pip loud and brand-happy, the player two words.
- [x] Every speaker MS or closer and facing the camera; a reaction after the put-down.
- [x] One side of the line per conversation.
- [x] Two music changes with reasons, one stinger, one held silence.
- [x] Ladders: "not my problem" (rung 1), Cam's broom (rung 2 after `prologue-outro`).
- [x] Day scene.
- [x] Report OK; removed from `pacing.baseline.ts`.
- [x] `npm test` passes (line of sight included); watched in the browser.
- [x] `direction.notes` points here.
