// Gnome Jesus's two-line temperament hint for each Gnomokedex page, keyed by species id from src/prefabs/dex.ts.
// Line 1: the temperament in the creature's terms. Line 2: how to get a photo of it. Dry and kind; no gore, no harm.
// Temperament words come from temperamentOf / TEMPERAMENT_LABEL in ./temperament, never from this file.

export const TEMPERAMENT_HINTS: Readonly<Record<string, readonly [string, string]>> = {
  sproutling: [
    'Curious and damp behind the leaf. It wants to know what you are doing.',
    'Hold still and let it come to look at you; the photo is in the looking.',
  ],
  kilnpup: [
    'Curious. It thinks you are a big cousin and will circle you twice to check.',
    'Stay close, keep the camera steady, and let it orbit into frame.',
  ],
  dewdrop: [
    'Curious. It wants a pebble tossed in it, and it will splash for you.',
    'Pester it gently and hold still; the splash is the picture.',
  ],
  mossback: [
    'Docile. It grazes under the rhubarb and trusts anything that stays calm.',
    'Walk up slowly and wait; it will carry on chewing while you shoot.',
  ],
  staghorn: [
    'Territorial. It guards its grubs and will rear its horns if you crowd it.',
    'Keep your distance, give it a moment, then calm it with the Flute for the shot.',
  ],
  thimblekin: [
    'Thief. It wants everything shiny, and it will take the bait and leave with it.',
    'Catch it mid-theft, with the bait still in its hands, before it bolts.',
  ],
  hoseleech: [
    'Territorial. It holds its sunny bank and will spray a warning if you push.',
    'Play the Flute and it sways instead of coiling; that is your window.',
  ],
  strawight: [
    'Sentinel. It guards the clover rows and will not leave its post for you.',
    'Stand still and centred; it lets you come in close while it keeps watch.',
  ],
  paperwasp: [
    'Territorial. It defends the Paper Spire and will display its stripes at you.',
    'Pester it on purpose, take the display, then give it room to settle.',
  ],
  unfired: [
    'Docile. It is slow, mostly water, and happy to be left in the sun.',
    'Be gentle and patient; it will sit still for a long, soft photograph.',
  ],
  grubthorn: [
    'Skittish. It is leading its clan south and bolts when the riders get close.',
    'Hold still and let it settle into the burrow before you try for the shot.',
  ],
  minimower: [
    'Aloof. It needs nothing from you and hums along by the Shed door.',
    'Hold the camera steady for two seconds and it will turn to pose.',
  ],
  armadillan: [
    'Shy. It curls up when the riders come near and unrolls for bait.',
    'Wait quietly; it will unroll on its own if you stop talking.',
  ],
  sunlizard: [
    'Docile. It basks on the warm stone and ignores everything while it does.',
    'Approach in the open and take your time; it will not mind the audience.',
  ],
  cactuskin: [
    'Sentinel. It flares its spines to warn you and then stays put.',
    'Show it plenty of respect and keep still; it will hold its ground for you.',
  ],
  tumblewight: [
    'Aloof. The wind rolls it, not you, and it pays you no mind at all.',
    'Hold steady for the rare pause; that is when it lets you see its face.',
  ],
  clogmaw: [
    'Curious. It surges toward any opening, so it always wants to move.',
    'A gentle Pester shoves it one pipe-length; use the pause for a clean shot.',
  ],
  rustcrab: [
    'Thief. It takes scrap nuts and whatever glints, and it sidles off with them.',
    'Put something shiny in its path, then catch it as it reaches for it.',
  ],
  kilnwarden: [
    'Sentinel. It tests whoever would light the Kiln, and it waits to see who you are.',
    'Pestering it fails the test, so be patient and let the test pass.',
  ],
  glowmoth: [
    'Curious. It circles any lantern, and a warm glow is all it asks.',
    'Hold a lantern near and let it circle; keep the camera still as it passes.',
  ],
  seamower: [
    'Territorial. It patrols the basin and churns bubbles when it feels crowded.',
    'Pester it, watch the bubbles, then wait for it to drift back into the frame.',
  ],
  cisterneel: [
    'Shy. It stays in the dark pipes and only shows itself to a still camera.',
    'Stop moving and wait; it will come out to look if you give it time.',
  ],
  drownedtoad: [
    'Shy. It asks only for a quiet sunken ledge, and it will hide if you are loud.',
    'Keep the noise down and wait for it to surface; the still moment is the photo.',
  ],
  barnacleknight: [
    'Sentinel. It stands by its tin-can helm and there are forty of them.',
    'Stay centred and patient; it will not move from its post, so you go to it.',
  ],
  kelpsprite: [
    'Curious. It plays in the sunbeams and loops back to see what you are up to.',
    'Hold still in the light and let it swoop round for a clear shot.',
  ],
  magpiethief: [
    'Thief. It hunts shiny things, and the lens itself is bait to it.',
    'Catch it mid-swoop as it goes for the glint, before it flies off with it.',
  ],
  hedgewright: [
    'Territorial. It keeps the Wildlings out of its timber and watches the hedge.',
    'Stay outside its patch, let it see you are no logger, then take the shot.',
  ],
  acorndrake: [
    'Aloof. It perches high on warm resin and looks down on everyone.',
    'Hold the camera steady below it and it will turn its head to pose.',
  ],
  bellrat: [
    'Skittish. It rings a brass bell when startled, and the bell startles its neighbours.',
    'Move slowly and quietly; one ring sets off the whole hedge, so mind the noise.',
  ],
  gnomespirit: [
    'Aloof. It keeps the lawn in balance: cut a little, water a little, and nod.',
    'Hold steady and wait; it turns to pose once the lawn is quiet again.',
  ],
  mooncap: [
    'Shy. It glows only when nobody is watching, and brightens for a steady camera.',
    'Keep still and look away a moment; it will light up when you look back.',
  ],
  starbeetle: [
    'Docile. It follows the light across the glass and will not mind you following it.',
    'Move with the light slowly and let it drift past the lens.',
  ],
  dewghost: [
    'Shy. It drifts into warm lanterns and hides when the room gets busy.',
    'Dim the noise and hold still; it will drift into the glow for you.',
  ],
  bonsaititan: [
    'Sentinel. Its roots stay in the porcelain pot, and it asks for time.',
    'Take your time with the shot; it rewards patience, not speed.',
  ],
  clockworkfrog: [
    'Curious. It hops fast, then slows, and hops up to be wound.',
    'Wait for the slow patch, then hold still while it comes up to you.',
  ],
  gnomejesus: [
    'Aloof. Gnome Jesus poses when he is ready, and not a minute before.',
    'Keep the camera steady and he will turn to face the lens. Obviously.',
  ],
  snowcap: [
    'Docile. It seeks a warm scarf and trusts everything that is warm.',
    'Approach with a mug of broth in mind and let it come to you.',
  ],
  icicleimp: [
    'Skittish. It hides in shade so its horns do not melt, and flees the glare.',
    'Stay in the shade yourself and hold still; it will come out on its own.',
  ],
  pinego: [
    'Shy. It rolls up like a pine cone when the riders come near.',
    'Wait quietly and let it unroll; it does so once it trusts the quiet.',
  ],
  frosthound: [
    'Curious. It wants a sprint round the Basin, and it races anything nearby.',
    'Run with it a few steps, then stop; it will look back at you for the shot.',
  ],
  chimneyowl: [
    'Aloof. It roosts on a chimney pot and turns only its head to see you.',
    'Hold the camera steady from below and wait for the head to turn.',
  ],
  frostking: [
    'Aloof. It wants the Basin left alone, and it will not be bothered by you.',
    'Pester it gently, not hard; the ice cracks, so keep the shot small and quick.',
  ],
};
