package store

import (
	"context"
	"sort"
	"sync"
	"time"
)

// Hitch reports from the opt-in @lawn/profiler (gnome.profile.v1.ProfileService). Anonymous: a
// session is one page load, keyed by a random id; nothing links it to an account.

// HitchDevice is the device class a session ran on.
type HitchDevice struct {
	GPU       string  `json:"gpu,omitempty"`
	Touch     bool    `json:"touch,omitempty"`
	Cores     int32   `json:"cores,omitempty"`
	MemoryGB  float32 `json:"mem,omitempty"`
	UserAgent string  `json:"ua,omitempty"`
	Width     int32   `json:"w,omitempty"`
	Height    int32   `json:"h,omitempty"`
}

// HitchSpan is one timed system inside a frame (ms from the frame start).
type HitchSpan struct {
	Name     string  `json:"n"`
	StartMS  float64 `json:"s"`
	Duration float64 `json:"d"`
}

// HitchRender is what the renderer drew (the frame, or a sample window's means).
type HitchRender struct {
	DrawCalls  float64 `json:"dc"`
	Triangles  float64 `json:"tri"`
	Geometries int32   `json:"geo,omitempty"`
	Textures   int32   `json:"tex,omitempty"`
	Programs   int32   `json:"prog,omitempty"`
	GpuMS      float64 `json:"gpu,omitempty"`
	PixelRatio float32 `json:"pr,omitempty"`
}

// HitchFrames is frame-time health over a sample window.
type HitchFrames struct {
	Frames int32   `json:"n"`
	P50MS  float64 `json:"p50"`
	P95MS  float64 `json:"p95"`
	MaxMS  float64 `json:"max"`
	CPUMS  float64 `json:"cpu"`
}

// Hitch is one slow frame, long task, frame gap, measured mark or sample window.
type Hitch struct {
	SessionID  string
	Game       string
	Kind       string
	AtMS       float64
	DurationMS float64
	OccurredAt time.Time
	Context    map[string]string
	Spans      []HitchSpan
	Render     *HitchRender
	Frames     *HitchFrames
}

// HitchSession is what a batch says about its page load.
type HitchSession struct {
	SessionID   string
	Game        string
	Build       string
	Device      HitchDevice
	ThresholdMS float64
}

// HitchSessionSummary is a session with its totals.
type HitchSessionSummary struct {
	HitchSession
	StartedAt   time.Time
	LastSeen    time.Time
	HitchCount  int32
	WorstMS     float64
	TotalMS     float64
	SampleCount int32
}

// MaxHitchesPerSession caps what one page load can store.
const MaxHitchesPerSession = 500

// MaxSamplesPerSession caps the frame-sample windows one page load can store, apart from its hitches.
const MaxSamplesPerSession = 720

// SampleKind is the Kind of a periodic frame-sample window. Samples count in SampleCount, not in the hitch totals.
const SampleKind = "sample"

// HitchStore keeps hitch reports. Memory and Postgres behave the same (hitch_test.go).
type HitchStore interface {
	// AddHitches upserts the session (first batch sets StartedAt = now; every batch sets LastSeen =
	// now and the other session fields) and stores the hitches. Hitches of kind SampleKind are
	// samples: stored up to MaxSamplesPerSession for the session in all, and counted in SampleCount
	// only. Every other kind is stored up to MaxHitchesPerSession for the session in all, and updates
	// HitchCount, WorstMS and TotalMS. Returns how many were stored, samples and hitches together.
	AddHitches(ctx context.Context, s HitchSession, hitches []Hitch, now time.Time) (int, error)

	// ListHitchSessions returns sessions with LastSeen >= since (and Game == game unless game is
	// ""), worst hitch first, at most limit; plus the sorted distinct games among sessions seen
	// since then (ignoring the game filter).
	ListHitchSessions(ctx context.Context, game string, since time.Time, limit int) ([]HitchSessionSummary, []string, error)

	// GetHitchSession returns one session and its hitches by AtMS, or ErrNotFound.
	GetHitchSession(ctx context.Context, sessionID string) (HitchSessionSummary, []Hitch, error)

	// QueryHitches returns hitches with since <= OccurredAt < until (and Game == game unless ""),
	// oldest first, at most limit.
	QueryHitches(ctx context.Context, game string, since, until time.Time, limit int) ([]Hitch, error)

	// PurgeHitches deletes sessions last seen before `before`, with their hitches. Returns how many sessions.
	PurgeHitches(ctx context.Context, before time.Time) (int64, error)
}

