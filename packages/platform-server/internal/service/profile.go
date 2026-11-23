package service

import (
	"context"
	"errors"
	"log/slog"
	"math"
	"net"
	"net/http"
	"regexp"
	"sort"
	"strings"
	"sync"
	"time"
	"unicode/utf8"

	"connectrpc.com/connect"
	"google.golang.org/protobuf/types/known/timestamppb"

	profilev1 "github.com/cstabnick/lawn-gnome-panic/packages/platform-server/gen/gnome/profile/v1"
	"github.com/cstabnick/lawn-gnome-panic/packages/platform-server/gen/gnome/profile/v1/profilev1connect"
	"github.com/cstabnick/lawn-gnome-panic/packages/platform-server/internal/auth"
	"github.com/cstabnick/lawn-gnome-panic/packages/platform-server/internal/obs"
	"github.com/cstabnick/lawn-gnome-panic/packages/platform-server/internal/store"
)

// Limits on a hitch batch (see profile.proto).
const (
	MaxHitchesPerBatch = 60
	MaxSpansPerHitch   = 64
	MaxContextEntries  = 8
	maxShort           = 64
	maxHitchMS         = 10 * 60 * 1000
	// ProfileRateMax is the default number of batches per address per minute.
	ProfileRateMax = 30
	// seriesMaxHitches caps how many hitches one HitchSeries call aggregates.
	seriesMaxHitches = 50000
	seriesTopSystems = 10
)

var (
	sessionIDRe = regexp.MustCompile(`^[A-Za-z0-9_-]{8,40}$`)
	gameRe      = regexp.MustCompile(`^[a-z0-9-]{1,40}$`)
	hitchKinds  = map[string]bool{"frame": true, "longtask": true, "gap": true, "mark": true, store.SampleKind: true}
)

// ProfileOptions tune the profile service; zero values get the defaults.
type ProfileOptions struct {
	Now func() time.Time
	// RateMax is the number of ReportHitches calls per client address per minute. Default ProfileRateMax.
	RateMax int
}

// ProfileService implements gnome.profile.v1.ProfileService: anonymous hitch intake and the viewer's
// queries. Viewers are checked with the UserService's token check (users.caller).
type ProfileService struct {
	profilev1connect.UnimplementedProfileServiceHandler
	store store.HitchStore
	users *UserService
	opts  ProfileOptions

	mu        sync.Mutex
	hits      map[string]int
	hitsSince time.Time
}

var _ profilev1connect.ProfileServiceHandler = (*ProfileService)(nil)

func NewProfileService(st store.HitchStore, users *UserService, opts ProfileOptions) *ProfileService {
	if opts.Now == nil {
		opts.Now = time.Now
	}
	if opts.RateMax == 0 {
		opts.RateMax = ProfileRateMax
	}
	return &ProfileService{store: st, users: users, opts: opts, hits: map[string]int{}}
}

// viewer returns the caller allowed to read hitch reports. Today any signed-in player.
// TODO(authz): require a profiler/admin role here once accounts have roles.
func (s *ProfileService) viewer(ctx context.Context, header http.Header) (auth.Caller, error) {
	return s.users.caller(ctx, header)
}

// clientAddr is the rate-limit key: the first X-Forwarded-For hop behind the ingress, else the peer. Never logged.
func clientAddr(header http.Header, peer string) string {
	if f := header.Get("X-Forwarded-For"); f != "" {
		return strings.TrimSpace(strings.Split(f, ",")[0])
	}
	if host, _, err := net.SplitHostPort(peer); err == nil {
		return host
	}
	return peer
}

// allow counts one batch for addr in the current minute.
func (s *ProfileService) allow(addr string) bool {
	s.mu.Lock()
	defer s.mu.Unlock()
	now := s.opts.Now()
	if now.Sub(s.hitsSince) >= time.Minute {
		s.hits = map[string]int{}
		s.hitsSince = now
	}
	s.hits[addr]++
	return s.hits[addr] <= s.opts.RateMax
}

