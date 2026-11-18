// Where the platform service is: ?platform=<url> wins, then the VITE_PLATFORM_URL build variable,
// then http://localhost:8090/api on a local dev server. '' = accounts are not set up for this build.
// Same rules as serverUrl() in packages/mp/src/client.ts.
export function platformUrl(): string {
  if (typeof location === 'undefined') return '';
  const param = new URLSearchParams(location.search).get('platform');
  if (param) return param.replace(/\/$/, '');
  const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env;
  if (env?.VITE_PLATFORM_URL) return env.VITE_PLATFORM_URL.replace(/\/$/, '');
  if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') return 'http://localhost:8090/api';
  return '';
}

/** True when this build can sign in and reach the platform service. */
export function accountsEnabled(): boolean {
  return platformUrl() !== '';
}
