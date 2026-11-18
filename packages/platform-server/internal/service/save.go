package service

import (
	"context"
	"errors"
	"net/http"
	"unicode/utf8"

	"connectrpc.com/connect"
	"google.golang.org/protobuf/types/known/timestamppb"

	commonv1 "github.com/cstabnick/lawn-gnome-panic/packages/platform-server/gen/gnome/common/v1"
	savev1 "github.com/cstabnick/lawn-gnome-panic/packages/platform-server/gen/gnome/save/v1"
	"github.com/cstabnick/lawn-gnome-panic/packages/platform-server/gen/gnome/save/v1/savev1connect"
	"github.com/cstabnick/lawn-gnome-panic/packages/platform-server/internal/store"
)

// Limits on what a game may store.
const (
	MaxSaveBytes    = 512 * 1024
	MaxSummaryRunes = 200
)

// SaveService implements gnome.save.v1.SaveService. It shares the UserService's store, token
// check and account lookup (users.caller, users.account), so the same Keycloak user has one account.
type SaveService struct {
	savev1connect.UnimplementedSaveServiceHandler
	users *UserService
}

var _ savev1connect.SaveServiceHandler = (*SaveService)(nil)

func NewSaveService(users *UserService) *SaveService {
	return &SaveService{users: users}
}

// begin runs the steps both RPCs share: the caller, their account (created on first use), the
// pending-deletion check and the game check.
func (s *SaveService) begin(ctx context.Context, header http.Header, game commonv1.Game) (store.Account, error) {
	c, err := s.users.caller(ctx, header)
	if err != nil {
		return store.Account{}, err
	}
	a, _, err := s.users.account(ctx, c)
	if err != nil {
		return store.Account{}, internalErr(err)
	}
	if a.State == store.StatePendingDeletion {
		return store.Account{}, connect.NewError(connect.CodeFailedPrecondition, errors.New("account is being deleted"))
	}
	if _, ok := commonv1.Game_name[int32(game)]; !ok || game == commonv1.Game_GAME_UNSPECIFIED {
		return store.Account{}, connect.NewError(connect.CodeInvalidArgument, errors.New("unknown game"))
	}
	return a, nil
}

// toSave converts a stored save to the public message.
func toSave(sv store.Save) *savev1.Save {
	return &savev1.Save{
		Game:      commonv1.Game(sv.Game),
		Data:      sv.Data,
		Revision:  sv.Revision,
		UpdatedAt: timestamppb.New(sv.UpdatedAt),
		Summary:   sv.Summary,
	}
}

func (s *SaveService) GetSave(ctx context.Context, req *connect.Request[savev1.GetSaveRequest]) (*connect.Response[savev1.GetSaveResponse], error) {
	g := req.Msg.GetGame()
	a, err := s.begin(ctx, req.Header(), g)
	if err != nil {
		return nil, err
	}
	sv, err := s.users.store.GetSave(ctx, a.UserID, int32(g))
	if errors.Is(err, store.ErrNotFound) {
		return nil, connect.NewError(connect.CodeNotFound, errors.New("no save"))
	}
	if err != nil {
		return nil, internalErr(err)
	}
	return connect.NewResponse(&savev1.GetSaveResponse{Save: toSave(sv)}), nil
}

func (s *SaveService) PutSave(ctx context.Context, req *connect.Request[savev1.PutSaveRequest]) (*connect.Response[savev1.PutSaveResponse], error) {
	g := req.Msg.GetGame()
	a, err := s.begin(ctx, req.Header(), g)
	if err != nil {
		return nil, err
	}
	data, summary, base := req.Msg.GetData(), req.Msg.GetSummary(), req.Msg.GetBaseRevision()
	if len(data) > MaxSaveBytes {
		return nil, connect.NewError(connect.CodeInvalidArgument, errors.New("save too large"))
	}
	if utf8.RuneCountInString(summary) > MaxSummaryRunes {
		return nil, connect.NewError(connect.CodeInvalidArgument, errors.New("summary too long"))
	}
	if base < 0 {
		return nil, connect.NewError(connect.CodeInvalidArgument, errors.New("base_revision must not be negative"))
	}
	sv, err := s.users.store.PutSave(ctx, a.UserID, int32(g), data, summary, base, s.users.opts.Now())
	if errors.Is(err, store.ErrConflict) {
		return nil, connect.NewError(connect.CodeAborted, errors.New("the save changed on another device"))
	}
	if err != nil {
		return nil, internalErr(err)
	}
	return connect.NewResponse(&savev1.PutSaveResponse{Save: toSave(sv)}), nil
}
