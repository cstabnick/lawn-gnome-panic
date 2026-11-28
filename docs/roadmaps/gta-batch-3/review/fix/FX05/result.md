# FX05 result: quest-scoped stage sets, scene weather and key-frame light

Branch `fix/FX05`. Plan: [roadmap.md](roadmap.md) (lead foundation, 9 worker issues in one parallel wave, lead pass).
Shots (local, git-ignored) under `docs/roadmaps/gta-batch-3/review/shots/FX05/` (`lead/` = the lead's re-shoots,
`I1/`..`I9/` = the workers'), dev server on port 5505. Scene frames are named `<scene-id>-<scene seconds>.png`.

| Finding | Status | What landed | Evidence |
|---|---|---|---|
| G1#1 (must, D3) HOA cell and café table in the tunnel lanes | fixed | Story sets are quest-scoped (GR3, `stageSets.ts`): hidden and not solid outside their quest's window, shown while it is active or one of its scenes plays. The #62 pen moved onto the west sidewalk (x 111.15..114.9) in front of a permanent beige door "HOA HOLDING (WAIT HERE)" with a speaker (`city/megaBlock.ts buildHoaLockupDoor`, built after the world so the golden layout stays pinned); the lockup-row is gone. #21's kerb table moved to the roof (D5). Road-overlap test: no solid story prop on a carriageway unless `overRoad` and quest-scoped; the other offenders were moved (diner counter 1.6 m, heist rails 3 m, Wally's caravan 1.4 m, the Reeve's barn 12 m north across the highway). | `tunnel-door.png`, `dpot-tunnel.png` (lanes clear), `n-tunnel-sets.png` (`?stagesets=all`: pen on the sidewalk); `stageSets.test.ts` (window test for s62, road test) |
| G1#21 (must, D3) lockup-row coplanar with the façade | fixed | The lockup-row is gone; the door stands 0.15 m proud of x 111. zfight at the door shows no pair with `towers-facade`. The forecourt paving (6.25, -80.25) and Kilnside park patches are not story sets: carried over to their owners (could). | `npm run zfight` at `?stagesets=all&at=117,-96,-1.571` |
| G10#3 (must, D49) #14 sincere beat behind the player's hat | fixed | Outro at `sky: 'golden'`; Pip's close-ups shot from the court side; Old Burdock (court/life.ts regular who sits on the same bench, the "hat" in the editor's frame) and the court's ambient Swish are hidden while the #14 scenes play (`SceneScript.hideWorld`); two court lamps come on at 24.4 / 25.2 s (`keyLights`, `from`); the last shot reframed from in front of the bench. | `lead/drainpipe-court-outro-15.5.png`, `lead/phone-drainpipe-court-outro-15.5.png`, `lead/drainpipe-court-outro-28.5.png` |
| G10#6 (must key / should set, D5) no penthouse | fixed (set); key is FX08's | #21's tour and both outros play on a beige roof garden on the Double Pot slab (new prefabs `beige-garden-table`, `-chair`, `-planter`; lantern key light). The key choice stays in the tunnel: choice rings are drawn and triggered on the ground in x/z only, so roof points would put the rings on the tunnel floor under the slab; recorded in R-238. | `lead/m21-penthouse-viewing-mid-31.png`, `I2/mid-phone-22.png`, `I2/mid-rain-22.png` |
| G10#25 (must, D49) act I last image four gnomes in the rain | fixed | Scene weather (GR6): world scenes play clear unless their bed is rain/storm (snow under snow); `weather: 'world'` opts out; the old forced weather comes back after. `founders-boot-outro`: 10 extras on the arena floor before the tiers, cheering on the snip, bunting over the ribbon. #34 already had bunting and a table; it plays dry (no extras added). | `lead/founders-boot-outro-2.png` (with `?weather=rain`: dry, crowd, bunting) |
| G11#16 (must, D49) night scenes too dark | fixed | Default camera-side face fill in night/golden world scenes (`faceFill`), and `keyLights` on the scenes' own lamps: #50 candelabra, lamp posts, a card light for the Countess; #44 the Queen's two lanterns; #39 crate lamp + a campfire at the drain mouth. | `lead/m50-trellisdown-tasting-mid-8.png` (Countess card lit), `-24.png`, `lead/m44-the-bathtub-queen-outro-33.png` (Samphire lit), `lead/m39-couch-surfing-outro-30.png` |
| G11#17 (must) Test Cut empty frames, toy deck | fixed (blades do not turn) | Root cause: most m52 cameras passed `up(x, y, z)` to a helper that takes `(x, z, h)`, putting lenses hundreds of metres up. Fixed throughout; deck 24 m, Combine 42 m; low crane reveal over the hedge; p3 outro has Pip in front of the deck; the broadcast's date line is now on Tansy's face turned to the horn. The deck's blades do not spin (no prop spin in scripts; carried, could). | `lead/m52-the-test-cut-p2-intro-14.png`, `lead/m52-the-test-cut-outro-13.5.png`, `I8/m52-the-test-cut-p3-outro-21.png` |
| G11#18 (must, D49) backs of heads | fixed | GR6 key-frame check (`pacing.ts keyFrameFaults`): close lines and intro cards within 60 deg of the speaker's facing, at most 40 deg from above, nobody between camera and face or at the lens. Enforced on every scene of the files FX05 owns (`KEY_FRAME_STRICT`), reported for all others. m41 Ragwort, m43 Driftwood (three-quarter, 55 deg), m46 Wally's card at eye level, m52 Basil/Thrift (tool off his face). | `I7/m41-pinwheel-ridge-outro-5.png`, `I7/phone/m43-saltbucket-boardwalk-outro-8.png`, `I7/phone/m46-starfall-at-the-anthill-outro-6.png`; `npm run cutscene-report` |
| G12#10 (must, D49) All Hats count in the dark and rain | fixed | Flickering firelight `keyLights` on the campfire, lantern posts and table lamp in the p4 scenes and outro; pinned clear; re-blocked so nobody stands in front of the speaker. | `lead/all-hats-outro-11.png` (Tansy firelit), `lead/all-hats-outro-32.png` (dry, fire glow) |

Counts: 9 fixed (G10#6's key and G11#17's turning blades are outside / carried), 0 partly, 0 carried over.

## Contracts provided

- `StageSet` window (stageSets.ts): `stageWindows(QUESTS)`, `windowOpen`, `buildStageSets(scene, boxes, quests, { all })`
  returning `{ bind(journal), scene(id), update(dt), shown() }`; `SetProp.always` (part of the place, stays: Wally's
  caravan, the Reeve's barn yard, the HOA lost-property desk), `SetProp.overRoad`, `Stage.setStays`; `?stagesets=all`.
  `setPropBox`: a prop lifted onto a deck whose solid height is below its lift gets no box (it would wall off the road).
- `SceneScript.weather` (default clear, `'world'` keeps the schedule), `keyLights: SceneKeyLight[]`, `faceFill`,
  `hideWorld: string[]` (world objects hidden while the scene plays). Director hooks `setWeather`, `night`, `onScene`.
- `cutscene/pacing.ts keyFrameFaults` + `KEY_FRAME`; `pacing.test.ts KEY_FRAME_STRICT` (act epics add their scenes as
  they re-shoot them; 65 other scenes are reported with key-frame faults today).
- `scenes.test.ts` builds the rooftops (roof scenes stand on them).

## Known gaps / hand-offs

- Duplicate cast at Drainpipe Court is solved for #14 by `hideWorld`; any other scene staged where an ambient double
  of its cast lives can use the same field.
- Choice objectives have no height: a choice on a roof is impossible today (#21's stays in the tunnel). Could: a `y` on
  choice options.
- The Reeve's barn now stands north of the east highway with its hay yard across the road (R-238); the m58 scenes'
  cameras still frame the yard and were not re-shot. The #13 diner counter moved 1.6 m; the m13/m54 scenes were not
  re-shot (their tests pass).
- The `hat-rail` prefab z-fights with itself (rail vs post, s61); prefab owners.
- `m39` culvert reads cool-grey (lit, readable); the fire is not in the key frames.
- Perf: no density increase in the world (story sets are now hidden outside their window; scene extras exist only in
  their scene), so `gta-perf` was not run. Face fill / key lights add up to ~4 point lights only while a scene plays.

## Lore

R-238 (next free on this branch): the lockup door, #62's holding yard on the pavement, #21's roof garden, the Reeve's
barn position. Entries updated: `hoa-lockup`, `pebblewick-hay-barn`, `the-double-pot`. `npm run lore`: OK.

## Checks

- `npm run build -w games/gnome-theft-auto`: pass. `npx vitest run` (game): 520 files, 5435 tests pass.
- `npm test -w packages/prefabs`: pass (4106). `npm run lore`: OK. `npm run cutscene-report`: 355 pass.
- `npm run quest-sim:suites`: pass (after the foundation; sets windowed).
- `bash tools/smoke.sh "http://localhost:5505/?cutscene=drainpipe-court-outro" gta-gnomlet`: SMOKE OK.
- `npm run zfight` at the tunnel door with `?stagesets=all`: no pair with the façade, the door or the pen beyond a
  fence-foot "buried beyond 78 m"; the 51 other pairs are pre-existing world pairs.
- Phone (390x844): `lead/phone-drainpipe-court-outro-15.5.png`, `I2/mid-phone-*.png`, `I7/phone/*`, `I8/*phone*`,
  `I9/rain-mobile/*`.
