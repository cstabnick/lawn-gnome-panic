Epic: 2, Systems
Depends on: none

## Environment
Read `docs/roadmaps/gnomes-of-gnomomia/00-environment.md` first; it applies in full, especially the UI rule and the screen layout.

## Goal
The old-school HUD: a chat log, HP/MP/level orbs, RuneScape-style hitsplats and overhead health bars, level-up banners, the region name when you enter a place, a death overlay, mouse-over text and the right-click option menu.

## Read first
- `games/gnomes-of-gnomomia/src/config.ts`: `UI`, `ENEMIES` (scale), `PLAYER_ID`, `SKILLS`.
- `games/gnomes-of-gnomomia/src/state.ts`: `state`, `maxHp`, `maxMp`.
- `games/gnomes-of-gnomomia/src/ui/hud.ts`: the stub you replace.

## Change
- `games/gnomes-of-gnomomia/src/ui/hud.ts`: replace the stub, keeping every export and `MenuOption` exactly. Imports: `allEntities` from `'../entities'`; `player` from `'../player'`; `regionNameAt` from `'../world'`; `bus` from `'../events'`; state and config.
- `createHud(root)`: append one container `div#hud` (`position: absolute; inset: 0; pointer-events: none; font-family: UI.font`) to `root`; put everything below inside it.
- Hover text, top-left (8 px, 8 px): white bold 15 px with `text-shadow: 1px 1px 0 #000`; first word (the verb) in white, the rest in `UI.gold`; hidden when null.
- Chat log, bottom-left (8 px, 8 px), 420 x 150 px (on screens narrower than 700 px: width `calc(100vw - 16px)`, height 90 px, and move it up 0 px; the side panel handles its own size): background `UI.panelBg`, border `2px solid UI.border`, 13 px text, `overflow-y: auto`, `pointer-events: auto`. Subscribe to `message`: append a line in `color ?? UI.text` (keep the last 60 lines), scroll to the bottom.
- Orbs, top-right: three 56 px circles in a row: HP (fill `UI.bad`), Prayer-style MP (fill `UI.mana`), Level (gold border, shows `Lv ${state.level}`). HP/MP orbs: dark background, a fill div from the bottom with height = value/max, centred text `${hp}/${max}` in white with shadow. Update every frame in `updateHud` from `state.hp`, `maxHp()`, `state.mp`, `maxMp()`.
- Region name: in `updateHud`, `regionNameAt(player.position.x, player.position.z)`; when it changes (not on the first frame), show it top-centre (60 px from top) in 30 px `UI.gold` serif with a dark shadow, fading in and out over 3 s.
- Banners: `level-up` → top-centre (100 px) `Level up! You are now level ${level}.` 26 px gold, 3.5 s fade. `skill-up` → smaller (18 px, `UI.good`) `${skill name} increased to ${level}`, 2.5 s. Stack banners vertically if several are visible.
- Death: `player-died` → a full-screen overlay `rgba(80, 0, 0, 0.45)` with centred `Oh dear, you are dead!` (36 px, white) for 3 s.
- Hitsplats: on `hit` and `miss`, spawn a 26 px circle at world point `at + (0, 1.7, 0)`: hit = red `#c8102e` with the damage in white bold; a hit with `spell: true` = orange `#ff7a1a`; miss = blue `#1e5bc6` with `0`. Offset each new splat by a few random px so several do not stack exactly. Over 1.0 s it rises 24 px and fades out, then is removed. On `heal`, a green `+${amount}` text over the player.
- Overhead HP bars: each frame, for every entity with `kind === 'enemy'`, `!dead` and `sinceHit < 6`, draw a 40 x 5 px bar (green `UI.good` fill over red `UI.bad`, width hp/maxHp) at `position + (0, 1.6 * ENEMIES[defId].scale + 0.6, 0)`. Also a bar over the player for 6 s after any `hit` whose target is `PLAYER_ID`. Reuse divs (a pool or a Map by id); hide unused ones.
- Projection helper: `v = world.clone().project(camera)`; hidden if `v.z > 1`; `sx = (v.x + 1) / 2 * innerWidth`, `sy = (1 - v.y) / 2 * innerHeight`. Position with `transform: translate(...)`.
- Context menu: `showContextMenu(x, y, options)`: a box with header `Choose Option` (`UI.panelBgDark`, `UI.textDim`), then one row per option (`UI.text`; hover → `UI.textWhite` on a lighter background). Use the same two-tone colours as the hover text (verb white, rest gold). `pointer-events: auto`, `z-index: 1000`, clamped inside the viewport. Clicking a row: hide, then `onSelect()`. Hide on: a pointerdown anywhere outside the menu (window listener, capture phase), the pointer leaving the menu by more than 24 px (RuneScape style), or `hideContextMenu()`.
- `setHoverText(text)`.

## Contract
Exports and `MenuOption` exactly as in the stub. Your container never covers the canvas with `pointer-events: auto` (only the chat log and the context menu take pointer events).

## Done when
- `npx tsc --noEmit -p games/gnomes-of-gnomomia` shows no errors in `src/ui/hud.ts`.

## Out of scope
`src/ui/panels.ts`, `src/ui/dialogue.ts`, `src/ui/shop.ts`, `src/ui/title.ts` and every non-UI file.
