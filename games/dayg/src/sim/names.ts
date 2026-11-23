// House-style NPC names for DayG: a plant or garden first name and a clay-and-garden surname.
// Surnames that belong to named characters in docs/lore/entries (Potsworth, Clayfoot, Inkcap, Gromwell, ...) are left out.
import type { Rng } from './rng';

export const FIRST_NAMES: readonly string[] = [
  'Bramble', 'Thistle', 'Sorrel', 'Nettle', 'Yarrow', 'Tansy', 'Burdock', 'Clover', 'Fennel', 'Sedge',
  'Teasel', 'Vetch', 'Hazel', 'Rowan', 'Furze', 'Dock', 'Mallow', 'Campion', 'Cress', 'Wort',
  'Sloe', 'Bryony', 'Comfrey', 'Woad', 'Madder', 'Rue', 'Speedwell', 'Bugle', 'Spurge', 'Sweetbriar',
  'Holly', 'Alder', 'Plantain', 'Groundsel', 'Chicory', 'Lovage', 'Agrimony', 'Hawthorn', 'Rush', 'Moss',
];

export const LAST_NAMES: readonly string[] = [
  'Stonewort', 'Kilnby', 'Glazebrook', 'Mossbank', 'Shardwell', 'Rowkeeper', 'Lichendale', 'Pebblewick', 'Crocksley', 'Slipwell',
  'Kerbstone', 'Urnfield', 'Firebrick', 'Claypit', 'Marlwood', 'Loamby', 'Grittle', 'Potsherd', 'Glazewick', 'Tilehurst',
  'Mossgate', 'Flagstone', 'Cobbleby', 'Crazewell', 'Biscuitby', 'Rakemoor', 'Trugwell', 'Dibbleton', 'Edgerow', 'Slatefield',
  'Kilnhollow', 'Shardley', 'Wealdpot', 'Sandmarl',
];

export function makeName(rng: Rng): string {
  return `${rng.pick(FIRST_NAMES)} ${rng.pick(LAST_NAMES)}`;
}
