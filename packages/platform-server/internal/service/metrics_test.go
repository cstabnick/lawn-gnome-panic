package service

import (
	"context"
	"testing"

	"connectrpc.com/connect"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
	sdkmetric "go.opentelemetry.io/otel/sdk/metric"
	"go.opentelemetry.io/otel/sdk/metric/metricdata"
	"google.golang.org/protobuf/types/known/fieldmaskpb"

	commonv1 "github.com/cstabnick/lawn-gnome-panic/packages/platform-server/gen/gnome/common/v1"
	savev1 "github.com/cstabnick/lawn-gnome-panic/packages/platform-server/gen/gnome/save/v1"
	userv1 "github.com/cstabnick/lawn-gnome-panic/packages/platform-server/gen/gnome/user/v1"
)

// sums maps "metric{attrs}" to the counter/histogram-count value, for the instruments under test.
func collect(t *testing.T, r *sdkmetric.ManualReader) map[string]int64 {
	t.Helper()
	var rm metricdata.ResourceMetrics
	if err := r.Collect(context.Background(), &rm); err != nil {
		t.Fatal(err)
	}
	out := map[string]int64{}
	key := func(name string, set attribute.Set) string {
		return name + set.Encoded(attribute.DefaultEncoder())
	}
	for _, sm := range rm.ScopeMetrics {
		for _, m := range sm.Metrics {
			switch d := m.Data.(type) {
			case metricdata.Sum[int64]:
				for _, p := range d.DataPoints {
					out[key(m.Name, p.Attributes)] += p.Value
				}
			case metricdata.Histogram[float64]:
				for _, p := range d.DataPoints {
					out[key(m.Name, p.Attributes)] += int64(p.Count)
				}
			case metricdata.Histogram[int64]:
				for _, p := range d.DataPoints {
					out[key(m.Name, p.Attributes)] += int64(p.Count)
				}
			}
		}
	}
	return out
}

// The service's instruments reach the meter provider with low-cardinality attributes only.
func TestMetrics(t *testing.T) {
	reader := sdkmetric.NewManualReader()
	mp := sdkmetric.NewMeterProvider(sdkmetric.WithReader(reader))
	prev := otel.GetMeterProvider()
	otel.SetMeterProvider(mp)
	t.Cleanup(func() { otel.SetMeterProvider(prev) })
	before := collect(t, reader)

	// An RPC through the interceptor: account created + rpc.server.call.duration.
	captureLogs(t)
	client := newLoggedClient(t)
	r := connect.NewRequest(&userv1.GetMeRequest{})
	r.Header().Set("Authorization", "Bearer t1")
	if _, err := client.GetMe(context.Background(), r); err != nil {
		t.Fatal(err)
	}
	// A rejected name.
	u := connect.NewRequest(&userv1.UpdateGnomeRequest{Gnome: &userv1.Gnome{DisplayName: "x"}, UpdateMask: &fieldmaskpb.FieldMask{Paths: []string{"display_name"}}})
	u.Header().Set("Authorization", "Bearer t1")
	_, _ = client.UpdateGnome(context.Background(), u)

	// A save written, then a conflicting write.
	ctx := context.Background()
	_, saves := newSaveTest()
	const game = commonv1.Game_GAME_LAWN_GNOME_PANIC
	if _, err := saves.PutSave(ctx, req(&savev1.PutSaveRequest{Game: game, Data: `{"level":1}`}, "t1")); err != nil {
		t.Fatal(err)
	}
	_, err := saves.PutSave(ctx, req(&savev1.PutSaveRequest{Game: game, Data: `{"level":1}`, BaseRevision: 0}, "t1"))
	wantCode(t, err, connect.CodeAborted)

	after := collect(t, reader)
	g := "game=GAME_LAWN_GNOME_PANIC"
	for k, want := range map[string]int64{
		"lawn.accounts.created":                    2, // the RPC's account and the save test's
		"lawn.names.rejected" + "reason=too_short": 1,
		"lawn.saves.written" + g:                   1,
		"lawn.saves.conflicts" + g:                 1,
		"lawn.saves.size" + g:                      1,
		"rpc.server.call.duration" + "rpc.connect_rpc.error_code=ok,rpc.method=GetMe,rpc.service=gnome.user.v1.UserService,rpc.system=connect_rpc":                     1,
		"rpc.server.call.duration" + "rpc.connect_rpc.error_code=invalid_argument,rpc.method=UpdateGnome,rpc.service=gnome.user.v1.UserService,rpc.system=connect_rpc": 1,
	} {
		if got := after[k] - before[k]; got != want {
			t.Errorf("%s = %d, want %d (all: %v)", k, got, want, after)
		}
	}
}
