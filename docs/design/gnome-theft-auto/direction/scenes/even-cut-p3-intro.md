# Director's notes: `even-cut-p3-intro`

| | |
| --- | --- |
| Scene | `even-cut-p3-intro` in `src/cutscene/scenes/story/m70-even-cut.ts` |
| Played by | quest `ch5-even-cut-p3` (The Gilded Lawn-Throne) as its intro |
| Kind and length | `intro`, aim 30-60 s (about 34 s) |
| Where, when | stage `e70-deck-road` (the meridian at z -240, where the boss runner starts); cutaways to `dust-safehouse` (Tansy) and `city-hall-steps` (Juniper); day, `sky: 'noon'` |
| Before / after | before: `even-cut-p2-outro` (the player lands on the deck; the PA sends the Porcelain Guard to the rear). After: the deck fight (`boss-combine`, phase `guards`) |

## 1. Purpose in the story

The boss shows himself, without being seen: the Gilded Lawn-Throne comes up at the far end of the deck with the crown of
a top hat over its back. Vesper's PA, polite for seventy rows, comes apart here: the first exclamation marks he has ever
used, then the last rung of the hat ladder ("And to the gnome in that hat: tonight, it cracks.", batch-3-notes section 3).
Tansy gives the job.

## 2. The player's feeling

- **In:** just landed on a moving building; breathless. **Out:** he is shouting, and he is up there, at the end of this.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Vesper (PA) | clear his road | a gnome on his deck | courtesy, then contempt | the composure cracks |
| Pip | understand what he hears | it is new | notices out loud | — |
| Tansy | send the player | distance (on the phone) | three clauses | — |
| Juniper | answer Vesper | she is at City Hall | paperwork as a weapon | — |

## 4. Subtext

Vesper's exclamation marks are fear (the hairline under the hat). Tansy's "Shouting men miss things." is also about
herself: she never raised her voice either.

## 5. Beat sheet

| # | Time | Beat | What happens |
| --- | --- | --- | --- |
| 1 | 0-3 | Hook | low on the road: porcelain boots in step, the wheels behind |
| 2 | 3-12 | Setup | the player's eyes down the deck; the throne comes up out of the bridge, a hat's crown over its back; the PA: "please stand aside" |
| 3 | 12-20 | Turn | the flank; "Chipped! Muddy! Unregulated!"; Pip: he never shouts; Tansy |
| 4 | 20-30 | | the push-in down the deck on the hat line; silence; Juniper files: Mr Thorne is parked illegally (the gag) |
| 5 | 30-34 | Button | Tansy: "Crack the Guard. Reach the throne. Mind the blades."; the hat over the throne turns towards the player |

## 6. Shot list

Stage spot `boots` (low, 44 mm-ish) for the hook; a dolly at the player's eye height on the deck (the deck is a prop: no
actor can stand on it, so the player is the camera, as `even-cut-p2-outro` set up); stage spot `flank`; a low MS on the
Guard for the shout; singles for Pip (handheld), Tansy (mcu, then cu), Juniper; the same deck eye-line pushed in for the
hat line and the button.

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Vesper (PA) | Friends. The meridian is closed for a scheduled cut. Please stand aside. | the old Vesper: complete, polite |
| Vesper (PA) | Look at yourselves! Chipped! Muddy! Unregulated! | the first exclamation marks (bible: only on the finale PA) |
| Pip | He's shouting. Vesper never shouts. That's new, right? | |
| Tansy | Shouting men miss things. | a twisted proverb |
| Vesper (PA) | And to the gnome in that hat: tonight, it cracks. | the outline's line, verbatim; the hat ladder's last spoken rung |
| Juniper | The counter-order is signed. As of noon, Mr Thorne is parked illegally. | the one gag: insult by agreement with the law |
| Tansy | Crack the Guard. Reach the throne. Mind the blades. | the job, three clauses |

## 8. Music and sound

`tension` under the boots, `villain` stinger on the throne and `villain` music from the flank (Vesper on screen, in a
way); out for the silence after the hat line; `tension` back for Tansy; `danger` on the hat turning. Footsteps, engine,
door-creak (the hydraulics), static on the PA, phone, paper, creak. Bed `wind`.

## 9. Blocking and vehicles

The Combine prop at (0, -240) (scale 5, nose +z) with the open deck; the throne rises out of the crown plate in three
heights across cuts. Guards on the west verge walking south; Pip on the east verge; Tansy at the safehouse map table;
Juniper at the City Hall podium. No player actor (the player's eyes are the camera).

## 10. The button

The hat's crown over the throne's back turns slowly towards the lens. He knows where the player is.

## 11. Self-check

- [x] Want, obstacle, turn. Hook by 3 s. Lines under 16 words. One gag (Juniper). One held silence.
- [x] `cutscene-report` OK; `scenes.test.ts` (line of sight) passes.
