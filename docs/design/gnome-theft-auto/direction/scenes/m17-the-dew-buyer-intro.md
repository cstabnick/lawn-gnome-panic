# Director's notes: `m17-the-dew-buyer-intro`

| | |
| --- | --- |
| Scene | `m17-the-dew-buyer-intro` in `src/cutscene/scenes/story/m17-the-dew-buyer.ts` |
| Played by | quest `m17-the-dew-buyer` ("The Dew Buyer") as its intro, given by Granny at her barn |
| Kind and length | `intro`, aim 30-60 s; 32.8 s at Normal text speed |
| Where, when | stage `granny-map-table` (the seed-tray table in the yard); day (`sky: 'noon'`) |
| Before / after | before: the Dew run and the sprinkler errands (rows 16, 18 order aside). After: the tail out of Cloverfield behind the tanker |

## 1. Purpose in the story

The Dew the player won back keeps leaving, one tanker a night, always west. Act II opens its second question: who buys
it. The scene is a briefing with a turn: the tanker Granny has been describing goes by while she describes it (a scripted
moment in the world, the scene's own prop is the pie tin lifted off a map like a cloche).

## 2. The player's feeling

- **In:** a debt paid, a boss who feeds them.
- **Out:** curious and a little uneasy: someone is paying for Dew and nobody will say who.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Granny | to learn who is buying her Dew | she cannot leave the barn | homely metaphors, pie as pay | sends the player |
| The player | to know the job | nothing | short questions | takes it |

## 4. Subtext

Granny's fear is foreclosure; a buyer she cannot name is a threat she cannot price. She hides it in "In pie."

## 5. Beat sheet

| # | Time | Beat | What happens |
| --- | --- | --- | --- |
| 1 | 0-5 | Hook | the pie tin comes up off the map; "Sugar, the Dew you brought me keeps walking off." |
| 2 | 5-15 | Setup | the map from above, a pencil line going off the edge; "One tanker a night. Always west." "Who is buying?" "In pie." |
| 3 | 15-25 | Turn | an engine, the unmarked tanker passes the yard on the track; "There. Right on time, headlamps off." "Going west." |
| 4 | 25-33 | Button | "Tail it from Route South. Stay well back. They know your hat." then "Bring me a name. I will bring the pie." |

## 6. Shot list

`coverage('granny','player',1)` for all talk (mcu, one high ms at the end); a top-down still cut onto the map; a `track`
shot on the tanker passing, 5.5 s, fov 46.

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Granny | Sugar, the Dew you brought me keeps walking off. | "sugar" once |
| Granny | One tanker a night. Always west. Never a plate on it. | |
| Player | Who is buying? | |
| Granny | That is what I pay you to find. In pie. | pie as currency |
| Granny | There. Right on time, headlamps off. | |
| Player | Going west. | |
| Granny | Tail it from Route South. Stay well back. They know your hat. | the objective, one place name |
| Granny | Bring me a name. I will bring the pie. | the button |

## 8. Music and sound

`warm` music, `meadow` bed; `clatter` of the tin, `paper` on the map, `engine-rev` as the tanker arrives.

## 9. Blocking and vehicles

Granny stands at (-48.2, 327.6) with the tin; the player across the table at (-48.4, 321.2). The tanker (`hoa-van`, plain
grey, a hidden driver) spawns at (10, 390) and drives the `tanker-pass` path: (-8, 360), (-33, 328), (-40, 320), west.

## 10. The button

Granny's high ms and the promise of a slice. Last sound: the tin settling over the map.

## 11. Self-check

- [x] Want (a name), obstacle (the unmarked tanker), turn (it passes), button (the pie).
- [x] Lines under 16 words; one place name; "sugar" once; Granny's own metaphor (pie).
- [x] `direction.notes` points here.
