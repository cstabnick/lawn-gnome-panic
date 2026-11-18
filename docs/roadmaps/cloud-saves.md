# Roadmap: cloud saves (Gnomomia first)

Goal: a signed-in player's Gnomomia save follows them to other devices and other copies of the arcade (GitHub Pages
and gnome.whalenet.app have separate localStorage). The platform service gets `gnome.save.v1.SaveService`: one save
blob per account per game, writes guarded by a revision so two devices never silently overwrite each other.

Sync rule (Gnomomia, `src/cloudSave.ts`): at startup, compare this browser's save and the account's against what was
last synced (revision + hash kept in localStorage). Only one side changed → use it. Both → the player chooses. During
play, autosaves are pushed (at most every 30 s); if another device wrote in between, syncing stops for the session and
the player is told.

| Epic | Done when | Issues |
|---|---|---|
| 0 Foundation (planner) | `proto/gnome/save/v1/save.proto` + generated code, `GAME_GNOMOMIA`, store interface + memory impl, Postgres + service stubs wired in `main.go`, `saveClient()` in `@lawn/platform`, `games/gnomes-of-gnomomia/src/cloudSave.ts` stub | done |
| 1 Pieces | each issue's check passes; then `go test ./...` with Postgres, `npm test` + `npm run build -w games/gnomes-of-gnomomia` | 4, parallel |
| 2 Ship (planner) | end-to-end run (two "devices"), PRIVACY.md, AGENT_INDEX.md, PR | planner |

~~~~text
Epic: 1 Cloud saves — issue 3A: Postgres saves table
Depends on: none

## Environment
Repo root /home/user/lawn-gnome-panic. Go module packages/platform-server (Go 1.25, pgx v5 already in go.mod). Run Go
commands from packages/platform-server. Other workers edit internal/service and games/gnomes-of-gnomomia at the same
time; only touch the files under Change. Do not run `go mod tidy`. Throwaway Postgres for tests, port 55472 only,
start/test/stop in ONE shell command:
    eval "$(bash scripts/testdb.sh start 55472)" && go test -count=1 ./internal/store/; rc=$?; bash scripts/testdb.sh stop; exit $rc

## Goal
store.Postgres implements GetSave and PutSave exactly like store.Memory, with a new migration for the saves table.

## Read first
- packages/platform-server/internal/store/store.go: the Save type, ErrConflict, and the GetSave/PutSave contract (spec).
- packages/platform-server/internal/store/memory.go: GetSave/PutSave reference behaviour; PurgeExpired deletes saves too.
- packages/platform-server/internal/store/postgres.go: `migrations` slice (append only), scan helpers, the two stubs
  at the bottom and `errStub` (delete errStub once unused).
- packages/platform-server/internal/store/store_test.go: runStoreSuite (add cases there so both stores run them).

