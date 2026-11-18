package auth

import (
	"context"
	"crypto"
	"crypto/rand"
	"crypto/rsa"
	"encoding/json"
	"errors"
	"net/http"
	"testing"
	"time"

	jose "github.com/go-jose/go-jose/v4"
)

const (
	testIssuer   = "https://kc.test/realms/whalenet"
	testAudience = "gnome-web"
)

func newKey(t *testing.T) *rsa.PrivateKey {
	t.Helper()
	k, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		t.Fatalf("generate key: %v", err)
	}
	return k
}

// sign returns a compact RS256 JWT with the given claims, signed by key.
func sign(t *testing.T, key *rsa.PrivateKey, claims map[string]any) string {
	t.Helper()
	payload, err := json.Marshal(claims)
	if err != nil {
		t.Fatalf("marshal claims: %v", err)
	}
	signer, err := jose.NewSigner(jose.SigningKey{Algorithm: jose.RS256, Key: key}, (&jose.SignerOptions{}).WithType("JWT"))
	if err != nil {
		t.Fatalf("new signer: %v", err)
	}
	obj, err := signer.Sign(payload)
	if err != nil {
		t.Fatalf("sign: %v", err)
	}
	s, err := obj.CompactSerialize()
	if err != nil {
		t.Fatalf("serialize: %v", err)
	}
	return s
}

// validClaims returns claims that pass every check; tests override single fields.
func validClaims() map[string]any {
	now := time.Now()
	return map[string]any{
		"iss": testIssuer,
		"aud": testAudience,
		"sub": "user-123",
		"exp": now.Add(5 * time.Minute).Unix(),
		"iat": now.Unix(),
		"typ": "Bearer",
	}
}

func with(claims map[string]any, kv ...any) map[string]any {
	out := map[string]any{}
	for k, v := range claims {
		out[k] = v
	}
	for i := 0; i+1 < len(kv); i += 2 {
		out[kv[i].(string)] = kv[i+1]
	}
	return out
}

func TestVerify(t *testing.T) {
	key := newKey(t)
	other := newKey(t)
	cfg := KeycloakConfig{Issuer: testIssuer, Audience: testAudience}
	v := NewStaticVerifier(cfg, []crypto.PublicKey{&key.PublicKey})
	base := validClaims()

	tests := []struct {
		name    string
		token   func(t *testing.T) string
		wantSub string // empty means ErrUnauthenticated expected
	}{
		{
			name:    "valid",
			token:   func(t *testing.T) string { return sign(t, key, base) },
			wantSub: "user-123",
		},
		{
			name: "valid with audience array",
			token: func(t *testing.T) string {
				return sign(t, key, with(base, "aud", []string{"account", testAudience}))
			},
			wantSub: "user-123",
		},
		{
			name: "expired",
			token: func(t *testing.T) string {
				return sign(t, key, with(base, "exp", time.Now().Add(-time.Hour).Unix()))
			},
		},
		{
			name: "wrong issuer",
			token: func(t *testing.T) string {
				return sign(t, key, with(base, "iss", "https://evil.test/realms/whalenet"))
			},
		},
		{
			name: "audience only account",
			token: func(t *testing.T) string {
				return sign(t, key, with(base, "aud", "account"))
			},
		},
		{
			name: "ID token typ",
			token: func(t *testing.T) string {
				return sign(t, key, with(base, "typ", "ID"))
			},
		},
		{
			name: "empty sub",
			token: func(t *testing.T) string {
				return sign(t, key, with(base, "sub", ""))
			},
		},
		{
			name: "signed with a different key",
			token: func(t *testing.T) string {
				return sign(t, other, base)
			},
		},
		{
			name:  "not a jwt",
			token: func(t *testing.T) string { return "not.a.jwt" },
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			caller, err := v.Verify(context.Background(), tc.token(t))
			if tc.wantSub == "" {
				if !errors.Is(err, ErrUnauthenticated) {
					t.Fatalf("err = %v, want ErrUnauthenticated", err)
				}
				return
			}
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if caller.Subject != tc.wantSub {
				t.Fatalf("Subject = %q, want %q", caller.Subject, tc.wantSub)
			}
		})
	}
}

func TestBearerToken(t *testing.T) {
	tests := []struct {
		name   string
		header string // empty with set=false means header absent
		set    bool
		want   string
		wantOK bool
	}{
		{name: "bearer", header: "Bearer abc", set: true, want: "abc", wantOK: true},
		{name: "lowercase scheme", header: "bearer abc", set: true, want: "abc", wantOK: true},
		{name: "basic scheme", header: "Basic abc", set: true},
		{name: "empty token", header: "Bearer ", set: true},
		{name: "missing header"},
	}
	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			h := http.Header{}
			if tc.set {
				h.Set("Authorization", tc.header)
			}
			got, ok := BearerToken(h)
			if ok != tc.wantOK || got != tc.want {
				t.Fatalf("BearerToken = (%q, %v), want (%q, %v)", got, ok, tc.want, tc.wantOK)
			}
		})
	}
}
