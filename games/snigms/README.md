# Snigms

A gnome life sim. You make a household (one gnome), build its house a wall at a time on a tile grid, furnish it, keep the gnome's needs met, and send it to a job for acorns to pay the bills. Outside the house is the Town Square: the gnome goes out for evenings, chats with its neighbours, and has a temper of its own.

## Run

```
npm run dev -w games/snigms
```

Open http://localhost:5203.

## Play

- **Build**: drag along the tile grid to lay walls. Tap an edge to put a door or a window in it. Paint floors on tiles. Build and furnish work at home only: while the gnome is in town the lot on screen is the town.
- **Furnish**: the furnish tab has five groups: bedroom, bathroom, kitchen, living room and decor. Pick an item, then place it on a tile.
- **Select and move**: tap a placed item to select it, then move it or sell it (sells back at 70%).
- **Camera**: pan, zoom and orbit the lot.
- **Speed**: pause or run at one of three speeds from the clock panel. At 1x one sim day is about 12 real minutes.
- **Jobs**: the jobs panel lists the four jobs. Pick one and the gnome walks to the carpool stop and leaves for work.
- **Suggest**: tap a placed item in live mode to suggest the gnome uses it. The gnome may ignore you (see below).
- **Town**: the **Town** tab shows where the gnome is, how it feels, today's plans and the neighbours. "Ask to go to town" and "Ask to head home" are suggestions too. "Say hello" asks the gnome to chat with a neighbour in town.

Every action works by touch as well as by mouse or keyboard. The HUD fits a portrait or landscape phone with safe-area insets.

## The gnome

Five needs decay over time: **hunger**, **energy**, **bladder**, **hygiene** and **fun**. The gnome looks after them by itself, using the furniture it is standing near (bed, toilet, bathtub, fridge, stove, tv and so on). When a need drops low it acts on it. Mood is a weighted mix of all five. Bills arrive every midnight as snail-mail, charged in acorns.

Traits change how the needs decay:

| Trait | Blurb |
|---|---|
| Neat | Hygiene fades slowly. Hates a mess, loves a bath. |
| Glutton | Always hungry, but a good meal goes a long way. |
| Sleepy | Tires quickly. Bed is the best furniture. |
| Goofy | Gets bored fast. Telly is life. |
| Hustler | Earns 20% more per shift, but plays less. |

### Its own mind (temper)

The gnome has a **temper** (0 to 100). It drifts toward the gnome's mood, falls while a need is critical, and falls by 10 each time the gnome ignores you. Bills it cannot pay cost 15.

- **Suggestions** (tapping furniture, asking for a trip, saying hello) are followed with a chance set by temper: nearly always when calm, a coin toss when stewing, never under 20.
- **Crash-out**: when temper drops under 15, the gnome may crash out (a roll each sim hour). For about 2.5 sim hours it ignores every suggestion and sulks, and only acts on a critical need. Temper resets to 45 when it ends. The first crash-out is an achievement.

### Its schedule

- **Work**: the job's shift, as before.
- **Evening out**: between 17:00 and 22:00 the gnome may walk to town, once a day. It stays about 2.5 sim hours, and heads home at 22:00 (bedtime).
- **Needs**: a need nothing in town fixes sends the gnome home for it.

## Town

The Town Square is a level document (`src/data/levels/town.level.json`), edited in the level editor (`npm run level-editor`, then `?game=snigms`). It holds the Spore & Sprout cafe (the mushroom coffee is a hunger and fun need), the post office, the fountain square, a park with benches and a picnic table, and the cottages behind the neighbours. The gate is where a trip arrives and leaves.

Four neighbours (see `src/people.ts`) keep a routine through the day. They walk to their spot, idle, and wander a little. When the gnome is in town and a neighbour is close, that neighbour runs about nearby.

| Neighbour | Role | Spot in the day |
|---|---|---|
| Chervil Hammerclod | Cook, Spore & Sprout | the cafe, then the square |
| Nettle Haybale | Postgnome | the post office, then the park |
| Mallow Clayfoot | Retired mower mechanic | the park, the cafe at noon, then the square |
| Wren Splitwell | Teenager of the square | the square, the park, the square |

A chat is about three real seconds: both lines show in the toast stack, and friendship grows by 4. Friendship runs Stranger, Acquaintance (20), Friend (50) and Best friend (80). A neighbour talks to the gnome again only after an hour of sim time.

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
| `config.ts` | All tuning numbers and tables: furniture (incl. the town's), needs, traits, jobs, costs, speeds, the town, temper and friendship |
| `world.ts` | The lot: walls, doors, windows, floors, placed furniture, carpool stop |
| `town.ts` | The town lot, read from the level document; its named spots and the gate |
| `data/levels/town.level.json` | The town square, a level document (the level editor saves it) |
| `people.ts` | The four neighbours: looks, routines and lines |
| `npcs.ts` | The neighbours walking the town; running about the gnome |
| `sim.ts` | Pure simulation: needs, mood, bills, time, temper and crash-outs, friendship |
| `actions.ts` | Player actions: build, furnish, sell, move |
| `brain.ts` | The gnome's choices: needs, work, trips, chats, and how it weighs suggestions |
| `view.ts` | The 3D view: lot, walls, furniture (via `@lawn/prefabs`), gnome and neighbours (via `@lawn/gnome`) |
| `tools.ts` | Build and furnish tools, touch and mouse input |
| `ui.ts` | The DOM HUD: clock, funds, need bars, tabs, panels, toasts |
| `ui-town.ts` | The Town panel: status, trip, today's plans, neighbours |
| `create.ts` | Making the household at the start |
| `audio.ts` | Generated sound effects |
| `achievements.ts` | Achievement events, via `@lawn/achievements` |
| `main.ts` | Wires everything together and runs the loop |
| `save.ts` | Saves to localStorage (`snigms.save.v1`) |

## Not done yet

- One gnome only. The neighbours live in town; they do not visit the house.
- No online play. A later "visit a neighbour's house" could use `@lawn/mp`.
- No second floor. The lot is a single storey.
- No party slice (see the backlog in `packages/party/README.md`).

## Mobile

Yes: every action has a touch control, targets are at least 44 px, and the layout works at 390x844 in portrait and in landscape.

## Online

Not yet. The game has one gnome and no other players to sync, so `@lawn/mp` would add a lot of size for nothing right now.

## Achievements and lore

Achievements are defined in `packages/achievements/src/catalog.ts` and the gnome's Snigms rewards show up in the Gnome Creator. The new town achievements are Out on the Town, Neighbourly, Best of Neighbours, Had a Moment and Fine, Whatever. The Yard lore for this game is in `docs/lore/entries/the-yard/snigms-households.md`, the town in `snigms-town.md`, and the neighbours in their own entries. Design notes are in `docs/roadmaps/snigms.md`.

## Dev flags

- `?quick=starter` or `?quick=empty` skips the start screen (smoke checks, demos). `?panel=town` opens the Town panel on load (demos). `?debug` exposes the shared state as `window.snigms`.
