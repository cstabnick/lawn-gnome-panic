# Quest fuzzer

A seeded, headless fuzzer on top of the quest sim (`games/gnome-theft-auto/src/questSim/`). It plays a quest with the sim
bot, injects **one disruption** at a random objective and time, and reports whether the quest still finished. Use it to
find edge cases to handle in the quest framework or with one-off fixes.

```
npm run quest-fuzz -w games/gnome-theft-auto -- [--seed 7] [--quest a,b] [--per-quest 3] [--all-disruptions] [--out dir]
```

The same seed gives the same plans (quest, ending, disruption, step, frame 0..5 after the objective becomes active; idle-wait then waits 120 sim s). All sim cheats stay on (instantTravel too), and a bot solver failure is retried twice (`RunOpts.solverRetries`) so the game's response is what gets tested. Output: `fuzz.md` (printed at the end) and
`fuzz.json` in `--out` (default `<tmp>/gta-quest-fuzz/<stamp>`). `nc-party` is skipped (it needs a relay).

## Disruptions (`src/questSim/fuzz/disruptions.ts`)

| Id | What it does |
|---|---|
| destroy-vehicle | the player's vehicle, else the nearest quest-owned one within 200 m, is exploded |
| sink-vehicle | same pick, ground vehicles only: `sunk = true` |
| teleport-away | out of the vehicle, then 400 m away (inside the world) |
| crack-player | as app.ts on death: leave the vehicle, `quests.onPlayerDown()`, else go to the hospital |
| despawn-npc | a quest NPC is removed from the world (a buggy cleanup) |
| exit-vehicle | the player gets out |
| idle-wait | 120 sim s with no input |
| heat-4 | `watch.addHeat(4)` (noHeat / noWanted cheats are off for this run) |
| save-reload | save and reload right before the step (`RunOpts.reloadBeforeStep`); quests with more than one objective |
| traffic-sweep | what traffic.ts cleanup does: unattended, unpinned, non-quest vehicles over 60 m away are removed |

The sim has no traffic.ts or app.ts, so traffic-sweep and crack-player mirror them by hand. Keep them in step with the
real code.

## Outcomes

- **recovered**: the quest still finished with every sim check passing.
- **bug**: the game broke: a failed check, an exception, a **softlock** (no objective line and no objective blip for 45 sim
  s after the disruption) or a **pinned vehicle removed** (a vehicle in `quests.pins.vehicles()` left the vehicle list).
- **bot**: the bot could not cope (often fine for a player, e.g. the quest ride is gone and the solver has no plan B).
  Read the reason before filing it as a game bug.
- **content** / **blocked**: as in the quest sim.
- **not-applied**: the objective never became active, or there was nothing to disrupt (no vehicle, no quest NPC).
  Ignore these; change the seed.

## Reading the report

The summary line counts outcomes. The table lists each run (quest, ending, disruption, step, seconds into the step,
outcome, the note of what was done and the failure reason). The last table counts outcomes per disruption: a disruption
with many `bug` rows points at a framework gap; one quest with many points at a one-off.

## Adding a disruption

Add an id to `DisruptionId` and an entry to the `list` in `disruptions.ts` (`applies(s)` says whether it can act now,
`apply(s, rng)` acts through `RunSession` only and returns a one-line note). `planFuzz` picks it up from `DISRUPTION_IDS`.
