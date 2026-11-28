# Hosting the arcade

The arcade is a set of static files with no backend. Running `npm run site` builds every game in `games/` into `site/`, with an index page linking to each one. Any static host can serve that folder.

## GitHub Pages (recommended)

GitHub Pages is free for public repositories. Pages on a private repository needs a paid GitHub plan.

The workflow is already in `.github/workflows/pages.yml`. It runs on every push to `main`, builds the site, and deploys it.

1. Create the repository on GitHub.
2. Add it as the remote: `git remote add origin https://github.com/<user>/<repo>.git`.
3. Push `main`: `git push -u origin main`.
4. In the repository, go to Settings → Pages → Source and choose **GitHub Actions**.

The site appears at `https://<user>.github.io/<repo>/`. The root is a landing page with a card per game (thumbnail, title from the game's `<title>`, description from its package.json or README). Every game is at `/<repo>/<game>/`. Lawn Gnome Panic (`sample-3d`) used to be the root, so root links with a query string (invite codes, `?autostart=...`) are forwarded to `/<repo>/sample-3d/`, and `/<repo>/gnome/` and `/<repo>/arcade/` redirect too. Thumbnails are `games/<game>/thumbnail.jpg`; retake them with `node tools/thumbnails.cjs [game ...]`.

## itch.io

itch.io is free and built for games, with good discoverability.

- Zip the game folder (for example `site/sample-3d`) and upload it as an HTML5 project, or
- Use the `butler push` CLI to publish a folder.

## Cloudflare Pages

Cloudflare Pages is free, with unlimited bandwidth.

- Deploy from the command line: `npx wrangler pages deploy site`, or
- Connect the GitHub repository in the Cloudflare dashboard.

## Netlify

Netlify has a free tier.

- Drag the `site` folder onto the dashboard, or
- Connect the repository with build command `npm run site` and publish directory `site`.

## Multiplayer server (online royale)

The game itself stays static. Online play needs one small server for **matchmaking and relaying messages**: `packages/mp-server`, one Docker image shared by every online game (Lawn Gnome Panic, Gnome Front, Gnaft; per-game rules are `GAMES` in `packages/mp/src/protocol.ts`). It does not simulate the game; one player's browser per match is the host (see `docs/design/multiplayer-royale.md`).

### Default: the whale-net cluster (gnome.whalenet.app)

The server and a copy of the site run on the whale-net Kubernetes cluster, deployed by ArgoCD from
[whale-net/argok8s](https://github.com/whale-net/argok8s) (`services/lawn-gnome-panic/`):

- `https://gnome.whalenet.app` is the static site (nginx, `deploy/site.Dockerfile`), and `wss://gnome.whalenet.app/ws` is the
  matchmaking server (`packages/mp-server/Dockerfile`). The ingress sends `/ws`, `/t` and `/healthz` to the server and
  `/api` to the platform service, everything else to the site.
- On every push to `main`, `.github/workflows/pages.yml` builds the site (with `VITE_MP_URL=wss://gnome.whalenet.app/ws`, so
  the GitHub Pages copy plays online against the cluster too), deploys Pages and pushes `ghcr.io/cstabnick/lawn-gnome-site`.
  `.github/workflows/server.yml` tests the server and pushes `ghcr.io/cstabnick/lawn-gnome-mm` when it changes.
- argocd-image-updater follows both `:latest` tags by digest and rolls the pods. The server keeps one replica (in-memory
  state); a rollout starts the new pod first and gives the old one 300 s to let running matches finish.
- `/api` goes to the platform service (player accounts, Go, `packages/platform-server`): `.github/workflows/platform.yml`
  tests it against Postgres and pushes `ghcr.io/cstabnick/lawn-gnome-platform`. Sign-in is Keycloak (whale-net/argok8s
  `opentofu/keycloak/lawn-gnome-panic`); Pages builds get `VITE_PLATFORM_URL=https://gnome.whalenet.app/api`.
- All three GHCR packages must be public (the cluster has no pull secret for them): GitHub > your profile > Packages > the
  package > Package settings > Change visibility.

Any build can be pointed at another server with `?mp=wss://host/ws` in the page URL.

### Public URL / ports

The pods listen on 8080 (nginx site, platform, matchmaker) but the public address is `https://gnome.whalenet.app` on 443.
Never build a public URL from the listen port. `deploy/nginx.conf` sets `absolute_redirect off`, so `/admin/profiler`
redirects to `/admin/profiler/` with a relative `Location` (nginx otherwise emits `https://host:8080/...`). The platform
service emits no redirects; the client builds sign-in URLs from `location.origin`.

### Logging, tracing and metrics (OpenTelemetry)

All three images follow the whale-net logging standard (whale-net/everything `docs/LOGGING_ENV_VARS.md`).

**Logs.** The platform service and the matchmaker always write structured logs: one whale-net JSON line per record on
stdout (`timestamp`, `severity`, `message`, `logger`, `app_name`, `domain`, `environment`, `pod_name`, ... then the
record's fields in snake_case). `ENABLE_OTEL_LOGGING` (`true`, `1` or `yes`) also exports them over OTLP gRPC. The site
keeps nginx's stock access log unless the flag is on.

| Image | What it logs |
| --- | --- |
| platform (`packages/platform-server`, `internal/obs`) | One line per RPC with `request_id` (the ingress's `X-Request-ID`, echoed back), `rpc.service`/`rpc.method`, `grpc_code`, `duration_ms` and the handler's outcome fields (`game`, `save.bytes`, `save.revision`, `account.created`, ...). Also account events (created, restored, deletion requested, name rejected with a reason code), save conflicts, purge runs, internal errors, and startup and shutdown. Every line of one request shares its `request_id`. |
| matchmaker (`packages/mp-server`, `src/log.ts`) | Every matchmaker and client event with a severity (WARN for client errors, bad names, chat rate limits and rejected telemetry), socket sessions (`conn_id`, `request_id`, `close_code`, `duration_s`), refused telemetry batches with a reason, a `stats` line each minute (sockets, players, queued, matches, memory), and startup, drain and exit. |
| site (`deploy/otel-logging.sh`, flag on only) | Access log as whale-net JSON with OTel HTTP keys plus `request_id`, `trace_id` (from an incoming `traceparent`) and `game` (first path segment). nginx cannot push OTLP: the collector has to read the pod's stdout (whale-net/argok8s#326). |

**Traces.** `ENABLE_OTEL_TRACING` (`true`, `1` or `yes`) exports spans over OTLP gRPC, and log lines written inside a
span carry its `trace_id` and `span_id`.

- **platform:** a server span per RPC that continues an incoming W3C `traceparent`, a span per Postgres query (otelpgx),
  client spans for outbound HTTP (Keycloak JWKS), and a span per purge run.
- **matchmaker:** a span per match, from `match_start` to `match_end`, with joins, leaves and host changes as span
  events, plus a server span per telemetry POST. It does not create a span per relayed game message.
- **site:** none. nginx's otel module isn't in the image, and static file serving gains little from it. The access
  log records the trace id it was handed instead.

**Metrics.** `ENABLE_OTEL_METRICS` (`true`, `1` or `yes`) pushes metrics over OTLP gRPC every 60 s
(`OTEL_METRIC_EXPORT_INTERVAL`, in ms, overrides that) and flushes them on shutdown. Attributes are low-cardinality
only: game ids, event names, reasons and status codes, never a player, match or connection id.

- **platform:**
  - `rpc.server.call.duration` (s; by `rpc.service`, `rpc.method` and `rpc.connect_rpc.error_code`)
  - `lawn.accounts.created`, `.restored`, `.deletion_requested` and `.purged`
  - `lawn.names.rejected` (by `reason`)
  - `lawn.saves.written` and `lawn.saves.conflicts` (by `game`), and `lawn.saves.size` (bytes, by `game`)
  - Postgres pool stats (otelpgx `db.client.connections.*`) and Go runtime stats (`go.memory.*`, `go.goroutine.count`, ...)
- **matchmaker:**
  - `lawn.mm.events` (by `src` and `event`, the same as the `/healthz` counters)
  - `lawn.mm.matches.started` (by `game` and `private`)
  - `lawn.mm.match.players` (by `game`) and `lawn.mm.match.duration` (s, by `game` and end `reason`)
  - `lawn.mm.session.duration` (s)
  - `lawn.mm.telemetry.rejected` (by `reason`)
  - `http.server.request.duration` for `/t`
  - gauges: `lawn.mm.sockets`, `lawn.mm.players`, `lawn.mm.queued`, `lawn.mm.matches` and `process.memory.usage`
- **site:** none of its own. Request rates and latencies come from the ingress.

**Variables.**
- Endpoint: `OTEL_EXPORTER_OTLP_ENDPOINT`, or the per-signal `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` /
  `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT`. Use host:port or `http://host:port` (insecure gRPC). The default is
  `localhost:4317`; on the cluster it is `otel-collector-collector.logs.svc.cluster.local:4317`.
- Off switches: `OTEL_SDK_DISABLED=true`, `OTEL_LOGS_DISABLED=true`, `OTEL_TRACES_DISABLED=true`,
  `OTEL_METRICS_DISABLED=true`.
- Identity: `APP_NAME` (defaults `lawn-gnome-platform`, `lawn-gnome-mm` and `lawn-gnome-site`), `APP_DOMAIN` (default
  `lawn-gnome-panic`), `APP_ENV`/`ENVIRONMENT`, `APP_VERSION`, `GIT_COMMIT`/`COMMIT_SHA`, `POD_NAME`/`HOSTNAME`,
  `NAMESPACE`/`POD_NAMESPACE` and `NODE_NAME`. These become the OTel resource attributes (`service.name`,
  `service.namespace`, `deployment.environment`, `k8s.pod.name`, ...).

Nothing logged or traced carries a player name (not even a rejected one), chat, room code, account id, handle, IP
address, or, outside the site's access log, user agent.

### Locally

```bash
npm run dev -w packages/mp-server       # ws://localhost:8787/ws, the games use it on localhost
npm run dev -w games/sample-3d          # open two tabs, pick ONLINE, press PLAY in both
docker build -f packages/mp-server/Dockerfile -t lawn-gnome-mm . && docker run -p 8787:8080 lawn-gnome-mm
```

### Alternatives

| Host | Cost | Rolling updates | Notes |
| --- | --- | --- | --- |
| Fly.io (used until Nov 2026) | ~$0 idle, $2.19/mo always on | bluegreen, up to 5 min drain | Long-lived WebSockets, Docker native; the server's `MM_EXIT_WHEN_IDLE_S` self-stop was for its scale-to-zero |
| Google Cloud Run | Free tier, scales to zero | new revision per deploy, built in | Set max instances 1 (memory state) and a 60 min request timeout; WebSocket time is billed as busy time |
| k3s on an Oracle Cloud Always Free ARM VM | $0 | Kubernetes Deployment with `maxUnavailable: 0` and `terminationGracePeriodSeconds: 300` | Real Kubernetes for free, but you run the VM, TLS and upgrades yourself |
| Managed Kubernetes (GKE, EKS, AKS) | $70+/mo for nodes and control plane | native | Not worth it for one small container |

Kubernetes is not the cheap path for one container: the same image runs anywhere, so move to k3s only if you want to run several services on one free VM.

## Comparison

| Host | Cost | Setup effort | Custom domain | Best use |
| --- | --- | --- | --- | --- |
| GitHub Pages | Free (public repos) | Low: workflow already included | Yes | Source-controlled builds, the default choice |
| itch.io | Free | Low: upload a zip | Yes (paid tiers and custom domain setup) | Reaching players and discovery |
| Cloudflare Pages | Free | Low to medium | Yes | Fast global delivery, unlimited bandwidth |
| Netlify | Free tier | Low | Yes | Drag-and-drop deploys and simple previews |
