// The UserService and SaveService clients: Connect over HTTP + JSON to platformUrl(), with the Keycloak access token.
import { createClient, type Client, type Interceptor, type Transport } from '@connectrpc/connect';
import { createConnectTransport } from '@connectrpc/connect-web';
import { getAccessToken } from './auth';
import { SaveService } from './gen/gnome/save/v1/save_pb';
import { UserService } from './gen/gnome/user/v1/user_pb';
import { platformUrl } from './url';

/** Adds `Authorization: Bearer <token>` when signed in. Open RPCs work without it. */
const bearer: Interceptor = (next) => async (req) => {
  const token = await getAccessToken();
  if (token) req.header.set('Authorization', `Bearer ${token}`);
  return next(req);
};

let cached: { url: string; transport: Transport } | null = null;

function transport(): Transport {
  const url = platformUrl();
  if (!url) throw new Error('The platform service is not configured for this build.');
  if (cached?.url !== url) cached = { url, transport: createConnectTransport({ baseUrl: url, interceptors: [bearer] }) };
  return cached.transport;
}

/** The UserService client for this page. Throws when accounts are not set up (platformUrl() is ''). */
export function userClient(): Client<typeof UserService> {
  return createClient(UserService, transport());
}

/** The SaveService client (cloud saves). Throws when accounts are not set up (platformUrl() is ''). */
export function saveClient(): Client<typeof SaveService> {
  return createClient(SaveService, transport());
}
