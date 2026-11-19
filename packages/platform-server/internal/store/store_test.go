package store

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"errors"
	"os"
	"reflect"
	"regexp"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

var userIDRe = regexp.MustCompile(`^u_[a-z2-7]{20}$`)

// seq returns a newHandle func that yields the given handles in order, then repeats the last one.
func seq(hs ...string) func() string {
	i := 0
	return func() string {
		h := hs[len(hs)-1]
		if i < len(hs) {
			h = hs[i]
		}
		i++
		return h
	}
}

func runStoreSuite(t *testing.T, newStore func(t *testing.T) Store) {
	ctx := context.Background()
	now := time.Now().UTC().Truncate(time.Microsecond)
	name := func(s string) *string { return &s }

	t.Run("create", func(t *testing.T) {
		s := newStore(t)
		a, created, err := s.GetOrCreateByKeycloakSub(ctx, "sub-1", "Gnomey", seq("mossy-1"), now)
		if err != nil {
			t.Fatal(err)
		}
		if !created {
			t.Error("created = false, want true")
		}
		if a.DisplayName != "Gnomey" || a.Handle != "mossy-1" || a.KeycloakSub != "sub-1" {
			t.Errorf("account = %+v", a)
		}
		if a.State != StateLinked {
			t.Errorf("state = %q, want linked", a.State)
		}
		if !userIDRe.MatchString(a.UserID) {
			t.Errorf("user id %q does not match %s", a.UserID, userIDRe)
		}
		if !a.CreatedAt.Equal(now) {
			t.Errorf("created at = %v, want %v", a.CreatedAt, now)
		}
		if a.PurgeAt != nil || a.LookJSON != nil {
			t.Errorf("new account has purge/look: %+v", a)
		}
	})

	t.Run("same sub returns same account", func(t *testing.T) {
		s := newStore(t)
		first, _, err := s.GetOrCreateByKeycloakSub(ctx, "sub-1", "Gnomey", seq("mossy-1"), now)
		if err != nil {
			t.Fatal(err)
		}
		second, created, err := s.GetOrCreateByKeycloakSub(ctx, "sub-1", "Other", seq("other-1"), now)
		if err != nil {
			t.Fatal(err)
		}
		if created {
			t.Error("created = true on second call")
		}
		if second.UserID != first.UserID || second.DisplayName != "Gnomey" {
			t.Errorf("second = %+v, first = %+v", second, first)
		}
	})

	t.Run("handle collision gets the free one", func(t *testing.T) {
		s := newStore(t)
		if _, _, err := s.GetOrCreateByKeycloakSub(ctx, "sub-a", "A", seq("h-a"), now); err != nil {
			t.Fatal(err)
		}
		b, created, err := s.GetOrCreateByKeycloakSub(ctx, "sub-b", "B", seq("h-a", "h-b"), now)
		if err != nil {
			t.Fatal(err)
		}
		if !created || b.Handle != "h-b" {
			t.Errorf("b = %+v created=%v, want handle h-b created", b, created)
		}
	})

	t.Run("all handles taken gives ErrHandleTaken", func(t *testing.T) {
		s := newStore(t)
		if _, _, err := s.GetOrCreateByKeycloakSub(ctx, "sub-a", "A", seq("h-a"), now); err != nil {
			t.Fatal(err)
		}
		calls := 0
		_, _, err := s.GetOrCreateByKeycloakSub(ctx, "sub-b", "B", func() string { calls++; return "h-a" }, now)
		if !errors.Is(err, ErrHandleTaken) {
			t.Fatalf("err = %v, want ErrHandleTaken", err)
		}
		if calls > 5 {
			t.Errorf("newHandle called %d times, want at most 5", calls)
		}
	})

	t.Run("update profile", func(t *testing.T) {
		s := newStore(t)
		a, _, err := s.GetOrCreateByKeycloakSub(ctx, "sub-1", "Gnomey", seq("mossy-1"), now)
		if err != nil {
			t.Fatal(err)
		}
		look := []byte(`{"hatRgb":255,"equipment":{"head":3,"back":7}}`)

		byName, err := s.UpdateProfile(ctx, a.UserID, name("Renamed"), nil)
		if err != nil {
			t.Fatal(err)
		}
		if byName.DisplayName != "Renamed" || byName.LookJSON != nil {
			t.Errorf("name only: %+v", byName)
		}

		byLook, err := s.UpdateProfile(ctx, a.UserID, nil, look)
		if err != nil {
			t.Fatal(err)
		}
		if byLook.DisplayName != "Renamed" {
			t.Errorf("look only changed name: %q", byLook.DisplayName)
		}
		assertJSONEqual(t, byLook.LookJSON, look)

		both, err := s.UpdateProfile(ctx, a.UserID, name("Both"), []byte(`{"coatRgb":16711680}`))
		if err != nil {
			t.Fatal(err)
		}
		if both.DisplayName != "Both" {
			t.Errorf("both: name = %q", both.DisplayName)
		}
		assertJSONEqual(t, both.LookJSON, []byte(`{"coatRgb":16711680}`))

		if _, err := s.UpdateProfile(ctx, "u_aaaaaaaaaaaaaaaaaaaa", name("x"), nil); !errors.Is(err, ErrNotFound) {
			t.Errorf("unknown id err = %v, want ErrNotFound", err)
		}
	})

	t.Run("mark deleted sets state and purge", func(t *testing.T) {
		s := newStore(t)
		a, _, err := s.GetOrCreateByKeycloakSub(ctx, "sub-1", "Gnomey", seq("mossy-1"), now)
		if err != nil {
			t.Fatal(err)
		}
		purge := now.Add(7 * 24 * time.Hour)
		d, err := s.MarkDeleted(ctx, a.UserID, purge)
		if err != nil {
			t.Fatal(err)
		}
		if d.State != StatePendingDeletion || d.PurgeAt == nil || !d.PurgeAt.Equal(purge) {
			t.Errorf("deleted = %+v", d)
		}
		if _, err := s.MarkDeleted(ctx, "u_aaaaaaaaaaaaaaaaaaaa", purge); !errors.Is(err, ErrNotFound) {
			t.Errorf("unknown id err = %v, want ErrNotFound", err)
		}
	})

	t.Run("get many skips pending and unknown", func(t *testing.T) {
		s := newStore(t)
		a, _, _ := s.GetOrCreateByKeycloakSub(ctx, "sub-a", "A", seq("h-a"), now)
		b, _, _ := s.GetOrCreateByKeycloakSub(ctx, "sub-b", "B", seq("h-b"), now)
		if _, err := s.MarkDeleted(ctx, b.UserID, now.Add(time.Hour)); err != nil {
			t.Fatal(err)
		}
		got, err := s.GetMany(ctx, []string{a.UserID, b.UserID, "u_aaaaaaaaaaaaaaaaaaaa"})
		if err != nil {
			t.Fatal(err)
		}
		if len(got) != 1 || got[0].UserID != a.UserID {
			t.Errorf("GetMany = %+v, want only %s", got, a.UserID)
		}
		empty, err := s.GetMany(ctx, nil)
		if err != nil {
			t.Fatal(err)
		}
		if empty == nil || len(empty) != 0 {
			t.Errorf("GetMany(nil) = %#v, want empty non-nil slice", empty)
		}
	})

	t.Run("restore clears purge", func(t *testing.T) {
		s := newStore(t)
		a, _, _ := s.GetOrCreateByKeycloakSub(ctx, "sub-1", "Gnomey", seq("mossy-1"), now)
		if _, err := s.MarkDeleted(ctx, a.UserID, now.Add(time.Hour)); err != nil {
			t.Fatal(err)
		}
		r, err := s.Restore(ctx, a.UserID)
		if err != nil {
			t.Fatal(err)
		}
		if r.State != StateLinked || r.PurgeAt != nil {
			t.Errorf("restored = %+v", r)
		}
		if _, err := s.Restore(ctx, "u_aaaaaaaaaaaaaaaaaaaa"); !errors.Is(err, ErrNotFound) {
			t.Errorf("unknown id err = %v, want ErrNotFound", err)
		}
	})

	t.Run("purge expired", func(t *testing.T) {
		s := newStore(t)
		a, _, _ := s.GetOrCreateByKeycloakSub(ctx, "sub-a", "A", seq("h-a"), now)
		b, _, _ := s.GetOrCreateByKeycloakSub(ctx, "sub-b", "B", seq("h-b"), now)
		if _, err := s.MarkDeleted(ctx, a.UserID, now.Add(-time.Hour)); err != nil {
			t.Fatal(err)
		}
		if _, err := s.MarkDeleted(ctx, b.UserID, now.Add(time.Hour)); err != nil {
			t.Fatal(err)
		}
		n, err := s.PurgeExpired(ctx, now)
		if err != nil {
			t.Fatal(err)
		}
		if n != 1 {
			t.Errorf("purged %d, want 1", n)
		}
		again, created, err := s.GetOrCreateByKeycloakSub(ctx, "sub-a", "A", seq("h-c"), now)
		if err != nil {
			t.Fatal(err)
		}
		if !created || again.UserID == a.UserID {
			t.Errorf("after purge: created=%v user=%s (old %s)", created, again.UserID, a.UserID)
		}
		stillPending, created, err := s.GetOrCreateByKeycloakSub(ctx, "sub-b", "B", seq("h-d"), now)
		if err != nil {
			t.Fatal(err)
		}
		if created || stillPending.State != StatePendingDeletion {
			t.Errorf("sub-b = %+v created=%v, want existing pending account", stillPending, created)
		}
	})

	t.Run("concurrent create of one sub", func(t *testing.T) {
		s := newStore(t)
		const n = 10
		var wg sync.WaitGroup
		start := make(chan struct{})
		type result struct {
			a       Account
			created bool
			err     error
		}
		results := make([]result, n)
		for i := 0; i < n; i++ {
			wg.Add(1)
			go func(i int) {
				defer wg.Done()
				<-start
				a, c, err := s.GetOrCreateByKeycloakSub(ctx, "sub-race", "Racer", seq("race-"+string(rune('a'+i))), now)
				results[i] = result{a, c, err}
			}(i)
		}
		close(start)
		wg.Wait()
		createdCount := 0
		for i, r := range results {
			if r.err != nil {
				t.Fatalf("goroutine %d: %v", i, r.err)
			}
			if r.created {
				createdCount++
			}
			if r.a.UserID != results[0].a.UserID {
				t.Errorf("goroutine %d got %s, goroutine 0 got %s", i, r.a.UserID, results[0].a.UserID)
			}
		}
		if createdCount != 1 {
			t.Errorf("created %d times, want exactly 1", createdCount)
		}
	})

	t.Run("saves", func(t *testing.T) {
		s := newStore(t)
		a, _, err := s.GetOrCreateByKeycloakSub(ctx, "sub-save", "Saver", seq("save-1"), now)
		if err != nil {
			t.Fatal(err)
		}
		const game = 1
		later := now.Add(time.Minute)

		sv, err := s.PutSave(ctx, a.UserID, game, "d1", "s1", 0, now)
		if err != nil {
			t.Fatalf("first put: %v", err)
		}
		if sv.Revision != 1 || sv.Data != "d1" || sv.Summary != "s1" || sv.UserID != a.UserID || sv.Game != game {
			t.Errorf("first put = %+v", sv)
		}
		got, err := s.GetSave(ctx, a.UserID, game)
		if err != nil {
			t.Fatal(err)
		}
		if got.Revision != 1 || got.Data != "d1" || got.Summary != "s1" || !got.UpdatedAt.Truncate(time.Microsecond).Equal(now) {
			t.Errorf("get after first put = %+v", got)
		}

		if _, err := s.PutSave(ctx, a.UserID, game, "dX", "sX", 0, later); !errors.Is(err, ErrConflict) {
			t.Errorf("second base-0 put err = %v, want ErrConflict", err)
		}

		sv, err = s.PutSave(ctx, a.UserID, game, "d2", "s2", 1, later)
		if err != nil {
			t.Fatalf("base-1 put: %v", err)
		}
		if sv.Revision != 2 || sv.Data != "d2" || sv.Summary != "s2" || !sv.UpdatedAt.Equal(later) {
			t.Errorf("base-1 put = %+v", sv)
		}

		if _, err := s.PutSave(ctx, a.UserID, game, "stale", "stale", 1, later.Add(time.Minute)); !errors.Is(err, ErrConflict) {
			t.Errorf("stale put err = %v, want ErrConflict", err)
		}
		got, err = s.GetSave(ctx, a.UserID, game)
		if err != nil {
			t.Fatal(err)
		}
		if got.Revision != 2 || got.Data != "d2" || got.Summary != "s2" {
			t.Errorf("after stale put = %+v, want unchanged rev 2 d2/s2", got)
		}

		if _, err := s.GetSave(ctx, a.UserID, game+1); !errors.Is(err, ErrNotFound) {
			t.Errorf("other game err = %v, want ErrNotFound", err)
		}
		if _, err := s.PutSave(ctx, "u_aaaaaaaaaaaaaaaaaaaa", game, "x", "x", 0, now); !errors.Is(err, ErrNotFound) {
			t.Errorf("unknown user put err = %v, want ErrNotFound", err)
		}

		// Two concurrent writes from the same base revision: exactly one wins.
		var wg sync.WaitGroup
		start := make(chan struct{})
		errs := make([]error, 2)
		for i := range errs {
			wg.Add(1)
			go func(i int) {
				defer wg.Done()
				<-start
				_, errs[i] = s.PutSave(ctx, a.UserID, game, "race", "race", 2, later)
			}(i)
		}
		close(start)
		wg.Wait()
		wins := 0
		for _, err := range errs {
			switch {
			case err == nil:
				wins++
			case errors.Is(err, ErrConflict):
			default:
				t.Errorf("concurrent put err = %v", err)
			}
		}
		if wins != 1 {
			t.Errorf("concurrent puts succeeded %d times, want exactly 1", wins)
		}

		big := strings.Repeat("g", 512*1024)
		if _, err := s.PutSave(ctx, a.UserID, game+2, big, "big", 0, now); err != nil {
			t.Fatalf("big put: %v", err)
		}
		got, err = s.GetSave(ctx, a.UserID, game+2)
		if err != nil {
			t.Fatal(err)
		}
		if got.Data != big || got.Summary != "big" {
			t.Errorf("big save did not round-trip (len %d)", len(got.Data))
		}

		if _, err := s.MarkDeleted(ctx, a.UserID, now.Add(-time.Hour)); err != nil {
			t.Fatal(err)
		}
		if _, err := s.PurgeExpired(ctx, now); err != nil {
			t.Fatal(err)
		}
		if _, err := s.GetSave(ctx, a.UserID, game); !errors.Is(err, ErrNotFound) {
			t.Errorf("save after purge err = %v, want ErrNotFound", err)
		}
	})
}

