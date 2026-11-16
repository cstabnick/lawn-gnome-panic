# Gnome Blackjack

Goal: blackjack at a pub table of gnomes. CPU gnomes fill the five seats and banter in speech bubbles, muttering each
line aloud in a deep Animal-Crossing-style babble. Online by default (the shared `@lawn/mp` server, game id
`gnome-blackjack`): the first player hosts, others drop in and take a CPU's seat, and every bet and decision has a
15-second clock so nobody waits on a slow gnome.

| Epic | Done when | Issues |
|---|---|---|
| 1 Foundation (written by the planner) | scaffold, `config.ts` contracts, `characters.ts`, `app.ts` wiring, stubs for every module; tsc passes | 0 |
| 2 Modules | `npm run build -w games/gnome-blackjack` and `npm test -w games/gnome-blackjack` pass; an offline table plays itself | 6 |

Epic 2 issues (each file is the full issue; `_env.md` is the shared environment section):

- [2A rules](gnome-blackjack/2A-rules.md): `cards.ts`, `table.ts`, `table.test.ts`
- [2B banter](gnome-blackjack/2B-banter.md): `banter.ts`, `banter.test.ts`
- [2C mutter](gnome-blackjack/2C-mutter.md): `mutter.ts`, `mutter-test.html`
- [2D scene](gnome-blackjack/2D-scene.md): `scene.ts`
- [2E hud](gnome-blackjack/2E-hud.md): `hud.ts`
- [2F net](gnome-blackjack/2F-net.md): `net.ts`

Party slice: later (see the backlog row in `packages/party/README.md`).

## Result (after epic 2)

All six issues landed; build and 14 tests pass. Checked by the planner with Playwright on desktop, iPhone 13 portrait
and landscape (tap to bet, deal in, stand, chat), and two players online through a local mp-server (room code, bets
and chat reach the host, host leaves → the other player takes over).

Fixed at the end-of-epic check: phone layout (overhead camera on portrait/short screens, compact plates and bubbles,
safe areas, plates kept on screen, controls hidden while typing), pings and table clocks on wall-clock time (a slow
device was dropped as silent), a hidden host tab keeps ticking once a second, random guest names.
