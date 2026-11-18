package store

import (
	"context"
	"crypto/rand"
	"encoding/base32"
	"strings"
	"sync"
	"time"
)

// Memory is an in-memory Store for tests. It is the reference for how a Store behaves.
type Memory struct {
	mu    sync.Mutex
	byID  map[string]*Account
	bySub map[string]string
}

var _ Store = (*Memory)(nil)

func NewMemory() *Memory {
	return &Memory{byID: map[string]*Account{}, bySub: map[string]string{}}
}

// NewUserID returns "u_" + 20 lower-case base32 characters (100 random bits).
func NewUserID() string {
	b := make([]byte, 13)
	_, _ = rand.Read(b)
	s := strings.ToLower(base32.StdEncoding.WithPadding(base32.NoPadding).EncodeToString(b))
	return "u_" + s[:20]
}

func clone(a *Account) Account {
	c := *a
	if a.LookJSON != nil {
		c.LookJSON = append([]byte(nil), a.LookJSON...)
	}
	if a.PurgeAt != nil {
		t := *a.PurgeAt
		c.PurgeAt = &t
	}
	return c
}

func (m *Memory) handleTaken(h string) bool {
	for _, a := range m.byID {
		if a.Handle == h {
			return true
		}
	}
	return false
}

func (m *Memory) GetOrCreateByKeycloakSub(_ context.Context, sub, displayName string, newHandle func() string, now time.Time) (Account, bool, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	if id, ok := m.bySub[sub]; ok {
		return clone(m.byID[id]), false, nil
	}
	handle := ""
	for i := 0; i < 5; i++ {
		if h := newHandle(); !m.handleTaken(h) {
			handle = h
			break
		}
	}
	if handle == "" {
		return Account{}, false, ErrHandleTaken
	}
	a := &Account{UserID: NewUserID(), KeycloakSub: sub, State: StateLinked, DisplayName: displayName, Handle: handle, CreatedAt: now.UTC()}
	m.byID[a.UserID] = a
	m.bySub[sub] = a.UserID
	return clone(a), true, nil
}

func (m *Memory) UpdateProfile(_ context.Context, userID string, displayName *string, lookJSON []byte) (Account, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	a, ok := m.byID[userID]
	if !ok {
		return Account{}, ErrNotFound
	}
	if displayName != nil {
		a.DisplayName = *displayName
	}
	if lookJSON != nil {
		a.LookJSON = append([]byte(nil), lookJSON...)
	}
	return clone(a), nil
}

func (m *Memory) MarkDeleted(_ context.Context, userID string, purgeAt time.Time) (Account, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	a, ok := m.byID[userID]
	if !ok {
		return Account{}, ErrNotFound
	}
	t := purgeAt.UTC()
	a.State, a.PurgeAt = StatePendingDeletion, &t
	return clone(a), nil
}

func (m *Memory) Restore(_ context.Context, userID string) (Account, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	a, ok := m.byID[userID]
	if !ok {
		return Account{}, ErrNotFound
	}
	a.State, a.PurgeAt = StateLinked, nil
	return clone(a), nil
}

func (m *Memory) GetMany(_ context.Context, userIDs []string) ([]Account, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	out := []Account{}
	seen := map[string]bool{}
	for _, id := range userIDs {
		if a, ok := m.byID[id]; ok && a.State == StateLinked && !seen[id] {
			seen[id] = true
			out = append(out, clone(a))
		}
	}
	return out, nil
}

func (m *Memory) PurgeExpired(_ context.Context, now time.Time) (int64, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	var n int64
	for id, a := range m.byID {
		if a.State == StatePendingDeletion && a.PurgeAt != nil && !a.PurgeAt.After(now) {
			delete(m.byID, id)
			delete(m.bySub, a.KeycloakSub)
			n++
		}
	}
	return n, nil
}
