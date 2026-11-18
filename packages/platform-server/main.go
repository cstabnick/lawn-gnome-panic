// The platform service: player accounts and cloud saves for the arcade (gnome.user.v1.UserService and
// gnome.save.v1.SaveService over Connect).
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
//
// Routes: /api/<Connect procedure> (e.g. POST /api/gnome.user.v1.UserService/GetMe) and GET /healthz.
package main

import (
	"context"
	"errors"
	"log"
	"net/http"
	"net/url"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"connectrpc.com/connect"
	connectcors "connectrpc.com/cors"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/rs/cors"

	"github.com/cstabnick/lawn-gnome-panic/packages/platform-server/gen/gnome/save/v1/savev1connect"
	"github.com/cstabnick/lawn-gnome-panic/packages/platform-server/gen/gnome/user/v1/userv1connect"
	"github.com/cstabnick/lawn-gnome-panic/packages/platform-server/internal/auth"
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
	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	// pgx reads PGHOST/PGUSER/... when the connection string is empty.
	pgCfg, err := pgxpool.ParseConfig("")
	if err != nil {
		log.Fatalf("postgres config: %v", err)
	}
	pgCfg.ConnConfig.RuntimeParams["search_path"] = env("PG_SEARCH_PATH", "gnome")
	pgCfg.MaxConns = 8
	pool, err := pgxpool.NewWithConfig(ctx, pgCfg)
	if err != nil {
		log.Fatalf("postgres: %v", err)
	}
	defer pool.Close()
	pg := store.NewPostgres(pool)
	migrateCtx, cancel := context.WithTimeout(ctx, 60*time.Second)
	if err := pg.Migrate(migrateCtx); err != nil {
		log.Fatalf("migrate: %v", err)
	}
	cancel()

	grace, err := time.ParseDuration(env("DELETE_GRACE", "168h"))
	if err != nil {
		log.Fatalf("DELETE_GRACE: %v", err)
	}
	verifier := auth.NewKeycloakVerifier(ctx, auth.KeycloakConfig{
		Issuer:   strings.TrimSuffix(env("KEYCLOAK_ISSUER", "https://auth.whalenet.dev/realms/whalenet"), "/"),
		Audience: env("KEYCLOAK_AUDIENCE", "gnome-web"),
	})
	users := service.NewUserService(pg, verifier, service.Options{DeleteGrace: grace})

	api := http.NewServeMux()
	api.Handle(userv1connect.NewUserServiceHandler(users))
	// Saves are up to 512 KiB of JSON; allow a little more for the envelope.
	api.Handle(savev1connect.NewSaveServiceHandler(service.NewSaveService(users), connect.WithReadMaxBytes(600*1024)))

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

	// Deleted accounts past their grace period go once an hour.
	go func() {
		t := time.NewTicker(time.Hour)
		defer t.Stop()
		for {
			if n, err := pg.PurgeExpired(ctx, time.Now()); err != nil {
				log.Printf("purge: %v", err)
			} else if n > 0 {
				log.Printf("purged %d deleted account(s)", n)
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
		shutdownCtx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
		defer cancel()
		_ = srv.Shutdown(shutdownCtx)
	}()
	log.Printf("platform on %s", srv.Addr)
	if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
		log.Fatal(err)
	}
}
