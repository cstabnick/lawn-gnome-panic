// Every catalog file, in gallery order. Add a new file here and nowhere else.
// Order matters for emoji: when several prefabs list the same emoji, the earliest is that emoji's default.
import type { PrefabDef } from '../types';
import { WEAPONS } from './weapons';
import { ARMOR } from './armor';
import { CONSUMABLES } from './consumables';
import { MATERIALS } from './materials';
import { TRINKETS } from './trinkets';
import { DOCUMENTS } from './documents';
import { TOOLS } from './tools';
import { FURNITURE } from './furniture';
import { PROPS } from './props';
import { BOWLING } from './bowling';
import { CASINO } from './casino';
import { GNOMEOKEMON } from './gnomeokemon';
import { MOWERS } from './mowers';
import { CRITTERS } from './critters';
import { GOLF } from './golf';
import { GOLF_CART } from './golf-cart';
import { FRONT } from './front';
import { FRONT_WEAPONS } from './front-weapons';

import { SAMPLE_3D_SCENERY } from './sample-3d-scenery';
import { SAMPLE_3D_WEAPONS } from './sample-3d-weapons';
import { GNAFT } from './gnaft';
import { LAWN_PRIX } from './lawn-prix';
import { GNOME_GOLF_PROPS } from './gnome-golf-props';
import { AETHER_BOARD } from './aether-board';
import { GIANT_PUP } from './giant-pup';
import { TRIBUTE_SCHEDULE } from './tribute-schedule';
import { GNOMEOKEMON_WORLD } from './gnomeokemon-world';
import { PARAGNORMAL } from './paragnormal';
import { GNOME_COMPANY } from './gnome-company';
import { GNOMYLPICS } from './gnomylpics';
import { GNOME_BOWLING_LANE } from './gnome-bowling-lane';
import { GNOME_BLACKJACK } from './gnome-blackjack';
import { GNOMES_OF_GNOMOMIA } from './gnomes-of-gnomomia';
import { GNOME_FRONT_BATTLE } from './gnome-front-battle';
import { GNOME_PARTY } from './gnome-party';
import { PEAK_CLIMB } from './peak-climb';
import { GNOME_THEFT_AUTO } from './gnome-theft-auto';
import { GTA_CRACKED } from './gta-cracked';
import { GTA_FACES } from './gta-faces';
import { GTA_WORLD } from './gta-world';
import { GTA_WORLD_GREEN } from './gta-world-green';
import { GTA_BRANDS } from './gta-brands';
import { GTA_STORY } from './gta-story';
import { GTA_STORY_PROPS } from './gta-story-props';
import { GTA_GUNS_AIR } from './gta-guns-air';
import { KITCHEN } from './kitchen';
import { GNOME_JAM } from './gnome-jam';
import { GNOMEOKEMON_LAB } from './gnomeokemon-lab';
import { SNIGMS } from './snigms';
import { GNOME_SET_RADIO } from './gnome-set-radio';
import { CLUB_GNOME_SHOP } from './club-gnome-shop';
import { CLUB_GNOME_SHOPS } from './club-gnome-shops';
import { GTA_RACE_TRACK } from './gta-race-track';
import { GTA_RACE_GEAR } from './gta-race-gear';
import { COSMETICS_HEAD_A } from './cosmetics-head-a';
import { COSMETICS_HEAD_B } from './cosmetics-head-b';
import { COSMETICS_NECK } from './cosmetics-neck';
import { COSMETICS_BACK } from './cosmetics-back';
import { NOTHING_LEFT_TO_COLLECT } from './nothing-left-to-collect';
import { GTA_BOATS } from './gta-boats';
import { GTA_WATERWORKS } from './gta-waterworks';
import { GTA_LANDSCAPING } from './gta-landscaping';
import { GTA_TOWERS } from './gta-towers';
import { GTA_HOUSES } from './gta-houses';
import { GTA_REGION_MOTIFS } from './gta-region-motifs';
import { GTA_WATER_HINTS } from './gta-water-hints';
import { GTA_FARM_CRITTERS } from './gta-farm-critters';
import { GTA_WILD_LIFE } from './gta-wild-life';
import { GTA_TESSIE } from './gta-tessie';
import { GTA_TESSIE_GEAR } from './gta-tessie-gear';
import { GTA_WILD_GEAR } from './gta-wild-gear';
import { GTA_WEATHER_GEAR } from './gta-weather-gear';
import { DAYG } from './dayg';
import { DAYG_BASE } from './dayg-base';
import { DAYG_BASE_ITEMS } from './dayg-base-items';
import { DAYG_BUILD } from './dayg-build';
import { DAYG_MATERIALS } from './dayg-materials';
import { DAYG_GEAR } from './dayg-gear';
import { DAYG_BUILDINGS } from './dayg-buildings';
import { DAYG_STORY_PROPS } from './dayg-story-props';
import { GTA_GLAZE_TYRES } from './gta-glaze-tyres';
import { GTA_GLAZE_RIMS } from './gta-glaze-rims';
import { GTA_GLAZE_STEER } from './gta-glaze-steer';
import { GTA_GLAZE_LAMPS } from './gta-glaze-lamps';
import { GTA_GLAZE_SPOILERS } from './gta-glaze-spoilers';
import { GTA_GLAZE_SEATS } from './gta-glaze-seats';
import { GTA_GLAZE_ORNAMENTS } from './gta-glaze-ornaments';
import { GTA_GLAZE_EXTRAS } from './gta-glaze-extras';
import { GTA_GLAZE_GEAR } from './gta-glaze-gear';
import { GTA_GUN_MODS_A } from './gta-gun-mods-a';
import { GTA_GUN_MODS_B } from './gta-gun-mods-b';
import { GTA_GUN_STORE } from './gta-gun-store';
import { GTA_ODD_RIDES } from './gta-odd-rides';
import { GTA_MOWING } from './gta-mowing';
import { GTA_PHYSICS_REWARDS } from './gta-physics-rewards';
import { GTA_FLEET } from './gta-fleet';
import { GTA_GLAZE_GRILLE } from './gta-glaze-grille';
import { GTA_GLAZE_BUMPER } from './gta-glaze-bumper';
import { GTA_GLAZE_CANOPY } from './gta-glaze-canopy';
import { GTA_GLAZE_MIRROR } from './gta-glaze-mirror';
import { GTA_GLAZE_EXHAUST } from './gta-glaze-exhaust';
import { GTA_GLAZE_STAGE } from './gta-glaze-stage';
import { GTA_HUNT_QUARRY_A } from './gta-hunt-quarry-a';
import { GTA_HUNT_QUARRY_B } from './gta-hunt-quarry-b';
import { GTA_HUNT_GEAR } from './gta-hunt-gear';
import { GTA_BIRDS } from './gta-birds';
import { GTA_BIRDING_GEAR } from './gta-birding-gear';
import { GTA_FISH_A } from './gta-fish-a';
import { GTA_FISH_B } from './gta-fish-b';
import { GTA_FISH_C } from './gta-fish-c';
import { GTA_FISH_TACKLE } from './gta-fish-tackle';
import { GTA_FISH_GEAR } from './gta-fish-gear';
import { GTA_JOBS } from './gta-jobs';
import { GTA_COAST } from './gta-coast';
import { GTA_COAST_KIT } from './gta-coast-kit';
import { GTA_COAST_GEAR } from './gta-coast-gear';
import { GTA_JOBS_GEAR } from './gta-jobs-gear';
import { GTA_PEBBLEWICK } from './gta-pebblewick';
import { GTA_PEBBLEWICK_B } from './gta-pebblewick-b';
import { GTA_PEBBLEWICK_GEAR } from './gta-pebblewick-gear';
import { GTA_LOCKUP } from './gta-lockup';
import { GTA_STREET_KIT } from './gta-street-kit';
import { GTA_STREET_KIT_B } from './gta-street-kit-b';
import { GTA_PARK_KIT } from './gta-park-kit';
import { GTA_PARK_KIT_B } from './gta-park-kit-b';
import { GTA_FRINGE_KIT } from './gta-fringe-kit';
import { GTA_FRINGE_KIT_B } from './gta-fringe-kit-b';
import { GTA_FRINGE_YARD } from './gta-fringe-yard';
import { GTA_HANGAR_BOATHOUSE } from './gta-hangar-boathouse';
import { GTA_ECONOMY } from './gta-economy';
import { GTA_ECONOMY_GEAR } from './gta-economy-gear';
import { GTA_AIRCRAFT } from './gta-aircraft';
import { GTA_SKY_TRAFFIC } from './gta-sky-traffic';
import { GTA_SKYWAY_WORKS } from './gta-skyway-works';
import { GNOMELOCK_GEAR } from './gnomelock';
import { GNOME_SOULS } from './gnome-souls';
import { GTA_CONTINENTAL_KIT } from './gta-continental-kit';
import { GTA_EURO_BUILDINGS_A } from './gta-euro-buildings-a';
import { GTA_EURO_BUILDINGS_B } from './gta-euro-buildings-b';
import { GTA_EURO_BUILDINGS_C } from './gta-euro-buildings-c';
import { GTA_EURO_BUILDINGS_D } from './gta-euro-buildings-d';
import { GTA_EURO_STREET } from './gta-euro-street';
import { GTA_EURO_STREET_B } from './gta-euro-street-b';
import { GTA_EURO_GARDEN } from './gta-euro-garden';
import { GTA_EURO_GARDEN_B } from './gta-euro-garden-b';
import { GTA_EURO_FLEET } from './gta-euro-fleet';
import { GTA_EURO_FLEET_B } from './gta-euro-fleet-b';
import { GTA_EURO_GEAR } from './gta-euro-gear';
import { GTA_HOMES } from './gta-homes';
import { GTA_PARDONLIN_PROPS } from './gta-pardonlin-props';
import { GTA_PARDONLIN_GEAR } from './gta-pardonlin-gear';
import { GTA_WINTER_RIDES } from './gta-winter-rides';
import { GTA_WINTER_LODGE } from './gta-winter-lodge';
import { GTA_WINTER_GEAR } from './gta-winter-gear';
import { GTA_GOLF } from './gta-golf';
import { GTA_GOLF_PLANTS } from './gta-golf-plants';
import { GTA_GOLF_GEAR } from './gta-golf-gear';
import { GTA_GOLF_PROPS } from './gta-golf-props';
import { GTA_GOLF_NINE_GARDEN } from './gta-golf-nine-garden';
import { GTA_GOLF_NINE_PROPS } from './gta-golf-nine-props';
import { GTA_GOLF_NINE_CRITTERS } from './gta-golf-nine-critters';
import { GTA_GOLF_NINE_GEAR } from './gta-golf-nine-gear';
import { GTA_DRAINPIPE_COURT } from './gta-drainpipe-court';
import { GTA_GUTTER_BOWLS } from './gta-gutter-bowls';
import { GTA_SPORTS_GEAR } from './gta-sports-gear';
import { GTA_FISH_ICE } from './gta-fish-ice';
import { GTA_DIRT_RALLY } from './gta-dirt-rally';
import { GTA_DIRT_RALLY_GEAR } from './gta-dirt-rally-gear';
import { GTA_DINER } from './gta-diner';
import { GTA_MECHANIC } from './gta-mechanic';
import { GTA_COMEDY } from './gta-comedy';
import { GTA_CAMPUS_HALLS } from './gta-campus-halls';
import { GTA_CAMPUS_BUILDINGS } from './gta-campus-buildings';
import { GTA_ANTHILL_FIELD } from './gta-anthill-field';
import { GTA_PINWHEEL_CAMPUS_PROPS } from './gta-pinwheel-campus-props';
import { GTA_CAMPUS_PROPS } from './gta-campus-props';
import { GTA_CAMPUS_GEAR } from './gta-campus-gear';
import { GTA_PRESERVE_KIT } from './gta-preserve-kit';
import { GTA_PRESERVE_TRAIL } from './gta-preserve-trail';
import { GTA_LIVING_CRITTERS } from './gta-living-critters';
import { GTA_LIVING_RIDES } from './gta-living-rides';
import { GTA_LIVING_GEAR } from './gta-living-gear';
import { GTA_HAMLET_KIT } from './gta-hamlet-kit';
import { GTA_JOBS3_FLEET } from './gta-jobs3-fleet';
import { GTA_BIN_ROUND } from './gta-bin-round';
import { GTA_FIRE_BRIGADE } from './gta-fire-brigade';
import { GTA_GNOMAZON } from './gta-gnomazon';
import { GTA_COUNTRY_DEER } from './gta-country-deer';
import { GTA_COUNTRY_CROPS } from './gta-country-crops';
import { GTA_COUNTRY_CROPS_B } from './gta-country-crops-b';
import { GTA_COUNTRY_CROFT } from './gta-country-croft';
import { GTA_COUNTRY_SITE } from './gta-country-site';
import { GTA_COUNTRY_VINEYARD } from './gta-country-vineyard';
import { GTA_COUNTRY_MANOR } from './gta-country-manor';
import { GTA_COUNTRY_CAMP } from './gta-country-camp';
import { GTA_COUNTRY_GEAR } from './gta-country-gear';

