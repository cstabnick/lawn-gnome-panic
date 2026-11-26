# Director's notes: `m44-the-bathtub-queen-intro`

| | |
| --- | --- |
| Scene | `m44-the-bathtub-queen-intro` in `src/cutscene/scenes/story/m44-the-bathtub-queen.ts` |
| Played by | quest `m44-the-bathtub-queen` (intro, at the giver `bilge-tour-board`, the foot of Long Spoon Pier) |
| Kind and length | `intro`, about 42 s (aim 30-60) at Normal text speed |
| Where, when | stage `m44-queen-deck` (the Bathtub Queen's deck, a rooftop at y -3.0); dusk, sky golden |
| Before / after | after: row 43's sincere outro (this is the laugh). Before: the tender and the barge |

## 1. Purpose in the story
Captain Samphire Bilge's first appearance (intro card): theatrical, a tour guide who never breaks, a smuggler underneath. It gives the job (the barges haul the Combine's spare blades; take one and the Queen sails with the crew) in the funniest way the setup allows: a stage whisper the whole tour hears.

## 2. The player's feeling
- **In:** the hush of row 43 still in their head.
- **Out:** laughing, and clear that the job is one crate from one barge.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Samphire | keep the tour happy and recruit a thief | the tour is listening | booming, deadpan, a stage whisper | the tour cheers her heist as the finale |
| Tourists | be entertained | none | questions, applause | rate it |
| Player | find out what she wants | none | flat, short | "I will need a boat." |

## 4. Subtext
Half the pirate tour is real and she has not said which half. "Every word is true" is the lie that is also, partly, true.

## 5. Beat sheet

| # | Time | Beat | What happens |
| --- | --- | --- | --- |
| 1 | 0-6 | Hook | ship's bell; Bilge, cutlass raised, booming the cursed-treasure story to the tour |
| 2 | 6-18 | Setup | intro card; "Is any of this real?" "Every word is true. Especially the parrots." |
| 3 | 18-25 | Turn | she spots the player: "Come aboard, quietly!" at full voice |
| 4 | 25-36 | Briefing | the whisper that carries; a tourist: "Is this part of the tour?" |
| 5 | 36-42 | Button | "A pleasure cruise!"; a tourist: "Best tour yet."; the player's shrug |

## 6. Shot list
Ws on Bilge and the group; low mcu on Bilge for the big lines; a ms for the intro card; singles on the tourists in matched coverage with Bilge (one side of the line per pair, `coverage('samphire', t)`); a ms of the player arriving; mcus of the player in `coverage('samphire', 'player')`.

## 7. Dialogue pass
Ten lines under 16 words (the whisper line is the longest at 15). "Quietly" is the running gag and returns in the outro.

## 8. Music and sound
`turfton`; `shore` bed; the ship's bell at the start and at the button; a creak as the player steps aboard.

## 9. Blocking and vehicles
Bilge at the helm (mark `samphire`), three tourists in a half-circle on the deck (`t1` to `t3`), the player arrives at the back of the group (mark `player`). The deck is at y -3.0: actors stand there at exact heights and the player appears by a `spawn` (a walk on the deck is flagged as off the ground by the checker).

## 10. The button
A tourist's two-word review, and the player's flat shrug at the camera.

## 11. Self-check
- [x] Intro card for Samphire after her first line. [x] No back-of-hat lines. [x] `cutscene-report` OK; line of sight passes.
- [ ] Watched in a browser: not done; check the helm prop (`glaze-steer-ship`) reads as a ship's wheel and that the deck props sit at deck level.
