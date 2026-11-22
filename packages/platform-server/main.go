// The platform service: player accounts and cloud saves for the arcade (gnome.user.v1.UserService and
// gnome.save.v1.SaveService over Connect), and hitch reports from the opt-in profiler (gnome.profile.v1.ProfileService).
// Sign-in is Keycloak (see internal/auth); accounts live in Postgres (see internal/store).
//
// Environment:
//
//	PORT              HTTP port (default 8080)
//	PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD, PGSSLMODE   the Postgres connection (libpq names)
//	PG_SEARCH_PATH    schema for the tables (default "gnome")
//	KEYCLOAK_ISSUER   default https://auth.whalenet.dev/realms/whalenet
//	KEYCLOAK_AUDIENCE default gnome-web
//	ALLOWED_ORIGINS   comma-separated CORS origins (default: the two arcade sites); local dev servers are always allowed
//	DELETE_GRACE      how long a deleted account can be restored, Go duration (default 168h)
//	PROFILE_RETENTION how long hitch reports are kept, Go duration (default 720h)
//	ENABLE_OTEL_TRACING  true/1/yes: export spans over OTLP gRPC (one per RPC, per Postgres query, per JWKS fetch,
//	                  per purge run); log lines inside a span carry trace_id/span_id
//	ENABLE_OTEL_METRICS  true/1/yes: export metrics every 60 s (RPC durations, account and save counts, pool and Go
//	                  runtime stats) to the same collector
//	ENABLE_OTEL_LOGGING  true/1/yes: also export the logs over OTLP gRPC to OTEL_EXPORTER_OTLP_ENDPOINT
//	                  (default localhost:4317). Logs are always whale-net JSON lines on stdout, one per RPC plus
//	                  account/save events (see internal/obs; identity from APP_NAME (default lawn-gnome-platform),
//	                  APP_DOMAIN, APP_ENV, POD_NAME, ...).
//
// Routes: /api/<Connect procedure> (e.g. POST /api/gnome.user.v1.UserService/GetMe) and GET /healthz.
package main

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"net/url"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"connectrpc.com/connect"
	connectcors "connectrpc.com/cors"
	"github.com/exaring/otelpgx"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/rs/cors"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/codes"

	"github.com/cstabnick/lawn-gnome-panic/packages/platform-server/gen/gnome/profile/v1/profilev1connect"
	"github.com/cstabnick/lawn-gnome-panic/packages/platform-server/gen/gnome/save/v1/savev1connect"
	"github.com/cstabnick/lawn-gnome-panic/packages/platform-server/gen/gnome/user/v1/userv1connect"
	"github.com/cstabnick/lawn-gnome-panic/packages/platform-server/internal/auth"
	"github.com/cstabnick/lawn-gnome-panic/packages/platform-server/internal/obs"
	"github.com/cstabnick/lawn-gnome-panic/packages/platform-server/internal/service"
	"github.com/cstabnick/lawn-gnome-panic/packages/platform-server/internal/store"
)

// Default CORS origins: the two arcade sites. Any http://localhost:<port> and http://127.0.0.1:<port> is also
// allowed (every game's dev server has its own port), see allowOrigin.
const defaultOrigins = "https://gnome.whalenet.app,https://cstabnick.github.io"

// allowOrigin: an exact match from ALLOWED_ORIGINS, or a local dev server (http, localhost or 127.0.0.1, any port).
func allowOrigin(allowed []string) func(*http.Request, string) bool {
	return func(_ *http.Request, origin string) bool {
		for _, a := range allowed {
			if origin == a {
				return true
			}
		}
		u, err := url.Parse(origin)
		return err == nil && u.Scheme == "http" && (u.Hostname() == "localhost" || u.Hostname() == "127.0.0.1")
	}
}

func env(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}

