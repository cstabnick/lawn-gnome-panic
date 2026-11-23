# Gnome Theft Auto: customization polish (Glaze + guns)

Goal: vehicle (Pay 'n' Glaze) and weapon (Ammu-Gnation) customization that feels finished: rims you can actually see, faster
slider previews, Owned badges and part thumbnails, a weapon wheel instead of cycling, and gun mods fitted anywhere in the world.

User requests: "refine and optimize and improve the vehicle customization and weapon customization. little raw", "make weapon
customization in world", "add weapon menu instead of tab through it all", "fix rims not being customizable".

## Root cause: rims not customizable

`packages/glaze/src/wheels.ts` `buildHolder` put the rim prefab on the axle centre (x = 0) inside the tyre prefab. Every tyre
prefab (`gta-glaze-tyres.ts`) is a SOLID cylinder 0.8-1.0 wide (radius 0.5), and every rim prefab (`gta-glaze-rims.ts`) is a disc
about 0.1-0.16 thick centred at x = 0 whose outer face is meant to point +x. Scaled into the wheel (tyre x-scale Wd, rim
x-scale 0.9 Wd), the rim spans about +-0.07 Wd while the tyre spans +-0.43 Wd or more: the rim is buried inside the rubber, so
picking a rim (or a rim colour) changed nothing visible. The shop, the loadout, the save code and the prefabs were all fine.
Fix: measure the built tyre's outer face (bounding-box max x in holder space) and slide the rim out so its own max x sits
RIM_PROUD x R beyond it (Epic 2, issue A).

## Design decisions

- **Weapon wheel** (`weaponWheel.ts`): tap Q / tap LB = next gun (old behaviour kept); hold Q or Tab / hold LB (180 ms) = radial
  wheel of all 9 guns; mouse movement (pointer lock) or a stick points; release equips. Touch: the Swap button (renamed "Guns")
  opens it in tap mode; tap a gun. 🔧 in the centre opens the Pocket Kit. While open, fire, camera look and enter are held.
  The world does not slow down (would touch dt everywhere in app.ts).
- **In-world weapon customization** (`gunModKit.ts`, the "Ammu-Gnation Pocket Kit"): the same gun sheet (`gunShop.ts`, now with
  `GunShopOptions`: rootId, title, slogan, orderFee, feeLabel) opened anywhere on foot with K or the wheel's 🔧. The camera
  swings to the gnome's hand; the held gun wears the draft (`weapons.previewLoadout`). Owned mods refit free; new mods cost the
  shop price + 10 acorn Pigeon-Drop delivery (lore: Pigeon-Drop Couriers). Blocked at heat >= 1, like the store. Ammu-Gnation
  keeps the big turntable display and no fee.
- **Glaze polish**: prefab thumbnails on part cards (`glazeThumb(slot)` = icon of `glaze-<slot>-<id>`), Owned badges
  (`optionGrid` `badge`, `ownedBadge`), slider changes coalesced to one `setVehicleLook` per animation frame, and camber changes
  no longer rebuild the whole rig (only ride height did before).
- **Online**: no protocol change. Gun mods already travel through `encodeGunWire`; Glaze looks already sync via remotes.ts.
- **Mobile**: wheel buttons 64 px on a ring that fits 390x844 and 844x390; Pocket Kit is the existing bottom sheet; K and Tab have
  touch (Guns button, 🔧) and gamepad (LB hold) equivalents.
- **Achievement**: `gta-pocket-armourer` "Roadside Armourer": fit a mod with the Pocket Kit.

## Extension points for the later boat/plane tuning workstream

- **Tabs**: `glazePanels.ts` `registerGlazePanel(panel, order)` adds a shop tab; `Panel.appliesTo?(kind)` limits it to some
  vehicle models; the shop builds `glazePanelsFor(v.kind)` on every open. Built-ins use order 10-50.
- **Which models the shop dresses**: `glazeStore.ts` `GLAZE_KINDS` (ground vehicles today). Add boat/plane kinds there, and give
  them a `@lawn/glaze` rig in `vehicles.ts` (today flyers and boats only record `v.look`, see `setVehicleLook`).
- **Paint / parts**: a Loadout field + catalogue rows in `packages/glaze/src/catalog.ts`; fitted parts are prefabs named
  `glaze-<slot>-<id>`, which also gives the shop card thumbnail for free (`glazeThumb(slot)`); price lines come from
  `loadoutCostLines`. Panel widgets: `optionGrid` (with `thumb`, `badge`), `sliderRow`, `swatchRow`, `sectionLabel`.
- **Live preview cost**: `rig.set` rebuilds everything unless only rideHeight / camberFront / camberRear changed; new
  pose-only fields can join that list in `packages/glaze/src/attach.ts` `samePose`.

## Shape

