// Package service implements gnome.user.v1.UserService on top of a store.Store and an auth.Verifier.
package service

import (
	"context"
	"errors"
	"log/slog"
	"math/rand/v2"
	"net/http"
	"sync"
	"time"

	"connectrpc.com/connect"
	"google.golang.org/protobuf/encoding/protojson"
	"google.golang.org/protobuf/types/known/timestamppb"

	userv1 "github.com/cstabnick/lawn-gnome-panic/packages/platform-server/gen/gnome/user/v1"
	"github.com/cstabnick/lawn-gnome-panic/packages/platform-server/gen/gnome/user/v1/userv1connect"
	"github.com/cstabnick/lawn-gnome-panic/packages/platform-server/internal/auth"
	"github.com/cstabnick/lawn-gnome-panic/packages/platform-server/internal/names"
	"github.com/cstabnick/lawn-gnome-panic/packages/platform-server/internal/store"
)

// Options tune the service; zero values get the defaults.
type Options struct {
	// Now is the clock. Default time.Now.
	Now func() time.Time
	// Rand makes default names and handles. Default: seeded from crypto randomness.
	Rand *rand.Rand
	// DeleteGrace is how long a deleted account can still be restored by signing in. Default 7 days.
	DeleteGrace time.Duration
}

// UserService implements userv1connect.UserServiceHandler. CreateGuest and VerifyToken come from
// the embedded UnimplementedUserServiceHandler (CodeUnimplemented) on purpose.
type UserService struct {
	userv1connect.UnimplementedUserServiceHandler
	store store.Store
	auth  auth.Verifier
	opts  Options
	// randMu guards opts.Rand: *rand.Rand is not safe for concurrent use.
	randMu sync.Mutex
}

var _ userv1connect.UserServiceHandler = (*UserService)(nil)

func NewUserService(st store.Store, v auth.Verifier, opts Options) *UserService {
	if opts.Now == nil {
		opts.Now = time.Now
	}
	if opts.Rand == nil {
		opts.Rand = rand.New(rand.NewPCG(rand.Uint64(), rand.Uint64()))
	}
	if opts.DeleteGrace == 0 {
		opts.DeleteGrace = 7 * 24 * time.Hour
	}
	return &UserService{store: st, auth: v, opts: opts}
}

// caller returns the signed-in player, or CodeUnauthenticated.
func (s *UserService) caller(ctx context.Context, header http.Header) (auth.Caller, error) {
	token, ok := auth.BearerToken(header)
	if !ok {
		return auth.Caller{}, connect.NewError(connect.CodeUnauthenticated, errors.New("sign in first"))
	}
	c, err := s.auth.Verify(ctx, token)
	if err != nil {
		return auth.Caller{}, connect.NewError(connect.CodeUnauthenticated, errors.New("sign-in expired or invalid"))
	}
	return c, nil
}

// account returns the caller's account, creating it on first sight.
func (s *UserService) account(ctx context.Context, c auth.Caller) (store.Account, bool, error) {
	s.randMu.Lock()
	displayName := names.RandomName(s.opts.Rand)
	s.randMu.Unlock()
	newHandle := func() string {
		s.randMu.Lock()
		defer s.randMu.Unlock()
		return names.RandomHandle(s.opts.Rand)
	}
	return s.store.GetOrCreateByKeycloakSub(ctx, c.Subject, displayName, newHandle, s.opts.Now())
}

// internalErr logs the real error and returns the generic one for the client.
func internalErr(err error) error {
	slog.Error("user service", "error", err)
	return connect.NewError(connect.CodeInternal, errors.New("internal error"))
}

// toGnome converts a stored account to the public gnome.
func toGnome(a store.Account) (*userv1.Gnome, error) {
	g := &userv1.Gnome{
		UserId:      a.UserID,
		DisplayName: a.DisplayName,
		Handle:      a.Handle,
		CreatedAt:   timestamppb.New(a.CreatedAt),
	}
	if a.LookJSON != nil {
		look := &userv1.GnomeLook{}
		if err := protojson.Unmarshal(a.LookJSON, look); err != nil {
			return nil, err
		}
		g.Look = look
	}
	return g, nil
}

// toAccount converts a stored account to the caller's private account view.
func toAccount(a store.Account) *userv1.Account {
	acc := &userv1.Account{UserId: a.UserID, CreatedAt: timestamppb.New(a.CreatedAt)}
	switch a.State {
	case store.StateLinked:
		acc.State = userv1.AccountState_ACCOUNT_STATE_LINKED
	case store.StatePendingDeletion:
		acc.State = userv1.AccountState_ACCOUNT_STATE_PENDING_DELETION
	}
	if a.PurgeAt != nil {
		acc.PurgeAt = timestamppb.New(*a.PurgeAt)
	}
	return acc
}

// validateLook checks colours are 0xRRGGBB and equipment uses known slots with sane ids.
func validateLook(l *userv1.GnomeLook) error {
	const maxRGB = 0xFFFFFF
	rgbs := []uint32{l.HatRgb, l.SkinRgb, l.CoatRgb, l.PantsRgb, l.BootsRgb}
	if l.BeardRgb != nil {
		rgbs = append(rgbs, *l.BeardRgb)
	}
	if l.HairRgb != nil {
		rgbs = append(rgbs, *l.HairRgb)
	}
	for _, c := range rgbs {
		if c > maxRGB {
			return errors.New("invalid look")
		}
	}
	for slot, id := range l.Equipment {
		switch slot {
		case "head", "back", "neck", "hand":
		default:
			return errors.New("invalid look")
		}
		if len(id) < 1 || len(id) > 64 {
			return errors.New("invalid look")
		}
	}
	return nil
}

