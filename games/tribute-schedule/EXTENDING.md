# Extending The Tribute Schedule with New Responses

This game is built around a declarative lore registry (`src/lore/`) and a runtime Discord/whalebot parser (`src/lore/parser.ts`), so new server shitposts can be added in two ways:

## 1. Paste Directly In-Game (Instant)
1. Click **Paste New Responses** on the title screen, or press **`L`** (`LEDGER [L]`) during play.
2. Paste raw Discord/whalebot messages (timestamps, `whalebot`, `whalebot-dev`, and `view prompt` markers are stripped automatically).
3. Click **Inject Responses**.
   - Lines mentioning `cone`, `microwave`, `fridge`, `smoke detector`, `toaster`, `printer`, or `horse hockey` are routed to that entity's active whisper/incident pool.
   - Lines mentioning `scammed`, `price point`, `ledger`, or `fee` are added to the Printer's **Scam Ledger** pool.
   - Lines mentioning `offering` / `tribute` with `accepted` or `returned` become **Tribute Items**.
4. Injected batches persist in `localStorage` (`tribute-schedule:custom-lore-v1`).

## 2. Add Permanently to the Repo
1. Create a new file under `src/lore/entries/<your-pack>.ts` exporting a `LorePack` (or call `parseRawShitposts(RAW_TEXT, 'custom', 'My Pack')` at module level).
2. Import and append it to `packs` in `src/lore/registry.ts`.
3. Run `npm test -w games/tribute-schedule` and `npm run build -w games/tribute-schedule`.
