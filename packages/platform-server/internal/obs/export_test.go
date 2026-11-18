package obs

import (
	"context"
	"log/slog"
	"net"
	"sync"
	"testing"

	"go.opentelemetry.io/otel"
	collogs "go.opentelemetry.io/proto/otlp/collector/logs/v1"
	colmetrics "go.opentelemetry.io/proto/otlp/collector/metrics/v1"
	coltrace "go.opentelemetry.io/proto/otlp/collector/trace/v1"
	"google.golang.org/grpc"
)

type fakeCollector struct {
	collogs.UnimplementedLogsServiceServer
	mu   sync.Mutex
	reqs []*collogs.ExportLogsServiceRequest
}

func (f *fakeCollector) Export(_ context.Context, r *collogs.ExportLogsServiceRequest) (*collogs.ExportLogsServiceResponse, error) {
	f.mu.Lock()
	f.reqs = append(f.reqs, r)
	f.mu.Unlock()
	return &collogs.ExportLogsServiceResponse{}, nil
}

type fakeTraceCollector struct {
	coltrace.UnimplementedTraceServiceServer
	mu   sync.Mutex
	reqs []*coltrace.ExportTraceServiceRequest
}

func (f *fakeTraceCollector) Export(_ context.Context, r *coltrace.ExportTraceServiceRequest) (*coltrace.ExportTraceServiceResponse, error) {
	f.mu.Lock()
	f.reqs = append(f.reqs, r)
	f.mu.Unlock()
	return &coltrace.ExportTraceServiceResponse{}, nil
}

type fakeMetricsCollector struct {
	colmetrics.UnimplementedMetricsServiceServer
	mu    sync.Mutex
	names map[string]bool
}

func (f *fakeMetricsCollector) Export(_ context.Context, r *colmetrics.ExportMetricsServiceRequest) (*colmetrics.ExportMetricsServiceResponse, error) {
	f.mu.Lock()
	defer f.mu.Unlock()
	for _, rm := range r.ResourceMetrics {
		for _, sm := range rm.ScopeMetrics {
			for _, m := range sm.Metrics {
				f.names[m.Name] = true
			}
		}
	}
	return &colmetrics.ExportMetricsServiceResponse{}, nil
}

// With ENABLE_OTEL_LOGGING, records reach the collector with the whale-net resource and the record's attributes.
func TestSetupExportsToCollector(t *testing.T) {
	lis, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	col := &fakeCollector{}
	tcol := &fakeTraceCollector{}
	srv := grpc.NewServer()
	collogs.RegisterLogsServiceServer(srv, col)
	coltrace.RegisterTraceServiceServer(srv, tcol)
	mcol := &fakeMetricsCollector{names: map[string]bool{}}
	colmetrics.RegisterMetricsServiceServer(srv, mcol)
	go func() { _ = srv.Serve(lis) }()
	defer srv.Stop()

	t.Setenv("ENABLE_OTEL_LOGGING", "true")
	t.Setenv("ENABLE_OTEL_TRACING", "true")
	t.Setenv("ENABLE_OTEL_METRICS", "true")
	t.Setenv("OTEL_METRICS_DISABLED", "")
	t.Setenv("OTEL_EXPORTER_OTLP_METRICS_ENDPOINT", "")
	t.Setenv("OTEL_TRACES_DISABLED", "")
	t.Setenv("OTEL_EXPORTER_OTLP_TRACES_ENDPOINT", "")
	t.Setenv("OTEL_SDK_DISABLED", "")
	t.Setenv("OTEL_LOGS_DISABLED", "")
	t.Setenv("OTEL_EXPORTER_OTLP_LOGS_ENDPOINT", "")
	t.Setenv("OTEL_EXPORTER_OTLP_ENDPOINT", "http://"+lis.Addr().String())
	t.Setenv("APP_NAME", "")
	t.Setenv("APP_ENV", "test")
	t.Setenv("POD_NAME", "platform-pod-1")
	prev := slog.Default()
	defer slog.SetDefault(prev)
	prevTP := otel.GetTracerProvider()
	defer otel.SetTracerProvider(prevTP)
	prevMP := otel.GetMeterProvider()
	defer otel.SetMeterProvider(prevMP)

	Setup("lawn-gnome-platform")
	ctx, span := Tracer().Start(context.Background(), "test span")
	wantTrace := span.SpanContext().TraceID()
	slog.InfoContext(ctx, "rpc ok", "logger", "rpc", "grpc_method", "/gnome.user.v1.UserService/GetMe", "grpc_code", "OK", "duration_ms", int64(3))
	span.End()
	AccountsCreated.Add(ctx, 1) // created at package init: reaches the provider Setup installed
	if err := Shutdown(context.Background()); err != nil {
		t.Fatalf("shutdown: %v", err)
	}

	col.mu.Lock()
	defer col.mu.Unlock()
	res := map[string]string{}
	var found bool
	for _, r := range col.reqs {
		for _, rl := range r.ResourceLogs {
			for _, a := range rl.Resource.Attributes {
				res[a.Key] = a.Value.GetStringValue()
			}
			for _, sl := range rl.ScopeLogs {
				for _, lr := range sl.LogRecords {
					if lr.Body.GetStringValue() != "rpc ok" {
						continue
					}
					found = true
					attrs := map[string]any{}
					for _, a := range lr.Attributes {
						if a.Value.GetStringValue() != "" {
							attrs[a.Key] = a.Value.GetStringValue()
						} else {
							attrs[a.Key] = a.Value.GetIntValue()
						}
					}
					if attrs["grpc_method"] != "/gnome.user.v1.UserService/GetMe" || attrs["duration_ms"] != int64(3) || attrs["logger"] != "rpc" {
						t.Errorf("record attributes = %v", attrs)
					}
					if string(lr.TraceId) != string(wantTrace[:]) {
						t.Errorf("log record trace id %x, want %s", lr.TraceId, wantTrace)
					}
					if lr.SeverityText != "INFO" {
						t.Errorf("severity = %q", lr.SeverityText)
					}
				}
			}
		}
	}
	if !found {
		t.Fatalf("no 'rpc ok' record exported (%d requests)", len(col.reqs))
	}
	for k, v := range map[string]string{"service.name": "lawn-gnome-platform", "deployment.environment": "test",
		"service.namespace": "lawn-gnome-panic", "k8s.pod.name": "platform-pod-1"} {
		if res[k] != v {
			t.Errorf("resource %s = %q, want %q", k, res[k], v)
		}
	}

	tcol.mu.Lock()
	defer tcol.mu.Unlock()
	var spanFound bool
	for _, r := range tcol.reqs {
		for _, rs := range r.ResourceSpans {
			for _, ss := range rs.ScopeSpans {
				for _, sp := range ss.Spans {
					if sp.Name == "test span" && string(sp.TraceId) == string(wantTrace[:]) {
						spanFound = true
					}
				}
			}
		}
	}
	if !spanFound {
		t.Fatalf("span not exported (%d trace requests)", len(tcol.reqs))
	}

	mcol.mu.Lock()
	defer mcol.mu.Unlock()
	for _, name := range []string{"lawn.accounts.created", "go.goroutine.count"} {
		if !mcol.names[name] {
			t.Errorf("metric %s not exported (got %v)", name, mcol.names)
		}
	}
}
