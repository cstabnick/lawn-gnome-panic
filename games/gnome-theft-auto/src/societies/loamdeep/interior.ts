// Loamdeep (E17): the Burrowfolk's halls, one large E05 interior reached through the Burrow Door. Each part of the room
// lives in its own module; this file only defines the interior and calls them in order on every entry.
import { defineInterior } from '../../interiors';
import { LOAMDEEP, SOCIETY_INTERIORS } from '../config';
import { buildEarth } from './earth';
import { buildHallsWest } from './hallsWest';
import { buildHallsEast } from './hallsEast';
import { buildMoleFolk } from './folk';
import { buildJobSpots } from './runtime';

let fromLongTunnel = false;

/** Call just before enterInterior('loamdeep') from DJ Moleman's burrow: the player arrives at the Long Tunnel's mouth. */
export function markLongTunnelArrival(): void {
  fromLongTunnel = true;
}

defineInterior({
  id: SOCIETY_INTERIORS.loamdeep,
  name: 'Loamdeep',
  door: LOAMDEEP.door,
  exit: LOAMDEEP.exit,
  size: LOAMDEEP.size,
  theme: 'burrow',
  prompt: 'Go down to Loamdeep',
  build(kit) {
    kit.room({ theme: 'burrow' });
    kit.door(LOAMDEEP.exitDoor[0], LOAMDEEP.exitDoor[1], LOAMDEEP.exitDoorYaw);
    buildEarth(kit);
    buildHallsWest(kit);
    buildHallsEast(kit);
    buildMoleFolk(kit);
    buildJobSpots(kit);
    if (fromLongTunnel) {
      fromLongTunnel = false;
      const [x, z] = LOAMDEEP.spots.longTunnelArrive;
      kit.spawn(x, z, Math.PI / 2);
    }
  },
});
