# Director's notes: `sq-big-lou-embargo-intro`

Re-directed against [../bible.md](../bible.md) and the template in [../TEMPLATE.md](../TEMPLATE.md). Watch it at
`http://localhost:5310/?no-intro&cutscene=sq-big-lou-embargo-intro`.

| | |
| --- | --- |
| Scene | `sq-big-lou-embargo-intro` in `src/cutscene/scenes/side/bigLou.ts` |
| Played by | quest `sq-big-lou-embargo` ("Big Lou's Dry-Hat Embargo") as its intro, given by the Gnomecino strangers |
| Kind and length | `intro`, aim 30-60 s; now 32.4 s at Normal text speed (was 51.1 s, 22 faults) |
| Where, when | stage `gnomecino-door` (the velvet rope, the Gnomecino front), dusk: `sky: 'golden'` with Lou's Lowrider headlights on |
| Before / after | before: the player is a stranger on the kerb, with a rumour of the Gnomecino's door. After: the quest's objective (crack the three Red Caps in the west alley) |

## 1. Purpose in the story

The Gnomecino is the one door in Turfton that will not take a damp hat. This scene makes Big Lou the gatekeeper with a
rule and a grievance: the Red Caps took his crate of forty microfibre hat-towels. It also plants the Mayor as the
rule-breaker the outro will forgive, so that Lou's refusal of him sets up the payoff (Lou lifts the rope for a player who
brings the crate back dry).

The old scene opened on a dolly with Lou's back to the camera for six lines, a caption, and a briefing in the
button. The new one opens on Lou already pacing the rope, lines in close and low, and ends on the stakes.

## 2. The player's feeling

- **In:** cold, a little out of pocket, eager to be let in somewhere.
- **Out:** the door is a test, the test is about towels, and the towels are stolen. They want the job, and they know
  the Red Caps have the crate.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Patron (p1) | to get in with a damp-ish hat | Lou's rule | hope, bluster ("basically dry") | slumps into the facepalm |
| Big Lou | to keep the door dry and get his towels back | a queue of wet hats, the Mayor | two-word sentences, arms folded, the rope | sets the job as the price of the door |
| Mayor Mulch | to be let in ahead of the queue | Lou's rule, his own damp coat | charm, a glaze joke | turned back, unbothered |
| The player | to know the job | Lou's economy of words | one short question | takes it |

## 4. Subtext

- Lou is not cruel; the rule is the only thing he has left of the crate. His "Dry." is grief dressed as a rule.
- The Mayor's "different glaze" is the lie everyone at the rope knows is a lie. Lou lets it go; the look says so.
- The stakes are the crate, not the door: forty towels. The player will hear the crate named and understand the job.

## 5. Beat sheet

| # | Time | Beat | What happens (picture first, then words) |
| --- | --- | --- | --- |
| 1 | 0-4 | Hook | An overhead of the rope, the queue and the Lowrider (stage camera `overhead`, 46 degrees); Lou is already pacing the rope (a move), the queue shuffles; the caption "THE GNOMECINO. GUEST LIST ONLY." is the scene's one caption. |
| 2 | 4-9 | Setup (the rule) | The first patron on an MS, turned to Lou: "It's dry. It's basically dry." Lou low: "Felt." "Not fleece." (a point). |
| 3 | 9-14 | Setup (the reaction) | The patron's facepalm, one beat. |
| 4 | 14-24 | Turn | The Mayor pushes up the queue to the rope: "Two coats, no drips." Lou: "Two-Coat. Damp is damp." The Mayor: "It's a different glaze." |
| 5 | 24-30 | Refusal | Lou turns back to the player: "Dry." A held silence (the one of the scene). |
| 6 | 30-34 | Button | The player: "What's the job?" Lou, low on the rope, the job and the stakes: "Red Caps took my crate. Forty towels. Bring it back. Dry." Hold. |

## 6. Shot list

| # | Shot (size, `frame`/`cut`/`track`/...) | Lens / distance | Move | On | Motivation |
| --- | --- | --- | --- | --- | --- |
| 1 | `stageCut('gnomecino-door','overhead',46)` | 46, high | locked | the rope, the queue, Lou pacing | establish place and the rope; the walk is the hook |
| 2 | `shot('p1','ms',{toward:'lou',side:-30})` | 40 | locked | patron | the first line, on his face, turned to Lou (face step first); the far side of the patron from the queue, so the camera clears his body |
| 3 | `TALK.single('lou','mcu',{height:'low'})` | 35, low | locked | Lou | hero low angle for the two-word lines |
| 4 | `shot('p1','ms',{toward:'lou',side:30})` | 40 | locked | patron | the facepalm reaction |
| 5 | `shot('mayor','ms',{toward:'lou',side:-30})` | 40 | locked | Mayor | the turn; he walks up to the rope while he speaks |
| 6 | `TALK.single('lou','mcu',{height:'low'})` after `face` to the player | 35, low | locked | Lou | Lou does not turn to the Mayor: "Two-Coat. Damp is damp." from the rope |
| 7 | `shot('mayor','ms',{toward:'lou',side:-30})` | 40 | locked | Mayor | the glaze joke (the Mayor stops back at (68.5, -40): a near camera on his line sits inside him) |
| 8 | `TALK.single('lou','mcu',{height:'low'})` | 35, low | locked | Lou | Lou turns back to the player: "Dry." |
| 9 | `TALK.single('you','mcu')` | 35 | locked | the player | the straight question |
| 10 | `TALK.single('lou','mcu',{height:'low'})` | 35, low | locked | Lou | the button: the job, held |

