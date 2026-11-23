# Director's notes: `tablet-outro`

Watch it at `http://localhost:5310/?no-intro&cutscene=tablet-outro`.

| | |
| --- | --- |
| Scene | `tablet-outro` in `src/cutscene/scenes/story/ch2d.ts` |
| Played by | quest `ch2-unmowed-tablet` ("The Cracked Tablet") as its outro, the chapter 2 closer, after the welders are cracked and the player brings the rig back |
| Kind and length | `chapter-close`, aim 40-80 s; now 45 s at Normal text speed (was 44.9 s, 11 faults) |
| Where, when | stage `unmowed-hollow` (dusk, `sky: 'golden'` so the faces read), then `side-valve-bay` at night (lit by the porcelain lantern; `sky: 'golden'`); rain bed on the bay |
| Before / after | before: the armoured Ride-On rolls up the west highway with the Stopping Stone's shape on the tablet in the player's head. After: free roam in chapter 3 (the bay is the target; the Combine fires at the end of chapter 3) |

## 1. Purpose in the story

Chapter 2 asked whether the player would take Vesper's deal. This scene answers it with a threat: Turncoat Cam is
already selling the crew out (the acorn, Tuesday, the racing charter). It also holds the first sincere scene of the
game: the jokes stop for the Stopping Stone and for Pip's question ("they're really gonna level the whole lawn?"),
and it plants Cam's motive (one envious look at Pip's racing Zero-Turn). It opens a side quest (Sorrel's errand: the
girl from Fescue in the hollow).

Two payoffs owed by the ladders: Pip's arc (quiet, shamed, asking the first sincere question) and Cam's motive (the
racing charter). Vesper's line is a threat, not a joke: the chapter's last image is the threat.

## 2. The player's feeling

- **In:** the tablet is cracked, the job is done, the rig is heavy and a little proud.
- **Out:** the first real weight of the game: the Combine will level the whole lawn, Bracken says so, and someone in the
  bay is already selling the crew out. Dread, not a laugh; the title card is the button.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Bracken | to make the outsider understand what the Combine means | the outsider's cheer; the years | a held stone, a statement, no joke | has said the one thing he has to say |
| Pip | to be useful, now | the fear of the Fescue name | nothing: he asks | asks the sincere question, and is answered by the silence |
| Sorrel | to keep the crew fed with the errand | the grief in the hollow | gentle, practical | opens the side quest, softly |
| Turncoat Cam | to get the racing charter (and to be someone) | loyalty (he has none; he sells the crew) | transactional, short, looks at the racer before he speaks | sells the acorn to Vesper |
| Vesper (on the phone) | to have the acorn on Tuesday | the crew | a compliment: "Of course, Cameron." | answers the sale |

## 4. Subtext

- Bracken's "They have done it before. Long ago. To us." is about the Mower, and about a grief he will not name (the
  lore's Mower; R-072: the Mower levelled a lawn before, "long ago, to us"). The silence is for that.
- Pip's question is his own fear coming out: Fescue is his family's ground, and Wendel is its regent. He does not say it.
- Cam looks at the Zero-Turn for a held beat before he speaks: envy is the whole of his motive. His "the racing
  charter's mine" is the only thing he wants in his own voice.
- Vesper's "Of course" is the most polite threat in the game: he has expected it.

## 5. Beat sheet

Timings at Normal text speed (from the checker, 44.9 s total).

