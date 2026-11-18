package names

import (
	"errors"
	"math/rand/v2"
	"regexp"
	"strings"
	"testing"
)

func TestTidy(t *testing.T) {
	cases := map[string]string{
		"  Mossy \t Boots  ": "Mossy Boots",
		"Mo​ssy":             "Mossy",
		"a\u0007b":           "ab",
	}
	for in, want := range cases {
		if got := Tidy(in); got != want {
			t.Errorf("Tidy(%q) = %q, want %q", in, got, want)
		}
	}
}

func TestCheck(t *testing.T) {
	ok := []string{"Gnome1234", "Mossy Boots", "18 letters abcdef", "😀😀", "Classic", "Scunthorpe"}
	for _, in := range ok {
		// Scunthorpe: the TS filter (obscenity) allows it. If go-away flags it, this case is
		// expected to fail and must be moved to the error list below with a note.
		if _, err := Check(in); err != nil {
			t.Errorf("Check(%q) error %v, want ok", in, err)
		}
	}

	if _, err := Check("x"); !errors.Is(err, ErrTooShort) {
		t.Errorf("Check(\"x\") = %v, want ErrTooShort", err)
	}
	if _, err := Check(strings.Repeat("a", 19)); !errors.Is(err, ErrTooLong) {
		t.Errorf("19 letters = %v, want ErrTooLong", err)
	}
	if got, err := Check(strings.Repeat("a", 18)); err != nil || got != strings.Repeat("a", 18) {
		t.Errorf("18 letters = %q, %v, want ok", got, err)
	}
	for _, in := range []string{"shit", "sh1t"} {
		if _, err := Check(in); !errors.Is(err, ErrNotAllowed) {
			t.Errorf("Check(%q) = %v, want ErrNotAllowed", in, err)
		}
	}
	if _, err := Check(" a "); !errors.Is(err, ErrTooShort) {
		t.Errorf("Check(\" a \") = %v, want ErrTooShort (checked after tidy)", err)
	}
}

func TestRandomName(t *testing.T) {
	r := rand.New(rand.NewPCG(1, 2))
	re := regexp.MustCompile(`^Gnome[1-9][0-9]{3}$`)
	for i := 0; i < 200; i++ {
		n := RandomName(r)
		if !re.MatchString(n) {
			t.Fatalf("RandomName() = %q, does not match %s", n, re)
		}
		if _, err := Check(n); err != nil {
			t.Fatalf("RandomName() %q fails Check: %v", n, err)
		}
	}
}

func TestRandomHandle(t *testing.T) {
	r := rand.New(rand.NewPCG(1, 2))
	re := regexp.MustCompile(`^[a-z]+-[a-z]+-[1-9][0-9]{3}$`)
	for i := 0; i < 200; i++ {
		h := RandomHandle(r)
		if !re.MatchString(h) {
			t.Fatalf("RandomHandle() = %q, does not match %s", h, re)
		}
	}
	if len(adjectives) != 32 || len(nouns) != 32 {
		t.Fatalf("want 32 adjectives and 32 nouns, got %d and %d", len(adjectives), len(nouns))
	}
	for _, w := range append(append([]string{}, adjectives...), nouns...) {
		if _, err := Check(w); err != nil {
			t.Errorf("word %q fails Check: %v", w, err)
		}
	}
}
