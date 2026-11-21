# Once in a Gnomillion

A slow multiplayer rarity-trivia game (Krillion, but friends, and rounds last minutes to a day). Pure rules in
`games/gnomillion/src/engine.ts` (written by the planner, with `src/net/protocol.ts`, `src/config.ts` and stubs).

Decisions: no server storage; the HOST's browser owns the Room and saves it to localStorage; guests send
intents over `@lawn/mp` (game id `gnomillion`, already in `GAMES`, `resumable: true`) and queue answers in
localStorage when the host is away. Plain DOM UI (no Phaser). Party slice: later (a 20 s everyone-types-at-once
round is plausible but needs a new input kind; backlog row). Mobile: yes. Online: yes (it is the point).

| Epic | Done when | Issues |
|---|---|---|
| 1 Build | `npm run build` and `npm test` pass in games/gnomillion | 4 parallel: A prompts+engine tests, B net session, C UI, D docs/achievements |

Common environment for all issues: repo root `C:\Users\cstab\Documents\gaming`; in Git Bash `export PATH="/c/Program Files/nodejs:$PATH"`.
Other workers edit other files of games/gnomillion at the same time. Do NOT commit. Do not run `vite build` or start servers
(planner does). Check with `npx tsc --noEmit -p games/gnomillion` and `npm test -w games/gnomillion`.
Keep each stub's exported signature unchanged. Read `games/gnomillion/src/engine.ts`, `src/config.ts`, `src/net/protocol.ts` first.

## Issue A: prompts and engine tests
Owns: `src/prompts.ts`, `src/engine.test.ts`. Touch nothing else.
- Replace the stub with `export const PROMPTS: string[]` of 120+ open-ended "Name a ..." / "Something you'd find in ..." prompts with many
  plausible answers (not yes/no, not one obvious answer). Gnome flavour: garden, lawns, mushrooms, hats, beards, pests, tools, snacks.
  Before writing names/lore, run `npm run lore -- find garden` and read `docs/lore/canon.md`; do not contradict it. No duplicates.
  Keep `shufflePromptOrder(rand)` signature, but implement a proper Fisher-Yates.
- `src/engine.test.ts` (vitest; `import { describe, it, expect } from 'vitest'`): normalizeAnswer ("The Mushrooms!" and "mushroom" share a key;
  accents; empty), submitAnswer (replace, closed, unknown player, empty), shouldClose (all answered; window passed), closeRound bucket tiers for a
  5-player room (4 distinct answers + one pair), standings totals, isGameOver after `totalRounds` rounds, PROMPTS unique and >= 100.
Done when: `npm test -w games/gnomillion` passes.

## Issue B: net session
Owns: `src/net/session.ts` (and new `src/net/store.ts` for localStorage helpers). Touch nothing else.
- Implement `hostRoom`, `joinRoom`, `resumeLastRoom` and `Session` exactly as in the stub (keep exports).
- Use `createNetClient(serverUrl(), 'gnomillion', { name, character: '', resumable: true })` from `@lawn/mp`; read `packages/mp/README.md` and
  `packages/mp/src/client.ts`. If `serverUrl()` is '' throw `new Error('Online play is not set up for this build')`.
