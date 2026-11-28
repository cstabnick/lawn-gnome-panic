# Director's notes: `sandpit-drop-intro`

Re-directed in the Story B pass against [../bible.md](../bible.md), following the reference [mowers-keepers-intro.md](mowers-keepers-intro.md).
Watch it at `http://localhost:5312/?no-intro&cutscene=sandpit-drop-intro`.

| | |
| --- | --- |
| Scene | `sandpit-drop-intro` in `src/cutscene/scenes/story/ch4b.ts` |
| Played by | quest `ch4-sandpit-drop` ("The Sandpit Drop") as its intro, given at the Dust Flats Overlook |
| Kind and length | `intro`, aim 30-45 s; now 34.3 s at Normal text speed (was 20.0 s, 5 faults) |
| Where, when | stages `dust-safehouse` (the map table) and `fort-sandpit-pad` (the picture inside the walls); day, golden at the Overlook |
| Before / after | before: `runway-intro` and the Crop Duster run (the chapter-open gets the crew to the Overlook). After: the drop itself, a parachute over the wall onto the pad |

## 1. Purpose in the story

Chapter 4's question is whether outcasts can take a fort. This scene is Pip's second "Okay, hear me out" of the game (the
only one in chapter 4), and it turns his bad plan into a plan Tansy will take: skip the gate, drop over the wall, land on
the Whirligig and fly it home. The picture of the pad shows the prize and the snipers, so the drop has a reason. Plants:
the parachute joke (paid off by Pip's button), Vesper's citation for "unauthorised verticality" (a running joke about the
Whirligig: he cites everything that flies).

The old scene had Pip give the plan as two lines, a Tansy line that read the Whirligig's citation as a waypoint, a long
pad shot with no speaker, and a button that was the parachute line on a two-shot with Pip out of frame.

## 2. The player's feeling

- **In:** the Crop Duster run is ahead; the player has been told "fly" and is not yet sure they like it.
- **Out:** the plan is clear (land on the pad, take the chopper, fly it home), the snipers are the real threat, and the
  parachute joke has landed. The player knows Pip will be the one who ruins the plan and Tansy is the one who fixes it.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Pip | to sell the air drop | Tansy's plan-taking, the gate's snipers | bounce, enthusiasm, a sales pitch | Tansy takes his plan (with the pad, not the parachute) |
| The player | to understand the drop | Pip's pitch | a blank stare, one question | takes the drop as a job |
| Tansy | to make the plan safe enough to fly | the snipers, Vesper's citations | flat, three clauses | the plan is hers: land, take, fly |
| Snipers (picture) | to keep the pad covered | the crew's approach | watching | one turns to the other |

## 4. Subtext

- Pip is afraid the gate plan will be cancelled and wants a plan that sounds like his. "Morale" is what he says he is
  protecting; he is protecting his pride.
- Tansy is more afraid than she sounds and takes the plan because it is the only one that gets the crew off the ground.
- The snipers' turn is a small fear that the Spade Guard is not as sleepy as Pip says.

## 5. Beat sheet

| # | Time | Beat | What happens (picture first, then words) |
| --- | --- | --- | --- |
| 1 | 0-3 | Hook | Pip walks to the table at a bounce (the walk is the first thing); the first line is "Okay, hear me out." |
| 2 | 3-7 | Reaction | The player's blank stare, held 1.2 s (the joke is the stare). |
| 3 | 7-14 | The plan | Pip: "Five snipers watch the gate. So we don't use the gate." Then: "Crop Duster over the wall. Jump out. Don't check the parachute." |
| 4 | 14-19 | The question | The player: "Why not check it?" Pip: "Morale." |
| 5 | 19-23 | Turn | Tansy takes the plan in three clauses. |
| 6 | 23-30 | The picture | The fort pad, wide, with the Whirligig on its mark; a `reveal` stinger; a sniper's MS, low, turns his head to his partner. |
| 7 | 30-33 | Verdict | Tansy: "Vesper cited it for unauthorised verticality. Let's earn the ticket." |
| 8 | 33-34 | Button | Pip, MCU, dead serious: "Parachutes are just umbrellas with ambition." Held 1.2 s. |

## 6. Shot list

| # | Shot | Lens / distance | Move | On | Motivation |
| --- | --- | --- | --- | --- | --- |
| 1 | `TABLE.single('pip','ms')` | 40 | Pip walks to the table | Pip | the bounce is the hook |
| 2 | `TABLE.single('pip','mcu')` | 35 | locked | Pip | "Okay, hear me out." |
| 3 | `reaction('player', {toward:'pip', hold:'pause'})` | 35 | locked | the player | the blank stare |
| 4 | `TABLE.single('pip','mcu')` | 35 | locked | Pip | the plan |
| 5 | `TABLE.single('pip','mcu')` | 35 | locked | Pip | the parachute line |
| 6 | `TABLE.single('player','mcu')` | 35 | locked | the player | "Why not check it?" |
| 7 | `TABLE.single('pip','mcu')` | 35 | locked | Pip | "Morale." |
| 8 | `TABLE.single('tansy','mcu')` | 35 | locked | Tansy | the plan in three clauses |
| 9 | `spot(PAD,'wide')` | 46 | locked | the pad, the Whirligig, the snipers | the picture; the `reveal` stinger on it |
| 10 | `shot('sniper-w','ms',{height:'low', toward:'sniper-e'})` | 40 | locked | sniper-w | the turn: the sniper's head moves, `face` to his partner |
| 11 | `TABLE.single('tansy','mcu')` | 35 | locked | Tansy | the citation |
| 12 | `TABLE.single('pip','mcu')` | 35 | locked | Pip | the button |

Sides of the line: Tansy and Pip are shot from one side of their line, `coverage('tansy','pip', 1)`, with the player on
the same side of the table. The pad picture is outside the table line and does not cross it.

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Pip | Okay, hear me out. | the hook; Pip's second "hear me out" |
| Pip | Five snipers watch the gate. So we don't use the gate. | was "Five Spade Guard snipers..." (the guards are named in the picture); cut the qualifier |
| Pip | Crop Duster over the wall. Jump out. Don't check the parachute. | the plan; the joke is "don't check" |
| Player | Why not check it? | the straight man |
| Pip | Morale. | the joke: one word |
| Tansy | Land on the pad. Take the Whirligig. Fly it home. | three clauses; she takes the plan |
| Tansy | Vesper cited it for unauthorised verticality. Let's earn the ticket. | the running joke on Vesper's citations |
| Pip | Parachutes are just umbrellas with ambition. | the button; the parachute is a prop Pip cannot hold (`parachute-canopy` is `place` only), so the line carries it |
| ~~Tansy~~ | ~~Land on the Whirligig pad inside: the chopper Vesper cited for "unauthorized verticality".~~ | cut: replaced by the three-clause plan and the verdict line |
| ~~Pip~~ | ~~So we fly a Crop Duster over the wall and bail out without checking the parachute.~~ | cut: the plan is now two lines |

Names checked: `npm run lore -- find "Whirligig"`, `find Vesper` (Vesper Thorne, the HOA's citation-happy lead).

## 8. Music and sound

| Time | Cue | Why |
| --- | --- | --- |
| 0 | `heist` music, `wind` ambience | the drop is a heist; the wind keeps the Overlook open |
| 23 | `reveal` stinger on the pad picture | the Whirligig is the prize; one stinger |
| 30 | none | the verdict is a line, not a sting |

## 9. Blocking and vehicles

- Safehouse: Tansy at (268, 43) at the table. Pip starts at (278, 56), walks at 2.5 m/s to (277, 46) and stops at the
  table. The player at (274, 44), yaw -2.36, stands and reacts to Pip's first line.
- Fort pad: the Whirligig (`fort-whirligig`, scene vehicle `chopper`) parked on its mark (358, -8). Sniper-w at (352, 6),
  sniper-e at (368, 20), the pad's own kneel marks (they stand in the scene; the pose is a standing one, see the self-check).
- The player ends on foot at the Overlook (274, 44).

## 10. The button

Pip, dead serious, on the parachute line, one second held: the joke is the line and the seriousness, and it is the right
last moment because the crew is about to jump, and the player is the one who will check it.

## 11. Self-check

- [x] The scene has a want (sell the drop), an obstacle (the snipers, the citations) and a turn (Tansy takes the plan).
- [x] The hook lands in 3 s (Pip's walk to the table, then his first line); no narration.
- [x] Every line under 16 words (longest 11).
- [x] Voices: Pip bright and quick, Tansy flat and in three clauses, the player two words.
- [x] Every speaker MS or closer and facing the camera for their line (the report is clean: 0 faults).
- [x] One side of the line per conversation (`coverage('tansy','pip', 1)`).
- [x] Music has a reason at each change; one `reveal` stinger.
- [x] Ladders: "unauthorised verticality" is the running joke about Vesper's citations; the parachute joke is set up here and
      paid off by the button.
- [x] Day scene.
- [x] Report OK (0 faults); `npx tsc --noEmit -p .` passes.
- [x] `npx vitest run src/cutscene/scenes/scenes.test.ts -t "sandpit-drop-intro"` passes (line of sight).
- [x] Watched on a desktop (960x600) and a phone-sized window (390x844); every speaker's face is in frame and readable. One
      moving close-up (Pip's walk to the table, about 6 s on the phone) has his hat over his face for a moment; it is the
      bounce, and the face returns on the line.
- [x] `direction.notes` points here.

## 12. Act IV revision (E22, row 57)

Dawn (`sky: 'golden'`), `kind: 'intro'`. Pip now holds the `parachute-rig` Hogweed fitted in row 56 (the kazoo stays with
the other scenes).

- The running joke pays: Pip "Okay, okay. Hear me out." (escalated from the Founders' Boot rung), Tansy "Don't.", and
  Pip says it anyway; Tansy then lets him run the plan (her act IV change), only supplying the three clauses at the end.
- The rig is named once: "Hogweed's rig, the almost-certainly one." Player: "Should I check it?" Pip: "Don't. Morale."
- Everything after (pad reveal, the sniper turn, the unauthorised-verticality ticket, "umbrellas with ambition") is as
  built. Length 37.2 s.
- Quest comms (row 57): step 0 Pip + Tansy (Hogweed's rig, no gate, bail out when the ring is green), step 1 Tansy
  (Whirligig boarded, three-hat heat), step 2 Pip ("Diggs is behind you").
