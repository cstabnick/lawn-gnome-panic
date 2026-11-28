# Director's notes: `prologue-outro`

Watch it at `http://localhost:5310/?no-intro&cutscene=prologue-outro`.

| | |
| --- | --- |
| Scene | `prologue-outro` in `src/cutscene/scenes/story/ch1.ts` |
| Played by | quest `prologue-fresh-kiln` as its outro (the payoff, before the CONTRACT COMPLETE banner) |
| Kind and length | `outro`, aim 15-45 s, fault above 60; now 49 s (was 60.6 s, 9 faults). Over the aim on purpose: it carries three plants and the acorn reveal; under the limit |
| Where, when | stage `side-valve-bay`; day, `sky: 'noon'` |
| Before / after | before: the chase behind Pip from the bus stop. After: free roam; Mower's Keepers and First Contract open |

## 1. Purpose in the story

Meet Tansy, and open the crate: the Golden Acorn, the MacGuffin of the whole game. Three plants the bible asks for:

- **The brass forty-eighth wrench**: the scene opens on Tansy counting forty-seven wrenches on her wall, the brass one in
  her hand and the cigar box open on the bench; she puts it away before the crew arrives (paid off in ch4/ch5).
- **Pip and Fescue**: Tansy says "Fescue"; Pip changes the subject three times in one breath (Bracken calls him a traitor
  in ch2).
- **Turncoat Cam's broom**: Cam sweeps across the background of the bay (ladder rung 1; his look comes in
  `mowers-keepers-intro`).

## 2. The player's feeling

- **In:** just finished a chase, pleased.
- **Out:** curious and a little uneasy: the acorn hums, the old hand is wary of it, the new friend is lying about
  something. A laugh at the end.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Tansy | to finish her count, then to know what Pip has dragged in | Pip's noise; the crate | ignore Pip, answer the player, open it herself | the trouble is real; she makes it Pip's to hold |
| Pip | to be praised for the Ride-On; to not be asked about Fescue | Tansy's back; the word "Fescue" | volume, then deflection | stuck holding the thing |
| The player | to know what is in the crate | Tansy's indifference | one question | sees it |
| Turncoat Cam | (background) sweeping | | | |

## 4. Subtext

- Tansy counts the wrenches because counting calms her (her fear: losing what she built). The brass one goes back in the
  box before anyone sees it: her secret.
- She turns round for the player, not for Pip: the hierarchy of the crew in one turn of the head.
- Pip's "Never been. Is that far?" is a lie: the vial of Fescue soil in his toolbox (bible: Pip's secret). Never said.

## 5. Beat sheet

| # | Time | Beat | What happens |
| --- | --- | --- | --- |
| 1 | 0.0-2.4 | Hook | Tansy at the wrench wall, brass wrench in hand, counting "Forty-five. Forty-six. Forty-seven." |
| 2 | 2.4-12 | Arrival | She puts the brass one away; an engine; Pip's bike and the Ride-On tear onto the apron (track); Cam sweeps behind |
| 3 | 12-23 | Setup | Pip boasts; Tansy answers without turning round. The player asks about the crate; she turns. "Trouble, probably. Pip brought it." |
| 4 | 23-33 | Turn (reveal) | Music out; she opens the crate (creak, thud); the Golden Acorn in her hand on a slow low push-in; reveal stinger; `mystery` |
| 5 | 33-44 | The dodge | Pip: "That might not be grass." Tansy: "It hums. It smells of Chirp & Crumb. And Fescue." Pip changes the subject three times. Tansy's look (CU, a held pause). |
| 6 | 44-49 | Button | Without a word she hands him the humming thing; he flinches; one comic sting. |

## 6. Shot list

| # | Shot | Lens | Move | On | Motivation |
| --- | --- | --- | --- | --- | --- |
| 1 | `shot('tansy','ms',{side:-75})` | 40 | locked | Tansy in profile, the wall | the count and the plant, picture first |
| 2 | `track` the Ride-On from the apron | 52 | pan | the arrival | speed into stillness |
| 2b | `cut` across the apron, handheld 0.02 | 46 | locked | Pip and the player climbing off | the energy carries in |
| 3 | `TP.single('pip')` | 35 | locked | Pip | the boast |
| 4 | `shot('tansy','mcu',{side:-105})` | 35 | locked | Tansy, still facing the wall | she does not turn for him |
| 5-6 | `BAY.single` player / Tansy | 35 | locked | the question and the turn | she turns for the player |
| 7 | `shot('tansy','ms',{side:80,height:'low'})` | 40 | locked | the crate opening, in profile | the sound tells us; the hand comes up |
| 8 | `dolly` low push-in on Tansy's front | 42 | slow push | the acorn in her hand | awe: picture before the line |
| 9-12 | `TP` singles | 35 | locked | Pip / Tansy | the dodge and the look |
| 13 | `cut` locked MS two-shot | 44 | locked | the hand-over | the gag, wide enough to see cause and effect |

