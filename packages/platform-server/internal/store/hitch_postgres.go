package store

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
)

var _ HitchStore = (*Postgres)(nil)

const hitchSessionCols = "session_id, game, build, device, threshold_ms, started_at, last_seen, hitch_count, worst_ms, total_ms"

func scanHitchSession(r pgx.Row) (HitchSessionSummary, error) {
	var s HitchSessionSummary
	var device []byte
	if err := r.Scan(&s.SessionID, &s.Game, &s.Build, &device, &s.ThresholdMS, &s.StartedAt, &s.LastSeen, &s.HitchCount, &s.WorstMS, &s.TotalMS); err != nil {
		return s, err
	}
	s.StartedAt, s.LastSeen = s.StartedAt.UTC(), s.LastSeen.UTC()
	_ = json.Unmarshal(device, &s.Device)
	return s, nil
}

func scanHitches(rows pgx.Rows) ([]Hitch, error) {
	defer rows.Close()
	var out []Hitch
	for rows.Next() {
		var h Hitch
		var ctxJSON, spansJSON []byte
		if err := rows.Scan(&h.SessionID, &h.Game, &h.Kind, &h.AtMS, &h.DurationMS, &h.OccurredAt, &ctxJSON, &spansJSON); err != nil {
			return nil, err
		}
		h.OccurredAt = h.OccurredAt.UTC()
		_ = json.Unmarshal(ctxJSON, &h.Context)
		_ = json.Unmarshal(spansJSON, &h.Spans)
		out = append(out, h)
	}
	return out, rows.Err()
}

const hitchCols = "session_id, game, kind, at_ms, duration_ms, occurred_at, context, spans"

func (p *Postgres) AddHitches(ctx context.Context, s HitchSession, hs []Hitch, now time.Time) (int, error) {
	device, err := json.Marshal(s.Device)
	if err != nil {
		return 0, err
	}
	tx, err := p.pool.Begin(ctx)
	if err != nil {
		return 0, fmt.Errorf("add hitches: begin: %w", err)
	}
	defer func() { _ = tx.Rollback(ctx) }()
	// The upsert locks the session row, so concurrent batches of one session respect the cap.
	var count int
	err = tx.QueryRow(ctx, `INSERT INTO hitch_sessions (session_id, game, build, device, threshold_ms, started_at, last_seen)
		VALUES ($1, $2, $3, $4, $5, $6, $6)
		ON CONFLICT (session_id) DO UPDATE SET game = EXCLUDED.game, build = EXCLUDED.build, device = EXCLUDED.device,
			threshold_ms = EXCLUDED.threshold_ms, last_seen = EXCLUDED.last_seen
		RETURNING hitch_count`, s.SessionID, s.Game, s.Build, device, s.ThresholdMS, now).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("add hitches: session: %w", err)
	}
	room := MaxHitchesPerSession - count
	if room < len(hs) {
		hs = hs[:max(room, 0)]
	}
	if len(hs) == 0 {
		return 0, tx.Commit(ctx)
	}
	var worst, total float64
	batch := &pgx.Batch{}
	for _, h := range hs {
		c := h.Context
		if c == nil {
			c = map[string]string{}
		}
		sp := h.Spans
		if sp == nil {
			sp = []HitchSpan{}
		}
		cj, _ := json.Marshal(c)
		sj, _ := json.Marshal(sp)
		batch.Queue(`INSERT INTO hitches (`+hitchCols+`) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
			s.SessionID, s.Game, h.Kind, h.AtMS, h.DurationMS, h.OccurredAt, cj, sj)
		total += h.DurationMS
		worst = max(worst, h.DurationMS)
	}
	if err := tx.SendBatch(ctx, batch).Close(); err != nil {
		return 0, fmt.Errorf("add hitches: insert: %w", err)
	}
	if _, err := tx.Exec(ctx, `UPDATE hitch_sessions SET hitch_count = hitch_count + $2, worst_ms = GREATEST(worst_ms, $3),
		total_ms = total_ms + $4 WHERE session_id = $1`, s.SessionID, len(hs), worst, total); err != nil {
		return 0, fmt.Errorf("add hitches: totals: %w", err)
	}
	if err := tx.Commit(ctx); err != nil {
		return 0, fmt.Errorf("add hitches: commit: %w", err)
	}
	return len(hs), nil
}

func (p *Postgres) ListHitchSessions(ctx context.Context, game string, since time.Time, limit int) ([]HitchSessionSummary, []string, error) {
	rows, err := p.pool.Query(ctx, `SELECT `+hitchSessionCols+` FROM hitch_sessions
		WHERE last_seen >= $1 AND ($2 = '' OR game = $2) ORDER BY worst_ms DESC, session_id LIMIT $3`, since, game, limit)
	if err != nil {
		return nil, nil, fmt.Errorf("list hitch sessions: %w", err)
	}
	var out []HitchSessionSummary
	for rows.Next() {
		s, err := scanHitchSession(rows)
		if err != nil {
			rows.Close()
			return nil, nil, err
		}
		out = append(out, s)
	}
	rows.Close()
	if err := rows.Err(); err != nil {
		return nil, nil, err
	}
	gameRows, err := p.pool.Query(ctx, `SELECT DISTINCT game FROM hitch_sessions WHERE last_seen >= $1 ORDER BY game`, since)
	if err != nil {
		return nil, nil, fmt.Errorf("list hitch games: %w", err)
	}
	games, err := pgx.CollectRows(gameRows, pgx.RowTo[string])
	if err != nil {
		return nil, nil, err
	}
	if games == nil {
		games = []string{}
	}
	return out, games, nil
}

func (p *Postgres) GetHitchSession(ctx context.Context, id string) (HitchSessionSummary, []Hitch, error) {
	s, err := scanHitchSession(p.pool.QueryRow(ctx, `SELECT `+hitchSessionCols+` FROM hitch_sessions WHERE session_id = $1`, id))
	if errors.Is(err, pgx.ErrNoRows) {
		return s, nil, ErrNotFound
	}
	if err != nil {
		return s, nil, fmt.Errorf("get hitch session: %w", err)
	}
	rows, err := p.pool.Query(ctx, `SELECT `+hitchCols+` FROM hitches WHERE session_id = $1 ORDER BY at_ms, id`, id)
	if err != nil {
		return s, nil, fmt.Errorf("get hitches: %w", err)
	}
	hs, err := scanHitches(rows)
	return s, hs, err
}

func (p *Postgres) QueryHitches(ctx context.Context, game string, since, until time.Time, limit int) ([]Hitch, error) {
	rows, err := p.pool.Query(ctx, `SELECT `+hitchCols+` FROM hitches
		WHERE occurred_at >= $1 AND occurred_at < $2 AND ($3 = '' OR game = $3) ORDER BY occurred_at, id LIMIT $4`, since, until, game, limit)
	if err != nil {
		return nil, fmt.Errorf("query hitches: %w", err)
	}
	return scanHitches(rows)
}

func (p *Postgres) PurgeHitches(ctx context.Context, before time.Time) (int64, error) {
	tag, err := p.pool.Exec(ctx, `DELETE FROM hitch_sessions WHERE last_seen < $1`, before)
	if err != nil {
		return 0, fmt.Errorf("purge hitches: %w", err)
	}
	return tag.RowsAffected(), nil
}
