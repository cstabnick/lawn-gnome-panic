# Director's notes: `founders-boot-intro`

Watch it at `http://localhost:5310/?no-intro&cutscene=founders-boot-intro`.

| | |
| --- | --- |
| Scene | `founders-boot-intro` in `src/cutscene/scenes/story/ch1d.ts` |
| Played by | quest `ch1-founders-boot` as its intro (the objective: hijack the Boot, crash the tribunal) |
| Kind and length | `intro`, aim 30-60 s, fault above 75; now 44.8 s (was 49.6 s, 5 faults) |
| Where, when | stage `side-valve-bay` (the crew), then `amphitheater` and the parade route (world); day, no `sky` override |
| Before / after | before: the player's first visit to Side-Valve in chapter 1 (the bay, Tansy at her Zero-Turn). After: the bay exit; the player drives the Boot's plan |

## 1. Purpose in the story

Vesper's tribunal is the chapter's trap: the crew cannot protest a zoning meeting held during the parade. Three plants
the bible asks for:

- **The Whirligig** (first named in chapter 3): Reginald's charge "Item two: unauthorised verticality. One Whirligig, Fort
  Sandpit." Lore: `docs/lore/entries/apocrypha/the-whirligig.md`, `fort-sandpit.md`. The bible's suggested gag, moved earlier.
- **Mayor Mulch's coats** (ladder rung 2, "fresh paint"): the Mayor in a fresh coat, posing. Payoff in the epilogue.
- **Pip's "Okay, hear me out"** (the plan tic): its first use. Starts the running ladder (sandpit-drop-intro, finale).

## 2. The player's feeling

- **In:** the debt is still on them; they have not been asked to do anything big yet.
- **Out:** a plan that is absurd and therefore fun. Vesper's tribunal is a threat they can feel; the Boot is a laugh;
  Tansy's "...Yes." says she is in and not happy about it.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Tansy | keep the bay out of the war; learn what the tribunal means for her | the HOA's calendar; Vesper | dry facts, no protest, stays at her work | agrees to the plan, flatly |
