package store

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"testing"
	"time"
)

// testRoomStore is the behaviour suite every RoomStore must pass. The Postgres version reuses it.
func testRoomStore(t *testing.T, s RoomStore) {
	ctx := context.Background()
	t0 := time.Now().UTC().Truncate(time.Microsecond)
	at := func(sec int) time.Time { return t0.Add(time.Duration(sec) * time.Second) }
	const game = int32(7)

	mustCreate := func(code, creator string, now time.Time) Room {
		t.Helper()
		r, err := s.CreateRoom(ctx, code, game, "Bottom Lawn", creator, now)
		if err != nil {
			t.Fatalf("CreateRoom(%s): %v", code, err)
		}
		return r
	}
	part := func(n int, fill byte) []byte { return bytes.Repeat([]byte{fill}, n) }

	// stage puts parts 0..len(parts)-1 of uploadID into the room.
	stage := func(code, upload string, parts ...[]byte) {
		t.Helper()
		for i, p := range parts {
			if err := s.PutPart(ctx, code, upload, int32(i), p, at(0)); err != nil {
				t.Fatalf("PutPart(%d): %v", i, err)
			}
		}
	}
	manifest := func(parts ...[]byte) RoomManifest {
		var total int64
		for _, p := range parts {
			total += int64(len(p))
		}
		return RoomManifest{Tick: 10, HostID: "u_host", PartCount: int32(len(parts)), TotalBytes: total, PartHashes: []string{"h0"}, Summary: "day 3"}
	}

	t.Run("create and get", func(t *testing.T) {
		r := mustCreate("AAAA1111", "u_creator", at(1))
		if r.Code != "AAAA1111" || r.Game != game || r.Title != "Bottom Lawn" || r.Revision != 0 {
			t.Fatalf("created room = %+v", r)
		}
		if len(r.Members) != 1 || r.Members[0] != "u_creator" || r.InviteOnly || r.Closed {
			t.Fatalf("creator not first member or flags set: %+v", r)
		}
		if _, err := s.CreateRoom(ctx, "AAAA1111", game, "x", "u_other", at(2)); !errors.Is(err, ErrConflict) {
			t.Fatalf("duplicate code err = %v, want ErrConflict", err)
		}
		got, err := s.GetRoom(ctx, "AAAA1111")
		if err != nil || got.CreatorID != "u_creator" {
			t.Fatalf("GetRoom = %+v, %v", got, err)
		}
		if _, err := s.GetRoom(ctx, "NOPE0000"); !errors.Is(err, ErrNotFound) {
			t.Fatalf("GetRoom unknown err = %v, want ErrNotFound", err)
		}
	})

	t.Run("returned rooms are copies", func(t *testing.T) {
		mustCreate("COPY0001", "u_creator", at(1))
		r, _ := s.GetRoom(ctx, "COPY0001")
		r.Members[0] = "u_hacked"
		again, _ := s.GetRoom(ctx, "COPY0001")
		if again.Members[0] != "u_creator" {
			t.Fatalf("caller changed the store through a returned room: %+v", again)
		}
	})

	t.Run("add member is idempotent and capped", func(t *testing.T) {
		mustCreate("MEMB0001", "u_creator", at(1))
		r, err := s.AddMember(ctx, "MEMB0001", "u_b", at(2))
		if err != nil || len(r.Members) != 2 || r.Members[1] != "u_b" {
			t.Fatalf("AddMember = %+v, %v", r, err)
		}
		r, err = s.AddMember(ctx, "MEMB0001", "u_b", at(3))
		if err != nil || len(r.Members) != 2 {
			t.Fatalf("second AddMember = %+v, %v (want idempotent)", r, err)
		}
		if _, err := s.AddMember(ctx, "NOPE0000", "u_b", at(3)); !errors.Is(err, ErrNotFound) {
			t.Fatalf("AddMember unknown room err = %v", err)
		}
		mustCreate("MEMB0002", "u_creator", at(1))
		for i := 1; i < MaxRoomMembers; i++ {
			if _, err := s.AddMember(ctx, "MEMB0002", fmt.Sprintf("u_%d", i), at(4)); err != nil {
				t.Fatalf("AddMember %d: %v", i, err)
			}
		}
		if _, err := s.AddMember(ctx, "MEMB0002", "u_extra", at(5)); !errors.Is(err, ErrConflict) {
			t.Fatalf("AddMember at cap err = %v, want ErrConflict", err)
		}
	})

	t.Run("remove members never removes the creator", func(t *testing.T) {
		mustCreate("REMV0001", "u_creator", at(1))
		s.AddMember(ctx, "REMV0001", "u_b", at(2))
		s.AddMember(ctx, "REMV0001", "u_c", at(2))
		r, err := s.RemoveMembers(ctx, "REMV0001", []string{"u_creator", "u_b", "u_zzz"}, at(3))
		if err != nil {
			t.Fatalf("RemoveMembers: %v", err)
		}
		if len(r.Members) != 2 || r.Members[0] != "u_creator" || r.Members[1] != "u_c" {
			t.Fatalf("members = %v, want [u_creator u_c]", r.Members)
		}
		if _, err := s.RemoveMembers(ctx, "NOPE0000", nil, at(3)); !errors.Is(err, ErrNotFound) {
			t.Fatalf("RemoveMembers unknown room err = %v", err)
		}
	})

	t.Run("set room flags, nil means unchanged", func(t *testing.T) {
		mustCreate("FLAG0001", "u_creator", at(1))
		yes, no := true, false
		r, err := s.SetRoomFlags(ctx, "FLAG0001", &yes, nil, at(2))
		if err != nil || !r.InviteOnly || r.Closed {
			t.Fatalf("SetRoomFlags invite = %+v, %v", r, err)
		}
		r, err = s.SetRoomFlags(ctx, "FLAG0001", nil, &yes, at(3))
		if err != nil || !r.InviteOnly || !r.Closed {
			t.Fatalf("SetRoomFlags closed = %+v, %v", r, err)
		}
		r, err = s.SetRoomFlags(ctx, "FLAG0001", &no, nil, at(4))
		if err != nil || r.InviteOnly || !r.Closed {
			t.Fatalf("SetRoomFlags back = %+v, %v", r, err)
		}
		if _, err := s.SetRoomFlags(ctx, "NOPE0000", &yes, nil, at(5)); !errors.Is(err, ErrNotFound) {
			t.Fatalf("SetRoomFlags unknown err = %v", err)
		}
	})

	t.Run("list rooms of a user, newest first, game filtered", func(t *testing.T) {
		mustCreate("LIST0001", "u_lister", at(10))
		mustCreate("LIST0002", "u_lister", at(20))
		mustCreate("LIST0003", "u_other", at(30))
		if _, err := s.CreateRoom(ctx, "LIST0004", game+1, "other game", "u_lister", at(40)); err != nil {
			t.Fatal(err)
		}
		rs, err := s.ListRoomsOf(ctx, "u_lister", game)
		if err != nil {
			t.Fatalf("ListRoomsOf: %v", err)
		}
		if len(rs) != 2 || rs[0].Code != "LIST0002" || rs[1].Code != "LIST0001" {
			t.Fatalf("ListRoomsOf = %v, want LIST0002 then LIST0001", codesOf(rs))
		}
		s.AddMember(ctx, "LIST0001", "u_joiner", at(50))
		rs, _ = s.ListRoomsOf(ctx, "u_joiner", game)
		if len(rs) != 1 || rs[0].Code != "LIST0001" {
			t.Fatalf("joiner rooms = %v, want [LIST0001]", codesOf(rs))
		}
		rs, err = s.ListRoomsOf(ctx, "u_nobody", game)
		if err != nil || len(rs) != 0 {
			t.Fatalf("empty list = %v, %v", codesOf(rs), err)
		}
	})

	t.Run("put part is bounded", func(t *testing.T) {
		mustCreate("PART0001", "u_creator", at(1))
		if err := s.PutPart(ctx, "NOPE0000", "up", 0, part(1, 1), at(1)); !errors.Is(err, ErrNotFound) {
			t.Fatalf("PutPart unknown room err = %v", err)
		}
		if err := s.PutPart(ctx, "PART0001", "up", MaxRoomParts, part(1, 1), at(1)); !errors.Is(err, ErrTooBig) {
			t.Fatalf("PutPart index %d err = %v, want ErrTooBig", MaxRoomParts, err)
		}
		if err := s.PutPart(ctx, "PART0001", "up", -1, part(1, 1), at(1)); !errors.Is(err, ErrTooBig) {
			t.Fatalf("PutPart index -1 err = %v, want ErrTooBig", err)
		}
		if err := s.PutPart(ctx, "PART0001", "up", 0, part(MaxRoomPartBytes+1, 1), at(1)); !errors.Is(err, ErrTooBig) {
			t.Fatalf("PutPart oversize err = %v, want ErrTooBig", err)
		}
		if err := s.PutPart(ctx, "PART0001", "up", 0, part(MaxRoomPartBytes, 1), at(1)); err != nil {
			t.Fatalf("PutPart at limit: %v", err)
		}
	})

	t.Run("commit save: revision, conflict, missing and size checks", func(t *testing.T) {
		mustCreate("COMM0001", "u_creator", at(1))
		a, b := part(100, 'a'), part(50, 'b')
		stage("COMM0001", "up1", a, b)

		if _, err := s.CommitSave(ctx, "COMM0001", 5, "up1", manifest(a, b), at(2)); !errors.Is(err, ErrConflict) {
			t.Fatalf("stale base err = %v, want ErrConflict", err)
		}
		if _, err := s.CommitSave(ctx, "COMM0001", 0, "missing", manifest(a, b), at(2)); !errors.Is(err, ErrNotFound) {
			t.Fatalf("no staged parts err = %v, want ErrNotFound", err)
		}
		bad := manifest(a, b)
		bad.TotalBytes++
		if _, err := s.CommitSave(ctx, "COMM0001", 0, "up1", bad, at(2)); !errors.Is(err, ErrTooBig) {
			t.Fatalf("wrong total err = %v, want ErrTooBig", err)
		}
		huge := manifest(a, b)
		huge.TotalBytes = MaxRoomBytes + 1
		if _, err := s.CommitSave(ctx, "COMM0001", 0, "up1", huge, at(2)); !errors.Is(err, ErrTooBig) {
			t.Fatalf("over MaxRoomBytes err = %v, want ErrTooBig", err)
		}
		if _, err := s.CommitSave(ctx, "NOPE0000", 0, "up1", manifest(a, b), at(2)); !errors.Is(err, ErrNotFound) {
			t.Fatalf("unknown room err = %v", err)
		}

		r, err := s.CommitSave(ctx, "COMM0001", 0, "up1", manifest(a, b), at(3))
		if err != nil {
			t.Fatalf("CommitSave: %v", err)
		}
		if r.Revision != 1 || r.Tick != 10 || r.HostID != "u_host" || r.PartCount != 2 || r.TotalBytes != 150 ||
			r.Summary != "day 3" || len(r.PartHashes) != 1 || !r.UpdatedAt.Equal(at(3)) {
			t.Fatalf("committed room = %+v", r)
		}
		if _, err := s.CommitSave(ctx, "COMM0001", 0, "up1", manifest(a, b), at(4)); !errors.Is(err, ErrConflict) {
			t.Fatalf("replay on same base err = %v, want ErrConflict", err)
		}
	})

	t.Run("get part serves only the current revision", func(t *testing.T) {
		mustCreate("GETP0001", "u_creator", at(1))
		a, b := part(10, 'a'), part(20, 'b')
		stage("GETP0001", "up1", a, b)
		if _, err := s.GetPart(ctx, "GETP0001", 0, 0); !errors.Is(err, ErrNotFound) {
			t.Fatalf("GetPart before any save err = %v, want ErrNotFound", err)
		}
		if _, err := s.CommitSave(ctx, "GETP0001", 0, "up1", manifest(a, b), at(2)); err != nil {
			t.Fatal(err)
		}
		got, err := s.GetPart(ctx, "GETP0001", 1, 1)
		if err != nil || !bytes.Equal(got, b) {
			t.Fatalf("GetPart(1,1) = %d bytes, %v", len(got), err)
		}
		got[0] = 'z'
		again, _ := s.GetPart(ctx, "GETP0001", 1, 1)
		if !bytes.Equal(again, b) {
			t.Fatalf("GetPart returned a slice that aliases the store")
		}
		if _, err := s.GetPart(ctx, "GETP0001", 0, 0); !errors.Is(err, ErrNotFound) {
			t.Fatalf("old revision err = %v, want ErrNotFound", err)
		}
		if _, err := s.GetPart(ctx, "GETP0001", 1, 2); !errors.Is(err, ErrNotFound) {
			t.Fatalf("index past PartCount err = %v, want ErrNotFound", err)
		}
	})

	t.Run("a new commit replaces the previous parts and drops this upload's staging", func(t *testing.T) {
		mustCreate("REPL0001", "u_creator", at(1))
		a := part(10, 'a')
		stage("REPL0001", "up1", a)
		if _, err := s.CommitSave(ctx, "REPL0001", 0, "up1", manifest(a), at(2)); err != nil {
			t.Fatal(err)
		}
		c := part(30, 'c')
		stage("REPL0001", "up2", c)
		if _, err := s.CommitSave(ctx, "REPL0001", 1, "up2", manifest(c), at(3)); err != nil {
			t.Fatal(err)
		}
		got, err := s.GetPart(ctx, "REPL0001", 2, 0)
		if err != nil || !bytes.Equal(got, c) {
			t.Fatalf("revision 2 part = %d bytes, %v", len(got), err)
		}
		if _, err := s.CommitSave(ctx, "REPL0001", 2, "up1", manifest(a), at(4)); !errors.Is(err, ErrNotFound) {
			t.Fatalf("committing an already-used upload err = %v, want ErrNotFound", err)
		}
	})

	t.Run("invites are single use and bound to a room", func(t *testing.T) {
		mustCreate("INVI0001", "u_creator", at(1))
		mustCreate("INVI0002", "u_creator", at(1))
		if err := s.CreateInvite(ctx, "NOPE0000", "tok-x", at(2)); !errors.Is(err, ErrNotFound) {
			t.Fatalf("CreateInvite unknown room err = %v", err)
		}
		if err := s.CreateInvite(ctx, "INVI0001", "tok-1", at(2)); err != nil {
			t.Fatalf("CreateInvite: %v", err)
		}
		if err := s.UseInvite(ctx, "INVI0002", "tok-1", at(3)); !errors.Is(err, ErrNotFound) {
			t.Fatalf("wrong room err = %v, want ErrNotFound", err)
		}
		if err := s.UseInvite(ctx, "INVI0001", "tok-1", at(3)); err != nil {
			t.Fatalf("UseInvite: %v", err)
		}
		if err := s.UseInvite(ctx, "INVI0001", "tok-1", at(4)); !errors.Is(err, ErrNotFound) {
			t.Fatalf("second use err = %v, want ErrNotFound", err)
		}
		if err := s.UseInvite(ctx, "INVI0001", "tok-unknown", at(4)); !errors.Is(err, ErrNotFound) {
			t.Fatalf("unknown token err = %v, want ErrNotFound", err)
		}
	})

	t.Run("purge drops staged parts older than the cut-off", func(t *testing.T) {
		mustCreate("PURG0001", "u_creator", at(1))
		// Clear staging left by the subtests above (the store is shared), then count only this one's.
		if _, err := s.PurgeUploads(ctx, at(50)); err != nil {
			t.Fatal(err)
		}
		if err := s.PutPart(ctx, "PURG0001", "old", 0, part(5, 'o'), at(10)); err != nil {
			t.Fatal(err)
		}
		if err := s.PutPart(ctx, "PURG0001", "old", 1, part(5, 'o'), at(10)); err != nil {
			t.Fatal(err)
		}
		if err := s.PutPart(ctx, "PURG0001", "new", 0, part(5, 'n'), at(100)); err != nil {
			t.Fatal(err)
		}
		n, err := s.PurgeUploads(ctx, at(50))
		if err != nil || n != 2 {
			t.Fatalf("PurgeUploads = %d, %v; want 2", n, err)
		}
		if _, err := s.CommitSave(ctx, "PURG0001", 0, "new", manifest(part(5, 'n')), at(101)); err != nil {
			t.Fatalf("recent staging was purged: %v", err)
		}
	})
}

func codesOf(rs []Room) []string {
	out := make([]string, 0, len(rs))
	for _, r := range rs {
		out = append(out, r.Code)
	}
	return out
}

func TestMemoryRooms(t *testing.T) {
	testRoomStore(t, NewMemoryRooms())
}
