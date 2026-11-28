# Director's notes: `spade-truce-outro`

The chapter 4 closer. Watch it at `http://localhost:5312/?no-intro&cutscene=spade-truce-outro`.

| | |
| --- | --- |
| Scene | `spade-truce-outro` in `src/cutscene/scenes/story/ch4.ts` |
| Played by | quest `ch4-spade-truce` ("Nobody Fires the Guard") as its outro, after the armory is retaken |
| Kind and length | `chapter-close`, aim 40-80 s; now about 49 s (was 35 s, 4 faults) |
| Where, when | `fort-sandpit-gate`, outside the gatehouse on the fort-gate road; then a cut to the meridian; `sky: 'golden'` (the dusk before "Tonight") |
| Before / after | before: the lockout enforcers cracked at the gate, the armory reclaimed. After: chapter 5, `even-cut-intro` |

## 1. Purpose in the story

Chapter 4 asked whether a crew of outcasts can take a fort. The answer, in a picture: they did, and the fort's own
commander is with them. Everyone the HOA ever ticketed arrives at the gate at once (Granny, Bracken, Tansy, Pip). Then
the next question, as the last image: the Grand Combine wakes, and Vesper promises "Tonight".
Ladders: Granny's pie rung 2 ("I brought pie."), the brass wrench rung 2 (a fort is "not big enough"; here it escalates
to "...Close." so chapter 5's "It's big enough." is one more notch).

