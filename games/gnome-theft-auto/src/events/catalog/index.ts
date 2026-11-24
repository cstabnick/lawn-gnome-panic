// Every street event the director can pick, one file per category.
import type { EventDef } from '../types';
import { CRIME_EVENTS } from './crime';
import { POLICE_EVENTS } from './police';
import { SCENE_EVENTS } from './scenes';
import { TRAFFIC_EVENTS } from './traffic';
import { WILD_EVENTS } from './wild';
import { PEBBLEWICK_EVENTS } from './pebblewick';

export const STREET_EVENTS: readonly EventDef[] = [
  ...POLICE_EVENTS,
  ...CRIME_EVENTS,
  ...SCENE_EVENTS,
  ...TRAFFIC_EVENTS,
  ...WILD_EVENTS,
  ...PEBBLEWICK_EVENTS,
];
