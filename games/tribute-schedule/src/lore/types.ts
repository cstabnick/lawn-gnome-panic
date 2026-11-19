export type ServerSource = 'prod' | 'dev' | 'custom';

export type EntityId =
  | 'cone'
  | 'fridge'
  | 'microwave'
  | 'smoke_detector'
  | 'toaster'
  | 'printer'
  | 'tv'
  | 'apartment';

export type WhisperTrigger = 'ambient' | 'warning' | 'incident';

export interface TributeItemDef {
  id: string;
  name: string;
  shortLabel: string;
  accepted: boolean;
  dreadDelta: number;
  devotionDelta: number;
  coneReaction: string;
  color: number;
  sourceServer: ServerSource;
}

export interface ScamEntryDef {
  id: string;
  pricePoint: number;
  item: string;
  scamText: string;
  sourceServer: ServerSource;
}

export interface WhisperDef {
  id: string;
  entity: EntityId;
  text: string;
  minHour: number;
  triggerKind: WhisperTrigger;
  sourceServer: ServerSource;
}

export interface LorePack {
  id: string;
  label: string;
  sourceServer: ServerSource;
  tributes: TributeItemDef[];
  scams: ScamEntryDef[];
  whispers: WhisperDef[];
}
