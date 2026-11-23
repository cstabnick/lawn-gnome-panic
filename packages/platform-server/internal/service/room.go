package service

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"errors"
	"fmt"
	"math/big"
	"net/http"
	"regexp"
	"strings"
	"unicode/utf8"

	"connectrpc.com/connect"
	"google.golang.org/protobuf/types/known/timestamppb"

	commonv1 "github.com/cstabnick/lawn-gnome-panic/packages/platform-server/gen/gnome/common/v1"
	savev1 "github.com/cstabnick/lawn-gnome-panic/packages/platform-server/gen/gnome/save/v1"
	"github.com/cstabnick/lawn-gnome-panic/packages/platform-server/gen/gnome/save/v1/savev1connect"
	"github.com/cstabnick/lawn-gnome-panic/packages/platform-server/internal/obs"
	"github.com/cstabnick/lawn-gnome-panic/packages/platform-server/internal/store"
)

// Room limits enforced at the RPC layer (the store enforces the same part and size limits).
const (
	MaxRoomTitleRunes = 60
	roomCodeLen       = 8
	roomCodeAlphabet  = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	roomCodeTries     = 5
)

var (
	uploadIDPattern = regexp.MustCompile(`^[A-Za-z0-9_-]{16,40}$`)
	partHashPattern = regexp.MustCompile(`^[0-9a-f]{8}$`)
)

// RoomSaveService implements gnome.save.v1.RoomSaveService: shared world saves for DayG rooms.
// The server stores and relays the parts; the game and its save format live in the browsers.
type RoomSaveService struct {
	savev1connect.UnimplementedRoomSaveServiceHandler
	users *UserService
	rooms store.RoomStore
}

var _ savev1connect.RoomSaveServiceHandler = (*RoomSaveService)(nil)

func NewRoomSaveService(users *UserService, rooms store.RoomStore) *RoomSaveService {
	return &RoomSaveService{users: users, rooms: rooms}
}

// begin runs the caller, account and pending-deletion steps of SaveService.begin.
func (s *RoomSaveService) begin(ctx context.Context, header http.Header) (store.Account, error) {
	c, err := s.users.caller(ctx, header)
	if err != nil {
		return store.Account{}, err
	}
	a, _, err := s.users.account(ctx, c)
	if err != nil {
		return store.Account{}, internalErr(ctx, err)
	}
	if a.State == store.StatePendingDeletion {
		return store.Account{}, connect.NewError(connect.CodeFailedPrecondition, errors.New("account is being deleted"))
	}
	return a, nil
}

// checkGame rejects an unknown or unspecified game.
func checkGame(game commonv1.Game) error {
	if _, ok := commonv1.Game_name[int32(game)]; !ok || game == commonv1.Game_GAME_UNSPECIFIED {
		return connect.NewError(connect.CodeInvalidArgument, errors.New("unknown game"))
	}
	return nil
}

// loadRoom returns the room, or NOT_FOUND.
func (s *RoomSaveService) loadRoom(ctx context.Context, code string) (store.Room, error) {
	r, err := s.rooms.GetRoom(ctx, code)
	if errors.Is(err, store.ErrNotFound) {
		return store.Room{}, connect.NewError(connect.CodeNotFound, errors.New("no such room"))
	}
	if err != nil {
		return store.Room{}, internalErr(ctx, err)
	}
	return r, nil
}

// loadMemberRoom returns the room when the caller is a member, else NOT_FOUND or PERMISSION_DENIED.
func (s *RoomSaveService) loadMemberRoom(ctx context.Context, header http.Header, code string) (store.Room, store.Account, error) {
	a, err := s.begin(ctx, header)
	if err != nil {
		return store.Room{}, store.Account{}, err
	}
	r, err := s.loadRoom(ctx, code)
	if err != nil {
		return store.Room{}, store.Account{}, err
	}
	if !contains(r.Members, a.UserID) {
		return store.Room{}, store.Account{}, connect.NewError(connect.CodePermissionDenied, errors.New("not a member of this room"))
	}
	return r, a, nil
}

// loadCreatorRoom is loadMemberRoom for the creator only.
func (s *RoomSaveService) loadCreatorRoom(ctx context.Context, header http.Header, code string) (store.Room, error) {
	a, err := s.begin(ctx, header)
	if err != nil {
		return store.Room{}, err
	}
	r, err := s.loadRoom(ctx, code)
	if err != nil {
		return store.Room{}, err
	}
	if r.CreatorID != a.UserID {
		return store.Room{}, connect.NewError(connect.CodePermissionDenied, errors.New("only the room's creator can do that"))
	}
	return r, nil
}

