# Privacy

Lawn Gnome Panic is a hobby game. It collects a small amount of anonymous data to find bugs and see how the game is played. No accounts, no ads, no cookies, nothing sold or shared.

## What the game sends

When the game can reach its matchmaking server, it sends short reports to that server:

- **Page loads:** whether the device has a touch screen, and the window size rounded to 100 pixels.
- **Runs:** mode (solo, battle royale, online), level, win or loss, time survived, kills, and what ended the run (a mower type, the zone, or "other").
- **Online play:** joining a queue (public or room code, not the code itself), match size, whether you hosted, how the match ended for you (finished, lost connection, game went to sleep, quit), and host changes.
- **Errors:** the message, file name and line of up to 5 JavaScript errors per page load.

Each report carries two random IDs: one stored in your browser (to tell visits apart) and one per page load. Neither is linked to who you are.

## What it does not collect

No player names, chat messages, room codes, or anything else you type. No IP addresses are stored: the server uses your address only for a moment, to limit how many reports one address can send per minute.

## Online play

To play online, the game connects to the matchmaking server, which passes your chosen name, character, colour, chat lines and in-game positions to the other players in your match. The server keeps these only in memory while you are connected. Chat is filtered for offensive words before it is passed on.

The server also logs anonymous events (a match started, a player left or timed out, hosting changed) without names or chat. Server logs are kept by the host, Fly.io, for a short time.

## Saved data in your browser

Your progress (acorns, upgrades, unlocked levels, settings, chosen name) and the random ID above are saved in your browser's local storage. Clearing site data removes them.

## Turning reports off

Reports are not sent when your browser's Do Not Track setting is on, or when the page address ends in `?telemetry=0`.

## Questions

Open an issue at https://github.com/cstabnick/lawn-gnome-panic/issues.
