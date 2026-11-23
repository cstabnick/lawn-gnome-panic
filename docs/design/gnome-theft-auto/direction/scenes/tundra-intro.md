# Director's notes: `tundra-intro`

Copy this file to `scenes/<scene-id>.md`, fill every section, then re-direct the scene against it. Rules and numbers:
[bible.md](../bible.md). Worked example: [scenes/mowers-keepers-intro.md](mowers-keepers-intro.md).

| | |
| --- | --- |
| Scene | `tundra-intro` in `src/cutscene/scenes/story/ch3c.ts` |
| Played by | quest `ch3-tundra-drift-run` as its intro (Volatile on Ice) |
| Kind and length | `intro`, aim 30-45 s (bible section 4) |
| Where, when | stage `birdbath-basin` (wilds.ts), dawn, `sky: 'golden'` |
| Before / after | the Kiln-Resin cure at Thermos Theo's barrel / the player drives the drift run east along the ring road |

## 1. Purpose in the story

Pip has both arms again and wants to be useful, loudly. The scene hands the player the drift run: the crew needs the
Black Dew barrels at the Dust Flats, Tansy is there, and Pip trusts the player to drive. It plants Pip's pride in the
new arm ("Both arms, both barrels.") and Loam's blessing, the last warm beat before the chapter's dark close.

## 2. The player's feeling

- **In:** freshly cured and not yet sure of the crew; they just watched Pip's arm get fixed by a stranger.
- **Out:** trusted with the key, a little dread (Tansy is waiting), a flat look at Pip's horn. They drive.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Pip | get the barrels on the mower, now | his own speed; the cold | show off, run when walking would do, then hand over the key | from a loud kid to a crewmate who trusts the player |
| Loam | bless the getaway | none (he is at home) | bow, "my child" tone, kind first | none; he stays |
| Player | learn where they are going | Pip's enthusiasm | a flat question | takes the key |

## 4. Subtext

- Pip hands over the key because he can't drive the run with one hand on the barrels, and he is scared of the Dust Flats.
- Loam is glad to be useful after the snowmobile trouble; his blessing is sincere.
- "Dust Flats. Tansy's there." is Pip wanting the player to hurry: Tansy is alone out there.

## 5. Beat sheet

| # | Time | Beat | What happens (picture first, then words) |
| --- | --- | --- | --- |
| 1 | 0-4 | Hook | Wide on the basin at dawn; Pip walks the barrel to the mower. Thud on the mower as it lands. |
| 2 | 4-8 | Pip's line | MS of Pip: "Both arms, both barrels. Watch this." |
| 3 | 8-14 | Loam | MCU of Loam, a bow over the clay jar: "Compost tea, for the getaway. The Kiln wants a clean lap." |
| 4 | 14-22 | Turn | Player's reaction, "Where's it going?", Pip: "Dust Flats. Tansy's there.", a beat, the key given. |
| 5 | 22-32 | Handover | Pip: "You drive. I'll guard the barrels." Reaction. "Don't drift." Reaction. "Okay, drift a little." |
| 6 | 32-36 | Button | Pip leans on the mower and sounds the horn; the player's flat look, held. The player ends on foot beside the mower. |

## 6. Shot list

| # | Shot (size, kind) | Lens / distance | Move | On | Motivation |
| --- | --- | --- | --- | --- | --- |
| 1 | `spot('birdbath-basin','arrival')` (wide) | 30 m, 40 deg-ish | locked | the basin and the mower | establish the place and the barrel walk |
| 2 | `shot('pip','ms', side 30)` | 40 | locked | Pip | his line |
| 3 | `shot('loam','mcu', side -30)` | 40 | locked | Loam | the blessing |
| 4 | reaction on the player (MCU) | 40 | locked | player | the turn |
| 5 | `shot('pip','ms', side 30)` | 40 | locked | Pip | the handover |
| 6 | reaction on the player, held 1.2 s | 40 | locked | player | the flat look |

One side of the line (side 30 for Pip, -30 for Loam), the player always on the opposite side from Pip.

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Pip | Both arms, both barrels. Watch this. | the hook line: pride in the new arm, no narration |
| Loam | Compost tea, for the getaway. The Kiln wants a clean lap. | the blessing (roadmap line, kept) |
| Player | Where's it going? | the straight man |
| Pip | Dust Flats. Tansy's there. | the turn: he looks at the player |
| Pip | You drive. I'll guard the barrels. | the key changes hands |
| Pip | Don't drift. | split by a player reaction (speaker-run) |
| Pip | Okay, drift a little. | the button of the handover |

Cut from the old scene: "Keep it clean. The loyal Carburettors need every drop.", "Ring road east" (the HUD shows the way).

## 8. Music and sound

| Time | Cue | Why |
| --- | --- | --- |
| 0 | ambience `wind`, music `frost` | Frostbite Fells, the whole scene |
| 2-4 | sfx `thud` on the mower | the barrel lands |
| 22 | none: the key handover is silent | the key is the picture |
| 34 | horn | the mower's horn, the button |

## 9. Blocking and vehicles

- Pip starts at his bench mark holding a `gta-dew-barrel` and runs it west round the rim building (the building stands
  between the bench and the mower, so the path goes (9, -347) then (7.5, -340)), the barrel goes down on the mower.
- Loam stands at his mark holding a `clay-jar`, bows once.
- The mower is the stage's parked `ice-zero-turn` (`carMark`), facing east. It stays in place; the quest's drive starts there.
- The player starts at the rim mark and ends on foot at (6, -331), beside the mower.

## 10. The button

Pip leans on the mower, the horn sounds, and the player looks at it flatly. The last sound is the horn; the last
image is the player's stare, the drive ahead.

## 11. Self-check

- [x] The scene has a want, an obstacle and a turn; it is not a briefing.
- [x] The hook lands in 3 s (Pip walks with the barrel; the thud on the mower).
- [x] Every line is under 16 words; nobody says what the picture shows; no coordinates or waypoint read-outs.
- [x] Pip sounds like his bible entry (fast, a two-clause pride line); the player is short.
- [x] Every speaker is framed MS or closer, facing the camera, for their line.
- [x] One side of the line per conversation; the player is opposite Pip.
- [x] Music: `frost` throughout, no stingers.
- [x] Running jokes: the new arm is planted ("Both arms"); no repeat of "Then we don't drive."
- [x] `npm run cutscene-report` shows the scene OK (0 faults; it still carries `[baseline]` until the planner removes it).
- [x] The line-of-sight test passes for the scene (`scenes.test.ts -t tundra`).
- [x] Watched at 390x844 after the final Pip path change (Loam's bow, each speaker in frame, faces in the upper half).
      The 960x600 watch was done before the path change; not repeated at desktop size.
- [x] `direction.notes` in the scene points at this file.
