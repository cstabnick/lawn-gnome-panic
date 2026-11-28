Epic: E17 wave 2 (living parts)
Depends on: A2 one-leg idle (done)

## Environment
Read `docs/roadmaps/gta-batch-3/E17/_common.md` first (helpers; who the Flock of the One Leg are).

## Goal
Wader's Rest is alive: Mother Saxifrage and the Flock standing on one leg about their rota (tea, washing, the rota
board, wobble watch), reeds rustling, a solemn-silly hum near the circle, and a Tuesday joke.

## Read first
- `games/gnome-theft-auto/src/societies/config.ts` (`WADERS_REST`, `SOCIETY_CAST`, `SOCIETY_INTERIORS`, `SocietyDeps`,
  `SocietyPart`)
- `games/gnome-theft-auto/src/campus/life.ts` lines 1-120 and 185-230 (ambient idlers, sounds, sleeping when far)
- `docs/design/gnome-theft-auto/characters.md` section "Mother Saxifrage Wader" (voice: slow, sing-song, ends lines
  with "so it is stood") and `docs/lore/entries/apocrypha/flock-of-the-one-leg.md` (the rules)
- `games/gnome-theft-auto/src/societies/flock/life.ts` (yours: the stub)

## Change
- `games/gnome-theft-auto/src/societies/flock/life.ts`: `installFlockLife(deps)` returns a `SocietyPart`.
  - People (`createAmbientGnomes(deps.scene, defs)`, updated with the player position every frame, skipped when the
    player is more than 300 m away). Everyone grey (shirt 0x8d9096, pants 0x6f7378, hat 0x9aa0a8), idle 'one-leg' unless
    said: Mother Saxifrage at `WADERS_REST.saxifrage` (tall pink-free hat: hat 0xb8b8c0; beard 0xd8d8dc long; bubble
    "Stand with me. Not both feet. One is plenty, so it is stood."); Sister Sedge at the tea urn (bubble "A wobble is a
    thought. A thought is a cup. You look thoughtful."); Brother Bulrush at the washing line (idle 'hands-on-hips';
    "Grey, grey, grey, grey... who did this sock?"); Sister Plover at the rota board (idle 'read'; "Tuesday says no
    sitting. Tuesday is very firm."); Brother Godwit by the circle (idle 'stretch'; "I wobbled. Twice. I owe the Flock
    nine cups."); Novice Pipit in the circle (idle 'one-leg'; "Which leg? Either? Which either?"); and 5 more Flock
    members on the circle's ring facing the Lady, idle 'one-leg', bubbles of your own (gentle, absurd rules; never
    mean, no real-world religion).
  - Sounds: while within 80 m, every 7-12 s `playAt('reed-rustle', <random point at the site's edge>)`; while within
    25 m of `WADERS_REST.circle`, every 12-16 s `playAt('flock-hum', circle)`.
  - Tuesday: when the player first comes within 60 m of the centre in a session and the local date is a Tuesday
    (`new Date().getDay() === 2`), toast "It is Tuesday at Wader's Rest. Nobody is sitting. Do not start."
  - Home: `registerHome({ ...homeOf('saxifrage')!, door: [WADERS_REST.tentDoor.x, WADERS_REST.tentDoor.z,
    WADERS_REST.tentDoor.yaw], interiorId: SOCIETY_INTERIORS.tent })` (from '../../homes/data'; guard undefined).
- `games/gnome-theft-auto/src/societies/flock/life.test.ts` (new): export the defs array as `FLOCK_PEOPLE` and test: at
  least 10 people, all inside `WADERS_REST.site`, none pink (no look colour with red high and green low like 0xff69b4:
  check `hat` and `shirt` are not in a pink range), none standing within 1.2 m of `WADERS_REST.tentDoor` or the circle
  centre.

## Contract
`installFlockLife(deps): SocietyPart` keeps its signature.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/societies/flock/life.test.ts` passes.
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in your files.

## Out of scope
Every other file (sermon.ts is another worker's).
