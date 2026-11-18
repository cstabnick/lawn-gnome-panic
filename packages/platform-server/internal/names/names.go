// Package names validates display names with the same rules as packages/mp/src/textFilter.ts
// (checkName), and makes the server-assigned handles ("mossy-boots-4821").
package names

import (
	"errors"
	"fmt"
	"math/rand/v2"
	"strings"
	"unicode"
	"unicode/utf8"

	goaway "github.com/TwiN/go-away"
)

// Same limits as textFilter.ts. Lengths are counted in Unicode code points (runes).
const (
	NameMin = 2
	NameMax = 18
)

// Messages, word for word the same as textFilter.ts checkName, so both sides show the same text.
var (
	ErrTooShort   = errors.New("Names need at least 2 characters.")
	ErrTooLong    = errors.New("Names are at most 18 characters.")
	ErrNotAllowed = errors.New("That name is not allowed. Pick another one.")
)

// isControl reports whether r is one of the characters textFilter.ts CONTROL_RE removes:
// C0 and C1 controls, zero-width and bidi format marks, and the BOM.
func isControl(r rune) bool {
	switch {
	case r <= 0x1f:
		return true
	case r >= 0x7f && r <= 0x9f:
		return true
	case r >= 0x200b && r <= 0x200f:
		return true
	case r >= 0x202a && r <= 0x202e:
		return true
	case r >= 0x2060 && r <= 0x206f:
		return true
	case r == 0xfeff:
		return true
	}
	return false
}

// Tidy removes control and invisible characters, collapses whitespace runs to one space and trims.
// Same character classes as textFilter.ts CONTROL_RE.
func Tidy(raw string) string {
	var b strings.Builder
	b.Grow(len(raw))
	inSpace := false
	for _, r := range raw {
		if isControl(r) {
			continue
		}
		if unicode.IsSpace(r) {
			if !inSpace {
				b.WriteByte(' ')
				inSpace = true
			}
			continue
		}
		inSpace = false
		b.WriteRune(r)
	}
	return strings.TrimSpace(b.String())
}

// Check returns the tidied name, or one of ErrTooShort, ErrTooLong, ErrNotAllowed.
func Check(raw string) (string, error) {
	name := Tidy(raw)
	n := utf8.RuneCountInString(name)
	if n < NameMin {
		return "", ErrTooShort
	}
	if n > NameMax {
		return "", ErrTooLong
	}
	if goaway.IsProfane(name) {
		return "", ErrNotAllowed
	}
	return name, nil
}

// RandomName is a default display name for a new account: "Gnome" + 4 digits (1000-9999), like
// packages/gnome's LocalGnomeStore.
//
// The profanity filter also reads digits as letters ("4559" is "ass" in leetspeak), so a digit
// group that Check rejects is drawn again. Most draws pass, so this ends after a few tries.
func RandomName(r *rand.Rand) string {
	for {
		n := fmt.Sprintf("Gnome%d", 1000+r.IntN(9000))
		if _, err := Check(n); err == nil {
			return n
		}
	}
}

// Short, clean, lower-case garden words for handles.
var adjectives = []string{
	"mossy", "sunny", "muddy", "leafy", "dewy", "misty", "rosy", "shady",
	"breezy", "cozy", "dusty", "crisp", "fuzzy", "grassy", "hardy", "jolly",
	"lively", "mellow", "nimble", "quiet", "rustic", "snowy", "spry", "tidy",
	"tiny", "velvet", "wild", "windy", "woolly", "zesty", "bright", "gentle",
}

var nouns = []string{
	"boots", "acorn", "trowel", "tulip", "pebble", "sprout", "clover", "bramble",
	"hedge", "puddle", "lantern", "teapot", "wheel", "bucket", "ladder", "pinecone",
	"mushroom", "daisy", "frog", "hedgehog", "sparrow", "robin", "bee", "snail",
	"fern", "moss", "willow", "lily", "basket", "rake", "kettle", "shovel",
}

// RandomHandle is a server-assigned handle: adjective-noun-NNNN, lower case ASCII, e.g. "mossy-boots-4821".
func RandomHandle(r *rand.Rand) string {
	adj := adjectives[r.IntN(len(adjectives))]
	noun := nouns[r.IntN(len(nouns))]
	return fmt.Sprintf("%s-%s-%d", adj, noun, 1000+r.IntN(9000))
}
