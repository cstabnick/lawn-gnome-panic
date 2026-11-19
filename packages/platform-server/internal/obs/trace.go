package obs

import (
	"context"
	"log/slog"
	"net/http"
	"os"
	"strings"
	"time"

	"go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracegrpc"
	"go.opentelemetry.io/otel/propagation"
	"go.opentelemetry.io/otel/sdk/resource"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	"go.opentelemetry.io/otel/trace"
)

// Tracing, following whale-net's EnableTracing: spans go over OTLP gRPC to OTEL_EXPORTER_OTLP_TRACES_ENDPOINT or
// OTEL_EXPORTER_OTLP_ENDPOINT when ENABLE_OTEL_TRACING is true/1/yes, unless OTEL_SDK_DISABLED=true or
// OTEL_TRACES_DISABLED=true. Without it the global tracer is the no-op one, so spans cost nothing.
//
// What is traced: one server span per RPC (Interceptor, continuing an incoming W3C traceparent), every Postgres query
// (otelpgx, see PgxTracer), outbound HTTP such as Keycloak's JWKS fetch (http.DefaultTransport), and each purge run.
// Log lines written inside a span carry its trace_id and span_id.

// TracingEnabled reports whether ENABLE_OTEL_TRACING asks for spans and no OTEL_*_DISABLED override forbids it.
func TracingEnabled() bool {
	return truthy(os.Getenv("ENABLE_OTEL_TRACING")) &&
		!strings.EqualFold(os.Getenv("OTEL_SDK_DISABLED"), "true") &&
		!strings.EqualFold(os.Getenv("OTEL_TRACES_DISABLED"), "true")
}

var tracerProvider *sdktrace.TracerProvider

func traceEndpoint() string {
	e := or(first("OTEL_EXPORTER_OTLP_TRACES_ENDPOINT", "OTEL_EXPORTER_OTLP_ENDPOINT"), "localhost:4317")
	e = strings.TrimPrefix(e, "https://")
	return strings.TrimPrefix(e, "http://")
}

// setupTracing installs the global tracer provider and wraps http.DefaultTransport. Called from Setup.
func setupTracing(id Identity) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	exporter, err := otlptracegrpc.New(ctx, otlptracegrpc.WithEndpoint(traceEndpoint()), otlptracegrpc.WithInsecure())
	if err != nil {
		return err
	}
	res, err := resource.New(ctx, resource.WithAttributes(ResourceAttributes(id)...))
	if err != nil {
		return err
	}
	tp := sdktrace.NewTracerProvider(sdktrace.WithBatcher(exporter), sdktrace.WithResource(res))
	otel.SetTracerProvider(tp)
	mu.Lock()
	tracerProvider = tp
	mu.Unlock()
	// Outbound calls made through the default client (go-oidc's JWKS and discovery fetches) get client spans.
	http.DefaultTransport = otelhttp.NewTransport(http.DefaultTransport)
	return nil
}

func shutdownTracing(ctx context.Context) error {
	mu.Lock()
	tp := tracerProvider
	tracerProvider = nil
	mu.Unlock()
	if tp == nil {
		return nil
	}
	return tp.Shutdown(ctx)
}

// Tracer is the service's tracer (the no-op one unless tracing is on).
func Tracer() trace.Tracer {
	return otel.Tracer("github.com/cstabnick/lawn-gnome-panic/packages/platform-server")
}

// propagator reads and writes W3C traceparent/tracestate and baggage headers.
var propagator = propagation.NewCompositeTextMapPropagator(propagation.TraceContext{}, propagation.Baggage{})

// toSpanAttrs converts slog attrs to span attributes, keeping the type.
func toSpanAttrs(as []slog.Attr) []attribute.KeyValue {
	out := make([]attribute.KeyValue, 0, len(as))
	for _, a := range as {
		v := a.Value.Resolve()
		switch v.Kind() {
		case slog.KindInt64:
			out = append(out, attribute.Int64(a.Key, v.Int64()))
		case slog.KindUint64:
			out = append(out, attribute.Int64(a.Key, int64(v.Uint64())))
		case slog.KindFloat64:
			out = append(out, attribute.Float64(a.Key, v.Float64()))
		case slog.KindBool:
			out = append(out, attribute.Bool(a.Key, v.Bool()))
		default:
			s, _ := jsonValue(v).(string)
			out = append(out, attribute.String(a.Key, s))
		}
	}
	return out
}
