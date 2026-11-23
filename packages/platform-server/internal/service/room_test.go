package service

import (
	"context"
	"strings"
	"testing"
	"time"

	"connectrpc.com/connect"

	commonv1 "github.com/cstabnick/lawn-gnome-panic/packages/platform-server/gen/gnome/common/v1"
	savev1 "github.com/cstabnick/lawn-gnome-panic/packages/platform-server/gen/gnome/save/v1"
	"github.com/cstabnick/lawn-gnome-panic/packages/platform-server/internal/store"
)

const roomGame = commonv1.Game_GAME_DAYG

func newRoomTest() *RoomSaveService {
	users := NewUserService(store.NewMemory(), fakeVerifier{"t1": "sub-1", "t2": "sub-2", "t3": "sub-3"}, Options{Now: func() time.Time { return testNow }})
	return NewRoomSaveService(users, store.NewMemoryRooms())
}

func createRoom(t *testing.T, svc *RoomSaveService, token string) *savev1.Room {
	t.Helper()
	res, err := svc.CreateRoom(context.Background(), req(&savev1.CreateRoomRequest{Game: roomGame, Title: "  Bottom Lawn  "}, token))
	if err != nil {
		t.Fatalf("CreateRoom: %v", err)
	}
	return res.Msg.Room
}

// hashOf is a placeholder 8-hex part hash; the server does not check it against the bytes.
func hashOf(i int) string {
	return strings.Repeat(string(rune('a'+i)), 8)
}

func uploadParts(t *testing.T, svc *RoomSaveService, token, code, upload string, parts ...[]byte) {
	t.Helper()
	for i, p := range parts {
		_, err := svc.PutRoomSavePart(context.Background(), req(&savev1.PutRoomSavePartRequest{Code: code, UploadId: upload, Index: int32(i), Data: p}, token))
		if err != nil {
			t.Fatalf("PutRoomSavePart %d: %v", i, err)
		}
	}
}

func commit(svc *RoomSaveService, token, code, upload string, base int64, parts ...[]byte) error {
	hashes := make([]string, len(parts))
	var total int64
	for i, p := range parts {
		hashes[i] = hashOf(i)
		total += int64(len(p))
	}
	_, err := svc.CommitRoomSave(context.Background(), req(&savev1.CommitRoomSaveRequest{
		Code: code, BaseRevision: base, UploadId: upload, Tick: 42, PartCount: int32(len(parts)),
		TotalBytes: total, PartHashes: hashes, Summary: "day 3",
	}, token))
	return err
}

func TestRoomCreateAndList(t *testing.T) {
	ctx := context.Background()
	svc := newRoomTest()
	room := createRoom(t, svc, "t1")
	if len(room.Code) != 8 || room.Title != "Bottom Lawn" || room.Game != roomGame || room.Revision != 0 {
		t.Fatalf("room = %+v", room)
	}
	for _, c := range room.Code {
		if !strings.ContainsRune("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", c) {
			t.Fatalf("code %q has %q", room.Code, c)
		}
	}
	if len(room.MemberIds) != 1 || room.MemberIds[0] != room.CreatorId {
		t.Fatalf("members = %v, creator %q", room.MemberIds, room.CreatorId)
	}

	// Bad games and long titles.
	_, err := svc.CreateRoom(ctx, req(&savev1.CreateRoomRequest{Game: commonv1.Game_GAME_UNSPECIFIED, Title: "x"}, "t1"))
	wantCode(t, err, connect.CodeInvalidArgument)
	_, err = svc.CreateRoom(ctx, req(&savev1.CreateRoomRequest{Game: roomGame, Title: strings.Repeat("x", 61)}, "t1"))
	wantCode(t, err, connect.CodeInvalidArgument)

	list, err := svc.ListMyRooms(ctx, req(&savev1.ListMyRoomsRequest{Game: roomGame}, "t1"))
	if err != nil || len(list.Msg.Rooms) != 1 {
		t.Fatalf("ListMyRooms = %v, %v", list, err)
	}
	_, err = svc.ListMyRooms(ctx, req(&savev1.ListMyRoomsRequest{Game: roomGame}, ""))
	wantCode(t, err, connect.CodeUnauthenticated)
}