func contains(ids []string, id string) bool {
	for _, x := range ids {
		if x == id {
			return true
		}
	}
	return false
}

// newRoomCode returns 8 characters from A-Z0-9 drawn from crypto/rand.
func newRoomCode() (string, error) {
	b := make([]byte, roomCodeLen)
	max := big.NewInt(int64(len(roomCodeAlphabet)))
	for i := range b {
		n, err := rand.Int(rand.Reader, max)
		if err != nil {
			return "", err
		}
		b[i] = roomCodeAlphabet[n.Int64()]
	}
	return string(b), nil
}

// newInviteToken returns 22 base64url characters (16 random bytes, no padding).
func newInviteToken() (string, error) {
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(b), nil
}

// toRoom converts a stored room to the public message.
func toRoom(r store.Room) *savev1.Room {
	return &savev1.Room{
		Code:       r.Code,
		Game:       commonv1.Game(r.Game),
		Title:      r.Title,
		CreatorId:  r.CreatorID,
		MemberIds:  r.Members,
		InviteOnly: r.InviteOnly,
		Closed:     r.Closed,
		Revision:   r.Revision,
		Tick:       r.Tick,
		UpdatedAt:  timestamppb.New(r.UpdatedAt),
		Summary:    r.Summary,
	}
}

// toManifest converts a stored room's save to the public manifest.
func toManifest(r store.Room) *savev1.RoomSaveManifest {
	return &savev1.RoomSaveManifest{
		Code:       r.Code,
		Revision:   r.Revision,
		Tick:       r.Tick,
		HostId:     r.HostID,
		PartCount:  r.PartCount,
		TotalBytes: r.TotalBytes,
		PartHashes: r.PartHashes,
		Summary:    r.Summary,
		UpdatedAt:  timestamppb.New(r.UpdatedAt),
	}
}

func (s *RoomSaveService) CreateRoom(ctx context.Context, req *connect.Request[savev1.CreateRoomRequest]) (*connect.Response[savev1.CreateRoomResponse], error) {
	a, err := s.begin(ctx, req.Header())
	if err != nil {
		return nil, err
	}
	g := req.Msg.GetGame()
	obs.Add(ctx, "game", g.String())
	if err := checkGame(g); err != nil {
		return nil, err
	}
	title := strings.TrimSpace(req.Msg.GetTitle())
	if utf8.RuneCountInString(title) > MaxRoomTitleRunes {
		return nil, connect.NewError(connect.CodeInvalidArgument, errors.New("title too long"))
	}
	now := s.users.opts.Now()
	for range roomCodeTries {
		code, err := newRoomCode()
		if err != nil {
			return nil, internalErr(ctx, err)
		}
		r, err := s.rooms.CreateRoom(ctx, code, int32(g), title, a.UserID, now)
		if errors.Is(err, store.ErrConflict) {
			continue
		}
		if err != nil {
			return nil, internalErr(ctx, err)
		}
		return connect.NewResponse(&savev1.CreateRoomResponse{Room: toRoom(r)}), nil
	}
	return nil, internalErr(ctx, fmt.Errorf("no free room code after %d tries", roomCodeTries))
}

func (s *RoomSaveService) JoinRoom(ctx context.Context, req *connect.Request[savev1.JoinRoomRequest]) (*connect.Response[savev1.JoinRoomResponse], error) {
	a, err := s.begin(ctx, req.Header())
	if err != nil {
		return nil, err
	}
	code := req.Msg.GetCode()
	r, err := s.loadRoom(ctx, code)
	if err != nil {
		return nil, err
	}
	if r.Closed {
		return nil, connect.NewError(connect.CodeFailedPrecondition, errors.New("room is closed"))
	}
	if contains(r.Members, a.UserID) {
		// Joining again is a no-op.
		return connect.NewResponse(&savev1.JoinRoomResponse{Room: toRoom(r)}), nil
	}
	if r.InviteOnly {
		if err := s.rooms.UseInvite(ctx, code, req.Msg.GetInvite(), s.users.opts.Now()); errors.Is(err, store.ErrNotFound) {
			return nil, connect.NewError(connect.CodePermissionDenied, errors.New("this room needs a valid invite"))
		} else if err != nil {
			return nil, internalErr(ctx, err)
		}
	}
	joined, err := s.rooms.AddMember(ctx, code, a.UserID, s.users.opts.Now())
	if errors.Is(err, store.ErrConflict) {
		return nil, connect.NewError(connect.CodeFailedPrecondition, errors.New("room is full"))
	}
	if err != nil {
		return nil, internalErr(ctx, err)
	}
	return connect.NewResponse(&savev1.JoinRoomResponse{Room: toRoom(joined)}), nil
}

