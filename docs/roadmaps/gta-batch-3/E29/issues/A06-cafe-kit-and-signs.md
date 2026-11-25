Epic: E29-A European kit (all parallel)
Depends on: none

## Environment
Read `docs/roadmaps/gta-batch-3/E29/_common.md` first: working directory, toolchain, modelling, z-fighting, voice and checks.

## Goal
Cafe furniture, a bike rack and three signs with a blank text face exist as prefabs in
`packages/prefabs/src/catalog/gta-euro-street-b.ts`, and the satirical lines for those sign faces exist in
`games/gnome-theft-auto/src/eurokit/signs.ts`.

## Read first
- `docs/roadmaps/gta-batch-3/E29/_common.md`
- `packages/prefabs/src/types.ts` (`seat` for things you sit on), `packages/prefabs/src/palette.ts`
- `packages/prefabs/src/catalog/gta-street-kit.ts` (`park-bench` shows `uses: ['place', 'sit']` with a `seat`)
- `games/gnome-theft-auto/src/eurokit/signs.ts` (stub you fill)

## Change
- `packages/prefabs/src/catalog/gta-euro-street-b.ts`: the file exists with `export const GTA_EURO_STREET_B: readonly PrefabDef[] = [];`.
  Keep that export name; fill it with (`category: 'prop'`, life-size metres):

| id | name | uses | size (W x H x D) | notes |
|---|---|---|---|---|
| `euro-bike-rack` | Bike Rack | place | 1.8 x 1.0 x 0.6 | `footprint: { r: 0.3, h: 1 }` |
| `euro-cafe-chair` | Cafe Chair | place, sit | 0.45 x 0.9 x 0.45 | `seat: [0, 0.46, 0]`, faces +z |
| `euro-cafe-table` | Cafe Table | place | 0.7 x 0.75 x 0.7 | round |
| `euro-chalkboard-sign` | Chalkboard Menu | place | 0.6 x 1.0 x 0.5 | A-frame |
| `euro-poster-board` | Poster Board | place | 1.4 x 2.3 x 0.2 | `footprint: { r: 0.3, h: 2.3 }` |
| `euro-street-sign` | Street Name Sign | place | 0.7 x 2.4 x 0.1 | |

Looks:
- **Bike Rack**: three hoops of grey steel (rings with `d: [0.35, 0.025, 180]` standing upright, bottoms at y = 0) on a
  low rail, one old step-through bicycle leaned in it (two thin rings for wheels, a frame of thin pills, a wicker basket
  box with two baguettes poking out: a story detail).
- **Cafe Chair**: a classic woven bistro chair: thin bent dark metal legs (pills), a round seat with a two-colour woven top
  (tint 0xc23b3b and trim 0xf3efe6 as two thin crossing boxes), a curved back (a half ring). Set `tint` and `trim`.
- **Cafe Table**: a round marble top (white cyl 0.03 thick), a single dark cast-iron pedestal and a cross foot, a tiny
  cup and saucer and an ashtray-like dish on top.
- **Chalkboard Menu**: an A-frame of two wooden-framed black boards leaning together (rotated boxes). The front board's
  black writing surface is ONE part named `'sign-face'` (`name: 'sign-face'`), a box 0.5 wide, 0.7 tall, 0.02 thick,
  tilted back about 12 degrees, its centre at `[0, 0.62, 0.12]` (adjust the A-frame to fit around it). A wooden frame
  around it stands 0.03 proud. Chalk scribbles: a few thin white boxes on the face 0.015 proud.
- **Poster Board**: a freestanding dark green iron frame on two legs with a little roof; the poster area is ONE part
  named `'sign-face'`, a box 1.2 wide, 1.6 tall, 0.02 deep, centre `[0, 1.4, 0.06]`, colour `'paper'` (or 0xf1ead8);
  the frame bars 0.04 proud of it. A torn corner of an older poster (a small coloured box) peeks out underneath.
- **Street Name Sign**: a black post with a ball top, a blue enamel plaque (the `'sign-face'` part: 0.6 wide, 0.3 tall,
  0.02 deep, centre `[0, 2.2, 0.03]`, colour 0x1f4f9a) with a white border frame 0.015 proud, hung from the post.

The three `'sign-face'` sizes and centres are a contract (E30 draws text onto them): keep them exactly as written.

- `games/gnome-theft-auto/src/eurokit/signs.ts`: keep `SignFace`, `SIGN_FACE`, `SignKind`, `signLine` exactly as they are.
  Replace only the stub `EURO_SIGN_LINES` with real lines: `menu` (chalkboard specials; 14 lines, each at most 40
  characters), `poster` (posters and notices; 14 lines, at most 60 characters), `street` (street names; 16 names, at most
  24 characters). Dry satire in the voice of `_common.md`: strikes, long lunches, forms in triplicate, queues,
  pastries, berets, bells, rain, tiny cars, scooters, opinions about coffee, a classical concert at the Opera Hall,
  gnome garden things renamed. No real places, brands or people. Examples:
  menu: `"Soup of the day: yesterday's"`, `"Croissant (one per customer, per lifetime)"`;
  poster: `"STRIKE ON TUESDAY. Strike about Tuesday on Wednesday."`, `"Lost: one beret. Answers to 'Beret'."`;
  street: `"Rue de la Long Lunch"`, `"Queue Street"`, `"Little Pebble Lane"`.
  Also add a test file `games/gnome-theft-auto/src/eurokit/signs.test.ts` (vitest) checking: each kind has at least 12
  lines, lengths are within the limits above, no duplicates, `signLine('menu', 3)` is a member of the menu list.

## Contract
```ts
// signs.ts (unchanged signatures)
export interface SignFace { part: 'sign-face'; width: number; height: number; centre: readonly [number, number, number] }
export const SIGN_FACE: Readonly<Record<'euro-chalkboard-sign' | 'euro-poster-board' | 'euro-street-sign', SignFace>>;
export type SignKind = 'menu' | 'poster' | 'street';
export const EURO_SIGN_LINES: Readonly<Record<SignKind, readonly string[]>>;
export function signLine(kind: SignKind, seed: number): string;
```

## Done when
- `npx tsc --noEmit -p packages/prefabs` shows no error in your file.
- `npm test -w packages/prefabs` passes every test naming your six ids.
- `cd games/gnome-theft-auto && npx vitest run src/eurokit/signs.test.ts` passes.

## Out of scope
Every other file, including the other `gta-euro-*.ts` catalog files, `catalog/index.ts` and other files in `eurokit/`.
