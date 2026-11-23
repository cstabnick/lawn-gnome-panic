# Gnome Blackjack

Blackjack at a pub table of gnomes. CPU gnomes fill the five seats, banter in speech bubbles and mutter every line
aloud in a deep little babble (WebAudio, `src/mutter.ts`). Online by default: the page joins the public table on the
shared `@lawn/mp` server; the first player hosts, later players take a CPU's seat. Every bet and every decision has a
15-second clock.

- Run: `npm run dev -w games/gnome-blackjack` (port 5194). For online play locally, also `npm run dev -w packages/mp-server`.
- `#offline`: skip the server. `?room=CODE`: a private table. `/mutter-test.html` (dev): try the voices.
- Controls: bet with the + buttons, Deal me in (Space). H hit, S stand, D double, P split. Enter to chat (your line shows in a bubble).
- Views (button under the volume control, or V; remembered): **Table** (the whole table, slow drift) or **First person**
  from your gnome's eyes: drag to look around (the others see your gnome turn to look), double-click/double-tap to look back
  at the dealer. When you win, your gnome hops and the view hops with it.
- Rules: 4-deck shoe, dealer stands on all 17s, blackjack pays 3:2, double on any first two cards (also after a split).
  Split any pair of equal value (K+Q counts) up to 4 hands; split aces get one card each; 21 on a split hand pays 1:1.
  No insurance yet.
- Chips are your **Oakcount** chips (`@lawn/oakcount`), the same ones Club Gnome's Gnomecino Cashier sells and its
  Prize Counter takes. You sit down with what you have; every stake, double, split and payout is spent or won in the
  Oakcount, and so is every slot spin and slot win. Out of chips: the cashier button trades 🌰 10 for 🪙 100 (at the
  table and at the slots). A first-time player gets the one-time welcome acorns here too. Only CPU gnomes get a free
  stack when broke.
- Online: each player's own browser sends its Oakcount balance to the host as a `wallet` input, which sets that seat's
  chips between hands. During a hand the host's table is the truth and each browser books the changes it sees.

Code: `table.ts` + `cards.ts` (pure rules, host only), `banter.ts` (who says what), `scene.ts` (Three.js table),
`camera.ts` (table / first-person views), `hud.ts` (DOM), `net.ts` (transport), `app.ts` (wiring). Plan: `docs/roadmaps/gnome-blackjack.md`.