func assertJSONEqual(t *testing.T, got, want []byte) {
	t.Helper()
	var g, w map[string]any
	if err := json.Unmarshal(got, &g); err != nil {
		t.Fatalf("got is not JSON: %v (%q)", err, got)
	}
	if err := json.Unmarshal(want, &w); err != nil {
		t.Fatalf("want is not JSON: %v", err)
	}
	if !reflect.DeepEqual(g, w) {
		t.Errorf("look = %v, want %v", g, w)
	}
}

func TestMemory(t *testing.T) {
	runStoreSuite(t, func(*testing.T) Store { return NewMemory() })
}

// newPGPool creates a throwaway schema in the test database and returns a pool whose search_path
// is that schema. Returns nil when PLATFORM_TEST_DATABASE_URL is not set.
func newPGPool(t *testing.T) *pgxpool.Pool {
	t.Helper()
	url := os.Getenv("PLATFORM_TEST_DATABASE_URL")
	if url == "" {
		t.Skip("PLATFORM_TEST_DATABASE_URL not set")
	}
	ctx := context.Background()
	buf := make([]byte, 8)
	if _, err := rand.Read(buf); err != nil {
		t.Fatal(err)
	}
	schema := "t_" + hex.EncodeToString(buf)

	base, err := pgxpool.New(ctx, url)
	if err != nil {
		t.Fatal(err)
	}
	if _, err := base.Exec(ctx, `CREATE SCHEMA "`+schema+`"`); err != nil {
		base.Close()
		t.Fatal(err)
	}
	cfg, err := pgxpool.ParseConfig(url)
	if err != nil {
		base.Close()
		t.Fatal(err)
	}
	if cfg.ConnConfig.RuntimeParams == nil {
		cfg.ConnConfig.RuntimeParams = map[string]string{}
	}
	cfg.ConnConfig.RuntimeParams["search_path"] = schema
	pool, err := pgxpool.NewWithConfig(ctx, cfg)
	if err != nil {
		base.Close()
		t.Fatal(err)
	}
	t.Cleanup(func() {
		pool.Close()
		if _, err := base.Exec(ctx, `DROP SCHEMA "`+schema+`" CASCADE`); err != nil {
			t.Errorf("drop schema: %v", err)
		}
		base.Close()
	})
	return pool
}

func TestPostgres(t *testing.T) {
	if os.Getenv("PLATFORM_TEST_DATABASE_URL") == "" {
		t.Skip("PLATFORM_TEST_DATABASE_URL not set")
	}
	runStoreSuite(t, func(t *testing.T) Store {
		pg := NewPostgres(newPGPool(t))
		ctx := context.Background()
		for i := 0; i < 2; i++ {
			if err := pg.Migrate(ctx); err != nil {
				t.Fatalf("migrate %d: %v", i+1, err)
			}
		}
		return pg
	})
}

func TestPostgresMigrateConcurrent(t *testing.T) {
	pg := NewPostgres(newPGPool(t))
	ctx := context.Background()
	var wg sync.WaitGroup
	errs := make([]error, 2)
	start := make(chan struct{})
	for i := range errs {
		wg.Add(1)
		go func(i int) {
			defer wg.Done()
			<-start
			errs[i] = pg.Migrate(ctx)
		}(i)
	}
	close(start)
	wg.Wait()
	for i, err := range errs {
		if err != nil {
			t.Errorf("migrate goroutine %d: %v", i, err)
		}
	}
}
