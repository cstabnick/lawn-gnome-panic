package store

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Postgres is the production Store. Tables live in the schema the connection's search_path
// points at (`gnome` in production; tests use a throwaway schema).
type Postgres struct {
	pool *pgxpool.Pool
}

var _ Store = (*Postgres)(nil)

// NewPostgres wraps a pool. Call Migrate once at startup before using it.
func NewPostgres(pool *pgxpool.Pool) *Postgres { return &Postgres{pool: pool} }

// migrations are applied in order; migration i+1 is recorded as version i+1. Append only.
var migrations = []string{
	`CREATE TABLE accounts (
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
	CREATE INDEX accounts_purge_at_idx ON accounts (purge_at) WHERE purge_at IS NOT NULL;`,
	`CREATE TABLE saves (
		user_id    text NOT NULL REFERENCES accounts(user_id) ON DELETE CASCADE,
		game       integer NOT NULL,
		data       text NOT NULL,
		summary    text NOT NULL,
		revision   bigint NOT NULL,
		updated_at timestamptz NOT NULL,
		PRIMARY KEY (user_id, game)
	);`,
	// Hitch reports from @lawn/profiler (hitch_postgres.go). Anonymous: no account id. One row per page load
	// in hitch_sessions (with running totals so the session list needs no aggregate), one per hitch in hitches.
	`CREATE TABLE hitch_sessions (
		session_id   text PRIMARY KEY,
		game         text NOT NULL,
		build        text NOT NULL,
		device       jsonb NOT NULL,
		threshold_ms double precision NOT NULL,
		started_at   timestamptz NOT NULL,
		last_seen    timestamptz NOT NULL,
		hitch_count  integer NOT NULL DEFAULT 0,
		worst_ms     double precision NOT NULL DEFAULT 0,
		total_ms     double precision NOT NULL DEFAULT 0
	);
	CREATE INDEX hitch_sessions_seen_idx ON hitch_sessions (last_seen);
	CREATE TABLE hitches (
		id          bigserial PRIMARY KEY,
		session_id  text NOT NULL REFERENCES hitch_sessions(session_id) ON DELETE CASCADE,
		game        text NOT NULL,
		kind        text NOT NULL,
		at_ms       double precision NOT NULL,
		duration_ms double precision NOT NULL,
		occurred_at timestamptz NOT NULL,
		context     jsonb NOT NULL,
		spans       jsonb NOT NULL
	);
	CREATE INDEX hitches_session_idx ON hitches (session_id, at_ms);
	CREATE INDEX hitches_time_idx ON hitches (occurred_at, game);`,
	// DayG rooms (room_postgres.go). A room is one shared world save; parts of the current revision live in
	// room_parts, staged parts of an upload in room_uploads, invites in room_invites. Children cascade with the room.
	`CREATE TABLE rooms (
		code        text PRIMARY KEY,
		game        integer NOT NULL,
		title       text NOT NULL,
		creator_id  text NOT NULL,
		invite_only boolean NOT NULL DEFAULT false,
		closed      boolean NOT NULL DEFAULT false,
		revision    bigint NOT NULL DEFAULT 0,
		tick        bigint NOT NULL DEFAULT 0,
		host_id     text NOT NULL DEFAULT '',
		part_count  integer NOT NULL DEFAULT 0,
		total_bytes bigint NOT NULL DEFAULT 0,
		part_hashes text[] NOT NULL DEFAULT '{}',
		summary     text NOT NULL DEFAULT '',
		created_at  timestamptz NOT NULL,
		updated_at  timestamptz NOT NULL
	);
	CREATE TABLE room_members (
		code      text NOT NULL REFERENCES rooms(code) ON DELETE CASCADE,
		user_id   text NOT NULL,
		joined_at timestamptz NOT NULL,
		PRIMARY KEY (code, user_id)
	);
	CREATE INDEX room_members_user_idx ON room_members (user_id);
	CREATE TABLE room_parts (
		code     text NOT NULL REFERENCES rooms(code) ON DELETE CASCADE,
		revision bigint NOT NULL,
		idx      integer NOT NULL,
		data     bytea NOT NULL,
		PRIMARY KEY (code, revision, idx)
	);
	CREATE TABLE room_uploads (
		code       text NOT NULL REFERENCES rooms(code) ON DELETE CASCADE,
		upload_id  text NOT NULL,
		idx        integer NOT NULL,
		data       bytea NOT NULL,
		created_at timestamptz NOT NULL,
		PRIMARY KEY (code, upload_id, idx)
	);
	CREATE TABLE room_invites (
		code       text NOT NULL REFERENCES rooms(code) ON DELETE CASCADE,
		token      text PRIMARY KEY,
		used       boolean NOT NULL DEFAULT false,
		created_at timestamptz NOT NULL DEFAULT now()
	);`,
	// Hitch render and frame stats per hitch, and the sample count per hitch session.
	`ALTER TABLE hitches ADD COLUMN render jsonb; ALTER TABLE hitches ADD COLUMN frames jsonb; ALTER TABLE hitch_sessions ADD COLUMN sample_count integer NOT NULL DEFAULT 0;`,
}

