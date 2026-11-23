# Director's notes: `tax-break-in-outro`

The player brings the stolen Buck-Iron Combine onto the Side-Valve apron; the blueprints say "Fescue Golden Acorn", and
everyone turns to the crate. Re-directed against [../bible.md](../bible.md). Watch it at
`http://localhost:5310/?no-intro&cutscene=tax-break-in-outro`.

| | |
| --- | --- |
| Scene | `tax-break-in-outro` in `src/cutscene/scenes/story/ch1c.ts` |
| Played by | quest `ch1-tax-break-in` ("The Glaze & Tax Break-In") as its outro, at Side-Valve Salvage, after the Combine is stolen |
| Kind and length | `outro`, aim 15-45 s; now 31.4 s at Normal text speed (was 30.2 s, 4 faults) |
| Where, when | stage `side-valve-bay`, the apron; day, no `sky` |
| Before / after | before: the player steals the Buck-Iron Combine from Thorne Tower's auditors. After: the next quest chain (the Founders' boot and the Amphitheater); the acorn is the chapter's question |

## 1. Purpose in the story

Chapter 1's question is whether the player can pay their way out. The answer here is that the job gives them a harvester,
and the harvester runs on the one thing Vesper wants: a Fescue Golden Acorn. This is the reveal that turns a heist into
the spine of the story. It also pays off the intro's "I want the golden kazoo" with the crew's first look at the crate.

The old scene had a wide dead first shot, a line in a dolly with Tansy out of frame, and two cuts across the Tansy/Pip
line.

## 2. The player's feeling

- **In:** the adrenaline of the heist, a stolen harvester, the engine still in their ears.
- **Out:** the dread of the acorn. The Combine is not the prize; the crate is. The player now knows Vesper's plan needs
  something in the Seed-Cell crate.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Pip | to be impressed and to be heard | the thing is enormous | cheering, a flood of questions | asks the right question (what does it run on?) |
| Tansy | to read the blueprints and say it flat | the size of the thing | dry understatement ("Zero-millimetre scalp.") | realises the acorn is the price |
| Turncoat Cam | to be seen (background) | the crew | sweeps; turns to look at the crate | looks at the crate, not at the crew |
| The player | (silent, still) | the question | stillness; the ride | the crate is the next question |

## 4. Subtext

- "Zero-millimetre scalp" is Tansy's pride in the job, and her fear that the job is too big for the bay.
- Pip's "What does it run on?" is the question nobody asked; it is the one that matters.
- The look at the crate is the whole crew knowing what they stole the Combine for, and Cam knowing who will pay for it.

## 5. Beat sheet

Timings at Normal text speed (checker, 31.4 s).

| # | Time | Beat | What happens (picture first, then words) |
| --- | --- | --- | --- |
| 1 | 0.0-7.2 | Hook | A `track` on the Combine rolling in on the z = 60 road, the engine (`engine-rev`), the shake; Turncoat Cam walks the apron. No narration. |
| 2 | 7.2-10.0 | Setup | Pip, cheering: "She is enormous! Tansy, she is enormous!" |
| 3 | 10.0-15.9 | Turn | The player steps out (`ms`, toward Tansy); the blueprints on the bench are shown first, a `dolly` onto them, held 1.5 s. |
| 4 | 17.4-21.2 | The reveal | Tansy: "The Grand Combine. A harvester the size of a block." Then "Zero-millimetre scalp." |
| 5 | 23.3-27.3 | The question | Pip: "What does it run on?" Tansy: "A Fescue Golden Acorn." |
| 6 | 27.3-28.0 | Silence | Music out (fade 0.5), a beat of nothing; ambience only. |
| 7 | 28.0-28.9 | The crate | A `cut` on the crate (the acorn is in it); the `reveal` stinger on the picture; `villain` music in. Pip, Tansy and Cam all turn to it. |
| 8 | 28.9-31.4 | Button | Wide of the bay: the crew and Cam, all looking at the crate. Held. |

## 6. Shot list