| Epic | Done when | Issues |
| --- | --- | --- |
| 1 Foundation (planner, done) | tsc clean for these files | glazeUi badge/thumb/appliesTo, glazePanels.ts registry, keys (Tab, K), types (Weapons.previewLoadout/ammoOf), gunShop options, stubs weaponWheel.ts + gunModKit.ts |
| 2 Build | each issue's tests + tsc | 8 parallel: A glaze package rim fix + pose-only set, B glazeShop, C wheels+body panels, D trim+lights+paint panels, E weapons.ts + gunShop/gunStore polish, F weapon wheel, G Pocket Kit, H achievement + lore |
| 3 Integration (planner) | tsc, `npm test -w games/gnome-theft-auto`, glaze + achievements tests | app.ts wiring, input.ts (Q off the keyboard switch, Swap -> Guns), gamepad.ts comment |

## Epic 2 issues

~~~~text
COMMON ENVIRONMENT (pasted into every issue)
Working directory: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\elkhorn (Windows, Git Bash). If node is not found:
export PATH="/c/Program Files/nodejs:$PATH". Dependencies are installed; do NOT run npm install.
Other workers are editing OTHER files in the same game at the same time, so `npx tsc --noEmit -p games/gnome-theft-auto`
may show errors in files that are not yours (for example app.ts): ignore those, fix only errors in your files.
Do NOT commit, push, stash, switch branches, run `vite build` / `npm run build`, or start a dev server.
Repo rules: CC0/self-made assets only; new visible objects come from the prefab library (@lawn/prefabs); UI touch targets at
least 44 px and must work at a 390x844 phone viewport; never restyle or hide the shared #ui element.
~~~~

~~~~text
Epic: 2 Build. Issue A: Glaze package: make rims visible, and camber changes without a rebuild
Depends on: none

## Environment
(COMMON ENVIRONMENT above.)

## Goal
Rims picked at Pay 'n' Glaze show on the wheel. Root cause: packages/glaze/src/wheels.ts buildHolder puts the rim prefab at the
axle centre (x = 0) inside a SOLID tyre cylinder (tyre prefabs are cylinders radius 0.5, 0.8-1.0 wide along x, scaled by Wd;
rim prefabs are ~0.1 thick discs centred at x = 0, outer face toward +x, scaled 0.9 Wd), so the rim is hidden inside the rubber.
Also: a camber-only change must not rebuild the whole rig.

## Read first
- packages/glaze/src/wheels.ts: buildHolder, applyWheels, RIM_FRACTION
- packages/glaze/src/wheels.test.ts: fakeWheel / fakeRoot / mounts helpers
- packages/glaze/src/attach.ts: sameApartFromRide and rig.set
- packages/glaze/src/attach.test.ts: how a rig is built in tests

## Change
- packages/glaze/src/wheels.ts:
  - export const RIM_PROUD = 0.04; (how far, as a fraction of the wheel radius R, the rim's outer face stands out past the tyre's outer face)
  - In buildHolder: name the tyre group `tyreHolder.name = 'glaze-tyre'` and the rim group `rimHolder.name = 'glaze-rim'`.
    After the tyre is added to `holder`, call `holder.updateMatrixWorld(true)` and measure
    `const tyreBox = new THREE.Box3().setFromObject(tyreHolder)` (holder has no parent yet, so this is holder space).
    Build the rim group as now (scale (Wd * 0.9, 2R*RIM_FRACTION, 2R*RIM_FRACTION)), add it, `holder.updateMatrixWorld(true)`,
    measure `rimBox = new THREE.Box3().setFromObject(rimHolder)`, then
    `rimHolder.position.x = tyreBox.max.x + RIM_PROUD * R - rimBox.max.x`.
    Do this BEFORE the existing `if (side === -1) holder.rotation.y = Math.PI;` line (the flip makes +x point outward on both sides).
    Keep the spinner push as is (it spins rimHolder about x; its x position does not matter).
  - Update the applyWheels doc comment to say the rim sits on the tyre's outer face.
- packages/glaze/src/attach.ts: rename sameApartFromRide to `samePose(a, b)`: true when a and b differ at most in rideHeight,
  camberFront and camberRear (compare JSON.stringify of both with those three fields set to 0). In rig.set rename `rideOnly`
  to `poseOnly` and use samePose. Camber is read every frame through camberOf(), so placeShell() alone is enough. Update the
  comment ("The ride-height and camber sliders move transforms; everything else rebuilds.").
