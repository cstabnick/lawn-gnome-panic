# Snigms

A gnome life sim. You make a household (one gnome), build its house a wall at a time on a tile grid, furnish it, keep the gnome's needs met, and send it to a job for acorns to pay the bills.

## Run

```
npm run dev -w games/snigms
```

Open http://localhost:5203.

## Play

- **Build**: drag along the tile grid to lay walls. Tap an edge to put a door or a window in it. Paint floors on tiles.
- **Furnish**: the furnish tab has five groups: bedroom, bathroom, kitchen, living room and decor. Pick an item, then place it on a tile.
- **Select and move**: tap a placed item to select it, then move it or sell it (sells back at 70%).
- **Camera**: pan, zoom and orbit the lot.
- **Speed**: pause or run at one of three speeds from the clock panel. At 1x one sim day is about 12 real minutes.
- **Jobs**: the jobs panel lists the four jobs. Pick one and the gnome walks to the carpool stop and leaves for work.

Every action works by touch as well as by mouse or keyboard. The HUD fits a portrait or landscape phone with safe-area insets.

## The gnome

Five needs decay over time: **hunger**, **energy**, **bladder**, **hygiene** and **fun**. The gnome looks after them by itself, using the furniture in the house (bed, toilet, bathtub, fridge, stove, tv and so on). When a need drops low it acts on it. Mood is a weighted mix of all five. Bills arrive every midnight as snail-mail, charged in acorns.

Traits change how the needs decay:

| Trait | Blurb |
|---|---|
| Neat | Hygiene fades slowly. Hates a mess, loves a bath. |
| Glutton | Always hungry, but a good meal goes a long way. |
| Sleepy | Tires quickly. Bed is the best furniture. |
| Goofy | Gets bored fast. Telly is life. |
| Hustler | Earns 20% more per shift, but plays less. |

## Jobs

| Job | Hours | Start | Where |
|---|---|---|---|
| Gardener | 8 h, Mon to Fri | 08:00 | Weeds, hedges and fertiliser |
| Mailgnome | 7 h, Mon to Sat | 07:00 | Letters across the Yard before the dogs wake |
| Mushroom Chef | 8 h, Tue to Sat | 15:00 | Evening shifts at the Spore & Sprout |
| Mower Mechanic | 8 h, Mon to Fri | 09:00 | Oil, blades and the occasional escaped mower |

Each job has three levels (for example Weed Puller, Hedge Trimmer, Head Gardener). Pay rises with each promotion. Working drains the needs faster.

## Files

Under `games/snigms/src/`:

| File | What |
|---|---|
| `types.ts` | Shared types. Coordinates and edge keys are defined here |
| `config.ts` | All tuning numbers and tables: furniture, needs, traits, jobs, costs, speeds |
| `world.ts` | The lot: walls, doors, windows, floors, placed furniture, carpool stop |
| `sim.ts` | Pure simulation: needs, mood, bills, time |
| `actions.ts` | Player actions: build, furnish, sell, move |
| `brain.ts` | The gnome's choices: what to do next, when to go to work |
| `view.ts` | The 3D view: lot, walls, furniture (via `@lawn/prefabs`), gnome (via `@lawn/gnome`) |
| `tools.ts` | Build and furnish tools, touch and mouse input |
| `ui.ts` | The DOM HUD: clock, funds, need bars, tabs, panels, toasts |
| `create.ts` | Making the household at the start |
| `audio.ts` | Generated sound effects |
| `achievements.ts` | Achievement events, via `@lawn/achievements` |
| `main.ts` | Wires everything together and runs the loop |
| `save.ts` | Saves to localStorage (`snigms.save.v1`) |

## Not done yet

- One gnome only. No visitors.
- No online play. A later "visit a neighbour's house" could use `@lawn/mp`.
- No second floor. The lot is a single storey.
- No party slice (see the backlog in `packages/party/README.md`).

## Mobile

Yes: every action has a touch control, targets are at least 44 px, and the layout works at 390x844 in portrait and in landscape.

## Online

Not yet. The game has one gnome and no other players to sync, so `@lawn/mp` would add a lot of size for nothing right now.

## Achievements and lore

Achievements are defined in `packages/achievements/src/catalog.ts` and the gnome's Snigms rewards show up in the Gnome Creator. The Yard lore for this game is in `docs/lore/entries/the-yard/snigms-households.md`. Design notes are in `docs/roadmaps/snigms.md`.

## Dev flags

- `?quick=starter` or `?quick=empty` skips the start screen (smoke checks, demos). `?debug` exposes the shared state as `window.snigms`.
