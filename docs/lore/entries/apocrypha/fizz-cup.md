---
id: fizz-cup
name: The Fizz Cup
kind: event
tier: apocrypha
setting: apocrypha
era: now
status: canon
games: [gnome-theft-auto]
aliases: [Fizz Cup, Dandelion Fizz Cup]
sources: [games/gnome-theft-auto/src/quests/races.ts, docs/lore/rulings.md]
related: [lost-and-found-speedway, burdock-bellweather, fizz-cup-field, dandelion-fizz, the-carburettors, razor-back, buck-iron, shelldon-mucilage, snail-mail-express, dock-hoewright, vinnie-turbo-sod]
---

A four-race series at the Lost & Found Speedway, sponsored by Dandelion Fizz and run by Burdock Bellweather. Each race is
in a different machine, and each is won by a different kind of gnome.

## What gnomes say

"Start with the mowers, finish with the Final." That is how the series is sold on Turfton FM, usually by Vinnie, who
has never been in a Rookie Mow-Down.

"Two laps, low and loud, a snail, then three laps and the whole yard listening." Burdock's summary, which he gives at
the race desk to anyone who asks.

## The truth

The four races, in order, all open from the race desk (quests in `quests/races.ts`):

1. **Rookie Mow-Down**: Ride-On Mowers, two laps, podium to pass. The rookie's first race and the only one with a
   podium requirement.
2. **Low & Loud Derby**: lowriders, two laps, against the Carburettors. Lugnut Lulu's crew hops the Rake-Handle, and
   you have to win.
3. **Snail-Coach Endurance**: snail-coaches, two laps. Shelldon "No-Trail" Mucilage races the whole lap on the
   gravel run-off because he will not touch paving. You have to beat him.
4. **The Final**: Zero-Turn Racers, three laps, against Vinnie "Turbo-Sod" Delacroix and Dock "Full-Throttle" Hoewright
   and Razor-Back's Sprocket Vane. You have to win.

Dandelion Fizz pays the prize money and sends a man to check the rosettes. The Fizz Cup champion is announced on
Turfton FM, and Vinnie demands a recount.

## In the games

- The four races are `race-rookie-mowdown`, `race-lowrider-derby`, `race-snail-endurance` and `race-fizz-cup-final` in
  `games/gnome-theft-auto/src/quests/races.ts`. They open one after another, each after the one before.
- Each race has its own rivals; see [fizz-cup-field](fizz-cup-field.md).

## Loose threads

Whether a Snail-Coach Endurance win counts when the snail was not on the paving. Burdock says it does. Shelldon says
the medal was posted.