- packages/glaze/src/wheels.test.ts: add a test "puts a picked rim on the outside of the tyre": with fakeRoot(), for rim
  'fivespoke' and for 'sawblade' (loadout = { ...defaultLoadout(), rim }), applyWheels(root, mounts, loadout); for wheel-0 and
  wheel-2 find `group.getObjectByName('glaze-tyre')` and `getObjectByName('glaze-rim')` (both must exist: the real prefabs are
  registered by importing @lawn/prefabs; if getObjectByName('glaze-rim') is undefined, add `import '@lawn/prefabs';` at the top),
  `root.updateMatrixWorld(true)`, then in the holder's own frame (`const holder = group.getObjectByName('glaze-wheel')!;
  const inv = holder.matrixWorld.clone().invert();`) measure `const tb = new THREE.Box3().setFromObject(tyre).applyMatrix4(inv)`
  and `const rb = new THREE.Box3().setFromObject(rim).applyMatrix4(inv)` and expect `rb.max.x > tb.max.x` (the rim's outer face
  stands out past the tyre's outer face). Write the test first and see it FAIL on the old code, then fix.
- packages/glaze/src/attach.test.ts: add a test: build a rig like the existing tests do; remember
  `const shell = root.children.find((c) => c.name === 'glaze-shell')`; `rig.set({ ...rig.loadout, camberFront: -10, camberRear: -5 })`;
  expect the same shell object still to be a child of root (no rebuild) and `rig.camberOf(2)` to be close to -10 * Math.PI / 180.

## Contract
applyWheels / setWheelPose / attachLoadout signatures unchanged. New export RIM_PROUD. Child names 'glaze-tyre', 'glaze-rim'.

## Done when
- `npm test -w packages/glaze` passes (all old tests too)
- `npx tsc --noEmit -p packages/glaze` passes (if the package has no tsconfig build target, skip this)

## Out of scope
Everything under games/; packages/prefabs (the prefabs are fine).
~~~~

~~~~text
Epic: 2 Build. Issue B: Pay 'n' Glaze shop: tab registry, coalesced live preview
Depends on: none

## Environment
(COMMON ENVIRONMENT above.)

## Goal
The shop builds its tabs from the registry (so later work can add boat/plane tabs) and dragging a slider updates the vehicle at
most once per animation frame instead of on every input event.

## Read first
- games/gnome-theft-auto/src/glazeShop.ts (the whole file; you own it)
- games/gnome-theft-auto/src/glazePanels.ts: `glazePanelsFor(kind: VehicleKind): Panel[]` (already written; do not edit)
- games/gnome-theft-auto/src/glazeUi.ts: Panel and PanelCtx (do not edit)

## Change
- games/gnome-theft-auto/src/glazeShop.ts:
  - Remove the five panel imports and the `PANELS` const; import `{ glazePanelsFor } from './glazePanels'`.
  - Tabs: build the panel tab buttons in `open(v)` (clear the old ones first) from `glazePanelsFor(v.kind)`, and keep the
    Handling tab button last. Store the open panel list in OpenState as `panels: Panel[]`; `showPanel(index)` uses `st.panels`.
    Keep each tab a `button.gz-tab` with `${p.icon} ${p.label}`, `.active` + `aria-pressed` on the shown one.
  - Coalesce the live preview: `patch(p)` updates `current.draft` and refreshes price and panels immediately, but calls
    `deps.setLook(current.v, current.draft)` through a scheduler: if `typeof requestAnimationFrame === 'function'`, set a
    pending flag and request one frame that calls `deps.setLook(st.v, st.draft)` for the still-open state (skip if closed or a
    different vehicle); otherwise call it at once. Add `flushLook()` that runs a pending setLook immediately and cancels the frame
    (cancelAnimationFrame). Call flushLook() at the start of the Buy handler, Reset handler and close().
  - Keyboard: besides Escape, ArrowLeft / ArrowRight switch to the previous / next tab when focus is not in an input
    (`(e.target as HTMLElement | null)?.tagName !== 'INPUT'`). Use literal `e.code === 'Escape'` as now; for arrows use
    `e.code === 'ArrowLeft'` / `'ArrowRight'` (these codes are already in the game's key table as movement keys, which is allowed).
  - After a successful Buy, call refreshAll() as now (panels re-badge "Owned" from ctx.owned()).
- Keep `createGlazeShop`, `GlazeShopDeps`, `GlazeShop` signatures exactly as they are.

## Contract
`export function createGlazeShop(ui: HTMLElement, hud: Hud, deps: GlazeShopDeps): GlazeShop` unchanged.
`glazePanelsFor(kind)` returns Panel objects: { id, label, icon, appliesTo?, build(ctx), refresh?() }.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in glazeShop.ts
- `npm test -w games/gnome-theft-auto -- src/keys.test.ts src/glazeStore.test.ts` passes

## Out of scope
glazeUi.ts, glazePanels.ts, glazePanel*.ts (other workers), app.ts, garages.ts.
~~~~

~~~~text
Epic: 2 Build. Issue C: Glaze Wheels and Body panels: part thumbnails and Owned badges
Depends on: none

## Environment
(COMMON ENVIRONMENT above.)

## Goal
Tyre, rim, spoiler, seat, steering and ornament cards show a picture of the part and an "Owned" badge on what the player already
owns for this vehicle model.

## Read first
- games/gnome-theft-auto/src/glazeUi.ts: `optionGrid` (options `thumb?(id)` and `badge?(id)`; `set(v)` re-reads badges),
  `glazeThumb(slot: string): (id: string) => HTMLElement | null` (icon of prefab `glaze-<slot>-<id>`, null when none),
  `ownedBadge<T>(owned: () => T): (id: T) => string | null`. Do not edit glazeUi.ts.
- games/gnome-theft-auto/src/glazePanelWheels.ts and games/gnome-theft-auto/src/glazePanelBody.ts (you own both)

## Change
- glazePanelWheels.ts:
  - tyre grid: `thumb: glazeThumb('tyre')`, `badge: ownedBadge(() => c.owned().tyre)`.
  - rim grid: `thumb: glazeThumb('rim')`, `badge: ownedBadge(() => c.owned().rim)`.
  - The rim colour swatches: add a short note under them that says which colour is owned only if it differs from the draft? No:
    keep it simple, leave swatches as they are.
  - Move the "Rims" and "Rim colour" sections ABOVE "Ride height" (rims and tyres first: Tyres, Rims, Rim colour, Wheel size,
    Ride height, Camber), so the most-wanted options are on top on a phone.
  - Fix the ride-height blurb: remove the sentence "Replaces the old Side-Valve ride-height dial." (keep the rest).
  - The `thumb` option's type is `(id: T) => HTMLElement | null`; glazeThumb returns `(id: string) => ...`, which is assignable.
- glazePanelBody.ts: for each optionGrid there (spoiler, seat, steer, ornament) add `thumb: glazeThumb('<slot>')` with slot
  'spoiler', 'seat', 'steer', 'ornament', and `badge: ownedBadge(() => c.owned().<field>)` with the matching Loadout field
  (spoiler, seat, steer, ornament; read the file for the exact field names and how the ctx variable is named). If a grid
  already has a `thumb`, keep the existing one.
- Make sure each panel's refresh() calls `.set(...)` on every grid (it already does for most; add any missing) so badges update
  after a purchase.

## Contract
Panel exports `wheelsPanel` and `bodyPanel` keep their names and the Panel shape.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in glazePanelWheels.ts or glazePanelBody.ts
- `npm test -w games/gnome-theft-auto -- src/vehicles.glaze.test.ts` passes

## Out of scope
glazeUi.ts, glazeShop.ts, glazePanelTrim.ts, glazePanelLights.ts, glazePanelPaint.ts, packages/.
~~~~

~~~~text
Epic: 2 Build. Issue D: Glaze Trim, Lights and Paint panels: part thumbnails and Owned badges
Depends on: none

## Environment
(COMMON ENVIRONMENT above.)

## Goal
Grille, bumper, canopy, mirror, exhaust, horn, lamp, finish and decal cards show "Owned" on what the player owns for this model,
and part cards show a picture of the part where a prefab exists.

## Read first
- games/gnome-theft-auto/src/glazeUi.ts: `optionGrid` (options `thumb?(id)` and `badge?(id)`; `set(v)` re-reads badges),
  `glazeThumb(slot: string)` (icon of prefab `glaze-<slot>-<id>`, null when none), `ownedBadge<T>(owned: () => T)`. Do not edit it.
- games/gnome-theft-auto/src/glazePanelTrim.ts, glazePanelLights.ts, glazePanelPaint.ts (you own all three)

## Change
- glazePanelTrim.ts: grids grille, bumper, canopy, mirror, exhaust get `thumb: glazeThumb('grille' | 'bumper' | 'canopy' |
  'mirror' | 'exhaust')`; every grid (also horn) gets `badge: ownedBadge(() => <ctx>.owned().<field>)` with the matching
  Loadout field (read the file for field names; horn has no prefab, so no thumb).
- glazePanelLights.ts: lamp grid gets `thumb: glazeThumb('lamp')` and an owned badge on the lamp field; the beam grid keeps its
  existing `thumb: beamThumb` and gets an owned badge on its field.
- glazePanelPaint.ts: finish and decal grids get owned badges (finish, decal fields). The underglow grid ('glow') gets an owned
  badge only if its value is a plain string id comparable to the owned loadout (read how its value is built; if it maps
  null to a string like 'none', compare the same way). No thumbs in this file.
- Make sure each panel's refresh() calls `.set(...)` on every grid so badges update after a purchase.

## Contract
Exports `trimPanel`, `lightsPanel`, `paintPanel` keep their names and the Panel shape.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in these three files
- `npm test -w games/gnome-theft-auto -- src/vehicles.glaze.test.ts` passes

## Out of scope
glazeUi.ts, glazeShop.ts, glazePanelWheels.ts, glazePanelBody.ts, packages/.
~~~~

~~~~text
Epic: 2 Build. Issue E: weapons.ts preview + per-gun ammo; gun sheet compares to fitted; store turntable turns
Depends on: none

## Environment
(COMMON ENVIRONMENT above.)

## Goal
The held gun can wear a draft loadout (for the in-world Pocket Kit), the weapon wheel can read each gun's ammo, the gun sheet's
stats compare the draft against what is FITTED (not stock), and the Ammu-Gnation display gun slowly turns.

## Read first
- games/gnome-theft-auto/src/weapons.ts (you own it): createWeapons, `loadouts`, `ammoOf`, rebuildHeld
- games/gnome-theft-auto/src/types.ts lines ~441-490: interface Weapons, with the new optional members
  `previewLoadout?(kind: GunKind, mods: GunLoadout | null): void;` and `ammoOf?(kind: GunKind): number;` (already added; do not edit types.ts)
- games/gnome-theft-auto/src/gunShop.ts: renderStats (you own this file too)
- games/gnome-theft-auto/src/gunStore.ts: update(dt) (you own this file too)
- games/gnome-theft-auto/src/weapons.hold.test.ts: how a test builds createWeapons

## Change
- weapons.ts:
  - add `let previewMods: GunLoadout | null = null;`
  - `previewLoadout(kind, mods)`: `w.selectGun(kind)` first; then `previewMods = mods ? normalizeGunLoadout(kind, mods) : null;`
    and `rebuildHeld()`. Stats (specs) never change.
  - rebuildHeld uses `previewMods ?? loadouts[w.gun]`.
  - selectGun: when switching to a different gun, clear previewMods (set null) before rebuildHeld.
  - setLoadout for the current gun: clear previewMods too (a fit ends the preview).
  - `ammoOf(kind)`: returns `kind === w.gun ? w.ammo : ammoOf[kind]` (rename the local record to `ammoBy` to avoid the name clash
    with the method, and update its uses).
- gunShop.ts renderStats: compare `fitted = moddedGun(gun, fittedLoadout(gun))` (fittedLoadout is already imported from
  './gunModStore') against `now = moddedGun(gun, draft)` instead of stock. Text stays `${r.text(fitted)} -> ${r.text(now)}`, but
  when they are equal show just `${r.text(now)}` (no arrow). Change the section label 'Stats' to 'Stats (fitted -> new)'.
  Do not change anything else in gunShop.ts (its GunShopOptions, fee and price lines were just written and are final).
- gunStore.ts update(dt): besides the bob, turn the display: `stage.display.rotation.y = Math.PI / 2 + time * 0.35;` (the
  preview() function sets rotation.y = Math.PI / 2 on each preview; the turn continues from there).
- weapons.preview.test.ts (new, next to weapons.hold.test.ts): build weapons like weapons.hold.test.ts setup(); call
  `weapons.previewLoadout!('pistol', { muzzle: 'suppressor' })` (if 'suppressor' is not a pistol muzzle mod, pick any id from
  `modsFor('pistol', 'muzzle')` in gunMods.ts) and expect `weapons.spec()` to equal `moddedGun('pistol', {})` stats (rate, mag)
  and `weapons.loadoutOf('pistol')` to be `{}`; then `previewLoadout!('pistol', null)` and expect no throw; and
  `weapons.ammoOf!('shotgun')` (or any other GunKind from GUN_ORDER in config.ts) to equal that gun's mag from
  `moddedGun(kind, {}).mag`.

## Contract
Weapons members previewLoadout(kind, mods|null) and ammoOf(kind) as above; createWeapons(scene, fx) signature unchanged.
gunShop.ts exports unchanged.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in weapons.ts, gunShop.ts, gunStore.ts
- `npm test -w games/gnome-theft-auto -- src/weapons.preview.test.ts src/weapons.hold.test.ts src/gunMods.test.ts src/gunStore.test.ts` passes

## Out of scope
types.ts, app.ts, weaponWheel.ts, gunModKit.ts, gunMods.ts, gunRig.ts.
~~~~

~~~~text
Epic: 2 Build. Issue F: the weapon wheel
Depends on: none

## Environment
(COMMON ENVIRONMENT above.)

## Goal
games/gnome-theft-auto/src/weaponWheel.ts implements createWeaponWheel: a radial menu of every gun. Keyboard: tap Q = next gun,
hold Q or Tab = wheel, point with the mouse, release to equip. Gamepad: tap LB = next gun, hold LB = wheel, point with either
stick, release LB to equip. Touch: press() opens it in tap mode; tap a gun to equip.

## Read first
- games/gnome-theft-auto/src/weaponWheel.ts (the stub; you own it). Keep every export's signature: HOLD_MS, WeaponWheelDeps,
  WeaponWheel, sectorAt (already implemented and final), createWeaponWheel.
- games/gnome-theft-auto/src/keys.ts: KEYS.switchGun ('KeyQ'), KEYS.weaponWheel ('Tab'), KEYS.close ('Escape'), isTyping(e)
- games/gnome-theft-auto/src/config.ts: `GUNS[kind].name`, `GUNS[kind].prefab`, `GUN_ORDER` (9 GunKinds)
- games/gnome-theft-auto/src/types.ts interface Weapons (~line 441): gun, ammo, mag, selectGun(kind), switchGun(), spec(),
  loadoutOf(kind), optional ammoOf?(kind)
- games/gnome-theft-auto/src/gunMods.ts: `moddedGun(kind, loadout).mag`

## Change
games/gnome-theft-auto/src/weaponWheel.ts:
- DOM (built once in createWeaponWheel, appended to deps.ui): root `div#gta-wheel`, `position:fixed;inset:0;z-index:38;display:none`
  with a dim backdrop (rgba(0,0,0,0.45)); a centred ring container sized `R = Math.min(150, (Math.min(innerWidth, innerHeight) - 110) / 2)`
  (recompute on each open). One `button.gw-gun` per GUN_ORDER entry, 64x64 px, round, placed at angle i * 360/9 degrees from
  straight up clockwise (`left = cx + R*sin(a)`, `top = cy - R*cos(a)`, translate(-50%,-50%)), containing
  `prefabIconElement(GUNS[k].prefab, '🔫', 34)` (import from '@lawn/prefabs'). The held gun's button has a yellow (#ffd23f) ring;
  the pointed/highlighted one is scaled 1.15 with an orange (#ff7a1a) border. In the centre a 120 px round panel shows the
  highlighted gun's name (GUNS[k].name), its ammo line `${ammo} / ${mag}` (ammo = deps.weapons.ammoOf?.(k) ?? (k === weapons.gun ?
  weapons.ammo : mag), mag = moddedGun(k, deps.weapons.loadoutOf(k)).mag), the number of fitted mods
  (`Object.keys(deps.weapons.loadoutOf(k)).length` -> "2 mods" / "stock"), and a 48x48 `button.gw-kit` "🔧" (aria-label
  "Pocket Kit: fit mods") that calls close() then deps.openModKit(highlighted). Inject one <style id="gta-wheel-style"> with all CSS
  (pointer-events:auto on buttons; `touch-action:none`; safe-area-aware). Every button: type=button, aria-label = gun name.
