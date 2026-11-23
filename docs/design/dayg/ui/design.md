# DayG UI redesign

The UI that meets the [user stories](user-stories.md) (S01-S40). What is wrong today: [current-ui.md](current-ui.md).
Build plan: [dayg-11-ui-redesign.md](../../../roadmaps/dayg-11-ui-redesign.md). Story codes in brackets after each rule
say which stories it satisfies.

## Principles

1. **Quiet by default, numbers on demand.** The always-on HUD is small; detail lives one tap away in the status sheet.
   [S01, S02, S06]
2. **One way to open and close anything.** Every panel is a sheet from the shared layout module. [S22, S23]
3. **Never colour alone.** Every state has a word or a mark (`!`, `!!`, `SAFE`, a pressed outline) as well as a colour.
   [S10]
4. **Fixed places for thumbs.** Touch buttons never move or vanish; they dim and say why. [S28, S29]
5. **Tokens, not values.** Colour, type size, spacing and target size come from `src/ui/theme.ts`; no module writes a
   hex colour or a px font size of its own. [S36, S37]

## Screen map

```
Play (always): HUD zones status, clock, corner, alerts, busy, prompt; touch controls
 ├─ Tab / I / PACK / searching a container ─► Pack sheet (tabs: You · <container> · Make)
 ├─ M / MAP ────────────────────────────────► Map sheet (picture or list)
 ├─ tap the status cluster ─────────────────► Status sheet
 ├─ hold E / long-press ACT / tap "+n" ─────► Action list sheet
 ├─ Esc (no sheet open) / ☰ ────────────────► Settings sheet
 ├─ talk, board, ledger, room, build ───────► their sheets (phases 4-8 panels, own triggers)
 └─ death ──────────────────────────────────► Recap (alert dialog, not closable)
```

- One sheet at a time: opening a sheet closes the one that is open. [S23]
- While a sheet is open: touch controls hide, movement input is ignored (as today), pointer lock is released on
  desktop. [S22]
- Esc (desktop) closes the open sheet; with no sheet open it opens Settings. The Close button is always in the sheet
  header, top-right, 48 x 48. [S22, S23]
- Solo play does not pause for the pack or the map (reading the pack is part of the danger). It pauses (clock rate 0)
  only while Settings is open and while the tab is hidden. [S09 casual play, S23]

## Zones (the layout module)

All zones sit inside the safe-area insets. All sizes are CSS px at text scale 1; zones grow with text scale and the
layout module re-checks them (see Text scale).

| Zone | Portrait (390 x 844) | Landscape (844 x 390) | Holds |
|---|---|---|---|
| `status` | top-left, max 46% wide | top-left, max 30% wide | needs strip, noise, body figure and its line |
| `clock` | top-right, max 50% wide | top-right, max 34% wide | `hh:mm · Day n`, weather word, SAFE badge, place (4 s) |
| `corner` | under `clock`, a right-aligned row | same | PACK, MAP, ☰ buttons (48 px) |
| `alerts` | under the status cluster, full width minus 16 px each side | top centre, middle third | alerts (max 3) and the hint card |
| `busy` | above `prompt` | above `prompt` | busy bar with label and percent |
| `prompt` | bottom centre, `bottom = inset + 244` (above the touch block) | middle third, `bottom = inset + 16` | interaction prompt |
| `controls` | whole screen layer | whole screen layer | stick, look-drag, touch buttons |

The touch block is at most 232 px tall in portrait (`CONTROLS_PORTRAIT_H`), so `prompt` is at
`232 + 12` above the bottom inset. [S08, S28]

## HUD: always on and on demand

Always on:

- **Needs strip** (status zone): four rows, Warm, Water, Food, Calm. Each row: the name (hud font, 14 px), a bar
  (8 px tall, track and fill from tokens) and, when low, a mark and a word: under 30 `!` and "low", under 10 `!!` and
  "critical", at 0 "harming you". The colours (ok, warn, danger) repeat the word; they never carry it alone.
  [S01, S10]
- **Noise** line under the needs: "Noise: quiet" (radius under 8 gm), "heard nearby" (8-16), "loud" (over 16), from
  `HudState.noise`. [S03]
