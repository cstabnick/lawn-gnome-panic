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

### Default: Fly.io, scale to zero (about $0-2.19 a month)

Fly runs the Docker image directly. The config is in `fly.toml` at the repo root.

- **Cost:** a shared-cpu-1x 256 MB machine is $0.0030/hour, $2.19/month if it never stops. With `auto_stop_machines` it stops a few minutes after the last player leaves and starts on the next connection (1-2 s cold start), so a prototype that is played now and then costs cents. A stopped machine bills only its root filesystem ($0.15/GB/month). Bandwidth for a full 20-player match is roughly 100-200 MB, about $0.002-0.004 each.
- **Rolling updates:** `strategy = "bluegreen"`. The new machine starts and must pass `/healthz` before traffic moves. The old machine gets SIGTERM, stops matchmaking (queued players are told to press PLAY again, which reaches the new machine) and lets running matches finish for up to `kill_timeout` (300 s, Fly's maximum; a royale match lasts 2-4 minutes).
- **One machine only:** matchmaking state is in memory. Keep `fly scale count 1`.

Setup, once:

1. Install flyctl and sign in: `fly auth login` (needs a card on file).
2. Pick a unique app name, put it in `fly.toml` (`app = ...`), then `fly launch --no-deploy --copy-config` and `fly deploy`.
3. `fly scale count 1`.
4. Point the game at it: in the GitHub repository, Settings > Secrets and variables > Actions > Variables, add `VITE_MP_URL` = `wss://<app>.fly.dev/ws`. The Pages build bakes it in.
5. For deploys on push: `fly tokens create deploy`, saved as the Actions secret `FLY_API_TOKEN`. `.github/workflows/server.yml` then tests and deploys the server whenever it changes on `main`.

Any other build can be pointed at a server with `?mp=wss://host/ws` in the page URL.

### Locally

```bash
npm run dev -w packages/mp-server       # ws://localhost:8787/ws, the games use it on localhost
npm run dev -w games/sample-3d          # open two tabs, pick ONLINE, press PLAY in both
docker build -f packages/mp-server/Dockerfile -t lawn-gnome-mm . && docker run -p 8787:8080 lawn-gnome-mm
```

### Alternatives

| Host | Cost | Rolling updates | Notes |
| --- | --- | --- | --- |
| Fly.io (default) | ~$0 idle, $2.19/mo always on | bluegreen, up to 5 min drain | Long-lived WebSockets, Docker native, config in code |
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
