// Every Turfton FM song, by station. content.ts takes the titles from here; player.ts plays songs[i] with build.ts.
import type { RadioStation, SongSpec } from '../spec';
import { ADAGIO_SONGS } from './adagio';
import { BEATS_SONGS } from './beats';
import { BLADE_SONGS } from './blade';
import { FPR_SONGS } from './fpr';

export const RADIO_SONGS: Readonly<Record<RadioStation, readonly SongSpec[]>> = {
  blade: BLADE_SONGS,
  fpr: FPR_SONGS,
  beats: BEATS_SONGS,
  adagio: ADAGIO_SONGS,
};