| # | Time | Beat | What happens (picture first, then words) |
| --- | --- | --- | --- |
| 1 | 0-2.9 | Hook | The armoured rig drives into the hollow (`drive`): the picture is the line. No narration. |
| 2 | 2.9-9.1 | Setup (the walk) | The player steps out and walks up to the ring, tracked by a fixed camera. |
| 3 | 9.1-14.8 | The sincere turn | Bracken holds up the Stopping Stone, low MCU, sad stinger and `sad` music: "The Stopping Stone. It was made to hold back the Grand Combine, and it will." |
| 4 | 14.8-18.0 | The question | Pip, quiet, facing the camera: "Wait... they're really gonna level the whole lawn?" |
| 5 | 18.0-21.3 | The answer | Bracken, eye-level MCU: "They have done it before. Long ago. To us." Music out (0.6 s). |
| 6 | 21.3-23.4 | The silence | One held silence (2.0 s), no music, ambience only. |
| 7 | 23.4-28.6 | Turn (the errand) | Sorrel, gently: "There's a girl from Fescue in the hollow. She'll want to talk to you." |
| 8 | 28.6-33.4 | The bay | Music `tension`, rain: a wide of the bay at night (`sky: 'golden'`), then the envy cut on Cam and Pip's Zero-Turn; he looks at it (2.8 s held). |
| 9 | 33.4-39.0 | Threat | The dolly in on Cam, low: "The acorn's in the crate under the bench. Tuesday. And the racing charter's mine." `villain` stinger, Vesper on the phone: "Of course, Cameron." |
| 10 | 39.0-44.9 | Button | The title: END OF CHAPTER 2. |

The turn is at about 60% (beat 7 to 8: the errand becomes the bay). The button is the title after the threat line: the
last image is Cam under the dolly with the threat said, never a gag.

## 6. Shot list

| # | Shot (size, `frame`/`cut`/`track`/...) | Lens / distance | Move | On | Motivation |
| --- | --- | --- | --- | --- | --- |
| 1 | `track` the rig from the highway | 50 | follows it | the armour | the rig rolls in: sound and picture carry the hook |
| 2 | `track` the player on the walk | 50 | a fixed camera turning to follow | the player | the walk is the moving shot that fills the time |
| 3 | `BP.single('bracken','mcu',{height:'low'})` | 35, low | locked | Bracken with the stone | the stone held up from below: the sincere beat, the jokes stop |
| 4 | `BP.single('pip','mcu')` | 35, eye | locked | Pip | the quiet question, facing the camera |
| 5 | `BP.single('bracken','mcu')` | 35, eye | locked | Bracken | the answer, eye-level, nobody above anybody |
| 6 | `BS.single('sorrel','mcu')` | 35 | locked | Sorrel | the errand, gently |
| 7 | `spot('side-valve-bay','wide')` | 52 | locked | the bay at night | establishing: the apron, Pip's racer, the lantern |
| 8 | envy `cut` at (-146, 62, 1.6) on (-145, 69.5) | 46 | locked | Cam and Pip's Zero-Turn | the plant: Cam looks at the racer for a held beat (`face` to the racer, 1.6 s) |
| 9 | `dolly` on Cam from (-152, 65, 1.6) to (-153.5, 66.5, 1.5) | 44 | slow in, 4.5 s | Cam, low | the threat: Cam faces the camera, alone in frame |

Sides of the line: Bracken and Pip on `coverage('bracken','pip', 1)`; Bracken and Sorrel on `coverage('bracken','sorrel', 1)`.
The bay is one camera per beat, the threat from the front of Cam (his facing is east, toward the racer). No crossings.

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| ~~Narrator~~ | ~~The rig rolls in. Bracken lays a hand on the armour, and nobody makes a joke.~~ | cut: describes the picture and stage-manages the tone. Shown instead: the rig rolls in, the walk, and no joke |
| Bracken | The Stopping Stone. It was made to hold back the Grand Combine, and it will. | kept; 16 words (the longest in the scene) |
| Pip | Wait... they're really gonna level the whole lawn? | kept: the first sincere question; quiet, MCU |
| Bracken | They have done it before. Long ago. To us. | kept: the answer, then the silence |
| Sorrel | There's a girl from Fescue in the hollow. She'll want to talk to you. | kept, said gently: the side-quest hook, after the silence and before the bay |
| Turncoat Cam | The acorn's in the crate under the bench. Tuesday. And the racing charter's mine. | 14 words. Cam now faces the camera (the old scene shot his back) |
| Vesper Thorne | Of course, Cameron. | the threat, off screen, on the phone; no contractions, no exclamation mark |

