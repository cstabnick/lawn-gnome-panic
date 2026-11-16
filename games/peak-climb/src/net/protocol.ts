export interface RemotePlayerState {
  id: string;
  name: string;
  color: string;
  x: number;
  y: number;
  z: number;
  yaw: number;
  pitch: number;
  mode: string;
  stamina: number;
  hp: number;
}

export interface PitonNetData {
  id: string;
  playerId: string;
  x: number;
  y: number;
  z: number;
  nx: number;
  ny: number;
  nz: number;
}

export type ServerMessage =
  | {
      type: 'welcome';
      playerId: string;
      code: string;
      seed: number;
      players: RemotePlayerState[];
      pitons: PitonNetData[];
    }
  | { type: 'error'; message: string }
  | { type: 'snapshot'; players: RemotePlayerState[] }
  | { type: 'player_left'; playerId: string }
  | { type: 'ping'; playerId: string; name: string; color: string; x: number; y: number; z: number }
  | ({ type: 'piton' } & PitonNetData)
  | { type: 'revive'; targetId: string; byName: string }
  | { type: 'summit'; playerId: string; name: string; timeSec: number };
