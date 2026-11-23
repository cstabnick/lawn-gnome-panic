package store

import (
	"context"
	"errors"
	"slices"
	"sort"
	"sync"
	"time"
)

// DayG rooms: one shared world save per room, hosted in a player's browser. The server only
// stores the save parts and relays them; Memory and Postgres behave the same (room_test.go).

// Room is one shared world save (DayG). Members can read and write its save.
type Room struct {
	Code       string // 8 of A-Z0-9, unique
	Game       int32
	Title      string
	CreatorID  string
	Members    []string // creator first, then join order
	InviteOnly bool
	Closed     bool
	Revision   int64 // 0 = no save yet
	Tick       int64
	HostID     string
	PartCount  int32
	TotalBytes int64
	PartHashes []string
	Summary    string
	CreatedAt  time.Time
	UpdatedAt  time.Time
}

// RoomManifest describes the save parts a commit makes the room's new revision.
type RoomManifest struct {
	Tick       int64
	HostID     string
	PartCount  int32
	TotalBytes int64
	PartHashes []string
	Summary    string
}

const (
	MaxRoomPartBytes = 512 * 1024
	MaxRoomParts     = 16
	MaxRoomBytes     = 8 * 1024 * 1024
	MaxRoomMembers   = 64
)

// ErrTooBig: a part or a save is larger than the room limits allow, or a part index is out of range.
var ErrTooBig = errors.New("store: too big")

// RoomStore keeps DayG rooms. All methods are safe for concurrent use.
type RoomStore interface {
	CreateRoom(ctx context.Context, code string, game int32, title, creatorID string, now time.Time) (Room, error) // ErrConflict: code taken
	GetRoom(ctx context.Context, code string) (Room, error)                                                        // ErrNotFound
	AddMember(ctx context.Context, code, userID string, now time.Time) (Room, error)                               // idempotent; ErrNotFound; ErrConflict at MaxRoomMembers
	RemoveMembers(ctx context.Context, code string, userIDs []string, now time.Time) (Room, error)                 // never removes the creator
	SetRoomFlags(ctx context.Context, code string, inviteOnly, closed *bool, now time.Time) (Room, error)          // nil = unchanged
	ListRoomsOf(ctx context.Context, userID string, game int32) ([]Room, error)                                    // member rooms, newest UpdatedAt first
	PutPart(ctx context.Context, code, uploadID string, index int32, data []byte, now time.Time) error             // ErrNotFound room; ErrTooBig: index >= MaxRoomParts or len(data) > MaxRoomPartBytes
	CommitSave(ctx context.Context, code string, baseRevision int64, uploadID string, m RoomManifest, now time.Time) (Room, error)
	// CommitSave: ErrConflict when baseRevision != Room.Revision; ErrNotFound when a part 0..m.PartCount-1 of uploadID
	// is not staged; ErrTooBig when m.TotalBytes > MaxRoomBytes or the staged bytes differ from m.TotalBytes. On success
	// Revision+1, the manifest fields copied in, the previous revision's parts and this upload's staging dropped.
	GetPart(ctx context.Context, code string, revision int64, index int32) ([]byte, error) // ErrNotFound unless revision == Room.Revision and index < PartCount
	CreateInvite(ctx context.Context, code, token string, now time.Time) error
	UseInvite(ctx context.Context, code, token string, now time.Time) error // ErrNotFound when unknown or already used
	PurgeUploads(ctx context.Context, before time.Time) (int, error)        // drops staged parts older than before; returns how many
}

type stagedKey struct {
	code     string
	uploadID string
	index    int32
}

type stagedPart struct {
	data []byte
	at   time.Time
}

type invite struct {
	code string
	used bool
}

// MemoryRooms is the in-memory RoomStore for tests and for running without Postgres.
type MemoryRooms struct {
	mu        sync.Mutex
	rooms     map[string]*Room
	committed map[string][][]byte // code -> parts of the current revision
	staged    map[stagedKey]stagedPart
	invites   map[string]*invite // token -> invite
}

var _ RoomStore = (*MemoryRooms)(nil)

func NewMemoryRooms() *MemoryRooms {
	return &MemoryRooms{
		rooms:     map[string]*Room{},
		committed: map[string][][]byte{},
		staged:    map[stagedKey]stagedPart{},
		invites:   map[string]*invite{},
	}
}

func cloneRoom(r *Room) Room {
	c := *r
	c.Members = append([]string(nil), r.Members...)
	c.PartHashes = append([]string(nil), r.PartHashes...)
	return c
}

func cloneBytes(b []byte) []byte {
	return append([]byte(nil), b...)
}

func (m *MemoryRooms) CreateRoom(_ context.Context, code string, game int32, title, creatorID string, now time.Time) (Room, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	if _, ok := m.rooms[code]; ok {
		return Room{}, ErrConflict
	}
	t := now.UTC()
	r := &Room{Code: code, Game: game, Title: title, CreatorID: creatorID, Members: []string{creatorID}, CreatedAt: t, UpdatedAt: t}
	m.rooms[code] = r
	return cloneRoom(r), nil
}

func (m *MemoryRooms) GetRoom(_ context.Context, code string) (Room, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	r, ok := m.rooms[code]
	if !ok {
		return Room{}, ErrNotFound
	}
	return cloneRoom(r), nil
}