- Stop pointer events on the wheel reaching the game: `root.addEventListener('pointerdown', e => e.stopPropagation())`.
- State: `open: boolean`, `mode: 'key' | 'pad' | 'tap'`, `highlighted: GunKind`, `heldKey: string | null`, `pressedAt: number`,
  `shown: boolean` (DOM visible), mouse accumulator `mx, my`.
- Keyboard (window listeners added once): keydown with `e.code === KEYS.switchGun || e.code === KEYS.weaponWheel`, not
  `e.repeat`, not isTyping(e): if Tab, `e.preventDefault()`. If not open and deps.canOpen(): start in mode 'key', heldKey = e.code,
  pressedAt = performance.now(), highlighted = weapons.gun, mx = my = 0, shown = false (DOM shows after HOLD_MS, see update and a
  `setTimeout(showIfStillHeld, HOLD_MS)`). If open in 'tap' mode and Q/Tab pressed: close().
  keyup of heldKey in mode 'key': if not shown (released before HOLD_MS) -> `deps.weapons.switchGun()` and toast the new gun's
  name via `deps.hud.toast(GUNS[weapons.gun].name)`; else equip(highlighted). Either way close.
  keydown Escape (e.code === KEYS.close) while open: close().
  While open, `mousemove` adds e.movementX/e.movementY to mx/my (clamp the vector length to 120); `sectorAt(mx, my, 9, 30)`
  picks the highlighted gun when >= 0. `wheel` event while open cycles highlighted by sign of deltaY.
