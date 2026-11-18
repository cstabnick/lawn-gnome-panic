// The UserService client: Connect over HTTP + JSON to platformUrl(), with the Keycloak access token.
import { createClient, type Client, type Interceptor } from '@connectrpc/connect';
import { createConnectTransport } from '@connectrpc/connect-web';
import { getAccessToken } from './auth';
import { UserService } from './gen/gnome/user/v1/user_pb';
import { platformUrl } from './url';

/** Adds `Authorization: Bearer <token>` when signed in. Open RPCs work without it. */
const bearer: Interceptor = (next) => async (req) => {
  const token = await getAccessToken();
  if (token) req.header.set('Authorization', `Bearer ${token}`);
  return next(req);
};

let cached: { url: string; client: Client<typeof UserService> } | null = null;

/** The UserService client for this page. Throws when accounts are not set up (platformUrl() is ''). */
export function userClient(): Client<typeof UserService> {
  const url = platformUrl();
  if (!url) throw new Error('The platform service is not configured for this build.');
  if (cached?.url !== url) {
    cached = { url, client: createClient(UserService, createConnectTransport({ baseUrl: url, interceptors: [bearer] })) };
  }
  return cached.client;
}
