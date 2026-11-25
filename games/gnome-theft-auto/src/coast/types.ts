// What each coast runtime module returns (coast/index.ts combines them for app.ts). Every member is optional.
import type { Blip, InputState, Vehicle } from '../types';

export interface CoastPart {
  /** Every frame, after the player and vehicles moved. */
  update?(dt: number): void;
  /** Minimap and big-map blips. */
  blips?(): Blip[];
  /** True when this part moves `v` itself (a Spokewheel gondola the player sits in): app.ts must not step it. */
  drives?(v: Vehicle): boolean;
  /** Called in app.ts's vehicle-step slot for a vehicle this part drives. */
  stepRider?(v: Vehicle, inp: InputState, dt: number): void;
}

/** What app.ts calls on the coast (coast/index.ts installCoast). */
export interface Coast {
  update(dt: number): void;
  blips(): Blip[];
  drives(v: Vehicle): boolean;
  stepRider(v: Vehicle, inp: InputState, dt: number): void;
}