// clip cuts s to at most n runes, dropping invalid UTF-8.
func clip(s string, n int) string {
	if !utf8.ValidString(s) {
		s = strings.ToValidUTF8(s, "")
	}
	if utf8.RuneCountInString(s) <= n {
		return s
	}
	return string([]rune(s)[:n])
}

func finite(v float64, lo, hi float64) bool {
	return !math.IsNaN(v) && !math.IsInf(v, 0) && v >= lo && v <= hi
}

func invalid(msg string) error {
	return connect.NewError(connect.CodeInvalidArgument, errors.New(msg))
}

func (s *ProfileService) ReportHitches(ctx context.Context, req *connect.Request[profilev1.ReportHitchesRequest]) (*connect.Response[profilev1.ReportHitchesResponse], error) {
	m := req.Msg
	if !s.allow(clientAddr(req.Header(), req.Peer().Addr)) {
		obs.Add(ctx, "profile.rejected", "rate_limited")
		return nil, connect.NewError(connect.CodeResourceExhausted, errors.New("too many batches"))
	}
	if !sessionIDRe.MatchString(m.SessionId) {
		return nil, invalid("bad session_id")
	}
	if !gameRe.MatchString(m.Game) {
		return nil, invalid("bad game")
	}
	if len(m.Hitches) == 0 || len(m.Hitches) > MaxHitchesPerBatch {
		return nil, invalid("1-60 hitches per batch")
	}
	now := s.opts.Now().UTC()
	// The client's clock may be off: shift its times by the difference between its send time and ours.
	skew := time.Duration(0)
	if m.SentAtUnixMs > 0 {
		skew = now.Sub(time.UnixMilli(m.SentAtUnixMs))
	}
	hs := make([]store.Hitch, 0, len(m.Hitches))
	for _, h := range m.Hitches {
		if !hitchKinds[h.Kind] || !finite(h.DurationMs, 0, maxHitchMS) || !finite(h.AtMs, 0, math.MaxFloat64) {
			return nil, invalid("bad hitch")
		}
		when := now
		if h.OccurredAt != nil && h.OccurredAt.IsValid() {
			when = h.OccurredAt.AsTime().Add(skew)
			if when.After(now) {
				when = now
			}
			if when.Before(now.Add(-time.Hour)) {
				when = now.Add(-time.Hour)
			}
		}
		ctxMap := map[string]string{}
		for k, v := range h.Context {
			if len(ctxMap) >= MaxContextEntries {
				break
			}
			ctxMap[clip(k, maxShort)] = clip(v, maxShort)
		}
		if len(h.Spans) > MaxSpansPerHitch {
			return nil, invalid("too many spans")
		}
		spans := make([]store.HitchSpan, 0, len(h.Spans))
		for _, sp := range h.Spans {
			if !finite(sp.StartMs, 0, maxHitchMS) || !finite(sp.DurationMs, 0, maxHitchMS) || sp.Name == "" {
				return nil, invalid("bad span")
			}
			spans = append(spans, store.HitchSpan{Name: clip(sp.Name, maxShort), StartMS: sp.StartMs, Duration: sp.DurationMs})
		}
		var render *store.HitchRender
		if r := h.Render; r != nil {
			if !finite(r.DrawCalls, 0, 1e6) || !finite(r.Triangles, 0, 1e9) || !finite(r.GpuMs, 0, maxHitchMS) || !finite(float64(r.PixelRatio), 0, 16) {
				return nil, invalid("bad render")
			}
			render = &store.HitchRender{
				DrawCalls: r.DrawCalls, Triangles: r.Triangles, GpuMS: r.GpuMs, PixelRatio: r.PixelRatio,
				Geometries: max(0, min(r.Geometries, 1000000)), Textures: max(0, min(r.Textures, 1000000)), Programs: max(0, min(r.Programs, 1000000)),
			}
		}
		var frames *store.HitchFrames
		if f := h.Frames; f != nil {
			if !finite(f.P50Ms, 0, maxHitchMS) || !finite(f.P95Ms, 0, maxHitchMS) || !finite(f.MaxMs, 0, maxHitchMS) || !finite(f.CpuMs, 0, maxHitchMS) {
				return nil, invalid("bad frames")
			}
			frames = &store.HitchFrames{
				Frames: max(0, min(f.Frames, 100000)), P50MS: f.P50Ms, P95MS: f.P95Ms, MaxMS: f.MaxMs, CPUMS: f.CpuMs,
			}
		}
		hs = append(hs, store.Hitch{
			Kind: h.Kind, AtMS: h.AtMs, DurationMS: h.DurationMs, OccurredAt: when.UTC(), Context: ctxMap, Spans: spans,
			Render: render, Frames: frames,
		})
	}
	d := m.Device
	if d == nil {
		d = &profilev1.Device{}
	}
	threshold := m.ThresholdMs
	if !finite(threshold, 0, maxHitchMS) {
		threshold = 0
	}
	sess := store.HitchSession{
		SessionID: m.SessionId, Game: m.Game, Build: clip(m.Build, 40), ThresholdMS: threshold,
		Device: store.HitchDevice{
			GPU: clip(d.Gpu, 120), Touch: d.Touch, Cores: max(0, min(d.Cores, 1024)), MemoryGB: float32(max(0, min(float64(d.MemoryGb), 1024))),
			UserAgent: clip(d.UserAgent, 300), Width: max(0, min(d.Width, 100000)), Height: max(0, min(d.Height, 100000)),
		},
	}
	n, err := s.store.AddHitches(ctx, sess, hs, now)
	if err != nil {
		return nil, internalErr(ctx, err)
	}
	obs.Add(ctx, "game", m.Game, "profile.hitches", n)
	slog.InfoContext(ctx, "hitches stored", "logger", "profile", "game", m.Game, "count", n)
	return connect.NewResponse(&profilev1.ReportHitchesResponse{Stored: int32(n)}), nil
}

