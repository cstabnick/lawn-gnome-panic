# Roadmap: player accounts (Keycloak sign-in, Go platform service)

Goal: players can sign in (Keycloak at `auth.whalenet.dev`, realm `whalenet`, Google) so their gnome follows them
to other devices. Design: `docs/design/gnome-platform.md` (from PR 38), with these changes:

- Keycloak replaces the service's own login: `StartLogin`/`CompleteLogin`/`RefreshSession`/`Logout` are gone. The
  browser does OIDC code + PKCE against the public client `gnome-web`; the service checks Keycloak access tokens
  against the realm's JWKS (`aud` must contain `gnome-web`) and keys accounts on `sub`.
- The local gnome (`packages/gnome`, localStorage) is the guest. On first sign-in it is uploaded to the account.
  Server-side guests (`CreateGuest`) wait for inventory/unlocks and answer UNIMPLEMENTED for now.
- `GnomeLook` has the full `Look` of `packages/gnome` (its JSON is identical).
- The service is Go (`packages/platform-server`, Connect), storing accounts in the shared Postgres
  (`common-postgresql`, database `lawn_gnome`, schema `gnome`, whale-net/argok8s#319).

Not in this roadmap: inventory/unlocks, server guests, username+password sign-up (needs the realm-wide registration
flag, so a client audit of the `whalenet` realm first), mp-server checking tokens.

## Shape

| Epic | Done when | Issues |
|---|---|---|
| 0 Foundation (planner) | protos changed and generated (Go + TS), Go skeleton with stubs + `main.go` + memory store, `@lawn/platform` url/session/client, `games/me` skeleton, `tools/build-site.mjs` unlisted pages; `go build ./...`, `npm run build -w games/me` pass | done by the planner |
| 1 Pieces | every issue below passes its own check; then `go test ./...`, `npm test -w packages/gnome`, `npm run site` | 7, parallel |
| 2 Ship (planner) | Dockerfile, workflow, Pages env, PRIVACY.md, argok8s Keycloak OpenTofu + chart; smoke check of `/me/` | done by the planner |

No dependencies inside epic 1: every contract is a stub from epic 0.

## Epic 1 issues

~~~~text
Epic: 1 Pieces — issue 1A: Go Keycloak token verification
Depends on: none

## Environment
Repo root /home/user/lawn-gnome-panic. Go module: packages/platform-server (module path
github.com/cstabnick/lawn-gnome-panic/packages/platform-server, Go 1.25, dependencies already in go.mod:
github.com/coreos/go-oidc/v3 v3.21.0, github.com/go-jose/go-jose/v4 v4.1.9). Run Go commands from
packages/platform-server. Other workers edit other packages of this module at the same time
(internal/names, internal/store, internal/service); only touch the files listed under Change.
Do not run `go mod tidy` (another worker may be mid-edit); if you truly need a new module, stop and say so.

## Goal
internal/auth verifies Keycloak access tokens: signature (JWKS), issuer, expiry, audience, and that it is an
access token (Keycloak claim `typ` == "Bearer"), and returns the caller's `sub`.

## Read first
- packages/platform-server/internal/auth/auth.go: the stub. Keep every exported name and signature exactly.

## Change
- packages/platform-server/internal/auth/auth.go: implement the stubs.
  - KeycloakVerifier holds a *oidc.IDTokenVerifier (github.com/coreos/go-oidc/v3/oidc).
  - NewKeycloakVerifier(ctx, cfg): keySet := oidc.NewRemoteKeySet(ctx, cfg.Issuer+"/protocol/openid-connect/certs");
    verifier := oidc.NewVerifier(cfg.Issuer, keySet, &oidc.Config{ClientID: cfg.Audience, SupportedSigningAlgs:
    []string{oidc.RS256, oidc.ES256}}). (NewRemoteKeySet fetches lazily, so no network at construction.)
  - NewStaticVerifier(cfg, keys): same, with &oidc.StaticKeySet{PublicKeys: keys}.
  - Verify(ctx, token): tok, err := v.verifier.Verify(ctx, token); on err return
    Caller{}, fmt.Errorf("%w: %v", ErrUnauthenticated, err). Then decode the extra claim:
    var c struct{ Typ string `json:"typ"` }; tok.Claims(&c); require c.Typ == "Bearer" (Keycloak ID tokens have
    "ID"; reject them the same way). Require tok.Subject != "". Return Caller{Subject: tok.Subject}.
    go-oidc's Config.ClientID check accepts `aud` as a string or an array containing it.
  - BearerToken(h): h.Get("Authorization"); split on the first space; scheme compared with strings.EqualFold to
    "Bearer"; token trimmed; ok=false when anything is missing or the token is empty.
- packages/platform-server/internal/auth/auth_test.go (new): table tests. Make an RSA key (rsa.GenerateKey(rand.Reader,
  2048)), sign tokens with go-jose v4:
    signer, _ := jose.NewSigner(jose.SigningKey{Algorithm: jose.RS256, Key: priv}, (&jose.SignerOptions{}).WithType("JWT"))
    obj, _ := signer.Sign(payloadJSON); s, _ := obj.CompactSerialize()
  (import "github.com/go-jose/go-jose/v4" as jose). cfg := KeycloakConfig{Issuer: "https://kc.test/realms/whalenet",
  Audience: "gnome-web"}; v := NewStaticVerifier(cfg, []crypto.PublicKey{&priv.PublicKey}).
  Cases (claims iss, aud, sub, exp, iat, typ):
  - valid (aud "gnome-web", typ "Bearer") → Subject = sub
  - valid with aud ["account","gnome-web"]
  - expired (exp in the past) → errors.Is(err, ErrUnauthenticated)
  - wrong issuer; aud only "account"; typ "ID"; empty sub; signed with a different key; "not.a.jwt" → all ErrUnauthenticated
  BearerToken: "Bearer abc" → abc; "bearer abc" → abc; "Basic abc" → !ok; "Bearer " → !ok; missing → !ok.

## Contract
auth.go exported API stays exactly as in the stub (Caller, ErrUnauthenticated, Verifier, KeycloakConfig,
KeycloakVerifier, NewKeycloakVerifier, NewStaticVerifier, Verify, BearerToken). main.go and internal/service call them.

## Done when
- cd packages/platform-server && go build ./... && go vet ./internal/auth/ && go test ./internal/auth/ passes

## Out of scope
Every other file, go.mod/go.sum, main.go.
~~~~

~~~~text
Epic: 1 Pieces — issue 1B: Go display-name rules and handles
Depends on: none

## Environment
Repo root /home/user/lawn-gnome-panic. Go module packages/platform-server (Go 1.25). Dependency already in go.mod:
github.com/TwiN/go-away v1.8.1 (profanity filter, MIT). Run Go commands from packages/platform-server. Other
workers edit other packages of this module at the same time; only touch the files under Change. Do not run
`go mod tidy`.

## Goal
internal/names checks display names with the same rules and messages as the TypeScript checkName, and makes
default names and handles.

## Read first
- packages/platform-server/internal/names/names.go: the stub. Keep every exported name and signature.
- packages/mp/src/textFilter.ts: the TypeScript rules to match (tidyText, checkName).

## Change
- packages/platform-server/internal/names/names.go: implement.
  - Tidy(raw): remove these runes (same as textFilter.ts CONTROL_RE): U+0000–U+001F, U+007F–U+009F,
    U+200B–U+200F, U+202A–U+202E, U+2060–U+206F, U+FEFF. Then replace every run of unicode.IsSpace runes with one
    ASCII space, then strings.TrimSpace.
  - Check(raw): name := Tidy(raw); n := utf8.RuneCountInString(name); n < NameMin → "", ErrTooShort;
    n > NameMax → "", ErrTooLong; goaway.IsProfane(name) (import goaway "github.com/TwiN/go-away") → "", ErrNotAllowed;
    else name, nil.
  - RandomName(r): fmt.Sprintf("Gnome%d", 1000+r.IntN(9000)).
  - RandomHandle(r): adjective + "-" + noun + "-" + 4 digits (1000+r.IntN(9000)). Two package-level slices of
    32 short lower-case ASCII garden words each, all clean (e.g. adjectives mossy, sunny, muddy, leafy, ...; nouns
    boots, acorn, trowel, tulip, ...).
- packages/platform-server/internal/names/names_test.go (new):
  - Tidy: "  Mossy \t Boots  " → "Mossy Boots"; "Mo​ssy" → "Mossy"; "a\u0007b" → "ab".
  - Check: "Gnome1234" ok; "Mossy Boots" ok; "x" → ErrTooShort; 19 letters → ErrTooLong; 18 letters ok;
    "😀😀" ok (2 runes); "shit" → ErrNotAllowed; "sh1t" → ErrNotAllowed; "Classic" ok; "Scunthorpe" ok if go-away
    allows it (if it flags it, keep the test but expect ErrNotAllowed and add a comment that the TS filter allows it).
  - RandomName matches ^Gnome[1-9][0-9]{3}$ and passes Check; RandomHandle matches ^[a-z]+-[a-z]+-[1-9][0-9]{3}$ and
    every adjective and noun passes Check (loop over the slices). Use rand.New(rand.NewPCG(1, 2)) (math/rand/v2).
  - The error texts equal the TS ones exactly: "Names need at least 2 characters.", "Names are at most 18 characters.",
    "That name is not allowed. Pick another one." (they are the stub's variables; don't change them).

## Contract
names.go exported API exactly as in the stub. internal/service shows err.Error() to players.

## Done when
- cd packages/platform-server && go build ./... && go vet ./internal/names/ && go test ./internal/names/ passes

## Out of scope
Every other file, go.mod/go.sum.
~~~~

~~~~text
Epic: 1 Pieces — issue 1C: Go Postgres store
Depends on: none

## Environment
Repo root /home/user/lawn-gnome-panic. Go module packages/platform-server (Go 1.25). Dependency already in go.mod:
github.com/jackc/pgx/v5 v5.13.0 (pgxpool, pgconn). Run Go commands from packages/platform-server. Other workers
edit other packages at the same time; only touch the files under Change. Do not run `go mod tidy`.
A throwaway Postgres 16 for tests (use port 55471 so you don't collide with anyone):
    cd packages/platform-server
    eval "$(bash scripts/testdb.sh start 55471)"     # exports PLATFORM_TEST_DATABASE_URL, TESTDB_DIR
    go test ./internal/store/
    bash scripts/testdb.sh stop                       # always stop it when done
Run start, test and stop in the SAME shell command (env vars don't survive between commands), e.g.
    eval "$(bash scripts/testdb.sh start 55471)" && go test ./internal/store/; rc=$?; bash scripts/testdb.sh stop; exit $rc

## Goal
store.Postgres implements store.Store against Postgres, behaving exactly like store.Memory, with an idempotent
Migrate that is safe when two pods start at once.

## Read first
- packages/platform-server/internal/store/store.go: the Store interface and its documented behaviour (the spec).
- packages/platform-server/internal/store/memory.go: the reference implementation; NewUserID() is in it, reuse it.
- packages/platform-server/internal/store/postgres.go: the stub; keep NewPostgres, Migrate and the method signatures.

## Change
- packages/platform-server/internal/store/postgres.go: implement. Use unqualified table names (the connection's
  search_path picks the schema; production is `gnome`).
  - Migrate: in one transaction: `SELECT pg_advisory_xact_lock(7461001)`, then
      CREATE TABLE IF NOT EXISTS schema_migrations (version int PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now());
    then apply each migration whose version is not in schema_migrations, in order, inserting its version. Migration 1:
      CREATE TABLE accounts (
        user_id      text PRIMARY KEY,
        keycloak_sub text NOT NULL UNIQUE,
        state        text NOT NULL CHECK (state IN ('linked', 'pending_deletion')),
        display_name text NOT NULL,
        handle       text NOT NULL,
        look         jsonb,
        created_at   timestamptz NOT NULL,
        purge_at     timestamptz,
        CONSTRAINT accounts_handle_key UNIQUE (handle)
      );
      CREATE INDEX accounts_purge_at_idx ON accounts (purge_at) WHERE purge_at IS NOT NULL;
    Keep migrations as an ordered []string slice in the file so later ones append.
  - GetOrCreateByKeycloakSub: up to 5 attempts: h := newHandle();
      INSERT INTO accounts (user_id, keycloak_sub, state, display_name, handle, created_at)
      VALUES ($1,$2,'linked',$3,$4,$5) ON CONFLICT (keycloak_sub) DO NOTHING RETURNING <all columns>
    A returned row → created=true. No row (sub exists) → SELECT by keycloak_sub, created=false. A
    *pgconn.PgError (errors.As) with Code "23505" and ConstraintName "accounts_handle_key" → next attempt.
    After 5 handle conflicts → ErrHandleTaken. Use NewUserID() for user_id and now.UTC() for created_at.
  - UpdateProfile: UPDATE ... SET display_name = COALESCE($2, display_name), look = COALESCE($3::jsonb, look)
    WHERE user_id=$1 RETURNING ...; no row → ErrNotFound. Pass displayName as *string (nil → NULL) and lookJSON as
    nil or string(lookJSON).
  - MarkDeleted / Restore: UPDATE state (and purge_at = $2 / NULL) RETURNING ...; no row → ErrNotFound.
  - GetMany: SELECT ... WHERE user_id = ANY($1) AND state = 'linked'. Empty input → empty slice (not nil), no query.
  - PurgeExpired: DELETE FROM accounts WHERE state='pending_deletion' AND purge_at <= $1; return RowsAffected.
  - One scan helper for a row → Account: look jsonb scanned into []byte (NULL → nil); times converted .UTC();
    purge_at into *time.Time.
- packages/platform-server/internal/store/store_test.go (new): one behaviour suite run against both stores:
    func runStoreSuite(t *testing.T, newStore func(t *testing.T) Store)
    func TestMemory(t *testing.T)   { runStoreSuite(t, func(*testing.T) Store { return NewMemory() }) }
    func TestPostgres(t *testing.T) — skips (t.Skip) when PLATFORM_TEST_DATABASE_URL is empty; otherwise each
      newStore call creates a fresh schema "t_" + random hex, a pgxpool with
      cfg.ConnConfig.RuntimeParams["search_path"] = that schema, runs Migrate twice (idempotent), and on t.Cleanup
      drops the schema (CASCADE) and closes the pool.
  Suite cases (t.Run each): create returns created=true with the given name, a handle from newHandle, StateLinked,
  UserID matching ^u_[a-z2-7]{20}$; second call same sub → same account, created=false; handle collision (newHandle
  returns a taken handle first, then a free one) → gets the free one; newHandle always taken → ErrHandleTaken;
  UpdateProfile name only, look only, both, unknown id → ErrNotFound; look JSON round-trips (compare after
  json unmarshal into map, jsonb reorders keys); MarkDeleted sets state+PurgeAt; GetMany skips pending and unknown
  ids; Restore clears; PurgeExpired deletes only expired pending ones and returns the count, and the sub can then
  create a new account; 10 goroutines calling GetOrCreate for one new sub at once → exactly one created=true, all
  the same UserID. Compare times with Equal after Truncate(time.Microsecond) (Postgres stores microseconds).
  Also a test that Migrate run concurrently from 2 goroutines on a fresh schema both succeed (Postgres only).

## Contract
store.go is fixed (don't edit it). Postgres must satisfy `var _ Store = (*Postgres)(nil)`. main.go calls
store.NewPostgres(pool), pg.Migrate(ctx), pg.PurgeExpired(ctx, time.Now()).

## Done when
- cd packages/platform-server && go build ./... && go vet ./internal/store/
- eval "$(bash scripts/testdb.sh start 55471)" && go test -count=1 -v ./internal/store/ 2>&1 | tail -40; bash scripts/testdb.sh stop
  shows TestMemory and TestPostgres passing (TestPostgres must RUN, not skip)

## Out of scope
store.go, memory.go (except: none), every other package, go.mod/go.sum, main.go.
~~~~

~~~~text
Epic: 1 Pieces — issue 1D: Go UserService handlers
Depends on: none

## Environment
Repo root /home/user/lawn-gnome-panic. Go module packages/platform-server (Go 1.25), Connect RPC
(connectrpc.com/connect v1.19.1, generated code in gen/gnome/user/v1 and gen/gnome/user/v1/userv1connect).
Run Go commands from packages/platform-server. Other workers are implementing internal/auth, internal/names and
store.Postgres at the same time: their files currently hold stubs with the final signatures. Your tests must use
store.NewMemory() and a fake auth.Verifier you write in the test, and must not depend on names' real output
(the names stubs return fixed strings right now; Check currently accepts everything). Do not run `go mod tidy`.

## Goal
service.UserService implements GetMe, UpdateGnome, DeleteAccount and BatchGetGnomes.

## Read first
- packages/platform-server/internal/service/user.go: the stub (keep NewUserService, Options and the struct).
- proto/gnome/user/v1/user.proto: the RPC contract (comments say what each RPC does).
- packages/platform-server/internal/store/store.go: the Store interface. memory.go is the in-memory one.
- packages/platform-server/internal/auth/auth.go: Verifier, Caller, ErrUnauthenticated, BearerToken (stubs; signatures final).
- packages/platform-server/internal/names/names.go: Check, RandomName, RandomHandle (stubs; signatures final).

## Change
- packages/platform-server/internal/service/user.go: implement the four methods. Helpers in the same file:
  - caller(ctx, header http.Header) (auth.Caller, error): token, ok := auth.BearerToken(header); !ok →
    connect.NewError(connect.CodeUnauthenticated, errors.New("sign in first")); Verify error →
    connect.NewError(connect.CodeUnauthenticated, errors.New("sign-in expired or invalid")).
  - account(ctx, c auth.Caller) (store.Account, bool, error): s.store.GetOrCreateByKeycloakSub(ctx, c.Subject,
    names.RandomName(s.opts.Rand), func() string { return names.RandomHandle(s.opts.Rand) }, s.opts.Now()).
    Guard s.opts.Rand with a sync.Mutex (math/rand/v2 *Rand is not safe for concurrent use).
  - toGnome(a store.Account) (*userv1.Gnome, error): UserId, DisplayName, Handle, CreatedAt
    timestamppb.New(a.CreatedAt), Look: when a.LookJSON != nil, protojson.Unmarshal into &userv1.GnomeLook{}.
  - toAccount(a): &userv1.Account{UserId, State (StateLinked → ACCOUNT_STATE_LINKED, StatePendingDeletion →
    ACCOUNT_STATE_PENDING_DELETION), CreatedAt, PurgeAt (only when set)}.
  - Any unexpected store error → connect.NewError(connect.CodeInternal, errors.New("internal error")) and log.Printf the real one.
  - GetMe: caller; account; if State == StatePendingDeletion → s.store.Restore. Response {Gnome, Account, Created}.
  - UpdateGnome: caller; account; pending deletion → CodeFailedPrecondition "account is being deleted".
    Mask := req.Msg.GetUpdateMask().GetPaths(); empty → CodeInvalidArgument "update_mask is required"; any path
    other than "display_name" or "look" → CodeInvalidArgument "cannot update <path>". Gnome nil → InvalidArgument.
    display_name: names.Check(req.Msg.Gnome.DisplayName) error → CodeInvalidArgument with that error's text.
    look: nil → InvalidArgument "look is required"; validateLook: HatRgb, SkinRgb, CoatRgb, PantsRgb, BootsRgb
    and BeardRgb/HairRgb when set must be <= 0xFFFFFF; Equipment keys only "head","back","neck","hand", values 1..64
    bytes; else InvalidArgument "invalid look". Encode with protojson.Marshal. Then s.store.UpdateProfile(...)
    (nil for the part not in the mask). Response {Gnome}.
  - DeleteAccount: caller; account; req.Msg.ConfirmHandle != a.Handle → CodeInvalidArgument "confirm_handle does not
    match your handle"; purgeAt := s.opts.Now().Add(s.opts.DeleteGrace); MarkDeleted. Response {PurgeAt}.
  - BatchGetGnomes: open (no auth). len(UserIds) > 32 → InvalidArgument "at most 32 ids"; drop ids not starting with
    "u_" (local gnomes are "local-…"); dedupe; s.store.GetMany; map toGnome. Response {Gnomes}.
- packages/platform-server/internal/service/user_test.go (new):
  type fakeVerifier map[string]string (token → sub) implementing auth.Verifier (unknown token → auth.ErrUnauthenticated).
  newSvc := NewUserService(store.NewMemory(), fakeVerifier{"t1": "sub-1", "t2": "sub-2"}, Options{Now: fixed clock,
  Rand: rand.New(rand.NewPCG(1, 2))}). Build requests with connect.NewRequest(&userv1.GetMeRequest{}) and
  req.Header().Set("Authorization", "Bearer t1"). Check codes with connect.CodeOf(err).
  Cases: GetMe without header → Unauthenticated; bad token → Unauthenticated; first GetMe created=true, second false,
  same UserId; UpdateGnome name + look, then GetMe returns them (proto.Equal on the look, including optional beard
  and an equipment map); empty mask, unknown path, look with HatRgb 0x1000000, equipment key "foot" →
  InvalidArgument; DeleteAccount wrong handle → InvalidArgument; right handle → PurgeAt = now + 7 days; then
  BatchGetGnomes no longer returns it and UpdateGnome → FailedPrecondition; GetMe restores it (Account.State LINKED)
  and BatchGetGnomes returns it again; BatchGetGnomes with 33 ids → InvalidArgument; with ["local-abc", id, id] →
  one gnome; CreateGuest → CodeUnimplemented (from the embedded UnimplementedUserServiceHandler).
  Plus one end-to-end test over HTTP: mux := http.NewServeMux(); mux.Handle(userv1connect.NewUserServiceHandler(svc));
  srv := httptest.NewServer(mux); client := userv1connect.NewUserServiceClient(http.DefaultClient, srv.URL,
  connect.WithProtoJSON()); call GetMe with the header set on connect.NewRequest; expect created=true.

## Contract
user.go keeps NewUserService(st store.Store, v auth.Verifier, opts Options) *UserService, Options{Now, Rand,
DeleteGrace}, and the embedded UnimplementedUserServiceHandler. main.go uses exactly that.

## Done when
- cd packages/platform-server && go build ./... && go vet ./internal/service/ && go test ./internal/service/ passes

## Out of scope
internal/auth, internal/names, internal/store, main.go, gen/, go.mod/go.sum.
~~~~

~~~~text
Epic: 1 Pieces — issue 1E: browser sign-in with oidc-client-ts
Depends on: none

## Environment
Repo root /home/user/lawn-gnome-panic, npm workspaces (`npm install` already done; don't add packages).
Package packages/platform (@lawn/platform), TypeScript. oidc-client-ts 3.5.0 is installed. Other workers edit
packages/gnome and games/me at the same time; only touch the file under Change.

## Goal
packages/platform/src/auth.ts signs players in with Keycloak (authorization code + PKCE), keeps the session in
localStorage, refreshes access tokens, and signs out.

## Read first
- packages/platform/src/auth.ts: the stub; keep every exported name and signature, and its imports from ./session.
- packages/platform/src/session.ts: KEYCLOAK_AUTHORITY, KEYCLOAK_CLIENT_ID, KEYCLOAK_IDP_HINT, SESSION_STORAGE_KEY
  (the localStorage key oidc-client-ts uses with the settings below; hasStoredSession reads it).
- node_modules/oidc-client-ts/dist/types/oidc-client-ts.d.ts: search for "class UserManager", "signinSilent",
  "signinRedirectCallback", "WebStorageStateStore", "UserManagerSettings", "extraQueryParams" to confirm the API.

## Change
- packages/platform/src/auth.ts: implement with oidc-client-ts:
    import { UserManager, WebStorageStateStore, type User } from 'oidc-client-ts';
  - pageUrl() = location.origin + location.pathname (no query, no hash): the redirect and post-logout target.
  - One lazily created UserManager:
      new UserManager({ authority: KEYCLOAK_AUTHORITY, client_id: KEYCLOAK_CLIENT_ID, redirect_uri: pageUrl(),
        post_logout_redirect_uri: pageUrl(), response_type: 'code', scope: 'openid',
        userStore: new WebStorageStateStore({ store: localStorage }), automaticSilentRenew: false,
        loadUserInfo: false, extraQueryParams: { kc_idp_hint: KEYCLOAK_IDP_HINT } })
    (PKCE S256 is oidc-client-ts's default for the code flow.)
  - getAccessToken(): never rejects; returns null when `typeof localStorage === 'undefined'`.
    user = await mgr.getUser(); none → null. If user.expires_in is defined and > 30 → user.access_token.
    Otherwise, if user.refresh_token: refresh once with mgr.signinSilent() (with a refresh token present, v3
    uses the refresh_token grant, no iframe) and return the new access_token; on failure await mgr.removeUser()
    and return null. Concurrent calls share one in-flight refresh (keep the promise in a module variable,
    cleared when it settles).
  - signIn(): await mgr.signinRedirect().
  - completeSignIn(): p = new URLSearchParams(location.search); if !(p.has('state') && (p.has('code') ||
    p.has('error'))) return false. try { await mgr.signinRedirectCallback(); ok = true } catch (e) { console.warn;
    ok = false } finally { delete code, state, session_state, iss, error, error_description from the URL and
    history.replaceState(history.state, '', newUrl) }. Return ok.
  - signOut(): const user = await mgr.getUser(); await mgr.removeUser(); await mgr.signoutRedirect({ id_token_hint:
    user?.id_token }). If signoutRedirect throws (e.g. Keycloak unreachable), swallow it: the local session is gone.
  - Remove the "stub" comments. Keep the file comment at the top.

## Contract
Exported exactly: getAccessToken(): Promise<string | null>, signIn(): Promise<void>, completeSignIn():
Promise<boolean>, signOut(): Promise<void>. client.ts calls getAccessToken() before every RPC. hasStoredSession()
in session.ts must keep working, so the user store must be localStorage with the default "oidc." prefix.

## Done when
- npx tsc --noEmit -p packages/platform passes
- grep shows no "stub" left in packages/platform/src/auth.ts

## Out of scope
Every other file (session.ts, client.ts, url.ts, index.ts, gen/, package.json).
~~~~

~~~~text
Epic: 1 Pieces — issue 1F: the gnome store talks to the platform when signed in
Depends on: none

## Environment
Repo root /home/user/lawn-gnome-panic, npm workspaces (already installed; don't add packages). Package
packages/gnome (@lawn/gnome), TypeScript, tests with vitest (`npm test -w packages/gnome`). Other workers edit
packages/platform/src/auth.ts and games/me at the same time; only touch the files under Change.

## Goal
When a player is signed in, every game's gnome (via createGnomeStore()) comes from and saves to the platform
service; otherwise nothing changes. On first sign-in the local gnome is uploaded to the new account.

## Read first
- packages/gnome/src/types.ts: Gnome, Look, GnomeStore (the interface), GnomeStoreError.
- packages/gnome/src/store.ts: LocalGnomeStore, createGnomeStore (you change only createGnomeStore).
- packages/gnome/src/connectStore.ts: the stub you implement (keep its exports and option names).
- packages/platform/src/index.ts and packages/platform/src/session.ts: what @lawn/platform exports.
- packages/platform/src/gen/gnome/user/v1/user_pb.ts: the generated message types Gnome, GnomeLook (fields camelCase:
  hatRgb, beardRgb?, coatRgb, pantsRgb, bootsRgb, skinRgb, hairRgb?, freckles, dress, glasses, equipment:
  {[k: string]: string}), GetMeResponse {gnome?, account?, created}, Timestamp {seconds: bigint, nanos: number}.

## Change
- packages/gnome/src/store.ts: only createGnomeStore():
    import { accountsEnabled, hasStoredSession } from '@lawn/platform/session';
    import { ConnectGnomeStore } from './connectStore';
    return accountsEnabled() && hasStoredSession() ? new ConnectGnomeStore() : new LocalGnomeStore();
  Import ONLY '@lawn/platform/session' statically (it has no dependencies); never import '@lawn/platform' statically
  anywhere in packages/gnome except `import type` (it pulls the OIDC and Connect code into every game).
  Update the comment above createGnomeStore.
- packages/gnome/src/connectStore.ts: implement ConnectGnomeStore.
  - Constructor stores local (default new LocalGnomeStore()), timeoutMs (default 1200), load (default
    () => import('@lawn/platform')).
  - Conversions (module functions): protoToLook(l: GnomeLook): Look — copy the 5 required colours and 3 booleans;
    beardRgb/hairRgb only when !== undefined; equipment only when it has keys, keeping only keys head/back/neck/hand.
    lookToProto(look: Look) — the plain object init for GnomeLook (the client accepts plain objects):
    same fields, equipment: look.equipment ?? {} with undefined values dropped. protoToGnome(g) → Gnome:
    { userId, displayName, createdAt: ISO string from Timestamp (Number(seconds) * 1000 + Math.floor(nanos / 1e6);
    missing → new Date().toISOString()), look only when g.look is set }.
  - getMe(): never rejects. Race (timeoutMs) the following against a timer; on timeout or any error return
    this.local.getMe():
      api = await load(); token = await api.getAccessToken(); null → local.getMe().
      res = await api.userClient().getMe({}); g = protoToGnome(res.gnome).
      If res.created: const mine = await this.local.getMe(); upload with api.userClient().updateGnome({ gnome:
      { displayName: mine.displayName, look: mine.look ? lookToProto(mine.look) : undefined }, updateMask:
      { paths: mine.look ? ['display_name', 'look'] : ['display_name'] } }) and use its gnome (if the upload fails,
      keep g).
      Mirror into local: await this.local.updateGnome({ displayName: g.displayName, ...(g.look ? { look: g.look } :
      {}) }).catch(() => {}). Return g.
  - updateGnome(patch): validate first like LocalGnomeStore: patch.displayName → checkName (import { checkName }
    from '@lawn/mp/textFilter'), failing → throw new GnomeStoreError('INVALID_ARGUMENT', reason). paths =
    display_name and/or look for the fields present; none → return this.getMe(). token null → throw
    GnomeStoreError('UNAVAILABLE', 'Your sign-in expired. Sign in again on the Your Gnome page.'). Call
    updateGnome; ConnectError (err instanceof api.ConnectError) with code === api.Code.InvalidArgument → throw
    GnomeStoreError('INVALID_ARGUMENT', err.rawMessage); any other error → GnomeStoreError('UNAVAILABLE',
    'Could not reach the gnome server. Try again.'). On success mirror into local (as in getMe) and return the gnome.
  - batchGetGnomes(ids): ids starting with "u_" only; none → []; api.userClient().batchGetGnomes({ userIds })
    → map protoToGnome; any error → [].
- packages/gnome/src/connectStore.test.ts (new, vitest): a fake PlatformApi object cast `as unknown as PlatformApi`:
  getAccessToken: vi.fn(async () => 'tok'), userClient: () => fakeClient with vi.fn getMe/updateGnome/batchGetGnomes,
  ConnectError: a small class with `code` and `rawMessage`, Code: { InvalidArgument: 3 }. LocalGnomeStore with an
  in-memory StorageLike (see store.test.ts for how it builds one). Cases: getMe maps the proto (optional beard,
  equipment) and mirrors to local; created=true uploads the local name + look (assert updateGnome's argument incl.
  paths) and returns the uploaded gnome; token null → local gnome; getMe rejecting → local gnome; slow getMe
  (never resolves) with timeoutMs 20 → local gnome; updateGnome bad name → INVALID_ARGUMENT without calling the
  server; server InvalidArgument → INVALID_ARGUMENT with the server text; other error → UNAVAILABLE;
  batchGetGnomes filters "local-" ids and returns [] on error; createGnomeStore() in the test env (no location)
  returns a LocalGnomeStore.

## Contract
connectStore.ts exports ConnectGnomeStore, ConnectGnomeStoreOptions {local?, timeoutMs?, load?}, PlatformApi exactly
as in the stub. createGnomeStore(): GnomeStore stays the only factory games use.

## Done when
- npx tsc --noEmit -p packages/gnome passes
- npm test -w packages/gnome passes (the old 45 tests plus yours)
- grep -n "from '@lawn/platform'" packages/gnome/src/*.ts shows only `import type` lines

## Out of scope
packages/platform, games/*, types.ts, resolve.ts, look.ts, model.ts.
~~~~

~~~~text
Epic: 1 Pieces — issue 1G: the account page (/me/)
Depends on: none

## Environment
Repo root /home/user/lawn-gnome-panic, npm workspaces (already installed; don't add packages). Workspace games/me:
a plain TypeScript + DOM page built with Vite (no Phaser, no three). Dev server: `npm run dev -w games/me` (port
5199, strictPort). Other workers are implementing packages/platform/src/auth.ts and packages/gnome/src/connectStore.ts
at the same time; those files hold stubs with final signatures right now (signIn does nothing, completeSignIn
resolves false, getAccessToken resolves null). Only touch the files under Change.
Repo rules: mobile first (works at 390x844 portrait and landscape, buttons at least 44 px tall, safe-area insets, no
hover-only UI). UI goes in a container appended to #ui; never restyle or hide #ui itself.

## Goal
/me/ lets a player sign in with Google (Keycloak), see and rename their gnome, sign out, and delete the account.

## Read first
- games/me/src/main.ts, games/me/index.html: the skeleton (keep `<div id="ui">` and the main element id "me").
- packages/platform/src/index.ts, session.ts, auth.ts, client.ts: the API (accountsEnabled, hasStoredSession,
  completeSignIn, signIn, signOut, userClient, ConnectError, Code, AccountState).
- packages/platform/src/gen/gnome/user/v1/user_pb.ts: GetMeResponse {gnome?: Gnome, account?: Account, created},
  Gnome {userId, displayName, handle, look?}, Account {state, purgeAt?}, DeleteAccountResponse {purgeAt?}.
- packages/gnome/src/types.ts: GnomeStore; createGnomeStore() is exported from '@lawn/gnome'.
- packages/mp/src/textFilter.ts: checkName, NAME_MAX.

## Change
- games/me/index.html: add a <style> block (dark theme like the arcade landing page: background #121417, text
  #e8e8e8, cards #1d2127 with border #2c323b and radius 12px, links #8fb3ff, system-ui font). Body padding uses
  max(16px, env(safe-area-inset-*)). Content column max-width 480px, centred. Buttons and inputs min-height 44px,
  font-size 16px (no iOS zoom). Danger button red (#c0392b).
- games/me/src/main.ts: all page logic, plain DOM (document.createElement, textContent — never innerHTML with
  server or user text). Root: <main id="me" data-state="..."> appended to #ui. Header: h1 "Your Gnome", a link
  "← Arcade" to "../". States (set data-state on #me):
  - "unavailable": accountsEnabled() is false → text "Accounts aren't set up on this copy of the arcade. Your gnome
    still lives in this browser." + link "Edit your look in the Gnome Creator" → "../gnome-creator/".
  - "loading": while starting.
  - "signed-out": explain "Playing never needs an account. Sign in to keep your gnome on every device." Show the local
    gnome's name: (await createGnomeStore().getMe()).displayName (before sign-in this is the local store). Button
    "Sign in with Google" → signIn(). Link to the Gnome Creator. If sign-in just failed (completeSignIn returned
    false while the URL had ?state=), show "Sign-in didn't finish. Try again."
  - "signed-in": first await createGnomeStore().getMe() (this uploads the local gnome on first sign-in), then
    const res = await userClient().getMe({}). Show displayName, "@" + handle, and "Signed in" status. If res.created,
    show a short note "Your gnome from this browser is now saved to your account." Rename form: <input
    id="name" maxlength=NAME_MAX>, Save button; validate with checkName first and show its reason inline;
    save with createGnomeStore().updateGnome({ displayName }) (GnomeStoreError's message shown inline on failure,
    "Saved." on success, and update the shown name). Link "Edit your look in the Gnome Creator". Button "Sign out" →
    signOut(). A <details> "Delete account" section: text "Your gnome and account are deleted after 7 days. Signing
    in before then cancels it."; input placeholder = the handle, button "Delete my account" disabled until the
    input equals the handle exactly; on click userClient().deleteAccount({ confirmHandle }) then show "Deleted." and
    call signOut().
  - "error": a GetMe failure that is not Unauthenticated → "Couldn't reach the gnome server." + Retry button
    (re-runs start). ConnectError with code Code.Unauthenticated → treat as signed out (call signOut is NOT needed;
    just show signed-out).
  Startup: if !accountsEnabled() → unavailable. Else const urlHadState = new URLSearchParams(location.search)
  .has('state'); const done = await completeSignIn(); if hasStoredSession() → signed-in flow, else signed-out (with
  the failure note when urlHadState && !done).

## Contract
Uses only the exports named above. Keep #ui and main#me with data-state in
{unavailable, loading, signed-out, signed-in, error}: the end-of-epic smoke check looks for them.

## Done when
- npx tsc --noEmit -p games/me passes
- Run the dev server in the background, check the page, stop it:
    (npm run dev -w games/me > /tmp/me-dev.log 2>&1 &) ; sleep 4
    node -e "const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();for(const vp of
    [{width:390,height:844},{width:844,height:390},{width:1280,height:800}]){const p=await b.newPage({viewport:vp});
    const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>m.type()==='error'&&errs.push(m.text()));
    await p.goto('http://localhost:5199/');await p.waitForSelector('#me[data-state=\"signed-out\"]',{timeout:8000});
    const w=await p.evaluate(()=>document.documentElement.scrollWidth);console.log(vp,'scrollWidth',w,'errors',errs);}
    await b.close();})()"
    pkill -f "vite.*5199" ; pkill -f "games/me" || true
  On localhost accountsEnabled() is true (platformUrl falls back to http://localhost:8090/api), so the page must
  reach "signed-out" (no session), with no page errors and scrollWidth <= the viewport width at all three sizes.

## Out of scope
packages/*, tools/*, other games.
~~~~