func main() {
	obs.Setup("lawn-gnome-platform")
	defer func() {
		flushCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		_ = obs.Shutdown(flushCtx)
	}()

	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	// pgx reads PGHOST/PGUSER/... when the connection string is empty.
	pgCfg, err := pgxpool.ParseConfig("")
	if err != nil {
		obs.Fatal("postgres config", "error", err)
	}
	pgCfg.ConnConfig.RuntimeParams["search_path"] = env("PG_SEARCH_PATH", "gnome")
	pgCfg.MaxConns = 8
	if obs.TracingEnabled() {
		pgCfg.ConnConfig.Tracer = otelpgx.NewTracer() // a span per query, on the global tracer provider
	}
	pool, err := pgxpool.NewWithConfig(ctx, pgCfg)
	if err != nil {
		obs.Fatal("postgres", "error", err)
	}
	defer pool.Close()
	if obs.MetricsEnabled() {
		// db.client.connections.* for the pool, on the global meter provider.
		if err := otelpgx.RecordStats(pool); err != nil {
			slog.Error("pool metrics", "logger", "obs", "error", err)
		}
	}
	pg := store.NewPostgres(pool)
	migrateCtx, cancel := context.WithTimeout(ctx, 60*time.Second)
	migrateStart := time.Now()
	if err := pg.Migrate(migrateCtx); err != nil {
		obs.Fatal("migrate", "error", err)
	}
	cancel()
	slog.Info("database ready", "logger", "store", "db.system", "postgresql", "db.namespace", pgCfg.ConnConfig.Database,
		"db.schema", pgCfg.ConnConfig.RuntimeParams["search_path"], "server.address", pgCfg.ConnConfig.Host,
		"pool.max_conns", pgCfg.MaxConns, "migrate_ms", time.Since(migrateStart).Milliseconds())

	grace, err := time.ParseDuration(env("DELETE_GRACE", "168h"))
	if err != nil {
		obs.Fatal("DELETE_GRACE", "error", err)
	}
	verifier := auth.NewKeycloakVerifier(ctx, auth.KeycloakConfig{
		Issuer:   strings.TrimSuffix(env("KEYCLOAK_ISSUER", "https://auth.whalenet.dev/realms/whalenet"), "/"),
		Audience: env("KEYCLOAK_AUDIENCE", "gnome-web"),
	})
	users := service.NewUserService(pg, verifier, service.Options{DeleteGrace: grace})
	retention, err := time.ParseDuration(env("PROFILE_RETENTION", "720h"))
	if err != nil {
		obs.Fatal("PROFILE_RETENTION", "error", err)
	}

	opts := []connect.HandlerOption{connect.WithInterceptors(obs.Interceptor())}
	api := http.NewServeMux()
	api.Handle(userv1connect.NewUserServiceHandler(users, opts...))
	// Saves are up to 512 KiB of JSON; allow a little more for the envelope.
	api.Handle(savev1connect.NewSaveServiceHandler(service.NewSaveService(users), append(opts, connect.WithReadMaxBytes(600*1024))...))
	// A hitch batch is at most 60 hitches of 64 spans; 256 KiB is plenty.
	api.Handle(profilev1connect.NewProfileServiceHandler(service.NewProfileService(pg, users, service.ProfileOptions{}), append(opts, connect.WithReadMaxBytes(256*1024))...))

	mux := http.NewServeMux()
	mux.Handle("/api/", http.StripPrefix("/api", api))
	mux.HandleFunc("GET /healthz", func(w http.ResponseWriter, r *http.Request) {
		pingCtx, cancel := context.WithTimeout(r.Context(), 2*time.Second)
		defer cancel()
		if err := pool.Ping(pingCtx); err != nil {
			http.Error(w, "db: "+err.Error(), http.StatusServiceUnavailable)
			return
		}
		_, _ = w.Write([]byte("ok\n"))
	})

	handler := cors.New(cors.Options{
		AllowOriginRequestFunc: allowOrigin(strings.Split(env("ALLOWED_ORIGINS", defaultOrigins), ",")),
		AllowedMethods:         connectcors.AllowedMethods(),
		AllowedHeaders:         append(connectcors.AllowedHeaders(), "Authorization"),
		ExposedHeaders:         connectcors.ExposedHeaders(),
		MaxAge:                 7200,
	}).Handler(mux)

	// Deleted accounts past their grace period, and hitch reports past PROFILE_RETENTION, go once an hour.
	go func() {
		t := time.NewTicker(time.Hour)
		defer t.Stop()
		for {
			start := time.Now()
			purgeCtx, span := obs.Tracer().Start(ctx, "purge expired accounts")
			if n, err := pg.PurgeExpired(purgeCtx, start); err != nil {
				span.RecordError(err)
				span.SetStatus(codes.Error, "purge failed")
				slog.ErrorContext(purgeCtx, "purge failed", "logger", "purge", "error", err)
			} else {
				span.SetAttributes(attribute.Int64("purge.count", int64(n)))
				obs.AccountsPurged.Add(purgeCtx, n)
				if n > 0 {
					slog.InfoContext(purgeCtx, "purged deleted accounts", "logger", "purge", "count", n, "duration_ms", time.Since(start).Milliseconds())
				}
			}
			span.End()
			if n, err := pg.PurgeHitches(ctx, start.Add(-retention)); err != nil {
				slog.ErrorContext(ctx, "hitch purge failed", "logger", "purge", "error", err)
			} else if n > 0 {
				slog.InfoContext(ctx, "purged old hitch sessions", "logger", "purge", "count", n)
			}
			select {
			case <-ctx.Done():
				return
			case <-t.C:
			}
		}
	}()

	srv := &http.Server{Addr: ":" + env("PORT", "8080"), Handler: handler, ReadHeaderTimeout: 10 * time.Second}
	go func() {
		<-ctx.Done()
		slog.Info("shutting down", "logger", "server", "grace_s", 15)
		shutdownCtx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
		defer cancel()
		_ = srv.Shutdown(shutdownCtx)
	}()
	slog.Info("platform listening", "logger", "server", "addr", srv.Addr, "delete_grace_h", int64(grace.Hours()),
		"keycloak.issuer", env("KEYCLOAK_ISSUER", "https://auth.whalenet.dev/realms/whalenet"))
	if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
		obs.Fatal("serve", "error", err)
	}
}
