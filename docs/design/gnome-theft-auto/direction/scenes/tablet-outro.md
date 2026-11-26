# Director's notes: `tablet-outro`

Watch it at `http://localhost:5310/?no-intro&cutscene=tablet-outro`.

| | |
| --- | --- |
| Scene | `tablet-outro` in `src/cutscene/scenes/story/ch2d.ts` |
| Played by | quest `ch2-unmowed-tablet` ("The Cracked Tablet", E20 row 23, a rewrite) as its outro, after the welders are cracked and the player brings the rig back |
| Kind and length | `outro`, aim 15-45 s (bible section 4); now 36.8 s at Normal text speed, no faults |
| Where, when | stage `unmowed-hollow` only (night in the outline; held at `sky: 'golden'` so the faces read, a standing waiver: the hollow is lit by the fire, and the dark hats vanish on `night`) |
| Before / after | before: the armoured Ride-On rolls up the west highway with Sorrel's rain on 88.7 still in the player's head (row 22). After: free roam; Bracken's replica stone (the next job) is the hook |

## 1. Purpose in the story

Act II asks whether the player takes Vesper's deal. The first sincere scene of the game answers it with the thing the deal
costs: the Combine will level the whole lawn, Bracken says so, and nobody makes a joke. It also holds Pip's arc: he went
quiet in the intro (told he ran from Fescue), asks the first sincere question here, and the scene ends on him, silent.

**Rewrite (E20 row 23).** The old scene cut to the Side-Valve bay at night: Turncoat Cam on a tin-can phone ("It's Cam, at
Tansy's. The acorn's under the bench. Tuesday. The charter's mine.") and Vesper's answer ("Of course, Cameron.") and the
title END OF CHAPTER 2. That call and the answer moved to the outro of row 34 (the bench-lock), where Cam's sale belongs
(the code at the bench lock). Cam is not in this scene. The scene is no longer the chapter closer: no title, no `villain`
stinger, no Side-Valve cut. It ends on the tablet and Pip's silence, with no music and no gag.

## 2. The player's feeling

- **In:** the tablet is cracked, the job is done, the rig is heavy and a little proud.
- **Out:** the first real weight of the game: the Combine will level the whole lawn. Dread, not a laugh; the last image is
  a boy who has nothing to say.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Bracken | to make the outsider understand what the Combine means | the outsider's cheer; the years | a held stone, a statement, no joke | has said the one thing he has to say |
| Pip | to be useful, now | the fear of the Fescue name | nothing: he asks | asks the sincere question, and is answered by the silence |
| Sorrel | to keep the crew fed with the next errand | the grief in the hollow | gentle, practical | opens the next job, softly |

## 4. Subtext

- Bracken's "They have done it before. Long ago. To us." is about the Mower, and a grief he will not name (R-072: the
  Mower levelled a lawn before). The silence is for that.
- Pip's question is his own fear coming out: Fescue is his family's ground, and Wendel is its regent. He does not say it.
- Sorrel's hook is the one gentle, practical thing in the room: there is still a next job.
- The tablet's shape is the Stopping Stone's shape on purpose: the finale rhymes with it.

## 5. Beat sheet

Timings at Normal text speed (from the checker, 36.8 s total).

| # | Time | Beat | What happens (picture first, then words) |
| --- | --- | --- | --- |
| 1 | 0-2.9 | Hook | The armoured rig drives into the hollow (`drive`): the picture is the line. No narration. |
| 2 | 2.9-9 | Setup (the walk) | The player steps out and walks up to the ring, tracked by a fixed camera. |
| 3 | 9-15 | The sincere turn | Bracken holds up the Stopping Stone, low MCU, `sad` stinger and music: "The Stopping Stone. It was made to hold back the Grand Combine, and it will." |
| 4 | 15-18 | The tablet | He lays the stone down by the tablet: a slow dolly in, no line, the two shapes the same shape. |
| 5 | 18-21 | The question | Pip, quiet, facing the camera: "Wait... they're really gonna level the whole lawn?" |
| 6 | 21-26 | The answer | Bracken: "They have done it before. Long ago. To us." Music out (0.6 s); the one held silence (2.0 s). |
| 7 | 26-29 | The hook | Sorrel, gently: "The Elder has another stone on his mind. Come back for it." |
| 8 | 29-33 | The tablet again | The slow dolly in on the tablet and the stone, no line, no music, a `creak`. |
| 9 | 33-36.8 | Button | Pip, medium, slumps and does not speak; the scene holds on him (3.2 s) and ends. |

The turn is at about 60% (beat 6 into 7: the answer, the silence, and the errand). The button is the held image of Pip.

## 6. Shot list

