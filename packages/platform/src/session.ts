// The cheap part of @lawn/platform: constants and "is anyone signed in on this origin?", with no
// dependencies. Every game imports this (through @lawn/gnome); the OIDC and Connect code is loaded
// with a dynamic import() only when it is needed.
export { platformUrl, accountsEnabled } from './url';

/** The Keycloak realm. */
export const KEYCLOAK_AUTHORITY = 'https://auth.whalenet.dev/realms/whalenet';
/** The public client the arcade signs in with. Also the required `aud` of access tokens. */
export const KEYCLOAK_CLIENT_ID = 'gnome-web';
/** Keycloak identity provider alias to jump straight to (skips Keycloak's own login form). */
export const KEYCLOAK_IDP_HINT = 'google';

/**
 * localStorage key where oidc-client-ts keeps the session: its WebStorageStateStore default prefix
 * "oidc." + "user:" + authority + ":" + client_id. auth.ts must configure
 * `userStore: new WebStorageStateStore({ store: localStorage })` (default prefix) so this matches.
 */
export const SESSION_STORAGE_KEY = `oidc.user:${KEYCLOAK_AUTHORITY}:${KEYCLOAK_CLIENT_ID}`;

/**
 * True when a session is stored on this origin (even with an expired access token that can still be
 * refreshed). Synchronous and cheap: reads localStorage only. Never throws.
 */
export function hasStoredSession(): boolean {
  try {
    return typeof localStorage !== 'undefined' && localStorage.getItem(SESSION_STORAGE_KEY) !== null;
  } catch {
    return false;
  }
}
