# Game prototyping testbed

A place to turn game ideas into something playable in a browser, fast. Ideas are planned by a large model and built by small ones (Haiku), with free CC0 or code-generated assets.

- [SOUL.md](SOUL.md): what this repo values.
- [AGENTS.md](AGENTS.md): how agents work here (`CLAUDE.md` imports it).
- [docs/stack.md](docs/stack.md): which library for which kind of idea, and how Unity is driven without hand editing.
- [docs/assets.md](docs/assets.md): where free assets come from.
- [.claude/skills/decompose/SKILL.md](.claude/skills/decompose/SKILL.md): how a goal is cut into parallel Haiku issues.

## Quick start

```sh
npm install
npm run dev -w games/sample-dodge     # http://localhost:5173
npm run new -- my-idea                # copy the sample into games/my-idea
```

## Prototyping a new idea with Claude Code

Describe the idea, for example "prototype a game where you herd sheep with a dog using the mouse", and ask Claude to use the decompose skill. It writes a roadmap to `docs/roadmaps/` and runs the issues on Haiku workers in parallel.
