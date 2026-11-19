# @lawn/sync

Multi-tab save liveness. There are no accounts yet, so a save is a localStorage key shared by every tab of one browser
(another device has its own, separate save). Rules every store follows:

1. Re-read the key right before writing; never write from a stale in-memory copy.
2. Merge what can be merged: achievements (max progress, earliest unlock), gnome name vs outfit (a patch touches only its own fields).
3. Where it cannot (the outfit as a whole, one volume slider), the latest write wins.
4. `watchKey(key, cb)` hears other tabs' writes; `showSyncNotice(text)` tells the player. A running game never swaps the gnome mid-round.
