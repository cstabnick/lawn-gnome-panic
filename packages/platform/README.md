# @lawn/platform: the browser side of accounts

- `session.ts`: constants and `hasStoredSession()`, with no dependencies. `@lawn/gnome` imports only this, so games
  that never sign in don't download the rest.
- `auth.ts`: Keycloak sign-in with oidc-client-ts (code + PKCE, client `gnome-web`, straight to Google with
  `kc_idp_hint`), session in localStorage (shared by every game on the origin), token refresh, sign-out.
- `client.ts`: `userClient()`, the generated Connect client of `gnome.user.v1.UserService`, adding the access token.
- `url.ts`: `platformUrl()`: `?platform=` wins, then `VITE_PLATFORM_URL`, then `http://localhost:8090/api` on localhost.

Games don't use this directly: `createGnomeStore()` in `@lawn/gnome` returns a `ConnectGnomeStore` when a session is
stored. The account page is `games/me` (`/me/`).
