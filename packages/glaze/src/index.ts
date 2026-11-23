// @lawn/glaze: vehicle customisation. See README.md.
export * from './ids';
export * from './types';
export * from './catalog';
export * from './loadout';
export * from './mounts';
export { finishMaterial, paintBody } from './paint';
export { buildDecals, drawDecal, type Ctx2D, type DecalPanelKind } from './decals';
export { applyWheels, setWheelPose, type WheelResult } from './wheels';
export { buildLamps, type LampBuild } from './lamps';
export { buildFittings, type FittingsBuild } from './fittings';
export { applySteer, registerSteerVariant, resolveBodyPrefab, steerVariantId } from './steer';
export { RIDE_TRAVEL, attachLoadout, buildGlazeBody } from './attach';
export { ARM_LENGTH, poseHandsOnGrips, reachArm, releaseArm, type ArmReach, type ReachOptions } from './grips';
