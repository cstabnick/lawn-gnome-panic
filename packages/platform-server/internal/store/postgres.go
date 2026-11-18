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
}

// accountCols is the column list every query returns, in the order scanAccount reads it.
const accountCols = "user_id, keycloak_sub, state, display_name, handle, look, created_at, purge_at"

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
