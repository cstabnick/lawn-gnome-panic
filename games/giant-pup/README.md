# Giant Pup

Raise the Giant Goofy Fetch Dog from Gnome Company in your own back yard: stroke it, feed it, fill its water, scrub it in the bath, throw the ball and teach it five tricks.

## Run

```
npm run dev -w games/giant-pup
```

Open http://localhost:5196.

## Play

- **✋ Pet**: stroke the dog with a finger or the mouse. Tap the grass to call it over.
- **🎾 Ball**: swipe up to throw (a faster flick throws further, sideways swipes curve the aim). The dog brings it back.
- **🛁 Bath**: rub the dog to scrub the mud off. Leave the bath and it shakes dry.
- **🍖 Feed / 💧 Water**: fill the bowls; the dog trots over.
- **⭐ Tricks**: Sit, Lie down, Shake, Spin, Roll over. Each try teaches a little; pet the dog within 3 s of a trick to praise it and it learns faster. A learned trick always works.

Needs (food, water, fun, clean, energy) fall slowly while you play and much more slowly while you're away; they never drop below 15, so the dog is never harmed. When tired it naps by the doghouse. The pet saves to localStorage (`giant-pup.save.v1`).

## Files

| File | What |
|---|---|
| `src/config.ts` | Tuning numbers and positions |
| `src/sim.ts` | Pure pet simulation: needs, tricks, mood |
| `src/brain.ts` | The dog's behaviour and the ball |
| `src/dog.ts` | The dog rig (Gnome Company's dog, split into poseable parts) and its 13 poses |
| `src/scene.ts`, `src/fx.ts` | The yard, the player's gnome, particle effects |
| `src/ui.ts`, `src/audio.ts` | DOM HUD and synthesized sounds |
| `src/main.ts` | Wiring: renderer, camera, pointer input |

Single player: a pet game is played alone, and a shared dog park would double its size. Not done yet: walks outside the yard, toys other than the ball, a shop.
