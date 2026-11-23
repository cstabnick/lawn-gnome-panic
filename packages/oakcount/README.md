# @lawn/oakcount: the arcade's acorn account

One wallet for every game on the site: **acorns** (the arcade's money; canon: acorns are treasure), **chips** (the
Gnomecino's, bought with acorns and never turned back into acorns) and **owned** items (everything bought in a shop,
hair styles as `hair:<style>`). Club Gnome, the hub, is the first game to use it. Other games can pay out and charge
acorns through the same calls later.

- Stored in localStorage `oakcount.v1` (every game on the site shares the origin). Signed-in players get a cloud mirror:
  `@lawn/cloudsave` slot game `OAKCOUNT` (`gnome.common.v1.Game.GAME_OAKCOUNT`), merge mode: the side with the newer
  `rev` wins, and purchases are a union, so they are never lost.
- It is a client-side wallet, trusted like a save file and not like a bank. Do not hang anything competitive on it.

```ts
import { loadOakcount, getAcorns, earnAcorns, buyChips, buyItem, owns, onOakcountChange, OAK } from '@lawn/oakcount';

await loadOakcount();                     // once at startup (after finishing a sign-in)
earnAcorns(5);                            // a pickup, a prize
buyChips(10);                             // 10 acorns -> 10 * OAK.chipsPerAcorn chips (one way)
claimFreeChips();                         // free top-up: up to +100 chips for no acorns, never above 100 (OAK.freeChipsCap)
winChips(30);                             // chips won at a Gnomecino table or slot machine
spendChips(10);                           // a bet or a spin
buyItem('card-fan', 400, 'chips');        // false when owned already or not affordable
onOakcountChange((s) => draw(s.acorns, s.chips));
```

The rules are pure functions in `src/ledger.ts` (tested in `src/oakcount.test.ts`); `src/oakcount.ts` is the runtime.
Check: `npm test -w packages/oakcount`.
