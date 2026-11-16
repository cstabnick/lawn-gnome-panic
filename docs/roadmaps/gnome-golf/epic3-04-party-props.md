Epic: 3 Trees, music, cigarillos and golf water · Issue 4: cigarillo in the mouth, smoke, and drinking golf water
Depends on: none

## Goal
While a cigarillo is lit, the golfer has it in his mouth: a little brown cigarillo poking out of the beard with a glowing tip and lazy smoke puffs. When the player cracks a golf water (beer), the golfer lifts a can to his mouth and drinks; the partner joins in with her own can. All visual, no gameplay.

## Read first
- `games/gnome-golf/src/party.ts`: how the golfer and partner models are created and posed each frame (`model.arms.left/right`, `model.rig`, the swing pose code)
- `games/gnome-golf/src/models/gnome.ts` lines 55-110 (rig layout: head sphere r 0.17 centred at y 0.8, nose at (0, 0.8, 0.17), beard cone centred at (0, 0.62, 0.07), arm pivots at (+-0.27, 0.62, 0) with the hand at local y -0.32; the model faces +z, its left is +x)
- `games/gnome-golf/src/config.ts`: `CONSUMABLES`, GameState fields `smokeShots`, `drinkTime`

## Change
- `games/gnome-golf/src/party.ts` only:
  1. **Cigarillo**: a group added to the golfer's `model.rig`: a brown cylinder (`CylinderGeometry(0.014, 0.016, 0.16, 8)`, 0x6b4423) with a thin gold band near the mouth end, rotated to point forward and slightly down and to the side, its mouth end at about (0.04, 0.74, 0.16) (just under the nose, out through the beard) and the other end at about (0.09, 0.71, 0.3). A glowing tip: small sphere r 0.017, `MeshBasicMaterial` orange (0xff6a1a) whose colour pulses between 0xff4a00 and 0xffb040 (slow breathing, plus a brighter flare every ~4 s as if puffing). Visible only while `state.smokeShots > 0` (in every phase, including 'drive' when riding the cart).
  2. **Smoke**: a small pool of ~14 sprite puffs (`THREE.Sprite` with a soft round white CanvasTexture, `transparent: true`, `depthWrite: false`, opacity 0..0.35). While smoking, emit one every 0.35 s at the tip's world position (`tip.getWorldPosition`); each puff rises 0.35 yd/s, drifts with the wind (`state.wind` yaw, 0.04 yd/s per mph), grows from scale 0.06 to 0.45 and fades out over 3 s. A bigger exhaled puff (3 puffs at once from the mouth, scale 0.15) at each flare.
  3. **Golf water can**: a can mesh (cylinder r 0.045, h 0.12, silver sides 0xd8d8d8 with a coloured band 0x2a6fd6 printed as a second slightly larger cylinder 0.06 tall, a darker top disc) for each gnome, parented to `model.arms.left` at the hand (local (0, -0.34, 0.04)), hidden unless drinking.
     While `state.drinkTime >= 0` (phase 'aim' only, see config `CONSUMABLES.drinkSeconds` = 2.4 s), override the golfer's left arm after his normal pose: u = drinkTime / drinkSeconds; raise phase u < 0.25: arm `rotation.x` from 0 to -2.3 (hand to the mouth) and `rotation.z` to -0.35 (towards the face); hold and tilt the head back slightly (`model.rig.rotation.x = -0.12`) for 0.25 <= u < 0.75; lower for u >= 0.75. The can is visible for the whole sip. The right arm keeps its normal pose.
     The partner drinks too, starting 0.4 s later, the same motion on her left arm with her own can, scaled to the remaining time.
     After the sip, reset `rig.rotation.x` to 0.
  4. Keep everything else in party.ts working: the swing pose, cart parking, the drive, the holed celebration.

## Contract
`export function createParty(ctx: Ctx): System` unchanged. Read-only on `state`.

## Done when
- `cd /home/user/lawn-gnome-panic/games/gnome-golf && npx tsc --noEmit -p .` shows no errors in `src/party.ts`.
- With `state.smokeShots > 0` the cigarillo shows in the golfer's mouth with a glowing tip and rising smoke; with `state.drinkTime >= 0` both gnomes lift a can and drink.

## Out of scope
Every other file, especially `src/models/*`, `cartModel.ts`, and controls.ts (another worker is adding the buttons now).