- Gamepad (in update(dt), only while open in mode 'pad'): `import { firstPad } from '@lawn/gamepad'`; p = firstPad(); if !p, close().
  LB is button index 4 (`p.buttons[4]?.pressed`). Point: use the stick with the larger deflection of (axes[2], axes[3]) and
  (axes[0], axes[1]): `sectorAt(x, y, 9, 0.5)` (y is already down-positive on pads). On LB released: if not shown -> next gun
  (switchGun + toast), else equip(highlighted); close.
  Show the DOM in update once `performance.now() - pressedAt >= HOLD_MS` in modes 'key' and 'pad'.
- press(pad): if open, ignore (if mode 'tap', close()). If !deps.canOpen(), return. pad true -> mode 'pad' (pressedAt now, DOM
  shows after HOLD_MS). pad false -> mode 'tap', show at once.
- Tap mode: clicking a gun button = equip(that gun) and close; clicking the backdrop (root itself, `e.target === root`) closes.
  In 'key' / 'pad' mode a click on a gun button also equips and closes (mouse users can click).
- equip(k): if k !== weapons.gun, `deps.weapons.selectGun(k)`, `deps.play?.('reload')`, `deps.hud.toast(GUNS[k].name)`.
- close(): hide DOM, open = false, heldKey = null.
- isOpen(): `open && (shown || mode === 'tap')` is what app.ts uses to hold fire and camera; return `open` itself (simpler:
  holding the key for under 180 ms also holds fire, which is fine).
