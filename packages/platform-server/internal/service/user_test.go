package service

import (
	"context"
	"math/rand/v2"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"connectrpc.com/connect"
	"google.golang.org/protobuf/proto"
	"google.golang.org/protobuf/types/known/fieldmaskpb"

	userv1 "github.com/cstabnick/lawn-gnome-panic/packages/platform-server/gen/gnome/user/v1"
	"github.com/cstabnick/lawn-gnome-panic/packages/platform-server/gen/gnome/user/v1/userv1connect"
	"github.com/cstabnick/lawn-gnome-panic/packages/platform-server/internal/auth"
	"github.com/cstabnick/lawn-gnome-panic/packages/platform-server/internal/store"
)

// fakeVerifier maps a token to its Keycloak sub.
type fakeVerifier map[string]string

func (f fakeVerifier) Verify(_ context.Context, token string) (auth.Caller, error) {
	sub, ok := f[token]
	if !ok {
		return auth.Caller{}, auth.ErrUnauthenticated
	}
	return auth.Caller{Subject: sub}, nil
}

var testNow = time.Date(2026, 3, 4, 5, 6, 7, 0, time.UTC)

func newSvc() *UserService {
	return NewUserService(store.NewMemory(), fakeVerifier{"t1": "sub-1", "t2": "sub-2"}, Options{
		Now:  func() time.Time { return testNow },
		Rand: rand.New(rand.NewPCG(1, 2)),
	})
}

// req builds a request, with the bearer header set when token is not empty.
func req[T any](m *T, token string) *connect.Request[T] {
	r := connect.NewRequest(m)
	if token != "" {
		r.Header().Set("Authorization", "Bearer "+token)
	}
	return r
}

func mustGetMe(t *testing.T, svc *UserService, token string) *userv1.GetMeResponse {
	t.Helper()
	resp, err := svc.GetMe(context.Background(), req(&userv1.GetMeRequest{}, token))
	if err != nil {
		t.Fatalf("GetMe: %v", err)
	}
	return resp.Msg
}

func wantCode(t *testing.T, err error, want connect.Code) {
	t.Helper()
	if err == nil {
		t.Fatalf("want error code %v, got nil", want)
	}
	if got := connect.CodeOf(err); got != want {
		t.Fatalf("code = %v, want %v (%v)", got, want, err)
	}
}

func testLook() *userv1.GnomeLook {
	return &userv1.GnomeLook{
		HatRgb:    0x112233,
		SkinRgb:   0xF0C8A0,
		CoatRgb:   0x3366FF,
		PantsRgb:  0x224466,
		BootsRgb:  0x111111,
		BeardRgb:  proto.Uint32(0x445566),
		HairRgb:   proto.Uint32(0xAABBCC),
		Freckles:  true,
		Glasses:   true,
		Equipment: map[string]string{"head": "hat-1", "neck": "scarf-2"},
	}
}

func TestGetMeAuth(t *testing.T) {
	svc := newSvc()
	_, err := svc.GetMe(context.Background(), req(&userv1.GetMeRequest{}, ""))
	wantCode(t, err, connect.CodeUnauthenticated)
	_, err = svc.GetMe(context.Background(), req(&userv1.GetMeRequest{}, "nope"))
	wantCode(t, err, connect.CodeUnauthenticated)
}

func TestGetMeCreatesOnce(t *testing.T) {
	svc := newSvc()
	first := mustGetMe(t, svc, "t1")
	if !first.Created {
		t.Fatal("first GetMe: created = false, want true")
	}
	second := mustGetMe(t, svc, "t1")
	if second.Created {
		t.Fatal("second GetMe: created = true, want false")
	}
	if first.Gnome.UserId != second.Gnome.UserId {
		t.Fatalf("UserId changed: %q then %q", first.Gnome.UserId, second.Gnome.UserId)
	}
	if first.Account.State != userv1.AccountState_ACCOUNT_STATE_LINKED {
		t.Fatalf("state = %v, want LINKED", first.Account.State)
	}
	if first.Gnome.Handle == "" || first.Gnome.DisplayName == "" {
		t.Fatalf("new gnome missing name or handle: %+v", first.Gnome)
	}
}

func TestUpdateGnomeThenGetMe(t *testing.T) {
	svc := newSvc()
	mustGetMe(t, svc, "t1")
	look := testLook()
	_, err := svc.UpdateGnome(context.Background(), req(&userv1.UpdateGnomeRequest{
		Gnome:      &userv1.Gnome{DisplayName: "Pip", Look: look},
		UpdateMask: &fieldmaskpb.FieldMask{Paths: []string{"display_name", "look"}},
	}, "t1"))
	if err != nil {
		t.Fatalf("UpdateGnome: %v", err)
	}
	got := mustGetMe(t, svc, "t1").Gnome
	if got.DisplayName != "Pip" {
		t.Fatalf("DisplayName = %q, want Pip", got.DisplayName)
	}
	if !proto.Equal(got.Look, look) {
		t.Fatalf("Look = %v, want %v", got.Look, look)
	}
}