func toDevice(d store.HitchDevice) *profilev1.Device {
	return &profilev1.Device{Gpu: d.GPU, Touch: d.Touch, Cores: d.Cores, MemoryGb: d.MemoryGB, UserAgent: d.UserAgent, Width: d.Width, Height: d.Height}
}

func toSessionSummary(s store.HitchSessionSummary) *profilev1.SessionSummary {
	return &profilev1.SessionSummary{
		SessionId: s.SessionID, Game: s.Game, Build: s.Build, Device: toDevice(s.Device),
		StartedAt: timestamppb.New(s.StartedAt), LastSeen: timestamppb.New(s.LastSeen),
		HitchCount: s.HitchCount, WorstMs: s.WorstMS, TotalMs: s.TotalMS, ThresholdMs: s.ThresholdMS, SampleCount: s.SampleCount,
	}
}

func toHitch(h store.Hitch) *profilev1.Hitch {
	spans := make([]*profilev1.Span, len(h.Spans))
	for i, sp := range h.Spans {
		spans[i] = &profilev1.Span{Name: sp.Name, StartMs: sp.StartMS, DurationMs: sp.Duration}
	}
	out := &profilev1.Hitch{Kind: h.Kind, AtMs: h.AtMS, DurationMs: h.DurationMS, OccurredAt: timestamppb.New(h.OccurredAt), Context: h.Context, Spans: spans}
	if r := h.Render; r != nil {
		out.Render = &profilev1.RenderStats{
			DrawCalls: r.DrawCalls, Triangles: r.Triangles, Geometries: r.Geometries, Textures: r.Textures, Programs: r.Programs,
			GpuMs: r.GpuMS, PixelRatio: r.PixelRatio,
		}
	}
	if f := h.Frames; f != nil {
		out.Frames = &profilev1.FrameStats{Frames: f.Frames, P50Ms: f.P50MS, P95Ms: f.P95MS, MaxMs: f.MaxMS, CpuMs: f.CPUMS}
	}
	return out
}

