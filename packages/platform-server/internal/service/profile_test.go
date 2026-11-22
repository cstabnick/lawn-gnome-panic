package service

import (
	"context"
	"testing"
	"time"

	"connectrpc.com/connect"
	"google.golang.org/protobuf/types/known/timestamppb"

	profilev1 "github.com/cstabnick/lawn-gnome-panic/packages/platform-server/gen/gnome/profile/v1"
	"github.com/cstabnick/lawn-gnome-panic/packages/platform-server/internal/store"
)

func newProfileTest(rate int) *ProfileService {
	users := NewUserService(store.NewMemory(), fakeVerifier{"t1": "sub-1"}, Options{Now: func() time.Time { return testNow }})
	return NewProfileService(store.NewMemoryHitches(), users, ProfileOptions{Now: func() time.Time { return testNow }, RateMax: rate})
}

func frameHitch(at, ms float64, when time.Time) *profilev1.Hitch {
	return &profilev1.Hitch{
		Kind: "frame", AtMs: at, DurationMs: ms, OccurredAt: timestamppb.New(when), Context: map[string]string{"zone": "mossbottom"},
		Spans: []*profilev1.Span{{Name: "updateWorld", StartMs: 0, DurationMs: ms * 0.75}, {Name: "render", StartMs: ms * 0.75, DurationMs: ms * 0.25}},
	}
}

func TestProfileReportAndView(t *testing.T) {
	ctx := context.Background()
	svc := newProfileTest(0)
	batch := &profilev1.ReportHitchesRequest{
		SessionId: "sess-0001", Game: "gnomes-of-gnomomia", Build: "abc", ThresholdMs: 80,
		Device:  &profilev1.Device{Gpu: "ANGLE", Cores: 8},
		Hitches: []*profilev1.Hitch{frameHitch(1000, 400, testNow.Add(-time.Minute)), {Kind: "longtask", AtMs: 5000, DurationMs: 200}},
		// The client's clock is 10 s behind the server's.
		SentAtUnixMs: testNow.Add(-10 * time.Second).UnixMilli(),
	}
	// Anonymous upload: no token needed.
	res, err := svc.ReportHitches(ctx, req(batch, ""))
	if err != nil || res.Msg.Stored != 2 {
		t.Fatalf("report = %v, %v", res, err)
	}

	// Viewing needs a signed-in caller.
	_, err = svc.ListSessions(ctx, req(&profilev1.ListSessionsRequest{}, ""))
	wantCode(t, err, connect.CodeUnauthenticated)
	_, err = svc.GetSession(ctx, req(&profilev1.GetSessionRequest{SessionId: "sess-0001"}, "bad"))
	wantCode(t, err, connect.CodeUnauthenticated)
	_, err = svc.HitchSeries(ctx, req(&profilev1.HitchSeriesRequest{}, ""))
	wantCode(t, err, connect.CodeUnauthenticated)

	list, err := svc.ListSessions(ctx, req(&profilev1.ListSessionsRequest{}, "t1"))
	if err != nil || len(list.Msg.Sessions) != 1 || list.Msg.Games[0] != "gnomes-of-gnomomia" {
		t.Fatalf("list = %v, %v", list, err)
	}
	if s := list.Msg.Sessions[0]; s.HitchCount != 2 || s.WorstMs != 400 || s.Device.Gpu != "ANGLE" {
		t.Fatalf("summary = %v", s)
	}

	got, err := svc.GetSession(ctx, req(&profilev1.GetSessionRequest{SessionId: "sess-0001"}, "t1"))
	if err != nil || len(got.Msg.Hitches) != 2 {
		t.Fatalf("get = %v, %v", got, err)
	}
	h := got.Msg.Hitches[0]
	if len(h.Spans) != 2 || h.Spans[1].Name != "render" || h.Context["zone"] != "mossbottom" {
		t.Fatalf("hitch = %v", h)
	}
	// Skew corrected: client time + 10 s.
	if want := testNow.Add(-50 * time.Second); !h.OccurredAt.AsTime().Equal(want) {
		t.Fatalf("occurred_at = %v, want %v", h.OccurredAt.AsTime(), want)
	}
	// No client time: the server's.
	if !got.Msg.Hitches[1].OccurredAt.AsTime().Equal(testNow) {
		t.Fatalf("untimed occurred_at = %v", got.Msg.Hitches[1].OccurredAt.AsTime())
	}
	_, err = svc.GetSession(ctx, req(&profilev1.GetSessionRequest{SessionId: "nope"}, "t1"))
	wantCode(t, err, connect.CodeNotFound)

	series, err := svc.HitchSeries(ctx, req(&profilev1.HitchSeriesRequest{Since: timestamppb.New(testNow.Add(-time.Hour)), Until: timestamppb.New(testNow.Add(time.Minute))}, "t1"))
	if err != nil {
		t.Fatal(err)
	}
	// 61 minutes is more than 60 one-minute buckets, so five-minute buckets from 04:05 to 05:05.
	if series.Msg.BucketSeconds != 300 || len(series.Msg.Buckets) != 13 {
		t.Fatalf("buckets = %d x %ds", len(series.Msg.Buckets), series.Msg.BucketSeconds)
	}
	if series.Msg.Systems[0].Name != "updateWorld" || series.Msg.Systems[0].TotalMs != 300 {
		t.Fatalf("systems = %v", series.Msg.Systems)
	}
	var hitches int32
	untimed := 0.0
	for _, b := range series.Msg.Buckets {
		hitches += b.Hitches
		untimed += b.SystemMs[untimedSystem]
	}
	if hitches != 2 || untimed != 200 {
		t.Fatalf("hitches = %d, untimed = %v", hitches, untimed)
	}
}

