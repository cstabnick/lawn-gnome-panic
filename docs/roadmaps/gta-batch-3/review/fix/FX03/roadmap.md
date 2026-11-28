# FX03 roadmap: touch activity mode, holstering and activity HUDs

Brief: `../FX03-activity-mode-and-holster.md`. Branch `fix/FX03`. Dev server for checks: `http://localhost:5503/` (the lead
keeps it running; workers never start their own).

## Foundation (written by the lead, before the workers)

- `src/activityMode.ts` (new): `PEACEFUL_INTERIORS`, `setActivityOn(key, on)`, `activityHidesGun()`,
  `setTouchActivity(key, { stick, buttons } | null)`, `registerActivityPanel(el)` (the HUD slot: top centre on wide
  screens, full width under the top button row on a portrait phone; toasts move below it), `quietRegionBanner(ms)`,
  CSS that hides the vehicle key card (`.gta-vhint`) and the telescope in activity mode and the weapon block while
  holstered, and moves achievement toasts bottom-left while a workplace panel is open. Test `activityMode.test.ts`.
- `input.ts`: `setActivity` / `setHolstered`; listens to `onTouchActivityChange`; hides cluster buttons not kept, the
  stick when `stick: false`, and Guns / Reload / Aim / Fire while holstered (the context button grows into the Fire slot).
- `types.ts` `Input`: the two new methods. `ui/enterLabel.ts`: context verbs Decorate / Sleep / Swing.
- `app.ts` hideGun block: `holstered = activityHidesGun()` feeds the gun pose, `hideGun`, aim and fire;
  `setActivityOn('workplace', workplaces.isOpen())` covers chef, Gnomazon, the bin lift, the hose and the comedy stage.
- `workplaces/comedy/runtime.ts`: `setActivityOn('comedy', show !== null)`. `shiftHud.ts`: optional `note` field.

## Shape

| Epic | Done when | Issues |
|---|---|---|
| 1 Activity HUDs and holster call sites | `npm run build -w games/gnome-theft-auto`, `npm test -w games/gnome-theft-auto`, no button overlaps at 390x844 in court / skate / sled / golf / bin / fire | 6 (parallel, disjoint files) |

| Issue | Agent | Files | Findings |
|---|---|---|---|
| 1 Court HUD | Sonnet | court/hud.ts | G8#1 (court), G8#33 |
| 2 Skate HUD | Sonnet | skate/hud.ts | G8#1 (skate), G8#14, G8#34 (skate) |
| 3 Golf HUD | Sonnet | golf/hud.ts | G8#1 (golf), G8#15, G6#25 |
| 4 Golf club and swing | Sonnet | golf/runtime.ts, new golf/swingPose.ts (+ test) | G8#2 (golf), G6#25 (tee marker) |
| 5 Winter rides | Haiku | winter/runtime.ts | G8#26, G4#11, G8#1 (sled) |
| 6 Shift panel and bin round | Sonnet | workplaces/shiftHud.ts, workplaces/garbage/runtime.ts | G8#3, G8#34 (bin) |
| 7 Fire brigade | Sonnet | workplaces/firefighter/runtime.ts, station.ts, hoseUi.ts | G8#11, G8#16, G8#3 (fire), G8#34 (fire) |

Not planned (outside the owned files, carried over): the court camera pull-in (`court/view.ts`), raising the golf tee
camera in portrait (`golf/view.ts`, FX16), fishing's touch mode (`fishing/`), a running "farm work" state (farm tasks
are one-tap interactions; `farm/` is FX18's), the global toast queue (G9 / FX19).

## Issues

The full text of each issue is the prompt given to its worker; it is kept in `issues.md` next to this file.
