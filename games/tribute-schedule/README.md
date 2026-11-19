# The Tribute Schedule

An eerie first-person domestic horror game built from the `#shitpost` (prod) and `#test2` (dev) whalebot logs. Survive from 12:00 AM to 6:00 AM in your apartment while keeping the Rotating Doner Cone fed, nodding along to the Fridge's 4-to-7 note motif, chirping back at the Smoke Detector before its third blink, toweling the Microwave, and paying the Printer's Scam Ledger tolls.

## Controls

- `W A S D` / `Arrow Keys` (or left touch joystick): Move
- `Mouse` (click canvas to lock) or right-side touch drag: Look around
- `E` / `Click` / `USE`: Pick up offering, place on Cone altar, towel Microwave, pay Printer toll, inspect TV
- `Space` / `N` / `NOD`: Nod along to the Fridge's notes
- `C` / `Q` / `CHIRP`: Chirp back at the Smoke Detector
- `F` / `LIGHT`: Toggle flashlight
- `L`: Open Scam Ledger & **Paste New Responses**

## Run & Test

```sh
npm run dev -w games/tribute-schedule
npm run build -w games/tribute-schedule
npm test -w games/tribute-schedule
```

See [EXTENDING.md](EXTENDING.md) for how to paste or commit new server responses.
