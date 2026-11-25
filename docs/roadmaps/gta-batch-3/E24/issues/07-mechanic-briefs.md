Epic: E24-2 (workplace jobs, parallel build)
Depends on: none

## Environment
Read `docs/roadmaps/gta-batch-3/E24/_env.md` first. Part logic, part comedy writing: the briefs should be funny to read.

## Goal
`workplaces/mechanic/briefs.ts`: about 16 client briefs for the mechanic job at Pay 'n' Glaze ("make it pink and
loud", "racing look, cheap") and the pure scoring of a finished car (a `@lawn/glaze` Loadout) against a brief. Tested.

## Read first
- `games/gnome-theft-auto/src/workplaces/mechanic/types.ts`: `HueFamily`, `PartSlot`, `Want` (its comment is the exact
  rule for each kind), `BriefWant`, `Brief`, `BriefScore`.
- `games/gnome-theft-auto/src/workplaces/mechanic/briefs.ts`: the stub; keep all exports and signatures.
- `packages/glaze/src/types.ts` (`Loadout` fields) and `packages/glaze/src/ids.ts` (valid ids: FINISH_IDS, DECAL_IDS,
  TYRE_IDS, RIM_IDS, ..., HORN_IDS, EXTRA_IDS); `packages/glaze/src/loadout.ts` `defaultLoadout(paint)`,
  `normalizeLoadout`; `packages/glaze/src/catalog.ts` `PAINT_SWATCHES` (named colours) and `PRICES`.
- `games/gnome-theft-auto/src/glazeStore.ts`: `GLAZE_KINDS` (the vehicle kinds the shop dresses; briefs use only
  'push-bike', 'ride-on', 'zero-turn', 'lowrider', 'mulch-spreader', 'snail-coach').
- `games/gnome-theft-auto/src/jobs/workDefs.ts`: `starsForScore`, `Stars`.

## Change
- `games/gnome-theft-auto/src/workplaces/mechanic/briefs.ts`:
  - `hueFamily(hex)`: convert to HSL. Lightness < 0.18 -> 'black'; saturation < 0.15 -> lightness > 0.8 ? 'white' :
    'grey'; hue 15..45 with lightness < 0.4 -> 'brown'; else by hue degrees: <15 or >=345 red, <45 orange, <70 yellow,
    <160 green, <190 teal, <250 blue, <290 purple, <345 pink (so Bubblegum Pink 0xff7eb6 is 'pink', Poppy Red
    0xd8342c red, Mulch Brown 0x6b4a2f brown, Moss Teal 0x1d6b63 teal, Lilac Hush 0x8e44ad purple).
  - `wantMet(want, start, final)`: exactly per the `Want` comment in types.ts. Empty = 'none', or 'stock' for slots
    whose default is 'stock' (tyre, rim, steer, lamp, grille, bumper, horn).
  - `scoreBrief(brief, start, final, partsCost)`: `raw = 100 * sum(weight of met wants) / sum(all weights)`. If
    `final` equals `start` (`sameLoadout` from '@lawn/glaze'), cap raw at 10 ("You did nothing."). Over budget:
    `overBudget = max(0, partsCost - budget)`, penalty `min(40, 50 * overBudget / budget)`. Under half the budget with
    raw >= 80: +5 ("Cheap AND right."). score = clamp(round(raw - penalty (+ bonus)), 0, 100); stars =
    `starsForScore(score)`. lines: one per want, `'✓ ' + says` or `'✗ ' + says`, then the budget line ("Over budget by
    40 🌰" / "Inside budget (120 of 150 🌰)").
  - `BRIEFS`: 16 briefs, ids `brief-<slug>`, spread over `minLevel` 1 (6 briefs), 2 (3), 3 (3), 4 (2), 5 (2). Each:
    a funny gnome client name (two words, gnome-ish: "Bramble Fennick", "Dot Pennywort-Smythe"), a `look` (hat,
    shirt, beard colours as 0xRRGGBB), a vehicle, a `start` (the car as it arrives: a dull or awful look, e.g. primer
    grey with mudflaps), the brief `text` in their voice (1-2 sentences), 2-4 wants with `says`, a `budget` (60..400
    Acorns, check `PRICES` and catalogue prices so the brief is doable), and `good` / `bad` verdict lines. Must
    include: "Make it pink and loud." (paint pink + loud), "Racing look, cheap." (spoiler + racing-ish rims/decal,
    small budget), a funeral director who wants it "respectful but fun" (black + one extra), a nervous gnome who wants
    it "quiet, invisible to the Hat Watch" (quiet + grey/white + no glow), a lowrider fan ("low, glowing, gold rims"),
    a farmer ("big wheels, mudflaps stay"), a gnome who wants "exactly the same, but better" (changed n=3 + keep
    paint), the Mayor's aide ("a third coat, for the Mayor's other mower: candy red, bunting"). Keep it in Turfton's
    satirical voice; Pay 'n' Glaze's slogan is "New Coat. Who Dis?".
  - `briefsForLevel`, `pickBrief`: keep the stub's bodies.
- `games/gnome-theft-auto/src/workplaces/mechanic/briefs.test.ts` (new): hueFamily on the six named colours above;
  every brief's ids are valid Loadout values (`normalizeLoadout({ ...defaultLoadout(0x888888), ...b.start })` keeps
  them) and its wants are satisfiable (build a loadout that meets them all and check `scoreBrief(...).stars === 5`
  for at least the pink-and-loud and racing briefs); an unchanged car scores <= 10; going far over budget lowers the
  score; levels 1..5 each have at least one brief.

## Contract
Exports as in the stub: `BRIEFS`, `hueFamily`, `wantMet`, `scoreBrief`, `briefsForLevel`, `pickBrief`. Pure: no DOM,
no three.js.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/workplaces/mechanic/briefs.test.ts` passes.
- `npx tsc --noEmit -p games/gnome-theft-auto` has no errors in `workplaces/mechanic/briefs*.ts`.

## Out of scope
`mechanic/types.ts` (do not change), every other file.
