// Package obs sets up logging for the platform service, following the whale-net logging standard
// (whale-net/everything libs/go/logging and docs/LOGGING_ENV_VARS.md).
//
// Logs are always structured: one whale-net JSON line per record on stdout (timestamp, severity, message, app_name,
// domain, environment, ... plus the record's attributes and the request fields from the context, see ctx.go). With
// ENABLE_OTEL_LOGGING on (true, 1 or yes) every record is also exported over OTLP gRPC to
// OTEL_EXPORTER_OTLP_ENDPOINT, carrying the whale-net resource attributes (service.name, service.namespace,
// deployment.environment, k8s.pod.name, ...). OTEL_SDK_DISABLED=true or OTEL_LOGS_DISABLED=true turn the export off
// again without a rebuild, as in whale-net.
//
// Never log user ids, handles, names (not even a rejected one), emails, tokens or IP addresses (see PRIVACY.md).
package obs

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"os"
	"strings"
	"sync"
	"time"

	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/exporters/otlp/otlplog/otlploggrpc"
	otellog "go.opentelemetry.io/otel/log"
	sdklog "go.opentelemetry.io/otel/sdk/log"
	"go.opentelemetry.io/otel/sdk/resource"
)

// Identity is the service identity, read from the whale-net environment variables.
type Identity struct {
	ServiceName string // APP_NAME
	Domain      string // APP_DOMAIN
	AppType     string // APP_TYPE
	Version     string // APP_VERSION
	Environment string // APP_ENV, ENVIRONMENT
	CommitSHA   string // GIT_COMMIT, COMMIT_SHA
	PodName     string // POD_NAME, HOSTNAME
	Namespace   string // NAMESPACE, POD_NAMESPACE
	NodeName    string // NODE_NAME
}

// Enabled reports whether ENABLE_OTEL_LOGGING asks for OTLP log export and no OTEL_*_DISABLED override forbids it.
func Enabled() bool {
	return truthy(os.Getenv("ENABLE_OTEL_LOGGING")) &&
		!strings.EqualFold(os.Getenv("OTEL_SDK_DISABLED"), "true") &&
		!strings.EqualFold(os.Getenv("OTEL_LOGS_DISABLED"), "true")
}

func truthy(v string) bool {
	switch strings.ToLower(strings.TrimSpace(v)) {
	case "true", "1", "yes":
		return true
	}
	return false
}

func first(keys ...string) string {
	for _, k := range keys {
		if v := os.Getenv(k); v != "" {
			return v
		}
	}
	return ""
}

func or(v, def string) string {
	if v == "" {
		return def
	}
	return v
}

// IdentityFromEnv reads the identity; defaultName is used when APP_NAME is unset.
func IdentityFromEnv(defaultName string) Identity {
	return Identity{
		ServiceName: or(os.Getenv("APP_NAME"), defaultName),
		Domain:      or(os.Getenv("APP_DOMAIN"), "lawn-gnome-panic"),
		AppType:     os.Getenv("APP_TYPE"),
		Version:     or(os.Getenv("APP_VERSION"), "latest"),
		Environment: or(first("APP_ENV", "ENVIRONMENT"), "development"),
		CommitSHA:   first("GIT_COMMIT", "COMMIT_SHA"),
		PodName:     first("POD_NAME", "HOSTNAME"),
		Namespace:   first("NAMESPACE", "POD_NAMESPACE"),
		NodeName:    os.Getenv("NODE_NAME"),
	}
}

// ResourceAttributes are the OTel resource attributes for id, the same set whale-net's buildResource produces.
func ResourceAttributes(id Identity) []attribute.KeyValue {
	attrs := []attribute.KeyValue{
		attribute.String("service.name", id.ServiceName),
		attribute.String("service.version", id.Version),
		attribute.String("deployment.environment", id.Environment),
	}
	add := func(k, v string) {
		if v != "" {
			attrs = append(attrs, attribute.String(k, v))
		}
	}
	add("service.namespace", id.Domain)
	add("service.type", id.AppType)
	if id.CommitSHA != "" {
		add("vcs.commit.id", id.CommitSHA)
		add("service.instance.id", id.CommitSHA[:min(8, len(id.CommitSHA))])
	}
	add("k8s.pod.name", id.PodName)
	add("k8s.namespace.name", id.Namespace)
	add("k8s.node.name", id.NodeName)
	return attrs
}

