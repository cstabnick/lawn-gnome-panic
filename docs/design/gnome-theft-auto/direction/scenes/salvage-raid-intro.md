# Director's notes: `salvage-raid-intro`

The game's biggest dramatic beat. Watch it at `http://localhost:5312/?no-intro&cutscene=salvage-raid-intro`.

| | |
| --- | --- |
| Scene | `salvage-raid-intro` in `src/cutscene/scenes/story/ch3.ts` |
| Played by | quest `ch3-salvage-raid` ("The Salvage Raid") as its intro, given at Side-Valve Salvage |
| Kind and length | `chapter-open`, aim 45-80 s; now about 80 s at Normal text speed (was 84 s, 9 faults) |
| Where, when | `bodega-front` (cold open), then `side-valve-bay`; rain, `sky: 'golden'` (a storm-dark dusk that still lights faces) |
| Before / after | before: chapter 2's close (the tablet, Cam's sale off screen). After: the fight with Turncoat Cam and the raiders on the apron, the run north up the Ring Road, then `salvage-raid-outro` |

## 1. Purpose in the story

Chapter 3 asks: can the crew survive losing everything? This scene takes everything: the bay (raided), the acorn (Vesper
takes it in person), Tansy (gone out the back), Pip's arm (gone, on camera). It pays off Turncoat Cam's broom ladder
(the broom is still in his hand when he steps out of the van), climbs the hat ladder to rung 4 ("Nice hat. Shame." - he no
longer finishes it), Asphalt's barometer (she ignores the sirens: Turfton is used to raids), and Tansy's "not my
problem" (the bay is now everybody's problem, and she raises her voice for the first time).

The old scene had the Narrator describe the betrayal and the arm ("Turncoat Cam steps out of the first van", "Pip's clay
arm cracks clean off") over shots that did not show them, Tansy vanish with a whoosh, a 31 s tracking shot, and John
reading stage directions as the last line.

## 2. The player's feeling

- **In:** chapter 2's high (the debt paid, the offer refused) and Cam's sale, which they saw and the crew did not.
- **Out:** shock and anger: Cam's price was cheap, Vesper is untouchable, Pip took a hit meant for them. A job with
  personal stakes: crack the raid, get Pip out, go north.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| John Bodega | to tell nobody in particular what he saw | it is not his business | dry commentary | the dread line: "Side-Valve's west." |
| Turncoat Cam | to get paid and leave | the crew's faces | no eye contact, short and transactional | gone to Vesper's side, broom swapped for the acorn |
| Tansy | to know the price of the betrayal; then to save Pip | she cannot fight a raid | one question, one word of contempt; then orders | shouts for the first time; runs to draw the raid off |
| Vesper | the acorn, and to tell the player they are next | nothing at all | courtesy ("Thank you, friend.") and the hat line, unfinished | leaves with the acorn |
| Pip | to protect the player | the raider is bigger | throws himself in the way | loses his arm, jokes through it |
| The player | (still) | | crossed arms at Vesper | given Pip to save |

## 4. Subtext

- Cam's "A racing charter. Patio Heights." is a confession of envy (chapter 2's look at the racer). He cannot look at
  Tansy. Tansy's "Cheap." means: you were worth more to us than that.
- Vesper's "Nice hat. Shame." leaves the threat unfinished because he no longer needs to finish it: he is winning.
- Pip's "...That was my good arm." is pain dressed as a joke (law 5: the coping character).

## 5. Beat sheet

