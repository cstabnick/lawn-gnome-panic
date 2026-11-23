package store

import (
	"context"
	"errors"
	"fmt"
	"slices"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
)

// RoomStore on Postgres. Behaviour and errors match MemoryRooms (room.go); room_test.go runs the same suite on both.

var _ RoomStore = (*Postgres)(nil)

// roomQ is what the room queries need: the pool or a transaction.
type roomQ interface {
	Exec(ctx context.Context, sql string, args ...any) (pgconn.CommandTag, error)
	Query(ctx context.Context, sql string, args ...any) (pgx.Rows, error)
	QueryRow(ctx context.Context, sql string, args ...any) pgx.Row
}

const roomCols = "code, game, title, creator_id, invite_only, closed, revision, tick, host_id, part_count, total_bytes, part_hashes, summary, created_at, updated_at"

func scanRoom(r rowScanner) (Room, error) {
	var (
		rm               Room
		created, updated time.Time
	)
	if err := r.Scan(&rm.Code, &rm.Game, &rm.Title, &rm.CreatorID, &rm.InviteOnly, &rm.Closed, &rm.Revision, &rm.Tick,
		&rm.HostID, &rm.PartCount, &rm.TotalBytes, &rm.PartHashes, &rm.Summary, &created, &updated); err != nil {
		return Room{}, err
	}
	rm.CreatedAt = created.UTC()
	rm.UpdatedAt = updated.UTC()
	return rm, nil
}

// loadMembers fills Members for every room in rs with one query: creator first, then join order.
func loadMembers(ctx context.Context, q roomQ, rs []Room) error {
	if len(rs) == 0 {
		return nil
	}
	codes := make([]string, len(rs))
	for i := range rs {
		codes[i] = rs[i].Code
	}
	rows, err := q.Query(ctx, `SELECT code, user_id FROM room_members WHERE code = ANY($1) ORDER BY joined_at, user_id`, codes)
	if err != nil {
		return fmt.Errorf("room members: %w", err)
	}
	defer rows.Close()
	byCode := map[string][]string{}
	for rows.Next() {
		var code, userID string
		if err := rows.Scan(&code, &userID); err != nil {
			return fmt.Errorf("room members scan: %w", err)
		}
		byCode[code] = append(byCode[code], userID)
	}
	if err := rows.Err(); err != nil {
		return fmt.Errorf("room members: %w", err)
	}
	for i := range rs {
		joined := byCode[rs[i].Code]
		members := make([]string, 0, len(joined))
		if slices.Contains(joined, rs[i].CreatorID) {
			members = append(members, rs[i].CreatorID)
		}
		for _, id := range joined {
			if id != rs[i].CreatorID {
				members = append(members, id)
			}
		}
		rs[i].Members = members
	}
	return nil
}

// roomByCode loads one room with its members. lock takes the row lock (FOR UPDATE) for a transaction.
func roomByCode(ctx context.Context, q roomQ, code string, lock bool) (Room, error) {
	sql := `SELECT ` + roomCols + ` FROM rooms WHERE code = $1`
	if lock {
		sql += ` FOR UPDATE`
	}
	rm, err := scanRoom(q.QueryRow(ctx, sql, code))
	if errors.Is(err, pgx.ErrNoRows) {
		return Room{}, ErrNotFound
	}
	if err != nil {
		return Room{}, fmt.Errorf("get room: %w", err)
	}
	rs := []Room{rm}
	if err := loadMembers(ctx, q, rs); err != nil {
		return Room{}, err
	}
	return rs[0], nil
}

// inRoomTx runs fn in one transaction. Errors from fn are returned unwrapped so errors.Is works.
func (p *Postgres) inRoomTx(ctx context.Context, fn func(tx pgx.Tx) error) error {
	tx, err := p.pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("room tx: begin: %w", err)
	}
	defer tx.Rollback(ctx) // no-op after a successful commit
	if err := fn(tx); err != nil {
		return err
	}
	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("room tx: commit: %w", err)
	}
	return nil
}

