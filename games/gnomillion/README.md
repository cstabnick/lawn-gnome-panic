# Once in a Gnomillion

A slow, friends-only take on Krillion: each round the room gets a prompt ("Name a garden pest"), everybody
answers whenever they like (minutes to a day), and answers score by how RARE they are among the room. The
most common answer earns a Plankton 10, a one-of-a-kind answer up to One in a Gnomillion 100.

Run: `npm run dev -w games/gnomillion`. Tests: `npm test -w games/gnomillion`.

Persistence: no server stores anything. The host's browser keeps the room in localStorage; friends join with
the room code, answers wait on their device until the host is online. See `src/net/protocol.ts`.
