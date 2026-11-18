# Privacy

Lawn Gnome Panic is a hobby game. It collects a small amount of anonymous data to find bugs and see how the game is played. Accounts are optional: you never need one to play. No ads, no cookies, nothing sold or shared.

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

The server also logs anonymous events (a match started, a player left or timed out, hosting changed) without names or chat. Server logs are kept on the whale-net Kubernetes cluster that runs the server, for a short time.

## Accounts (optional)

You can sign in on the "Your gnome" page (`/me/`) so your gnome follows you to other devices. Sign-in goes through
whale-net's Keycloak (`auth.whalenet.dev`) with your Google account:

- **Keycloak** keeps what Google shares when you sign in: your Google account id, email address and name. It is used
  only to sign you in.
- **The game's account service** stores only: Keycloak's id for you, your gnome's display name and look, a random
  handle (like `mossy-boots-4821`), when the account was made, and whether it is being deleted. No email or real name.
- Other players can see your gnome's display name and look, as they already can online.
- Your browser keeps the sign-in session (tokens) in local storage. Signing out removes it.

**Deleting:** "Delete account" on the `/me/` page removes your gnome and account from the game's service after 7 days.
Signing in again before then cancels the deletion. To also remove your Keycloak sign-in record, open an issue (link
below).

## Saved data in your browser

Your progress (acorns, upgrades, unlocked levels, settings, chosen name) and the random ID above are saved in your browser's local storage. Clearing site data removes them.

## Turning reports off

Reports are not sent when your browser's Do Not Track setting is on, or when the page address ends in `?telemetry=0`.

## Questions

Open an issue at https://github.com/cstabnick/lawn-gnome-panic/issues.
