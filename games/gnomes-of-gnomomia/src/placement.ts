// World object placement: an `object` marker in a zone's level file can place a world object from a pack.
// The pack keeps everything else (name, model, text, conditions); the marker supplies the position and the
// placement data. Ids never change: a marker names the object it places by id.
// Coordinates are zone-local here, like every other authored position; content.ts shifts them by the zone origin.
import type { MarkerDef } from '@lawn/level';
import type { WorldObjectDef, WorldObjectSpec, ZoneId } from './config';

export const OBJECT_MARKER_KIND = 'object';
export const OBJECT_PLACEMENT_V = 1;

export type Vec3P = { x?: number; y?: number; z?: number };

/** The `data` of an object marker. x and z live on the marker itself. Unknown keys are ignored (room for later versions). */
export interface ObjectPlacementData {
  v: 1;
  pos?: { y?: number };      // height offset (m); x/z live on the marker itself
  rot?: Vec3P;               // radians; y = yaw (0 faces +z)
  scale?: number | Vec3P;
  anchor?: unknown;          // reserved, rejected in v1
  [k: string]: unknown;      // unknown keys ignored
}

export interface ObjectPlacementMarker extends MarkerDef { kind: 'object'; data: ObjectPlacementData }

export function isObjectMarker(m: MarkerDef): m is ObjectPlacementMarker {
  return m.kind === OBJECT_MARKER_KIND;
}

const isFiniteNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

/**
 * The object a pack spec describes, placed by an optional object marker from `zoneId`'s level file.
 * Never throws: problems come back in `errors`, and `def` is still a usable object (position 0,0 if none was given).
 */
export function resolveObject(spec: WorldObjectSpec, zoneId: ZoneId, marker?: MarkerDef): { def: WorldObjectDef; errors: string[] } {
  const errors: string[] = [];
  const { x: specX, z: specZ, ...rest } = spec;
  const def: WorldObjectDef = { ...rest, x: specX ?? 0, z: specZ ?? 0 };

  if (specX === undefined || specZ === undefined) {
    if (!marker) errors.push('no position (give x and z in the pack, or an object marker in the zone file)');
  }
  if (!marker) return { def, errors };

  if (spec.id.includes('#')) {
    errors.push('generated id (contains #) cannot take an object marker');
    return { def, errors };
  }
  if (!isObjectMarker(marker)) {
    errors.push(`marker ${marker.id} is kind '${marker.kind}', not '${OBJECT_MARKER_KIND}'`);
    return { def, errors };
  }
  if (spec.zone !== zoneId) {
    errors.push(`wrong zone: marker is in ${zoneId}, the object is in ${spec.zone}`);
    return { def, errors };
  }

  const data = (marker.data ?? {}) as Partial<ObjectPlacementData>;
  if (data.v !== OBJECT_PLACEMENT_V) {
    errors.push(`marker data v ${String(data.v)} not supported (expected ${OBJECT_PLACEMENT_V})`);
    return { def, errors };
  }
  if ('anchor' in data) {
    errors.push('anchor not supported yet');
    return { def, errors };
  }

  if (!isFiniteNum(marker.x) || !isFiniteNum(marker.z)) {
    errors.push('marker x and z must be finite numbers');
  } else {
    def.x = marker.x;
    def.z = marker.z;
  }

  if (data.rot !== undefined) {
    const rot = data.rot;
    if (rot.y !== undefined) {
      if (isFiniteNum(rot.y)) def.yaw = rot.y;
      else errors.push('rot.y must be a finite number');
    }
    if ((rot.x !== undefined && rot.x !== 0) || (rot.z !== undefined && rot.z !== 0)) errors.push('rot x/z not supported yet');
  }

  if (data.pos?.y !== undefined && data.pos.y !== 0) errors.push('pos.y not supported yet');

  if (typeof data.scale === 'number') {
    if (isFiniteNum(data.scale)) def.scale = data.scale;
    else errors.push('scale must be a finite number');
  } else if (data.scale !== undefined) {
    const vals = [data.scale.x, data.scale.y, data.scale.z].filter((v) => v !== undefined);
    if (vals.some((v) => !isFiniteNum(v))) errors.push('scale components must be finite numbers');
    else if (vals.length === 0 || vals.some((v) => v !== vals[0])) errors.push('non-uniform scale not supported yet');
    else def.scale = vals[0];
  }

  return { def, errors };
}
