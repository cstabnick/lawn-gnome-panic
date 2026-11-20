# @lawn/gamepad

One place that decides which pad a game reads, and makes the 2026 Steam Controller usable in the browser.

```ts
import { firstPad, mountSteamConnect } from '@lawn/gamepad';

mountSteamConnect(document.getElementById('ui')!); // once, at startup

// each frame
const pad = firstPad(); // PadLike | null, standard layout
const steer = pad?.axes[0] ?? 0;
const gas = pad?.buttons[7]?.value ?? 0;
```

Do not call `navigator.getGamepads()` or filter on `mapping === 'standard'` in a game.

## Pad selection

`getPads()` lists every connected pad, best first: standard mapping before any other, then the most recently
updated. A non-standard pad is a best-effort fallback: games keep reading axes 0-3 and buttons 0-3 from it. Before
this package, lawn-prix and aether-board ignored every pad whose mapping was not `'standard'`.

## Steam Controller (2026)

Outside Steam the controller shows the OS a mouse, a keyboard and a vendor interface ("lizard mode"). On macOS
Steam only adds virtual mouse and keyboard devices, so Chrome's Gamepad API never lists it and it just moves the
cursor. No Gamepad API change can fix that. `steam.ts` reads it over WebHID instead and turns lizard mode off while the
tab is visible (feature report `87 03 09 00`, repeated every second; lizard mode is handed back when the tab is hidden).

- Chrome / Edge / Arc only (WebHID), https or localhost. Elsewhere `mountSteamConnect` renders nothing.
- The player clicks **Use Steam Controller** once and picks the device. After that it reopens by itself.
- It appears through `getPads()` as a standard-mapping pad (A=0 B=1 X=2 Y=3 LB=4 RB=5 LT=6 RT=7 view=8 menu=9
  stick clicks 10/11, d-pad 12-15, Steam=16, L4/R4/L5/R5=17-20, quick access=21).
- Not read: trackpads, gyro, haptics.
- Close Steam if the browser cannot open the device (another app may hold it).

**Not tested on real hardware.** The report layout and the lizard-mode command come from a public reference
implementation (vice7770/surfing-game, `src/game/steam/`), which was also untested on hardware when written, and
are covered here by unit tests and a mocked WebHID device only. If a button or axis is off, fix `BUTTON_BITS` and
`decodeSteamReport` in `src/steam.ts`.