// accountCols is the column list every query returns, in the order scanAccount reads it.
const accountCols = "user_id, keycloak_sub, state, display_name, handle, look, created_at, purge_at"

// saveCols is the column list every save query returns, in the order scanSave reads it.
const saveCols = "user_id, game, data, summary, revision, updated_at"

// Migrate creates or upgrades the tables (idempotent, safe to run on every start, and safe when
// two pods start at once: the transaction-scoped advisory lock serialises them).
func (p *Postgres) Migrate(ctx context.Context) error {
	tx, err := p.pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("migrate: begin: %w", err)
	}
	defer tx.Rollback(ctx) // no-op after a successful commit

	if _, err := tx.Exec(ctx, "SELECT pg_advisory_xact_lock(7461001)"); err != nil {
		return fmt.Errorf("migrate: lock: %w", err)
	}
	if _, err := tx.Exec(ctx, `CREATE TABLE IF NOT EXISTS schema_migrations (
		version    int PRIMARY KEY,
		applied_at timestamptz NOT NULL DEFAULT now()
	)`); err != nil {
		return fmt.Errorf("migrate: schema_migrations: %w", err)
	}
	for i, stmt := range migrations {
		version := i + 1
		var applied bool
		if err := tx.QueryRow(ctx, "SELECT EXISTS (SELECT 1 FROM schema_migrations WHERE version = $1)", version).Scan(&applied); err != nil {
			return fmt.Errorf("migrate: check %d: %w", version, err)
		}
		if applied {
			continue
		}
		if _, err := tx.Exec(ctx, stmt); err != nil {
			return fmt.Errorf("migrate: apply %d: %w", version, err)
		}
		if _, err := tx.Exec(ctx, "INSERT INTO schema_migrations (version) VALUES ($1)", version); err != nil {
			return fmt.Errorf("migrate: record %d: %w", version, err)
		}
	}
	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("migrate: commit: %w", err)
	}
	return nil
}

type rowScanner interface {
	Scan(dest ...any) error
}

func scanAccount(r rowScanner) (Account, error) {
	var (
		a       Account
		state   string
		look    []byte
		created time.Time
		purge   *time.Time
	)
	if err := r.Scan(&a.UserID, &a.KeycloakSub, &state, &a.DisplayName, &a.Handle, &look, &created, &purge); err != nil {
		return Account{}, err
	}
	a.State = State(state)
	a.LookJSON = look
	a.CreatedAt = created.UTC()
	if purge != nil {
		t := purge.UTC()
		a.PurgeAt = &t
	}
	return a, nil
}

func (p *Postgres) GetOrCreateByKeycloakSub(ctx context.Context, sub, displayName string, newHandle func() string, now time.Time) (Account, bool, error) {
	for attempt := 0; attempt < 5; attempt++ {
		h := newHandle()
		a, err := scanAccount(p.pool.QueryRow(ctx,
			`INSERT INTO accounts (user_id, keycloak_sub, state, display_name, handle, created_at)
			 VALUES ($1, $2, 'linked', $3, $4, $5)
			 ON CONFLICT (keycloak_sub) DO NOTHING
			 RETURNING `+accountCols,
			NewUserID(), sub, displayName, h, now.UTC()))
		if err == nil {
			return a, true, nil
		}
		if !errors.Is(err, pgx.ErrNoRows) {
			var pe *pgconn.PgError
			if errors.As(err, &pe) && pe.Code == "23505" && pe.ConstraintName == "accounts_handle_key" {
				continue // handle taken: try the next one
			}
			return Account{}, false, fmt.Errorf("insert account: %w", err)
		}
		// No row returned: the sub already has an account (ON CONFLICT DO NOTHING).
		a, err = scanAccount(p.pool.QueryRow(ctx,
			`SELECT `+accountCols+` FROM accounts WHERE keycloak_sub = $1`, sub))
		if err != nil {
			return Account{}, false, fmt.Errorf("select account by sub: %w", err)
		}
		return a, false, nil
	}
	return Account{}, false, ErrHandleTaken
}

func (p *Postgres) UpdateProfile(ctx context.Context, userID string, displayName *string, lookJSON []byte) (Account, error) {
	var look *string
	if lookJSON != nil {
		s := string(lookJSON)
		look = &s
	}
	a, err := scanAccount(p.pool.QueryRow(ctx,
		`UPDATE accounts
		   SET display_name = COALESCE($2, display_name),
		       look         = COALESCE($3::jsonb, look)
		 WHERE user_id = $1
		 RETURNING `+accountCols,
		userID, displayName, look))
	if errors.Is(err, pgx.ErrNoRows) {
		return Account{}, ErrNotFound
	}
	if err != nil {
		return Account{}, fmt.Errorf("update profile: %w", err)
	}
	return a, nil
}