- Identity: `KEY_ME` in localStorage `{pid,name}`; pid = `crypto.randomUUID()` the first time.
- Host: `newRoom(code, me, windowMs, shufflePromptOrder())` from engine/prompts, code = random 5 chars of A-Z0-9 (ROOM_CODE_RE in `@lawn/mp`),
  `net.queue(code, '', name)`. Host saves the full Room JSON to `KEY_ROOM(code)` and `KEY_LAST_ROOM` after EVERY change. Host handles `join`
  (addPlayer, MAX_PLAYERS cap) and `answer` (submitAnswer with the host's `Date.now()`; reply `ack`), then broadcasts `{t:'state', room: toPublic(room)}`
  with `net.send(null, ...)`. A guest who joins gets the state at once. Every 5 s (use `steadyInterval` from `@lawn/mp/background`) host checks
  `shouldClose`; if so `closeRound` and, if not `isGameOver`, `openRound` the next prompt `PROMPTS[room.promptOrder[room.history.length]]` after
  a 20 s pause is NOT needed: open it immediately. First round opens on `nextRound()` (host presses Start) and the host can call `nextRound()` any time
  when `room.current === null`. Rounds are clock-based, so after reopening the page (`resumeLastRoom`) the host just continues: re-queue the SAME code,
  and close any round whose `closesAt` passed.
- Guest: `joinRoom` queues the code, sends `join`, keeps the latest `state`. `answer(text)` sends `{t:'answer'}` AND stores a `PendingAnswer` in
  `KEY_PENDING` until an `ack` with ok=true arrives; on every reconnect (`connect()` again after `onClose`, retry every 10 s) resend pendings for this
  room and re-send `join`. Guest keeps last known state in localStorage too so the UI works offline (`online` false).
- When the match 'welcome' says resumed or the host is gone, nothing special: the guest just shows last state and `online=false` until host returns.
- Wrap in `whileHidden`/`steadyInterval` as needed only for heartbeats; no frame loop.
Done when: tsc passes. Add `src/net/store.test.ts` testing the pure localStorage helpers (use a tiny in-memory localStorage stub on globalThis): save/load room, add/remove/list pending answers.

## Issue C: UI
Owns: `src/ui/app.ts` and new files under `src/ui/` (css in a `<style>` injected by `src/ui/style.ts`). Touch nothing else.
- `mountApp(ui)` appends ONE container to `ui` (never restyle `#ui`). Screens, all plain DOM, dark theme, large type:
  1 Home: name box, "Host a game" with a round-length picker (labels for `WINDOW_CHOICES_MS`: 10 min / 1 hour / 8 hours / 1 day), "Join" with room code box,
    and "Resume last game" if `resumeLastRoom()` returns a session (call it on load).
  2 Lobby (host only sees Start): room code big with a copy-invite-link button (`location.origin+location.pathname+'?room='+code`; auto-fill join from `?room=`), players list.
  3 Round: the prompt, a text input (maxlength MAX_ANSWER_LEN) + Submit (Enter too), "Your answer: X (you can change it until time's up)", who has answered (names with a tick),
    a live countdown to `closesAt` (hh:mm:ss), an "offline - answers are saved and sent when the host is back" banner when `!session.online`.
  4 Results (after a round closes): the prompt, each bucket as a row: tier label + points, the answer, who said it (names), highlight my row; leaderboard (`standings`-like
    computation from `PublicRoom.history`: reuse the engine's `standings` by building a minimal Room-compatible object or write a small local equivalent), host button "Next round" when `current===null`.
  5 Final: the leaderboard with a winner line when the history reaches `totalRounds`.
  Tier colours: one distinct colour per `TierId`, from `TIERS`. 
- Re-render on `session.onChange`. Mobile: tap targets >= 44 px, `viewport-fit` safe-area padding (`env(safe-area-inset-*)`), works at 390x844 portrait and 844x390 landscape, no hover-only UI, inputs at 16 px font to stop iOS zoom.
- Export `mountApp` only; keep the file under 400 lines by splitting screens into `src/ui/screens.ts`.
- For development without the net session working yet, only rely on the `Session` interface in `src/net/session.ts`.
Done when: `npx tsc --noEmit -p games/gnomillion` passes.

## Issue D: docs, achievements, index
Owns: `AGENT_INDEX.md`, `docs/lore/settings.md`, `packages/party/README.md` (backlog table only), `packages/achievements/src/catalog.ts`, `games/gnomillion/CREDITS.md`, `games/gnomillion/src/achievements.ts`. Touch nothing else.
- AGENT_INDEX.md: add a `gnomillion` row (Once in a Gnomillion, plain DOM, port 5173 default: pick an unused one by reading the table, put `--port` NOT needed; just list the next free port in the same style as other rows), and the roadmap doc `docs/roadmaps/gnomillion.md`.
- docs/lore/settings.md: add `gnomillion` to the `the-yard` games list in both places it is listed; then `npm run lore` must pass.
- packages/party/README.md: add a backlog row for gnomillion: "later: a 20 s everyone-types-an-answer round needs a text input kind in PadState".
- Achievements: read `packages/achievements/README.md` first. Add 5 `AchievementDef`s for game id `gnomillion` (first answer; first One-in-a-Gnomillion answer; win a game; play 5 rounds; answer in a 1-hour-or-longer round within a minute... skip that last, instead: unique answer 3 times) with cosmetic rewards reusing existing `@lawn/prefabs` gear for slots head/back/neck/hand
  (browse `packages/prefabs/src/catalog/`; add no new prefab unless nothing fits, then follow `docs/roadmaps/prefab-library/_common.md`).
  `games/gnomillion/src/achievements.ts`: `export function createTracking(ui: HTMLElement)` calling `createAchievementTracker({ game: 'gnomillion', ui })` and exporting `onAnswered()`, `onRoundClosed(myTier: TierId | null)`, `onGameWon()` which call `unlock`/`increment`. Do not edit UI files; the planner wires it in.
- CREDITS.md: "No external assets."
Done when: `npm test -w packages/achievements` and `npm run lore` pass, tsc for gnomillion passes.
