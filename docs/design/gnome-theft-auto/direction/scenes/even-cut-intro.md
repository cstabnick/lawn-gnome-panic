# Director's notes: `even-cut-intro`

The finale's call to arms. Watch it at `http://localhost:5312/?no-intro&cutscene=even-cut-intro`.

| | |
| --- | --- |
| Scene | `even-cut-intro` in `src/cutscene/scenes/story/ch5.ts` |
| Played by | quest `ch5-even-cut` ("The Even Cut") as its intro, given at the Dust Flats Overlook |
| Kind and length | `chapter-open`, aim 45-80 s; now about 66 s (was 48 s, 12 faults) |
| Where, when | the meridian (the Combine), `bodega-front`, `dust-safehouse`, `brenda-throne`; dusk, `sky: 'golden'` |
| Before / after | before: `spade-truce-outro` (the coalition; "Tonight"). After: the escort fight on the meridian, the drop onto the Combine, the boss and the jam, then `even-cut-outro` |

## 1. Purpose in the story

Chapter 5 asks: will they stop the Combine, and what will Turfton be? The first picture is the question: the machine on
the meridian, and its owner on the PA losing his composure for the first time (the bible's one licence for Vesper's
exclamation marks). Then the crew answers it.

Payoffs and rungs, all in one scene, each in its own beat:
- **Asphalt** hops off the counter (the barometer: something is truly wrong).
- **The hat ladder, rung 5**: "And to the gnome in that hat: tonight, it cracks." over the player's face.
- **The golden kazoo**: it goes off in the silence right after that threat, the worst possible moment (rung 3, its payoff).
- **The brass forty-eighth wrench** comes out from under the map table, and the `finale` theme starts with it. "I said it
  waits for a big enough heist." / "Is it?" / "It's big enough." (rung 3, after "Not big enough... Close.").
- **"Okay, hear me out"**: Tansy says it ("Hear me out."), and Pip has nothing to say: a held close-up of him, speechless.
- Diggs's permit line and Pip's "Let's go jam a god-machine with a rock!" from the story bible.

The old scene opened on a dead shot and a 20-word line with "crossed z = -300 on the center meridian", used a caption to
describe the cigar box, played Granny with her back to the camera and Tansy's wrench line on a wide.

## 2. The player's feeling

- **In:** the end of chapter 4: the coalition gathered, the machine awake.
- **Out:** threatened personally (the hat), then lifted: the crew is ready and funny, and the finale theme is playing.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Vesper (PA) | to make Turfton submit | they will not | shouting, at last | has made it personal |
| John | (to report) | | dry | |
| Pip | to be brave | nerves (the kazoo goes off) | apology; then volume | finds his line |
| Tansy | to send the crew in with a plan | four minutes | the clock, the wrench, Pip's own catchphrase | runs the plan; the wrench is out |
| Granny | to hold the canal | | warmth | |
| Diggs | to stand with them | protocol | a permit joke said straight | |

## 4. Subtext

- Vesper's exclamation marks are fear: the crew got the Whirligig and the Stone; his order is cracking.
- Tansy saying "Hear me out." is a gift to Pip: she is telling him his way was right all along. He hears it.

## 5. Beat sheet

| # | Time | Beat | What happens |
| --- | --- | --- | --- |
| 1 | 0-11 | Hook / question | A low push towards the Grand Combine; an escort van rolls past the lens; the ground shakes. PA: "Look at yourselves! Chipped! Muddy! Unregulated!" "By morning, Turfton will be smooth. And silent. And beige!" |
| 2 | 11-18 | Meanwhile | Bodega & Sons, no music, the window rattling: "Asphalt just hopped off the counter." ... "Twelve years. Never once." |
| 3 | 18-26 | The hat | A slow push-in on the player at the map table as the radio carries "And to the gnome in that hat: tonight, it cracks." Music out. Held silence. |
| 4 | 26-29 | The kazoo | The toot. Pip: "...Sorry. Nerves." |
| 5 | 29-37 | The clock | Tansy: "It's on the meridian. Downtown in four minutes." Pip: "Four minutes? I can't find my other boot in four minutes." Tansy: "Then we go in three." |
| 6 | 37-45 | The wrench | Tansy reaches under the table; the brass wrench; `finale` begins. The three-line rung. |
| 7 | 45-51 | Turn | "Hear me out." Pip, speechless, held. The plan in three clauses. |
| 8 | 51-61 | The coalition | Granny at the canal ("Go jam it, sugar."), Brenda cheering; Diggs, low: the permit line. |
| 9 | 61-66 | Button | Pip, low: "Let's go jam a god-machine with a rock!" The crew at the table; CHAPTER 5 — THE EVEN CUT. |

## 6. Shot list