func (s *UserService) GetMe(ctx context.Context, req *connect.Request[userv1.GetMeRequest]) (*connect.Response[userv1.GetMeResponse], error) {
	c, err := s.caller(ctx, req.Header())
	if err != nil {
		return nil, err
	}
	a, created, err := s.account(ctx, c)
	if err != nil {
		return nil, internalErr(err)
	}
	if a.State == store.StatePendingDeletion {
		if a, err = s.store.Restore(ctx, a.UserID); err != nil {
			return nil, internalErr(err)
		}
	}
	g, err := toGnome(a)
	if err != nil {
		return nil, internalErr(err)
	}
	return connect.NewResponse(&userv1.GetMeResponse{Gnome: g, Account: toAccount(a), Created: created}), nil
}

func (s *UserService) UpdateGnome(ctx context.Context, req *connect.Request[userv1.UpdateGnomeRequest]) (*connect.Response[userv1.UpdateGnomeResponse], error) {
	c, err := s.caller(ctx, req.Header())
	if err != nil {
		return nil, err
	}
	a, _, err := s.account(ctx, c)
	if err != nil {
		return nil, internalErr(err)
	}
	if a.State == store.StatePendingDeletion {
		return nil, connect.NewError(connect.CodeFailedPrecondition, errors.New("account is being deleted"))
	}

	paths := req.Msg.GetUpdateMask().GetPaths()
	if len(paths) == 0 {
		return nil, connect.NewError(connect.CodeInvalidArgument, errors.New("update_mask is required"))
	}
	setName, setLook := false, false
	for _, p := range paths {
		switch p {
		case "display_name":
			setName = true
		case "look":
			setLook = true
		default:
			return nil, connect.NewError(connect.CodeInvalidArgument, errors.New("cannot update "+p))
		}
	}
	gnome := req.Msg.GetGnome()
	if gnome == nil {
		return nil, connect.NewError(connect.CodeInvalidArgument, errors.New("gnome is required"))
	}

	var displayName *string
	if setName {
		name, err := names.Check(gnome.DisplayName)
		if err != nil {
			return nil, connect.NewError(connect.CodeInvalidArgument, err)
		}
		displayName = &name
	}
	var lookJSON []byte
	if setLook {
		if gnome.Look == nil {
			return nil, connect.NewError(connect.CodeInvalidArgument, errors.New("look is required"))
		}
		if err := validateLook(gnome.Look); err != nil {
			return nil, connect.NewError(connect.CodeInvalidArgument, err)
		}
		lookJSON, err = protojson.Marshal(gnome.Look)
		if err != nil {
			return nil, internalErr(err)
		}
	}

	updated, err := s.store.UpdateProfile(ctx, a.UserID, displayName, lookJSON)
	if err != nil {
		return nil, internalErr(err)
	}
	g, err := toGnome(updated)
	if err != nil {
		return nil, internalErr(err)
	}
	return connect.NewResponse(&userv1.UpdateGnomeResponse{Gnome: g}), nil
}

func (s *UserService) DeleteAccount(ctx context.Context, req *connect.Request[userv1.DeleteAccountRequest]) (*connect.Response[userv1.DeleteAccountResponse], error) {
	c, err := s.caller(ctx, req.Header())
	if err != nil {
		return nil, err
	}
	a, _, err := s.account(ctx, c)
	if err != nil {
		return nil, internalErr(err)
	}
	if req.Msg.ConfirmHandle != a.Handle {
		return nil, connect.NewError(connect.CodeInvalidArgument, errors.New("confirm_handle does not match your handle"))
	}
	purgeAt := s.opts.Now().Add(s.opts.DeleteGrace)
	if _, err := s.store.MarkDeleted(ctx, a.UserID, purgeAt); err != nil {
		return nil, internalErr(err)
	}
	return connect.NewResponse(&userv1.DeleteAccountResponse{PurgeAt: timestamppb.New(purgeAt)}), nil
}

func (s *UserService) BatchGetGnomes(ctx context.Context, req *connect.Request[userv1.BatchGetGnomesRequest]) (*connect.Response[userv1.BatchGetGnomesResponse], error) {
	if len(req.Msg.UserIds) > 32 {
		return nil, connect.NewError(connect.CodeInvalidArgument, errors.New("at most 32 ids"))
	}
	seen := map[string]bool{}
	ids := make([]string, 0, len(req.Msg.UserIds))
	for _, id := range req.Msg.UserIds {
		if len(id) < 2 || id[:2] != "u_" || seen[id] {
			continue
		}
		seen[id] = true
		ids = append(ids, id)
	}
	accts, err := s.store.GetMany(ctx, ids)
	if err != nil {
		return nil, internalErr(err)
	}
	gnomes := make([]*userv1.Gnome, 0, len(accts))
	for _, a := range accts {
		g, err := toGnome(a)
		if err != nil {
			return nil, internalErr(err)
		}
		gnomes = append(gnomes, g)
	}
	return connect.NewResponse(&userv1.BatchGetGnomesResponse{Gnomes: gnomes}), nil
}