- If deps.canOpen() turns false while open (checked in update), close().
weaponWheel.test.ts (new): tests for sectorAt with count 9, deadzone 30: (0,-50) -> 0; (50,0) -> 2; (0,50) -> 5;
(5,5) -> -1; and with count 4: (-50,0) -> 3. (sectorAt is already implemented; these pin it.)

## Contract
Exports exactly as in the stub. app.ts (not yours) will do:
`const weaponWheel = createWeaponWheel({ ui, weapons, hud, play, canOpen: () => ..., openModKit: (g) => modKit.open(g) });`
`if (inp.switchGun && ...) weaponWheel.press(!!inp.pad);` and `weaponWheel.update(dt)` every frame, and hold fire/camera while
`weaponWheel.isOpen()`.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in weaponWheel.ts
- `npm test -w games/gnome-theft-auto -- src/weaponWheel.test.ts src/keys.test.ts` passes (keys.test checks that every
  `e.code === '<literal>'` in a module is in keys.ts: compare against KEYS.* constants, not string literals)

## Out of scope
app.ts, input.ts, gamepad.ts, keys.ts, types.ts, weapons.ts, gunModKit.ts.
~~~~

~~~~text
Epic: 2 Build. Issue G: the Ammu-Gnation Pocket Kit (gun mods anywhere in the world)
Depends on: none

