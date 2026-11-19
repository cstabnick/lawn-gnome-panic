// Package store keeps accounts. Two implementations: Postgres (postgres.go, production; tables in
// the `gnome` schema) and Memory (memory.go, for tests). They behave identically; the Postgres
// tests check the same behaviours as the Memory ones.
package store

import (
	"context"
	"errors"
	"time"
)

// State of an account. Stored as these exact strings.
type State string

const (
	StateLinked          State = "linked"
	StatePendingDeletion State = "pending_deletion"
)

// Account is one player. One gnome per account, so the gnome's fields live here too.
type Account struct {
	// "u_" + 20 lower-case base32 characters, made by the store on insert. Never changes.
	UserID string
	// Keycloak `sub`. Unique.
	KeycloakSub string
	State       State
	DisplayName string
	// Unique, server-assigned ("mossy-boots-4821").
	Handle string
	// The gnome's look as protojson of gnome.user.v1.GnomeLook; nil = no look saved yet.
	LookJSON  []byte
	CreatedAt time.Time
	// Set only while State is StatePendingDeletion.
	PurgeAt *time.Time
}

var (
	// ErrNotFound: no account with that id (or it was purged).
	ErrNotFound = errors.New("store: not found")
	// ErrHandleTaken: every handle the generator offered was in use.
	ErrHandleTaken = errors.New("store: no free handle")
	// ErrConflict: PutSave's baseRevision is not the stored revision.
	ErrConflict = errors.New("store: revision conflict")
)

// Save is one account's save for one game. Game is the gnome.common.v1.Game enum number.
type Save struct {
	UserID    string
	Game      int32
	Data      string
	Summary   string
	Revision  int64
	UpdatedAt time.Time
}

// Store is everything the service needs. All methods are safe for concurrent use.
type Store interface {
	// GetOrCreateByKeycloakSub returns the account of sub. When there is none, it inserts one
	// (StateLinked, the given displayName, a handle from newHandle, CreatedAt = now) and returns
	// created = true. newHandle is called again while the handle is taken, at most 5 times in all,
	// then ErrHandleTaken. Two concurrent calls for the same new sub create one account; both
	// return it (one of them with created = true). An account in StatePendingDeletion is returned
	// as it is (the service decides to restore it).
	GetOrCreateByKeycloakSub(ctx context.Context, sub, displayName string, newHandle func() string, now time.Time) (acct Account, created bool, err error)

	// UpdateProfile sets DisplayName when displayName != nil and LookJSON when lookJSON != nil
	// (both may be set), and returns the updated account. ErrNotFound when userID does not exist.
	UpdateProfile(ctx context.Context, userID string, displayName *string, lookJSON []byte) (Account, error)

	// MarkDeleted sets StatePendingDeletion and PurgeAt. ErrNotFound when userID does not exist.
	MarkDeleted(ctx context.Context, userID string, purgeAt time.Time) (Account, error)

	// Restore sets StateLinked and clears PurgeAt. ErrNotFound when userID does not exist.
	Restore(ctx context.Context, userID string) (Account, error)

	// GetMany returns the accounts among userIDs that exist and are StateLinked, in any order.
	// Unknown ids are skipped (no error). An empty list returns an empty result.
	GetMany(ctx context.Context, userIDs []string) ([]Account, error)

	// PurgeExpired deletes every StatePendingDeletion account with PurgeAt <= now and returns how many.
	// Their saves are deleted with them.
	PurgeExpired(ctx context.Context, now time.Time) (int64, error)

	// GetSave returns the save of (userID, game), or ErrNotFound.
	GetSave(ctx context.Context, userID string, game int32) (Save, error)

	// PutSave writes the save of (userID, game) if the stored revision equals baseRevision (0 = no
	// save stored yet): Revision becomes baseRevision+1, UpdatedAt = now. Otherwise ErrConflict and
	// nothing changes. Two concurrent writes with the same baseRevision: exactly one succeeds.
	// ErrNotFound when the account does not exist.
	PutSave(ctx context.Context, userID string, game int32, data, summary string, baseRevision int64, now time.Time) (Save, error)
}
