# Prefab Editor (local tool)

Fix how `@lawn/prefabs` items look and how they sit on a gnome, then save straight back into the catalog source.
It runs only on your machine: the Vite dev server also writes files. It is not part of the arcade site.

```
npm run prefab-editor          # http://localhost:5390, opens the browser
```

## What it does

- **Show**: `model` puts the prefab on its own on the ground (any prefab: props, furniture, mowers) with your gnome
  beside it for scale. `head` / `back` / `neck` / `hand` put it on the gnome through `buildGear()` from `@lawn/gnome`,
  the same function every game and the Gnome Creator use, so what you see here is what players see.
- **Parts**: click a part in the view or the list. Edit shape, size, position, rotation, scale, colour, mirror, glow,
  alpha and segments, or drag it with the gizmo (W/E/R = move/rotate/scale). You can add, duplicate and delete parts,
  and move or scale every part at once.
- **Worn offset** (`wear` on the prefab): nudge, turn or scale the item only when it is worn or held. Icons and world
  copies are not affected. Use it when "the hat sits too low" but the hat itself is fine.
- **Grip**: where the hand holds a `hold` item.
- **Slot anchors** (`EQUIP_ANCHORS` in `packages/gnome/src/anatomy.ts`): the base point for each slot. Changing one moves
  every item in that slot.
- **Checks**: clearance to the head and face (the same measurement as `packages/gnome/src/gear-clearance.test.ts`),
  head spheres, poses (idle, walk, jump, sit), and gnome looks (yours, Gnorman, beard, pigtails, bowl cut, glasses, dress).
- **Used by**: which games name the item in code, whether it is a Gnome Creator reward (★), and a filter for unused ones.
- **Review**: mark an item ok / needs work / broken and write a note. Notes go to `tools/prefab-editor/review.json`, so
  you can ask an agent to "fix the items flagged in review.json". **Copy report** puts a plain-text description of the
  item, its numbers and your unsaved edits on the clipboard, for when it is easier to show than to explain.

Ctrl+S saves, Ctrl+Z / Ctrl+Shift+Z undo and redo, F frames the item, Esc deselects.

## Saving

**Save** rewrites only that prefab's `parts`, `grip` and `wear` in `packages/prefabs/src/catalog/<file>.ts`. Parts you
did not touch keep their exact text and comments. Then the page reloads with the new data.
Some prefabs build their parts in code (spreads, helper functions, constants like `DARK`). Their parts are read-only
here. The editor says why, still previews your edits, and **Copy report** gives you the new array to paste by hand.

After saving, run `npm test -w packages/prefabs` and `npm test -w packages/gnome` (clearance) as usual.

## Files

| File | What |
|---|---|
| `src/main.ts` | List, toolbar, inspector, save, review |
| `src/stage.ts` | The 3D view: gnome, worn item, gizmo, picking |
| `server/source.ts` | Finds a prefab in the catalog source and rewrites it as text; anchors; usage scan |
| `vite.config.ts` | The `/api` routes the page calls |
| `review.json` | Your review flags and notes |