## Change
- postgres.go: append migration 2 to `migrations`:
    CREATE TABLE saves (
      user_id    text NOT NULL REFERENCES accounts(user_id) ON DELETE CASCADE,
      game       integer NOT NULL,
      data       text NOT NULL,
      summary    text NOT NULL,
      revision   bigint NOT NULL,
      updated_at timestamptz NOT NULL,
      PRIMARY KEY (user_id, game)
    );
  (ON DELETE CASCADE makes PurgeExpired delete saves with no change to PurgeExpired.)
  GetSave: SELECT ... WHERE user_id=$1 AND game=$2; no row → ErrNotFound.
  PutSave: baseRevision == 0 → INSERT ... VALUES (..., 1, $now) ON CONFLICT (user_id, game) DO NOTHING RETURNING ...;
  no row → ErrConflict; a *pgconn.PgError with Code "23503" (foreign key: no such account) → ErrNotFound.
  baseRevision > 0 → UPDATE saves SET data=$3, summary=$4, revision=revision+1, updated_at=$5 WHERE user_id=$1 AND
  game=$2 AND revision=$6 RETURNING ...; no row → ErrConflict (also when the account doesn't exist; fine).
  Times .UTC(). Remove the stubs and errStub.
- store_test.go: add to runStoreSuite: put with base 0 on a new account → revision 1, GetSave returns it; second put
  base 0 → ErrConflict; put base 1 → revision 2 with new data/summary; stale base 1 again → ErrConflict and data
  unchanged; GetSave for another game → ErrNotFound; PutSave for unknown user id → ErrNotFound (base 0); two
  goroutines putting base 1 at once → exactly one succeeds, other ErrConflict; MarkDeleted + PurgeExpired → GetSave
  ErrNotFound; a 512 KiB data string round-trips. Compare UpdatedAt with Equal after Truncate(time.Microsecond).

## Contract
store.go is fixed; don't edit it or memory.go.

## Done when
- go build ./... && go vet ./internal/store/
- the one-command Postgres test above passes with TestPostgres RUNNING (not skipped) and TestMemory passing

## Out of scope
store.go, memory.go, every other package, go.mod/go.sum, main.go.
~~~~

~~~~text
Epic: 1 Cloud saves — issue 3B: SaveService handlers
Depends on: none

## Environment
Repo root /home/user/lawn-gnome-panic. Go module packages/platform-server (Go 1.25, Connect connectrpc.com/connect
v1.19.1). Generated code: gen/gnome/save/v1 (savev1, savev1connect), gen/gnome/common/v1 (commonv1: Game enum,
Game_name map). Run Go commands from packages/platform-server. Another worker is implementing store.Postgres
GetSave/PutSave at the same time; you test with store.NewMemory() (already implements them). Only touch the files
under Change. Do not run `go mod tidy`.

## Goal
service.SaveService implements GetSave and PutSave.

## Read first
- proto/gnome/save/v1/save.proto: the RPC contract.
- packages/platform-server/internal/service/save.go: the stub (keep NewSaveService, the struct, MaxSaveBytes,
  MaxSummaryRunes).
- packages/platform-server/internal/service/user.go: reuse s.users.caller(ctx, req.Header()) and
  s.users.account(ctx, c) (returns store.Account, created bool, err), internalErr(err), s.users.store, s.users.opts.Now.
- packages/platform-server/internal/store/store.go: GetSave, PutSave, Save, ErrNotFound, ErrConflict, StatePendingDeletion.
- packages/platform-server/internal/service/user_test.go: fakeVerifier (same package, reuse it in your tests).

## Change
- internal/service/save.go: implement. Shared steps for both RPCs: c := caller; a := account (creates on first use);
  a.State == store.StatePendingDeletion → CodeFailedPrecondition "account is being deleted"; validate game:
  g := req.Msg.GetGame(); g == commonv1.Game_GAME_UNSPECIFIED or not in commonv1.Game_name → CodeInvalidArgument
  "unknown game". (import commonv1 "github.com/cstabnick/lawn-gnome-panic/packages/platform-server/gen/gnome/common/v1")
  toSave(sv store.Save) *savev1.Save: Game commonv1.Game(sv.Game), Data, Revision, UpdatedAt timestamppb.New, Summary.
  - GetSave: store.GetSave(a.UserID, int32(g)); ErrNotFound → connect.NewError(connect.CodeNotFound, errors.New("no
    save")); other errors → internalErr. Response {Save}.
  - PutSave: len(data) > MaxSaveBytes → InvalidArgument "save too large"; utf8.RuneCountInString(summary) >
    MaxSummaryRunes → InvalidArgument "summary too long"; base_revision < 0 → InvalidArgument. store.PutSave(...,
    s.users.opts.Now()); ErrConflict → connect.NewError(connect.CodeAborted, errors.New("the save changed on another
    device")); others → internalErr. Response {Save}.
- internal/service/save_test.go (new): users := NewUserService(store.NewMemory(), fakeVerifier{"t1":"sub-1",
  "t2":"sub-2"}, Options{Now: fixed}); svc := NewSaveService(users). Cases: no auth → Unauthenticated; GetSave before
  any put → NotFound; PutSave base 0 → revision 1; GetSave returns data/summary/revision/game; PutSave base 0 again →
  Aborted; base 1 → revision 2; GAME_UNSPECIFIED and Game(99) → InvalidArgument; 512 KiB + 1 byte → InvalidArgument;
  201-rune summary → InvalidArgument; t2's save is separate from t1's; after users.DeleteAccount (use the handle from
  users.GetMe) → PutSave FailedPrecondition. Plus one HTTP test: mux.Handle(savev1connect.NewSaveServiceHandler(svc)),
  httptest server, savev1connect.NewSaveServiceClient(http.DefaultClient, url, connect.WithProtoJSON()), Put then Get.

## Contract
Keep NewSaveService(users *UserService) *SaveService; main.go uses it.

## Done when
- go build ./... && go vet ./internal/service/ && go test -count=1 ./internal/service/ passes

## Out of scope
user.go (read only), internal/store, main.go, gen/, go.mod/go.sum.
~~~~

~~~~text
Epic: 1 Cloud saves — issue 3C: Gnomomia cloud sync logic
Depends on: none

## Environment
Repo root /home/user/lawn-gnome-panic, npm workspaces (installed; don't add packages). Game
games/gnomes-of-gnomomia (TypeScript, vitest in Node: no localStorage, no window). Another worker edits main.ts,
save.ts and ui/ of the same game at the same time; only touch the files under Change.

## Goal
src/cloudSave.ts syncs the localStorage save with the account's save (SaveService) as its comments describe.

## Read first
- games/gnomes-of-gnomomia/src/cloudSave.ts: the stub; keep every export and signature (incl. CloudDeps,
  PlatformApi, setCloudDepsForTest, SYNC_KEY).
- games/gnomes-of-gnomomia/src/config.ts: SAVE_KEY ('gnomomia.save.v2'), ZoneDef.name; src/content.ts: ZONES;
  src/data/classes.ts: CLASSES (check the display-name field of ClassDef).
- games/gnomes-of-gnomomia/src/save.ts: the save text format {v:2, state:{level, classId, ...}, zone, ...}.
- packages/platform/src/gen/gnome/save/v1/save_pb.ts: Save {game, data, revision: bigint, updatedAt?: Timestamp
  {seconds: bigint, nanos}, summary}; packages/platform/src/gen/gnome/common/v1/common_pb.ts: Game.GNOMOMIA.
- packages/platform/src/index.ts and session.ts: getAccessToken, saveClient, ConnectError, Code, Game,
  accountsEnabled, hasStoredSession.

## Change
- src/cloudSave.ts: implement. Rules:
  - Imports: only `import type` from '@lawn/platform'; static import of accountsEnabled/hasStoredSession from
    '@lawn/platform/session' is fine. Default deps: storage = localStorage if usable (try/catch) else null; signedIn =
    accountsEnabled() && hasStoredSession(); load = () => import('@lawn/platform'); now = () => performance.now().
    setCloudDepsForTest merges deps and resets status ('off'), timers, pending conflict, in-flight state.
  - hash(text): FNV-1a 32-bit as 8 hex chars. Bookkeeping in SYNC_KEY: {rev: number, hash: string}; Number(revision)
    to store, BigInt(meta.rev) for base_revision.
  - summarize(text): parse JSON; "Level {state.level} {CLASSES[classId] display name}, {ZONES[zone].name}"; no class
    → "Level {n} gnome, {zone}"; anything unreadable → "A saved gnome".
  - syncAtStartup(timeoutMs): !signedIn() or no storage → status 'off', return {kind:'off'}. Otherwise race the work
    against timeoutMs (timeout or any error → status 'off', {kind:'off'}): api = await load(); token = await
    api.getAccessToken(); null → off. local = storage.getItem(SAVE_KEY); meta = parsed SYNC_KEY or null.
    remote = (await api.saveClient().getSave({ game: api.Game.GNOMOMIA })).save, or null when the error is
    `err instanceof api.ConnectError && err.code === api.Code.NotFound`.
    1. no remote, no local → status 'synced', {kind:'ok', pulled:false}.
    2. no remote, local → putSave({game, data: local, summary: summarize(local), baseRevision: 0n}); write meta;
       'synced', ok pulled false.
    3. remote, no local → storage.setItem(SAVE_KEY, remote.data); meta; 'synced', ok pulled true.
    4. both, hash equal → meta = {remote rev, hash}; ok pulled false.
       localChanged = !meta || hash(local) !== meta.hash; remoteChanged = !meta || Number(remote.revision) !== meta.rev.
       !localChanged → take remote (as 3). !remoteChanged → push local with baseRevision remote.revision (as 2).
       both → keep remote in a module variable; status 'syncing'; return {kind:'conflict', local: {summary:
       summarize(local), updatedAt: ''}, remote: {summary: remote.summary || summarize(remote.data), updatedAt: ISO of
       remote.updatedAt or ''}}.
    A push that fails with Code.Aborted during startup → status 'stopped', {kind:'off'}.
  - resolveConflict('remote') → write pending remote data to SAVE_KEY + meta, 'synced'. ('local') → push local with
    baseRevision = pending revision, meta, 'synced'; on error 'off'. No pending conflict → no-op.
  - pushSave(): only while status is 'synced'. Throttle: at most one push per 30 s (deps.now); a call inside the
    window schedules ONE trailing push at the window's end (setTimeout), extra calls don't add timers; never two
    pushes in flight. A push: text = SAVE_KEY; null or hash === meta.hash → skip. token null → status 'off'.
    putSave with baseRevision meta.rev → meta, status stays 'synced' (briefly 'syncing' while in flight is fine).
    Code.Aborted → status 'stopped' (no further pushes). Other errors → stay 'synced' (next pushSave retries).
    Never throws (catch everything).
  - cloudStatus(); onCloudStatus(cb) adds a listener, called on every change, returns unsubscribe.
- src/cloudSave.test.ts (new, vitest): fake storage (Map-backed getItem/setItem/removeItem), fake api cast `as
  unknown as PlatformApi`: getAccessToken vi.fn → 'tok'; saveClient: () => fake with getSave/putSave vi.fn;
  ConnectError: class with `code`; Code: { NotFound: 5, Aborted: 10 }; Game: { GNOMOMIA: 7 }; now: controllable
  number. putSave fake returns { save: { ...req, revision: req.baseRevision + 1n } }.
  Cases: not signed in → off, no calls; each of startup cases 1-4 (assert storage, meta, putSave args incl.
  baseRevision bigint); conflict then resolveConflict('remote') and ('local'); getSave never resolving with
  timeoutMs 20 → off; pushSave throttle (two calls within 30 s → one immediate push + one trailing push after
  advancing the clock and vi.advanceTimersByTime; unchanged text → no push); Aborted on push → 'stopped' and later
  pushSave does nothing; summarize on a real-shaped save and on garbage; onCloudStatus fires and unsubscribes.
  Use vi.useFakeTimers() where timers matter.

## Contract
All exports exactly as in the stub. main.ts/title/ui call syncAtStartup, resolveConflict, pushSave, cloudStatus,
onCloudStatus, SaveInfo.

## Done when
- npx tsc --noEmit -p games/gnomes-of-gnomomia passes
- npx vitest run src/cloudSave.test.ts (from games/gnomes-of-gnomomia) passes
- grep "from '@lawn/platform'" games/gnomes-of-gnomomia/src/cloudSave.ts shows only an `import type` line

## Out of scope
main.ts, save.ts, ui/*, every other file.
~~~~

~~~~text
Epic: 1 Cloud saves — issue 3D: Gnomomia cloud-save UI and wiring
Depends on: none

## Environment
Repo root /home/user/lawn-gnome-panic, npm workspaces (installed; don't add packages). Game
games/gnomes-of-gnomomia (three.js, plain DOM UI). Another worker is implementing src/cloudSave.ts right now: it is
a stub with final signatures (syncAtStartup resolves {kind:'off'}). Only touch the files under Change. Repo rules:
mobile first (390x844 portrait and landscape, buttons >= 44 px, no hover-only UI); UI goes in your own container
appended to the root you're given (#ui), never restyle #ui.

## Goal
Gnomomia syncs its save with the player's account: sync before the title, a choose-your-save screen on conflict, a
title line about cloud saves, pushes after every save, and a message when syncing stops.

## Read first
- games/gnomes-of-gnomomia/src/cloudSave.ts: the API (syncAtStartup, resolveConflict, pushSave, cloudStatus,
  onCloudStatus, SaveInfo, CloudStatus). Use only these.
- games/gnomes-of-gnomomia/src/main.ts lines ~140-170: startup (loadGame → showTitle → new game / continue).
- games/gnomes-of-gnomomia/src/save.ts: saveGame().
- games/gnomes-of-gnomomia/src/ui/title.ts: the title overlay style (el() helper, UI colours/fonts from config.ts).
- games/gnomes-of-gnomomia/src/events.ts: say(text, colour).
- packages/platform/src/session.ts: accountsEnabled().

## Change
- src/save.ts: in saveGame(), after writeSave(...), call pushSave() (import from './cloudSave'). Nothing else.
- src/ui/cloud.ts (new): export function chooseSave(root: HTMLElement, local: SaveInfo, remote: SaveInfo):
  Promise<'local' | 'remote'>. A full-screen overlay styled like the title (same el() approach, z-index 600,
  pointer-events:auto), heading "Two saves found", text "This browser and your account both have progress since
  they last synced. Pick the one to keep; the other is replaced.", two large buttons (min-height 56px, full width up
  to 420px, stacked): "This browser" + local.summary; "Your account" + remote.summary + (remote.updatedAt ? " · saved
  " + new Date(remote.updatedAt).toLocaleString() : ""). Clicking removes the overlay and resolves. data-testid
  "save-choice" on the overlay, "choose-local" / "choose-remote" on the buttons. Use textContent only.
- src/ui/title.ts: under the buttons add one small line (font-size 14px, UI.textDim): cloudStatus() === 'synced' →
  "☁ Your save syncs to your account"; cloudStatus() === 'off' && accountsEnabled() → a link "Sign in to keep your
  save on every device" with href "../me/" (target _self, colour UI.gold, padding so its tap target is >= 44px tall);
  otherwise nothing. Keep showTitle's signature. Import accountsEnabled from '@lawn/platform/session'.
- src/main.ts: in the non-debug startup branch, before `const hasSave = loadGame();`:
    const sync = await syncAtStartup();
    if (sync.kind === 'conflict') await resolveConflict(await chooseSave(ui, sync.local, sync.remote));
  and after `running = true;` in that branch:
    onCloudStatus((s) => { if (s === 'stopped') say('Your save changed on another device. This session now saves
    on this browser only. Reload to choose which save to keep.', UI.quest); });
  Keep everything else as is (the debug ?zone= branch untouched).

## Contract
Uses cloudSave.ts exports only as listed. chooseSave(root, local, remote) as above.

## Done when
- npx tsc --noEmit -p games/gnomes-of-gnomomia passes
- npm test -w games/gnomes-of-gnomomia passes (existing tests; ignore src/cloudSave.test.ts if it is mid-edit by the
  other worker and failing for that reason only, and say so)
- Dev check (port 5291 is yours only): (npm run dev -w games/gnomes-of-gnomomia > /tmp/claude-0/gg-dev.log 2>&1 &);
  sleep 6; then a Playwright script at viewport 390x844 opens http://localhost:5291/, waits 8 s, prints page errors,
  and confirms the title shows "Sign in to keep your save on every device" (on localhost accounts are enabled and
  nobody is signed in) and that clicking Continue/New Game still starts the game. Stop the dev server afterwards
  (kill the vite processes you started).

## Out of scope
src/cloudSave.ts and its test, every other file and game.
~~~~

## Round 2: more games, achievements, shared package

Gnomomia's sync moved into `packages/cloudsave` (`@lawn/cloudsave`, `createCloudSlot`), with a second mode:
**merge** for data that only grows (achievements, best photos): both sides are merged with the game's `merge()` and
pushed, never a conflict screen. Gnomomia keeps 'choose' through a thin wrapper (its 20 tests run unchanged against
it). New `gnome.common.v1.Game` values: `GAME_ARCADE` (arcade-wide data: achievements), `GAME_GNOMOKEMON`,
`GAME_GNOME_SWEET_GNOME`. The server needed no change beyond the enum.

Why achievements: the gnome's look (with equipped outfits) already syncs through the account, but the Gnome
Creator only lets you pick outfits whose achievements are unlocked in `gnome.achievements.v1`, which stayed local.

Snap photos are full-screen JPEGs (~10 MB for a full dex, over the 512 KiB save limit): the cloud copy keeps a
small thumbnail per photo; each device keeps its own full-size photos; the gallery's 3D diorama comes from the
stored snapshot either way.

| Epic | Done when | Issues |
|---|---|---|
| 0 (planner) | enum + generated code, `packages/cloudsave` with both modes, Gnomomia on it (20 tests pass) | done |
| 1 | each issue's check; then all tests + `npm run site` | 4, parallel |

~~~~text
Epic: 2 — issue 5A: @lawn/cloudsave tests and README
Depends on: none

## Environment
Repo root /home/user/lawn-gnome-panic, npm workspaces (installed; add no packages). Package packages/cloudsave,
vitest in Node (no localStorage, no window). Other workers edit packages/achievements and games/* at the same time;
only touch the files under Change. games/gnomes-of-gnomomia/src/cloudSave.test.ts is a good model for fakes.

## Goal
packages/cloudsave has its own tests for both modes, and a README.

## Read first
- packages/cloudsave/src/index.ts: the whole module (createCloudSlot, CloudSlotOptions, modes, MAX_SAVE_BYTES).
- games/gnomes-of-gnomomia/src/cloudSave.test.ts: how the fake storage and fake PlatformApi are built
  (ConnectError class with `code`, Code {NotFound: 5, Aborted: 10}, Game enum object, putSave returning
  {save: {...req, revision: req.baseRevision + 1n}}). Here Game must include { ARCADE: 8, GNOMOMIA: 7 }.

## Change
- packages/cloudsave/src/index.test.ts (new): build slots with createCloudSlot({ ..., deps: { storage, signedIn,
  load, now } }). 'choose' mode: a short smoke set (no local+no remote → ok; local only → pushed with baseRevision
  0n; remote only → pulled; both changed → conflict; resolveConflict('remote'); Aborted push during play →
  'stopped'). 'merge' mode with merge = union of comma-separated words (sorted, deduped; local null → remote):
  startup local "a" + remote "b" → local becomes "a,b", pushed with baseRevision = remote revision, pulled true;
  remote equal to toCloud(merged) → no put; no remote → put base 0n; pushSave after a local change → put; a put
  that is Aborted → getSave is called again, merged, put again with the new revision, and onLocalChanged is called
  with the merged text when it changed; status never 'stopped' in merge mode. toCloud: with toCloud = (t) =>
  t.toUpperCase(), the put data is upper case but the local text and meta hash stay lower case. A cloud text over
  MAX_SAVE_BYTES is not put (spy console.warn to keep output quiet). createCloudSlot({mode:'merge'}) without merge
  throws. Timeout: getSave never resolving, syncAtStartup(20) → {kind:'off'}.
- packages/cloudsave/README.md (new): what it is, the two modes and when to use each, a usage example for each
  (Gnomomia = choose; achievements = merge), the deps for tests, the 512 KiB limit and toCloud.

## Done when
- npx tsc --noEmit -p packages/cloudsave && (cd packages/cloudsave && npx vitest run) passes

## Out of scope
packages/cloudsave/src/index.ts (do not change it; if a test shows a real bug, report it instead), everything else.
~~~~

~~~~text
Epic: 2 — issue 5B: achievements sync across devices
Depends on: none

## Environment
Repo root /home/user/lawn-gnome-panic, npm workspaces (installed; add no packages). Package packages/achievements (vitest, Node). Other workers edit packages/cloudsave tests and games/*
at the same time; only touch the files under Change.

## Goal
When signed in, achievements (and so the outfit unlocks the Gnome Creator checks) are merged with the account's on
every device: unlocking on one device makes the outfit selectable on another.

## Read first
- packages/achievements/src/store.ts: LocalAchievementStore (it caches state after the first read), parseState,
  ACHIEVEMENTS_STORAGE_KEY ('gnome.achievements.v1'), createAchievementStore().
- packages/achievements/src/types.ts: AchievementStore, AchievementState { version: 1, records: { [id]: {progress,
  unlockedAt?} } }.
- packages/achievements/src/tracker.ts: uses createAchievementStore() unless a store is passed.
- packages/cloudsave/src/index.ts: createCloudSlot, CloudSlotOptions (mode 'merge', merge, onLocalChanged, deps).
- packages/platform/src/session.ts: accountsEnabled, hasStoredSession.

## Change
- packages/achievements/package.json: "@lawn/cloudsave" is already a dependency and installed. Do not run npm install.
- packages/achievements/src/sync.ts (new):
  - export function mergeAchievementStates(local: string | null, remote: string): string — parse both with the same
    rules as parseState (export parseState from store.ts if needed, or move it); for every id in either: progress =
    max; unlockedAt = the earlier of the two when both have one, else whichever exists; output
    JSON.stringify({version: 1, records}) with ids sorted (deterministic).
  - export class SyncedAchievementStore implements AchievementStore, constructor(opts?: { storage?: StorageLike |
    null; slotDeps?: Partial<CloudDeps> }). It holds a cloud slot: createCloudSlot({ game: 'ARCADE', saveKey:
    ACHIEVEMENTS_STORAGE_KEY, syncKey: 'gnome.achievements.cloud.v1', mode: 'merge', merge: mergeAchievementStates,
    summarize: (t) => `${count unlocked} achievements`, onLocalChanged: () => { this.local = new LocalAchievementStore(storage) },
    deps: slotDeps }) and a LocalAchievementStore. A private ready(): Promise<void> runs slot.syncAtStartup(3000)
    once per instance (shared promise; never rejects) and afterwards replaces this.local with a fresh
    LocalAchievementStore (its cache may predate the merge). getState/unlock/increment/reset: await ready(), then
    delegate to this.local; after unlock/increment/reset call slot.pushSave().
- packages/achievements/src/store.ts: createAchievementStore() returns new SyncedAchievementStore() when
  accountsEnabled() && hasStoredSession() (import from '@lawn/platform/session', wrap in try/catch → false), else
  LocalAchievementStore as now. Import only '@lawn/platform/session' statically (no '@lawn/platform').
- packages/achievements/src/index.ts: export SyncedAchievementStore and mergeAchievementStates.
- packages/achievements/src/sync.test.ts (new): mergeAchievementStates cases (union, max progress, earliest
  unlockedAt, null local, garbage on either side → treated as empty, deterministic order); SyncedAchievementStore with
  a fake storage and a fake platform (as in games/gnomes-of-gnomomia/src/cloudSave.test.ts; Game must include
  ARCADE: 8): remote has 'a' unlocked, local has 'b' → getState() returns both and the put carries both; unlock()
  of a catalog id then triggers a put (use pushWindowMs-independent check: first push is immediate). Use real ids
  from ACHIEVEMENTS (catalog.ts) for unlock().

## Done when
- npx tsc --noEmit -p packages/achievements && npm test -w packages/achievements passes
- npx tsc --noEmit -p games/gnome-creator passes (it uses the store)

## Out of scope
packages/cloudsave, packages/platform, games/*.
~~~~

~~~~text
Epic: 2 — issue 5C: Gnome Sweet Gnome cloud saves
Depends on: none

## Environment
Repo root /home/user/lawn-gnome-panic, npm workspaces (installed; add no packages except the two workspace
dependencies named below). Game games/gnome-sweet-gnome (Phaser 3, TypeScript, vitest). Other workers edit other
packages/games now; only touch the files under Change. Repo rules: mobile first (390x844, buttons >= 44 px, no
hover-only UI); DOM UI goes in your own container appended to #ui, never restyle #ui.

## Goal
A signed-in player's Gnome Sweet Gnome progress (level, stars, coins, house, boosters, best) follows their account;
if both this browser and the account progressed since the last sync, they choose which to keep.

## Read first
- games/gnome-sweet-gnome/src/save.ts: KEY 'gnome-sweet-gnome.save.v1', SaveData, writeSave, resetSave.
- games/gnome-sweet-gnome/src/main.ts: Phaser.Game creation and the #reset handling.
- games/gnome-sweet-gnome/index.html: #ui exists.
- packages/cloudsave/src/index.ts: createCloudSlot (mode 'choose', the default), StartupSync, SaveInfo.
- games/gnomes-of-gnomomia/src/ui/cloud.ts: a working "Two saves found" chooser to match in wording and sizes
  (do not import from another game; write this game's own, in its own style).

## Change
- games/gnome-sweet-gnome/package.json: "@lawn/cloudsave" and "@lawn/platform" are already dependencies and
  installed. Do not run npm install.
- src/cloud.ts (new): export const cloud = createCloudSlot({ game: 'GNOME_SWEET_GNOME', saveKey:
  'gnome-sweet-gnome.save.v1' (export KEY from save.ts and use it), syncKey: 'gnome-sweet-gnome.cloud.v1',
  summarize }); export function summarize(text): "Level {level} · {stars} ★ · {built} house items" from the
  SaveData JSON ("A saved game" when unreadable; built = number of keys in house).
- src/ui/saveChoice.ts (new): chooseSave(root, local: SaveInfo, remote: SaveInfo): Promise<'local'|'remote'>, a
  full-screen DOM overlay (data-testid "save-choice", buttons "choose-local" / "choose-remote", min-height 56px,
  textContent only), heading "Two saves found", the two summaries, account side with its saved date.
- src/save.ts: writeSave() calls cloud.pushSave() after a successful setItem. resetSave() unchanged.
- src/main.ts: before creating the Phaser.Game (and after the #reset handling), await cloud.syncAtStartup(); on
  'conflict' await cloud.resolveConflict(await chooseSave(ui, sync.local, sync.remote)). Use top-level await (the
  file is an ES module; check vite's build target supports it — gnome-sweet-gnome's vite config may need
  build.target 'es2022'; if you change vite.config.ts, list it).
- src/cloud.test.ts (new): summarize cases.

## Done when
- npm run build -w games/gnome-sweet-gnome && npm test -w games/gnome-sweet-gnome pass
- Dev check (port 5180 is yours only): start `npm run dev -w games/gnome-sweet-gnome` in the background, open
  http://localhost:5180/ in Playwright at 390x844, wait for the game canvas, print page errors (expect none), stop
  the dev server you started.

## Out of scope
Every other game and package.
~~~~

~~~~text
Epic: 2 — issue 5D: Gnomokemon Snap best photos sync (merge)
Depends on: none

## Environment
Repo root /home/user/lawn-gnome-panic, npm workspaces (installed; add no packages except the two workspace
dependencies named below). Game games/gnomeokemon (three.js, TypeScript; has vitest? check package.json; if it has no
test script, add "test": "vitest run" and vitest "5.1.0" to devDependencies like other games). Other workers edit
other packages/games now; only touch the files under Change.

## Goal
A signed-in player's best photo per species is merged across devices: each device ends up with the best-scoring
photo of every species any device took. The cloud copy holds small thumbnails (full-size JPEGs would exceed the 512
KiB save limit); each device keeps its own full-size photos.

## Read first
- games/gnomeokemon/src/snap/storage.ts: STORAGE_KEY 'gnomeokemon.bestPhotos.v1', BestPhotoMap, saveBestPhoto,
  clearBestPhotos.
- games/gnomeokemon/src/snap/types.ts: PhotoRecord (dataUrl, score.total, capturedAt, snapshot).
- games/gnomeokemon/src/main.ts: startup; where the menu/gallery first read photos.
- packages/cloudsave/src/index.ts: createCloudSlot with mode 'merge', merge, toCloud, onLocalChanged.

## Change
- games/gnomeokemon/package.json: "@lawn/cloudsave" and "@lawn/platform" are already dependencies and installed. Do
  not run npm install. If you need vitest (see Environment), add the test script and devDependency, keeping the
  file's line endings, and tell the planner (who runs npm install).
- src/snap/cloud.ts (new):
  - export function mergePhotos(local: string | null, remote: string): string: parse both as BestPhotoMap (garbage →
    {}); per speciesId keep the record with the higher score.total; on a tie keep local's. Output JSON with keys
    sorted. Also drop remote records with capturedAt <= the cleared-at time read from localStorage key
    'gnomeokemon.clearedAt' (number, ms; missing = 0).
  - export async function thumbnailPhotos(local: string, shrink = shrinkDataUrl): Promise<string>: same map with
    every dataUrl replaced by await shrink(dataUrl). shrinkDataUrl(dataUrl): load into an Image, draw to a canvas 192
    px wide (height by aspect), toDataURL('image/jpeg', 0.6); on any failure return ''. Records whose dataUrl is
    already short (< 30000 chars) are kept as is.
  - export const photoCloud = createCloudSlot({ game: 'GNOMOKEMON', saveKey: STORAGE_KEY (export it from
    storage.ts), syncKey: 'gnomeokemon.cloud.v1', mode: 'merge', merge: mergePhotos, toCloud: (t) =>
    thumbnailPhotos(t), summarize: (t) => `${n} species photographed` }).
- src/snap/storage.ts: export STORAGE_KEY; saveBestPhoto calls photoCloud.pushSave() after an updated write;
  clearBestPhotos also writes localStorage 'gnomeokemon.clearedAt' = Date.now() and calls photoCloud.pushSave().
- src/main.ts: at startup (before the menu first renders), start `void photoCloud.syncAtStartup()` without blocking
  the 3D viewer; if it resolves {kind:'ok', pulled: true} and the menu/gallery is showing photos, re-render it (or,
  simplest, the menu reads loadBestPhotos() each time it is shown; say which).
- src/snap/cloud.test.ts (new): mergePhotos (union, higher score wins, tie keeps local, garbage, clearedAt drops older
  remote photos — stub localStorage via vi.stubGlobal), thumbnailPhotos with a fake shrink (short dataUrls kept).

## Done when
- npm run build -w games/gnomeokemon passes; its tests pass (npx vitest run inside games/gnomeokemon)
- grep shows no static `from '@lawn/platform'` value import in src/ (only @lawn/cloudsave and '@lawn/platform/session')

## Out of scope
Every other game and package.
~~~~
