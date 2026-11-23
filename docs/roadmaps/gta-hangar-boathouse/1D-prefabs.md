Epic: 1 Modules (Hangar Two and the Mossbank Boathouse, Gnome Theft Auto)
Depends on: none

## Environment
Repo: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\elkhorn (Windows, Git Bash; use absolute paths). If node/npx is
not found: export PATH="/c/Program Files/nodejs:$PATH". Other workers edit other files of the repo at the same time
(other planners may also be adding prefabs and achievements in OTHER catalog files): touch ONLY the files listed under
Change, and keep your edits to the two shared files (catalog/index.ts, achievements catalog.ts) small and additive. Do
not commit, push, stash, switch branches, run vite build, or start a dev server. Do not edit AGENT_INDEX.md.

## Goal
Five new prefabs for Gnome Theft Auto's buyable garages: the two buildings (`hangar-two`, `boathouse`) and three
achievement rewards (`harbourmaster-cap` head, `windsock-quiver` back, `cork-key-float` neck), plus the three
achievements that award them.

## Read first
- docs/roadmaps/prefab-library/_common.md: the PrefabDef rules (parts, colours from the palette, about/examine, tags).
- packages/prefabs/src/catalog/gta-world.ts: the `hangar` prefab (copy its parts for hangar-two) and `windsock`.
- packages/prefabs/src/catalog/gta-waterworks.ts: `wooden-dock` (a style reference for the boathouse).
- packages/prefabs/src/catalog/gta-lockup.ts: the file to model yours on (two reward prefabs: a neck item and a head item).
- One existing `wear-back` reward prefab, e.g. find `spare-tyre-pack` with grep in packages/prefabs/src/catalog, to copy how back items sit.
- packages/prefabs/src/catalog/index.ts: how GTA_LOCKUP is imported and spread into the list.
- packages/achievements/src/catalog.ts: the `gta-lockup-full` and `gta-special-delivery` entries (copy their shape).
- packages/achievements/README.md and src/achievements.test.ts: reward rules (slot -> use; each reward prefab belongs to exactly one achievement).

