// The vehicle a cutscene shows is the vehicle the next objective uses: same place, same look.
//   npx vitest run src/quests/sceneHandover.test.ts      (from games/gnome-theft-auto)
import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { installFakeDom } from '../testing/fakeDom';

installFakeDom();
const { buildWorld } = await import('../world');
const { questById } = await import('./defs');
const { vehicleMark } = await import('./stages');
const { clearVehicleSpawn, stealDeliverRun } = await import('./objectivesDrive');
const { VEHICLES } = await import('../config');
const { BIG_LOU_VIP } = await import('../cutscene/scenes/side/bigLou');
type Obj = Extract<import('./types').ObjectiveDef, { kind: 'steal-deliver' }>;

const world = buildWorld(new THREE.Scene(), undefined as unknown as THREE.WebGLRenderer);
const stealStep = (quest: string, i: number): Obj => {
  const o = questById(quest)?.objectives[i];
  if (!o || o.kind !== 'steal-deliver') throw new Error(`${quest} objective ${i} is not steal-deliver`);
  return o;
};

describe('scene to objective handover', () => {
  it('the Founders Boot float spawns on its staged mark, not shoved aside', () => {
    const o = stealStep('ch1-founders-boot', 0);
    const mark = vehicleMark('boot-float-start')!.mark;
    expect(mark.kind).toBe(o.vehicleKind);
    expect(Math.hypot(o.spawnAt[0] - mark.at[0], o.spawnAt[1] - mark.at[1])).toBeLessThan(1);
    const [x, z] = clearVehicleSpawn(o.spawnAt[0], o.spawnAt[1], VEHICLES[o.vehicleKind].radius, world);
    expect(Math.hypot(x - mark.at[0], z - mark.at[1])).toBeLessThan(1);
  });

  it("Big Lou's objective car wears the loadout the vip scene dressed", () => {
    const o = stealStep('sq-big-lou-embargo', 1);
    const sv = BIG_LOU_VIP.vehicles!.find((v) => v.id === 'vip')!;
    expect(o.vehicleKind).toBe(sv.kind);
    expect(o.loadout).toEqual(sv.loadout);
    expect(Math.hypot(o.spawnAt[0] - sv.at[0], o.spawnAt[1] - sv.at[1])).toBeLessThan(1);
  });

  // L79 root cause: the quest float was an ordinary abandoned vehicle, so traffic.ts's cleanup (over MAX_VEHICLES it
  // removes the farthest driver-less vehicle that is not questOwned, beyond 60 m) deleted it while the player stood at
  // Side-Valve after the intro, ~240 m away. The marker then pointed at a vehicle no longer in the world; restarting
  // the step near the marker spawned a new one inside 60 m, so it "showed up".
  it('a steal-deliver target is quest-owned while the objective runs (traffic cleanup never takes it)', () => {
    const vehicles: import('../types').Vehicle[] = [];
    const deps = { scene: new THREE.Scene(), world, vehicles } as unknown as import('./types').QuestDeps;
    const run = stealDeliverRun(stealStep('ch1-founders-boot', 0), deps, () => {}, () => {});
    const float = vehicles.find((v) => v.kind === 'boot-float');
    expect(float?.questOwned).toBe(true);
    run.cleanup();
  });
});
