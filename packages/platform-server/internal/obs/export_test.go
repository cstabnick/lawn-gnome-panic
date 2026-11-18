package obs

import (
	"context"
	"log/slog"
	"net"
	"sync"
	"testing"

	collogs "go.opentelemetry.io/proto/otlp/collector/logs/v1"
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

// With ENABLE_OTEL_LOGGING, records reach the collector with the whale-net resource and the record's attributes.
func TestSetupExportsToCollector(t *testing.T) {
	lis, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	col := &fakeCollector{}
	srv := grpc.NewServer()
	collogs.RegisterLogsServiceServer(srv, col)
	go func() { _ = srv.Serve(lis) }()
	defer srv.Stop()

	t.Setenv("ENABLE_OTEL_LOGGING", "true")
	t.Setenv("OTEL_SDK_DISABLED", "")
	t.Setenv("OTEL_LOGS_DISABLED", "")
	t.Setenv("OTEL_EXPORTER_OTLP_LOGS_ENDPOINT", "")
	t.Setenv("OTEL_EXPORTER_OTLP_ENDPOINT", "http://"+lis.Addr().String())
	t.Setenv("APP_NAME", "")
	t.Setenv("APP_ENV", "test")
	t.Setenv("POD_NAME", "platform-pod-1")
	prev := slog.Default()
	defer slog.SetDefault(prev)

	Setup("lawn-gnome-platform")
	slog.Info("rpc ok", "logger", "rpc", "grpc_method", "/gnome.user.v1.UserService/GetMe", "grpc_code", "OK", "duration_ms", int64(3))
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
}
