Epic: E18-B (world-change dressing)
Depends on: none

## Environment
Read `docs/roadmaps/gta-batch-3/E18/issues/_env.md` and `D-dressing-common.md` (same folder) first: they hold the API,
the prefab and placement rules and the test you add.

## Goal
Build the props for world changes W03, W04 in `games/gnome-theft-auto/src/worldChanges/rows/greenAndBarn.ts` (currently a
stub registering empty groups), following `docs/design/gnome-theft-auto/world-changes.md` rows W03, W04.

## Change (only `src/worldChanges/rows/greenAndBarn.ts` and the new `src/worldChanges/rows/greenAndBarn.test.ts`)
- W03 (Founders' Green opens): on the downtown park blocks (Gnorwin Statue Park (-30,30), (-90,30), (-30,90); grep
  'founders' in src/sites.ts and src/parks/): a cut red ribbon on two posts, about eight gnomes with small flags (prefab
  grep 'flag'), a small bandstand ('bandstand' prefab if one exists, else a gazebo) with a brass trio (three gnomes),
  a green banner "FOUNDERS' GREEN: OPEN" over the two repaved streets ('street-banner-pole' / 'bunting-span'). HOA
  "CONDEMNED" signs: grep 'CONDEMNED' / 'condemned' in src; hide them only if they are separate objects (common rules).
  Crowd off the roads. E19's Drainpipe Court and Gutter Bowls are in Founders' Green: keep 5 m away from them.
- W04 (Gnertrude's is open): at Granny's barn in Cloverfield (stage 'granny-barn' in src/quests/stages/cloverfield.ts):
  a few torn foreclosure-notice scraps on bare stakes, a fresh red tin roof (a roof prefab on top of the barn, or a red
  'roof' panel prefab; do not touch the baked barn), a hand-painted board "GNERTRUDE'S: OPEN" on the gate; and at the
  Route South welcome sign (grep 'welcome' / 'Fence-Post Frank' / 'frank' in src) a new sign "PIE, 3 MILES". Keep the
  sprinkler-gauntlet course and the barn interior door clear.

## Done when
- See `D-dressing-common.md`: tsc clean for your file, `npx vitest run src/worldChanges` passes, report coordinates.
