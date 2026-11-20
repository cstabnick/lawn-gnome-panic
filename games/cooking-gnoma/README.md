# Cooking Gnoma

A Cooking Mama-style kitchen prototype. For now there is one recipe: an **acorn cake with grass frosting**, made in five steps.

1. **Add the acorn flour.** Tap the flour sack three times. Three scoops is perfect.
2. **Stir the batter.** Press on the bowl and circle your finger round it, two full turns. Faster is better.
3. **Pour into the tin.** Tap the bowl to pick it up, then tap the cake tin.
4. **Bake it.** Light the oven, then take the tin out while the bar is in the golden band (7 to 8.5 s). Too early is raw, too late is burnt, and at 10 s the oven takes it out itself.
5. **Frost with grass.** Tap or drag across the top of the cake. Cover 90% to move on; cover all of it for 3 stars.

Each step earns 0 to 3 stars, 15 in all. The result screen gives the verdict.

**Gnoma** is the cooking mama who talks you through it. She praises every try, types out her lines in a speech bubble, blinks, and cheers at the end. She is a helper, not the player's gnome (see `docs/lore/rulings.md`, R-017). Her lines live in `src/dialogue.ts`.

Everything is bright and bouncy: a polka-dot wall, a sunny top bar, a wooden counter, objects with shadows that bob, and bursts of colour for every scoop, sparkle, splat and sprinkle. The sounds (taps, pops, plops, a ding, a cheer) are made in code with WebAudio, so there are no sound files. The browser only lets sound start after a tap, so the first tap turns it on.

Run it in development:

```
npm run dev -w games/cooking-gnoma
```

Build it:

```
npm run build -w games/cooking-gnoma
```

Every object in the game is a `@lawn/prefabs` item (acorn flour sack, grass tuft, mixing bowl, cake tin, clay oven, acorn cake), drawn to a PNG when the page loads. Each one falls back to its emoji when the browser has no WebGL. Gnoma is the game's own character, drawn in code.

## Controls

Everything is a tap or a drag, so it works with a mouse, a finger or a trackpad. Every button is at least 44 px tall.

- **Start over** (bottom left) starts the cake again.
- **Next** (bottom right) goes to the next step once the step is done.
- The **middle button** belongs to the step: *Light the oven*, *Take it out!*, and *Bake another* on the result screen.

The layout works in portrait and landscape. In landscape Gnoma sits in a column on the left; in portrait she sits in a strip on top. The cooking plate takes the rest, and the bars respect the phone's safe-area insets.

## Settings

Tuning lives in `src/config.ts`: the number of scoops, the stir turns and speed rules, the golden band, and the frosting coverage.

`?ovenSpeed=3` runs the oven three times faster. It is for demos and tests; the stirring is not affected.

## Achievements

Four, in `packages/achievements/src/catalog.ts` (`kitchen-*`): First Bake (finish a cake), Golden Brown (take it out at the golden moment), Cake Day (bake 5 cakes) and Perfect Slice (all 15 stars). Each one unlocks a gnome gear reward that already exists in `@lawn/prefabs`.

## Not done yet

- No other recipes, and no ingredient choice: the cake is always acorn flour with grass frosting.
- Pouring always earns 3 stars. A later version could judge how steady the pour is.
- Online play: not planned. A cake is a solo job.
- Gnome Party slice: a backlog row in `packages/party/README.md` (`cake-stir`), not built yet.
- No player gnome: the kitchen has no walking character of the player's, so it does not wear `@lawn/gnome`. Gnoma is a helper and is drawn in the game.
