# Director's notes: `dew-run-outro`

Watch it at `http://localhost:5310/?no-intro&cutscene=dew-run-outro`.

| | |
| --- | --- |
| Scene | `dew-run-outro` in `src/cutscene/scenes/story/ch2.ts` |
| Played by | quest `ch2-dew-run` as its outro (the payoff, before the banner) |
| Kind and length | `outro`, aim 15-45 s, fault above 60; now 35.3 s at Normal text speed (was 27.5 s, 11 faults) |
| Where, when | stage `granny-barn` (the gate, the yard, the porch); the stage's golden-hour light, so no `sky` override |
| Before / after | before: the player drives the Dew-Hauler from the blockade down the South Highway (the `dew-approach` path). After: free roam; the Kiln-Debt is clear; Bramble's Biscuit's Nap side quest opens |

## 1. Purpose in the story

Chapter 2 asked whether the player will take Vesper's deal. This closer is the emotional high of the chapter so far: the
Kiln-Debt is paid, the player's first real win is in Granny's hands, and the chapter's question is still open (the next
beat is Vesper's offer). Plants: Pip's "We're legitimate!" (the first time he is proud of the honest side), Granny's
"Now we can cook" (the crime is a recipe, and the player is in the kitchen), and Bramble's Biscuit's Nap tease (the next
side quest). The Clay-Mart letter is the payoff of chapter 1's debt.

## 2. The player's feeling

- **In:** the Dew-Hauler is loud and heavy, and the whole yard is watching it come in.
- **Out:** relieved and a little proud: the debt is gone and the crew is legitimate for once. Then a small itch about the
  next thing in Biscuit's Nap.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Granny Gnertrude | to get her Dew into the tank and the crew fed | her knees (she walks, slowly) | taps the tank; "Now we can cook."; tea | she has the crew at her table |
| Pip | to be legitimate, out loud, and then take it back | the bigness of the news | reads, bursts, then undoes it ("...Don't tell anyone.") | he is proud, and hiding it |
| The player | to see the debt is gone and what it cost | Pip's noise; Granny's pace | face only (the reaction shot); takes the tea | the debt is paid; the face says it |
| Farmer Bramble | to get the player's attention for Biscuit's Nap | his own trembling | a tease, framed square to camera | the next side quest is open |

## 4. Subtext

- The player's face is the audience's seat: the reaction after "PAID IN FULL" is held (1.2 s) with no line, because the
  player's want (clear the debt, keep the head down) has just come true and they have not had time to feel it.
- Pip's "...Don't tell anyone." is the crew's fear: being seen to be honest in a town of crooks. Never said as such.
- Granny's tea is the offer of a home: "Dew makes everybody thirsty." She is not asking for anything yet.
- Bramble's paw prints "like dinner plates" are the next danger (the Biscuit's Nap side quest), not a joke about the
  player.

## 5. Beat sheet

Timings from the checker's TIMELINE at Normal text speed.

| # | Time | Beat | What happens (picture first, then words) |
| --- | --- | --- | --- |
| 1 | 0.0-2.0 | Hook | The gate wide (`arrival` spot); the Dew-Hauler rolls through the gate, its tank sloshing (the drive is the sound). |
| 2 | 2.0-11.3 | Action | Track on Granny as she gets up from the porch chair and walks out to the tank, slowly. The player and Pip climb out (async). |
| 3 | 11.3-13.2 | Knock and line | Granny knocks on the tank (`knock` at the hauler); Granny MCU toward the player: "Now we can cook." |
| 4 | 13.2-15.4 | The letter | `give` the sealed letter to Pip; music out (0.6 s); Pip's CU as he reads, then a 1.2 s pause. |
| 5 | 15.4-20.0 | The payoff | Pip MCU reads: "Clay-Mart Collections. Your five thousand Acorn Kiln-Debt is PAID IN FULL." `triumph` stinger, `cash` sfx. |
| 6 | 20.0-21.2 | The reaction | The player's MCU, a held pause (1.2 s), no line. |
| 7 | 21.2-24.7 | Pip's legitimacy | `warm` back (fade 2). Pip: "We're legitimate! ...Don't tell anyone." Granny gives the player the espresso cup. |
| 8 | 24.7-27.2 | Tea | Granny MCU toward the player: "Tea, sugar. Dew makes everybody thirsty." |
| 9 | 27.2-32.5 | Tease | Bramble MCU, square to camera (his own front): "Something big's been napping in Biscuit's Nap again..." |
| 10 | 32.5-35.3 | Button | Player's MCU toward Granny; the player walks in to (-20, 326) (async); `knock` on the tank; a 2.0 s silence. |

Bramble's tease is not the last line (bible). The last image is the player's face with the tea, the tank patted, and
nobody talking.

## 6. Shot list

