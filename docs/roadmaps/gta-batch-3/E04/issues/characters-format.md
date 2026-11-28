# Character block format (issues 05-07)

One block per character, in this exact shape (Markdown, no tables inside a block):

```
### <Full name> (`<id>`)

- **Role / faction:** ...
- **New or existing:** existing (CAST key) | new (CAST key to add)
- **First / last main quest:** #N <id> / #M <id>   (from spine section 4; for side-only characters: their side quests)
- **Want / fear / secret:** want ...; fear ...; secret ... (secrets are loose threads: hint, never answer)
- **Arc by act:** I: ...; II: ...; III: ...; IV: ...   (one line each; "absent" where they do not appear)
- **Voice (for `src/voice/voices.ts` and lines):** pace, register, tics, two example lines of intent of at most 16 words
- **Body and visual hook (for a CAST preset):** hat (colour, shape), coat, beard, glasses, prop, how they move
- **Vehicle:** what they drive or ride (an existing vehicle kind or "none")
- **Home:** <name> (slot from spine section 6) · **Work:** <place>
- **L58 visibility:** acknowledged (seen in quests: list) | never shown
- **Relationships:** 2-4 lines: who they love, owe, fear or fight, among the cast
```

Rules:
- Homes, workplaces, ids and first/last quests come from `docs/roadmaps/gta-batch-3/E04/spine.md` sections 4 and 6; copy them.
- Existing characters: stay faithful to their lore entry (`docs/lore/entries/apocrypha/<id>.md`, find it with
  `npm run lore -- find <name>`) and to `docs/design/gnome-theft-auto/direction/bible.md` section 2 where they have a
  section there. Extend them for the new acts; do not contradict.
- New characters: invent want, fear, secret, voice and look that fit the spine premises they appear in, and make each
  voice clearly different from everyone else's (a build worker gives each a distinct `VOICES` entry).
- Start the file with a one-line heading `## <section title>` and then the blocks in the order listed in your issue.
