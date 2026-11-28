Epic: E12-A (winter sports, parallel wave)
Depends on: none
Agent: haiku-worker

Read `docs/roadmaps/gta-batch-3/E12/issues/_env.md` first (environment, rules).

## Goal
L38 "make sure we do have polar bears and they are really chill": four more polar bears on Snowcap Rise, each visibly
chilling in its own way (asleep on Pail Pond's ice, turning slowly in an inner tube on the ice, fishing a hole from a
stool, holding a mug on the Woolly Sock Lodge's bench), a "BEAR DECK" sign at the Frostbite Fells sun deck, and the bear's
call becomes a slow contented yawn instead of a growl. The five deck bears in `critters/fells.ts` stay exactly as they are.

## Read first
- `games/gnome-theft-auto/src/winter/types.ts`: `SNOWCAP_BEARS` (id, x, z, yaw, pose), `BEAR_DECK`.
- `games/gnome-theft-auto/src/critters/snowcap.ts`: the stub `snowcapLife` (already registered in `critters/index.ts`).
- `games/gnome-theft-auto/src/critters/fells.ts`: the deck bears (init section 3 near line 185: `critterMesh`,
  `rt.spawn('polar-bear', x, z, { region, group, mode: 'script', yaw })`; the update loop that sets `c.y` and animates
  `arm-0`, `arm-1`, `head` for a shrug; `onHit` with throttled `BEAR_SHRUGS` toasts). `BEAR_SHRUGS` is exported: reuse it.
- `games/gnome-theft-auto/src/critters/fells.test.ts`: how to build a test runtime with `createCritters(scene, world,
  deps, [life])`.
- `games/gnome-theft-auto/src/homes/pieces.ts`: `textPlate(text, x, y, z, yaw, { w, h, bg, fg })` for a sign.
- `games/gnome-theft-auto/src/sound/recipes/critters.ts` (the `bear` recipe near line 75 and the helpers it uses).

## Change
- `src/critters/snowcap.ts`: `snowcapLife: RegionLife` with `id: 'snowcap'`, `groups: []`.
  - `init(rt)`: for each `SNOWCAP_BEARS` spot spawn `rt.spawn('polar-bear', x, z, { region: 'north-highlands', group:
    'snowcap-bears', mode: 'script', yaw })` and add its props (built with `critterMesh(prefabId, scale)` and added to
    `rt.scene`, placed at `heightAt`):
    - 'nap': the bear lies on its side on the ice (tilt the critter's object: `rotation.z` about 1.4, lowered so it rests
      on the ice; set it each frame in update since the runtime may reset the transform: check how the runtime applies
      `c.y` / `c.yaw` and work with it), a slow breathing scale bob (1 ± 0.03 on y, 0.25 Hz).
    - 'tube': a `tow-tube` prefab under the bear (bear raised ~0.3 into it); bear and tube turn slowly together (yaw +=
      0.15 rad/s).
    - 'fish': a `stool` under it (bear raised to sit on it), a `fishing-rod` prop leaning from its paw over a small dark
      hole disc on the ice in front (a `THREE.CircleGeometry(0.45)` mesh laid flat with
      `flatLayer(material, LAYER.marking)` from `@lawn/depth`, 0.02 above the ice); a tiny periodic jig of the head.
    - 'mug': a `bench` behind it (bear sits on the bench), a `cocoa-mug` prop held at paw height (if `getPrefab` lacks
      it, `critterMesh` shows a placeholder: that is fine); slow sip every 8 s (head tilts back 0.3 rad for 1 s).
  - `update(rt, ctx)`: keep each bear in its pose; skip work for bears more than 200 m from the player.
  - `onHit(rt, c)`: only for this life's bears (check `c.data.group` or keep a Set of them; return false for others):
    a shrug like fells.ts (arms up, head tilt, `BEAR_SHRUG_S` 1.6 s) and a throttled toast from `BEAR_SHRUGS` (8 s gap),
    return true. Nothing ever knocks them down or moves them.
  - Bear Deck sign (in `init`): a `signpost` prefab at (`BEAR_DECK.x`, `BEAR_DECK.z + 9`) and a `textPlate('BEAR DECK\n
    Please do not wake the bears.\nThey are not asleep.', ...)` on it facing south (yaw 0), about 1.2 x 0.6, at sign height;
    a second small plate on the same post: 'SUNSCREEN: FACTOR 50. ATTITUDE: FACTOR 100.' Place both 0.04 in front of the
    post. Region of the sign: Frostbite Fells (the scene is shared, so just add it to `rt.scene`).
- `src/sound/recipes/critters.ts`: rewrite the `bear` recipe as a slow contented yawn: about 1.4 s, a soft voiced tone
  that rises a little then glides down an octave (start ~110 Hz * p, peak ~140, end ~60), lower loudness than now (about
  0.18 instead of 0.3), a breathy noise tail (the existing `burst` helper with a lowpass), no harsh sawtooth growl (use
  'triangle' or 'sine' through `voiced`). Keep the id 'bear' and the recipe signature.
- New `src/critters/snowcap.test.ts`: `createCritters(new THREE.Scene(), world, deps, [snowcapLife])` spawns exactly 4
  polar bears at the `SNOWCAP_BEARS` spots (within 0.5 m), all in mode 'script'; a shot (`rt.hitTest(b.x, b.y + 1, b.z)`
  or `onHit`) leaves the bear in place, still 'script', and toasts a `BEAR_SHRUGS` line; 40 updates with a fast vehicle
  driven onto the tube bear never move it off its spot or put it 'down'. Also run `src/critters/fells.test.ts` (must stay
  green: "spawns five polar bears") and `src/sound/watchLife.test.ts`.

## Contract
`snowcapLife` exported from `critters/snowcap.ts` (id 'snowcap'). The 4 bears are ordinary `'polar-bear'` critters (the
winter runtime counts every polar bear in `critters.list` for Bear Hug).

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/critters src/sound` passes.
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in your files.

## Out of scope
`critters/fells.ts` (except reading it), `critters/index.ts` (done), every `winter/` file.