func isPGCode(err error, code string) bool {
	var pe *pgconn.PgError
	return errors.As(err, &pe) && pe.Code == code
}

func (p *Postgres) CreateRoom(ctx context.Context, code string, game int32, title, creatorID string, now time.Time) (Room, error) {
	t := now.UTC()
	var out Room
	err := p.inRoomTx(ctx, func(tx pgx.Tx) error {
		rm, err := scanRoom(tx.QueryRow(ctx,
			`INSERT INTO rooms (code, game, title, creator_id, created_at, updated_at)
			 VALUES ($1, $2, $3, $4, $5, $5)
			 ON CONFLICT (code) DO NOTHING
			 RETURNING `+roomCols,
			code, game, title, creatorID, t))
		if errors.Is(err, pgx.ErrNoRows) {
			return ErrConflict // code taken
		}
		if err != nil {
			return fmt.Errorf("create room: %w", err)
		}
		if _, err := tx.Exec(ctx,
			`INSERT INTO room_members (code, user_id, joined_at) VALUES ($1, $2, $3)`, code, creatorID, t); err != nil {
			return fmt.Errorf("create room: creator: %w", err)
		}
		rm.Members = []string{creatorID}
		out = rm
		return nil
	})
	if err != nil {
		return Room{}, err
	}
	return out, nil
}

func (p *Postgres) GetRoom(ctx context.Context, code string) (Room, error) {
	return roomByCode(ctx, p.pool, code, false)
}

func (p *Postgres) AddMember(ctx context.Context, code, userID string, now time.Time) (Room, error) {
	t := now.UTC()
	var out Room
	err := p.inRoomTx(ctx, func(tx pgx.Tx) error {
		rm, err := roomByCode(ctx, tx, code, true)
		if err != nil {
			return err
		}
		if slices.Contains(rm.Members, userID) {
			out = rm
			return nil
		}
		if len(rm.Members) >= MaxRoomMembers {
			return ErrConflict
		}
		if _, err := tx.Exec(ctx,
			`INSERT INTO room_members (code, user_id, joined_at) VALUES ($1, $2, $3)`, code, userID, t); err != nil {
			return fmt.Errorf("add member: %w", err)
		}
		if _, err := tx.Exec(ctx, `UPDATE rooms SET updated_at = $2 WHERE code = $1`, code, t); err != nil {
			return fmt.Errorf("add member: touch: %w", err)
		}
		out, err = roomByCode(ctx, tx, code, false)
		return err
	})
	if err != nil {
		return Room{}, err
	}
	return out, nil
}

func (p *Postgres) RemoveMembers(ctx context.Context, code string, userIDs []string, now time.Time) (Room, error) {
	t := now.UTC()
	var out Room
	err := p.inRoomTx(ctx, func(tx pgx.Tx) error {
		rm, err := roomByCode(ctx, tx, code, true)
		if err != nil {
			return err
		}
		if len(userIDs) > 0 {
			tag, err := tx.Exec(ctx,
				`DELETE FROM room_members WHERE code = $1 AND user_id = ANY($2) AND user_id <> $3`,
				code, userIDs, rm.CreatorID)
			if err != nil {
				return fmt.Errorf("remove members: %w", err)
			}
			if tag.RowsAffected() > 0 {
				if _, err := tx.Exec(ctx, `UPDATE rooms SET updated_at = $2 WHERE code = $1`, code, t); err != nil {
					return fmt.Errorf("remove members: touch: %w", err)
				}
			}
		}
		out, err = roomByCode(ctx, tx, code, false)
		return err
	})
	if err != nil {
		return Room{}, err
	}
	return out, nil
}

