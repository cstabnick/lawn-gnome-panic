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
      'Critics at the Espresso-Dew Cafe argue over music theory while Saxy Sal steals the whole crowd by the Piano Fountain.',
      'Double-jump mid-air (Space) to snap onto the North Bridge rail between the Vinyl Rotunda and Brass-Bell Amphitheater.',
      'Press 1, 2, 3 (or C) to swap between 3 Velvet Keys graffiti stencils—you can spray any wall or roof!',
    ],
    hints: {
      'vk-tag-billboards': 'Hit the Postcard Kiosk, Espresso-Dew Cafe, Vinyl Rotunda, and Brass-Bell Amphitheater roofs for all 4 billboards!',
      'vk-pluck-chase': 'Pluck hops past the Piano Fountain—boost with Shift and spray (F) when close!',
      'vk-tune-dishes': 'Grind between the Vinyl Rotunda, Espresso-Dew Cafe, and Brass-Bell Amphitheater to reach all 3 Relay Dishes.',
      'vk-boss-maestro': 'Climb the pink Conservatory ramp, then take the gold upper ramp to Maestro Upright’s 7m Penthouse Stage!',
      'vk-side-tilda': 'Tempo Acorns sit on the Vinyl Rotunda, Postcard Kiosk, and the Conservatory Penthouse roof!',
      'vk-side-vinyl': 'Chain the North Bridge rail + mid-air trick + Air-Jump to bank 1,200+ pts in one combo!',
    },
    defaultHint: 'Skate the piano-key walkway up the Conservatory ramp, or grind from the Kiosk to the Vinyl Rotunda!',
  },
  'bongo-basin': {
    levelId: 'bongo-basin',
    name: 'Bam-Bam Bramble',
    title: 'Viaduct Percussion Rigger',
    hatColor: '#ff9100',
    coatColor: '#453328',
    accentColor: '#ffd740',
    facts: [
      'Bongo Basin locks the Archipelago’s Master Clock in A Mixolydian so parcel-gnomes can haul crates past the clouds!',
      'Waitress Brenda at The Big Acorn Diner serves the hottest acorn-chili on the S-curve—skaters never have to pay the toll!',
      'Every Bongo Pad resets your Air-Jump mid-flight—chain them from the Diner straight onto the 8.5m Cloverleaf Overpass!',
      'DJ Moleman’s 108.0 Subsoil Radio sneaks up from Turfton’s dirt right through the Conga Grain-Silo.',
    ],
    hints: {
      'bb-overpass-tags': 'Tag billboards on The Big Acorn Diner, West Toll-Gate Deck, Conga Grain-Silo, and Cloverleaf Crown!',
      'bb-bongo-chain': 'Skate onto the 5 glowing Bongo Pads from the Diner and Viaduct up to Kora’s Cloverleaf Crown!',
      'bb-black-dew-relays': 'Check the Southbound Viaduct, West Toll-Gate Deck, and Conga Grain-Silo for the 3 Black Dew relays.',
      'bb-clear-drumline': 'Ride the south orange ramp onto the 4m Southbound Viaduct Span—the 3 Conga Sentries patrol right across it!',
      'bb-boss-kora': 'Take the red Cloverleaf ramp to 8.5m, then the gold crown ramp up to Kora’s 12m Bongo Crown!',
      'bb-side-spout': 'Three speaker stacks sit on the West Toll-Gate Deck, Big Acorn Diner, and Cloverleaf Crown!',
      'bb-side-moleman': 'Use Bongo Pads + Air-Jump to fly through the 3 high-altitude green Aerial Rings above the S-curve!',
    },
    defaultHint: 'Ride the ramp onto the Southbound Viaduct or Big Acorn Diner, then chain cables to the Cloverleaf Crown!',
  },
  'chrome-kiln': {
    levelId: 'chrome-kiln',
    name: 'Sooty Slagcap',
    title: 'Foundry Updraft Spotter',
    hatColor: '#76ff03',
    coatColor: '#2f242c',
    accentColor: '#ff6d00',
    facts: [
      'Chrome Kiln Foundry is the 3rd rung—Local 404 smelters glaze half the rollerblade boots in the Broadcast Archipelago!',
      'Inspector Clem keeps resetting the "DAYS SINCE GLAZE SPILL: 0" sign every time a skater rides an exhaust vent.',
      'Trundle the Woken Glaze-Trolley hauls molten lime glaze along the central canyon grates at 138 BPM.',
      'Furnace Vera’s anvil-cymbal never cracks—tagging it three times simply detunes her overdrive.',
    ],
    hints: {
      'ck-tag-stacks': 'Tag billboards on the West Blast-Smelter, East Glaze-Press, NW Kiln Chimney, and Crucible Crown!',
      'ck-cymbal-patrol': 'Climb the green ramp onto the 5m East Glaze-Press Hall roof to silence all 3 Anvil Sentries!',
      'ck-vent-dishes': 'Ride the canyon Updraft Vents to reach the NW Chimney, Union Canteen roof, and Crucible Crown!',
      'ck-boss-vera': 'Take the Crucible Booster Vent at z=-35 or the gold Crown ramp to reach Furnace Vera at 13m!',
      'ck-side-cinder': 'Check the NW Kiln Chimney, Union Canteen roof, and Crucible Crown for the 3 Tempo Acorns!',
      'ck-side-sparks': 'Grind the lime Crown Arch rail and throw a spin trick + Air-Jump to easily clear 1,800 pts!',
    },
    defaultHint: 'Carve down the central Molten Glaze Canyon and hit the Updraft Vents to launch onto the Kiln Stacks!',
  },
  'neon-birdbath': {
    levelId: 'neon-birdbath',
    name: 'Drizzle Dewdrop',
    title: 'Spire Glass-Bender',
    hatColor: '#00e5ff',
    coatColor: '#223157',
    accentColor: '#ff4ecd',
    facts: [
      'Neon Birdbath Spire is DJ Broadcast’s ancestral tower—honeymooners ride pink gondolas up just to see the Mist Lagoon!',
      'The Master Glass-Blower remembers when DJ Broadcast was just a kid spinning records on a dented birdbath.',
      'Midnight Sax plays 170 BPM liquid-DnB from the 11m West Observatory Sky-Lounge while tourists peer through telescopes.',
      'Retuning this 4th rung exposes the hidden Mulch Alley Arcade and upper dome districts above the clouds.',
    ],
    hints: {
      'nb-tag-rim': 'Spiral from the Arrival Pier to the Glass Pavilion, East Mist-Spa, and 16.5m Birdbath Apex for all 4 billboards!',
      'nb-mist-rings': 'Hit the Mist Geysers and lagoon rails—use Air-Jump to thread all 4 green Mist Rings!',
      'nb-gus-chase': 'Gus loops around the Mist Lagoon—cut across the water rim and hit Spray (F) 3 times!',
      'nb-tune-spouts': 'Two speaker stacks sit on the East Mist-Spa (8.5m) and West Observatory (11m); the Apex Beacon is at 16.5m!',
      'nb-boss-finn': 'Use the Apex Mist Jet vent at z=-31 or the gold Apex ramp to reach Fountainhead Finn at 16.5m!',
      'nb-side-demo': 'Grab the Tempo Acorns on the East Mist-Spa, West Observatory, and 16.5m Birdbath Apex!',
      'nb-side-nell': 'Grind the cyan Apex Halo rail and chain Air-Jumps + tricks for a 2,400-pt combo!',
    },
    defaultHint: 'Spiral up from the Arrival Pier across the Glass Pavilion and Mist-Spa toward the 16.5m Birdbath Apex!',
  },
};