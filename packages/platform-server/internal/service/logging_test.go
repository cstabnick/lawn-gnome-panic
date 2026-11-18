package service

import (
	"bytes"
	"context"
	"encoding/json"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"connectrpc.com/connect"
	"go.opentelemetry.io/otel"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	"go.opentelemetry.io/otel/sdk/trace/tracetest"
	"go.opentelemetry.io/otel/trace"
	"google.golang.org/protobuf/types/known/fieldmaskpb"

	userv1 "github.com/cstabnick/lawn-gnome-panic/packages/platform-server/gen/gnome/user/v1"
	"github.com/cstabnick/lawn-gnome-panic/packages/platform-server/gen/gnome/user/v1/userv1connect"
	"github.com/cstabnick/lawn-gnome-panic/packages/platform-server/internal/obs"
)

// captureLogs points slog at a whale-net JSON handler writing to a buffer and returns a reader for its lines.
func captureLogs(t *testing.T) func() []map[string]any {
	t.Helper()
	var buf bytes.Buffer
	prev := slog.Default()
	slog.SetDefault(slog.New(obs.NewHandler(&buf, obs.Identity{ServiceName: "test", Environment: "test"}, nil)))
	t.Cleanup(func() { slog.SetDefault(prev) })
	return func() []map[string]any {
		var out []map[string]any
		for _, line := range strings.Split(strings.TrimSpace(buf.String()), "\n") {
			var m map[string]any
			if err := json.Unmarshal([]byte(line), &m); err != nil {
				t.Fatalf("not a JSON line: %q", line)
			}
			out = append(out, m)
		}
		return out
	}
}

func byMessage(lines []map[string]any, msg string) map[string]any {
	for _, l := range lines {
		if l["message"] == msg {
			return l
		}
	}
	return nil
}

func newLoggedClient(t *testing.T) userv1connect.UserServiceClient {
	t.Helper()
	mux := http.NewServeMux()
	mux.Handle(userv1connect.NewUserServiceHandler(newSvc(), connect.WithInterceptors(obs.Interceptor())))
	srv := httptest.NewServer(mux)
	t.Cleanup(srv.Close)
	return userv1connect.NewUserServiceClient(http.DefaultClient, srv.URL, connect.WithProtoJSON())
}

// The RPC line and the domain event of one request share request_id, and carry the rpc.* and handler fields.
func TestRequestLinesShareRequestID(t *testing.T) {
	lines := captureLogs(t)
	client := newLoggedClient(t)
	r := connect.NewRequest(&userv1.GetMeRequest{})
	r.Header().Set("Authorization", "Bearer t1")
	r.Header().Set("X-Request-Id", "ingress-abc-123")
	resp, err := client.GetMe(context.Background(), r)
	if err != nil {
		t.Fatal(err)
	}
	if got := resp.Header().Get("X-Request-Id"); got != "ingress-abc-123" {
		t.Errorf("response X-Request-Id = %q", got)
	}

	all := lines()
	created, rpc := byMessage(all, "account created"), byMessage(all, "rpc ok")
	if created == nil || rpc == nil {
		t.Fatalf("missing lines: %v", all)
	}
	for _, l := range []map[string]any{created, rpc} {
		if l["request_id"] != "ingress-abc-123" || l["rpc.service"] != "gnome.user.v1.UserService" || l["rpc.method"] != "GetMe" {
			t.Errorf("line lacks request fields: %v", l)
		}
	}
	if rpc["grpc_code"] != "OK" || rpc["account.created"] != true || rpc["rpc.system"] != "connect_rpc" {
		t.Errorf("rpc line = %v", rpc)
	}
}

// A client-sent X-Request-Id that isn't a plain short token is replaced; a rejected name is logged by reason only.
func TestBadRequestIDAndRejectedName(t *testing.T) {
	lines := captureLogs(t)
	client := newLoggedClient(t)
	r := connect.NewRequest(&userv1.UpdateGnomeRequest{
		Gnome:      &userv1.Gnome{DisplayName: "x"},
		UpdateMask: &fieldmaskpb.FieldMask{Paths: []string{"display_name"}},
	})
	r.Header().Set("Authorization", "Bearer t1")
	r.Header().Set("X-Request-Id", `evil"} {"injected`)
	_, err := client.UpdateGnome(context.Background(), r)
	wantCode(t, err, connect.CodeInvalidArgument)

	all := lines()
	rejected, rpc := byMessage(all, "display name rejected"), byMessage(all, "rpc failed")
	if rejected == nil || rpc == nil {
		t.Fatalf("missing lines: %v", all)
	}
	if rejected["reason"] != "too_short" || rejected["severity"] != "WARN" {
		t.Errorf("rejected line = %v", rejected)
	}
	id, _ := rpc["request_id"].(string)
	if id == "" || strings.ContainsAny(id, `"{} `) || rejected["request_id"] != id {
		t.Errorf("request_id not regenerated/shared: rpc=%q rejected=%v", id, rejected["request_id"])
	}
	if rpc["grpc_code"] != "InvalidArgument" || rpc["severity"] != "WARN" {
		t.Errorf("rpc line = %v", rpc)
	}
	for _, l := range all {
		for k, v := range l {
			if s, ok := v.(string); ok && s == "x" {
				t.Errorf("the rejected name leaked into %s: %v", k, l)
			}
		}
	}
}

// With a tracer provider installed, each RPC is a server span that continues the caller's traceparent, carries the
// request's fields as attributes, and the request's log lines carry its trace_id and span_id.
func TestRPCSpanAndLogCorrelation(t *testing.T) {
	rec := tracetest.NewSpanRecorder()
	tp := sdktrace.NewTracerProvider(sdktrace.WithSpanProcessor(rec))
	prev := otel.GetTracerProvider()
	otel.SetTracerProvider(tp)
	t.Cleanup(func() { otel.SetTracerProvider(prev) })

	lines := captureLogs(t)
	client := newLoggedClient(t)
	r := connect.NewRequest(&userv1.GetMeRequest{})
	r.Header().Set("Authorization", "Bearer t1")
	r.Header().Set("traceparent", "00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01")
	if _, err := client.GetMe(context.Background(), r); err != nil {
		t.Fatal(err)
	}

	spans := rec.Ended()
	if len(spans) != 1 {
		t.Fatalf("%d spans, want 1", len(spans))
	}
	s := spans[0]
	if s.Name() != "gnome.user.v1.UserService/GetMe" || s.SpanKind() != trace.SpanKindServer {
		t.Errorf("span %q kind %v", s.Name(), s.SpanKind())
	}
	if got := s.SpanContext().TraceID().String(); got != "0af7651916cd43dd8448eb211c80319c" {
		t.Errorf("trace id %s: incoming traceparent not continued", got)
	}
	attrs := map[string]string{}
	for _, kv := range s.Attributes() {
		attrs[string(kv.Key)] = kv.Value.Emit()
	}
	if attrs["rpc.method"] != "GetMe" || attrs["account.created"] != "true" || attrs["rpc.connect_rpc.error_code"] != "ok" {
		t.Errorf("span attributes = %v", attrs)
	}
	rpc := byMessage(lines(), "rpc ok")
	if rpc["trace_id"] != "0af7651916cd43dd8448eb211c80319c" || rpc["span_id"] != s.SpanContext().SpanID().String() {
		t.Errorf("log line not correlated: %v", rpc)
	}
}
