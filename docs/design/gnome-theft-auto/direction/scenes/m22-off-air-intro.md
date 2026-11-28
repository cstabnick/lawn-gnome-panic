# Director's notes: `m22-off-air-intro`

Watch it at `http://localhost:5310/?no-intro&cutscene=m22-off-air-intro`.

| | |
| --- | --- |
| Scene | `m22-off-air-intro` in `src/cutscene/scenes/story/m22-off-air.ts` |
| Played by | quest `m22-off-air` ("Off Air") as its intro, given at Side-Valve Salvage by Sorrel's call |
| Kind and length | `intro`, aim 30-60 s; now 32.7 s at Normal text speed, no faults |
| Where, when | stage `sorrel-radio-booth` (the booth and the lay-by on the west highway) intercut with `side-valve-bay` for Pip and the player; dusk, `sky: 'golden'` |
| Before / after | before: the penthouse viewing is behind the player (they refused Vesper and left the city). After: the player picks Pip up at Side-Valve and drives him west |

## 1. Purpose in the story

Act II's question is whether the player will take Vesper's deal. The act answers it by showing what the HOA does to the
people who would not: here it takes a radio host's tapes and calls the rain "unlicensed weather". The scene gives Sorrel
Tillbrook her first story appearance (intro card), states the stake (her tapes, her voice, "they want me quiet") and
plants Pip's reluctance to go west, which row 23 pays off at the tablet. It never says what the rain is or where it falls.

## 2. The player's feeling

- **In:** just left the city; somewhat adrift, no debt on the Kiln but no job either.
- **Out:** a small, specific wrong to put right (the tapes), a reason to bring Pip, and a dry, warm host who asked politely.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Sorrel | to get the tapes back and Pip west | the HOA van, her own ban on shouting | calm, measured, dry; explains the stake in one question's answer | puts her headphones back on: "Bring me my rain." |
| The player | to understand why the HOA wants tapes | none | one short question | takes the job |
| Pip | to stay at Side-Valve | his fear of going west (Fescue) | jokes and a running tic ("Okay, hear me out") | says it, and means it |

## 4. Subtext

- Sorrel never says "mower" (she says "the one in the Shed" later) and never says what the rain is. She says "my tapes"
  and "my rain": the listener is allowed to want to know.
- "Nothing. They want me quiet." is the whole of Act II's theme in four words.
- Pip's joke is a flinch: he has never "heard of west" because west is where Fescue is, and Fescue is where he is from.

## 5. Beat sheet

| # | Time | Beat | What happens (picture first, then words) |
| --- | --- | --- | --- |
| 1 | 0-2.4 | Hook | The HOA van pulls away from the lay-by with a shoebox of cassettes (tracked, engine, 2.4 s) |
| 2 | 2.4-8 | Setup | Sorrel at the booth, headphones off, static: "This is Sorrel Tillbrook, 88.7 Fescue Public." Her intro card |
| 3 | 8-14 | The stake | "The HOA took my tapes this afternoon. They call it unlicensed weather." Insert on the tape bank with the gap and the citation |
| 4 | 14-20 | The question | The player asks; "Nothing. They want me quiet." |
| 5 | 20-26 | Turn | "The van went west. Bring Pip. He knows vans, and he will not want to come." |
| 6 | 26-30 | Pip | At the bay Pip flinches: "Okay, hear me out. I have never heard of west." |
| 7 | 30-33 | Button | Sorrel, headphones back on, close: "Bring me my rain." |

## 6. Shot list

| # | Shot | Lens / distance | Move | On | Motivation |
| --- | --- | --- | --- | --- | --- |
| 1 | `track` from (-336, 4) | 50 | follows the van | the HOA van | the hook is the picture: the tapes leave |
| 2 | `shot('sorrel','mcu')` | 35 | locked | Sorrel | first words; the intro card holds on this shot |
| 3 | `shot('sorrel','ms',{height:'low',side:-30})` | 40 | locked | Sorrel | the second line, a different angle after the card |
| 4 | `cut` at (-379.4, 47) on the tape bank | 38 | locked | the tape bank and the citation slip | the insert: the gap |
| 5 | `shot('player','mcu')` | 35 | locked | the player at the bay | the question |
| 6 | `shot('sorrel','mcu',{height:'low'})` | 35 | locked | Sorrel | the answer |
| 7 | `shot('sorrel','cu',{side:-20})` | 30 | locked | Sorrel | the turn: Pip |
| 8 | `shot('pip','mcu')` | 35 | locked | Pip at the bay | the flinch |
| 9 | `shot('sorrel','cu')` | 30 | locked | Sorrel | the button |

No two-hander on one side of a line: Sorrel (booth) and the player and Pip (bay) are never in the same place, so there is no
line to cross. Singles only.

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Sorrel | This is Sorrel Tillbrook, 88.7 Fescue Public. | the radio host's sign-on; then her intro card |
| Sorrel | The HOA took my tapes this afternoon. They call it unlicensed weather. | the stake; 12 words; "weather" is the HOA's word, not hers |
| The player | What does the HOA want with rain tapes? | short; the one question |
| Sorrel | Nothing. They want me quiet. | the theme |
| Sorrel | The van went west. Bring Pip. He knows vans, and he will not want to come. | the turn; 16 words |
| Pip | Okay, hear me out. I have never heard of west. | his tic ("hear me out"), and a flinch under it |
| Sorrel | Bring me my rain. | the button; five words |

Names checked: `npm run lore -- find Sorrel` (host of 88.7 Fescue Public), the booth entry (tape bank, dish).

## 8. Music and sound

| Time | Cue | Why |
| --- | --- | --- |
| 0.0 | `fescue` music, `forest` ambience; the van's engine | Mossy Wood at dusk; the hook is the van leaving |
| 2.4 | `static` | the booth: radio on, headphones off |
| 8 | `paper` | the citation on the bench |
| 26 | `clatter` | Pip drops the spark plug he was flicking |
| intro | the `intro` stinger on Sorrel's card | L105: first story appearance |

## 9. Blocking and vehicles

- Sorrel at her desk mark (-375, 47) facing the table. The HOA van at the booth's getaway mark (-352, 12) driving out along
  the highway east. The citation slip on the table at (-376.4, 49.4).
- The player at the bay mark (-156, 70) facing Pip; Pip at (-135.5, 74), sitting on the crate, facing the player.

## 10. The button

Sorrel, headphones back on, close: "Bring me my rain." The jokes (Pip's) are done by then and the ask is short and plain.

## 11. Self-check

- [x] A want (the tapes), an obstacle (the van), a turn (Pip); not a briefing.
- [x] The hook lands in 2.4 s (the van); the first line is a character's.
- [x] Every line at most 16 words; no coordinates or waypoint read-outs.
- [x] Voices: Sorrel calm and dry (hz 122), Pip fast with his tic, the player short.
- [x] Every speaker MCU or closer facing the camera.
- [x] One intro card (Sorrel), after her first line, on an mcu.
- [x] Dusk lit by `sky: 'golden'`.
- [x] `cutscene-report` shows the scene OK; `direction.notes` points here.