func (p *Postgres) MarkDeleted(ctx context.Context, userID string, purgeAt time.Time) (Account, error) {
	a, err := scanAccount(p.pool.QueryRow(ctx,
		`UPDATE accounts SET state = 'pending_deletion', purge_at = $2
		 WHERE user_id = $1
		 RETURNING `+accountCols,
		userID, purgeAt.UTC()))
	if errors.Is(err, pgx.ErrNoRows) {
		return Account{}, ErrNotFound
	}
	if err != nil {
		return Account{}, fmt.Errorf("mark deleted: %w", err)
	}
	return a, nil
}

func (p *Postgres) Restore(ctx context.Context, userID string) (Account, error) {
	a, err := scanAccount(p.pool.QueryRow(ctx,
		`UPDATE accounts SET state = 'linked', purge_at = NULL
		 WHERE user_id = $1
		 RETURNING `+accountCols,
		userID))
	if errors.Is(err, pgx.ErrNoRows) {
		return Account{}, ErrNotFound
	}
	if err != nil {
		return Account{}, fmt.Errorf("restore: %w", err)
	}
	return a, nil
}

func (p *Postgres) GetMany(ctx context.Context, userIDs []string) ([]Account, error) {
	out := []Account{}
	if len(userIDs) == 0 {
		return out, nil
	}
	rows, err := p.pool.Query(ctx,
		`SELECT `+accountCols+` FROM accounts WHERE user_id = ANY($1) AND state = 'linked'`,
		userIDs)
	if err != nil {
		return nil, fmt.Errorf("get many: %w", err)
	}
	defer rows.Close()
	for rows.Next() {
		a, err := scanAccount(rows)
		if err != nil {
			return nil, fmt.Errorf("get many scan: %w", err)
		}
		out = append(out, a)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("get many: %w", err)
	}
	return out, nil
}

func (p *Postgres) PurgeExpired(ctx context.Context, now time.Time) (int64, error) {
	tag, err := p.pool.Exec(ctx,
		`DELETE FROM accounts WHERE state = 'pending_deletion' AND purge_at <= $1`, now.UTC())
	if err != nil {
		return 0, fmt.Errorf("purge expired: %w", err)
	}
	return tag.RowsAffected(), nil
}

func scanSave(r rowScanner) (Save, error) {
	var (
		sv      Save
		updated time.Time
	)
	if err := r.Scan(&sv.UserID, &sv.Game, &sv.Data, &sv.Summary, &sv.Revision, &updated); err != nil {
		return Save{}, err
	}
	sv.UpdatedAt = updated.UTC()
	return sv, nil
}

func (p *Postgres) GetSave(ctx context.Context, userID string, game int32) (Save, error) {
	sv, err := scanSave(p.pool.QueryRow(ctx,
		`SELECT `+saveCols+` FROM saves WHERE user_id = $1 AND game = $2`,
		userID, game))
	if errors.Is(err, pgx.ErrNoRows) {
		return Save{}, ErrNotFound
	}
	if err != nil {
		return Save{}, fmt.Errorf("get save: %w", err)
	}
	return sv, nil
}

func (p *Postgres) PutSave(ctx context.Context, userID string, game int32, data, summary string, baseRevision int64, now time.Time) (Save, error) {
	var (
		sv  Save
		err error
	)
	if baseRevision == 0 {
		sv, err = scanSave(p.pool.QueryRow(ctx,
			`INSERT INTO saves (user_id, game, data, summary, revision, updated_at)
			 VALUES ($1, $2, $3, $4, 1, $5)
			 ON CONFLICT (user_id, game) DO NOTHING
			 RETURNING `+saveCols,
			userID, game, data, summary, now.UTC()))
		if errors.Is(err, pgx.ErrNoRows) {
			return Save{}, ErrConflict // a save already exists
		}
		var pe *pgconn.PgError
		if errors.As(err, &pe) && pe.Code == "23503" { // foreign key: no such account
			return Save{}, ErrNotFound
		}
	} else {
		sv, err = scanSave(p.pool.QueryRow(ctx,
			`UPDATE saves
			   SET data = $3, summary = $4, revision = revision + 1, updated_at = $5
			 WHERE user_id = $1 AND game = $2 AND revision = $6
			 RETURNING `+saveCols,
			userID, game, data, summary, now.UTC(), baseRevision))
		if errors.Is(err, pgx.ErrNoRows) {
			return Save{}, ErrConflict // stale revision, or no such account
		}
	}
	if err != nil {
		return Save{}, fmt.Errorf("put save: %w", err)
	}
	return sv, nil
}
