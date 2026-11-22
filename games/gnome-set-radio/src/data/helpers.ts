import type { GsrLevelId } from '../levels/loader';

export interface HelperGnomeProfile {
  levelId: GsrLevelId;
  name: string;
  title: string;
  hatColor: string;
  coatColor: string;
  accentColor: string;
  facts: readonly string[];
  hints: Record<string, string>;
  defaultHint: string;
}

export const HELPER_GNOMES: Record<GsrLevelId, HelperGnomeProfile> = {
  'velvet-keys': {
    levelId: 'velvet-keys',
    name: 'Pippi Pitchpipe',
    title: 'Conservatory Tuner',
    hatColor: '#ff4ecd',
    coatColor: '#3d2f5e',
    accentColor: '#00e5ff',
    facts: [
      'Velvet Keys Plaza is the 1st rung of the Frequency Ladder—its D Dorian chords stabilize the lower ley-lines!',
      'Maestro Upright was once an ordinary lounge piano until a Turfton FM jazz marathon woke him up!',
      'Double-jump mid-air (Space) to snap onto high rooftop rails or clear tall conservatory walls.',
      'Press 1, 2, 3 (or C) to swap between 3 Velvet Keys graffiti stencils—you can spray any wall or roof!',
    ],
    hints: {
      'vk-tag-billboards': 'Hit the south pink ramp or the side loft ramps (East/West) to reach all 4 rooftop billboards!',
      'vk-pluck-chase': 'Pluck hops around the south-east plaza—boost with Shift and spray (F) when close!',
      'vk-tune-dishes': 'Grind the West & East Loft ley-lines or ride the North Tower ramp to reach all 3 Relay Dishes.',
      'vk-boss-maestro': 'Climb the Conservatory Terrace (south ramp), then take the gold upper ramp to the 7m Penthouse Stage!',
      'vk-side-tilda': 'Tempo Acorns sit on the East Loft, South Kiosk, and the Conservatory upper roof!',
      'vk-side-vinyl': 'Chain a rail grind + mid-air trick + Air-Jump to bank 1,200+ pts in one combo!',
    },
    defaultHint: 'Take the pink Conservatory ramp or any side loft ramp—hit Space twice for an Air-Jump!',
  },
  'bongo-basin': {
    levelId: 'bongo-basin',
    name: 'Bam-Bam Bramble',
    title: 'Viaduct Percussion Rigger',
    hatColor: '#ff9100',
    coatColor: '#453328',
    accentColor: '#ffd740',
    facts: [
      'Bongo Basin locks the Archipelago’s Master Clock in A Mixolydian so power can climb past the highway!',
      'Every Bongo Pad resets your Air-Jump mid-flight—chain them to soar straight onto the 8.5m Crown Overpass!',
      'Spout the Fire Hydrant swears he arrived on the viaduct before the asphalt did.',
      'DJ Moleman’s 108.0 Subsoil Radio sneaks up from Turfton’s dirt right through the overpass pylons.',
    ],
    hints: {
      'bb-overpass-tags': 'Two billboards sit on the West/East Suspension Pylons (6.5m) and one on the 12m Bongo Crown!',
      'bb-bongo-chain': 'Skate onto the glowing twin Bongo Pads around the lower deck to launch skyward!',
      'bb-black-dew-relays': 'Check the West Pylon, East Pylon, and Crown Overpass for the 3 Black Dew relays.',
      'bb-clear-drumline': 'Ride the south orange ramp onto the 4m Lower Highway Deck—the 3 Conga Sentries patrol right across it!',
      'bb-boss-kora': 'Take the red viaduct ramp to 8.5m, then the gold crown ramp up to Kora’s 12m Bongo Crown!',
      'bb-side-spout': 'Three speaker stacks sit on the West Pylon, East Pylon, and Upper Viaduct!',
      'bb-side-moleman': 'Use Bongo Pads + Air-Jump to fly through the 3 high-altitude green Aerial Rings!',
    },
    defaultHint: 'Use the south highway ramp to reach the 4m deck, then climb the red viaduct ramp toward Kora’s Crown!',
  },
  'chrome-kiln': {
    levelId: 'chrome-kiln',
    name: 'Sooty Slagcap',
    title: 'Foundry Updraft Spotter',
    hatColor: '#76ff03',
    coatColor: '#2f242c',
    accentColor: '#ff6d00',
    facts: [
      'Chrome Kiln Foundry is the 3rd rung—Furnace Vera’s smelters amplify DJ Broadcast’s signal past the mid-Aether clouds!',
      'The Glaze Grinders play 138 BPM E Phrygian Dominant acid-funk that keeps the molten glaze bubbling.',
      'Glowing Updraft Vents rocket you straight from the ground floor onto the 8.5m Kiln Stacks!',
      'Furnace Vera’s anvil-cymbal never cracks—tagging it three times simply detunes her overdrive.',
    ],
    hints: {
      'ck-tag-stacks': 'Ride the West/East Updraft Vents or catwalk ramps to tag the 8.5m Kiln Stacks and 13m Crucible Crown!',
      'ck-cymbal-patrol': 'Climb the green south ramp onto the 4.5m Smelter Catwalk to silence all 3 Anvil Sentries!',
      'ck-vent-dishes': 'Two Amplifier Dishes sit on the West & East Kiln Stacks (8.5m), and the third is on the 13m Crown!',
      'ck-boss-vera': 'Take the Crucible Booster Vent at z=-29 or the gold Crown ramp to reach Furnace Vera at 13m!',
      'ck-side-cinder': 'Check the tops of both 8.5m Kiln Stacks and the Crucible Crown for the 3 Tempo Acorns!',
      'ck-side-sparks': 'Grind the lime Crown Arch rail and throw a spin trick + Air-Jump to easily clear 1,800 pts!',
    },
    defaultHint: 'Skate onto the glowing Updraft Vents at the foundry base to launch straight up to the Kiln Stacks!',
  },
  'neon-birdbath': {
    levelId: 'neon-birdbath',
    name: 'Drizzle Dewdrop',
    title: 'Spire Glass-Bender',
    hatColor: '#00e5ff',
    coatColor: '#223157',
    accentColor: '#ff4ecd',
    facts: [
      'Neon Birdbath Spire is DJ Broadcast’s ancestral tower—its G Lydian glass tubes scatter pirate radio sky-wide!',
      'Retuning this 4th rung exposes the hidden Mulch Alley Arcade and upper dome districts above the clouds.',
      'Gus the Upright Bass skates at 170 BPM—use Boost (Shift) and carve corners to cut him off!',
      'Pressing F near any wall or ramp paints your chosen Neon Birdbath stencil—try all 3!',
    ],
    hints: {
      'nb-tag-rim': 'Spiral up from the 4m Lower Rim to the 8m Mist Bowls and 16.5m Birdbath Apex to tag all 4 billboards!',
      'nb-mist-rings': 'Hit the Mist Geysers and grind the Mist Bridge rail—use Air-Jump to thread all 4 green Mist Rings!',
      'nb-gus-chase': 'Gus loops around the fountain plaza—cut across his circle and hit Spray (F) 3 times!',
      'nb-tune-spouts': 'Two speaker stacks sit on the West & East 8m Mist Bowls; the Apex Beacon is at 16.5m!',
      'nb-boss-finn': 'Use the Apex Mist Jet vent at z=-27 or the gold Apex ramp to reach Fountainhead Finn at 16.5m!',
      'nb-side-demo': 'Grab the Tempo Acorns on both 8m Mist Bowls and the 16.5m Birdbath Apex!',
      'nb-side-nell': 'Grind the cyan Apex Halo rail and chain Air-Jumps + tricks for a 2,400-pt combo!',
    },
    defaultHint: 'Ride the cyan south ramp to the Lower Rim, then hit the Mist Geysers to spiral up to the Apex!',
  },
};