The old scene teleported Diggs and the player with despawn/spawn, played three lines over cars no bigger than 6% of the
frame, handed Tansy the wrench count as an exposition line, and gave Pip an errand (Clara's refugees) in a closer.

## 2. The player's feeling

- **In:** a won fight; the armory door open.
- **Out:** pride (the coalition is real, and funny), then dread: the machine is moving, tonight.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Diggs | to restore order, on his own authority | he was fired | proclamation, a salute | commands a coalition he never asked for, holding a pie |
| Bracken | to be counted, on his terms | old distrust of machines and soldiers | archaic dryness | present |
| Granny | to feed the war effort | the Commander's dignity | pie | the Commander holds the pie |
| Pip | to hear Tansy say the big word | Tansy's standards | enthusiasm | slumps, then gets "Close." |
| Tansy | to keep the brass wrench for the real one | Pip | one word, then a concession | admits it is near |
| Vesper (voice) | to promise | nobody can stop him yet | calm | |

## 4. Subtext

- Diggs's "effective immediately" is the language that fired him, turned round: he reinstates himself.
- Tansy's "...Close." is the first time she admits the crew might be the big heist she has saved the wrench for.

## 5. Beat sheet

| # | Time | Beat | What happens |
| --- | --- | --- | --- |
| 1 | 0-8 | Hook | The armory door bangs; Diggs walks out into the light, salutes: "The armory is ours. Spade Guard reinstated, effective immediately." The player nods. |
| 2 | 8-16 | Arrival | Engines on the road: three rides up the fort-gate road in a fan; everyone climbs out. |
| 3 | 16-26 | The coalition | Bracken walks in: "The Unmowed are here, Commander. Mostly with their boots on." Diggs, low: "Spade Guard. Unmowed. Carburettors. Cloverfield. In one sandbox." |
| 4 | 26-32 | The gag | Granny: "I brought pie." She hands it to Diggs, who takes it at attention. |
| 5 | 32-40 | The wrench | Pip: "We took a fort! Big enough for the brass wrench?" Tansy: "No." Pip slumps. Tansy, CU: "...Close." |
| 6 | 40-42 | Turn | A boom; the ground shakes; music out; everyone turns north-west. |
| 7 | 42-49 | Button | The Grand Combine on the meridian, a slow low push-in; `villain`: "Tonight, Turfton achieves zero-millimetre perfection." END OF CHAPTER 4. |

## 6. Shot list

| # | Shot | Lens | Move | On | Motivation |
| --- | --- | --- | --- | --- | --- |
| 1 | `shot('diggs','ms',{toward:'player',height:'low'})` | 40 | follows his walk out | Diggs | authority, shot low |
| 2 | `reaction('player', nod)` | 35 | locked | the player | the hired hand is now an ally |
| 3 | `track` from the roadside | 50 | pans | the rides | the arrival as a parade |
| 4 | `shot('bracken','ms',{height:'low'})` | 40 | locked | Bracken walking in | he stands higher than everyone; shot low |
| 5 | `shot('diggs','mcu',{height:'low'})` | 35 | locked | Diggs | the roll-call |
| 6 | `shot('granny','mcu')` | 35 | locked | Granny | the line |
| 7 | `shot('diggs','ms',{toward:'granny'})` | 40 | locked | the pie handover | the gag needs both of them in the shot |
| 8-10 | `coverage('pip','tansy',1)` singles, reaction | 35 / 30 | cut in | Pip, Tansy | the ladder |
| 11 | `shot('tansy','mcu')` | 35 | locked | Tansy turning | the boom lands on a face first |
| 12 | `dolly` low at the Combine | 54 | slow push | the machine | the threat, picture first, then the voice |

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Diggs | The armory is ours. Spade Guard reinstated, effective immediately. | kept: his voice |
| Bracken | The Unmowed are here, Commander. Mostly with their boots on. | kept |
| Diggs | Spade Guard. Unmowed. Carburettors. Cloverfield. In one sandbox. | full stops for the roll-call |
| Granny | I brought pie. | pie rung 2 |
| Pip | We took a fort! Big enough for the brass wrench? | replaces Tansy's exposition ("Forty-seven wrenches in size order...") with a question |
| Tansy | No. / ...Close. | wrench rung 2, escalated |
| Vesper | Tonight, Turfton achieves zero-millimetre perfection. | the closer's threat; soft, no exclamation (he loses control only in chapter 5) |
| ~~Pip~~ | ~~Clara's refugees still need a lift to Porcelain Support.~~ | an errand hook in a closer |

## 8. Music and sound

| Time | Cue | Why |
| --- | --- | --- |
| 0 | `sandpit`, `wind`; `door` sfx | the fort is theirs |
| 8 | `engine-rev` | the arrivals announce themselves |
| 40 | music out; `boom`, `shake` | the silence before the reveal |
| 42 | `engine-rev` at the machine; `villain` music and stinger on Vesper's line | his theme, once |

## 9. Blocking and vehicles

- Diggs starts in the gatehouse mouth (374, 38.5) and walks out to (374, 44); the player at (377.6, 46.2) and ends there.
  Two Spade Guards flank the gate at (369.4, 42.4) and (379.4, 41.8).
- Granny's, Tansy's and Pip's rides come up the fort-gate road from the south-east and stop at (370.5, 54), (380.5, 55)
  and (375.5, 58.5); the three get out and walk to (371.6, 49.6), (379.8, 50.4), (376.2, 52.2). Bracken walks in from
  (362, 60) to (369.4, 47.6).
- The Grand Combine is spawned on the meridian at (0, -200) for the last shot.

## 10. The button

The Grand Combine, low and enormous, the camera creeping towards it as Vesper says "Tonight". It turns a victory into a
deadline, which is what a chapter closer owes the next chapter.

## 11. Self-check

- [x] Want, obstacle, turn: the coalition gathers; the Combine wakes.
- [x] Hook in 3 s (the door, Diggs walking out); no narration.
- [x] Lines under 16 words; no coordinates.
- [x] Voices per the bible.
- [x] Every speaker framed MS or closer, facing the camera; reactions after the big lines.
- [x] One side of the line per exchange.
- [x] Music motivated; one stinger (villain); one silence before the reveal.
- [x] Ladders: pie rung 2, brass wrench rung 2.
- [x] Golden sky.
- [x] Report OK; removed from the baseline.
- [x] LOS test passes; watched at both sizes.
- [x] `direction.notes` points here.

## 12. Act IV revision (E22, row 59)

Dusk (`sky: 'golden'`), `kind: 'outro'`: this is no longer the chapter close, because rows 60-70 follow. The armory is
**sealed from Thorne Tower**, not retaken (row 60 opens it from below), so:

- The hook is two raps of a fist on steel (`knock`, `latch`) and Diggs walking out: "The armory is sealed from Thorne
  Tower. Not tonight." (was "The armory is ours...").
- Cut: Diggs's "Spade Guard. Unmowed. Carburettors. Cloverfield. In one sandbox." (the coalition forms in row 64) is now
  "Welcome to Fort Sandpit. Wipe your boots." (Bracken's boots gag lands).
- Pip: "The Guard is ours! Big enough for the forty-eighth wrench?" Tansy: "No." ... "...Close." (the wrench ladder is
  unchanged in rung).
- The Grand Combine reveal, the boom, Vesper's "Tonight" line and the `END OF CHAPTER 4` title are cut (the act's
  momentum is the next rows' job). New button: music out, Diggs turns, salutes the player (`tipHat` on a low ms) and says
  "The Guard stands with you. Effective immediately.", then a held silence. Length 47.7 s.
