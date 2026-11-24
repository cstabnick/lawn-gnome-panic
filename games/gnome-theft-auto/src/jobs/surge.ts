// Sim jobs: world events that change pay and how often work comes (rush hour, storm pay, celebrity clients). Pure.
import type { TimeLabel } from '../atmosphere';
import type { SeaState } from '../waves';
import type { JobId, Surge } from './types';

/** Morning and Dusk are rush hour for taxis and couriers; a blustery sea is storm pay for boats and pilots; a
 *  celebrity client turns up (roll < 0.12) from level 3, never for couriers. */
export function surgeFor(job: JobId, time: TimeLabel | null, sea: SeaState, level: number, celebrityRoll: number): Surge {
  const rush = (time === 'Morning' || time === 'Dusk') && (job === 'taxi' || job === 'courier');
  const storm = sea === 'blustery' && (job === 'boat' || job === 'pilot');
  const celebrity = level >= 3 && celebrityRoll < 0.12 && job !== 'courier';
  return {
    rush, storm, celebrity,
    payMult: (rush ? 1.25 : 1) * (storm ? 1.4 : 1),
    spawnMult: rush ? 1.5 : 1,
    label: celebrity ? 'CELEBRITY' : storm ? 'STORM PAY' : rush ? 'RUSH HOUR' : null,
  };
}