export const CATALOG: readonly PrefabDef[] = [
  ...WEAPONS, ...ARMOR, ...CONSUMABLES, ...MATERIALS, ...TRINKETS, ...DOCUMENTS, ...TOOLS, ...FURNITURE, ...PROPS, ...BOWLING, ...CASINO, ...GNOMEOKEMON,
  ...MOWERS, ...CRITTERS, ...GOLF, ...GOLF_CART, ...FRONT, ...FRONT_WEAPONS,
  ...(SAMPLE_3D_SCENERY), ...(SAMPLE_3D_WEAPONS), ...(GNAFT), ...(LAWN_PRIX), ...(GNOME_GOLF_PROPS), ...(AETHER_BOARD), ...(GIANT_PUP), ...(TRIBUTE_SCHEDULE), ...(GNOMEOKEMON_WORLD), ...(PARAGNORMAL), ...(GNOME_COMPANY), ...(GNOMYLPICS), ...(GNOME_BOWLING_LANE), ...(GNOME_BLACKJACK), ...(GNOMES_OF_GNOMOMIA), ...(GNOME_FRONT_BATTLE), ...(GNOME_PARTY), ...(PEAK_CLIMB), ...(GNOME_THEFT_AUTO), ...(GTA_WORLD), ...(GTA_CRACKED), ...GTA_FACES, ...(GTA_WORLD_GREEN), ...(GTA_BRANDS), ...(GTA_STORY), ...(GTA_GUNS_AIR), ...KITCHEN, ...GNOME_JAM, ...GNOMEOKEMON_LAB, ...SNIGMS, ...GNOME_SET_RADIO, ...CLUB_GNOME_SHOP, ...CLUB_GNOME_SHOPS, ...GTA_STORY_PROPS, ...GTA_RACE_TRACK, ...GTA_RACE_GEAR,
  ...COSMETICS_HEAD_A, ...COSMETICS_HEAD_B, ...COSMETICS_NECK, ...COSMETICS_BACK,
  ...NOTHING_LEFT_TO_COLLECT,
  ...GTA_BOATS, ...GTA_WATERWORKS, ...GTA_LANDSCAPING, ...GTA_TOWERS, ...GTA_HOUSES, ...GTA_REGION_MOTIFS, ...GTA_WATER_HINTS,
  ...GTA_FARM_CRITTERS, ...GTA_WILD_LIFE,
  ...GTA_TESSIE, ...GTA_TESSIE_GEAR, ...GTA_WILD_GEAR,
  ...GTA_WEATHER_GEAR,
  ...DAYG, ...DAYG_BASE, ...DAYG_BASE_ITEMS, ...DAYG_BUILD, ...DAYG_MATERIALS, ...DAYG_GEAR, ...DAYG_BUILDINGS, ...DAYG_STORY_PROPS,
  ...GTA_GLAZE_TYRES, ...GTA_GLAZE_RIMS, ...GTA_GLAZE_STEER, ...GTA_GLAZE_LAMPS, ...GTA_GLAZE_SPOILERS, ...GTA_GLAZE_SEATS, ...GTA_GLAZE_ORNAMENTS, ...GTA_GLAZE_EXTRAS, ...GTA_GLAZE_GEAR, ...GTA_GLAZE_GRILLE, ...GTA_GLAZE_BUMPER, ...GTA_GLAZE_CANOPY, ...GTA_GLAZE_MIRROR, ...GTA_GLAZE_EXHAUST, ...GTA_GLAZE_STAGE,
  ...GTA_GUN_MODS_A, ...GTA_GUN_MODS_B, ...GTA_GUN_STORE,
  ...GTA_ODD_RIDES, ...GTA_MOWING, ...GTA_PHYSICS_REWARDS,
  ...GTA_FLEET,
  ...GTA_AIRCRAFT,
  ...GTA_SKY_TRAFFIC,
  ...GTA_SKYWAY_WORKS,
  ...GTA_HUNT_QUARRY_A, ...GTA_HUNT_QUARRY_B, ...GTA_HUNT_GEAR, ...GTA_LOCKUP, ...GTA_HANGAR_BOATHOUSE,
  ...GTA_BIRDS, ...GTA_BIRDING_GEAR,
  ...GTA_FISH_A, ...GTA_FISH_B, ...GTA_FISH_C, ...GTA_FISH_TACKLE, ...GTA_FISH_GEAR, ...GTA_JOBS, ...GTA_JOBS_GEAR,
  ...GTA_PEBBLEWICK, ...GTA_PEBBLEWICK_B, ...GTA_PEBBLEWICK_GEAR,
  ...GTA_STREET_KIT, ...GTA_STREET_KIT_B, ...GTA_PARK_KIT, ...GTA_PARK_KIT_B,
  ...GTA_FRINGE_KIT, ...GTA_FRINGE_KIT_B, ...GTA_FRINGE_YARD,
  ...GNOMELOCK_GEAR,
  ...GNOME_SOULS,
  ...GTA_ECONOMY, ...GTA_ECONOMY_GEAR,
  ...GTA_CONTINENTAL_KIT,
  ...GTA_EURO_BUILDINGS_A, ...GTA_EURO_BUILDINGS_B, ...GTA_EURO_BUILDINGS_C, ...GTA_EURO_BUILDINGS_D,
  ...GTA_EURO_STREET, ...GTA_EURO_STREET_B, ...GTA_EURO_GARDEN, ...GTA_EURO_GARDEN_B,
  ...GTA_EURO_FLEET, ...GTA_EURO_FLEET_B, ...GTA_EURO_GEAR, ...GTA_HOMES, ...GTA_PARDONLIN_PROPS, ...GTA_PARDONLIN_GEAR,
  ...GTA_COAST, ...GTA_COAST_KIT, ...GTA_COAST_GEAR,

  ...GTA_WINTER_RIDES, ...GTA_WINTER_LODGE, ...GTA_WINTER_GEAR, ...GTA_FISH_ICE,
  ...GTA_DIRT_RALLY, ...GTA_DIRT_RALLY_GEAR,
  ...GTA_GOLF, ...GTA_GOLF_PLANTS, ...GTA_GOLF_PROPS, ...GTA_GOLF_GEAR,
  ...GTA_GOLF_NINE_GARDEN, ...GTA_GOLF_NINE_PROPS, ...GTA_GOLF_NINE_CRITTERS, ...GTA_GOLF_NINE_GEAR,
  ...GTA_DRAINPIPE_COURT, ...GTA_GUTTER_BOWLS, ...GTA_SPORTS_GEAR,
  ...GTA_DINER, ...GTA_MECHANIC, ...GTA_COMEDY,
  ...GTA_CAMPUS_HALLS, ...GTA_CAMPUS_BUILDINGS, ...GTA_ANTHILL_FIELD, ...GTA_PINWHEEL_CAMPUS_PROPS, ...GTA_CAMPUS_PROPS, ...GTA_CAMPUS_GEAR,
  ...GTA_PRESERVE_KIT, ...GTA_PRESERVE_TRAIL, ...GTA_LIVING_CRITTERS, ...GTA_LIVING_RIDES, ...GTA_LIVING_GEAR, ...GTA_HAMLET_KIT,
  ...GTA_JOBS3_FLEET, ...GTA_BIN_ROUND, ...GTA_FIRE_BRIGADE, ...GTA_GNOMAZON,
  ...GTA_COUNTRY_DEER, ...GTA_COUNTRY_CROPS, ...GTA_COUNTRY_CROPS_B, ...GTA_COUNTRY_CROFT, ...GTA_COUNTRY_SITE, ...GTA_COUNTRY_VINEYARD, ...GTA_COUNTRY_MANOR, ...GTA_COUNTRY_CAMP, ...GTA_COUNTRY_GEAR,
];