| # | Shot | Lens / distance | Move | On | Motivation |
| --- | --- | --- | --- | --- | --- |
| 1 | `track` on `ride` from (-160, 50, 4) | 50 | tracks the Combine | the Combine | the hook: the machine is the picture |
| 2 | `CREW.single('pip','mcu')` | 35 | locked (Pip cheers, async) | Pip | the line |
| 3 | `shot('player','ms',{toward:'tansy'})` | 40 | locked | the player | the player gets out; the straight man |
| 4 | `dolly` from (-152, 73, 2.5) to (-156, 75.5, 1.2), look `plans`, 4 s | 52 | dolly onto the blueprints; held 1.5 s | the plans | picture first, then the line |
| 5 | `CREW.single('tansy','mcu')` | 35 | locked | Tansy | "The Grand Combine..." and "Zero-millimetre scalp." |
| 6 | `CREW.single('pip','mcu')` | 35 | locked | Pip | "What does it run on?" |
| 7 | `CREW.single('tansy','mcu')` | 35 | locked | Tansy | "A Fescue Golden Acorn." |
| 8 | `cut` from (-146, 66, 1.7), look (-160, 72, 0.6) | 46 | locked | the crate | the reveal picture |
| 9 | `spot('side-valve-bay','wide')` | 52, high | locked | the crew and Cam, all facing the crate | the button: the held picture |

Sides of the line: `CREW = coverage('tansy','pip', 1)` for every exchange between Tansy and Pip. The player is not in a
conversation on the crew line; their stillness is shot as its own `ms`.

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Pip | She is enormous! Tansy, she is enormous! | kept: the bible's "physical" enthusiasm, a run-on with the name |
| Tansy | The Grand Combine. A harvester the size of a block. | said over the blueprint picture, not the picture's description |
| Tansy | Zero-millimetre scalp. | kept: her pride, one clause |
| Pip | What does it run on? | the question nobody asked: his "want" for the scene |
| Tansy | A Fescue Golden Acorn. | the reveal's setup: the crate line follows it, the line itself is not repeated |
| ~~Narrator~~ | (none) | the blueprint is shown; the line is the crew's |

Names checked: `npm run lore -- find "Golden Acorn"`, `"Combine"`, `"Fescue"`. The acorn is Vesper's want (bible section 2)
and the engine's fuel; it is not yet named as Vesper's on screen (the crate and Cam's look say it).

## 8. Music and sound

| Time | Cue | Why |
| --- | --- | --- |
| 0.0 | `street` ambience, `heist` music (scene), `engine-rev` sfx and a `shake` (2.5 s) on the Combine | the engine is the hook |
| 27.3 | `music` out (fade 0.5), a 0.7 s beat | the silence before the reveal |
| 28.0 | `reveal` stinger on the crate picture; `villain` music in (fade 1) | the reveal is the picture, not the line; `villain` is Vesper's machine and his want |

## 9. Blocking and vehicles

- The `ride` (the Buck-Iron Combine, `kind: combine`, `from: player`) starts at (-122.5, 57.5) and drives the z = 57.5
  road west, then south to the apron at (-150, 72) at 6 m/s; the player is seated and drives it in. The `ride` is the
  player's own vehicle; the scene keeps it on the apron at the end.
- The player exits at (-150, 72), walks to (-148, 67) and stands there for the blueprint dolly.
- Tansy stays on her mark (-143, 73); Pip on his crate (-135.5, 74), standing for his line; Turncoat Cam walks from
  (-158, 68) to (-156, 65.5) on his sweep, then turns to the crate.
- The blueprints (`folded-map`) lie on the bench at (-158, 75.6); the crate is at (-160, 72).
- The player ends on their mark at the apron; the next quest begins from the Combine.

## 10. The button

The wide of the bay: the crew and Cam, all turned to the crate, held for 2.5 s. It is the right last moment because it
shows the four of them in one picture, looking at the same thing: the crate with the acorn in it. The sound is the
villain motif; no one speaks.

## 11. Self-check

- [x] The scene has a want, an obstacle and a turn: the harvester; the acorn question; the crate.
- [x] The hook lands in 3 s (the engine and the shake); the first thing is not narration.
- [x] Every line under 16 words (longest 11); no coordinates; no waypoint read-out.
- [x] Pip is loud and quick; Tansy is flat; Cam is silent.
- [x] Every speaker framed MCU or closer; the plans are shown before the line about them.
- [x] One side of the line for Tansy and Pip (`CREW`).
- [x] Music: `heist` in, out before the reveal, `reveal` stinger on the picture, `villain` on the crate; no gag.
- [x] Ladders: the golden kazoo is planted in the intro and answered here by the crate; the bay is the crew's
      problem now.
- [x] Day scene.
- [ ] `npm run cutscene-report` / `pacing.baseline.ts`: left to the planner (out of scope for this issue).
- [ ] `npm test` and a watched run in the browser: not done in this issue (no dev server, per the common rules).
- [x] `direction.notes` in the scene points at this file.
