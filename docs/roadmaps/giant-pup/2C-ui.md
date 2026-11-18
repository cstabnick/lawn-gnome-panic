Epic: 2 Fill the modules
Depends on: none

## Environment
Repository root: /home/user/lawn-gnome-panic (Linux; node and npm are on PATH; `npm install` has been run).
Game: games/giant-pup (Vite + TypeScript + three@0.187.0). A pet-care game: the player is a gnome in a fenced back yard caring for a giant goofy cartoon dog (pet, feed, water, bath, fetch, tricks).
Other workers are editing other files in games/giant-pup at the same moment. Touch only the files this issue names. Do not add npm dependencies. Do not commit.
Repo rules: assets are generated in code only (no downloaded files). Mobile first: anything interactive must work by touch, with 44 px minimum targets and no hover-only UI.
The file you own currently holds a STUB with the final exported signatures. Keep every exported name and signature exactly as written in "Contract" (other files already import them); replace the bodies.

## Goal
`games/giant-pup/src/ui.ts` draws the whole HUD in the DOM: need meters, the dog's name and mood, mode and care buttons, a trick menu, toasts, a hint line, a mute toggle and a name-your-dog dialog. It works on a 390x844 portrait phone, a landscape phone (844x390) and a desktop.

## Read first
- games/giant-pup/src/ui.ts: the stub you replace (keep its exported types and signatures).
- games/giant-pup/src/sim.ts: `PetState` (fields hunger, thirst, fun, clean, energy 0..100; affection 0..100; tricks: Record<TrickId, number> 0..1; fetches; name) and `Mood`.
- games/giant-pup/src/config.ts: `TRICKS`, `TrickId`, `TRICK_LABEL`.

## Change
- games/giant-pup/src/ui.ts only. All CSS is injected once from createUi via a <style> element appended to document.head, with class names prefixed `pup-`.

Rules: `parent` is the shared `#ui` element (position fixed, inset 0, pointer-events none). Never restyle or hide `parent` itself. Append one root `<div id="pup-hud">` to it (pointer-events none, position absolute, inset 0); give every interactive element `pointer-events: auto`. Respect safe areas: pad with `env(safe-area-inset-top/right/bottom/left)`. All buttons ≥ 44x44 px, `touch-action: manipulation`, use `pointerdown`-free `click` handlers (click works for touch and mouse). Nothing hover-only. Friendly cartoon look: rounded white panels with 85% opacity, soft shadow, dark text, emoji icons.

Layout:
- Top-left panel `#pup-status`: dog name (big, bold; tap it to call `askName(state.name)`), a mood line with emoji (ecstatic 🤩 "Over the moon", happy 😊 "Happy", okay 🙂 "Fine", sad 😢 "Lonely", sleepy 😴 "Sleepy", hungry 🍖 "Hungry", thirsty 💧 "Thirsty", stinky 🦨 "Stinky"), and 5 meters `#pup-meter-<need>`: 🍖 Food (hunger), 💧 Water (thirst), 🎾 Fun (fun), 🛁 Clean (clean), ⚡ Energy (energy). Each a thin rounded bar whose fill width is the value %, coloured green > 60, amber > 30, red otherwise. Plus a small line "❤️ <affection rounded> · 🎾 <fetches>".
- Top-right: mute button `#pup-mute` (🔊 / 🔇), toggles and calls `h.onMute(muted)`.
- Bottom bar `#pup-actions` (centred, wraps on narrow screens): mode buttons `#pup-mode-pet` (✋ Pet), `#pup-mode-ball` (🎾 Ball), `#pup-mode-bath` (🛁 Bath) — the current `view.mode` one is highlighted; clicking calls `h.onMode(m)`. Then `#pup-feed` (🍖 Feed) → `h.onFeed()`, `#pup-water` (💧 Water) → `h.onWater()`, `#pup-tricks` (⭐ Tricks) toggles the trick menu.
- Trick menu `#pup-trick-menu` (hidden until toggled; a panel above the bottom bar): one button per trick `#pup-trick-<id>` in `TRICKS` order, label `TRICK_LABEL[id]` plus a 5-pip skill indicator (filled pips = round(skill*5)) and "✓" when skill ≥ 1. Clicking calls `h.onTrick(id)` and closes the menu. While `view.busy`, the trick buttons get the `disabled` attribute (and dim).
- Hint line `#pup-hint` just above the bottom bar: shows `view.hint` (small, white text with dark shadow, pointer-events none).
- Toasts `#pup-toast`: `toast(text)` shows a centred bubble in the upper third, replaces any current toast, fades out after 2 s (CSS transition on opacity; use setTimeout and clear the previous timer).
- Name dialog `#pup-name-dialog`: `askName(current)` shows a modal card "Name your giant pup" with a text input (maxLength 16, prefilled with current, autofocus) and an OK button `#pup-name-ok`; Enter also submits. On submit, trim; if 1-16 chars call `h.onRename(name)` and close; if empty keep it open. Keyboard events inside the input must not propagate to the canvas (stopPropagation on keydown).
- In landscape phones (max-height: 500px) shrink the status panel (smaller meters, 2-column meters) and the button labels (icon + short text, ~12px), so the middle of the screen stays visible. In portrait narrow screens (max-width: 480px) the bottom bar buttons are icon-over-label, 6 in a row filling the width (each ≥ 48px wide).

`update(s, view)` runs every frame: cache the last rendered value of each field (rounded meter %, mood, name, mode, busy, hint, trick pips, affection, fetches) and only touch the DOM when it changed.

## Contract
```ts
export type Mode = 'pet' | 'ball' | 'bath';
export interface UiHandlers {
  onFeed(): void; onWater(): void; onMode(mode: Mode): void; onTrick(trick: TrickId): void;
  onRename(name: string): void; onMute(muted: boolean): void;
}
export interface UiView { mode: Mode; mood: Mood; busy: boolean; hint: string; }
export interface Ui { update(s: PetState, view: UiView): void; toast(text: string): void; askName(current: string): void; }
export function createUi(parent: HTMLElement, h: UiHandlers): Ui;
```
The root element id must stay `pup-hud`; `#pup-actions` must exist from the first frame (the smoke test looks for both).

## Done when
- `cd games/giant-pup && npx tsc --noEmit` passes.
- Optional visual check: `npm run dev -w games/giant-pup` serves on port 5196 — do NOT start it; another worker may. Instead check by reading your CSS that every button has min-width/min-height ≥ 44px and pointer-events auto.

## Out of scope
Every other file: games/giant-pup/src/main.ts, brain.ts, dog.ts, scene.ts, fx.ts, audio.ts, config.ts, sim.ts, games/giant-pup/index.html.