// endpoint is OTEL_EXPORTER_OTLP_ENDPOINT as host:port (whale-net strips any http:// or https://).
func endpoint() string {
	e := or(first("OTEL_EXPORTER_OTLP_LOGS_ENDPOINT", "OTEL_EXPORTER_OTLP_ENDPOINT"), "localhost:4317")
	e = strings.TrimPrefix(e, "https://")
	return strings.TrimPrefix(e, "http://")
}

var (
	mu       sync.Mutex
	provider *sdklog.LoggerProvider
)

// Setup makes the default slog logger (and the log package, which writes through it) the whale-net JSON handler, with
// OTLP export when Enabled. Call once at start and Shutdown on every exit path. Export failures never stop the
// service: the stdout line is always written.
func Setup(defaultName string) {
	id := IdentityFromEnv(defaultName)
	var otel otellog.Logger
	var err error
	if Enabled() {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		var exporter *otlploggrpc.Exporter
		exporter, err = otlploggrpc.New(ctx, otlploggrpc.WithEndpoint(endpoint()), otlploggrpc.WithInsecure())
		if err == nil {
			var res *resource.Resource
			res, err = resource.New(ctx, resource.WithAttributes(ResourceAttributes(id)...))
			if err == nil {
				p := sdklog.NewLoggerProvider(sdklog.WithProcessor(sdklog.NewBatchProcessor(exporter)), sdklog.WithResource(res))
				mu.Lock()
				provider = p
				mu.Unlock()
				otel = p.Logger(id.ServiceName)
			}
		}
	}
	slog.SetDefault(slog.New(NewHandler(os.Stdout, id, otel)))
	if err != nil {
		slog.Error("failed to initialize OTLP log exporter", "error", err)
	}
	args := []any{"logger", "obs", "service_name", id.ServiceName, "environment", id.Environment, "domain", id.Domain,
		"json_format", true, "otlp_enabled", otel != nil}
	if otel != nil {
		args = append(args, "otlp_endpoint", endpoint())
	}
	slog.Info("logging configured", args...)
}

// Shutdown flushes pending OTLP records. Safe to call when Setup did not enable export.
func Shutdown(ctx context.Context) error {
	mu.Lock()
	p := provider
	provider = nil
	mu.Unlock()
	if p == nil {
		return nil
	}
	return p.Shutdown(ctx)
}

// Fatal logs at ERROR, flushes the exporter and exits 1: log.Fatal would skip the flush.
func Fatal(msg string, args ...any) {
	slog.Error(msg, args...)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	_ = Shutdown(ctx)
	os.Exit(1)
}

// Handler writes whale-net JSON lines and, when otel is set, emits the same record over OTLP.
type Handler struct {
	w     io.Writer
	wmu   *sync.Mutex
	id    Identity
	otel  otellog.Logger
	level slog.Level
	attrs []slog.Attr // bound with WithAttrs, already prefixed by any group
	group string
}

// NewHandler returns a Handler; otel may be nil (stdout only).
func NewHandler(w io.Writer, id Identity, otel otellog.Logger) *Handler {
	return &Handler{w: w, wmu: &sync.Mutex{}, id: id, otel: otel, level: slog.LevelInfo}
}

func (h *Handler) Enabled(_ context.Context, l slog.Level) bool { return l >= h.level }

func (h *Handler) WithAttrs(as []slog.Attr) slog.Handler {
	c := *h
	c.attrs = append(append([]slog.Attr{}, h.attrs...), h.prefixed(as)...)
	return &c
}

func (h *Handler) WithGroup(name string) slog.Handler {
	c := *h
	if c.group != "" {
		c.group += "."
	}
	c.group += name
	return &c
}

func (h *Handler) prefixed(as []slog.Attr) []slog.Attr {
	if h.group == "" {
		return as
	}
	out := make([]slog.Attr, len(as))
	for i, a := range as {
		out[i] = slog.Attr{Key: h.group + "." + a.Key, Value: a.Value}
	}
	return out
}