Sides of the line: Lou and the player on `coverage('lou','you', 1)` throughout (the Lou singles and the player's single
share one side). The Mayor and patron shots are taken from Lou's side of their own lines (`toward: 'lou'`). The one
crossing of the Lou-Mayor line into the Lou-player line is a deliberate pull back to Lou at the rope (shot 8, which is
the same side as shot 3).

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Patron | It's dry. It's basically dry. | kept: the patron's hope, the hook's first line |
| Lou | Felt. | was "Felt." with his back to camera: now low, facing the patron |
| Lou | Not fleece. | kept, with the point |
| Mayor | Lou. Tell them the Mayor is here. Two coats, no drips. | was "Lou. Tell them the Mayor is here. Two coats, no drips." (12 words), now the turn |
| Lou | Two-Coat. Damp is damp. | was "Mayor. Two-Coat. Damp is damp. Your car is the problem, not you." Cut to 4 words: the car is the arrival scene's job |
| Mayor | It's a different glaze. | kept: the lie everyone knows |
| Lou | Dry. | the one word that closes the turn |
| Player | What's the job? | the player asks; was "And the car?" |
| Lou | Red Caps took my crate. Forty towels. Bring it back. Dry. | was "My crate. Forty towels. Gone." + "Red Caps. Three of them. The west alley." + "Bring the crate back. Dry. Then I let you in." Merged into the button: the stakes and the job in one line, 11 words |
| ~~Lou~~ | ~~Mind the bonnet.~~ | cut: the car is the arrival scene's (`sq-big-lou-embargo-vip`), not the door's |
| ~~Lou~~ | ~~The west alley.~~ | cut: the HUD shows the place; the crew names it once, in the job |
| ~~Lou~~ | ~~Do it right. I give you my bowler.~~ | cut: the bowler is the outro's payoff |

Names checked: `npm run lore -- find "big lou"`, `npm run lore -- find "gnomecino"` (Big Lou, the Gnomecino, Mayor
Barnaby "Two-Coat" Mulch, the towel crate, the Red Caps).

## 8. Music and sound

| Time | Cue | Why |
| --- | --- | --- |
| 0 | `night` ambience, `heist` music under the hook | the neon door is a heist's front; the walk starts it |
| 0 | caption (no sound) | the one caption of the scene: the rule, as a sign |
| 24 | held silence (2 s), no new cue | the refusal lands; nothing else in the scene is quiet |

No stingers: the scene is a low, slow turn.

## 9. Blocking and vehicles

- Lou paces the rope between (70, -34) and (70, -26) (his walk loop), faces the player at the rope; the patron walks his
  queue loop at x 66, z -35 to -38 (his walk); the second patron stays at (66, -38) and the Mayor starts at (66, -42), walks
  to (68.5, -40) at the turn and stays there.
- The player stands at the rope mark (66, -29), turned to Lou.
- Lou's Lowrider is parked at (70, -22) with its headlights on (`castRide(..., { headlights: true })`), a light in the
  back of the frame.
- The player ends at the rope, at their mark, Lou at the rope. The quest's objective begins from there.

## 10. The button

Big Lou at the rope, low, arms folded, saying the job in one breath: "Red Caps took my crate. Forty towels. Bring it back.
Dry." Then a beat of the neon. It is the right last moment because the picture is the rule and the line is the price.

## 11. Self-check

- [x] The scene has a want (the towels, the door kept), an obstacle (the queue, the Mayor) and a turn (the Mayor).
- [x] The hook lands in 3 s: Lou pacing on a move, not a caption or a narrator line; one caption in the scene.
- [x] Every line is under 16 words (longest 12); nobody says what the picture shows; no coordinates; the place is named once.
- [x] Voices: Lou two words at a time; the patron and the Mayor short and vain; the player's question is four words.
- [x] Every speaker is framed MS or closer and turned to the listener; Lou is low for his hero lines.
- [x] One side of the line for Lou and the player; the Mayor shots taken from Lou's side of their own line.
- [x] Music has a reason; one held silence; no stinger.
- [x] Night scene: `sky: 'golden'` and lit by the headlights of Lou's car.
- [x] Report: OK at 32.4 s (was 51.1 s, 22 faults). The Mayor's shots are taken from the far side of him (a near camera
      on his line sits inside his body) and Lou answers from the rope, not turned to the Mayor (no line crossing).
- [x] `direction.notes` in the scene points at this file.