func (s *ProfileService) ListSessions(ctx context.Context, req *connect.Request[profilev1.ListSessionsRequest]) (*connect.Response[profilev1.ListSessionsResponse], error) {
	if _, err := s.viewer(ctx, req.Header()); err != nil {
		return nil, err
	}
	since := s.opts.Now().Add(-24 * time.Hour)
	if req.Msg.Since.IsValid() {
		since = req.Msg.Since.AsTime()
	}
	limit := int(req.Msg.Limit)
	if limit <= 0 {
		limit = 100
	}
	limit = min(limit, 500)
	list, games, err := s.store.ListHitchSessions(ctx, req.Msg.Game, since, limit)
	if err != nil {
		return nil, internalErr(ctx, err)
	}
	out := &profilev1.ListSessionsResponse{Games: games}
	for _, x := range list {
		out.Sessions = append(out.Sessions, toSessionSummary(x))
	}
	return connect.NewResponse(out), nil
}

func (s *ProfileService) GetSession(ctx context.Context, req *connect.Request[profilev1.GetSessionRequest]) (*connect.Response[profilev1.GetSessionResponse], error) {
	if _, err := s.viewer(ctx, req.Header()); err != nil {
		return nil, err
	}
	sum, hs, err := s.store.GetHitchSession(ctx, req.Msg.SessionId)
	if errors.Is(err, store.ErrNotFound) {
		return nil, connect.NewError(connect.CodeNotFound, errors.New("no such session"))
	}
	if err != nil {
		return nil, internalErr(ctx, err)
	}
	out := &profilev1.GetSessionResponse{Session: toSessionSummary(sum)}
	for _, h := range hs {
		out.Hitches = append(out.Hitches, toHitch(h))
	}
	return connect.NewResponse(out), nil
}

func (s *ProfileService) HitchSeries(ctx context.Context, req *connect.Request[profilev1.HitchSeriesRequest]) (*connect.Response[profilev1.HitchSeriesResponse], error) {
	if _, err := s.viewer(ctx, req.Header()); err != nil {
		return nil, err
	}
	until := s.opts.Now()
	if req.Msg.Until.IsValid() {
		until = req.Msg.Until.AsTime()
	}
	since := until.Add(-24 * time.Hour)
	if req.Msg.Since.IsValid() {
		since = req.Msg.Since.AsTime()
	}
	if !since.Before(until) {
		return nil, invalid("since must be before until")
	}
	bucket := pickBucket(until.Sub(since), time.Duration(req.Msg.BucketSeconds)*time.Second)
	hs, err := s.store.QueryHitches(ctx, req.Msg.Game, since, until, seriesMaxHitches)
	if err != nil {
		return nil, internalErr(ctx, err)
	}
	return connect.NewResponse(buildSeries(hs, since, until, bucket)), nil
}

// niceBuckets are the bucket widths pickBucket chooses from.
var niceBuckets = []time.Duration{time.Minute, 5 * time.Minute, 15 * time.Minute, 30 * time.Minute, time.Hour, 3 * time.Hour, 6 * time.Hour, 12 * time.Hour, 24 * time.Hour}

// pickBucket returns asked (at least a minute, at most 1000 buckets), or a nice width giving about 60 buckets.
func pickBucket(span, asked time.Duration) time.Duration {
	if asked > 0 {
		return max(asked, time.Minute, span/1000)
	}
	for _, b := range niceBuckets {
		if span/b <= 60 {
			return b
		}
	}
	return niceBuckets[len(niceBuckets)-1]
}

const (
	otherSystem   = "(other)"
	untimedSystem = "(untimed)"
)

// hitchSystems returns ms per system for one hitch: its spans summed by name, or (untimed) for a hitch with no spans.
func hitchSystems(h store.Hitch) map[string]float64 {
	if len(h.Spans) == 0 {
		return map[string]float64{untimedSystem: h.DurationMS}
	}
	out := map[string]float64{}
	for _, sp := range h.Spans {
		out[sp.Name] += sp.Duration
	}
	return out
}

func percentile(sorted []float64, p float64) float64 {
	if len(sorted) == 0 {
		return 0
	}
	i := int(math.Ceil(p*float64(len(sorted)))) - 1
	return sorted[max(0, min(i, len(sorted)-1))]
}

// sampleAcc sums the frame-sample windows that fall in one bucket.
type sampleAcc struct {
	samples              int
	frameN               int
	p50, p95             float64
	renderN              int
	drawCalls, triangles float64
}

