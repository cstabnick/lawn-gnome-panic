# E17 roadmap: underground societies

Brief: [../E17-underground-societies.md](../E17-underground-societies.md) (L28, L40, L50). Common rules for every issue:
[_common.md](_common.md). Issues: [issues/](issues/). Contracts for later epics: [contracts.md](contracts.md).
Screenshot pass: [screens.md](screens.md).

Three hidden communities, each a place, people, quests, achievements and lore:

- **The Underspan** (site `skyway-under`, beside the Unfinished Span): Hogweed Sprocket's inventors' commune: scrap
  shed (walk-in **Hogweed's Workshop**), scaffold towers and the **Roost** (a walkable scaffold deck, E05 rooftop), the
  **Updraft** (a hose-and-umbrella lift in the workshop that shoots you up onto the Roost), the Chute back down,
  manifesto boards. Quests `sq-underspan-verticality`, `sq-underspan-scrap-run`.
- **Wader's Rest** (site `cult-camp`): the Flock of the One Leg (the batch's cult, L40): the Standing Lady (a giant pink
  flamingo), the big tent (walk-in), a ritual circle where the player stands on one leg through a sermon (hold),
  grey everything. Quests `sq-flock-errands` (join), `sq-flock-vigil` (stay, or sit down and leave).
- **Loamdeep** (site `mole-entrance`, the Burrow Door): one large E05 interior (104 x 90 m) carved into six halls and
  tunnels; cute, misunderstood Burrowfolk; four mole jobs (Root Run, Lamplighter, Post Sorting, Dig a Nook); DJ
  Moleman's own burrow down the Long Tunnel; he comes up to play the Under-Chorus. Quests `sq-burrow-post`,
  `sq-loamdeep-lamps`, `sq-loamdeep-under-chorus`.

| Step | Who | Issues | Done when |
|---|---|---|---|
| 0 foundation | lead | — | `societies/config.ts` (all places, ids, cast), stubs for every module, `societies/save.ts` (`gta-societies-v1`, saveIO + cloud merge), `buildSocieties` in world.ts, `installSocieties` in app.ts (update, blips, isOpen, Subsoil speaker), Loamdeep interior def + Long Tunnel, quest givers + temporary unlock rows, map pins, empty prefab catalog files |
| 1 prefabs and systems | 11 workers + 1 writer | P1 moles, P2 Loamdeep kit, P3 Loamdeep home, P4 Underspan, P5 Flock, P6 gear + achievements, A2 one-leg idle, S1 sounds, J1 mole job rules, J2 post sorting game, J3 dig game, L1 lore | prefab, achievements, gnome tests; each issue's test |
| 2a building the places | 8 workers | B1 Underspan, B2 workshop, B4 Wader's Rest, B5 big tent, B7 Burrow Door, B8 Loamdeep earth, B9 west halls, B10 east halls | each builder's test, deck.test |
| 2b living parts and quests | 9 workers | B3 Underspan life, B6 Flock life, J5 sermon, B11 mole folk, B12 Moleman's burrow, J4 Loamdeep runtime, A1 achievement watch, Q1 Loamdeep quests, Q2 society quests | each test; then the lead: build, full tests, golden regen, lore, smoke, zfight, screenshots |

Decisions taken (no ask):
- Mole jobs are their own family with their own save, not a `WorkJobId`: E25 is adding workplace jobs on another branch
  at the same time and `Record<WorkJobId, ...>` in the career save would conflict. They reuse the E24 shift card.
- "Underground" is an E05 interior reached from the Burrow Door (no terrain tunnelling). Loamdeep is ONE large cell with
  carved earth (colliders + one-sided earth faces so the dollhouse camera sees through), plus DJ Moleman's burrow as a
  small hidden interior linked by stairs.
- The Underspan sits beside the Unfinished Span, never under it (`deck.test.ts` rules); "up" is the Roost, reached only
  by the Updraft.
- The cult is the Flock of the One Leg (story bible): harmless, satirical, no real-world religion; "leaving" is sitting
  down at the Long Vigil and being forgiven with a cup of reed tea.
- Side quests unlock temporarily after existing chapter quests (`quests/unlocks.ts`); E20/E21 move them to the 70-row
  spine (#10, #24/25, #27, #49/50, #53, #57). The main-story quests at these places (m10, m24, m25, m49, m51...) stay with
  E20/E21; they can reuse every place, interior and probe here.
- Online: places and people are static data every client builds; quest and job state is per player; nothing relayed.
- Mobile: every action is the E-prompt action button or a 44-88 px on-screen button (sorting grid, DIG, HOLD).