func (s *RoomSaveService) ListMyRooms(ctx context.Context, req *connect.Request[savev1.ListMyRoomsRequest]) (*connect.Response[savev1.ListMyRoomsResponse], error) {
	a, err := s.begin(ctx, req.Header())
	if err != nil {
		return nil, err
	}
	g := req.Msg.GetGame()
	obs.Add(ctx, "game", g.String())
	if err := checkGame(g); err != nil {
		return nil, err
	}
	rooms, err := s.rooms.ListRoomsOf(ctx, a.UserID, int32(g))
	if err != nil {
		return nil, internalErr(ctx, err)
	}
	out := make([]*savev1.Room, 0, len(rooms))
	for _, r := range rooms {
		out = append(out, toRoom(r))
	}
	return connect.NewResponse(&savev1.ListMyRoomsResponse{Rooms: out}), nil
}

func (s *RoomSaveService) GetRoomSave(ctx context.Context, req *connect.Request[savev1.GetRoomSaveRequest]) (*connect.Response[savev1.GetRoomSaveResponse], error) {
	r, _, err := s.loadMemberRoom(ctx, req.Header(), req.Msg.GetCode())
	if err != nil {
		return nil, err
	}
	if r.Revision == 0 {
		return nil, connect.NewError(connect.CodeNotFound, errors.New("room has no save yet"))
	}
	return connect.NewResponse(&savev1.GetRoomSaveResponse{Manifest: toManifest(r)}), nil
}

func (s *RoomSaveService) GetRoomSavePart(ctx context.Context, req *connect.Request[savev1.GetRoomSavePartRequest]) (*connect.Response[savev1.GetRoomSavePartResponse], error) {
	r, _, err := s.loadMemberRoom(ctx, req.Header(), req.Msg.GetCode())
	if err != nil {
		return nil, err
	}
	data, err := s.rooms.GetPart(ctx, r.Code, req.Msg.GetRevision(), req.Msg.GetIndex())
	if errors.Is(err, store.ErrNotFound) {
		return nil, connect.NewError(connect.CodeNotFound, errors.New("no such part of this revision"))
	}
	if err != nil {
		return nil, internalErr(ctx, err)
	}
	obs.Add(ctx, "save.bytes", len(data))
	return connect.NewResponse(&savev1.GetRoomSavePartResponse{Data: data}), nil
}

func (s *RoomSaveService) PutRoomSavePart(ctx context.Context, req *connect.Request[savev1.PutRoomSavePartRequest]) (*connect.Response[savev1.PutRoomSavePartResponse], error) {
	r, _, err := s.loadMemberRoom(ctx, req.Header(), req.Msg.GetCode())
	if err != nil {
		return nil, err
	}
	m := req.Msg
	if !uploadIDPattern.MatchString(m.GetUploadId()) {
		return nil, connect.NewError(connect.CodeInvalidArgument, errors.New("bad upload_id"))
	}
	if m.GetIndex() < 0 || m.GetIndex() >= store.MaxRoomParts {
		return nil, connect.NewError(connect.CodeInvalidArgument, errors.New("part index out of range"))
	}
	if len(m.GetData()) > store.MaxRoomPartBytes {
		return nil, connect.NewError(connect.CodeInvalidArgument, errors.New("part too big"))
	}
	obs.Add(ctx, "save.bytes", len(m.GetData()), "save.part", m.GetIndex())
	err = s.rooms.PutPart(ctx, r.Code, m.GetUploadId(), m.GetIndex(), m.GetData(), s.users.opts.Now())
	switch {
	case errors.Is(err, store.ErrNotFound):
		return nil, connect.NewError(connect.CodeNotFound, errors.New("no such room"))
	case errors.Is(err, store.ErrTooBig):
		return nil, connect.NewError(connect.CodeInvalidArgument, errors.New("part too big"))
	case err != nil:
		return nil, internalErr(ctx, err)
	}
	return connect.NewResponse(&savev1.PutRoomSavePartResponse{}), nil
}

