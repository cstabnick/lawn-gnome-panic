Epic: 1 Modules (Hangar Two and the Mossbank Boathouse, Gnome Theft Auto)
Depends on: none

## Environment
Repo: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\elkhorn (Windows, Git Bash; use absolute paths). Game:
games/gnome-theft-auto (Vite + TypeScript + three.js). If node/npx is not found: export PATH="/c/Program Files/nodejs:$PATH".
Other workers edit other files of this game and repo at the same time: touch ONLY the files listed under Change. Do not
commit, push, stash, switch branches, run vite build / npm run build, or start a dev server. Do not edit AGENT_INDEX.md.
tsc over the whole game may show errors in files other workers are editing; only errors in YOUR files matter.
Repo rules: mobile first (every button at least 44x44 px, no hover-only UI), gamepad works (the sheet already moves a
focus ring with D-pad / stick, A presses, B closes).

## Goal
The Lock-Up sheet (lockup/ui.ts) serves three garages: the Lock-Up (ground), Hangar Two (air) and the Mossbank
Boathouse (water). In phone mode (the Sling-Lift app) it shows a tab strip to switch between the garages the player
owns, the fee per kind, and each row says where the vehicle waits.

## Read first
- games/gnome-theft-auto/src/lockup/ui.ts (all of it, 358 lines).
- games/gnome-theft-auto/src/lockup/types.ts: `StorageKind`.

## Change
- games/gnome-theft-auto/src/lockup/ui.ts:
  - `LockupUiDeps`:
    - change `fee(): number;` to `fee(kind: StorageKind): number;` (doc: "The Sling-Lift fee for that kind"). Every
      call site in ui.ts passes the sheet's current `kind`. (The current caller passes `() => 40`; that still compiles.)
    - add, optional:
      ```ts
      /** Phone mode: the garages to show as tabs, in order (the owned ones). Absent, or fewer than 2: no tab strip. */
      tabs?(): readonly { kind: StorageKind; label: string }[];
      /** Where a stored vehicle of `kind` waits, for the row text ("the Lock-Up", "Hangar Two"). Default 'the Lock-Up'. */
      placeName?(kind: StorageKind): string;
      ```
  - Row meta text: `${pct}% · ${out ? 'Out' : `In ${place}`}` where `place = deps.placeName?.(kind) ?? 'the Lock-Up'`.
  - In `render()`, in phone mode only, when `deps.tabs?.()` has 2 or more entries: after the head and before the rows,
    add `<div class="gta-lockup-tabs" role="tablist">` with one `<button type="button" class="gta-lockup-tab" role="tab">`
    per entry (text = label, `aria-selected` true on the current kind, class `on` on the current kind). Clicking a tab:
    `kind = t.kind; message = ''; armed = null; focus = 0; render();`.
  - Gamepad: in `pollPad`, in phone mode with 2+ tabs, LB (button 4) / RB (button 5) newly pressed switch to the
    previous / next tab (wrap around), same effect as clicking it. Use `padPrev` like the other buttons.
  - CSS (add to the CSS string): `.gta-lockup-tabs{display:flex;gap:8px;flex-wrap:wrap;}` and
    `.gta-lockup-tab{min-width:44px;min-height:44px;padding:0 14px;border-radius:10px;border:2px solid rgba(255,255,255,0.25);background:rgba(255,255,255,0.06);color:#f4f6f8;font-size:14px;font-weight:800;}`
    and `.gta-lockup-tab.on{border-color:#ffd23f;background:rgba(255,210,63,0.2);color:#ffd23f;}` (all scoped under
    `#gta-lockup` like the existing rules).
  - Phone-mode sub line: `Sling-Lift: ${deps.fee(kind)} Acorns a drop` (+ the cooldown part as now).
  - Site mode sub line: for kind 'ground' keep 'Drive a vehicle in and press T to store it.'; for 'air'
    'Taxi an aircraft in and press T to store it.'; for 'water' 'Bring a boat into the slip and press T to store it.'
  - Update the header comment (line 1) to mention the three garages. Keep everything else as it is.
- games/gnome-theft-auto/src/lockup/ui.test.ts (new, vitest): `import { installFakeDom } from '../testing/fakeDom'`
  and call it first (other tests in src do this), then dynamic-import createLockupUi. Use a fake deps object whose store
  returns one ground record and one air record. Tests: phone mode with tabs() returning ground + air shows 2 elements
  `.gta-lockup-tab`; clicking the air tab re-renders with the air record's name; with tabs() returning one entry there
  is no `.gta-lockup-tab`; `fee` is called with the current kind; the row meta uses placeName. If the fake DOM cannot
  run querySelector / click for this, test what it supports and say so in your report.

## Contract
`LockupUi` (open / close / isOpen / refresh) is unchanged. `LockupUiDeps.fee` takes the kind; `tabs` and `placeName`
are optional (lockup/runtime.ts, edited later, will pass them).

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/lockup/ui.test.ts` passes.
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in ui.ts / ui.test.ts (and runtime.ts still compiles
  against ui.ts).

## Out of scope
lockup/runtime.ts, lockup/types.ts, phone/phone.ts, every other file.
