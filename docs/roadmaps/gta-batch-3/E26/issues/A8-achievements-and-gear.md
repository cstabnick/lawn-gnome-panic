Epic: A (foundations) — E26 street racing
Depends on: none
Agent: haiku-worker

(Paste `_env.md` here.)

## Goal
Six street-racing achievements in the shared catalog, each rewarding a new wearable gear prefab that fits the gnome.

## Read first
- `packages/prefabs/src/catalog/gta-dirt-rally-gear.ts`: the exact PrefabDef style for wearable rewards (uses
  `wear-head` / `wear-neck` / `wear-back` / `wear-hand`... check `packages/prefabs/src/types.ts` for the `uses` values
  and the `wear` field; parts `s: 'box' | 'ball' | 'cyl' | 'ring' ...`, colour names `c`).
- `packages/prefabs/src/catalog/index.ts`: how a catalog file is imported (line ~165) and spread (line ~229).
- `packages/achievements/src/catalog.ts`: entries around `gta-dirt-champion` (id, game, gameTitle, title,
  description, reward { slot, prefabId, label }, `target` for counting achievements).
- `docs/roadmaps/gta-batch-3/E14/` is NOT needed. `packages/prefabs/README.md` and `packages/achievements/README.md`
  if anything is unclear.

## Change
- `packages/prefabs/src/catalog/gta-street-race-gear.ts` (new): `export const GTA_STREET_RACE_GEAR: readonly
  PrefabDef[]` with six rewards, plain colours, 5 examine lines each (one saying, one tip, one joke, gnome-sized,
  dry tone), tags include 'reward' and 'street-race':
  - `street-flag-bandana` "Chequered Bandana" (wear-neck): black-and-white chequer knotted at the throat.
  - `skyway-night-goggles` "Skyway Night Goggles" (wear-head): goggles with amber lenses on a strap round the hat brim.
  - `kerb-king-cape` "Kerb King's Cape" (wear-back): short chequered cape with a tiny crown sewn on.
  - `bookie-chalk-slate` "Bookie's Slate" (hand): a small slate with chalk odds (use the same `uses` value other
    hand-slot rewards use: grep the catalog for a reward with slot 'hand' in packages/achievements/src/catalog.ts and
    copy its prefab's `uses`).
  - `stopwatch-cap` "Stopwatch Cap" (wear-head): a flat cap with a stopwatch on the front.
  - `lap-of-honour-laurel` "Lap of Honour Laurel" (wear-neck): a leafy laurel ring worn round the neck.
  Register the file in `catalog/index.ts` (import + spread next to GTA_DIRT_RALLY_GEAR).
- `packages/achievements/src/catalog.ts`: add after the E14 dirt entries, game 'gnome-theft-auto', gameTitle
  'Gnome Theft Auto':
  - `gta-street-first` "Kerb Appeal": "Finish on the podium in your first street race on Kerb Row." → neck
    street-flag-bandana, label 'Chequered Bandana'.
  - `gta-street-night` "Midnight Oil": "Win the Skyway Sprint after dark." → head skyway-night-goggles.
  - `gta-street-champion` "King of the Kerb": "Win the Ring Road Run and end the street-racing season." → back
    kerb-king-cape.
  - `gta-street-wager` "Acorns on the Line": "Win 300 Acorns from the street-race bookies." `target: 300` → hand
    bookie-chalk-slate.
  - `gta-time-trial` "Against the Clock": "Set a time-trial time on all five street routes." `target: 5` → head
    stopwatch-cap.
  - `gta-online-race` "Lap of Honour": "Win an online race against another player." → neck lap-of-honour-laurel.

## Done when
- `npm test -w packages/prefabs`, `npm test -w packages/achievements` and `npm test -w packages/gnome` (gear fit) pass
  (repo root). Fix a prefab's parts/`wear` offsets if the gnome fit test complains.

## Out of scope
Anything under `games/`.
