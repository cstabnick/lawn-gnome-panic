Epic: 3 (more parts, nested pivots, suspension, showroom stage)
Depends on: none

## Environment
Read `docs/roadmaps/pay-n-glaze/_common.md` first. You own: `packages/prefabs/src/types.ts` (the `pivots` field and its doc ONLY), `packages/prefabs/src/build.ts`, `packages/prefabs/src/batch.ts`, `packages/prefabs/src/instances.ts`, `packages/prefabs/src/interact.ts`, `packages/prefabs/src/index.ts`, `packages/prefabs/src/pivots.ts` (new), `packages/prefabs/src/pivots.test.ts` (new), `packages/prefabs/README.md` (a short section), and ONLY the lines that read `def.pivots` / `.pivots` in `packages/glaze/src/steer.ts`, `tools/prefab-editor/**` and `games/**` if a type error forces a change (change the minimum; list each file in your report). Another worker is editing other parts of `packages/glaze/src/`; do not touch `attach.ts`, `types.ts` of glaze, `fittings.ts`, `loadout.ts`, `catalog.ts`.

## Goal
Nested (hierarchical) pivots in `@lawn/prefabs`: GitHub issue cstabnick/lawn-gnome-panic#147. A pivot may name a parent pivot, so multi-joint rigs (spring -> knuckle -> wheel; turret yaw -> barrel pitch; door -> latch) are plain prefab data. Everything that exists today keeps working unchanged.

## Read first
- `packages/prefabs/src/types.ts` (`PrefabDef.pivots`, `Part.group`), `packages/prefabs/src/build.ts` (`attachDynamicParts`: how pivot groups are made and parts placed relative to them; `fillPrefab`, `buildPrefab`, `setPrefabDamage`), `packages/prefabs/src/interact.ts` (`getPrefabPart(s)`), `packages/prefabs/src/damage.ts` (`hide`/`morph` by `name` or `group`), `packages/prefabs/src/batch.ts` and `instances.ts` (they also read pivots).
- Issue text: `pivots` entries may be `Vec3` (today) OR `{ at: Vec3; parent?: string }`. `buildPrefab` resolves parents (with cycle and unknown-parent detection), sets each child pivot's LOCAL position to `child.at - parent.at`, parts in a group keep authoring in one prefab-local space (a part's local position is `part.at - its pivot's absolute at`), and `getPrefabPart(root, name)` works through the hierarchy.
- `grep -rn "\.pivots\|pivots:" packages games tools --include=*.ts` to find every reader.

## Change
- `types.ts`: `export type PivotDef = Vec3 | { readonly at: Vec3; readonly parent?: string }`; `pivots?: Readonly<Record<string, PivotDef>>`. Document nesting rules in the doc comment.
- `pivots.ts` (new, exported from `index.ts`): `pivotAt(def: PivotDef): Vec3` (absolute position), `pivotParent(def: PivotDef): string | undefined`, `resolvePivotOrder(pivots): string[]` (parents before children; throws `Error('pivot cycle: a -> b -> a')` on a cycle and `Error("pivot 'x' has unknown parent 'y'")`).
- `build.ts` `attachDynamicParts` (and wherever else a pivot group is created, e.g. batching): create groups in `resolvePivotOrder` order; a group with a parent is added to the PARENT group with local position `child.at - parent.at` (a root-level pivot behaves exactly as now); parts assigned to a group use `offset = absolute at of that group's pivot` as now. A part naming a group that is not in `pivots` still creates a root-level group as today. Do not change any output for prefabs with only `Vec3` pivots (byte-for-byte same node names, positions and order).
- Every other reader of `pivots` uses `pivotAt()` (steer.ts reads `base.pivots?.[pivotName]`; the prefab editor, batch and instances read positions): fix types minimally, behaviour unchanged. In `packages/glaze/src/steer.ts` `registerSteerVariant` must copy a nested pivot's `parent` through when it moves a pivot (the moved pivot keeps its parent; positions stay absolute).
- `setPrefabDamage` and `damage` (`hide`/`morph`/`add` by group): confirm and test that hiding or morphing a group applies to nested child groups too (a part in a child group counts as part of the parent group for `hide`); implement it if it does not already.
- `README.md` (prefabs): a short "Nested pivots" section with the example `pivots: { suspension: [0, 0.3, 0.5], knuckle: { at: [0, 0.3, 0.5], parent: 'suspension' }, 'wheel-2': { at: [0, 0.3, 0.5], parent: 'knuckle' } }` and the rule for spin/steer/travel.
- `pivots.test.ts`: a test prefab def (inline, not added to the catalog) with a three-level chain: the built root has `suspension > knuckle > wheel-2` nesting (`getObjectByName('wheel-2').parent.name === 'knuckle'`), local positions are differences, world positions equal the authored absolute ones, rotating `suspension` moves the world position of the wheel part's mesh (rotation about the pivot), `getPrefabPart` finds the nested one, cycle and unknown parent throw, a flat prefab builds exactly as before (compare node names and positions of `ride-on-mower` against a snapshot taken in the test from `Vec3` pivots), `setPrefabDamage` still rebuilds nested chains (new objects, same shape), damage `hide` of the parent group hides child-group parts.

## Contract
`PivotDef`, `pivotAt`, `pivotParent`, `resolvePivotOrder` exported from `@lawn/prefabs`; `PrefabDef.pivots?: Readonly<Record<string, PivotDef>>`.

## Done when
- `npx tsc --noEmit -p packages/prefabs`, `-p packages/glaze`, `-p games/gnome-theft-auto` pass.
- `npx vitest run packages/prefabs` passes (every existing prefab test still passes; the two pre-existing glaze extras may still be filling in: ignore failures only in `glaze-` ids you did not touch).

## Out of scope
Everything not listed above.