| # | Shot (size, `frame`/`cut`/`track`/...) | Lens / distance | Move | On | Motivation |
| --- | --- | --- | --- | --- | --- |
| 1 | `spot(YARD, 'arrival')` | 46 | locked | the gate | the hauler's arrival; held 2 s, under the wide limit |
| 2 | `track` Granny (`up(-46, 342, 1.6)`) | 50 | fixed, turns to Granny | Granny's walk out | the slow walk is the character; the track holds through the walk (under the 12 s moving limit) |
| 3 | `frame` Granny MCU toward the player | 35 | locked | Granny | "Now we can cook." |
| 4 | `frame` Pip CU (`PAYOFF.single('pip', 'cu')`) | 30 | locked | Pip's face reading | the letter is the picture; the music is out |
| 5 | `frame` Pip MCU (`PAYOFF.single('pip', 'mcu')`) | 35 | locked | Pip | the line, facing the player's side of the line |
| 6 | `frame` the player MCU (`PAYOFF.single('player', 'mcu')`) | 35 | locked | the player | the reaction, no line |
| 7 | `frame` Pip MCU | 35 | locked | Pip | "We're legitimate!" |
| 8 | `frame` Granny MCU toward the player | 35 | locked | Granny | the tea |
| 9 | `frame` Bramble MCU, no `toward` (faces camera) | 35 | locked | Bramble | the tease, framed square; he faces the lens |
| 10 | `frame` the player MCU toward Granny | 35 | locked | the player | the button picture; silent |

Sides: Pip and the player on `coverage('pip', 'player', 1)`, every shot of their exchange on one side. Granny and the
player on `shot(..., {toward: 'player'})` for her lines. Bramble has no coverage: he speaks alone. No crossings.

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Granny | Now we can cook. | 4 words; the homely metaphor for the crime; the first line of the scene (after the picture) |
| Pip | Clay-Mart Collections. Your five thousand Acorn Kiln-Debt is PAID IN FULL. | 12 words; the payoff; read off the letter, after the music goes out |
| Pip | We're legitimate! ...Don't tell anyone. | kept: his tic; the second sentence undoes the first |
| Granny | Tea, sugar. Dew makes everybody thirsty. | 6 words; the only "sugar" in the scene |
| Bramble | Something big's been napping in Biscuit's Nap again. Paw prints like dinner plates. | 13 words; kept; moved off the last line, framed square to the camera |
| ~~Player~~ | ~~(a shrug and a walk-off)~~ | cut: the bible's button rule; the button is a picture, not a walk-off |

Names checked: `docs/lore/entries/apocrypha/` (`clay-mart`, `kiln-debt`, `biscuits-nap`, `farmer-bramble`,
`granny-gnertrudes-farmhouse`, `cloverfield-farms`).

## 8. Music and sound

| Time | Cue | Why |
| --- | --- | --- |
| 0.0 | `warm` (the scene's music), `wind` ambience | the farm's own music; the hauler's engine is the hook |
| 11.3 | `knock` sfx at the hauler | Granny taps the tank: the sound tells the cut what happened |
| 13.2 | music out (fade 0.6) | the beat before the payoff: the picture (the letter) carries it |
| 15.4-20.0 | silence (no music), the reading | the letter's own silence; the line is read, not sung |
| 20.0 | `triumph` stinger on the line, `cash` sfx | the one triumph in the scene, on the picture of the paid debt |
| 21.2 | `warm` back (fade 2) | the warmth returns with the crew's legitimacy |
| 32.5 | `knock` sfx again; 2.0 s silence | the tank patted, nobody talks: the button |

## 9. Blocking and vehicles

- The Dew-Hauler (`from: 'player'`, tinted, not kept) starts at (-40, 320) and drives to the gate at (-25, 330), facing
  the yard. Player and Pip start in its seats and climb out at the gate.
- Granny starts on her porch mark (-64, 334), stands, and walks to (-40, 336) facing east; she taps the tank from there
  (the hauler is at the gate). She turns to the player for the tea.
- Pip reads the letter at the gate, facing the player's side of the line.
- Bramble stays at his mark (-48, 352), leaning on his combine; he faces the camera for his tease.
- The player ends at (-20, 326) (the quest's exit spot, kept), walking there in the button.

## 10. The button

The player's face, the espresso cup in hand, Granny's tank knock off-screen, and a two-second silence. It is the right last
moment because it is a picture: the debt is paid, the crew is somewhere warm, and the player has not yet been asked for
the next favour. It is the sincere register of the chapter, so it is held and not joked.

## 11. Self-check

- [x] Want, obstacle, turn: Granny's wish to be fed; Pip's pride against his fear; the payoff and the tease.
- [x] Hook in 3 s: the hauler rolling through the gate (a drive is a hook).
- [x] Every line under 16 words (longest 13); no narration; no description of what the picture shows.
- [x] Voices: Granny's "now we can cook", "sugar" once; Pip's tic, undone; Bramble's tease; the player silent.
- [x] Every speaker MCU or closer, facing the camera (Bramble framed square, not from behind).
- [x] One side of the line per conversation (`coverage('pip', 'player', 1)`).
- [x] Music changes with reasons; one stinger (`triumph`) on the payoff; a 2.0 s silence on the button.
- [x] Setups and payoffs: the Kiln-Debt (chapter 1) is paid; the Biscuit's Nap side-quest tease; "Dew makes everybody thirsty" is Granny's offer of a home.
- [x] Golden-hour stage; no night scene.
- [x] Checker: 35.3 s, all shots pass, no faults (`scenecheck.dev.test.ts`).
- [x] `direction.notes` points here.
