Epic: E24-2 (workplace jobs, parallel build)
Depends on: none

## Environment
Read `docs/roadmaps/gta-batch-3/E24/_env.md` first.

## Goal
The Pay 'n' Glaze shop opens in **client mode** on a mechanic-job client's car: it starts from the client's look, the
price line shows parts against the client's budget, and instead of Buy there is "Hand back the keys", which reports the
final look and parts price to the job and closes the shop leaving the new look on the car. Nothing is charged to the
player and nothing is saved as the player's own loadout.

## Read first
- `games/gnome-theft-auto/src/glazeClient.ts`: `ClientOrder`, `clientOrderFor(v)`.
- `games/gnome-theft-auto/src/glazeShop.ts`: the whole file (`open`, `close`, `refreshPrice`, `buyBtn`, `quickBtn`,
  `handlingBtn`, `title`, `slogan`).
- `games/gnome-theft-auto/src/glazePanelRepair.ts`: the Repair tab uses `ctx.spend` (players pay for repairs).

## Change
- `games/gnome-theft-auto/src/glazeShop.ts`:
  - In `open(v)`: `const order = clientOrderFor(v);`. When `order` is set: `owned = normalizeLoadout(order.start)`
    (ignore `ownLook`/`ownedLoadout`), keep the order on the `OpenState` (`client: ClientOrder | null`), set
    `title.textContent = 'Work order: ' + order.title`, `slogan.textContent = '"' + order.brief + '"'`, hide
    `quickBtn` and `handlingBtn` (`style.display = 'none'`), `buyBtn.textContent = 'Hand back the keys'`, and add the
    class `gz-client` on `frame`. Panels whose `id === 'repair'` are left out in client mode (filter `panels`).
    When there is no order restore the normal texts/visibility (the shop is reused).
  - `refreshPrice()` in client mode: `Parts ${cost} 🌰 of ${order.budget} 🌰 budget` (append ` · OVER BUDGET` when
    cost > budget); the lines as now; `buyBtn.disabled = false` always (handing back unchanged is allowed: it just
    scores badly).
  - `buyBtn` click in client mode: `flushLook()`, `const cost = loadoutCost(st.owned, st.draft)`, keep the draft on the
    car: set `st.owned = normalizeLoadout(st.draft)` BEFORE closing so `close()` restores the new look (not the old),
    play 'door', call `close()`, then `order.finish(st.owned, cost)`. Do not call `deps.spend`, `saveOwnedLoadout`,
    `keepOwnLook` or `onPurchase`.
  - `close()` in client mode without handing back (✕, Escape): restore `order.start` on the car as now (owned), then
    call `order.cancel?.()`.
  - `GLAZE_CSS` is in `glazeUi.ts` (not yours): put any client-mode CSS (e.g. a pink "WORK ORDER" ribbon) in a small
    `<style id="gta-glaze-client-css">` injected once from glazeShop.ts.
- No other file.

## Contract
Uses `clientOrderFor` from `./glazeClient` as is. The normal (non-client) shop behaves exactly as before.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` has no errors in `glazeShop.ts`.
- `cd games/gnome-theft-auto && npx vitest run src/glazeStore.test.ts src/glazeAchievements.test.ts src/glazePanelRepair.test.ts src/vehicles.glaze.test.ts` passes.

## Out of scope
`glazeClient.ts`, `glazeUi.ts`, `garages.ts`, `app.ts`, every other file.
