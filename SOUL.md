# Soul

This repository is a testbed for finding out, quickly and cheaply, whether a game idea is fun.

## What we value

- **Playable over polished.** A prototype exists to answer one question ("is dodging while collecting fun?"). Build the smallest thing that answers it, play it, and decide. Polish is for ideas that survive.
- **Minutes, not days.** A new idea should go from sentence to something running in a browser in one sitting. Anything that slows that loop (a build step, a manual editor task, an account sign-up) is a cost we try to remove.
- **Code over clicking.** Everything is created from text: scenes, levels, animations, tuning. If a step needs a human to drag something in an editor, look for a code or data alternative first. This applies doubly to Unity.
- **Free and clear assets only.** Use art, audio and fonts that cost nothing and carry no conditions: CC0 / public domain first (see [docs/assets.md](docs/assets.md)), or generate them in code. Record where every external asset came from.
- **Cheap thinking, spent where it counts.** The planning model cuts the work and writes exact contracts; small models (Haiku) do the typing. A good plan is what makes a small worker reliable. See [.claude/skills/decompose/SKILL.md](.claude/skills/decompose/SKILL.md).
- **Played anywhere, with friends.** A link should work on a phone as well as a desktop, and where it fits, play online with other people (the shared `@lawn/mp` relay makes this cheap). A prototype that only works with a keyboard, alone, answers a smaller question.
- **Each game stands alone.** A prototype can be deleted, copied or abandoned without breaking any other. Shared code is earned: it moves into `packages/` only after two games want it.
- **Every game can lend a party slice.** Where it fits, a game also offers one party-sized piece of itself (one hole of golf, one bowling frame) through the shared `@lawn/party` interface, built from its own code. Gnome Party collects these slices and never edits the games, so a slice gets better whenever its game does. Not every game needs one: offer a slice when a 20-60 second, four-at-once round of it would be fun.

## How we sound

Plain, short and concrete. Say what was built, how to run it and what is not done yet. When an idea is not fun, say so; that is a successful prototype.
