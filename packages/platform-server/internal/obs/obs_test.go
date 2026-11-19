package obs

import (
	"bytes"
	"encoding/json"
	"errors"
	"log/slog"
	"testing"

	"connectrpc.com/connect"
)

func TestEnabled(t *testing.T) {
	for _, tc := range []struct {
		flag, sdkOff, logsOff string
		want                  bool
	}{
		{"", "", "", false},
		{"false", "", "", false},
		{"true", "", "", true},
		{"1", "", "", true},
		{"YES", "", "", true},
		{"true", "true", "", false},
		{"true", "", "TRUE", false},
	} {
		t.Setenv("ENABLE_OTEL_LOGGING", tc.flag)
		t.Setenv("OTEL_SDK_DISABLED", tc.sdkOff)
		t.Setenv("OTEL_LOGS_DISABLED", tc.logsOff)
		if got := Enabled(); got != tc.want {
			t.Errorf("Enabled(%q, sdk=%q, logs=%q) = %v, want %v", tc.flag, tc.sdkOff, tc.logsOff, got, tc.want)
		}
	}
}

func TestIdentityAndResource(t *testing.T) {
	t.Setenv("APP_NAME", "")
	t.Setenv("APP_ENV", "")
	t.Setenv("ENVIRONMENT", "prod")
	t.Setenv("COMMIT_SHA", "0123456789abcdef")
	t.Setenv("POD_NAME", "platform-abc")
	t.Setenv("POD_NAMESPACE", "lawn")
	id := IdentityFromEnv("lawn-gnome-platform")
	if id.ServiceName != "lawn-gnome-platform" || id.Environment != "prod" || id.Domain != "lawn-gnome-panic" {
		t.Fatalf("identity = %+v", id)
	}
	got := map[string]string{}
	for _, kv := range ResourceAttributes(id) {
		got[string(kv.Key)] = kv.Value.AsString()
	}
	want := map[string]string{
		"service.name": "lawn-gnome-platform", "service.version": "latest", "deployment.environment": "prod",
		"service.namespace": "lawn-gnome-panic", "vcs.commit.id": "0123456789abcdef", "service.instance.id": "01234567",
		"k8s.pod.name": "platform-abc", "k8s.namespace.name": "lawn",
	}
	for k, v := range want {
		if got[k] != v {
			t.Errorf("%s = %q, want %q", k, got[k], v)
		}
	}
	if _, ok := got["k8s.node.name"]; ok {
		t.Error("empty k8s.node.name should be left out")
	}
}

func TestHandlerJSONLine(t *testing.T) {
	var buf bytes.Buffer
	log := slog.New(NewHandler(&buf, Identity{ServiceName: "svc", Environment: "dev", Domain: "lawn-gnome-panic"}, nil))
	log.With("logger", "rpc").Warn("rpc failed", "grpc_code", "NotFound", "duration_ms", int64(12), "error", errors.New("boom"))
	var m map[string]any
	if err := json.Unmarshal(buf.Bytes(), &m); err != nil {
		t.Fatalf("not one JSON line: %q", buf.String())
	}
	for k, v := range map[string]any{"severity": "WARN", "message": "rpc failed", "app_name": "svc", "environment": "dev",
		"domain": "lawn-gnome-panic", "logger": "rpc", "grpc_code": "NotFound", "duration_ms": 12.0, "error": "boom"} {
		if m[k] != v {
			t.Errorf("%s = %v, want %v", k, m[k], v)
		}
	}
	if _, ok := m["timestamp"]; !ok {
		t.Error("no timestamp")
	}
}

func TestCodeAndLevel(t *testing.T) {
	if Code(nil) != "OK" || Level(nil) != slog.LevelInfo {
		t.Error("nil should be OK at INFO")
	}
	nf := connect.NewError(connect.CodeNotFound, errors.New("x"))
	if Code(nf) != "NotFound" || Level(nf) != slog.LevelWarn {
		t.Error("NotFound should be WARN")
	}
	in := connect.NewError(connect.CodeInternal, errors.New("x"))
	if Code(in) != "Internal" || Level(in) != slog.LevelError {
		t.Error("Internal should be ERROR")
	}
}