func (p *Postgres) SetRoomFlags(ctx context.Context, code string, inviteOnly, closed *bool, now time.Time) (Room, error) {
	var out Room
	err := p.inRoomTx(ctx, func(tx pgx.Tx) error {
		tag, err := tx.Exec(ctx,
			`UPDATE rooms
			   SET invite_only = COALESCE($2::boolean, invite_only),
			       closed      = COALESCE($3::boolean, closed),
			       updated_at  = $4
			 WHERE code = $1`,
			code, inviteOnly, closed, now.UTC())
		if err != nil {
			return fmt.Errorf("set room flags: %w", err)
		}
		if tag.RowsAffected() == 0 {
			return ErrNotFound
		}
		out, err = roomByCode(ctx, tx, code, false)
		return err
	})
	if err != nil {
		return Room{}, err
	}
	return out, nil
}

func (p *Postgres) ListRoomsOf(ctx context.Context, userID string, game int32) ([]Room, error) {
	rows, err := p.pool.Query(ctx,
		`SELECT `+roomCols+` FROM rooms
		  WHERE game = $2 AND code IN (SELECT code FROM room_members WHERE user_id = $1)
		  ORDER BY updated_at DESC, code`,
		userID, game)
	if err != nil {
		return nil, fmt.Errorf("list rooms: %w", err)
	}
	out := []Room{}
	for rows.Next() {
		rm, err := scanRoom(rows)
		if err != nil {
			rows.Close()
			return nil, fmt.Errorf("list rooms scan: %w", err)
		}
		out = append(out, rm)
	}
	rows.Close()
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("list rooms: %w", err)
	}
	if err := loadMembers(ctx, p.pool, out); err != nil {
		return nil, err
	}
	return out, nil
}

func (p *Postgres) PutPart(ctx context.Context, code, uploadID string, index int32, data []byte, now time.Time) error {
	var exists bool
	if err := p.pool.QueryRow(ctx, `SELECT EXISTS (SELECT 1 FROM rooms WHERE code = $1)`, code).Scan(&exists); err != nil {
		return fmt.Errorf("put part: %w", err)
	}
	if !exists {
		return ErrNotFound
	}
	if index < 0 || index >= MaxRoomParts || len(data) > MaxRoomPartBytes {
		return ErrTooBig
	}
	if data == nil {
		data = []byte{}
	}
	_, err := p.pool.Exec(ctx,
		`INSERT INTO room_uploads (code, upload_id, idx, data, created_at) VALUES ($1, $2, $3, $4, $5)
		 ON CONFLICT (code, upload_id, idx) DO UPDATE SET data = EXCLUDED.data, created_at = EXCLUDED.created_at`,
		code, uploadID, index, data, now.UTC())
	if isPGCode(err, "23503") { // the room was removed meanwhile
		return ErrNotFound
	}
	if err != nil {
		return fmt.Errorf("put part: %w", err)
	}
	return nil
}

// stagedParts returns the staged bytes of parts 0..count-1 of an upload, in index order (missing ones are absent).
func stagedParts(ctx context.Context, q roomQ, code, uploadID string, count int32) ([][]byte, error) {
	rows, err := q.Query(ctx,
		`SELECT data FROM room_uploads WHERE code = $1 AND upload_id = $2 AND idx >= 0 AND idx < $3 ORDER BY idx`,
		code, uploadID, count)
	if err != nil {
		return nil, fmt.Errorf("staged parts: %w", err)
	}
	defer rows.Close()
	var out [][]byte
	for rows.Next() {
		var d []byte
		if err := rows.Scan(&d); err != nil {
			return nil, fmt.Errorf("staged parts scan: %w", err)
		}
		out = append(out, d)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("staged parts: %w", err)
	}
	return out, nil
}