func (h *Handler) Handle(ctx context.Context, r slog.Record) error {
	// Precedence (later wins in the JSON object): bound attrs, request fields from ctx, then the call's own attrs.
	attrs := append(append([]slog.Attr{}, h.attrs...), fields(ctx)...)
	var call []slog.Attr
	r.Attrs(func(a slog.Attr) bool { call = append(call, a); return true })
	attrs = dedupe(append(attrs, h.prefixed(call)...))

	// The whale-net stdout line: timestamp, severity, message, identity, then the record's attributes.
	m := map[string]any{
		"timestamp":   r.Time.UTC().Format(time.RFC3339Nano),
		"severity":    r.Level.String(),
		"message":     r.Message,
		"app_name":    h.id.ServiceName,
		"environment": h.id.Environment,
	}
	for k, v := range map[string]string{"domain": h.id.Domain, "app_type": h.id.AppType, "version": h.id.Version,
		"commit_sha": h.id.CommitSHA, "pod_name": h.id.PodName, "namespace": h.id.Namespace, "node_name": h.id.NodeName} {
		if v != "" {
			m[k] = v
		}
	}
	for _, a := range attrs {
		m[a.Key] = jsonValue(a.Value.Resolve())
	}
	line, err := json.Marshal(m)
	if err != nil {
		line = []byte(fmt.Sprintf(`{"severity":"ERROR","message":"log marshal: %v"}`, err))
	}
	h.wmu.Lock()
	_, _ = h.w.Write(append(line, '\n'))
	h.wmu.Unlock()

	if h.otel != nil {
		var rec otellog.Record
		rec.SetTimestamp(r.Time)
		rec.SetObservedTimestamp(time.Now())
		rec.SetBody(otellog.StringValue(r.Message))
		rec.SetSeverity(severity(r.Level))
		rec.SetSeverityText(r.Level.String())
		kvs := make([]otellog.KeyValue, 0, len(attrs))
		for _, a := range attrs {
			kvs = append(kvs, otelKV(a))
		}
		rec.AddAttributes(kvs...)
		h.otel.Emit(ctx, rec)
	}
	return nil
}

// dedupe keeps the last attr for each key, in first-seen order, so OTLP gets one value per key like the JSON line.
func dedupe(attrs []slog.Attr) []slog.Attr {
	idx := make(map[string]int, len(attrs))
	out := attrs[:0:0]
	for _, a := range attrs {
		if i, ok := idx[a.Key]; ok {
			out[i] = a
			continue
		}
		idx[a.Key] = len(out)
		out = append(out, a)
	}
	return out
}

func jsonValue(v slog.Value) any {
	switch v.Kind() {
	case slog.KindString:
		return v.String()
	case slog.KindInt64:
		return v.Int64()
	case slog.KindUint64:
		return v.Uint64()
	case slog.KindFloat64:
		return v.Float64()
	case slog.KindBool:
		return v.Bool()
	case slog.KindDuration:
		return v.Duration().String()
	case slog.KindTime:
		return v.Time().Format(time.RFC3339Nano)
	default:
		if err, ok := v.Any().(error); ok {
			return err.Error()
		}
		return v.String()
	}
}

// otelKV keeps the attribute's type (string/int/float/bool) rather than flattening it, as whale-net does.
func otelKV(a slog.Attr) otellog.KeyValue {
	v := a.Value.Resolve()
	switch v.Kind() {
	case slog.KindInt64:
		return otellog.Int64(a.Key, v.Int64())
	case slog.KindUint64:
		return otellog.Int64(a.Key, int64(v.Uint64()))
	case slog.KindFloat64:
		return otellog.Float64(a.Key, v.Float64())
	case slog.KindBool:
		return otellog.Bool(a.Key, v.Bool())
	default:
		s, _ := jsonValue(v).(string)
		return otellog.String(a.Key, s)
	}
}

func severity(l slog.Level) otellog.Severity {
	switch {
	case l >= slog.LevelError:
		return otellog.SeverityError
	case l >= slog.LevelWarn:
		return otellog.SeverityWarn
	case l >= slog.LevelInfo:
		return otellog.SeverityInfo
	default:
		return otellog.SeverityDebug
	}
}
