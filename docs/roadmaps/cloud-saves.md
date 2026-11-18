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
