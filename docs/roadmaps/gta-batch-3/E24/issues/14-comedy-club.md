Epic: E24-2 (workplace jobs, parallel build)
Depends on: none (the comedy prefabs are made in parallel: skip missing ones with the `putIf` / `getPrefab` pattern)

## Environment
Read `docs/roadmaps/gta-batch-3/E24/_env.md` first. Environmental-storytelling issue. You may run ONE dev server on
port **5343** only (`cd games/gnome-theft-auto && npx vite --port 5343 --strictPort`, background); stop it after.

## Goal
Le Petit Groan, a comedy cellar club off Pardonlin's Grand Platz: the interior `le-petit-groan` (stage, brick wall,
mic, ten crowd seats with gnomes, the booker) with a "Go on stage" spot, and the street entrance (stairs down, a
chalkboard, a poster column) at a clear spot near the Grand Platz.

## Read first
- `docs/roadmaps/gta-batch-3/E05/contracts.md`: `defineInterior` and the kit.
- `games/gnome-theft-auto/src/pardonlin/interiors.ts`: a finished Pardonlin interior (theme, `putIf`, signs, NPC looks).
- `games/gnome-theft-auto/src/workplaces/comedy/types.ts`: `COMEDY_CLUB_ID`, `COMEDY_START_EVENT`, `CLUB` (size,
  stage, stageSteps, after, seats). Use these constants for positions; do not move them.
- `games/gnome-theft-auto/src/workplaces/comedy/club.ts`: the stub (`buildClubStreet(scene, world)`), imported once by
  `workplaces/index.ts`.
- `games/gnome-theft-auto/src/jobs/visuals.ts` ~l.240-420: placing a prop on clear ground with `findSafeSpot`
  (`lockup/safeSpot.ts`), `boxesBlocked`, `circleClearOfStreets`, `heightAt`, and pushing a collider Box.
- `games/gnome-theft-auto/src/pardonlin/layout.ts` `DISTRICTS` (the Old Town; the Grand Platz shot spot (-1500, -200)).

## Change
- `games/gnome-theft-auto/src/workplaces/comedy/club.ts`:
  - Pick the street entrance spot: a fixed world point near the Grand Platz that is walkable and clear (try candidates
    around (-1488, -186), (-1512, -186), (-1488, -214); verify in the browser with
    `node tools/gta-shots.mjs "http://localhost:5343/?offline&no-intro" C:/Users/cpsai/AppData/Local/Temp/e24-club a:<x>,<z>,<yaw>`
    and the Read tool on the PNG). Export it: `export const CLUB_DOOR = { x, z, yaw }` (yaw = facing out of the stairs).
  - `defineInterior({ id: COMEDY_CLUB_ID, name: 'Le Petit Groan', prompt: 'Go down to Le Petit Groan', door: CLUB_DOOR
    (or a point 1 m in front of the stairs), exit: a point 1.5 m further out, size: CLUB.size, theme: a cellar theme
    (dark brick-red walls, black floor, low warm light), ambience: 'continental', build(kit) {...} })`:
    - The room: stairs-down door on the south wall (the crowd's back), the stage on the north: a low dais `kit.block`
      (0.4 m) under `CLUB.stage`, `groan-brick-backdrop` against the north wall behind it, `groan-mic-stand` just in
      front of `CLUB.stage`, `groan-stage-stool`, `groan-spotlight` above, a `kit.sign('LE PETIT GROAN', ...)` neon-ish
      over the brick wall.
    - The crowd: at each `CLUB.seats[i]` a seated `kit.npc` (`sit: true`, yaw facing the stage (north = Math.PI),
      varied Pardonlin looks: berets, striped shirts, black polo necks), tables `groan-cafe-table-small` between them.
      Seats 0, 3 and 8 get a name and a dry `line` when talked to (e.g. "I am here ironically. Then again, so are you.").
    - Mireille Sans-Rire (`kit.npc`, id `mireille-sans-rire`, by the stage steps, standing, look: severe black and
      grey, line: "You want to perform? Everyone wants to perform. Sit there. No, there. Fine. Go up.").
    - Spot `comedy-stage` at `CLUB.stageSteps`, prompt 'Go on stage (comedian)', run:
      `window.dispatchEvent(new CustomEvent(COMEDY_START_EVENT))`.
    - Signs (dry jokes): "TONIGHT: YOU", "TWO-DRINK MINIMUM. ONE-LAUGH MAXIMUM.", "NO HECKLING BEFORE THE FIRST JOKE",
      "PLEASE DO NOT FEED THE COMEDIANS".
    - Three vignettes: (1) the last act's exit: a `groan-setlist` crumpled on the stage, the stool knocked on its side,
      a dried tomato stain (a flat red disc block lifted 0.012 m) on the brick wall's foot; (2) the empty tip jar on the
      bar with a single button in it (`groan-tip-jar`); (3) the critics' table: one table with three empty cups, a
      notebook and a pen laid out like evidence (existing prefabs, check with grep).
  - `buildClubStreet(scene, world)` (idempotent): place `groan-cellar-entrance` at `CLUB_DOOR` (stairs opening toward
    the door spot), `groan-chalkboard-sign` and `groan-poster-column` beside it (each on clear ground via
    `findSafeSpot`), push colliders for the column and the entrance's stone surround (not over the door spot). Guard
    each with `getPrefab(id)`.
- The comedy runtime (another issue) calls `buildClubStreet` once at install and listens for `COMEDY_START_EVENT`.

## Contract
`COMEDY_CLUB_ID` interior; `export const CLUB_DOOR: { x: number; z: number; yaw: number }`;
`export function buildClubStreet(scene: THREE.Scene, world: World): void`. Use `CLUB` positions from types.ts.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` has no errors in `workplaces/comedy/club.ts`.
- `cd games/gnome-theft-auto && npx vitest run src/interiors` passes.
- Dev server on 5343: `bash tools/smoke.sh "http://localhost:5343/?offline&no-intro&interior=le-petit-groan" gta-gnomlet`
  has no console errors, and `node tools/gta-shots.mjs "http://localhost:5343/?offline&no-intro&interior=le-petit-groan" C:/Users/cpsai/AppData/Local/Temp/e24-club back:0,5,3.14`
  shows the stage and crowd (look at it). Stop the server.

## Out of scope
`comedy/types.ts`, `comedy/runtime.ts`, prefab files, every other file.