// buildSeries aggregates hitches (since <= OccurredAt < until) into buckets of width bucket.
func buildSeries(all []store.Hitch, since, until time.Time, bucket time.Duration) *profilev1.HitchSeriesResponse {
	// Samples are frame-health windows: they feed only the per-bucket frame fields, never the hitch totals.
	hs := make([]store.Hitch, 0, len(all))
	var samples []store.Hitch
	for _, h := range all {
		if h.Kind == store.SampleKind {
			samples = append(samples, h)
		} else {
			hs = append(hs, h)
		}
	}
	totals := map[string]*profilev1.SystemTotal{}
	per := make([]map[string]float64, len(hs))
	for i, h := range hs {
		per[i] = hitchSystems(h)
		for name, ms := range per[i] {
			t := totals[name]
			if t == nil {
				t = &profilev1.SystemTotal{Name: name}
				totals[name] = t
			}
			t.TotalMs += ms
			t.WorstMs = math.Max(t.WorstMs, ms)
			t.Hitches++
		}
	}
	systems := make([]*profilev1.SystemTotal, 0, len(totals))
	for _, t := range totals {
		systems = append(systems, t)
	}
	sort.Slice(systems, func(i, j int) bool {
		if systems[i].TotalMs != systems[j].TotalMs {
			return systems[i].TotalMs > systems[j].TotalMs
		}
		return systems[i].Name < systems[j].Name
	})
	if len(systems) > seriesTopSystems {
		systems = systems[:seriesTopSystems]
	}
	top := map[string]bool{}
	for _, t := range systems {
		top[t.Name] = true
	}

	start := since.Truncate(bucket)
	n := int(until.Sub(start)/bucket) + 1
	if !start.Add(time.Duration(n-1) * bucket).Before(until) {
		n--
	}
	buckets := make([]*profilev1.SeriesBucket, n)
	durs := make([][]float64, n)
	sessions := make([]map[string]bool, n)
	acc := make([]sampleAcc, n)
	for i := range buckets {
		buckets[i] = &profilev1.SeriesBucket{Start: timestamppb.New(start.Add(time.Duration(i) * bucket)), SystemMs: map[string]float64{}}
		sessions[i] = map[string]bool{}
	}
	for i, h := range hs {
		b := int(h.OccurredAt.Sub(start) / bucket)
		if b < 0 || b >= n {
			continue
		}
		buckets[b].Hitches++
		durs[b] = append(durs[b], h.DurationMS)
		sessions[b][h.SessionID] = true
		for name, ms := range per[i] {
			if !top[name] {
				name = otherSystem
			}
			buckets[b].SystemMs[name] += ms
		}
	}
	for _, h := range samples {
		idx := int(h.OccurredAt.Sub(start) / bucket)
		if idx < 0 || idx >= n {
			continue
		}
		a := &acc[idx]
		a.samples++
		if h.Frames != nil {
			a.frameN++
			a.p50 += h.Frames.P50MS
			a.p95 += h.Frames.P95MS
		}
		if h.Render != nil {
			a.renderN++
			a.drawCalls += h.Render.DrawCalls
			a.triangles += h.Render.Triangles
		}
	}
	for i, b := range buckets {
		sort.Float64s(durs[i])
		b.Sessions = int32(len(sessions[i]))
		if a := acc[i]; a.samples > 0 {
			b.Samples = int32(a.samples)
			if a.frameN > 0 {
				b.FrameP50Ms = a.p50 / float64(a.frameN)
				b.FrameP95Ms = a.p95 / float64(a.frameN)
			}
			if a.renderN > 0 {
				b.DrawCalls = a.drawCalls / float64(a.renderN)
				b.Triangles = a.triangles / float64(a.renderN)
			}
		}
		b.P50Ms = percentile(durs[i], 0.5)
		b.P95Ms = percentile(durs[i], 0.95)
		if len(durs[i]) > 0 {
			b.MaxMs = durs[i][len(durs[i])-1]
		}
	}
	return &profilev1.HitchSeriesResponse{Buckets: buckets, Systems: systems, BucketSeconds: int32(bucket / time.Second)}
}