## Environment
(COMMON ENVIRONMENT above.)

## Goal
games/gnome-theft-auto/src/gunModKit.ts implements createGunModKit: the gun-mod sheet opened in the open world, previewing the
draft on the gun in the gnome's hand, with the camera swung in close.

## Read first
- games/gnome-theft-auto/src/gunModKit.ts (stub; you own it). Keep every export's signature (POCKET_KIT_FEE, GunModKitDeps,
  GunModKit, createGunModKit).
- games/gnome-theft-auto/src/gunShop.ts: `createGunShop(ui, hud, deps: GunShopDeps, opts?: GunShopOptions)`; GunShopDeps
  { acorns, spend, play, preview(gun, loadout), testFire(gun, loadout), onFit(info: GunFit), onClose() }; GunShopOptions
  { rootId, title, slogan, orderFee, feeLabel }. Do not edit gunShop.ts.
- games/gnome-theft-auto/src/gunStore.ts: ensureShop() and open() show how Ammu-Gnation wires the same sheet (copy the pattern)
- games/gnome-theft-auto/src/keys.ts: KEYS.modKit ('KeyK'), isTyping(e)
- games/gnome-theft-auto/src/types.ts interface Weapons (~line 441): gun, optional `previewLoadout?(kind, mods | null)`, setVisible

## Change
games/gnome-theft-auto/src/gunModKit.ts, createGunModKit(deps):
- Lazily create ONE sheet on first open: `createGunShop(deps.ui, deps.hud, { acorns: () => deps.economy.state().acorns,
  spend: (n, r) => deps.economy.spend(n, r), play: deps.play, preview: (g, l) => deps.weapons.previewLoadout?.(g, l),
  testFire: (g, l) => playGunShot(g, moddedGun(g, l).sound), onFit: (info) => deps.onFit(info), onClose: onSheetClosed },
  { rootId: 'gta-pocketkit', title: 'Pocket Kit', slogan: 'Ammu-Gnation, bolted on where you stand.',
  orderFee: POCKET_KIT_FEE, feeLabel: 'Pigeon-Drop delivery' })`. Imports: playGunShot from './gunSounds', moddedGun from './gunMods'.
- open(gun = deps.weapons.gun): if already open, return. If !deps.canOpen(), return. If deps.heat() >= 1:
  `deps.hud.toast('Pocket Kit: "Not with the Hat Watch on your tail. Lose them first."')`, deps.play('alarm'), return.
  Otherwise: `sheet.open(gun)` (this calls preview -> the held gun shows the draft), then
  `const f = deps.focus(); deps.showroom({ x: f.x, y: f.y, z: f.z, radius: 0.35, distance: 1.9 })`.