func TestRoomJoin(t *testing.T) {
	ctx := context.Background()
	svc := newRoomTest()
	room := createRoom(t, svc, "t1")

	// Unknown code.
	_, err := svc.JoinRoom(ctx, req(&savev1.JoinRoomRequest{Code: "NOPE0000"}, "t2"))
	wantCode(t, err, connect.CodeNotFound)

	// Open room: join, then join again is idempotent.
	for i := 0; i < 2; i++ {
		res, err := svc.JoinRoom(ctx, req(&savev1.JoinRoomRequest{Code: room.Code}, "t2"))
		if err != nil {
			t.Fatalf("JoinRoom %d: %v", i, err)
		}
		if len(res.Msg.Room.MemberIds) != 2 {
			t.Fatalf("members after join %d = %v", i, res.Msg.Room.MemberIds)
		}
	}

	// Invite-only: no invite denied, a made invite works once, then it is used up.
	inv, err := svc.UpdateRoom(ctx, req(&savev1.UpdateRoomRequest{Code: room.Code, InviteOnly: boolPtr(true)}, "t1"))
	if err != nil || !inv.Msg.Room.InviteOnly {
		t.Fatalf("UpdateRoom invite-only: %v", err)
	}
	_, err = svc.JoinRoom(ctx, req(&savev1.JoinRoomRequest{Code: room.Code}, "t3"))
	wantCode(t, err, connect.CodePermissionDenied)

	token, err := svc.CreateInvite(ctx, req(&savev1.CreateInviteRequest{Code: room.Code}, "t1"))
	if err != nil {
		t.Fatalf("CreateInvite: %v", err)
	}
	if n := len(token.Msg.Invite); n != 22 {
		t.Fatalf("invite length = %d, want 22", n)
	}
	_, err = svc.JoinRoom(ctx, req(&savev1.JoinRoomRequest{Code: room.Code, Invite: "wrong"}, "t3"))
	wantCode(t, err, connect.CodePermissionDenied)
	_, err = svc.JoinRoom(ctx, req(&savev1.JoinRoomRequest{Code: room.Code, Invite: token.Msg.Invite}, "t3"))
	if err != nil {
		t.Fatalf("JoinRoom with invite: %v", err)
	}
	_, err = svc.JoinRoom(ctx, req(&savev1.JoinRoomRequest{Code: room.Code, Invite: token.Msg.Invite}, "t1"))
	if err != nil {
		t.Fatalf("creator rejoin: %v", err)
	}
}

func TestRoomMembersOnly(t *testing.T) {
	ctx := context.Background()
	svc := newRoomTest()
	room := createRoom(t, svc, "t1")

	// t2 is not a member: member-only RPCs and creator-only RPCs are denied.
	_, err := svc.GetRoomSave(ctx, req(&savev1.GetRoomSaveRequest{Code: room.Code}, "t2"))
	wantCode(t, err, connect.CodePermissionDenied)
	_, err = svc.GetRoomSavePart(ctx, req(&savev1.GetRoomSavePartRequest{Code: room.Code}, "t2"))
	wantCode(t, err, connect.CodePermissionDenied)
	_, err = svc.PutRoomSavePart(ctx, req(&savev1.PutRoomSavePartRequest{Code: room.Code, UploadId: "abcdefghijklmnop", Data: []byte("x")}, "t2"))
	wantCode(t, err, connect.CodePermissionDenied)
	_, err = svc.UpdateRoom(ctx, req(&savev1.UpdateRoomRequest{Code: room.Code, Close: true}, "t2"))
	wantCode(t, err, connect.CodePermissionDenied)
	_, err = svc.CreateInvite(ctx, req(&savev1.CreateInviteRequest{Code: room.Code}, "t2"))
	wantCode(t, err, connect.CodePermissionDenied)

	// Joined as a member, t2 can read but is not the creator.
	if _, err := svc.JoinRoom(ctx, req(&savev1.JoinRoomRequest{Code: room.Code}, "t2")); err != nil {
		t.Fatalf("JoinRoom: %v", err)
	}
	_, err = svc.UpdateRoom(ctx, req(&savev1.UpdateRoomRequest{Code: room.Code, Close: true}, "t2"))
	wantCode(t, err, connect.CodePermissionDenied)
}

