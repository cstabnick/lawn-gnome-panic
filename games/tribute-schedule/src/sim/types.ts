import type { EntityId, ServerSource } from '../lore/types';

export interface SimInput {
  moveX: number; // -1..1 strafe
  moveZ: number; // -1..1 forward (positive = forward)
  lookYawDelta: number;
  lookPitchDelta: number;
  interact: boolean;
  nod: boolean;
  chirp: boolean;
  toggleFlashlight: boolean;
}

export interface PickupItem {
  uid: number;
  tributeId: string;
  name: string;
  shortLabel: string;
  color: number;
  x: number;
  y: number;
  z: number;
}

export interface ActiveMessage {
  text: string;
  source: ServerSource;
  entity: EntityId;
  ttl: number;
}

export type FridgePhase = 'idle' | 'singing' | 'waiting_nod' | 'angry';
export type MicrowavePhase = 'idle' | 'glowing' | 'pulsing' | 'morse' | 'threat';
export type GameOutcome = 'playing' | 'survived' | 'three_blinks' | 'consumed_by_dread' | 'scam_bankrupt';

export interface SimState {
  seed: number;
  rngState: number;
  timeSeconds: number;
  shiftDurationSeconds: number;
  hour: number; // 0..6 (12 AM .. 6 AM)
  dread: number; // 0..100
  devotion: number; // 0..100
  pricePoints: number;
  nextPickupUid: number;

  player: {
    x: number;
    z: number;
    yaw: number;
    pitch: number;
    flashlightOn: boolean;
    holdingItem: PickupItem | null;
    nearestEntity: EntityId | null;
    nearestPickupUid: number | null;
    promptText: string;
    nodAnimTimer: number;
    chirpCooldown: number;
    walkBob: number;
    isMoving: boolean;
  };

  cone: {
    angle: number;
    rpm: number;
    direction: 1 | -1;
    pausedTimer: number;
    pauseCooldown: number;
    tributeDueTimer: number;
    acceptedCount: number;
    desiredItemId: string;
    lastReaction: string;
  };

  fridge: {
    phase: FridgePhase;
    noteCount: number; // 4..7
    noteStep: number;
    noteTimer: number;
    waitTimer: number;
    cooldown: number;
    satisfiedCount: number;
    pulseIntensity: number;
  };

  microwave: {
    day: number; // 4..12
    phase: MicrowavePhase;
    display: '0:00' | 'HELP' | 'SNACK';
    towelTimer: number;
    escalationTimer: number;
    cooldown: number;
  };

  smokeDetector: {
    blinks: 1 | 2 | 3;
    soonTimer: number;
    cooldown: number;
    ledFlashTimer: number;
  };

  toaster: {
    ejected: boolean;
    cooldown: number;
  };

  printer: {
    jammed: boolean;
    jamReason: string;
    alarmTimer: number;
    cooldown: number;
    paidCount: number;
  };

  tv: {
    on: boolean;
    timer: number;
  };

  pickups: PickupItem[];
  activeMessage: ActiveMessage | null;
  ledgerLog: string[];
  ambientWhisperTimer: number;

  // One-frame event flags for audio/view triggers
  events: {
    fridgeNoteIndex: number; // -1 if none this frame
    smokeChirp: boolean;
    toasterPop: boolean;
    printerJam: boolean;
    coneStop: boolean;
    nodPerformed: boolean;
    chirpPerformed: boolean;
    tributeAccepted: boolean;
    tributeRejected: boolean;
  };

  outcome: GameOutcome;
  outcomeReason: string;
}