func TestUpdateGnomeRejects(t *testing.T) {
	svc := newSvc()
	mustGetMe(t, svc, "t1")
	ctx := context.Background()
	update := func(paths []string, g *userv1.Gnome) error {
		_, err := svc.UpdateGnome(ctx, req(&userv1.UpdateGnomeRequest{
			Gnome:      g,
			UpdateMask: &fieldmaskpb.FieldMask{Paths: paths},
		}, "t1"))
		return err
	}
	wantCode(t, update(nil, &userv1.Gnome{DisplayName: "Pip"}), connect.CodeInvalidArgument)
	wantCode(t, update([]string{"handle"}, &userv1.Gnome{DisplayName: "Pip"}), connect.CodeInvalidArgument)

	bad := testLook()
	bad.HatRgb = 0x1000000
	wantCode(t, update([]string{"look"}, &userv1.Gnome{Look: bad}), connect.CodeInvalidArgument)

	bad = testLook()
	bad.Equipment = map[string]string{"foot": "boot-1"}
	wantCode(t, update([]string{"look"}, &userv1.Gnome{Look: bad}), connect.CodeInvalidArgument)

	bad = testLook()
	weird := "Bun!"
	bad.HairStyle = &weird
	wantCode(t, update([]string{"look"}, &userv1.Gnome{Look: bad}), connect.CodeInvalidArgument)

	good := testLook()
	bun := "bun"
	good.HairStyle = &bun
	if err := update([]string{"look"}, &userv1.Gnome{Look: good}); err != nil {
		t.Fatalf("hair style bun: %v", err)
	}
}

func TestDeleteRestoreFlow(t *testing.T) {
	svc := newSvc()
	ctx := context.Background()
	me := mustGetMe(t, svc, "t1").Gnome
	id := me.UserId

	_, err := svc.DeleteAccount(ctx, req(&userv1.DeleteAccountRequest{ConfirmHandle: "wrong-handle"}, "t1"))
	wantCode(t, err, connect.CodeInvalidArgument)

	del, err := svc.DeleteAccount(ctx, req(&userv1.DeleteAccountRequest{ConfirmHandle: me.Handle}, "t1"))
	if err != nil {
		t.Fatalf("DeleteAccount: %v", err)
	}
	if want := testNow.Add(7 * 24 * time.Hour); !del.Msg.PurgeAt.AsTime().Equal(want) {
		t.Fatalf("PurgeAt = %v, want %v", del.Msg.PurgeAt.AsTime(), want)
	}

	batch, err := svc.BatchGetGnomes(ctx, req(&userv1.BatchGetGnomesRequest{UserIds: []string{id}}, ""))
	if err != nil {
		t.Fatalf("BatchGetGnomes: %v", err)
	}
	if len(batch.Msg.Gnomes) != 0 {
		t.Fatalf("deleted gnome still returned by BatchGetGnomes")
	}

	_, err = svc.UpdateGnome(ctx, req(&userv1.UpdateGnomeRequest{
		Gnome:      &userv1.Gnome{DisplayName: "Pip"},
		UpdateMask: &fieldmaskpb.FieldMask{Paths: []string{"display_name"}},
	}, "t1"))
	wantCode(t, err, connect.CodeFailedPrecondition)

	back := mustGetMe(t, svc, "t1")
	if back.Account.State != userv1.AccountState_ACCOUNT_STATE_LINKED {
		t.Fatalf("state after sign-in = %v, want LINKED", back.Account.State)
	}
	if back.Gnome.UserId != id {
		t.Fatalf("UserId changed on restore")
	}
	batch, err = svc.BatchGetGnomes(ctx, req(&userv1.BatchGetGnomesRequest{UserIds: []string{id}}, ""))
	if err != nil {
		t.Fatalf("BatchGetGnomes: %v", err)
	}
	if len(batch.Msg.Gnomes) != 1 {
		t.Fatalf("restored gnome not returned, got %d", len(batch.Msg.Gnomes))
	}
}

func TestBatchGetGnomes(t *testing.T) {
	svc := newSvc()
	ctx := context.Background()
	id := mustGetMe(t, svc, "t1").Gnome.UserId

	ids := make([]string, 33)
	for i := range ids {
		ids[i] = id
	}
	_, err := svc.BatchGetGnomes(ctx, req(&userv1.BatchGetGnomesRequest{UserIds: ids}, ""))
	wantCode(t, err, connect.CodeInvalidArgument)

	resp, err := svc.BatchGetGnomes(ctx, req(&userv1.BatchGetGnomesRequest{UserIds: []string{"local-abc", id, id}}, ""))
	if err != nil {
		t.Fatalf("BatchGetGnomes: %v", err)
	}
	if len(resp.Msg.Gnomes) != 1 || resp.Msg.Gnomes[0].UserId != id {
		t.Fatalf("got %v, want one gnome %s", resp.Msg.Gnomes, id)
	}
}

func TestCreateGuestUnimplemented(t *testing.T) {
	_, err := newSvc().CreateGuest(context.Background(), req(&userv1.CreateGuestRequest{}, ""))
	wantCode(t, err, connect.CodeUnimplemented)
}

func TestHTTPGetMe(t *testing.T) {
	mux := http.NewServeMux()
	mux.Handle(userv1connect.NewUserServiceHandler(newSvc()))
	srv := httptest.NewServer(mux)
	defer srv.Close()

	client := userv1connect.NewUserServiceClient(http.DefaultClient, srv.URL, connect.WithProtoJSON())
	r := connect.NewRequest(&userv1.GetMeRequest{})
	r.Header().Set("Authorization", "Bearer t1")
	resp, err := client.GetMe(context.Background(), r)
	if err != nil {
		t.Fatalf("GetMe over HTTP: %v", err)
	}
	if !resp.Msg.Created {
		t.Fatal("created = false, want true")
	}
}
