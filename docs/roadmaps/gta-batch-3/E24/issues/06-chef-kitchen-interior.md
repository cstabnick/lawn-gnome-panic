Epic: E24-2 (workplace jobs, parallel build)
Depends on: none (the diner prefabs are being made in parallel: use the `putIf` pattern so missing ones are skipped)

## Environment
Read `docs/roadmaps/gta-batch-3/E24/_env.md` first. Environmental-storytelling issue: the room must tell small stories.
You may run ONE dev server on port **5341** only (`cd games/gnome-theft-auto && npx vite --port 5341 --strictPort`,
in the background) and stop it when done.

## Goal
The Route South Acorn Diner gets a walk-in kitchen: interior `acorn-diner-kitchen`, entered from the west front of the
existing diner building on Route South, with Sage Ladle at the pass, Fence-Post Frank on his stool beyond the hatch,
a "Work a shift" spot that starts the chef job, and dressing that tells stories.

## Read first
- `docs/roadmaps/gta-batch-3/E05/contracts.md`: `defineInterior` and the kit (`room`, `door`, `put`, `block`,
  `window`, `sign`, `npc`, `spot`), rules (rooms >= 10 x 8 m, objects are prefabs, `gta:interior-say` toasts).
- `games/gnome-theft-auto/src/pardonlin/interiors.ts`: a finished example (themes, `putIf`, `topOf`, `say`, tables, signs).
- `games/gnome-theft-auto/src/workplaces/chef/types.ts`: `CHEF_KITCHEN_ID` ('acorn-diner-kitchen'), `CHEF_START_EVENT`.
- `games/gnome-theft-auto/src/workplaces/chef/kitchen.ts`: the stub (imported once by `workplaces/index.ts`).
- `docs/lore/entries/apocrypha/sage-ladle.md`, `route-south-acorn-diner.md`, `fence-post-frank.md`.

## Change
- `games/gnome-theft-auto/src/workplaces/chef/kitchen.ts`: `defineInterior({ id: CHEF_KITCHEN_ID, name: 'Acorn Diner
  kitchen', prompt: 'Enter the Acorn Diner', door: { x: 9.6, z: 252, yaw: Math.PI / 2 }, exit: { x: 8.4, z: 252, yaw:
  -Math.PI / 2 }, size: { w: 14, d: 10, h: 3.6 }, theme: <warm diner theme: cream tile walls, black-and-white floor
  colour, red trim>, ambience: 'farmland', build(kit) {...} })`. (The diner building's collider is x 10.6..21.4,
  z 245.7..258.3 and its front faces west onto Route South, so the door spot at x 9.6 is on the road side; confirm in
  the browser that "Enter the Acorn Diner" shows there and walking out puts you on open ground.)
  - Layout (local metres, origin room centre, +z south): entrance door on the west wall (`kit.door(-6.8, 2.5, Math.PI
    / 2)` or similar, facing into the room). The north half is the kitchen: `diner-griddle`, `diner-fryer`, `stove`,
    `diner-stock-pot` on it, `diner-chopping-board` on a counter block, `diner-dish-rack`, `fridge` if a prefab
    exists (check with `getPrefab`), `diner-ticket-rail` on the wall above the pass, `diner-order-spike`,
    `diner-pass-bell` on the pass. The pass: a counter `kit.block` across the middle with a gap (no shared faces with
    other blocks) and `diner-hatch-shelf` on it. The south strip beyond the pass is a slice of the dining counter with
    two `bar-stool`s.
  - **Sage Ladle** (`kit.npc`, id `sage-ladle`, name 'Sage Ladle', at the pass on the kitchen side, look: wide, white
    apron colours, a sage-green hat; `line`: one quiet line, e.g. "Apron's on the hook. Tickets are on the rail.").
  - **Fence-Post Frank** (`kit.npc`, id `diner-frank`, `sit: true` on a stool beyond the hatch, line "Is it hot? Make it
    hot. I'll wait. I always wait.").
  - Spot `chef-work` at the pass, prompt 'Work a shift (chef)', run: `window.dispatchEvent(new
    CustomEvent(CHEF_START_EVENT))`.
  - Signs (`kit.sign`, dry jokes): the menu board ("TODAY: SOUP. TOMORROW: ALSO SOUP"), "GRUB-FREE KITCHEN (DO NOT
    ASK)", "STAFF MUST WASH HATS", a shift rota with only "SAGE" in every slot, "THE BELL IS NOT A TOY - FRANK".
  - **Three vignettes (props telling a story without text):** (1) the washing-up mountain: a stack of plates and
    pots by the sink with one rubber glove on top and a stool pulled up to reach it; (2) Frank's corner: his own mug
    on a hook with a "FRANK" tag, a stack of folded newspapers and one half-eaten pie on the counter beside him;
    (3) the burnt-toast shrine: a scorched toastie on a plate under the heat lamp with a "NEVER AGAIN" sign and a
    fire blanket half pulled out. Use existing prefabs (`plate`, `mug`, `newspaper`, `bread-loaf`... check with
    `grep -rn "id: '<name>'" packages/prefabs/src/catalog`) plus the diner ones; `kit.block` only for architecture.
  - A `kit.window` on the west wall (the road), the room lit warm.
- Nothing else: the chef runtime (another issue) listens for `CHEF_START_EVENT`.

## Contract
Interior id `acorn-diner-kitchen` (from `CHEF_KITCHEN_ID`), spot dispatches `CHEF_START_EVENT` with no detail. Local
positions are yours to choose; keep the room >= 10 x 8 m.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` has no errors in `workplaces/chef/kitchen.ts`.
- `cd games/gnome-theft-auto && npx vitest run src/interiors` passes (the registry tests check every defined interior).
- With the dev server on 5341: `bash tools/smoke.sh "http://localhost:5341/?offline&no-intro&interior=acorn-diner-kitchen" gta-gnomlet`
  reports no console errors; and `node tools/gta-shots.mjs "http://localhost:5341/?offline&no-intro&interior=acorn-diner-kitchen" C:/Users/cpsai/AppData/Local/Temp/e24-kitchen in:0,0,0`
  (look at the PNG with your Read tool) shows the furnished room. Also a shot of the outside door:
  `node tools/gta-shots.mjs "http://localhost:5341/?offline&no-intro" C:/Users/cpsai/AppData/Local/Temp/e24-kitchen door:4,252,1.57`.
  Stop the server.

## Out of scope
Every other file (the prefabs file `packages/prefabs/src/catalog/gta-diner.ts` is another worker's; do not edit it).
