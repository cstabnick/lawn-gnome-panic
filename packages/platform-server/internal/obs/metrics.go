package obs

import (
	"context"
	"os"
	"strings"
	"time"

	"go.opentelemetry.io/contrib/instrumentation/runtime"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/exporters/otlp/otlpmetric/otlpmetricgrpc"
	"go.opentelemetry.io/otel/metric"
	sdkmetric "go.opentelemetry.io/otel/sdk/metric"
	"go.opentelemetry.io/otel/sdk/resource"
)

// Metrics, following whale-net's EnableMetrics: pushed over OTLP gRPC every 60 s (OTEL_METRIC_EXPORT_INTERVAL ms
// overrides) to OTEL_EXPORTER_OTLP_METRICS_ENDPOINT or OTEL_EXPORTER_OTLP_ENDPOINT when ENABLE_OTEL_METRICS is
// true/1/yes, unless OTEL_SDK_DISABLED=true or OTEL_METRICS_DISABLED=true. Without it the instruments below are
// no-ops. Attributes are low-cardinality only: never a user id, handle or request id.
//
// Instruments are created at package init on the global meter; the OTel global provider forwards them to the real
// one once Setup installs it.

// MetricsEnabled reports whether ENABLE_OTEL_METRICS asks for metrics and no OTEL_*_DISABLED override forbids it.
func MetricsEnabled() bool {
	return truthy(os.Getenv("ENABLE_OTEL_METRICS")) &&
		!strings.EqualFold(os.Getenv("OTEL_SDK_DISABLED"), "true") &&
		!strings.EqualFold(os.Getenv("OTEL_METRICS_DISABLED"), "true")
}

const meterName = "github.com/cstabnick/lawn-gnome-panic/packages/platform-server"

// Meter is the service's meter (no-op unless metrics are on).
func Meter() metric.Meter { return otel.Meter(meterName) }

// The service's instruments. Names follow OTel semantic conventions where one exists (rpc.server.call.duration), and
// lawn.* otherwise.
var (
	// RPCDuration: seconds per Connect RPC; rpc.system, rpc.service, rpc.method, rpc.connect_rpc.error_code.
	RPCDuration metric.Float64Histogram
	// AccountsCreated, AccountsRestored, AccountsDeletionRequested, AccountsPurged: account lifecycle counts.
	AccountsCreated           metric.Int64Counter
	AccountsRestored          metric.Int64Counter
	AccountsDeletionRequested metric.Int64Counter
	AccountsPurged            metric.Int64Counter
	// NamesRejected: display names refused, by reason (too_short, too_long, not_allowed).
	NamesRejected metric.Int64Counter
	// SavesWritten, SaveConflicts: cloud-save writes and revision conflicts, by game.
	SavesWritten  metric.Int64Counter
	SaveConflicts metric.Int64Counter
	// SaveSize: bytes per written save, by game.
	SaveSize metric.Int64Histogram
)

func init() {
	m := Meter()
	RPCDuration, _ = m.Float64Histogram("rpc.server.call.duration", metric.WithUnit("s"),
		metric.WithDescription("Duration of Connect RPCs handled by the platform service."),
		metric.WithExplicitBucketBoundaries(0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10))
	AccountsCreated, _ = m.Int64Counter("lawn.accounts.created", metric.WithUnit("{account}"),
		metric.WithDescription("Accounts created on first sign-in."))
	AccountsRestored, _ = m.Int64Counter("lawn.accounts.restored", metric.WithUnit("{account}"),
		metric.WithDescription("Accounts restored by signing in during the deletion grace period."))
	AccountsDeletionRequested, _ = m.Int64Counter("lawn.accounts.deletion_requested", metric.WithUnit("{account}"),
		metric.WithDescription("Account deletions requested."))
	AccountsPurged, _ = m.Int64Counter("lawn.accounts.purged", metric.WithUnit("{account}"),
		metric.WithDescription("Deleted accounts purged after the grace period."))
	NamesRejected, _ = m.Int64Counter("lawn.names.rejected", metric.WithUnit("{name}"),
		metric.WithDescription("Display names refused, by reason."))
	SavesWritten, _ = m.Int64Counter("lawn.saves.written", metric.WithUnit("{save}"),
		metric.WithDescription("Cloud saves written, by game."))
	SaveConflicts, _ = m.Int64Counter("lawn.saves.conflicts", metric.WithUnit("{save}"),
		metric.WithDescription("Cloud-save writes refused because the save changed on another device, by game."))
	SaveSize, _ = m.Int64Histogram("lawn.saves.size", metric.WithUnit("By"),
		metric.WithDescription("Size of written cloud saves, by game."),
		metric.WithExplicitBucketBoundaries(1024, 4096, 16384, 65536, 131072, 262144, 524288))
}

var meterProvider *sdkmetric.MeterProvider

func metricsEndpoint() string {
	e := or(first("OTEL_EXPORTER_OTLP_METRICS_ENDPOINT", "OTEL_EXPORTER_OTLP_ENDPOINT"), "localhost:4317")
	e = strings.TrimPrefix(e, "https://")
	return strings.TrimPrefix(e, "http://")
}

// setupMetrics installs the global meter provider and starts Go runtime metrics. Called from Setup.
func setupMetrics(id Identity) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	exporter, err := otlpmetricgrpc.New(ctx, otlpmetricgrpc.WithEndpoint(metricsEndpoint()), otlpmetricgrpc.WithInsecure())
	if err != nil {
		return err
	}
	res, err := resource.New(ctx, resource.WithAttributes(ResourceAttributes(id)...))
	if err != nil {
		return err
	}
	// The periodic reader honours OTEL_METRIC_EXPORT_INTERVAL; the default is 60 s, as in whale-net.
	mp := sdkmetric.NewMeterProvider(sdkmetric.WithReader(sdkmetric.NewPeriodicReader(exporter)), sdkmetric.WithResource(res))
	otel.SetMeterProvider(mp)
	mu.Lock()
	meterProvider = mp
	mu.Unlock()
	// go.memory.*, go.goroutine.count, go.processor.limit, ...
	return runtime.Start(runtime.WithMeterProvider(mp))
}

func shutdownMetrics(ctx context.Context) error {
	mu.Lock()
	mp := meterProvider
	meterProvider = nil
	mu.Unlock()
	if mp == nil {
		return nil
	}
	return mp.Shutdown(ctx) // exports what was collected since the last interval
}
