# Director's notes: `m25-one-leg-to-stand-on-outro`

| | |
| --- | --- |
| Scene | `m25-one-leg-to-stand-on-outro` in `src/cutscene/scenes/story/m25-one-leg-to-stand-on.ts` |
| Played by | quest `m25-one-leg-to-stand-on` (One Leg to Stand On), as its `outro`, when the tow reaches Driftwood's trailer |
| Kind and length | `outro`, aim 15-45 s; 24.4 s at Normal text speed |
| Where, when | stage `driftwood-hitch` (the stubble east of the trailer), golden hour (`sky: 'golden'`) |
| Before / after | before: the long tow home; after: the reward, and Wader's Rest on the map |

## 1. Purpose in the story

Driftwood has his raft back, wearing a pink plume he did not order, and he is the one person who is not troubled by what
the player heard. Nothing is explained: the player says the line, Driftwood answers with the wrong kind of calm, and the
player is left holding it. Driftwood's (existing) character is unchanged; this is his first scene as a client.

## 2. The player's feeling

- **In:** tired from the tow, carrying Saxifrage's last line.
- **Out:** the job done; the date still in their head. Tension 4.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Driftwood | to have his raft, and the story of how | the plume, which he cannot account for | dreamy rambling; sea-words for land things | delighted, unbothered |
| The player | to hand the raft over and not think about it | the Even Cut | short answers | silent |

## 4. Subtext

Driftwood thinks of the longest day as good sailing light (his want is the open sea). The player's silence is the answer.

## 5. Beat sheet

| # | Time | Beat | What happens |
| --- | --- | --- | --- |
| 1 | 0-6 | Hook | The raft in gold light with a pink plume on its tiller and a Flock tea cup; Driftwood walks up to it. |
| 2 | 6-13 | Setup | "My raft. She has a feather. Why has my raft got a feather?" "They blessed it." "She was blessed already. The canal did that." |
| 3 | 13-20 | Turn | "Did you stand the whole sermon? What did she preach?" "The Even Cut. On the longest day." |
| 4 | 20-24 | Button | "Longest day. Good light for sailing, that." The player's face, music fading out. |

## 6. Shot list

| # | Shot | Lens / distance | Move | On | Motivation |
| --- | --- | --- | --- | --- | --- |
| 1 | stage camera `raft` (a cut) | 50 | locked | the raft and its plume | the hook, and a man walking into the frame |
| 2 | `DRIFT.single('driftwood','mcu')` | 35 | locked | Driftwood | the first line (after a `face` to the player) |
| 3 | `DRIFT.single('player','mcu')` | 35 | locked | the player | "They blessed it." |
| 4 | `DRIFT.single('driftwood','mcu')` | 35 | locked | Driftwood | the canal line, and the question |
| 5 | `DRIFT.single('player','mcu')` | 35 | locked | the player | the line |
| 6 | `DRIFT.single('driftwood','ms', low)` | 40 | locked | Driftwood leaning | the wrong calm |
| 7 | `shot('player','mcu', toward driftwood)` | 35 | locked, eye | the player | the button; music fades |

Driftwood and the player on `coverage('driftwood','player',1)`. No crossings.

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Driftwood | My raft. She has a feather. Why has my raft got a feather? | reunion first, then the gag |
| Player | They blessed it. | |
| Driftwood | She was blessed already. The canal did that. | his sea-voice |
| Driftwood | Did you stand the whole sermon? What did she preach? | |
| Player | The Even Cut. On the longest day. | said once, flat |
| Driftwood | Longest day. Good light for sailing, that. | the miss; no explanation, no answer |

Names checked: `npm run lore -- find "Driftwood"`, `"Standing Lady"`, `"Even Cut"`.

## 8. Music and sound

| Time | Cue | Why |
| --- | --- | --- |
| 0.0 | `wind` bed, `turfton-dusk` music | the quiet win, the stubble |
| 0.0 | `creak` at the raft | she settles on her trailer ropes |
| 20.0 | music out (fade 1.2) | the player alone with the line |
| 21.0 | `rustle` | wind in the stubble |

## 9. Blocking and vehicles

- The player's combine (`from: 'player'`) stands at (37, 462.4) facing west; the raft (`walnut-dinghy`) at (43.5, 458.6),
  a plume and a reed tea cup on it; the player at (34.4, 463.6).
- Driftwood from (31.5, 459.4) walks east to (40.1, 456.4) beside the raft, then turns to face the player.

## 10. The button

The player's mcu with the music out and the wind in the stubble, while Driftwood hums off screen. The last image is the
player not laughing.

## 11. Self-check

- [x] Want (the raft and the story), obstacle (the plume), turn (the question).
- [x] Hook in 3 s: the raft and a walk; no narration.
- [x] Every line under 16 words (longest 12).
- [x] Voices: Driftwood dreamy and wandering; the player short.
- [x] Speakers MCU or MS, facing the lens (a `face` before his first line).
- [x] One side of the line.
- [x] One track, one fade-out.
- [x] The Flock thread: the feather and the cup on the raft are the small story seen only in the scene (L95).
- [x] Golden hour.
- [x] `npm run cutscene-report` OK; LOS passes.
- [x] `direction.notes` points here.