| # | Shot | Lens / distance | Move | On | Motivation |
| --- | --- | --- | --- | --- | --- |
| 1 | `track` the rig from the highway | 50 | follows it | the armour | the rig rolls in: sound and picture carry the hook |
| 2 | `track` the player on the walk | 50 | a fixed camera turning to follow | the player | the walk fills the time |
| 3 | `BP.single('bracken','mcu',{height:'low'})` | 35, low | locked | Bracken with the stone | the stone held up from below: the jokes stop |
| 4 | `dolly` on the tablet and the stone from (-348.5, 30.5, 2.2) | 42 | slow in, 2.6 s | the tablet and the stone | the shape is shown, then Pip asks |
| 5 | `BP.single('pip','mcu')` | 35 | locked | Pip | the quiet question |
| 6 | `BP.single('bracken','mcu')` | 35 | locked | Bracken | the answer, eye-level: nobody above anybody |
| 7 | `BS.single('sorrel','mcu')` | 35 | locked | Sorrel | the errand, gently |
| 8 | `dolly` from (-350.4, 33.8, 1.5) to (-351.6, 35.4, 1.2) | 40 | slow in, 3.0 s | the tablet and the stone | a picture instead of a line |
| 9 | `BP.single('pip','ms',{height:'eye'})` | 40 | locked | Pip | the last image |

Sides of the line: Bracken and Pip on `coverage('bracken','pip', 1)`; Bracken and Sorrel on `coverage('bracken','sorrel', 1)`. No crossings.

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Bracken | The Stopping Stone. It was made to hold back the Grand Combine, and it will. | kept; 15 words (the longest in the scene) |
| Pip | Wait... they're really gonna level the whole lawn? | kept: the first sincere question; quiet, MCU |
| Bracken | They have done it before. Long ago. To us. | kept: the answer, then the silence |
| Sorrel | The Elder has another stone on his mind. Come back for it. | kept, said gently: the replica-stone hook |
| ~~Turncoat Cam~~ | ~~It's Cam, at Tansy's. The acorn's under the bench. Tuesday. The charter's mine.~~ | cut: moves to the outro of row 34 |
| ~~Vesper Thorne~~ | ~~Of course, Cameron.~~ | cut: moves to the outro of row 34 |
| ~~Title~~ | ~~END OF CHAPTER 2~~ | cut: the chapter does not end here |

Names checked: `npm run lore -- find "Stopping Stone"`, `Grand Combine`, R-072 (the Mower levelled a lawn before, "long ago, to us").

## 8. Music and sound

| Time | Cue | Why |
| --- | --- | --- |
| 0.0 | `fescue` music, `forest` ambience; the rig's engine | Mossy Wood, the Unmowed; the hook is the drive |
| 9 | `sad` stinger and `sad` music (fade 1.0) | the sincere beat: the jokes stop; the one `sad` stinger |
| 15 | `thud` as the stone is laid by the tablet | the picture needs a sound |
| 21 | music out (fade 0.6) | the held silence needs nothing under it |
| 21.6 | silence (2.0 s), ambience only | the one held silence of the scene |
| 29 | `creak`, ambience only | the last images have no music at all |

No comic stinger, no `villain`, no music after the answer. No gag anywhere.

## 9. Blocking and vehicles

- The armoured Ride-On (`ride`, `from: 'player'`) drives from (-320, 20) to (-325, 22), then the player steps out and walks to
  (-347, 34). The Ride-On stays in the world.
- Bracken at his ring mark (-364, 40), `held: null` until he holds the stone for beat 3, then puts it down. Pip at (-341, 41),
  facing Bracken. Sorrel at the hollow mark (-346, 44), facing Bracken. Tablet `stone-plaque` at (-355, 39), stone at
  (-352.6, 38.2), both hidden until beat 4.
- No Turncoat Cam, no bay, no lantern, no Pip's Zero-Turn.

## 10. The button

Pip, in a medium shot, slumps and says nothing; the scene ends on that held image with only the fire and the wood. It is the
right last moment because the quest's question (will they stop the Combine) is answered with the person who loves it most
having nothing to say, and the next quest (the replica stone) is in Sorrel's last line, not in a threat.

## 11. Self-check

- [x] The scene has a want, an obstacle and a turn: Bracken's stone, Pip's question, the silence, the errand.
- [x] The hook lands in 3 s (the rig rolls in, no narration); the first line is a character's.
- [x] Every line under 16 words (longest 15); nobody says what the picture shows; no coordinates.
- [x] Voices: Bracken slow and archaic (hz 76), Pip quiet (no hz change), Sorrel gentle (hz 122).
- [x] Every speaker MCU or closer and facing the camera; one side of each line; no crossings.
- [x] Music: `sad` once; null for the silence and for the last images; no `villain`.
- [x] One held silence (2.0 s), and only one.
- [x] No gag, no title; the scene ends on the tablet and Pip's silence (E20 row 23).
- [x] Night held at `golden` so the faces read (waiver: the hollow's fire is the only light).
- [x] `direction.notes` points here.