Sides: Tansy and Pip on `coverage('tansy','pip', 1)`; Tansy and the player on `coverage('tansy','player', 1)`. No
crossings.

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| ~~Narrator~~ | ~~Side-Valve Salvage, first light. Tansy has been up since dawn...~~ | cut: opened on narration and described the picture |
| Tansy | Forty-five. Forty-six. Forty-seven. | new: the wrench plant, said not explained |
| Pip | We got the Ride-On! Totally legal. The kerb said nothing. | kept |
| Tansy | Morning. The chicory hasn't kicked in. Keep it short. | chicory use 1 of 2 in the game (her stress tell) |
| Player | What's in the crate? | new: the straight man's question |
| Tansy | Trouble, probably. Pip brought it. | new: the turn of the head |
| Pip | Okay, yeah. That might not be grass. | kept: after the picture |
| Tansy | It hums. It smells of Chirp & Crumb. And Fescue. | the "Fescue" plant; "That is trouble, Pip" cut (said by the button instead) |
| Pip | Fescue? Never been. Is that far? Who's hungry? I'm hungry. | new: the dodge |
| ~~Tansy~~ | ~~And stay away from Mossley outside Bodega's...~~ | cut: an errand hook as the last line |

Names checked: `npm run lore -- find "Chirp"`, `Fescue`, `tansy-clayfoot` (forty-seven wrenches, the brass forty-eighth
in a cigar box).

## 8. Music and sound

| Time | Cue | Why |
| --- | --- | --- |
| 0.0 | `street` ambience, no music | the bay before the crew: her quiet |
| 2.4 | `engine-rev`; `turfton` in | the crew arrives |
| 23.6 | music out (0.6) | the beat before the reveal |
| 30.2 | `reveal` stinger on the push-in; `mystery` in | the picture, not the line |
| 46.8 | `comic` stinger on the flinch | the one physical gag |

## 9. Blocking and vehicles

- Tansy starts at (-156.4, 74.2) facing west to the `wrench-rack` (new prop) at (-157.6, 74.2), the `cigar-box` (new
  prop) on the workbench behind; walks to the crate at (-153.6, 77.1), then to (-152.4, 75.9) to hand the acorn over.
- Pip's push-bike and the player's Ride-On (`from: 'player'`, `keep: true`) drive in off the z = 60 road; the Ride-On
  stops at (-152.8, 69.6). Pip ends at (-151.4, 74.8), the player at (-153.2, 72.6).
- Turncoat Cam walks the apron (-158, 68) -> (-146, 68) slowly with his broom, in the background of the bay shots.
- Tansy's Zero-Turn parked on its mark.

## 10. The button

Tansy, without a word, puts the humming acorn in Pip's hands; he flinches; one comic sting. It answers his dodge (if
Fescue is nothing to you, hold this), and it is a physical gag at tension 5, where the bible wants one.

## 11. Self-check

- [x] Want, obstacle, turn: the crate opened; the dodge; the hand-over.
- [x] Hook at 0 s on a character (the count); no narration.
- [x] Every line under 16 words; no coordinates; no errand hook at the end.
- [x] Voices: Tansy short and dry, Pip loud and deflecting, the player four words.
- [x] Every speaker MCU/MS and facing the camera; reactions on Pip and on Tansy.
- [x] One side per conversation.
- [x] Three music changes with reasons, two stingers, no held silence.
- [x] Plants: forty-seven wrenches and the cigar box, Pip dodging Fescue, Cam's broom.
- [x] Day scene.
- [x] Report OK; removed from `pacing.baseline.ts`.
- [x] `npm test` passes; watched at desktop and phone size.
- [x] `direction.notes` points here.
Intro cards: Tansy after her wrench count; Turncoat Cam on his own mcu right after Tansy names him.