- **Body figure** (the current SVG) with one line under it naming the worst condition: "Left leg cracked", "Right arm
  deep crack", "Moss: rooting". Nothing when the body is whole. [S04, S05]
- **Clock** line: `hh:mm · Day n`, then the weather word ("storm"). A moon mark at night is kept, with the word
  "night" in its `aria-label`. [S06]
- **SAFE badge** while in a haven: a plate reading "SAFE · <haven name>" with a shield mark. [S07]
- **Corner buttons**: PACK, MAP, ☰ (settings). Desktop users can click them too. [S22, S23]
- The whole status cluster is one button (`aria-label` sums it up: "Status. Warm fine. Water low, 24. ...") that opens
  the status sheet. [S01, S38]

On demand (shown only while true):

- Stamina row, while stamina is under 100. [S02]
- Carry line, while weight is over 80% of capacity: "Heavy 7.1 / 8 kg", or "Overloaded 9.2 / 8 kg". [S02, S19]
- Place name, for 4 s after the region changes. [S02]
- Busy bar with its label and percent ("Lighting a fire · 40%"), `role="progressbar"`. [S10]
- Alerts (the `hint` bus event and achievements): at most 3, each fades after 3 s (instantly hidden with reduced
  motion), each also announced politely. [S08, S39, S40]
- First-hour hint card (see Hints). [S09]

Status sheet (one tap away): every need with its number, word, and "falls with / restored by" line from
`docs/design/dayg/survival.md`; six body parts in words (fine, chipped, cracked, deep crack, broken); the moss block
("Moss in the left arm: rooting, stage 2 of 4. 3.5 h since the bite. Scrape and seal it: salt wash or spirit."); the
full clock (time, day, season, weather); place and haven; stance; carry; noise. [S04, S05, S06]

## Interaction prompt and context actions

- **One primary action per spot:** the nearest labelled interactable. Others in reach count as "more". [S12]
- **Text:** `<verb phrase>` exactly as the interactable labels it ("Search the crate"); with keys the bar starts with a
  key cap `E`; on touch the bar has no key cap and the ACT button shows the first word in capitals ("SEARCH"). [S11]
- **More:** when other actions are in reach the bar ends with "+n" (touch: a 44 px "+n" button; keys: "hold E").
  Hold E 0.45 s, or long-press ACT 0.45 s, or tap "+n" opens the **action list** sheet: one 56 px row per action,
  number keys 1-9 pick on desktop. [S12]
- **Notes:** a prompt may carry one short note line under the verb (dirty water, "dark inside", "needs a rope").
  [S13, S14]
- **Kinds:** `act` (default), `climb` (the climb hint), `enter` (a door or crypt mouth: note line shows what is known
  of the inside), `blocked` (shown dim with its reason, not tappable, e.g. "Too high to climb: needs a rope"). [S13,
  S14, S29]
- The prompt bar itself is a button on touch (56 px tall) that runs the primary action, so a one-thumb player can tap
  it. [S11, S30]
- Prompt changes are announced politely, at most once every 1.5 s, and not while the text is unchanged. [S39]

Interior prompt: when interiors (crypts, the shed) land, their doorway interactables use `kind: 'enter'` with a note
built from what the player knows (light, last noise heard, Hatless seen going in). Inside, the camera keeps its pull-in
rule and the follow mode eases only, never snaps through walls. [S14, S15]

## Pack screen

