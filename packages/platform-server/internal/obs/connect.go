package obs

import (
	"context"
	"errors"
	"log/slog"
	"time"

	"connectrpc.com/connect"
)

// Interceptor logs one line per Connect RPC with whale-net's gRPC request-log attributes (libs/go/logging
// grpc_interceptors.go): grpc_method, grpc_code, duration_ms and error. Success logs at INFO, most failures at WARN,
// and Unknown/Internal/DataLoss/Unavailable at ERROR. No peer address (PRIVACY.md: no IPs).
func Interceptor() connect.Interceptor { return interceptor{} }

type interceptor struct{}

func (interceptor) WrapUnary(next connect.UnaryFunc) connect.UnaryFunc {
	return func(ctx context.Context, req connect.AnyRequest) (connect.AnyResponse, error) {
		start := time.Now()
		res, err := next(ctx, req)
		logRPC(ctx, req.Spec().Procedure, start, err)
		return res, err
	}
}

func (interceptor) WrapStreamingClient(next connect.StreamingClientFunc) connect.StreamingClientFunc {
	return next
}

func (interceptor) WrapStreamingHandler(next connect.StreamingHandlerFunc) connect.StreamingHandlerFunc {
	return func(ctx context.Context, conn connect.StreamingHandlerConn) error {
		start := time.Now()
		err := next(ctx, conn)
		logRPC(ctx, conn.Spec().Procedure, start, err)
		return err
	}
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