| # | Shot | Lens | Move | On | Motivation |
| --- | --- | --- | --- | --- | --- |
| 1 | low `dolly` at the Combine | 50 | slow push | the machine | awe and threat: picture first, voice second |
| 2 | `shot('john','mcu')` | 35 | locked, shaking | John | the chorus; the rattle is the Combine |
| 3 | `dolly` push-in on the player | 34 | slow push, no cut | the player | the threat lands on the face |
| 4 | `coverage('tansy','pip',-1)` MS on Pip | 40 | locked | the kazoo | the gag gets the widest shot that shows it |
| 5-11 | `coverage('tansy','player',1)` and `coverage('tansy','pip',-1)` singles, MCU to CU | 35/30 | cut in | the table | tightening as it escalates |
| 12 | `reaction('pip', cu)` | 30 | locked, held | Pip | speechless |
| 13 | `shot('granny','mcu')`, `reaction('brenda', cheer)` | 35/40 | locked | the canal | one voice each |
| 14 | `shot('diggs','mcu',{height:'low'})` | 35 | locked | Diggs | the Guard is shot low |
| 15 | `shot('pip','ms',{height:'low'})` | 40 | locked | Pip | heroic, finally |
| 16 | `dolly` behind the crew to the table | 48 | slow | the crew | the title over all of them |

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Vesper (PA) | Look at yourselves! Chipped! Muddy! Unregulated! | from the story bible; his first exclamation marks |
| Vesper (PA) | By morning, Turfton will be smooth. And silent. And beige! | |
| John | Asphalt just hopped off the counter. / Twelve years. Never once. | was "Asphalt hops down off the counter. She's never done that." |
| Vesper (radio) | And to the gnome in that hat: tonight, it cracks. | hat rung 5 |
| Pip | ...Sorry. Nerves. | after the kazoo |
| Tansy | It's on the meridian. Downtown in four minutes. | replaces the 20-word "crossed z = -300" line |
| Pip | Four minutes? I can't find my other boot in four minutes. | kept |
| Tansy | Then we go in three. | kept |
| Tansy | The forty-eighth. I said it waits for a big enough heist. | wrench rung 3; replaces the caption |
| Pip | Is it? | |
| Tansy | It's big enough. | |
| Tansy | Hear me out. | Pip's catchphrase in her mouth (3 words, so not a repeat of his 4-word line) |
| Tansy | Whirligig over it. Drop on the deck. Jam the intake with the Stone. | three clauses; the plan |
| Granny | Cloverfield's holding the south canal. Go jam it, sugar. | "sugar" once |
| Diggs | Spade Guard's with you. Nobody levels my sandbox, or your city, without a permit. | from the story bible |
| Pip | Let's go jam a god-machine with a rock! | the line that sends them in |
| ~~Caption~~ | ~~A cigar box under the map table. Forty-seven wrenches, in size order.~~ | described the picture |

## 8. Music and sound

| Time | Cue | Why |
| --- | --- | --- |
| 0 | `villain`, `wind`; `engine-rev`, `shake` | the machine |
| 11 | music out; `glass` (the window rattling), `shake` | Bodega, in dread |
| 18 | `villain` back under the radio voice, then out | his line, then silence |
| 26 | `whistle` (the kazoo) | the worst moment |
| 40 | `finale` in, on the wrench | the bible: chapter 5 only, from the brass wrench on |
| 64 | `chapter` stinger with the title | |

## 9. Blocking and vehicles

- The Combine prop at (0, -300); the escort van drives the meridian past the camera from (-2.5, -284).
- Safehouse: Tansy at the map table (268, 43), Pip at (271.4, 45.6) between her and the player (272, 50), Diggs at
  (264, 44). The Whirligig parked on its safehouse mark. The player ends at (273.2, 47.2), by the table.
- Canal: Granny on the bank at the first biker mark, Brenda on the bank beside her throne at (-42, 214), a biker.

## 10. The button

Pip, from below, cheering his line, then the whole crew round the table under CHAPTER 5 — THE EVEN CUT with the finale
theme. A chapter opener ends on its title.

## 11. Self-check

- [x] Want, obstacle, turn: the crew against four minutes; the turn is Tansy's "Hear me out."
- [x] Hook in 3 s (the machine, the rumble); no narration, no caption.
- [x] Lines under 16 words; no coordinates.
- [x] Voices per the bible; the player silent (their reaction is the hat close-up).
- [x] Speakers framed and facing; off-screen voices only for the PA and radio.
- [x] Sides of the line kept per exchange.
- [x] Music motivated; stingers: chapter only; one held silence.
- [x] Ladders: hat rung 5, kazoo payoff, wrench rung 3, "hear me out" payoff, Asphalt rung 3.
- [x] Golden sky.
- [x] Report OK; removed from the baseline.
- [x] LOS passes; watched at both sizes.
- [x] `direction.notes` points here.
