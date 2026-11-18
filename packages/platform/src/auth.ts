// Keycloak sign-in for the arcade: OIDC authorization code + PKCE against the public client
// `gnome-web` in realm `whalenet`, with oidc-client-ts. The session (tokens) lives in localStorage,
// so every game on the same origin sees it. Keycloak owns refresh and logout.

import { UserManager, WebStorageStateStore } from 'oidc-client-ts';
import { KEYCLOAK_AUTHORITY, KEYCLOAK_CLIENT_ID, KEYCLOAK_IDP_HINT } from './session';

/** The page the browser returns to after sign-in and sign-out: origin + pathname, no query, no hash. */
function pageUrl(): string {
  return location.origin + location.pathname;
}

let manager: UserManager | null = null;

function getManager(): UserManager {
  if (!manager) {
    manager = new UserManager({
      authority: KEYCLOAK_AUTHORITY,
      client_id: KEYCLOAK_CLIENT_ID,
      redirect_uri: pageUrl(),
      post_logout_redirect_uri: pageUrl(),
      response_type: 'code',
      scope: 'openid',
      // Default "oidc." key prefix, so the session lands where hasStoredSession() looks.
      userStore: new WebStorageStateStore({ store: localStorage }),
      automaticSilentRenew: false,
      loadUserInfo: false,
      extraQueryParams: { kc_idp_hint: KEYCLOAK_IDP_HINT },
    });
  }
  return manager;
}

/** The refresh in flight, shared by concurrent getAccessToken() calls. */
let refreshing: Promise<string | null> | null = null;

async function refresh(mgr: UserManager): Promise<string | null> {
  try {
    const user = await mgr.signinSilent();
    return user?.access_token ?? null;
  } catch {
    try {
      await mgr.removeUser();
    } catch {
      // ignore: the session is unusable either way
    }
    return null;
  }
}

/**
 * A valid access token for the platform service, refreshing it with the refresh token when it is
 * expired or expires within 30 s. Resolves null when signed out or when the refresh fails (the
 * stored session is then removed). Never rejects.
 */
export async function getAccessToken(): Promise<string | null> {
  try {
    if (typeof localStorage === 'undefined') return null;
    const mgr = getManager();
    const user = await mgr.getUser();
    if (!user) return null;
    if (user.expires_in !== undefined && user.expires_in > 30) return user.access_token;
    if (!user.refresh_token) return null;
    if (!refreshing) {
      refreshing = refresh(mgr).finally(() => {
        refreshing = null;
      });
    }
    return await refreshing;
  } catch {
    return null;
  }
}

/**
 * Starts sign-in: sends the browser to Keycloak (Google). Keycloak redirects back to the current
 * page (origin + pathname, no query), which must call completeSignIn() on load.
 */
export async function signIn(): Promise<void> {
  await getManager().signinRedirect();
}

/**
 * Call once when a page that started signIn() loads. When the URL carries the OIDC response
 * (`code` and `state`, or `error`), finishes sign-in, removes those parameters from the URL with
 * history.replaceState, and resolves true on success. Resolves false when the URL has no OIDC
 * response or sign-in failed. Never rejects.
 */
export async function completeSignIn(): Promise<boolean> {
  const p = new URLSearchParams(location.search);
  if (!(p.has('state') && (p.has('code') || p.has('error')))) return false;
  let ok = false;
  try {
    await getManager().signinRedirectCallback();
    ok = true;
  } catch (e) {
    console.warn('Sign-in did not complete.', e);
    ok = false;
  } finally {
    try {
      for (const key of ['code', 'state', 'session_state', 'iss', 'error', 'error_description']) {
        p.delete(key);
      }
      const query = p.toString();
      const newUrl = location.pathname + (query ? `?${query}` : '') + location.hash;
      history.replaceState(history.state, '', newUrl);
    } catch {
      // ignore: the URL cleanup is cosmetic
    }
  }
  return ok;
}

/**
 * Signs out: removes the stored session, then sends the browser to Keycloak's end-session endpoint,
 * which returns to the current page (origin + pathname).
 */
export async function signOut(): Promise<void> {
  const mgr = getManager();
  const user = await mgr.getUser();
  await mgr.removeUser();
  try {
    await mgr.signoutRedirect({ id_token_hint: user?.id_token });
  } catch {
    // Keycloak unreachable: the local session is already gone.
  }
}
