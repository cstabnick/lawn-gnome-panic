Epic: 1, traffic pass
Depends on: none

## Environment
Read `docs/roadmaps/gta-traffic-pass/_env.md` first (working directory, node path, rules: no install, no commit, no dev server,
other workers editing other files). Then read `docs/roadmaps/prefab-library/_common.md` for the prefab format and modelling
rules, BUT ignore its "Environment" section (paths there are for another worktree) and its "Examine voice" section: these are
Gnome Theft Auto prefabs, so use the Turfton voice described below.

## Goal
Four slow, impractical garden-scale vehicles for Gnome Theft Auto's traffic ("odd rides"), plus the cosmetic cap that the
"Sunday Driver" achievement (drive all four) rewards, and that achievement's catalog entry.

## Read first
- `packages/prefabs/src/types.ts`: `PrefabDef`, `Part`, `DamageStage`, pivots, `seat`.
- `packages/prefabs/src/catalog/gta-story.ts` lines 270-310: the Mulch-Spreader Mower, a finished GTA vehicle prefab
  (pivots `wheel-0`..`wheel-3`, `seat`, parts with `group: 'wheel-N'`, the Turfton examine voice). Copy its style.
- `packages/prefabs/src/catalog/damage-stages.ts` lines 1-45: damage stage helpers (smoke, scorch, dent) and `RIDE_ON_DAMAGE`.
- `packages/prefabs/src/catalog/gnome-theft-auto.ts` lines 268-292: `cabbie-cap`, a GTA head cosmetic (`wear-head`). Copy its scale.
- `packages/prefabs/src/catalog/index.ts`: how catalog files are imported and spread into `CATALOG`.
- `packages/achievements/src/catalog.ts` lines 715-724 (`gta-captain-clay`): a GTA achievement with a reward.

## How the game uses a vehicle prefab
The game builds it with `buildPrefab(id, { scale })`, nose facing +z. Pivots named `wheel-0`, `wheel-1` (rear, spin only) and
`wheel-2`, `wheel-3` (front, spin about x and steer about y) are animated; `steer` (a steering wheel or tiller) turns with
steering. Every part of a wheel belongs to that wheel's `group`, and the pivot point is the wheel's centre. A wheel lying across
the vehicle is a `cyl` with `rot: [0, 0, 90]`. The rider sits on `seat` (top of the seat, prefab units). Use `c: 'tint'` (and
set `tint`) for the main paint; traffic recolours it.

