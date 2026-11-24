Epic: 1 tower kit
Depends on: none

(Read `docs/roadmaps/gta-tower-styling/epic-1/_env.md` first: environment and rules.)

## Goal
`games/gnome-theft-auto/src/towers/signAtlas.ts` paints 12 company signs and 4 murals into one 1024 x 1024 canvas.

## Read first
- `games/gnome-theft-auto/src/towers/signAtlas.ts`: the stub. Keep `SIGN`, `signAspect`, `signUv` exactly; replace only `buildSignAtlas`.
- `games/gnome-theft-auto/src/brands.ts`: `BRANDS` (each has `name`, `primary`, `secondary` colours as numbers) and `billboardTexture` (lines ~362-435) for the house style of brand art.

## Change
- `games/gnome-theft-auto/src/towers/signAtlas.ts`, `buildSignAtlas()`:
  - One canvas 1024 x 1024 from `document.createElement('canvas')`, `new THREE.CanvasTexture(canvas)`, `colorSpace = THREE.SRGBColorSpace`. If `getContext('2d')` is null return the texture anyway (tests use a fake DOM whose context accepts every call).
  - Signs 0-11: cell at canvas x = (id % 2) * 512, y = Math.floor(id / 2) * 128, size 512 x 128. Keep 4 px of background colour round each cell edge.
    Each sign: background in the owner's primary colour, a 6 px inner border in the secondary colour, the name in bold
    sans-serif (`bold 64px system-ui, sans-serif`, shrink the font size until `measureText(text).width` fits 400 px; with a fake context measureText may return junk: guard with `Number.isFinite` and stop after 10 tries), text colour the
    secondary (or white/black, whichever contrasts more with the background), plus one small emblem drawn with paths at the left (a leaf, an envelope, a mower blade, a bird, a bolt, a coin: whatever fits the company).

    | id | text | colours (primary / secondary) |
    |---|---|---|
    | 0 KILN_SHIELD | KILN-SHIELD | BRANDS['kiln-shield'] |
    | 1 SNAIL_MAIL | SNAIL-MAIL EXPRESS | BRANDS['snail-mail'] |
    | 2 TATTLER | THE TURFTON TATTLER | `#f2ead8` / `#1b1b1b` (newspaper: black text, `bold 54px Georgia, serif`) |
    | 3 ACORN_COLA | ACORN-COLA | BRANDS['acorn-cola'] |
    | 4 RAZOR_BACK | RAZOR-BACK | BRANDS['razor-back'] |
    | 5 HUSKY_BLADE | HUSKY-BLADE | BRANDS['husky-blade'] |
    | 6 STINK_GRO | STINK-GRO | BRANDS['stink-gro'] |
    | 7 BUCK_IRON | BUCK-IRON | BRANDS['buck-iron'] |
    | 8 PIGEON_DROP | PIGEON-DROP | BRANDS['pigeon-drop'] |
    | 9 TURFTON_FM | TURFTON FM 99.3 | `#1b1b22` / `#ffc400` |
    | 10 DANDELION_FIZZ | DANDELION FIZZ | BRANDS['dandelion-fizz'] |
    | 11 FIRST_KILN_BANK | FIRST KILN BANK | `#3b2f22` / `#d4af37` |

    Convert colour numbers to CSS with `'#' + n.toString(16).padStart(6, '0')`.
  - Murals 12-15: cell at canvas x = (id - 12) * 256, y = 768, size 256 x 256. Painted wall art, flat colours, bold shapes, no text except where stated:
    - 12 MURAL_MOWER: a smiling gnome (red pointed hat, white beard, blue coat) riding a green ride-on mower on a sky-blue background with a yellow sun; the words MOWERS ARE FOR BORROWING along the bottom in small bold white letters.
    - 13 MURAL_HAT: one giant red gnome hat with a gold band on a deep blue background with gold coins (circles) raining.
    - 14 MURAL_SLUG: a racing slug (a fat brown-green slug with a number 7 on its side) with speed lines, a chequered stripe at the top, orange background.
    - 15 MURAL_FLOWERS: big sunflowers and tulips on a green background, a watering can in the corner.
  - Keep code plain: a `paintSign(c, id, text, bg, fg, font)` helper and one function per mural.

## Contract
`SIGN`, `signAspect(id)`, `signUv(id)` unchanged; `export function buildSignAtlas(): THREE.Texture`. Imports: `three` and `../brands` only.

## Done when
- `cd games/gnome-theft-auto && npx tsc --noEmit -p .` shows no error in `src/towers/signAtlas.ts`.
- All 12 signs and 4 murals are painted in the cells that `signUv` points to (check the maths once by hand for id 3 and id 14).

## Out of scope
Every other file.