func (m *MemoryRooms) AddMember(_ context.Context, code, userID string, now time.Time) (Room, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	r, ok := m.rooms[code]
	if !ok {
		return Room{}, ErrNotFound
	}
	if slices.Contains(r.Members, userID) {
		return cloneRoom(r), nil
	}
	if len(r.Members) >= MaxRoomMembers {
		return Room{}, ErrConflict
	}
	r.Members = append(r.Members, userID)
	r.UpdatedAt = now.UTC()
	return cloneRoom(r), nil
}

func (m *MemoryRooms) RemoveMembers(_ context.Context, code string, userIDs []string, now time.Time) (Room, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	r, ok := m.rooms[code]
	if !ok {
		return Room{}, ErrNotFound
	}
	kept := make([]string, 0, len(r.Members))
	changed := false
	for _, id := range r.Members {
		if id != r.CreatorID && slices.Contains(userIDs, id) {
			changed = true
			continue
		}
		kept = append(kept, id)
	}
	if changed {
		r.Members = kept
		r.UpdatedAt = now.UTC()
	}
	return cloneRoom(r), nil
}

func (m *MemoryRooms) SetRoomFlags(_ context.Context, code string, inviteOnly, closed *bool, now time.Time) (Room, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	r, ok := m.rooms[code]
	if !ok {
		return Room{}, ErrNotFound
	}
	if inviteOnly != nil {
		r.InviteOnly = *inviteOnly
	}
	if closed != nil {
		r.Closed = *closed
	}
	r.UpdatedAt = now.UTC()
	return cloneRoom(r), nil
}

func (m *MemoryRooms) ListRoomsOf(_ context.Context, userID string, game int32) ([]Room, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	out := []Room{}
	for _, r := range m.rooms {
		if r.Game == game && slices.Contains(r.Members, userID) {
			out = append(out, cloneRoom(r))
		}
	}
	sort.SliceStable(out, func(i, j int) bool {
		if !out[i].UpdatedAt.Equal(out[j].UpdatedAt) {
			return out[i].UpdatedAt.After(out[j].UpdatedAt)
		}
		return out[i].Code < out[j].Code
	})
	return out, nil
}

func (m *MemoryRooms) PutPart(_ context.Context, code, uploadID string, index int32, data []byte, now time.Time) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	if _, ok := m.rooms[code]; !ok {
		return ErrNotFound
	}
	if index < 0 || index >= MaxRoomParts || len(data) > MaxRoomPartBytes {
		return ErrTooBig
	}
	m.staged[stagedKey{code, uploadID, index}] = stagedPart{data: cloneBytes(data), at: now.UTC()}
	return nil
}

func (m *MemoryRooms) CommitSave(_ context.Context, code string, baseRevision int64, uploadID string, mf RoomManifest, now time.Time) (Room, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	r, ok := m.rooms[code]
	if !ok {
		return Room{}, ErrNotFound
	}
	if baseRevision != r.Revision {
		return Room{}, ErrConflict
	}
	parts := make([][]byte, 0, mf.PartCount)
	var staged int64
	for i := int32(0); i < mf.PartCount; i++ {
		p, ok := m.staged[stagedKey{code, uploadID, i}]
		if !ok {
			return Room{}, ErrNotFound
		}
		parts = append(parts, p.data)
		staged += int64(len(p.data))
	}
	if mf.TotalBytes > MaxRoomBytes || staged != mf.TotalBytes {
		return Room{}, ErrTooBig
	}
	for k := range m.staged {
		if k.code == code && k.uploadID == uploadID {
			delete(m.staged, k)
		}
	}
	m.committed[code] = parts
	r.Revision++
	r.Tick = mf.Tick
	r.HostID = mf.HostID
	r.PartCount = mf.PartCount
	r.TotalBytes = mf.TotalBytes
	r.PartHashes = append([]string(nil), mf.PartHashes...)
	r.Summary = mf.Summary
	r.UpdatedAt = now.UTC()
	return cloneRoom(r), nil
}

func (m *MemoryRooms) GetPart(_ context.Context, code string, revision int64, index int32) ([]byte, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	r, ok := m.rooms[code]
	if !ok || revision != r.Revision || index < 0 || index >= r.PartCount {
		return nil, ErrNotFound
	}
	parts := m.committed[code]
	if int(index) >= len(parts) {
		return nil, ErrNotFound
	}
	return cloneBytes(parts[index]), nil
}

func (m *MemoryRooms) CreateInvite(_ context.Context, code, token string, _ time.Time) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	if _, ok := m.rooms[code]; !ok {
		return ErrNotFound
	}
	if _, ok := m.invites[token]; ok {
		return ErrConflict
	}
	m.invites[token] = &invite{code: code}
	return nil
}

func (m *MemoryRooms) UseInvite(_ context.Context, code, token string, _ time.Time) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	inv, ok := m.invites[token]
	if !ok || inv.used || inv.code != code {
		return ErrNotFound
	}
	inv.used = true
	return nil
}

func (m *MemoryRooms) PurgeUploads(_ context.Context, before time.Time) (int, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	n := 0
	for k, p := range m.staged {
		if p.at.Before(before) {
			delete(m.staged, k)
			n++
		}
	}
	return n, nil
}
