package obs

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"log/slog"
	"regexp"
	"sync"
)

// Request-scoped fields: the RPC interceptor puts a bag in the context, handlers add to it with Add, and every line
// logged with that context (slog.InfoContext and friends) carries the bag. So the RPC line, an internal error and a
// domain event of one request all share request_id and can be joined in the log store.

type bagKey struct{}

type bag struct {
	mu    sync.Mutex
	attrs []slog.Attr
}

// WithFields returns ctx with a new field bag holding args (slog key/value pairs or slog.Attr values).
func WithFields(ctx context.Context, args ...any) context.Context {
	b := &bag{}
	b.attrs = argsToAttrs(args)
	return context.WithValue(ctx, bagKey{}, b)
}

// Add appends fields to ctx's bag. Without a bag (no interceptor, e.g. in tests) it does nothing.
func Add(ctx context.Context, args ...any) {
	b, _ := ctx.Value(bagKey{}).(*bag)
	if b == nil {
		return
	}
	attrs := argsToAttrs(args)
	b.mu.Lock()
	b.attrs = append(b.attrs, attrs...)
	b.mu.Unlock()
}

// fields returns a copy of ctx's bag; later keys win when the line is written.
func fields(ctx context.Context) []slog.Attr {
	if ctx == nil {
		return nil
	}
	b, _ := ctx.Value(bagKey{}).(*bag)
	if b == nil {
		return nil
	}
	b.mu.Lock()
	defer b.mu.Unlock()
	return append([]slog.Attr(nil), b.attrs...)
}

func argsToAttrs(args []any) []slog.Attr {
	var r slog.Record
	r.Add(args...)
	out := make([]slog.Attr, 0, r.NumAttrs())
	r.Attrs(func(a slog.Attr) bool { out = append(out, a); return true })
	return out
}

var requestIDRe = regexp.MustCompile(`^[A-Za-z0-9-]{1,64}$`)

// RequestID is the incoming X-Request-ID (ingress-nginx sets one per request) when it is a plain token of at most
// 64 characters, otherwise a new random one. The header is client-controlled, hence the check.
func RequestID(incoming string) string {
	if requestIDRe.MatchString(incoming) {
		return incoming
	}
	var b [16]byte
	_, _ = rand.Read(b[:])
	return hex.EncodeToString(b[:])
}
