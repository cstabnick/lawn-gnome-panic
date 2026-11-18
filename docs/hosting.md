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

### Logging (OpenTelemetry)

All three images follow the whale-net logging standard (whale-net/everything `docs/LOGGING_ENV_VARS.md`) and keep their
old plain logs unless `ENABLE_OTEL_LOGGING` is `true`, `1` or `yes`:

| Image | With `ENABLE_OTEL_LOGGING` on |
| --- | --- |
| platform (`packages/platform-server`, `internal/obs`) | whale-net JSON lines on stdout, exported over OTLP gRPC, plus one line per RPC (`grpc_method`, `grpc_code`, `duration_ms`) |
| matchmaker (`packages/mp-server`, `src/otel.ts`) | every event-log line (server events and client `/t` batches) also exported over OTLP gRPC; stdout unchanged |
| site (`deploy/otel-logging.sh`) | access log as whale-net JSON lines on stdout with OTel HTTP keys (`http.request.method`, `url.path`, `http.response.status_code`, ...). nginx cannot push OTLP: the collector has to read the pod's stdout |

Shared variables: `OTEL_EXPORTER_OTLP_ENDPOINT` (or `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`; host:port or `http://host:port`, insecure gRPC,
default `localhost:4317`; on the cluster `otel-collector-collector.logs.svc.cluster.local:4317`), `OTEL_SDK_DISABLED=true` /
`OTEL_LOGS_DISABLED=true` to switch export off again, and the identity: `APP_NAME` (defaults `lawn-gnome-platform`,
`lawn-gnome-mm`, `lawn-gnome-site`), `APP_DOMAIN` (default `lawn-gnome-panic`), `APP_ENV`/`ENVIRONMENT`, `APP_VERSION`,
`GIT_COMMIT`/`COMMIT_SHA`, `POD_NAME`/`HOSTNAME`, `NAMESPACE`/`POD_NAMESPACE`, `NODE_NAME`. These become the OTel resource
attributes `service.name`, `service.namespace`, `deployment.environment`, `service.version`, `vcs.commit.id`, `k8s.pod.name`,
`k8s.namespace.name`, `k8s.node.name`. Nothing exported carries a player name, chat, room code or IP address.

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
