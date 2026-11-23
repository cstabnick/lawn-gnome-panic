package store

import (
	"context"
	"os"
	"testing"
)

func TestPostgresRooms(t *testing.T) {
	if os.Getenv("PLATFORM_TEST_DATABASE_URL") == "" {
		t.Skip("PLATFORM_TEST_DATABASE_URL not set")
	}
	pg := NewPostgres(newPGPool(t))
	if err := pg.Migrate(context.Background()); err != nil {
		t.Fatalf("migrate: %v", err)
	}
	testRoomStore(t, pg)
}
