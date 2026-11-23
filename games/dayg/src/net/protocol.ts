// DayG game messages (the `d` of an @lawn/mp relay). Pure types and constants.
import type { ActionEnvelope, MapKind, PlayerKey, RegionId, SimAction } from '../sim/types';
import type { StreamName } from '../sim/rng';
import type { HatlessNet } from '../game/types';

export interface Snapshot {
  v: 1; seed: number; map: MapKind; tuningHash: string; tick: number; hash: string;
  world: string;                                 // JSON of WorldState without graph, tuning, tuningBase
  streams: Record<StreamName, number>;           // Rng.state() of every stream
  log: ActionEnvelope[];                         // envelopes applied after the snapshot was taken (replayed on load)
}
/** a: 0 idle, 1 walk, 2 run, 3 climb, 4 down. */
export interface Pose { x: number; y: number; z: number; f: number; a: 0 | 1 | 2 | 3 | 4; r: RegionId | null; held: string | null }
export type DaygMsg =
  | { t: 'hi'; key: PlayerKey; name: string; look: string; userId: string | null; snap: number }  // to the host on match/joined; snap = newest local snapshot tick or -1
  | { t: 'act'; n: number; a: SimAction }                                     // guest -> host: my n-th action
  | { t: 'env'; e: ActionEnvelope[]; ack: { key: PlayerKey; n: number } | null } // host -> all
  | { t: 'tick'; tick: number; hash: string; sun: number }                    // host -> all after each world tick
  | { t: 'snap'; id: string; i: number; of: number; d: string }               // host -> one: chunk i of `of` (base64 of the packed snapshot)
  | { t: 'sun'; sun: number }                                                 // host -> all every NET.sunEverySec
  | { t: 'pose'; p: Pose }                                                    // client -> interested players, NET.poseHz
  | { t: 'hl'; r: RegionId; l: HatlessNet[] }                                 // bubble owner -> its viewers, NET.hatlessHz
  | { t: 'hit'; r: RegionId; x: number; y: number; z: number; f: number; reach: number; dmg: number } // viewer -> bubble owner
  | { t: 'scratch'; strength: number; x: number; z: number }                  // bubble owner -> the viewer its Hatless scratched
  | { t: 'news'; lines: string[] }                                            // host -> all every NET.newsEverySec
  | { t: 'bye' };                                                             // leaving for good