Names checked: `npm run lore -- find "Stopping Stone"`, `Grand Combine`, `Cam` (R-071: Cam phones Vesper on a
tin-can phone at the end of chapter 2 for a Patio Heights racing charter), R-072 (Bracken: the Mower levelled a lawn
before, "long ago, to us").

## 8. Music and sound

| Time | Cue | Why |
| --- | --- | --- |
| 0.0 | `fescue` music, `forest` ambience; the rig's engine | Mossy Wood, the Unmowed; the hook is the drive |
| 9.1 | `sad` stinger and `sad` music (fade 1.0) | the sincere beat: the jokes stop; the one `sad` stinger in the scene |
| 18.0 | music out (fade 0.6) | the held silence needs nothing under it |
| 21.3 | silence (2.0 s), ambience only | the one held silence of the scene (bible section 4) |
| 28.6 | `tension` music (fade 1.2), `rain` ambience (fade 1.5) | the bay at night: Cam's betrayal is a foot-soldier's threat, not Vesper's |
| 39.0 | `villain` stinger and `villain` music (fade 1.2) | Vesper on the phone, once: his theme enters with his line |

No comic stinger. No gag anywhere in the scene.

## 9. Blocking and vehicles

- The armoured Ride-On (`ride`, `from: 'player'`, kind `ride-on`) drives from (-320, 20) to (-325, 22) on the west
  highway, then the player steps out and walks to (-347, 34) at the ring. The Ride-On stays in the world.
- Bracken at his ring mark (-364, 40), `held: null` so the stone is his only at the hold step; he holds it up in the
  low MCU. Pip at (-341, 41), facing Bracken. Sorrel at the hollow mark (-346, 44), facing Bracken.
- The bay: Cam at his mark (-156, 68), spawned hidden, holding the tin-can phone (`hold` step); he turns (`face`) to
  the racer at (-134, 70) for the envy beat, then stays facing east for the threat dolly. The porcelain lantern
  (`lamp`) at (-159, 71), by him, is the light source at night.
- Pip's red Zero-Turn (`pip-ride`, from the bay's `pip-zero-turn` mark) parked at (-134, 70): in shot for the envy.
- Tansy's Zero-Turn and the pull-up are dressing (not in frame).

## 10. The button

The title card, END OF CHAPTER 2, after Vesper's "Of course, Cameron." over Cam's threat dolly. It is the right last
moment because the chapter's question (will the player take Vesper's deal) is answered with a picture of who has
already said yes, and the next question (the acorn on Tuesday) is set.

## 11. Self-check

- [x] The scene has a want, an obstacle and a turn: Bracken's stone, Pip's question, Sorrel's errand, Cam's betrayal;
      it is not a briefing.
- [x] The hook lands in 3 s (the rig rolls in, no narration); the first line is a character's.
- [x] Every line under 16 words (longest 15: Bracken's stone line); nobody says what the picture shows; no coordinates.
- [x] Voices: Bracken slow and archaic (hz 76), Pip quiet (no hz change: the bible's quiet), Sorrel gentle (hz 122),
      Cam short and transactional, Vesper no contractions and no exclamation (hz 92).
- [x] Every speaker MCU or closer and facing the camera (Cam faces east, toward the camera); a reaction on Pip.
- [x] One side of each conversation; no crossings.
- [x] Music: `sad` once for the sincere beat (one `sad` stinger), null for the silence, `tension` on the bay, `villain`
      only on Vesper's line (one `villain` stinger).
- [x] One held silence (2.0 s, music null), and only one.
- [x] Running jokes: Pip's "Okay, hear me out" is not here (no jokes); Cam's motive planted (the envy beat); Vesper's
      hat line is not used (the threat is the acorn).
- [x] Night scene lit: `sky: 'golden'` on the scene, plus the porcelain lantern near Cam.
- [x] `direction.notes` points here.
