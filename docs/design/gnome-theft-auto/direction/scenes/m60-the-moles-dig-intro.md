# Director's notes: `m60-the-moles-dig-intro`

| | |
| --- | --- |
| Scene | `m60-the-moles-dig-intro` in `src/cutscene/scenes/story/m60-the-moles-dig.ts` |
| Played by | quest `m60-the-moles-dig` (The Moles Dig), as the `scene` of its first visit objective, when the player reaches the dune south of Fort Sandpit (Old Mother Tumblesoil's call is the briefing) |
| Kind and length | `intro`, aim 30-60 s; about 38 s at Normal text speed |
| Where, when | stage `m60-dune-dusk`: a dune south of the fort, below the gate road; dusk (`sky: 'golden'`) |
| Before / after | before: Tumblesoil's call, Pip's and Tansy's "Diggs joined and the armory stayed sealed"; after: the escort across the sand, then the dig |

## 1. Purpose in the story

Diggs meets the Burrowfolk, and the camera has to make the audience feel the size of it: a very tall hardliner and three very
small, very polite moles. It sets up the act's mole ladder (the moles being misread: #24 spades chase Nubbin, #48 Basil blames a mole,
#60 here) and plants the payoff the outro lands: "A bow is not a salute." "I shall practise, sir." It also hands the objective in
character ("Escort them. Keep them clear of that ridge.") and plants the Hat Watch spotter the escort has to avoid.

## 2. The player's feeling

- **In:** a little late, hat in hand, on a sunset dune with a commander who cannot be hurried.
- **Out:** charmed, a bit nervous about the ridge; a clear job.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Nubbin | to be of use, once, and be thanked | a commander twenty times his height, a sandy dune | formal courtesy, bowing | resolves to practise the salute |
| Commander Diggs | to keep his fort's armory plan under control | three moles with no rank; he does not know what to do with them | clipped, no adjectives, no contractions; orders | gives them an escort and a (private) respect: "Practise." |
| The player | to start the job | none | reactions (a tip of the hat, a nod) | |

## 4. Subtext

- Diggs fears being the guard nobody guards. Being bowed to by a mole is the first time in fifteen years that anyone has offered him
  more than a nod: he does not know it is a courtesy and he does not want to know it is a respect.
- Nubbin's "Also, today, digger" is a post runner who has been given a new job and is trying very hard.
- "Effective yesterday" is Diggs's joke, played absolutely straight, on his own favourite phrase.

## 5. Beat sheet

| # | Time | Beat | What happens |
| --- | --- | --- | --- |
| 1 | 0-3 | Hook | Ground level on the dune, low gold sun: three small shapes in single file over the sand, long shadows, tiny pickaxes on their shoulders. |
| 2 | 3-9 | Setup | Nubbin plants his pickaxe like a flag: "Good evening. Ma'am says we dig where we are asked. You asked." The player tips a hat. |
| 3 | 9-22 | The gag | Diggs: "These are the diggers." "Nubbin, sir. Post runner. Also, today, digger." "No rank. No hats." Nubbin bows. "A bow is not a salute." "I shall practise, sir." |
| 4 | 22-31 | Turn | A glint on the far hill: "Sir? There is a person on the far hill." Long lens on the spotter. "Hat Watch spotter. Effective yesterday." "Escort them. Keep them clear of that ridge." |
| 5 | 31-38 | Button | The moles shoulder their picks and file off; Nubbin tries the salute over his shoulder and taps himself with the pickaxe. Diggs, low: "Practise." |

## 6. Shot list

| # | Shot | Lens / distance | Move | On | Motivation |
| --- | --- | --- | --- | --- | --- |
| 1 | stage camera `crest` | 44, a mole's eye height | locked | the three moles coming over the dune toward the lens, Diggs's boots at the edge | hook, shot at the moles' own eye line |
| 2 | `DIGGS_TALK.single('nubbin','mcu')` | 35, eye | locked | Nubbin | the plant; the greeting |
| 3 | `reaction('player',...)` | 35 | locked | the player | the tip of the hat |
| 4 | `DIGGS_TALK.single('diggs','mcu'/'cu',{height:'low'})` | 35 / 30, low | locked | Diggs | his lines: from a mole's eye level he is a wall |
| 5 | `DIGGS_TALK.single('nubbin','mcu')` | 35, eye | locked | Nubbin | his answers: never looked down on |
| 6 | `NUB_YOU.single('nubbin','mcu')`, then a long-lens cut onto the spotter (22) | 35 / 22 | locked | Nubbin, then the spotter's glint | the turn |
| 7 | `pushIn('diggs','mcu',4,{toward:'player',height:'low'})` | 35 -> 30 | slow push | Diggs | the order |
| 8 | stage camera `wide`, then `DIGGS_TALK.single('diggs','mcu',{height:'low'})` | 50 / 35 | locked | the moles filing off; Diggs | the button |

Moles at eye height, gnomes talking to them from below: batch-3 notes 6.5. Diggs and Nubbin share one coverage set.

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Nubbin | Good evening. Ma'am says we dig where we are asked. You asked. | Tumblesoil's own line ("we dig where we are asked") |
| Diggs | These are the diggers. | flat |
| Nubbin | Nubbin, sir. Post runner. Also, today, digger. | small tidy sentences |
| Diggs | No rank. No hats. | no adjectives |
| Diggs | A bow is not a salute. | the setup |
| Nubbin | I shall practise, sir. | the payoff owed to the outro |
| Nubbin | Sir? There is a person on the far hill. | a mole's way to say "spotter" |
| Diggs | Hat Watch spotter. Effective yesterday. | "effective immediately" turned round |
| Diggs | Escort them. Keep them clear of that ridge. | the objective, in character |
| Diggs | Practise. | the button |

## 8. Music and sound

| Time | Cue | Why |
| --- | --- | --- |
| 0.0 | `sandpit` music, `wind` bed | Fort Sandpit's march, slow; the fort is near |
| 0.0 | `squeak`, `shovel` (a tiny pickaxe tapping the dune) | the hook |
| 3.4 | `shovel` | the pickaxe goes in |
| 25.9 | `snap` | the glint of the spyglass |
| 35.3 | `clatter` | the pickaxe on a head |

## 9. Blocking and vehicles

Marks (stage `m60-dune-dusk`): Nubbin (397.4, 100.6), diggers (395.2, 103.2) and (399.8, 103.6), Diggs (388.0, 92.6) at the crest
with his rifle, the player (392.4, 96.6), the spotter (352, 112). The moles enter from (402, 106.2), (404.6, 108.6) and
(407.2, 111.0) and fan out to their marks. At the end they walk north about seven metres. The player ends on the dune on foot.

## 10. The button

A mole saluting over his shoulder and hitting himself on the head, and a very tall man saying one word, quietly: "Practise." It is
the first time Diggs has asked anything of a mole, and the scene ends on the thing he will be paid back for in the outro.

## 11. Self-check

- [x] Want (be of use / keep control), obstacle (size, rank), turn (the glint; the order).
- [x] Hook in 3 s.
- [x] Every line 11 words or fewer; no coordinates read out.
- [x] Voices: Nubbin small and polite; Diggs clipped, no contractions.
- [x] Speakers MCU or closer; one side of the line.
- [x] Running joke ("moles being misread") climbs a rung; "A bow is not a salute" is owed to the outro.
- [x] `npm run cutscene-report` OK; line of sight passes.
- [x] `direction.notes` points here.