Opened by Tab, I, PACK, or by searching a container (opens on that container's tab).

**Portrait (sheet 85% of the height, bottom):**

```
┌ Pack ───────────────────────── [✕] ┐
│ [You] [Crate] [Make]               │  tabs (role=tablist), 44 px
│ (All)(Food)(Water)(Medicine)(Tools)│  filter chips, scroll sideways
│ Hands: [hand][hand 2]  Worn: 4 slots│
│ ┌ icon  Bread loaf ×1   0.3 kg  good┐│  one 56 px row per stack
│ │ actions: [Eat] [Hold] [Drop]       ││  inline, under the tapped row
│ └ ...                              ┘│
│ 2.3 / 8 kg · 3.6 / 16 L            │  footer, sticky
└─────────────────────────────────────┘
```

**Landscape and desktop (sheet on the right, 62% wide in landscape, 720 px max on desktop):**

```
┌ Pack ─────────────────────────────────────────── [✕] ┐
│ filters                                               │
│ ┌ You ─────────────────┐  ┌ Crate / Make ───────────┐ │
│ │ hands, worn, rows    │  │ rows with Take; Take all│ │
│ └──────────────────────┘  └─────────────────────────┘ │
│ footer totals                                          │
└────────────────────────────────────────────────────────┘
```

- In landscape the left 38% stays open so the world and the stick side are visible. [S20]
- Each row: icon (`prefabIconElement`, 40 px), name and count, weight in kg, condition word (good over 0.5, worn over
  0.2, failing) plus the bar. The whole row is a button; the selected row has a 3 px outline and `aria-pressed`. [S18,
  S10]
- Item actions come from `use.actionsFor(ref)`; container rows have Take; the container tab has Take all. [S16]
- Make tab: every recipe from `use.recipes()`; ones that cannot be made are disabled and show `why` beside them as
  text. [S17]
- Filter chips by item `resource`: All, Food, Water, Medicine, Tools, Fuel, Materials. [S21]
- Footer: `w / cap kg · b / cap L`, and the word "Overloaded" when over. [S19]
- No drag and drop (out of scope).

## Touch layout

```
portrait (right hand)                         landscape (right hand)
┌──────────────────────────────┐   ┌──────────────────────────────────────────────┐
│status            clock       │   │status                 clock                   │
│                  [PACK][MAP][☰]  │                       [PACK][MAP][☰]          │
│alerts                        │   │            alerts                [VIEW]       │
│                              │   │                                  [CROUCH][UP] │
│                       [VIEW] │   │  stick zone        prompt        [ACT ] [HIT] │
│        prompt                │   └──────────────────────────────────────────────┘
│ stick zone   [CROUCH] [UP]   │
│              [ ACT ]  [HIT]  │
└──────────────────────────────┘
```

- Block: 220 x 232 px anchored to the bottom-right safe corner (bottom-left with Hand: left, and the stick zone moves to
  the right 45%). [S28, S31]
- ACT 72 px (primary, shows the verb; dim "ACT" when nothing is in reach), HIT 72 px, CROUCH 56 px (reads "CROUCH" when
  standing, "STAND" when crouched, `aria-pressed`), UP 56 px (reads "CLIMB" and is bright when a climb is possible,
  dim "UP" otherwise), VIEW 48 px. [S11, S29, S32]
- Long-press ACT (0.45 s) opens the action list and does not also run the primary action. [S12]
- Stick: floating, 120 px base, sprint ring drawn at 90% travel. Look-drag anywhere outside the stick zone and the
  buttons. [S28]
- Camera follows (setting, on by default on touch): when there has been no look input for 1.2 s and the gnome moves
  forward or sideways, the camera eases behind the walk direction (never when walking backwards). [S30]
- Labels at the hud font (14 px at scale 1) on an opaque plate token. [S36, S37]

## Map screen

- Sheet, full size. An SVG of the map outline; regions you have stood in are filled and named; others are a faint
  outline with no name; both havens are always named. Your position is an arrow pointing your facing; north is up,
  with an N mark. No quest markers, ever. [S25]
- Zoom buttons (+, −, 44 px) and a "List" toggle: a `role="list"` of known places with distance in gm and an
  eight-point bearing word ("The Tap: 180 gm north"). [S26, S27]
- Visited regions are kept for the session (the player's memory); a found map item will fill more later.

## Recap

- An alert dialog over everything (`role="alertdialog"`, focus moves to its title, the title is announced
  assertively). Not closable: the only ways out are its buttons. [S33, S39]
- Title (the cause), an ordered list of up to 8 last events, "Day n, hh:mm, in the <place>", the statistics line, a
  tip for the cause (for example hatless: "Climb: the Hatless cannot follow you up."), the Hatless-rising line for
  Hatless and moss deaths. [S33, S34]
- Buttons, 56 px tall, full width: "Walk again" (new seed) primary, "Same world" (same seed) secondary. Any respawn
  buttons the phases 4-8 work added stay, styled the same. [S35]

## Hints (first hour)

A card in the alerts zone, one at a time, each shown once per profile (`localStorage` key `dayg.ui.hints`), with "Got
it" and "No more hints" (44 px). Steps: how to walk (device-specific text) if not moved in 10 s; "Climb down the
ladder" on the Gate Roof; "Search the crate" near the first container; "Find water: the Tap" when water is under 60;
"Light a fire before dark" after 18:00 with no fire lit; "Sleep in a haven" at night outside a haven. Off when the
Hints setting is off. [S09]

## Settings sheet

Theme (Dark, High contrast), Text size (100%, 125%, 150%, 200%), Reduce motion, Hand (Right, Left), Camera follows,
Hints, Read alerts aloud (live regions), and a Controls list (every action with its key and its touch control).
Segmented choices are `role="radiogroup"` of 44 px buttons; toggles are buttons with `aria-pressed`. Saved in
`localStorage` (`dayg.ui.prefs`); URL overrides for tests: `ui-theme`, `ui-scale`, `ui-hand`, `ui-motion`. [S31, S36,
S37, S40]

## Text scale and contrast rules

- Type tokens at scale 1: small 14, hud 14, label 15, body 16, title 20 px. **No text under 14 px at scale 1**; every
  size multiplies by the text scale (1, 1.25, 1.5, 2). [S36]
- At any scale, zones may grow but must not overlap one another or a touch button; the status cluster wraps instead of
  running under the clock; sheets scroll. The audit checks it at every scale. [S36]
- Every text sits on a plate token (opaque, or at least 0.85 alpha over the scene). No text-shadow-only text. [S37]
- Dark theme: text and dim text at least 4.5:1 on plate and strong plate; ok, warn and danger at least 4.5:1 on plate;
  focus ring and borders at least 3:1. High-contrast theme: every text and state colour at least 7:1, focus and
  borders at least 4.5:1. A unit test computes the ratios from the tokens. [S37]
- Reduce motion (setting or `prefers-reduced-motion`): no pulse, no fade, no slide; state changes are instant. [S40]

## Accessibility rules

- **Names:** every button has visible text or an `aria-label`; icon-only buttons always have an `aria-label`
  ("Open pack", "Close map"). [S38]
- **Targets:** at least 44 x 44 px for every control (`target.min`), 56 for the main touch buttons, 72 for ACT and HIT.
  [S28]
- **Focus:** a 3 px focus ring (`:focus-visible`) in the focus token. Opening a sheet moves focus into it (the first
  control, else Close); Tab and Shift+Tab stay inside it; closing returns focus to what opened it. Focus order is
  reading order: header, tabs, filters, list, actions, footer. [S38]
- **Dialogs:** sheets are `role="dialog"` with `aria-modal="true"` and `aria-labelledby` their title; the recap is
  `role="alertdialog"`. [S23, S33]
- **Live regions:** `#dayg-live-polite` (alerts, prompt changes, a need turning low) and `#dayg-live-assertive` (a need
  turning critical, a hit taken, death); visually hidden; the same text is not repeated within 3 s; off with the "Read
  alerts aloud" setting. [S39]
- **No colour-only signal:** see Principles 3. Selected, pressed and disabled states use an outline, `aria-pressed` or
  `aria-disabled` and a word. Disabled controls stay focusable and say why (`title` and visible text). [S10, S29]
- **The 3D view** is not readable by a screen reader; DayG does not claim to be blind-playable. Everything in DOM is.
- **Minimums the audit enforces:** font 14 px, target 44 px, accessible name on every control, nothing outside the
  viewport, no running animation with reduce motion.

## Build menu, talk, board, ledger and room panels

These come from the phases 4-8 roadmap. Each becomes a sheet from the layout module (same header, Close, focus and
Esc rules) and uses the shared buttons. The build menu lists pieces by category tab; each row names the piece, its
materials as "Needs 2 planks (you have 1)", its build time, and a disabled reason in words. Placement mode uses the
prompt bar (`kind: 'act'`, "Place the wall", note "Esc or ✕ to cancel"). [S23, S24]