## Change
Create `packages/prefabs/src/catalog/gta-odd-rides.ts` exporting `export const GTA_ODD_RIDES: readonly PrefabDef[]` with these
five prefabs (ids, seats and wheel pivots are a contract with the game's config: use them exactly). Each vehicle: category
`'prop'`, uses `['place', 'sit']`, tags including `'vehicle'` and the nouns in its name, `emoji: []`, `about` starting
"Gnome Theft Auto: the <Name>.", 5 examine lines, 12-35 parts, standing on y = 0, centred, nose +z, and `damage` with two stages
('dented', 'wrecked') following "Damage stages" in _common.md (name the parts you morph with `name: '...'` on the part, or use a
group; read types.ts for how stages reference parts).

1. `gta-pot-rod`, name 'Pot Rod': a terracotta flowerpot hot rod. A wooden plank chassis (~0.62 wide, 1.0 long) on four small
   wheels (radius 0.1); a squat terracotta pot (colour 0xc2643a, tapered `cyl`, top radius ~0.36, bottom ~0.28, height ~0.36)
   sits on the chassis with the gnome inside it; a darker clay lip ring round the rim; hand-painted flame stripes on the pot
   (thin boxes, `c: 'tint'`, tint 0xf2a12e); a tiny chrome exhaust pipe sticking out the back; a small steering wheel (`steer`)
   in front of the seat. Wheel pivots: `wheel-0` [-0.33, 0.1, -0.35], `wheel-1` [0.33, 0.1, -0.35], `wheel-2` [-0.33, 0.1, 0.35],
   `wheel-3` [0.33, 0.1, 0.35]. `seat: [0, 0.26, -0.05]`.
2. `gta-lawn-roller`, name 'Lawn Roller': a garden roller turned into a little steamroller. A big steel drum across the front
   (`cyl` radius 0.28, length 0.9 along x) as group `wheel-2` with pivot `wheel-2` [0, 0.28, 0.42] (no `wheel-3`); two small rear
   wheels radius 0.12, `wheel-0` [-0.32, 0.12, -0.4], `wheel-1` [0.32, 0.12, -0.4]; an iron frame joining them; a boxy engine
   housing (`c: 'tint'`, tint 0x2f6b3a) with a tall black chimney stack and a brass band; a bench seat behind it with
   `seat: [0, 0.47, -0.3]`; a tiller bar (`steer`) in front of the seat.
3. `gta-teacup-trundler`, name 'Teacup Trundler': an oversized porcelain teacup on a saucer, on four tiny casters. Saucer: wide
   flat `cyl` (radius ~0.5, height ~0.05) on the casters; cup: tapered `cyl` (top ~0.42, bottom ~0.32, height ~0.4) in `'tint'`
   (tint 0xf3efe6) with a gold rim ring (`trim: 'gold'`, `c: 'trim'`) and a ring handle on its +x side; a little brass steering
   wheel (`steer`) inside, in front of the seat. Casters are small balls/short cylinders radius 0.04: `wheel-0` [-0.3, 0.04, -0.3],
   `wheel-1` [0.3, 0.04, -0.3], `wheel-2` [-0.3, 0.04, 0.3], `wheel-3` [0.3, 0.04, 0.3]. `seat: [0, 0.2, 0]`.
4. `gta-barrow-buggy`, name 'Barrow Buggy': a motorised wheelbarrow. A deep tray (`c: 'tint'`, tint 0x3f7fbf, built from a
   floor and four sloped side boxes) with a plank seat across it (`seat: [0, 0.32, -0.1]`); one big front wheel radius 0.18 as
   group `wheel-2`, pivot `wheel-2` [0, 0.18, 0.55]; two salvaged pram wheels at the back, radius 0.12, `wheel-0` [-0.3, 0.12, -0.35],
   `wheel-1` [0.3, 0.12, -0.35] (thin spoked look: a tyre ring + a hub); two long wooden handles running out the back; a small
   two-stroke engine box with a pull-cord ball mounted just behind the front wheel.
5. `sunday-driver-cap`, name "Sunday Driver's Cap": category `'armor'`, uses `['wear-head']`, a tweed flat cap (crown + short
   peak, `c: 'tint'`, tint 0x8a7a5c) with a pair of small round driving goggles pushed up on the front, same size as the
   cabbie-cap. 5 examine lines.

Turfton examine voice (Gnome Theft Auto): a satirical modern garden city of fired-clay gnomes. Mowers and ride-ons are
ordinary traffic; there are brands (Buck-Iron, Razor-Back), the HOA and its Code-Enforcement vans, the Hat Watch police, the
Compost Heap, Patio Heights, Clay-Mart, Side-Valve Salvage, Pay 'n' Glaze. Lines mix: what it looks like, a local saying, a
practical tip, one dry joke, an odd small detail. Plain short sentences, 9-160 characters each, all different. Make each odd
ride's lines say it is slow or impractical (the Lawn Roller tops out at walking pace; the Teacup Trundler spins in its own
length; the Barrow Buggy is Pip Potsworth's old idea; the Pot Rod is all flames and no speed). Do not invent new named people.

Register it in `packages/prefabs/src/catalog/index.ts`: add `import { GTA_ODD_RIDES } from './gta-odd-rides';` after the last
import, and a new line `  ...GTA_ODD_RIDES,` directly before the closing `];` of `CATALOG`. Touch nothing else there.

Add the achievement to `packages/achievements/src/catalog.ts`, directly after the `gta-captain-clay` entry:
```ts
  {
    id: 'gta-sunday-driver', game: 'gnome-theft-auto', gameTitle: 'Gnome Theft Auto',
    title: 'Sunday Driver',
    description: 'Drive every odd ride: the Pot Rod, Lawn Roller, Teacup Trundler and Barrow Buggy.',
    target: 4,
    reward: { slot: 'head', prefabId: 'sunday-driver-cap', label: "Sunday Driver's Cap" },
  },
```

## Done when
- `npm test -w packages/prefabs` passes (every test naming your ids; fix lowest points per _common.md if "stands on the ground" fails)
- `npm test -w packages/achievements` passes
- `npx tsc --noEmit -p packages/prefabs` has no errors in your file

## Out of scope
Every other prefab catalog file, types.ts, build.ts, anything under `games/`.