func (p *Postgres) CommitSave(ctx context.Context, code string, baseRevision int64, uploadID string, m RoomManifest, now time.Time) (Room, error) {
	t := now.UTC()
	var out Room
	err := p.inRoomTx(ctx, func(tx pgx.Tx) error {
		var rev int64
		err := tx.QueryRow(ctx, `SELECT revision FROM rooms WHERE code = $1 FOR UPDATE`, code).Scan(&rev)
		if errors.Is(err, pgx.ErrNoRows) {
			return ErrNotFound
		}
		if err != nil {
			return fmt.Errorf("commit save: lock: %w", err)
		}
		if baseRevision != rev {
			return ErrConflict
		}
		parts, err := stagedParts(ctx, tx, code, uploadID, m.PartCount)
		if err != nil {
			return err
		}
		if len(parts) != int(m.PartCount) {
			return ErrNotFound
		}
		var staged int64
		for _, d := range parts {
			staged += int64(len(d))
		}
		if m.TotalBytes > MaxRoomBytes || staged != m.TotalBytes {
			return ErrTooBig
		}
		newRev := rev + 1
		for i, d := range parts {
			if _, err := tx.Exec(ctx,
				`INSERT INTO room_parts (code, revision, idx, data) VALUES ($1, $2, $3, $4)`,
				code, newRev, i, d); err != nil {
				return fmt.Errorf("commit save: part %d: %w", i, err)
			}
		}
		if _, err := tx.Exec(ctx, `DELETE FROM room_parts WHERE code = $1 AND revision < $2`, code, newRev); err != nil {
			return fmt.Errorf("commit save: drop old parts: %w", err)
		}
		if _, err := tx.Exec(ctx, `DELETE FROM room_uploads WHERE code = $1 AND upload_id = $2`, code, uploadID); err != nil {
			return fmt.Errorf("commit save: drop staging: %w", err)
		}
		hashes := m.PartHashes
		if hashes == nil {
			hashes = []string{}
		}
		if _, err := tx.Exec(ctx,
			`UPDATE rooms
			   SET revision = $2, tick = $3, host_id = $4, part_count = $5, total_bytes = $6,
			       part_hashes = $7, summary = $8, updated_at = $9
			 WHERE code = $1`,
			code, newRev, m.Tick, m.HostID, m.PartCount, m.TotalBytes, hashes, m.Summary, t); err != nil {
			return fmt.Errorf("commit save: room: %w", err)
		}
		out, err = roomByCode(ctx, tx, code, false)
		return err
	})
	if err != nil {
		return Room{}, err
	}
	return out, nil
}

func (p *Postgres) GetPart(ctx context.Context, code string, revision int64, index int32) ([]byte, error) {
	var data []byte
	err := p.pool.QueryRow(ctx,
		`SELECT p.data FROM room_parts p JOIN rooms r ON r.code = p.code
		  WHERE p.code = $1 AND p.revision = $2 AND p.idx = $3
		    AND r.revision = $2 AND $3 >= 0 AND $3 < r.part_count`,
		code, revision, index).Scan(&data)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get part: %w", err)
	}
	return data, nil
}

func (p *Postgres) CreateInvite(ctx context.Context, code, token string, now time.Time) error {
	var exists bool
	if err := p.pool.QueryRow(ctx, `SELECT EXISTS (SELECT 1 FROM rooms WHERE code = $1)`, code).Scan(&exists); err != nil {
		return fmt.Errorf("create invite: %w", err)
	}
	if !exists {
		return ErrNotFound
	}
	_, err := p.pool.Exec(ctx,
		`INSERT INTO room_invites (code, token, created_at) VALUES ($1, $2, $3)`, code, token, now.UTC())
	if isPGCode(err, "23505") { // token taken
		return ErrConflict
	}
	if isPGCode(err, "23503") { // the room was removed meanwhile
		return ErrNotFound
	}
	if err != nil {
		return fmt.Errorf("create invite: %w", err)
	}
	return nil
}

func (p *Postgres) UseInvite(ctx context.Context, code, token string, _ time.Time) error {
	tag, err := p.pool.Exec(ctx,
		`UPDATE room_invites SET used = true WHERE code = $1 AND token = $2 AND used = false`, code, token)
	if err != nil {
		return fmt.Errorf("use invite: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

func (p *Postgres) PurgeUploads(ctx context.Context, before time.Time) (int, error) {
	tag, err := p.pool.Exec(ctx, `DELETE FROM room_uploads WHERE created_at < $1`, before.UTC())
	if err != nil {
		return 0, fmt.Errorf("purge uploads: %w", err)
	}
	return int(tag.RowsAffected()), nil
}