func TestRoomUploadCommitRead(t *testing.T) {
	ctx := context.Background()
	svc := newRoomTest()
	room := createRoom(t, svc, "t1")
	code := room.Code
	const upload = "upload-0000000001"
	partA := []byte(strings.Repeat("a", 1000))
	partB := []byte(strings.Repeat("b", 500))

	// No save yet.
	_, err := svc.GetRoomSave(ctx, req(&savev1.GetRoomSaveRequest{Code: code}, "t1"))
	wantCode(t, err, connect.CodeNotFound)

	uploadParts(t, svc, "t1", code, upload, partA, partB)
	if err := commit(svc, "t1", code, upload, 0, partA, partB); err != nil {
		t.Fatalf("CommitRoomSave: %v", err)
	}

	got, err := svc.GetRoomSave(ctx, req(&savev1.GetRoomSaveRequest{Code: code}, "t1"))
	if err != nil {
		t.Fatalf("GetRoomSave: %v", err)
	}
	m := got.Msg.Manifest
	if m.Revision != 1 || m.PartCount != 2 || m.TotalBytes != 1500 || m.HostId != room.CreatorId || m.Tick != 42 || m.Summary != "day 3" {
		t.Fatalf("manifest = %+v", m)
	}

	// Parts read back at the current revision; a stale revision is NOT_FOUND.
	p, err := svc.GetRoomSavePart(ctx, req(&savev1.GetRoomSavePartRequest{Code: code, Revision: 1, Index: 1}, "t1"))
	if err != nil || string(p.Msg.Data) != string(partB) {
		t.Fatalf("GetRoomSavePart = %v, %v", p, err)
	}
	_, err = svc.GetRoomSavePart(ctx, req(&savev1.GetRoomSavePartRequest{Code: code, Revision: 0, Index: 0}, "t1"))
	wantCode(t, err, connect.CodeNotFound)

	// A stale base revision is ABORTED.
	err = commit(svc, "t1", code, upload, 0, partA, partB)
	wantCode(t, err, connect.CodeAborted)

	// A commit with a missing part is INVALID_ARGUMENT.
	err = commit(svc, "t1", code, "upload-0000000002", 1, partA, partB)
	wantCode(t, err, connect.CodeInvalidArgument)

	// A part too big.
	_, err = svc.PutRoomSavePart(ctx, req(&savev1.PutRoomSavePartRequest{Code: code, UploadId: upload, Index: 0, Data: make([]byte, 512*1024+1)}, "t1"))
	wantCode(t, err, connect.CodeInvalidArgument)

	// Bad hashes and upload ids.
	_, err = svc.CommitRoomSave(ctx, req(&savev1.CommitRoomSaveRequest{Code: code, BaseRevision: 1, UploadId: upload, PartCount: 1, PartHashes: []string{"XYZ"}}, "t1"))
	wantCode(t, err, connect.CodeInvalidArgument)
	_, err = svc.PutRoomSavePart(ctx, req(&savev1.PutRoomSavePartRequest{Code: code, UploadId: "short", Index: 0, Data: []byte("x")}, "t1"))
	wantCode(t, err, connect.CodeInvalidArgument)
}

func TestRoomClose(t *testing.T) {
	ctx := context.Background()
	svc := newRoomTest()
	room := createRoom(t, svc, "t1")
	if _, err := svc.JoinRoom(ctx, req(&savev1.JoinRoomRequest{Code: room.Code}, "t2")); err != nil {
		t.Fatalf("JoinRoom: %v", err)
	}
	res, err := svc.UpdateRoom(ctx, req(&savev1.UpdateRoomRequest{Code: room.Code, Close: true}, "t1"))
	if err != nil || !res.Msg.Room.Closed {
		t.Fatalf("UpdateRoom close = %v, %v", res, err)
	}
	_, err = svc.JoinRoom(ctx, req(&savev1.JoinRoomRequest{Code: room.Code}, "t3"))
	wantCode(t, err, connect.CodeFailedPrecondition)
}

func boolPtr(b bool) *bool { return &b }
