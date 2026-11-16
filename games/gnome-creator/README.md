# Gnome Creator

Make your gnome once: pick its colours and features, and every game in the arcade shows it, to you and to other players online.

The gnome is saved in the browser's localStorage under `gnome.profile.v1`. Every game on the same site shows it, and online games send it to other players as a look code (`g1.…`, 11 characters).

## Run

```
npm install            # once, from the repo root
npm run dev -w games/gnome-creator    # http://localhost:5186
npm run build -w games/gnome-creator
```

## How a game uses it

Games read the gnome through `createGnomeStore()` in `packages/gnome`. See `packages/gnome/README.md` for the API and the look code.

## Share code and links

The editor shows the gnome's share code. IMPORT takes a code from someone else. A link with `?gnome=<code>` opens the creator with that look (it is not saved until you press SAVE). The same link also works in every game, which is handy on dev servers on other ports, since those cannot share browser storage.

## Not done yet

- Names are not shared with the games yet: only the look is.
- No hats or other new parts: the look has the parts the model already has.
- No accounts: see `docs/design/gnome-platform.md` (in PR 38, not merged yet).
