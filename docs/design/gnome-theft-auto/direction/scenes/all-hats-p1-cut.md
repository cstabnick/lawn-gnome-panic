# Director's notes: `all-hats-p1-cut`

| | |
| --- | --- |
| Scene | `all-hats-p1-cut` in `games/gnome-theft-auto/src/cutscene/scenes/story/m64a-all-hats.ts` |
| Played by | quest `m64-all-hats-p1`, the `scene` of its second visit (the dune cut) |
| Kind and length | `arrival`, aim 10-35 s; 35 s |
| Where, when | stage `m64a-dune-cut` (the Saltcut under the dune line, row 32's place), noon |
| Before / after | before: the toll; after: the lead up the cut in Driftwood's dinghy (checkpoints) |

## 1. Purpose in the story

The reunion with Captain Bilge: she remembers the player boarding the barge from the stern (#44). The L95 picture: the Bathtub Queen (cutscene-only, the W16 6 m Queen) nosed into a channel too narrow for her pride. Driftwood lends the coalition a boat (characters.md). The tour ladder from #44 ("Is this part of the tour?") climbs: "Is the walnut part of the tour?"

## 2. The player's feeling

- **In:** a long drive to the dunes.
- **Out:** the job in hand: lead her in, in a walnut shell. A laugh.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Samphire | to arrive like a queen | she cannot read a channel | booming to an imagined audience | follows a nut, loudly |
| Driftwood | to see the Queen through | the captain's pride | dreamy sea-sense, the painter held out | hands over his boat |
| Tourist | to know what is real | everything | one question | |

## 4. Subtext

- Samphire fears dry land and narrow water alike; the bravado covers it.
- Driftwood tows again (#32), the other way round: now he asks someone else to be steady.

## 5. Beat sheet

| # | Time | Beat | What happens |
| --- | --- | --- | --- |
| 1 | 0-3 | Hook | Wide down the cut, a bell, Samphire's hands up. |
| 2 | 3-14 | Setup | "On your left: a dune!" She knows the player: the barge, from the stern. |
| 3 | 14-24 | Turn | Driftwood: follow a small boat. "Follow a walnut? The Queen?" |
| 4 | 24-30 | Gag | "Is the walnut part of the tour?" "Madam. The walnut is the tour." |
| 5 | 30-35 | Button | Driftwood hands over; "All hands! Follow that nut!" The narrow cut ahead, a bell. |

## 6. Shot list

Stage `wide`; Samphire MS, then `coverage(samphire, player, 1)` singles (low: she is grand); `coverage(driftwood, samphire, 1)`; tourist MCU; Driftwood turned to the player for the hand-over; stage `up-cut` for the button.

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Samphire | And on your left, ladies and gentlegnomes: a dune! | the tour never stops |
| Samphire | You! The one who boarded a barge from the stern! | remembers #44 |
| You | You need a pilot. | |
| Samphire | The Queen has toured a pier four hundred times. Never a channel. | |
| Driftwood | She draws more than the cut, Captain. Follow a small boat. | |
| Samphire | Follow a walnut? The Queen? | |
| Tourist | Is the walnut part of the tour? | the #44 ladder, one rung up |
| Samphire | Madam. The walnut is the tour. | |
| Driftwood | Take her, friend. Steady, like the raft. | #32 |
| Samphire | All hands! Follow that nut! | button |

## 8. Music and sound

`shore` bed, `turfton`. Foley: `bell` twice, `creak` (the painter). No stinger.

## 9. Blocking and vehicles

Samphire and the last tourist seated in the Queen's tender (gravy-boat) at her port side (709, 949.6): the scene checker has no floor on a prop's deck, so the crew talk from the tender. The Queen prop at (712.4, 950), bow north. The player on the west bank (696.4, 931), Driftwood by his dinghy (697.6, 935.8); the dinghy (706.5, 928) is where the checkpoints spawn it.

## 10. The button

The cut, empty and narrow, and a bell: everything now depends on a walnut.

## 11. Self-check

- [x] Want, obstacle and turn; not a briefing.
- [x] Hook in 3 s on a picture and a sound, not narration.
- [x] Every line under 16 words; no coordinates; nobody describes the picture.
- [x] Voices per bible section 2 and characters.md.
- [x] Speakers MCU/MS on the eyeline; reactions after the big lines.
- [x] One side of the line per pair (`coverage`), no crossing faults.
- [x] Music changes have reasons; at most one stinger; no held silence (not a sincere scene).
- [x] Running jokes climb a rung (section 1).
- [x] Day scene: no lighting problem.
- [x] `npm run cutscene-report`: OK, not in Variety or Sound; `scenes.test.ts` (line of sight) passes.
- [x] `direction.notes` points here.
