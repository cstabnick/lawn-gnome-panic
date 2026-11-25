Epic: E17 wave 2 (living parts)
Depends on: B1 (the Roost rooftop is registered by buildUnderspan; done)

## Environment
Read `docs/roadmaps/gta-batch-3/E17/_common.md` first (helpers; who the Underspanners are).

## Goal
The Underspan is alive: Hogweed Sprocket and four Underspanners doing specific inventor things, welding crackle and the
pedal generator's whirr, and the Roost works: arriving on it (via the Updraft) is counted, and a Chute slides the player
back down.

## Read first
- `games/gnome-theft-auto/src/societies/config.ts` (`UNDERSPAN`, `SOCIETY_CAST`, `SOCIETY_EVENTS`, `SocietyDeps`,
  `SocietyPart`, `SOCIETY_INTERIORS`)
- `games/gnome-theft-auto/src/campus/life.ts` lines 1-120 and 185-230 (ambient idlers with `createAmbientGnomes`, sounds,
  sleeping when far)
- `games/gnome-theft-auto/src/interactables.ts` lines 60-90 (`addInteractSpot({ x, z, y?, prompt, run(player, deps) })`)
- `docs/design/gnome-theft-auto/characters.md` section "Hogweed Sprocket" (look and voice)
- `games/gnome-theft-auto/src/societies/underspan/life.ts` (yours: the stub)

## Change
- `games/gnome-theft-auto/src/societies/underspan/life.ts`: `installUnderspanLife(deps)` returns a `SocietyPart`.
  - People (`createAmbientGnomes(deps.scene, defs)`, update with the player position every frame, skip when the player
    is more than 250 m away): Hogweed at `UNDERSPAN.hogweed` (look: hat 0x6b4a2e with goggles feel, shirt 0x8a5a3a
    leather apron, beard 0xd2691e singed ginger, glasses true; idle 'think'; bubble in his breathless voice, e.g. "It
    works! Probably! Stand over there. Further."); Teasel Gimbal is inside the workshop (skip); Burdock Flywheel at the
    pedal generator (idle 'tap-foot'; "If I stop pedalling the kettle goes cold and so does the revolution."); Nettle
    Rivet in a hammock under the Roost (idle 'sleep'; "Upside down is just right side up with better ideas."); Vetch is
    inside (skip); add two more Underspanners with your own names-free roles ("an Underspanner"): one chalking a formula
    on a scaffold leg (idle 'read'; "Lift equals hose times umbrella over permit. The permit is zero. So: infinite
    lift."), one sweeping citations into a pile (idle 'sweep'; "We file them by colour. Pink ones are the angry ones.").
  - Sounds: while the player is within 60 m of the site, every 6-10 s `playAt('weld-crackle', <shed>)`, every 9-14 s
    `playAt('pedal-whirr', <generator ~ (568, -24)>)`.
  - The Roost: each frame, when `currentInterior()` is null and the player (`deps.player.x/y/z`) is inside
    `UNDERSPAN.roost` (x/z) with `y >= UNDERSPAN.roostY - 0.6`, and was not on it the frame before: count an arrival:
    `updateSocietySave((s) => { s.updraftRides++; })`, dispatch `new CustomEvent(SOCIETY_EVENTS.updraft)` on `window`
    (guard), `deps.hud.toast('The Roost. Unauthorised verticality achieved.')`.
  - The Chute: `addInteractSpot({ x: UNDERSPAN.chuteTop.x, z: UNDERSPAN.chuteTop.z, y: UNDERSPAN.roostY, prompt: 'Slide
    down the Chute', run: () => { deps.teleport(UNDERSPAN.chuteBottom.x, UNDERSPAN.chuteBottom.z, UNDERSPAN.chuteBottom.yaw);
    deps.play?.(...) or playAt('metal-clang', ...); return true; } })`.
  - Home: `registerHome({ ...homeOf('hogweed')!, door: [UNDERSPAN.workshopDoor.x, UNDERSPAN.workshopDoor.z,
    UNDERSPAN.workshopDoor.yaw], interiorId: SOCIETY_INTERIORS.workshop })` (from '../../homes/data'; guard undefined).
- `games/gnome-theft-auto/src/societies/underspan/life.test.ts` (new): pure part: export a helper
  `onRoost(x: number, y: number, z: number): boolean` from life.ts and test it (inside/outside the rect, too low).

## Contract
`installUnderspanLife(deps): SocietyPart` keeps its signature; the event `SOCIETY_EVENTS.updraft`; save field
`updraftRides`.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/societies/underspan/life.test.ts` passes.
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in your files.

## Out of scope
Every other file.
