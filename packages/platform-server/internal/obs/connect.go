package obs

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"strings"
	"time"

	"connectrpc.com/connect"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/codes"
	"go.opentelemetry.io/otel/metric"
	"go.opentelemetry.io/otel/propagation"
	"go.opentelemetry.io/otel/trace"
)

// Interceptor logs one line per Connect RPC. It carries whale-net's gRPC request-log keys (libs/go/logging
// grpc_interceptors.go: grpc_method, grpc_code, duration_ms, error) plus the OTel RPC semantic-convention keys
// (rpc.system, rpc.service, rpc.method) and a request_id. Handlers add their own outcome fields with Add, and those
// land on this line too. Success logs at INFO, most failures at WARN, and Unknown/Internal/DataLoss/Unavailable at
// ERROR. The request id is echoed in the X-Request-Id response header. No peer address (PRIVACY.md: no IPs).
func Interceptor() connect.Interceptor { return interceptor{} }

type interceptor struct{}

// begin starts the request's server span (continuing an incoming traceparent) and its field bag.
func begin(ctx context.Context, spec connect.Spec, protocol string, header http.Header) (context.Context, string, trace.Span) {
	id := RequestID(header.Get("X-Request-Id"))
	service, method := splitProcedure(spec.Procedure)
	ctx = propagator.Extract(ctx, propagation.HeaderCarrier(header))
	ctx, span := Tracer().Start(ctx, service+"/"+method, trace.WithSpanKind(trace.SpanKindServer))
	return WithFields(ctx,
		"request_id", id,
		"rpc.system", "connect_rpc",
		"rpc.service", service,
		"rpc.method", method,
		"rpc.connect_rpc.protocol", protocol,
	), id, span
}

// end closes the span with the request's fields as attributes. Server spans are marked as errors only for the codes
// that mean the server failed (OTel RPC semantic conventions), not for a client's bad request.
func end(ctx context.Context, span trace.Span, err error) {
	if !span.IsRecording() {
		span.End()
		return
	}
	span.SetAttributes(toSpanAttrs(dedupe(fields(ctx)))...)
	span.SetAttributes(attribute.String("rpc.connect_rpc.error_code", connectCode(err)))
	if Level(err) == slog.LevelError {
		span.SetStatus(codes.Error, Code(err))
		span.RecordError(err)
	}
	span.End()
}

func (interceptor) WrapUnary(next connect.UnaryFunc) connect.UnaryFunc {
	return func(ctx context.Context, req connect.AnyRequest) (connect.AnyResponse, error) {
		if req.Spec().IsClient {
			return next(ctx, req)
		}
		start := time.Now()
		ctx, id, span := begin(ctx, req.Spec(), req.Peer().Protocol, req.Header())
		res, err := next(ctx, req)
		if err == nil && res != nil { // on error res can be a typed nil: don't touch it
			res.Header().Set("X-Request-Id", id)
		}
		var ce *connect.Error
		if errors.As(err, &ce) {
			ce.Meta().Set("X-Request-Id", id)
		}
		logRPC(ctx, req.Spec().Procedure, start, err)
		recordRPC(ctx, req.Spec().Procedure, start, err)
		end(ctx, span, err)
		return res, err
	}
}

func (interceptor) WrapStreamingClient(next connect.StreamingClientFunc) connect.StreamingClientFunc {
	return next
}

func (interceptor) WrapStreamingHandler(next connect.StreamingHandlerFunc) connect.StreamingHandlerFunc {
	return func(ctx context.Context, conn connect.StreamingHandlerConn) error {
		start := time.Now()
		ctx, id, span := begin(ctx, conn.Spec(), conn.Peer().Protocol, conn.RequestHeader())
		conn.ResponseHeader().Set("X-Request-Id", id)
		err := next(ctx, conn)
		logRPC(ctx, conn.Spec().Procedure, start, err)
		recordRPC(ctx, conn.Spec().Procedure, start, err)
		end(ctx, span, err)
		return err
	}
}

// splitProcedure turns "/gnome.user.v1.UserService/GetMe" into ("gnome.user.v1.UserService", "GetMe").
func splitProcedure(p string) (string, string) {
	p = strings.TrimPrefix(p, "/")
	if i := strings.LastIndex(p, "/"); i >= 0 {
		return p[:i], p[i+1:]
	}
	return p, ""
}

// connectCode is the Connect wire code for rpc.connect_rpc.error_code ("invalid_argument", ...), "ok" for nil.
func connectCode(err error) string {
	if err == nil {
		return "ok"
	}
	return connect.CodeOf(err).String()
}

// Code is the gRPC status name for err ("OK" for nil), as whale-net logs it.
func Code(err error) string {
	if err == nil {
		return "OK"
	}
	switch c := connect.CodeOf(err); c {
	case connect.CodeInvalidArgument:
		return "InvalidArgument"
	case connect.CodeDeadlineExceeded:
		return "DeadlineExceeded"
	case connect.CodeNotFound:
		return "NotFound"
	case connect.CodeAlreadyExists:
		return "AlreadyExists"
	case connect.CodePermissionDenied:
		return "PermissionDenied"
	case connect.CodeResourceExhausted:
		return "ResourceExhausted"
	case connect.CodeFailedPrecondition:
		return "FailedPrecondition"
	case connect.CodeAborted:
		return "Aborted"
	case connect.CodeOutOfRange:
		return "OutOfRange"
	case connect.CodeUnimplemented:
		return "Unimplemented"
	case connect.CodeInternal:
		return "Internal"
	case connect.CodeUnavailable:
		return "Unavailable"
	case connect.CodeDataLoss:
		return "DataLoss"
	case connect.CodeUnauthenticated:
		return "Unauthenticated"
	case connect.CodeCanceled:
		return "Canceled"
	default:
		return "Unknown"
	}
}

// Level is the log level whale-net uses for an RPC that ended with err.
func Level(err error) slog.Level {
	switch Code(err) {
	case "OK":
		return slog.LevelInfo
	case "Unknown", "Internal", "DataLoss", "Unavailable":
		return slog.LevelError
	default:
		return slog.LevelWarn
	}
}

// recordRPC adds the call to rpc.server.call.duration (OTel RPC metric semantic conventions).
func recordRPC(ctx context.Context, procedure string, start time.Time, err error) {
	service, method := splitProcedure(procedure)
	RPCDuration.Record(ctx, time.Since(start).Seconds(), metric.WithAttributes(
		attribute.String("rpc.system", "connect_rpc"),
		attribute.String("rpc.service", service),
		attribute.String("rpc.method", method),
		attribute.String("rpc.connect_rpc.error_code", connectCode(err)),
	))
}

func logRPC(ctx context.Context, procedure string, start time.Time, err error) {
	attrs := []any{"logger", "rpc", "grpc_method", procedure, "grpc_code", Code(err), "duration_ms", time.Since(start).Milliseconds()}
	var ce *connect.Error
	if errors.As(err, &ce) {
		attrs = append(attrs, "error", ce.Message()) // the client-facing message; internalErr already logged the cause
	} else if err != nil {
		attrs = append(attrs, "error", err.Error())
	}
	msg := "rpc ok"
	if err != nil {
		msg = "rpc failed"
	}
	slog.Log(ctx, Level(err), msg, attrs...)
}
