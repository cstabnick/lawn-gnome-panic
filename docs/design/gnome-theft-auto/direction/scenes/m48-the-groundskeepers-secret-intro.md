# Director's notes: `m48-the-groundskeepers-secret-intro`

Watch it at `?no-intro&cutscene=m48-the-groundskeepers-secret-intro`.

| | |
| --- | --- |
| Scene | `m48-the-groundskeepers-secret-intro` in `src/cutscene/scenes/story/m48-the-groundskeepers-secret.ts` |
| Played by | quest `m48-the-groundskeepers-secret` as its intro, given by Thrift Hosepipe at his shed |
| Kind and length | `intro`, aim 30-60 s |
| Where, when | stage `hedgeworth-ninth-green`, dusk, `sky: 'golden'` |
| Before / after | before: Hedgeworth Links (#47). After: the mole family drive to the shed |

## 1. Purpose in the story

The comedy beat of the pair: a groundskeeper talks to the grass and the grass answers (molehills pop on cue). Then the secret
comes out, a family under the green and Basil's traps, and the player is given the job. It sets up #48's sincere outro by
making Thrift, and the moles, lovable first.

## 2. The player's feeling

- **In:** just finished the Links; Thrift's tour ended at his shed.
- **Out:** charmed, and protective of the moles; sure of the job (drive them to the shed, slowly).

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Thrift | to move the family before Basil's traps | the player's possible disapproval | gruff, slow, tender to the grass; deflects with jokes | trusts the player with the secret |
| The player | to understand | a man talking to the lawn | dry questions | takes the job |

## 4. Subtext

- "Only those who ask nicely" is the whole of Thrift's decency, and a test of the player.
- His first line to the green is the voice he does not use on people (bible); the second is for the player.

## 5. Beat sheet

| # | Beat | What happens |
| --- | --- | --- |
| 1 | Hook | ground level through the fringe; Thrift murmurs "Evening, my dear. Are you comfortable?"; a hill pops (the answer) |
| 2 | Setup | "Who are you talking to?" "The ninth. She has opinions." Another hill: "She says you walk loud." |
| 3 | Gag | "The grass answers you?" "Only those who ask nicely." Three hills pop in a wave |
| 4 | Turn | "There. You saw. A family, under my ninth, a year now." Basil hates moles; he is coming with traps |
| 5 | Button | "They are shy of engines." All three moles look at the player and duck; a sprinkler ticks |

## 6. Shot list

`ninth-low` stage camera; `coverage('thrift','player',1)` singles (one low); three inserts on molehills built with `up(...)`;
the `ninth-wide` stage camera for the wave and for the button; a `pushIn` on Thrift at the turn.

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Thrift | Evening, my dear. Are you comfortable? | to the grass |
| Thrift | Good. Good. Mind your roots. | |
| Player | Who are you talking to? | |
| Thrift | The ninth. She has opinions. | |
| Thrift | She says you walk loud. | |
| Player | The grass answers you? | |
| Thrift | Only those who ask nicely. | |
| Thrift | There. You saw. A family, under my ninth, a year now. | |
| Player | Basil hates moles. | |
| Thrift | He is coming with a trap-line. Drive them to my shed, gently. | the job |
| Thrift | They are shy of engines. | |

His card was given in The Kicked Board (#29): none here.

## 8. Music and sound

`warm`, `garden` bed. `rustle` at the hook; `squeak` on each mole; a quiet `squirt` as the sprinkler ticks at the end.

## 9. Blocking and vehicles

Thrift at (-1070.4, 633.8) on one knee; the player at (-1058.6, 632.4); molehills at (-1072.2, 637.2), (-1068.8, 630.4),
(-1074.4, 633.4). A golf cart is parked by the green for the player (gameplay, not in this scene).

## 10. The button

Three moles pop up at once, look at the player and duck, and a sprinkler ticks on. It is the right last moment because the
joke has become a promise.

## 11. Self-check

- [x] Hook by 3 s; no narration; every line under 16 words.
- [x] Gag first, secret second; the funny comes from Thrift's character.
- [x] One side of the line (`coverage('thrift','player',1)`).
- [x] Dusk lit by `golden` sky; `direction.notes` points here.
