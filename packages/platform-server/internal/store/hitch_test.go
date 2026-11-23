package store

import (
	"context"
	"errors"
	"os"
	"reflect"
	"testing"
	"time"
)

func runHitchSuite(t *testing.T, newStore func(t *testing.T) HitchStore) {
	ctx := context.Background()
	now := time.Now().UTC().Truncate(time.Microsecond)
	sess := func(id, game string) HitchSession {
		return HitchSession{SessionID: id, Game: game, Build: "b1", ThresholdMS: 80, Device: HitchDevice{GPU: "ANGLE", Cores: 8, Touch: true}}
	}
	hitch := func(at, ms float64, when time.Time) Hitch {
		return Hitch{Kind: "frame", AtMS: at, DurationMS: ms, OccurredAt: when, Context: map[string]string{"zone": "mossbottom"},
			Spans: []HitchSpan{{Name: "update", StartMS: 0, Duration: ms / 2}, {Name: "render", StartMS: ms / 2, Duration: ms / 2}}}
	}

	t.Run("add, get, totals", func(t *testing.T) {
		st := newStore(t)
		n, err := st.AddHitches(ctx, sess("s1", "gnomomia"), []Hitch{hitch(200, 100, now), hitch(100, 300, now)}, now)
		if err != nil || n != 2 {
			t.Fatalf("add = %d, %v", n, err)
		}
		later := now.Add(time.Minute)
		if _, err := st.AddHitches(ctx, sess("s1", "gnomomia"), []Hitch{hitch(300, 50, later)}, later); err != nil {
			t.Fatal(err)
		}
		s, hs, err := st.GetHitchSession(ctx, "s1")
		if err != nil {
			t.Fatal(err)
		}
		if s.HitchCount != 3 || s.WorstMS != 300 || s.TotalMS != 450 || !s.StartedAt.Equal(now) || !s.LastSeen.Equal(later) {
			t.Fatalf("summary = %+v", s)
		}
		if s.Device.GPU != "ANGLE" || !s.Device.Touch || s.Build != "b1" || s.ThresholdMS != 80 {
			t.Fatalf("session fields = %+v", s)
		}
		if len(hs) != 3 || hs[0].AtMS != 100 || hs[2].AtMS != 300 {
			t.Fatalf("hitches not by at_ms: %+v", hs)
		}
		if !reflect.DeepEqual(hs[0].Spans, hitch(100, 300, now).Spans) || hs[0].Context["zone"] != "mossbottom" || hs[0].Game != "gnomomia" {
			t.Fatalf("hitch = %+v", hs[0])
		}
		if _, _, err := st.GetHitchSession(ctx, "nope"); !errors.Is(err, ErrNotFound) {
			t.Fatalf("missing session err = %v", err)
		}
	})

	t.Run("cap per session", func(t *testing.T) {
		st := newStore(t)
		many := make([]Hitch, MaxHitchesPerSession-1)
		for i := range many {
			many[i] = hitch(float64(i), 90, now)
		}
		if _, err := st.AddHitches(ctx, sess("s1", "g"), many, now); err != nil {
			t.Fatal(err)
		}
		n, err := st.AddHitches(ctx, sess("s1", "g"), []Hitch{hitch(1, 90, now), hitch(2, 90, now)}, now)
		if err != nil || n != 1 {
			t.Fatalf("add over cap = %d, %v; want 1", n, err)
		}
		n, _ = st.AddHitches(ctx, sess("s1", "g"), []Hitch{hitch(3, 90, now)}, now)
		if n != 0 {
			t.Fatalf("add when full = %d", n)
		}
	})

	t.Run("list, query, purge", func(t *testing.T) {
		st := newStore(t)
		old := now.Add(-48 * time.Hour)
		_, _ = st.AddHitches(ctx, sess("old", "a"), []Hitch{hitch(1, 999, old)}, old)
		_, _ = st.AddHitches(ctx, sess("s1", "a"), []Hitch{hitch(1, 100, now)}, now)
		_, _ = st.AddHitches(ctx, sess("s2", "b"), []Hitch{hitch(1, 500, now.Add(time.Second))}, now)
		_, _ = st.AddHitches(ctx, sess("s3", "a"), []Hitch{hitch(1, 200, now.Add(2*time.Second))}, now)

		list, games, err := st.ListHitchSessions(ctx, "", now.Add(-time.Hour), 10)
		if err != nil {
			t.Fatal(err)
		}
		ids := []string{}
		for _, s := range list {
			ids = append(ids, s.SessionID)
		}
		if !reflect.DeepEqual(ids, []string{"s2", "s3", "s1"}) || !reflect.DeepEqual(games, []string{"a", "b"}) {
			t.Fatalf("list = %v, games = %v", ids, games)
		}
		list, games, _ = st.ListHitchSessions(ctx, "a", now.Add(-time.Hour), 1)
		if len(list) != 1 || list[0].SessionID != "s3" || len(games) != 2 {
			t.Fatalf("filtered list = %+v, games = %v", list, games)
		}

		hs, err := st.QueryHitches(ctx, "a", now.Add(-time.Hour), now.Add(time.Hour), 100)
		if err != nil || len(hs) != 2 || hs[0].SessionID != "s1" || hs[1].SessionID != "s3" {
			t.Fatalf("query = %+v, %v", hs, err)
		}
		hs, _ = st.QueryHitches(ctx, "", now.Add(-time.Hour), now.Add(time.Second), 100)
		if len(hs) != 1 {
			t.Fatalf("until is exclusive: got %d", len(hs))
		}

		n, err := st.PurgeHitches(ctx, now.Add(-time.Hour))
		if err != nil || n != 1 {
			t.Fatalf("purge = %d, %v", n, err)
		}
		if _, _, err := st.GetHitchSession(ctx, "old"); !errors.Is(err, ErrNotFound) {
			t.Fatalf("purged session still there: %v", err)
		}
		if hs, _ := st.QueryHitches(ctx, "", old.Add(-time.Hour), now.Add(time.Hour), 100); len(hs) != 3 {
			t.Fatalf("purged hitches still there: %d", len(hs))
		}
	})

	t.Run("samples apart from hitch totals", func(t *testing.T) {
		st := newStore(t)
		render := &HitchRender{DrawCalls: 300, Triangles: 1e6, Geometries: 4, GpuMS: 2.5, PixelRatio: 2}
		frames := &HitchFrames{Frames: 60, P50MS: 16.7, P95MS: 33, MaxMS: 50, CPUMS: 9}
		sample := func(at float64) Hitch {
			return Hitch{Kind: SampleKind, AtMS: at, OccurredAt: now, Render: render, Frames: frames}
		}
		n, err := st.AddHitches(ctx, sess("s1", "g"), []Hitch{hitch(200, 100, now), sample(1), hitch(100, 300, now), sample(2), sample(3)}, now)
		if err != nil || n != 5 {
			t.Fatalf("add = %d, %v; want 5", n, err)
		}
		s, hs, err := st.GetHitchSession(ctx, "s1")
		if err != nil {
			t.Fatal(err)
		}
		if s.HitchCount != 2 || s.SampleCount != 3 || s.WorstMS != 300 || s.TotalMS != 400 {
			t.Fatalf("summary = %+v", s)
		}
		if len(hs) != 5 {
			t.Fatalf("stored %d, want 5", len(hs))
		}
		for _, h := range hs {
			if h.Kind == SampleKind {
				if !reflect.DeepEqual(h.Render, render) || !reflect.DeepEqual(h.Frames, frames) {
					t.Fatalf("sample stats = %+v / %+v", h.Render, h.Frames)
				}
			} else if h.Render != nil || h.Frames != nil {
				t.Fatalf("hitch has stats: %+v", h)
			}
		}
	})

	t.Run("hitch cap does not stop samples", func(t *testing.T) {
		st := newStore(t)
		many := make([]Hitch, MaxHitchesPerSession)
		for i := range many {
			many[i] = hitch(float64(i), 90, now)
		}
		if _, err := st.AddHitches(ctx, sess("s1", "g"), many, now); err != nil {
			t.Fatal(err)
		}
		n, err := st.AddHitches(ctx, sess("s1", "g"), []Hitch{hitch(1, 90, now), {Kind: SampleKind, OccurredAt: now}}, now)
		if err != nil || n != 1 {
			t.Fatalf("add over hitch cap = %d, %v; want 1 (the sample)", n, err)
		}
		s, _, err := st.GetHitchSession(ctx, "s1")
		if err != nil {
			t.Fatal(err)
		}
		if s.HitchCount != MaxHitchesPerSession || s.SampleCount != 1 {
			t.Fatalf("summary = %+v", s)
		}
	})
}

func TestMemoryHitches(t *testing.T) {
	runHitchSuite(t, func(*testing.T) HitchStore { return NewMemoryHitches() })
}

func TestPostgresHitches(t *testing.T) {
	if os.Getenv("PLATFORM_TEST_DATABASE_URL") == "" {
		t.Skip("PLATFORM_TEST_DATABASE_URL not set")
	}
	runHitchSuite(t, func(t *testing.T) HitchStore {
		pg := NewPostgres(newPGPool(t))
		if err := pg.Migrate(context.Background()); err != nil {
			t.Fatalf("migrate: %v", err)
		}
		return pg
	})
}
