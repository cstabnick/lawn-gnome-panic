# Director's notes: `sq-hoa-audit-outro`

| | |
| --- | --- |
| Scene | `sq-hoa-audit-outro` in `src/cutscene/scenes/side/hoaAudit.ts` |
| Played by | quest `sq-hoa-audit` ("The HOA Audit") as its payoff, given back at Burt's returns yard |
| Kind and length | `outro`, aim 40-55 s, max 60; now 54.6 s at Normal text speed (was 77.9 s, 13 faults, over length) |
| Where, when | stage `clay-mart-lot` (Burt's returns yard, Clay Mart), noon. Meanwhile: no player actor |
| Before / after | before: the player took the job at Bodega & Sons. After: Thorne Lawn & Order is on the forms, Reginald Vance has a laser level; the player's turn-in is off screen |

## 1. Purpose in the story

The payoff of the quest in the deadpan register, played as a meanwhile: Burt, alone with five stamped clipboards,
finds the letterhead. The forged Tall-One mandates are on Thorne Lawn & Order paper, so the HOA's enforcement is
Vesper's company. Reginald Vance drives in to take the clipboards back and ends the scene with a threat. It ties the
side quest to the main story (Vesper is behind the HOA) without the player on screen.

The old scene had no stakes: four stamps as 4 s of thuds over one shot, an 18 s track shot, a 36 s wide with five
lines, a player-less wide on Burt's back, and a 14.8 s final hold while the van's getaway path ran long.

## 2. The player's feeling

- **In (as they hear of it):** the job is done; the clipboards are stamped.
- **Out:** the HOA is not a committee of petty officers; it is a company with letterhead. Reginald will be back with a
  laser level. The player is not in the room, and the stamp is still wet.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Burt | to keep the clipboards and the badge | Reginald is coming with the HOA's authority | jargon, a stamp, "Measure away." | from a clerk on his bonnet to a man who stamps Reginald's visit |
| Returns Clerk (extra) | to keep the returns desk running | the forms on the bonnet | crossed arms (reaction) | nothing; the clerk watches |
| Reginald "Quarter-Inch" Vance | a quarter-inch of order (and the clipboards) | Burt will not let them go | municipal code, crossed arms, a threat | drives off with the threat unsaid |

## 4. Subtext

- The letterhead is the reveal: "Thorne Lawn and Order, Vesper's company." Burt does not know what it means; the
  audience does.
- "They are on my bonnet, Reginald. Measure away." Burt is standing his ground in the only language he has.
- Reginald's "Then I will be back with a laser level." is the scene's threat: he is not finished.

## 5. Beat sheet

| # | Time | Beat | What happens |
| --- | --- | --- | --- |
| 1 | 0.0-5.0 | Hook | A locked insert of the forms on the bonnet; the first stamp at 0.1 s. Four more stamps, each a quick cut (insert, Burt solo, insert, Burt solo, insert). |
| 2 | 5.0-12.0 | Discovery | Burt: "Five clipboards. Five forged Tall-One mandates." "Look at the letterhead. Thorne Lawn and Order, Vesper's company." The clerk reacts (crossed arms). |
| 3 | 12.0-19.0 | The turn | "The Tall Ones do not print. Vesper does both." Music (`mystery`, fade 2). The HOA van (`rvan`) tracks in on the approach road, Reginald gets out. |
| 4 | 19.0-42.0 | Stand-off | Reginald (wide, then single): "You are not on the board, Burt." "Neither are the Tall Ones." "Those clipboards are HOA property." "They are on my bonnet, Reginald. Measure away." |
| 5 | 42.0-54.6 | Button | Reginald's threat ("Then I will be back with a laser level.", `danger` stinger, low single). He drives off on the wide, then Burt, alone, locked off: THUD, "Rejected. Stamped. Filed." |

## 6. Shot list

Singles of the stand-off are on `coverage('burt','reginald',1)`. Burt's solo frames face the clerk's side of the yard
(`toward: 'clerk'`), so no shot looks at him from behind.

| # | Shot | Lens / distance | Move | On | Motivation |
| --- | --- | --- | --- | --- | --- |
| 1 | insert of the forms, locked | 40 | locked | the forms | the first stamp, on the thing it stamps |
| 2 | `BURT_SOLO` | 35 | locked | Burt | the second stamp, from the clerk side |
| 3-5 | insert / Burt solo / insert | 40 / 35 | locked | forms, Burt | three more stamps, quick cuts |
| 6 | `BURT_SOLO` | 35 | locked | Burt | the first line: "Five clipboards..." (and "Look at the letterhead") |
| 7 | `reaction('clerk')` | 35 | locked | clerk | the clerk reacts (pause) |
| 8 | `BURT_SOLO` | 35 | locked | Burt | "The Tall Ones do not print. Vesper does both." |
| 9 | track on `rvan` | 40 | moving | the van | the HOA van drives in |
| 10 | wide of the yard | wide | locked | the yard | Reginald crosses the yard on foot |
| 11 | `LOT_TALK.single('reginald','ms',{height:'high'})` | 35 | locked | Reginald | "You are not on the board, Burt." (high: he looks down) |
| 12 | `LOT_TALK.single('burt','mcu')` | 35 | locked | Burt | "Neither are the Tall Ones." |
| 13 | `LOT_TALK.single('reginald','ms',{height:'high'})` | 35 | locked | Reginald | "Those clipboards are HOA property." (crossed arms) |
| 14 | `LOT_TALK.single('burt','mcu')` | 35 | locked | Burt | "They are on my bonnet, Reginald. Measure away." |
| 15 | `LOT_TALK.single('reginald','ms',{height:'low'})` | 35 | locked | Reginald | the threat: low, enforcing |
| 16 | wide, the van leaves | wide | locked | the van | the getaway (async, 2.5 s) |
| 17 | `BURT_SOLO`, stamp | 35 | locked | Burt | the button: THUD, "Rejected. Stamped. Filed." |

Side of the line: Burt and Reginald on `coverage('burt','reginald',1)` throughout.

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Burt | Five clipboards. Five forged Tall-One mandates. | kept, the count of the scene |
| Burt | Look at the letterhead. Thorne Lawn and Order, Vesper's company. | was "Look at the letterhead. Thorne Lawn and Order." plus "Vesper's company." in two lines; joined, 11 words |
| Burt | The Tall Ones do not print. Vesper does both. | was "The Tall Ones do not print. The Tall Ones do not write. Vesper does both.": repetition cut |
| Reginald | You are not on the board, Burt. | kept (the bible's municipal voice) |
| Burt | Neither are the Tall Ones. | kept: it answers the intro's "They are not on the board" |
| Reginald | Those clipboards are HOA property. | kept |
| Burt | They are on my bonnet, Reginald. Measure away. | kept, Burt's one stand |
| Reginald | Then I will be back with a laser level. | kept: the threat, said low |
| Burt | Rejected. Stamped. Filed. | the button: the bureaucrat's last word |
| ~~Caption~~ | ~~(opening caption)~~ | cut: the picture and the stamps do it |

Names checked: `npm run lore -- find thorne` (Thorne Lawn & Order LLC, Vesper "The Glazier" Thorne),
`find reginald` (Reginald "Quarter-Inch" Vance, the laser level). No new lore fact was added.

## 8. Music and sound

| Time | Cue | Why |
| --- | --- | --- |
| 0.1 | `thud` (stamp), repeated on each stamp | the stamps are the picture's rhythm |
| 12.0 | `mystery` in (fade 2) | the turn: the HOA van is coming |
| 40.0 | `danger` stinger on Reginald's threat | the threat, once in the scene |
| 54.0 | `thud` (the last stamp) | the button |

## 9. Blocking and vehicles

- Burt on `BURT_LOT` (-127.5, 162) facing the van; the clerk at `CLERK`, who crosses his arms on the reaction (beat 2).
- Five clipboards at Burt's bonnet as props (`form1`-`form5`), stamped in turn.
- Reginald seated in `rvan`, drives from the approach road to (-122.5, 150), gets out and walks (wide) to `REG_STOP`
  (-126, 156), some six metres from Burt. The singles begin only once he has stopped.
- He drives off to (-122.5, 112) on the wide, async, 2.5 s; the cut to Burt waits for him to leave.

## 10. The button

Burt, alone, locked off, the stamp thud and "Rejected. Stamped. Filed." The yard is empty except for him and the
clipboards. Reginald is gone and will be back. The last image is the stamp, not the threat.

## 11. Self-check

- [x] Hook in 0.1 s (the first stamp on a locked insert); no opening narration.
- [x] Turn at about 60% (Reginald's arrival and the threat); button in the last 3 s (the stamp).
- [x] Every line under 16 words (longest 11).
- [x] Every speaker framed on a `frame` shot, facing the camera side; the clerk reacts, not speaks.
- [x] One side of the line for the stand-off; Burt's solos on the clerk's side.
- [x] Music changes with reasons; one `danger` stinger; no captions.
- [x] Thorne Lawn & Order and Vesper's company named; Reginald's laser level; no coordinates in lines.
- [x] Length 54.6 s (max 60; aim 40-55).
- [x] Report OK; line-of-sight passes.
- [x] `direction.notes` points here.
