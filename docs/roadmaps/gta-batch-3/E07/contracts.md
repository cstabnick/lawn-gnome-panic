# E07 contracts: Options registry, Gnomlet apps, map, loading, position

What later epics call. All paths under `games/gnome-theft-auto/src/`.

## Options registry (`optionsRegistry.ts`)

Add rows from your own module, at import or install time; the Options app (`options.ts`, shown inside the Gnomlet)
draws whatever is registered, sorted by section then row order. Never edit `options.ts` to add an option.

```ts
registerOption({ section: 'world', id: 'weather', label: 'Weather', kind: 'cycle',
  values: [{ id: 'auto', label: 'Auto' }, { id: 'rain', label: 'Rain' }],
  get: () => current, set: (id) => apply(id), desc: 'One short line.', order: 20, watch: 'gta:weather-prefs' });
registerOption({ section: 'view', id: 'x', label: 'X', kind: 'toggle', get, set });          // 'on' / 'off' (or `words`)
registerOption({ section: 'audio', id: 'y', label: 'Y', kind: 'slider', get, set, step: 0.05 }); // 0..1
registerOption({ section: 'save', id: 'z', label: 'Z', kind: 'button', run: () => ... });
registerOptionsSection('weather', 'Weather', (el) => { el.append(...); return { show() {}, hide() {} }; }, 55);
```

- Sections (`SECTIONS`): `controls` 10, `view` 20, `map` 30 (Map and markers), `dialogue` 40, `world` 50, `audio` 60
  (Sound), `online` 70, `cheats` 80, `save` 90, `dev` 100. An unknown section id makes its own section.
- `desc` may be a function (re-read on repaint). `watch` is a window event that repaints the row when the value changes
  elsewhere. `visible()` hides a row (read when Options is built).
- A section `mount` draws custom content after the section's rows; its `show` / `hide` run when Options opens / closes.
- Values are per-browser settings: the owning module keeps its own localStorage key and event; settings never go in
  `GTA_SAVE_KEYS`.
- Pref helpers added by E07: `birdPrefs.ts` (`getBirdAlerts`, `getBirdSounds`, `birdAlertSoundOn`, event
  `gta:bird-prefs`), `questMarkerPrefs.ts` (`getMarkerHeight(full)`, `trackBeam(mesh, groundY, full)` for any new
  quest beam, event `gta:marker-height`), `viewPrefs.ts` (shake, first person), `mapViewPrefs.ts` (if the raised
  buildings bonus landed).

## Gnomlet apps (`gnomlet/registry.ts`, `gnomlet/gnomlet.ts`)

```ts
registerGnomletApp({ id: 'home-decor', label: 'Home Decor', icon: '🛋', group: 'money', order: 40,
  detail: () => '3 rooms', badge: () => newCount || null, available: () => ownsHome(),
  run: () => openDecorPanel() });                         // the tablet closes, then run()
registerGnomletApp({ id: 'pocket-golf', label: 'Pocket Golf', icon: '⛳', group: 'fun',
  open: (root, ctx) => { build into root; return () => cleanup(); } });   // lives inside the tablet screen
openGnomlet(appId?) / closeGnomlet() / toggleGnomletApp(id) / isGnomletOpen()
```

- Groups (`GNOMLET_GROUPS`): `here` (contextual dock actions, automatic), `phone`, `money`, `world`, `journals`, `fun`,
  `system`.
- `phone.addApp({ id, label, icon, detail?, run, group? })` still works: it registers a Gnomlet app (default group from
  `PHONE_GROUPS`, else `phone`) and keeps the phone's "not now" check (cutscene, shops, knocked out) on `run`.
- In-tablet apps: the tablet owns pad and keys while open (A / Enter click the focused element, B / Escape back,
  arrows move focus between `button, input, select, summary, [data-gnl-focus]`). Use `pointerdown` for rapid taps
  (index.html swallows a second tap within 350 ms). Elements needing raw touch take `data-gnl-touch="none"` (canvases
  get it automatically). The cleanup must remove every listener.
- Every former More tile is an app bridged from `ui/actions.ts` (`BRIDGED` in `gnomlet.ts`), so `ActionId`,
  `registerAction` and the key / pad shortcuts are unchanged. While open: `body[data-more="open"]`.
- Pins: `gta-more-pins` (app ids), up to 3, shown in the tablet dock and beside the ☰ button.

## Big map (`hud.ts`)

`hud.bigMap.open() / close() / isOpen() / zoomTo(x, z, scale)` (scale = screen px per world unit). A quest's "show me
on the map" calls `zoomTo`. Map content (new POI kinds and blips) stays with each content epic (`mapIcons.ts`,
`mapPois.ts`).

## Loading screen (`loading/`)

`showLoading(steps)`, `loadingProgress(n, label)`, `hideLoading()` (`loading/loader.ts`); content is data:
`loading/facts.ts` `LOADING_FACTS` (append short lore facts, <= 140 chars, from `docs/lore/`) and `loading/pages.ts`
`LOADING_PAGES` (inline-SVG concept-art pages).

## Position (`positionSave.ts`)

Save key `gta-position-v1` `{ v: 1, x, z, yaw, interior?, t }` (cloud: newer wins). Restored on start unless a dev
URL parameter or an online room decides the spawn; inside an interior the door is saved plus the interior id, and the
game walks back in. Gnomey Bird best: `gta-gnomeybird-v1` `{ best }` (cloud: higher wins).