| Reginald | a quarter-inch of order, read into the record | the crowd; the lectern | municipal code, numbers, "four-oh-four dash B" | none (he reads) |
| Bailiff | keep the arena locked | the crowd | a bored enforcer's agreement | none |
| Mayor Mulch | be seen on the winning side | the cameras that are not there | posing, "Ding, ding!" | none |
| Pip | to be useful, loudly, now | Tansy's silence | a plan, fast, run-on | gets his plan accepted |
| The player | (silent: the audience's seat) | | | |

## 4. Subtext

- Tansy says "...Yes." because she needs the Boot to be somewhere it cannot be protested, not because she likes Pip's plan.
  Her fear: losing the bay (`mowers-keepers-intro` is the first time she says it aloud).
- Reginald's list is serious; the gag is that a zoning tribunal is about grass and verticality, and he believes it.
- Pip's plan is the first place he is sure of himself; he has a second thought (the vial in his toolbox) that is not
  in this scene.

## 5. Beat sheet

Times from the checker at Normal text speed (`TIMELINE=1`).

| # | Time | Beat | What happens (picture first, then words) |
| --- | --- | --- | --- |
| 1 | 0-8 | Hook | Tansy at her bay, MCU: "Vesper has called an emergency HOA zoning tribunal at the Amphitheater." Then "During Founder's Trim Day. So nobody can protest it." |
| 2 | 8-20 | Setup | The Amphitheater: a wide (2 s), Reginald MCU reads the grass code, then a CU on the Whirligig charge |
| 3 | 20-31 | Turn | The bailiff, turned to camera: "Yes, sir. The crowd is unlawful too." The Mayor in a fresh coat, waves: "Fresh coat for the occasion! Ding, ding!" Then the Boot: a follow on the float, a dolly from the corner |
| 4 | 31-36 | The idea forms | Hold on the Boot's dolly, then a 5 s wait; the parade is moving, the crew is not yet involved |
| 5 | 36-43 | Button setup | Pip (MCU, handheld): "Okay, hear me out." Pip (MS, handheld, points): "We steal the Boot and park it in the jury box." |
| 6 | 43-45 | Button | A held beat (1.2 s), then Tansy MCU, flat: "...Yes." Cut. The player has walked off toward the exit meanwhile |

The turn is at about 60% of the scene (the tribunal's question becomes the crew's plan). The button is Tansy's "...Yes."
in the last 3 s.

## 6. Shot list

| # | Shot | Lens | Move | On | Motivation |
| --- | --- | --- | --- | --- | --- |
| 1 | `cut` pos (-142.9, 1.25, 69.8), look Tansy | 46 | locked | Tansy at the bench | the hook is her face and her news |
| 2 | `spot('amphitheater','wide')`, 2.2 s | 52 | locked | the arena, the dais, the tiers | place: one establishing shot, no dialogue |
| 3 | `shot('reginald','mcu')` | 35 | locked | Reginald reads | the charge; eyeline off the lens |
| 4 | `shot('reginald','cu')` | 30 | locked | Reginald, the Whirligig line | the plant is a threat, tighter |
| 5 | `face` bailiff-a to camera, then `shot('bailiff-a','mcu')` | 40 | locked | bailiff, facing camera | rule: speaker in frame and facing the camera |
| 6 | `shot('mayor','mcu')` + `wave` gesture | 35 | locked | the Mayor, posing | the gag, one line, locked off |
| 7 | `follow` boot, offset [0, 4, -13] | 52 | follow | the Boot on parade | speed and spectacle, no line |
| 8 | `dolly` from the north-west corner to look at the boot, 5 s, then 5 s wait | 50 | slow dolly | the float turning the corner | cut away before the follow is long (follow would hold over 12 s) |
| 9 | `BAY.single('pip','mcu', handheld 0.02)` | 35 | handheld | Pip, first "Okay, hear me out." | the tic, face first; the crew is at play |
| 10 | `BAY.single('pip','ms', handheld 0.02)` | 40 | handheld | Pip, the plan, pointing | a second frame so the line holds under 7 s |
| 11 | `beat('pause')`, then `BAY.single('tansy','mcu')` | 35 | locked | Tansy, "...Yes." | the button |

Sides: Pip and Tansy on `coverage('pip', 'tansy', 1)`, one side the whole exchange. Shot 1 is Tansy alone and is not
part of that line.

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| ~~Narrator~~ | ~~Founder's Trim Day, and the thirty-foot Gnorwin Clayfoot Boot is on parade.~~ | cut: described the picture; the float is shown, not named |
| Tansy | Vesper has called an emergency HOA zoning tribunal at the Amphitheater. | kept: the news, in her voice |
| Tansy | During Founder's Trim Day. So nobody can protest it. | kept: the reason, short |
| Reginald | Municipal Code four-oh-four, dash B: unlawful grass is a crime against the Tribunal. | kept: his tone; "four-oh-four dash B" is the bible's code |
| Reginald | Item two: unauthorised verticality. One Whirligig, Fort Sandpit. | new: the Whirligig plant (`the-whirligig.md`) |
| Bailiff | Yes, sir. The crowd is unlawful too. | kept: the bailiff is now in frame, facing camera |
| Mayor Mulch | Fresh coat for the occasion! Ding, ding! | new: coats ladder rung 2 (fresh paint) |
| Pip | Okay, hear me out. | new: the tic, first use |
| Pip | We steal the Boot and park it in the jury box. | kept: the plan |
| Tansy | ...Yes. | kept: the button, flat |

Names checked: `npm run lore -- find Whirligig`, `find "Founder"`, `find Asphalt`. Reginald is "Quarter-Inch" and
Vesper's tribunal is the HOA's; the Mayor's name is "Mayor Mulch" for this scene (the look is the fresh coat).

## 8. Music and sound

| Time | Cue | Why |
| --- | --- | --- |
| 0.0 | `turfton` music, `crowd` ambience | the parade is near; the bay is busy |
| 0.0 | no sfx | the hook is Tansy's voice |
| 22.3 | (none) | the Mayor's line is a gag on the picture; no stinger (the bible: none in the sincere beats; this is not one) |
| 25.0 | (none) | the Boot's follow is loud on its own (engine, crowd) |
| 43.1 | music held (no change) | the button is a quiet line |

No stingers. The scene has no villain sting: Vesper is not on screen.

## 9. Blocking and vehicles

- Tansy starts at her bench (-143, 73) facing the Zero-Turn; she does not move in the scene.
- Pip starts at (-135.5, 74) sitting; he points (gesture) at the plan.
- The player starts at the apron (-156, 70) and walks to the exit (-147, 67) async during the Boot; they are out of frame
  by the button. The walk is the quest exit for an intro.
- Reginald on the dais at (-86, -91) facing south; the bailiffs at (-82, -84) (turned to the camera, facing south) and
  (-98, -84); the Mayor at (-88, -80) facing south, in the arena, out of the tiers' way.
- The Boot (`boot-float`) starts at the parade route's first point (2.5, -122.5) and drives its route (`parade-route`
  minus the last point) at 11 m/s, async. It ends in the jury box; the scene does not wait for it.

## 10. The button

Tansy, at her bench, one flat word: "...Yes." Then the cut. It is the right last moment because the crew's whole plan
has been reduced to her answer, and the audience knows she means yes and hates it.

## 11. Self-check

- [x] The scene has a want (the crew: not to be protested out of the bay), an obstacle (the tribunal) and a turn (the plan).
- [x] The hook lands in 0 s on Tansy's line; no narration.
- [x] Every line under 16 words; the longest is "Municipal Code four-oh-four, dash B: unlawful grass is a crime against the Tribunal." (14 words); no coordinates; no narration.
- [x] Voices: Tansy short and flat; Reginald municipal; Pip run-on; the Mayor a slogan.
- [x] Every speaker framed MCU/MS or closer and facing the camera for their line (bailiff turned to the camera).
- [x] One side of the line for Pip and Tansy (`coverage('pip','tansy',1)`).
- [x] Music: one cue, no stingers; no villain on screen.
- [x] Plants: the Whirligig (Reginald's charge); the Mayor's coats (rung 2); Pip's first "Okay, hear me out".
- [x] Day scene; no `sky` change.
- [x] Checker: all shots pass, zero pacing faults, length 44.8 s.
- [x] `direction.notes` in the scene points at this file.