| # | Time | Beat | What happens |
| --- | --- | --- | --- |
| 1 | 0-3.5 | Hook | Bodega corner in the rain: sirens, two HOA vans flash west through the crossing, headlights on. |
| 2 | 3.5-11 | Dread | John watches them go: "Sirens, heading west. Asphalt didn't even look up." A beat. "...Side-Valve's west." |
| 3 | 11-15 | Arrival | The bay: Tansy stops work and turns to the road; a skid; Pip stands up from his crate. |
| 4 | 15-27 | The betrayal | No music. A low shot on the van door: Cam steps out, broom in hand. Pip: "...Cam?" Tansy: "How much?" Cam: "A racing charter. Patio Heights." Tansy, CU: "Cheap." |
| 5 | 27-45 | Vesper | His theme and sting; the pearl Lowrider glides in. Cam hands over the acorn; Vesper takes it ("Thank you, friend."). He turns to the player, low: "Nice hat." ... "Shame." Tip of the hat. The player crosses their arms. |
| 6 | 45-58 | Turn: the arm | `chase`. The raider goes for the player; Pip runs in between; the swing; glass; the cut lands on Pip, the arm gone, clutching the stump. Music out, held silence. |
| 7 | 58-70 | Tansy | First raised voice: "PIP!" Pip: "...That was my good arm." Tansy, handheld: "Get him out. Go north. I'll draw them off." She runs out the back; the raider follows. |
| 8 | 70-80 | Button | The pearl Lowrider pulls out with the acorn, nobody at the wheel. `villain`, the chapter sting, CHAPTER 3 — COLD CLAY. |

## 6. Shot list

| # | Shot | Lens | Move | On | Motivation |
| --- | --- | --- | --- | --- | --- |
| 1 | `cut` at the Bodega corner looking down the z = 60 road | 50 | locked | the vans passing | the hook is a sound and a blur of headlights |
| 1b | `cut` insert on Asphalt (`asphalt-cat`), the prologue's barometer framing | 44 | locked | the cat | the sirens pass and she does not move: picture before John's line |
| 2 | `shot('john','mcu',{toward:'cat'})` | 35 | locked | John | the chorus; two lines, one shot |
| 3 | `shot('tansy','mcu',{toward:'player'})` | 35 | locked | Tansy | she hears it before she sees it |
| 4 | `cut` beside Pip's crate | 46 | locked | Pip standing | the crew, small and still |
| 5 | low `cut` on the van door | 42 | locked | Cam stepping out | the reveal is a picture, in silence |
| 6 | `cut` on Pip | 34 | locked | Pip | the first reaction is disbelief |
| 7-9 | `coverage('tansy','cam',1)` singles, Tansy MCU then CU | 35/30 | cut in | Tansy, Cam | the price, then the verdict closer |
| 10 | `track` low by the apron edge | 46 | pans | the Lowrider | nobody driving it |
| 11 | `cut` low on the car door | 40 | locked | Vesper getting out | he arrives already in control |
| 12 | `shot('vesper','ms',{toward:'cam',height:'low'})` | 40 | locked | the handover | the only thing he ever touches |
| 13 | `reaction('cam')` | 35 | locked | Cam | he cannot hold Vesper's eye |
| 14 | `shot('vesper','mcu',{toward:'player',height:'low'})` | 35 | locked | Vesper | threat: low, alone, no cut while he talks |
| 15 | `reaction('player', crossArms)` | 35 | locked | the player | the audience's face |
| 16 | `shot('pip','ms',{toward:'player',side:50,handheld:0.04})` | 40 | moves with Pip | Pip's run | energy; it leads him into the hit |
| 17 | `shot('pip-hurt','mcu')` | 35 | locked | Pip, armless | the cut on the glass sound lands on the result |
| 18-19 | Tansy CU, Pip CU | 30 | locked | | her shout, his joke |
| 20 | `shot('tansy','mcu',{handheld:0.03})` | 35 | handheld | Tansy | orders under fire |
| 21 | `shot('tansy','fs',{side:70})` | 45 | moves with her | Tansy running out | she leaves on camera, not by a whoosh |
| 22 | `track` from the bay corner | 44 | pans | the Lowrider leaving | the threat under the title |