// MemoryHitches is the in-memory HitchStore for tests and for running without Postgres.
type MemoryHitches struct {
	mu       sync.Mutex
	sessions map[string]*HitchSessionSummary
	hitches  map[string][]Hitch
}

var _ HitchStore = (*MemoryHitches)(nil)

func NewMemoryHitches() *MemoryHitches {
	return &MemoryHitches{sessions: map[string]*HitchSessionSummary{}, hitches: map[string][]Hitch{}}
}

func (m *MemoryHitches) AddHitches(_ context.Context, s HitchSession, hs []Hitch, now time.Time) (int, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	sum, ok := m.sessions[s.SessionID]
	if !ok {
		sum = &HitchSessionSummary{StartedAt: now}
		m.sessions[s.SessionID] = sum
	}
	sum.HitchSession = s
	sum.LastSeen = now
	stored := 0
	for _, h := range hs {
		h.SessionID, h.Game = s.SessionID, s.Game
		if h.Kind == SampleKind {
			if sum.SampleCount >= MaxSamplesPerSession {
				continue
			}
			m.hitches[s.SessionID] = append(m.hitches[s.SessionID], h)
			sum.SampleCount++
			stored++
			continue
		}
		if sum.HitchCount >= MaxHitchesPerSession {
			continue
		}
		m.hitches[s.SessionID] = append(m.hitches[s.SessionID], h)
		sum.HitchCount++
		sum.TotalMS += h.DurationMS
		if h.DurationMS > sum.WorstMS {
			sum.WorstMS = h.DurationMS
		}
		stored++
	}
	return stored, nil
}

func (m *MemoryHitches) ListHitchSessions(_ context.Context, game string, since time.Time, limit int) ([]HitchSessionSummary, []string, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	var out []HitchSessionSummary
	games := map[string]bool{}
	for _, s := range m.sessions {
		if s.LastSeen.Before(since) {
			continue
		}
		games[s.Game] = true
		if game == "" || s.Game == game {
			out = append(out, *s)
		}
	}
	sort.Slice(out, func(i, j int) bool {
		if out[i].WorstMS != out[j].WorstMS {
			return out[i].WorstMS > out[j].WorstMS
		}
		return out[i].SessionID < out[j].SessionID
	})
	if len(out) > limit {
		out = out[:limit]
	}
	return out, sortedKeys(games), nil
}

func (m *MemoryHitches) GetHitchSession(_ context.Context, id string) (HitchSessionSummary, []Hitch, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	s, ok := m.sessions[id]
	if !ok {
		return HitchSessionSummary{}, nil, ErrNotFound
	}
	hs := append([]Hitch(nil), m.hitches[id]...)
	sort.SliceStable(hs, func(i, j int) bool { return hs[i].AtMS < hs[j].AtMS })
	return *s, hs, nil
}

func (m *MemoryHitches) QueryHitches(_ context.Context, game string, since, until time.Time, limit int) ([]Hitch, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	var out []Hitch
	for _, hs := range m.hitches {
		for _, h := range hs {
			if (game == "" || h.Game == game) && !h.OccurredAt.Before(since) && h.OccurredAt.Before(until) {
				out = append(out, h)
			}
		}
	}
	sort.SliceStable(out, func(i, j int) bool { return out[i].OccurredAt.Before(out[j].OccurredAt) })
	if len(out) > limit {
		out = out[:limit]
	}
	return out, nil
}

func (m *MemoryHitches) PurgeHitches(_ context.Context, before time.Time) (int64, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	var n int64
	for id, s := range m.sessions {
		if s.LastSeen.Before(before) {
			delete(m.sessions, id)
			delete(m.hitches, id)
			n++
		}
	}
	return n, nil
}

func sortedKeys(m map[string]bool) []string {
	out := make([]string, 0, len(m))
	for k := range m {
		out = append(out, k)
	}
	sort.Strings(out)
	return out
}
