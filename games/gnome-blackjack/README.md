# Gnome Blackjack

Blackjack at a pub table of gnomes. CPU gnomes fill the five seats, banter in speech bubbles and mutter every line
aloud in a deep little babble (WebAudio, `src/mutter.ts`). Online by default: the page joins the public table on the
shared `@lawn/mp` server; the first player hosts, later players take a CPU's seat. Every bet and every decision has a
15-second clock.

- Run: `npm run dev -w games/gnome-blackjack` (port 5194). For online play locally, also `npm run dev -w packages/mp-server`.
- `#offline`: skip the server. `?room=CODE`: a private table. `/mutter-test.html` (dev): try the voices.
- Controls: bet with the + buttons, Deal me in (Space). H hit, S stand, D double. Enter to chat (your line shows in a bubble).
- Rules: 4-deck shoe, dealer stands on all 17s, blackjack pays 3:2, double on any first two cards. No splits or insurance yet.

Code: `table.ts` + `cards.ts` (pure rules, host only), `banter.ts` (who says what), `scene.ts` (Three.js table),
`hud.ts` (DOM), `net.ts` (transport), `app.ts` (wiring). Plan: `docs/roadmaps/gnome-blackjack.md`.
