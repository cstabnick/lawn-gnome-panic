// Package auth checks the bearer token on a request and says who is calling.
//
// Only Keycloak access tokens are accepted (realm `whalenet`, public client `gnome-web`): signed
// JWTs checked against the realm's JWKS for signature, issuer, expiry and audience.
package auth

import (
	"context"
	"crypto"
	"errors"
	"fmt"
	"net/http"
	"strings"

	"github.com/coreos/go-oidc/v3/oidc"
)

// Caller is an authenticated player.
type Caller struct {
	// Subject is the token's `sub`: the Keycloak user id. Stable; the account key.
	Subject string
}

// ErrUnauthenticated means the token is missing, malformed, expired, wrongly signed, from another
// issuer, or not meant for this audience. Callers map it to connect.CodeUnauthenticated.
var ErrUnauthenticated = errors.New("auth: unauthenticated")

// Verifier turns a bearer token (without the "Bearer " prefix) into a Caller.
type Verifier interface {
	Verify(ctx context.Context, token string) (Caller, error)
}

// KeycloakConfig says which tokens to accept.
type KeycloakConfig struct {
	// Issuer, e.g. "https://auth.whalenet.dev/realms/whalenet" (no trailing slash). The JWKS is
	// fetched from Issuer + "/protocol/openid-connect/certs".
	Issuer string
	// Audience that must appear in the token's `aud`, e.g. "gnome-web".
	Audience string
}

// KeycloakVerifier verifies Keycloak access tokens.
type KeycloakVerifier struct {
	verifier *oidc.IDTokenVerifier
}

var _ Verifier = (*KeycloakVerifier)(nil)

// NewKeycloakVerifier returns a verifier that fetches (and caches) the realm's JWKS on demand.
// It does not contact Keycloak until the first Verify, so the service starts while Keycloak is down.
func NewKeycloakVerifier(ctx context.Context, cfg KeycloakConfig) *KeycloakVerifier {
	keySet := oidc.NewRemoteKeySet(ctx, cfg.Issuer+"/protocol/openid-connect/certs")
	return newKeycloakVerifier(cfg, keySet)
}

// NewStaticVerifier is for tests: the same checks, with fixed public keys instead of a JWKS URL.
func NewStaticVerifier(cfg KeycloakConfig, keys []crypto.PublicKey) *KeycloakVerifier {
	return newKeycloakVerifier(cfg, &oidc.StaticKeySet{PublicKeys: keys})
}

func newKeycloakVerifier(cfg KeycloakConfig, keySet oidc.KeySet) *KeycloakVerifier {
	verifier := oidc.NewVerifier(cfg.Issuer, keySet, &oidc.Config{
		ClientID:             cfg.Audience,
		SupportedSigningAlgs: []string{oidc.RS256, oidc.ES256},
	})
	return &KeycloakVerifier{verifier: verifier}
}

// Verify checks token and returns its caller, or an error wrapping ErrUnauthenticated.
func (v *KeycloakVerifier) Verify(ctx context.Context, token string) (Caller, error) {
	tok, err := v.verifier.Verify(ctx, token)
	if err != nil {
		return Caller{}, fmt.Errorf("%w: %v", ErrUnauthenticated, err)
	}
	// Keycloak marks access tokens with typ "Bearer" and ID tokens with typ "ID".
	var c struct {
		Typ string `json:"typ"`
	}
	if err := tok.Claims(&c); err != nil {
		return Caller{}, fmt.Errorf("%w: reading claims: %v", ErrUnauthenticated, err)
	}
	if c.Typ != "Bearer" {
		return Caller{}, fmt.Errorf("%w: token typ %q is not an access token", ErrUnauthenticated, c.Typ)
	}
	if tok.Subject == "" {
		return Caller{}, fmt.Errorf("%w: token has no subject", ErrUnauthenticated)
	}
	return Caller{Subject: tok.Subject}, nil
}

// BearerToken returns the token from an `Authorization: Bearer <token>` header. The scheme is
// case-insensitive; ok is false when the header is missing, has another scheme or an empty token.
func BearerToken(h http.Header) (token string, ok bool) {
	scheme, rest, found := strings.Cut(h.Get("Authorization"), " ")
	if !found || !strings.EqualFold(scheme, "Bearer") {
		return "", false
	}
	token = strings.TrimSpace(rest)
	if token == "" {
		return "", false
	}
	return token, true
}