func TestProfileReportValidation(t *testing.T) {
	ctx := context.Background()
	svc := newProfileTest(0)
	ok := func() *profilev1.ReportHitchesRequest {
		return &profilev1.ReportHitchesRequest{SessionId: "sess-0001", Game: "g", Hitches: []*profilev1.Hitch{frameHitch(1, 100, testNow)}}
	}
	cases := map[string]func(r *profilev1.ReportHitchesRequest){
		"short session": func(r *profilev1.ReportHitchesRequest) { r.SessionId = "x" },
		"bad game":      func(r *profilev1.ReportHitchesRequest) { r.Game = "Bad Game!" },
		"no hitches":    func(r *profilev1.ReportHitchesRequest) { r.Hitches = nil },
		"bad kind":      func(r *profilev1.ReportHitchesRequest) { r.Hitches[0].Kind = "lag" },
		"negative ms":   func(r *profilev1.ReportHitchesRequest) { r.Hitches[0].DurationMs = -1 },
		"empty span":    func(r *profilev1.ReportHitchesRequest) { r.Hitches[0].Spans[0].Name = "" },
		"too many": func(r *profilev1.ReportHitchesRequest) {
			for range MaxHitchesPerBatch {
				r.Hitches = append(r.Hitches, frameHitch(1, 100, testNow))
			}
		},
	}
	for name, mutate := range cases {
		r := ok()
		mutate(r)
		_, err := svc.ReportHitches(ctx, req(r, ""))
		if connect.CodeOf(err) != connect.CodeInvalidArgument {
			t.Errorf("%s: err = %v, want InvalidArgument", name, err)
		}
	}
	if _, err := svc.ReportHitches(ctx, req(ok(), "")); err != nil {
		t.Fatalf("valid batch: %v", err)
	}
}

func TestProfileRateLimit(t *testing.T) {
	ctx := context.Background()
	svc := newProfileTest(2)
	r := &profilev1.ReportHitchesRequest{SessionId: "sess-0001", Game: "g", Hitches: []*profilev1.Hitch{frameHitch(1, 100, testNow)}}
	for i := range 2 {
		if _, err := svc.ReportHitches(ctx, req(r, "")); err != nil {
			t.Fatalf("batch %d: %v", i, err)
		}
	}
	_, err := svc.ReportHitches(ctx, req(r, ""))
	wantCode(t, err, connect.CodeResourceExhausted)
	// Another address is not limited.
	other := req(r, "")
	other.Header().Set("X-Forwarded-For", "10.0.0.2, 10.0.0.1")
	if _, err := svc.ReportHitches(ctx, other); err != nil {
		t.Fatalf("other address: %v", err)
	}
}

func TestPickBucket(t *testing.T) {
	for _, c := range []struct{ span, asked, want time.Duration }{
		{time.Hour, 0, time.Minute},
		{24 * time.Hour, 0, 30 * time.Minute},
		{7 * 24 * time.Hour, 0, 3 * time.Hour},
		{2 * time.Hour, time.Second, time.Minute},            // at least a minute
		{24 * time.Hour, time.Minute, 24 * time.Hour / 1000}, // at most 1000 buckets
		{30 * 24 * time.Hour, time.Minute, 30 * 24 * time.Hour / 1000},
	} {
		if got := pickBucket(c.span, c.asked); got != c.want {
			t.Errorf("pickBucket(%v, %v) = %v, want %v", c.span, c.asked, got, c.want)
		}
	}
}