func (s *RoomSaveService) CommitRoomSave(ctx context.Context, req *connect.Request[savev1.CommitRoomSaveRequest]) (*connect.Response[savev1.CommitRoomSaveResponse], error) {
	r, a, err := s.loadMemberRoom(ctx, req.Header(), req.Msg.GetCode())
	if err != nil {
		return nil, err
	}
	m := req.Msg
	if !uploadIDPattern.MatchString(m.GetUploadId()) {
		return nil, connect.NewError(connect.CodeInvalidArgument, errors.New("bad upload_id"))
	}
	if m.GetPartCount() < 0 || m.GetPartCount() > store.MaxRoomParts {
		return nil, connect.NewError(connect.CodeInvalidArgument, errors.New("part_count out of range"))
	}
	if len(m.GetPartHashes()) != int(m.GetPartCount()) {
		return nil, connect.NewError(connect.CodeInvalidArgument, errors.New("part_hashes must match part_count"))
	}
	for _, h := range m.GetPartHashes() {
		if !partHashPattern.MatchString(h) {
			return nil, connect.NewError(connect.CodeInvalidArgument, errors.New("bad part hash"))
		}
	}
	if utf8.RuneCountInString(m.GetSummary()) > MaxSummaryRunes {
		return nil, connect.NewError(connect.CodeInvalidArgument, errors.New("summary too long"))
	}
	manifest := store.RoomManifest{
		Tick:       m.GetTick(),
		HostID:     a.UserID,
		PartCount:  m.GetPartCount(),
		TotalBytes: m.GetTotalBytes(),
		PartHashes: m.GetPartHashes(),
		Summary:    m.GetSummary(),
	}
	committed, err := s.rooms.CommitSave(ctx, r.Code, m.GetBaseRevision(), m.GetUploadId(), manifest, s.users.opts.Now())
	switch {
	case errors.Is(err, store.ErrConflict):
		return nil, connect.NewError(connect.CodeAborted, errors.New("the save changed on another device"))
	case errors.Is(err, store.ErrNotFound):
		return nil, connect.NewError(connect.CodeInvalidArgument, errors.New("a part is missing"))
	case errors.Is(err, store.ErrTooBig):
		return nil, connect.NewError(connect.CodeInvalidArgument, errors.New("save too large"))
	case err != nil:
		return nil, internalErr(ctx, err)
	}
	obs.Add(ctx, "save.revision", committed.Revision, "save.bytes", committed.TotalBytes)
	return connect.NewResponse(&savev1.CommitRoomSaveResponse{Manifest: toManifest(committed)}), nil
}

func (s *RoomSaveService) UpdateRoom(ctx context.Context, req *connect.Request[savev1.UpdateRoomRequest]) (*connect.Response[savev1.UpdateRoomResponse], error) {
	r, err := s.loadCreatorRoom(ctx, req.Header(), req.Msg.GetCode())
	if err != nil {
		return nil, err
	}
	now := s.users.opts.Now()
	if len(req.Msg.GetRemoveMemberIds()) > 0 {
		if _, err := s.rooms.RemoveMembers(ctx, r.Code, req.Msg.GetRemoveMemberIds(), now); err != nil {
			return nil, internalErr(ctx, err)
		}
	}
	var closed *bool
	if req.Msg.GetClose() {
		closed = new(bool)
		*closed = true
	}
	updated, err := s.rooms.SetRoomFlags(ctx, r.Code, req.Msg.InviteOnly, closed, now)
	if err != nil {
		return nil, internalErr(ctx, err)
	}
	return connect.NewResponse(&savev1.UpdateRoomResponse{Room: toRoom(updated)}), nil
}

func (s *RoomSaveService) CreateInvite(ctx context.Context, req *connect.Request[savev1.CreateInviteRequest]) (*connect.Response[savev1.CreateInviteResponse], error) {
	r, err := s.loadCreatorRoom(ctx, req.Header(), req.Msg.GetCode())
	if err != nil {
		return nil, err
	}
	token, err := newInviteToken()
	if err != nil {
		return nil, internalErr(ctx, err)
	}
	if err := s.rooms.CreateInvite(ctx, r.Code, token, s.users.opts.Now()); err != nil {
		return nil, internalErr(ctx, err)
	}
	return connect.NewResponse(&savev1.CreateInviteResponse{Invite: token}), nil
}