## Change
- packages/prefabs/src/catalog/gta-hangar-boathouse.ts (new): `export const GTA_HANGAR_BOATHOUSE: readonly PrefabDef[]` with:
  1. `hangar-two`, name 'Hangar Two', category 'prop', uses ['place'], footprint { r: 12, h: 9 }. The same parts as the
     `hangar` prefab in gta-world.ts EXCEPT the 'dark gap' part (the front stays open: vehicles drive in), plus:
     a rolled-up roller door, a cylinder along x under the lintel (`{ s: 'cyl', d: [0.35, 0.35, 19.4], rot: [0, 0, 90],
     at: [0, 6.0, 6.5], c: 'iron-dark', seg: 10 }`), a big painted "2" panel on the back wall's inside face (two or
     three thin boxes in 'yellow' at z -6.5, about 3 m tall), and a few hazard stripes on the floor edge are NOT allowed
     (flat on the ground: skip them). Origin = floor centre, open side +z, 24 wide (x), 14 deep (z).
     about: one sentence stating size, the open +z front and the rolled-up door. 5 examine lines like the others.
  2. `boathouse`, name 'Mossbank Boathouse', category 'prop', uses ['place'], footprint { r: 8, h: 7 }. Building frame:
     origin = the walkway deck top (y 0) at the centre of the footprint, 10 wide (x -5..5), 16 deep (z -8..8), open on
     +z to the water. Parts (colours from the palette; wood-light / wood / wood-dark / slate / iron-dark / brass / red /
     white are used by neighbours):
     - side walls: box [0.3, 4.5, 16] at [+-4.85, 1.75, 0] (mirror: true), y spans -0.5..4.0;
     - back wall in two pieces leaving a 2.2 m door in the middle: box [3.9, 4.5, 0.3] at [+-3.05, 1.75, -7.85]
       (mirror) and a lintel box [2.2, 1.2, 0.3] at [0, 3.4, -7.85];
     - two walkways: box [1.5, 0.15, 16] at [+-3.95, -0.075, 0] (mirror) (top at y 0);
     - posts under the walkways down into the water: cyl d [0.12, 0.12, 2.5] at [+-3.95, -1.25, z] for z = -7.5, -2.5,
       2.5, 7.5 (mirror);
     - a pitched roof: two boxes [5.8, 0.2, 16.8] rotated about z by +-25 degrees meeting over x 0 at about y 5.4
       (mirror if the rule allows a mirrored rotation; else two parts), and a ridge beam box [0.3, 0.3, 16.8] at the top;
     - a front fascia board over the water opening: box [10, 0.8, 0.2] at [0, 3.7, 7.9] and a name board 'brass' or
       'wood-light' on it;
     - a rolled-up front door: cyl d [0.3, 0.3, 9.2] rot [0, 0, 90] at [0, 3.1, 7.8];
     - a life ring on the +x side wall's outside (ring like wooden-dock's) and an iron bollard on each walkway at +z.
     Nothing in the slip between x -3.2 and 3.2 below y 3 (boats drive in there).
  3. `harbourmaster-cap`, 'Harbourmaster Cap', category 'armor', uses ['wear-head']: a navy peaked cap (a short
     cylinder crown, a flat peak box at the front, a white band) with a small brass anchor-and-propeller badge.
  4. `windsock-quiver`, 'Windsock Quiver', category 'trinket' (or what other back rewards use), uses ['wear-back']: a
     tube worn on the back with an orange-and-white striped windsock poking out of the top, and a strap.
  5. `cork-key-float`, 'Cork Key Float', category 'trinket', uses ['wear-neck']: a cord round the neck with a fat round
     cork float (cyl, 'wood-light' or 'straw') and one brass key hanging below it.
  Rewards: tags include 'reward' and 'gta'; size and offsets like the lock-up items (head items sit like the Sling-Lift
  Headset; neck items start at y 0 like the Lock-Up Key Lanyard). Each `about` begins 'Gnome Theft Auto: the ...'.
- packages/prefabs/src/catalog/index.ts: import `GTA_HANGAR_BOATHOUSE` from './gta-hangar-boathouse' next to the
  GTA_LOCKUP import and spread it right after `...GTA_LOCKUP,` in the same list. Nothing else.
- packages/achievements/src/catalog.ts: right after the `gta-special-delivery` entry add:
  ```ts
  { id: 'gta-landed-gnome', game: 'gnome-theft-auto', gameTitle: 'Gnome Theft Auto', title: 'Landed Gnome',
    description: 'Own both Hangar Two at the Desert Airfield and the Mossbank Boathouse on Loch Moss.',
    reward: { slot: 'head', prefabId: 'harbourmaster-cap', label: 'Harbourmaster Cap' } },
  { id: 'gta-hangar-full', game: 'gnome-theft-auto', gameTitle: 'Gnome Theft Auto', title: 'Full Hangar',
    description: 'Fill all three bays of Hangar Two with aircraft.',
    reward: { slot: 'back', prefabId: 'windsock-quiver', label: 'Windsock Quiver' } },
  { id: 'gta-boathouse-full', game: 'gnome-theft-auto', gameTitle: 'Gnome Theft Auto', title: 'Harbour Full',
    description: 'Fill all three slips of the Mossbank Boathouse with boats.',
    reward: { slot: 'neck', prefabId: 'cork-key-float', label: 'Cork Key Float' } },
  ```

## Contract
Prefab ids (used by game code by string): 'hangar-two', 'boathouse', 'harbourmaster-cap', 'windsock-quiver',
'cork-key-float'. Achievement ids: 'gta-landed-gnome', 'gta-hangar-full', 'gta-boathouse-full'.

## Done when
- `npm test -w packages/prefabs` passes (from the repo root).
- `npm test -w packages/achievements` passes.
- If a failure is clearly in another planner's catalog file (not yours), say so in your report instead of fixing it.

## Out of scope
Every other catalog file, games/*, docs/lore.