Sides of the line: Tansy and Cam on `coverage('tansy','cam', 1)`; Vesper's singles both from his left of the Vesper-Cam
and Vesper-player lines. No crossings inside an exchange.

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| John | Sirens, heading west. Asphalt didn't even look up. | commentary, not stage directions; Asphalt's rung (ignores sirens) |
| John | ...Side-Valve's west. | the dread line; turns the cold open into a warning |
| Pip | ...Cam? | was nothing: the first reaction is his |
| Tansy | How much? | replaces "Cam sold us out for a Patio Heights racing charter!" (an exposition line) |
| Cam | A racing charter. Patio Heights. | the motive in his own mouth, transactional |
| Tansy | Cheap. | |
| Vesper | Thank you, friend. | "friend" is his word for everyone |
| Vesper | Nice hat. / Shame. | hat ladder rung 4, split by a pause so the unfinished threat lands |
| Tansy | PIP! | her first raised voice in the game |
| Pip | ...That was my good arm. | coping, after the silence |
| Tansy | Get him out. Go north. I'll draw them off. | three clauses; the objective in her voice, no road names |
| ~~Narrator~~ | ~~Rain on the Side-Valve apron. Sirens. Nobody called ahead.~~ | opened on narration |
| ~~Narrator~~ | ~~Turncoat Cam steps out of the first van, broom still in hand.~~ | described the picture: now it is the picture |
| ~~Narrator~~ | ~~Pip's clay arm cracks clean off at the shoulder.~~ | the arm is now on camera |
| ~~Pip~~ | ~~My arm! Take my Zero-Turn and go north up the Ring Road!~~ | a waypoint read-out; Tansy gives the job |
| ~~John~~ | ~~Bodega & Sons, in the rain. Sirens go past. Asphalt doesn't even blink...~~ | stage directions, 17 words |

Names checked: `npm run lore -- find "Patio Heights"`, `find turncoat`, `find asphalt`.

## 8. Music and sound

| Time | Cue | Why |
| --- | --- | --- |
| 0 | `rain` ambience, no music; `alarm` | the cold open is the weather and the sirens |
| 13 | `skid` at the van | the sound tells the bay the raid has arrived |
| 15-27 | silence (ambience only) | the betrayal plays without score |
| 27 | `villain` music + `villain` stinger | Vesper's arrival, once |
| 45 | `chase` | the raid turns physical |
| 52 | `glass` sfx, music out, `shake`; held `silence` | the arm; the sincere beat |
| 60 | `chase` back on Tansy's orders | |
| 70 | `villain` under the departing car; `chapter` stinger with the title | the threat leaves with the acorn |

Two stingers (villain, chapter), as the bible allows.

## 9. Blocking and vehicles

- Bodega: John at his doorway mark (-80, 88), turns towards the crossing.
- Vans: from (-30, 57.5) and (-30, 62.5) west along both lanes of the z = 60 road, stopping at (-150, 57.5) and
  (-156, 62.5), headlights on. Cam rides in van 1 (seat 1) with the broom; the raider in van 2.
- Bay: the player at (-146.4, 70.4) facing the road, ends there (the fight starts on the apron). Tansy at (-143.4, 72.6) by
  her Zero-Turn (-141, 70), runs out the back along (-150, 75.5) -> (-156.5, 78.2) -> (-166, 79). Pip sits on his crate
  (-135.5, 74), stands, runs round the Zero-Turn to (-147.6, 68.6) between the raider and the player. At the hit, `pip`
  is swapped for `pip-hurt` (`armless: true`) on the same spot, on the cut.
- Cam walks to (-150.2, 64.6); Vesper's pearl Lowrider comes in behind to (-144, 63.5), he walks to (-147.6, 65.2), gets
  back in during the raid and leaves west then north.

## 10. The button

The pearl Lowrider's taillights going away down the wet road with the acorn inside and nobody at the wheel, under
CHAPTER 3 — COLD CLAY. The chapter's loss in one picture, and its villain leaving with no hurry at all.

## 11. Self-check

- [x] Want, obstacle, turn: the crew against the raid; the turn is the arm.
- [x] Hook in 3 s (sirens, headlights); no narration at all.
- [x] Lines under 16 words (longest 9); no coordinates.
- [x] Voices per the bible: Tansy short, Vesper complete and soft, Pip coping, John dry.
- [x] Every speaker MS or closer, facing the camera; reactions on Pip, Cam, the player.
- [x] One side of the line per exchange.
- [x] Music changes motivated; two stingers; one held silence.
- [x] Ladders: Cam's broom (payoff), the hat (rung 4), Asphalt (sirens), "not my problem" (paid).
- [x] Lit: golden sky, van headlights.
- [x] Report OK; removed from the baseline.
- [x] LOS test passes; watched at 960x600 and 390x844.
- [x] `direction.notes` points here.