- onSheetClosed (the sheet's onClose: Done, close button, Escape): `deps.weapons.previewLoadout?.(deps.weapons.gun, null)` and
  `deps.showroom(null)`.
- close(): `sheet?.close()` (which runs onSheetClosed).
- isOpen(): `sheet?.isOpen() ?? false`.
- K key: one window keydown listener: `e.code === KEYS.modKit && !e.repeat && !isTyping(e)`: if isOpen() close(), else open().
- No three.js, no meshes: the preview is the held gun itself.
gunModKit.test.ts (new): only what runs without a DOM: `POCKET_KIT_FEE` is a positive integer; and createGunModKit with stub
deps whose canOpen() returns false: `open()` does nothing and `isOpen()` is false (guard: if `typeof window === 'undefined'`,
the K listener must not be added; check `typeof window !== 'undefined'` before addEventListener). Look at another *.test.ts in
the folder to see whether tests run with a DOM (vitest environment); write the test so it passes either way.

## Contract
Exports exactly as in the stub. app.ts (not yours) will create it with
`createGunModKit({ ui, hud, economy, weapons, play, canOpen, heat: () => watch.heat, focus: () => <hand world pos>,
showroom: (t) => { hud.setVisible(!t); chase.showroom(t); }, onFit: (info) => modFitAchievements({ ...info, field: true }, achievements) })`.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in gunModKit.ts
- `npm test -w games/gnome-theft-auto -- src/gunModKit.test.ts src/keys.test.ts` passes

## Out of scope
gunShop.ts, gunStore.ts, weapons.ts, app.ts, keys.ts, types.ts.
~~~~

~~~~text
Epic: 2 Build. Issue H: "Roadside Armourer" achievement and the Pocket Kit lore entry
Depends on: none

## Environment
(COMMON ENVIRONMENT above.)

## Goal
Fitting a gun mod with the in-world Pocket Kit unlocks a new achievement with a cosmetic reward, and the lore knows what the
Pocket Kit is.

## Read first
- games/gnome-theft-auto/src/gunAchievements.ts and gunAchievements.test.ts (you own both)
- packages/achievements/src/catalog.ts: the "Gnome Theft Auto: Ammu-Gnation (gun mods)" block (ids gta-bolt-on ... gta-long-look)
- packages/achievements/README.md: reward rules (slot head/back/neck/hand, prefab ids)
- packages/prefabs/README.md and docs/roadmaps/prefab-library/_common.md only if you must add a prefab (see below)
- docs/lore/entries/apocrypha/ammu-gnation-mods.md and docs/lore/entries/apocrypha/pigeon-drop-couriers.md (format + facts)

## Change
- gunAchievements.ts: add `field?: boolean` to interface ModFit (doc: "true when fitted with the Pocket Kit out in the world").
  Add 'gta-pocket-armourer' to GUN_ACHIEVEMENT_IDS. In modFitAchievements: `if (info.field) sink.unlock('gta-pocket-armourer');`
  (any Pocket Kit fit, paid or free refit).
- gunAchievements.test.ts: a test that a fit with field: true unlocks 'gta-pocket-armourer' and one without field does not.
- packages/achievements/src/catalog.ts: after gta-long-look add
  `{ id: 'gta-pocket-armourer', game: 'gnome-theft-auto', gameTitle: 'Gnome Theft Auto', title: 'Roadside Armourer',
  description: 'Fit a gun mod with the Pocket Kit, out in the world.', reward: { slot: 'back', prefabId: '<id>', label: '<label>' } }`.
  Reward: search packages/prefabs/src/catalog for a fitting wearable not already used as a reward in catalog.ts (e.g. a tool
  roll, satchel or toolbox prefab with a back/hand use). If none fits, add one prefab `ammu-tool-roll` ("Ammu-Gnation Tool
  Roll", a rolled canvas pouch with a few spanner handles poking out, olive canvas 0x5b6b2f with orange 0xff7a1a straps) to
  the file that holds the other `ammu-*` gear prefabs (grep "ammu-range-earmuffs" in packages/prefabs/src/catalog), copying the
  shape of a neighbouring back-slot gear prefab (same fields: uses, tags, about, examine, parts, and whatever attach/slot fields
  the neighbours use), and make `npm test -w packages/prefabs` pass.
- docs/lore/entries/apocrypha/ammu-gnation-pocket-kit.md (new): copy the front-matter format of ammu-gnation-mods.md exactly
  (same keys; status draft). Content: the Pocket Kit is a fold-out canvas tool roll Ammu-Gnation sells to nobody and gives to
  everybody; with it a gnome bolts mods on anywhere; mods the gnome already owns go on free; new ones are ordered from the
  roll's little order card and dropped from altitude by the Pigeon-Drop Couriers for a 10-acorn delivery charge; Ammu-Gnation
  will not take an order from a gnome with the Hat Watch on its tail. Link the ammu-gnation, ammu-gnation-mods and
  pigeon-drop-couriers entries the way other entries link (look at how they reference each other).

## Contract
ModFit gains optional `field?: boolean`; modFitAchievements(info, sink) signature unchanged.

## Done when
- `npm test -w games/gnome-theft-auto -- src/gunAchievements.test.ts` passes
- `npm test -w packages/achievements` passes
- `npm run lore` passes
- (if you added a prefab) `npm test -w packages/prefabs` passes

## Out of scope
app.ts, gunModKit.ts, gunShop.ts, any other game.
~~~~
