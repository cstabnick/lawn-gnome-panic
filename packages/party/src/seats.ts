// Default seats for a slice played alone (the game's own #minigame, tests): me + 3 CPUs.
import { GNORMAN_LOOK, getMyGnome } from '@lawn/gnome';
import type { SeatIndex, SeatInfo } from './types';

export const DEFAULT_SEAT_COLORS: readonly number[] = [0xff5a5a, 0x4fd8ff, 0x5cff7a, 0xffd54f];
export const DEFAULT_CPU_NAMES: readonly string[] = ['Gnorbert', 'Gnelly', 'Gnash', 'Gnina'];

/** Seat 0 is me (my saved gnome, if any) unless allCpu; the rest are CPUs. Hats take the seat colour. */
export function defaultSeats(allCpu = false): SeatInfo[] {
  const mine = allCpu ? null : getMyGnome();
  return ([0, 1, 2, 3] as SeatIndex[]).map((seat) => {
    const me = seat === 0 && !allCpu;
    const base = me ? (mine?.look ?? GNORMAN_LOOK) : GNORMAN_LOOK;
    return {
      seat,
      name: me ? (mine?.name ?? 'You') : DEFAULT_CPU_NAMES[seat],
      look: { ...base, hat: DEFAULT_SEAT_COLORS[seat] },
      color: DEFAULT_SEAT_COLORS[seat],
      cpu: !me,
    };
  });
}
