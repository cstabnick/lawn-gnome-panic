package service

import (
	"context"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"connectrpc.com/connect"

	commonv1 "github.com/cstabnick/lawn-gnome-panic/packages/platform-server/gen/gnome/common/v1"
	savev1 "github.com/cstabnick/lawn-gnome-panic/packages/platform-server/gen/gnome/save/v1"
	"github.com/cstabnick/lawn-gnome-panic/packages/platform-server/gen/gnome/save/v1/savev1connect"
	userv1 "github.com/cstabnick/lawn-gnome-panic/packages/platform-server/gen/gnome/user/v1"
	"github.com/cstabnick/lawn-gnome-panic/packages/platform-server/internal/store"
)

func newSaveTest() (*UserService, *SaveService) {
	users := NewUserService(store.NewMemory(), fakeVerifier{"t1": "sub-1", "t2": "sub-2"}, Options{Now: func() time.Time { return testNow }})
	return users, NewSaveService(users)
}

func TestSaveService(t *testing.T) {
	ctx := context.Background()
	users, svc := newSaveTest()
	const game = commonv1.Game_GAME_LAWN_GNOME_PANIC

	// No auth.
	_, err := svc.GetSave(ctx, req(&savev1.GetSaveRequest{Game: game}, ""))
	wantCode(t, err, connect.CodeUnauthenticated)

	// Nothing saved yet.
	_, err = svc.GetSave(ctx, req(&savev1.GetSaveRequest{Game: game}, "t1"))
	wantCode(t, err, connect.CodeNotFound)

	// First write.
	put, err := svc.PutSave(ctx, req(&savev1.PutSaveRequest{Game: game, Data: `{"level":1}`, Summary: "Level 1", BaseRevision: 0}, "t1"))
	if err != nil {
		t.Fatalf("PutSave: %v", err)
	}
	if put.Msg.Save.Revision != 1 {
		t.Fatalf("revision = %d, want 1", put.Msg.Save.Revision)
	}

	// Get returns it.
	got, err := svc.GetSave(ctx, req(&savev1.GetSaveRequest{Game: game}, "t1"))
	if err != nil {
		t.Fatalf("GetSave: %v", err)
	}
	s := got.Msg.Save
	if s.Data != `{"level":1}` || s.Summary != "Level 1" || s.Revision != 1 || s.Game != game {
		t.Fatalf("GetSave = %+v", s)
	}
	if !s.UpdatedAt.AsTime().Equal(testNow) {
		t.Fatalf("UpdatedAt = %v, want %v", s.UpdatedAt.AsTime(), testNow)
	}

	// Stale base 0 again.
	_, err = svc.PutSave(ctx, req(&savev1.PutSaveRequest{Game: game, Data: "x", BaseRevision: 0}, "t1"))
	wantCode(t, err, connect.CodeAborted)

	// Correct base 1.
	put, err = svc.PutSave(ctx, req(&savev1.PutSaveRequest{Game: game, Data: `{"level":2}`, Summary: "Level 2", BaseRevision: 1}, "t1"))
	if err != nil {
		t.Fatalf("PutSave base 1: %v", err)
	}
	if put.Msg.Save.Revision != 2 {
		t.Fatalf("revision = %d, want 2", put.Msg.Save.Revision)
	}

	// Invalid games.
	for _, g := range []commonv1.Game{commonv1.Game_GAME_UNSPECIFIED, commonv1.Game(99)} {
		_, err = svc.GetSave(ctx, req(&savev1.GetSaveRequest{Game: g}, "t1"))
		wantCode(t, err, connect.CodeInvalidArgument)
		_, err = svc.PutSave(ctx, req(&savev1.PutSaveRequest{Game: g, Data: "x"}, "t1"))
		wantCode(t, err, connect.CodeInvalidArgument)
	}

	// The newest game id is accepted (and is its own slot).
	put, err = svc.PutSave(ctx, req(&savev1.PutSaveRequest{Game: commonv1.Game_GAME_GNOME_THEFT_AUTO, Data: `{"v":1}`, BaseRevision: 0}, "t1"))
	if err != nil {
		t.Fatalf("PutSave gnome-theft-auto: %v", err)
	}
	if put.Msg.Save.Revision != 1 || put.Msg.Save.Game != commonv1.Game_GAME_GNOME_THEFT_AUTO {
		t.Fatalf("gnome-theft-auto save = %+v", put.Msg.Save)
	}

	// Limits.
	_, err = svc.PutSave(ctx, req(&savev1.PutSaveRequest{Game: game, Data: strings.Repeat("x", MaxSaveBytes+1), BaseRevision: 2}, "t1"))
	wantCode(t, err, connect.CodeInvalidArgument)
	_, err = svc.PutSave(ctx, req(&savev1.PutSaveRequest{Game: game, Data: "x", Summary: strings.Repeat("a", 201), BaseRevision: 2}, "t1"))
	wantCode(t, err, connect.CodeInvalidArgument)
	_, err = svc.PutSave(ctx, req(&savev1.PutSaveRequest{Game: game, Data: "x", BaseRevision: -1}, "t1"))
	wantCode(t, err, connect.CodeInvalidArgument)

	// Another player's save is separate.
	_, err = svc.GetSave(ctx, req(&savev1.GetSaveRequest{Game: game}, "t2"))
	wantCode(t, err, connect.CodeNotFound)
	put, err = svc.PutSave(ctx, req(&savev1.PutSaveRequest{Game: game, Data: "t2", BaseRevision: 0}, "t2"))
	if err != nil {
		t.Fatalf("t2 PutSave: %v", err)
	}
	if put.Msg.Save.Revision != 1 {
		t.Fatalf("t2 revision = %d, want 1", put.Msg.Save.Revision)
	}

	// Deleted account: writes refused.
	me := mustGetMe(t, users, "t1").Gnome
	if _, err := users.DeleteAccount(ctx, req(&userv1.DeleteAccountRequest{ConfirmHandle: me.Handle}, "t1")); err != nil {
		t.Fatalf("DeleteAccount: %v", err)
	}
	_, err = svc.PutSave(ctx, req(&savev1.PutSaveRequest{Game: game, Data: "x", BaseRevision: 2}, "t1"))
	wantCode(t, err, connect.CodeFailedPrecondition)
}

func TestSaveServiceHTTP(t *testing.T) {
	_, svc := newSaveTest()
	mux := http.NewServeMux()
	mux.Handle(savev1connect.NewSaveServiceHandler(svc))
	srv := httptest.NewServer(mux)
	defer srv.Close()

	client := savev1connect.NewSaveServiceClient(http.DefaultClient, srv.URL, connect.WithProtoJSON())
	put := connect.NewRequest(&savev1.PutSaveRequest{Game: commonv1.Game_GAME_GNOMOMIA, Data: `{"a":1}`, Summary: "s"})
	put.Header().Set("Authorization", "Bearer t1")
	if _, err := client.PutSave(context.Background(), put); err != nil {
		t.Fatalf("PutSave over HTTP: %v", err)
	}
	get := connect.NewRequest(&savev1.GetSaveRequest{Game: commonv1.Game_GAME_GNOMOMIA})
	get.Header().Set("Authorization", "Bearer t1")
	resp, err := client.GetSave(context.Background(), get)
	if err != nil {
		t.Fatalf("GetSave over HTTP: %v", err)
	}
	if resp.Msg.Save.Data != `{"a":1}` || resp.Msg.Save.Revision != 1 {
		t.Fatalf("GetSave over HTTP = %+v", resp.Msg.Save)
	}
}
