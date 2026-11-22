import { describe, expect, it, vi } from 'vitest';
import {
  createAudioEffectHandler,
  createCameraEffectHandler,
  createGameEffectDispatcher,
} from './effectHandlers';
import type { GsrSfx } from '../audio/sfx';
import type { SkaterState } from '../sim/skater';
import type { ChaseCamera } from '../view/camera';

function mockSfx(): GsrSfx {
  return {
    unlock: vi.fn(),
    update: vi.fn(),
    silence: vi.fn(),
    jump: vi.fn(),
    airJump: vi.fn(),
    land: vi.fn(),
    grindStart: vi.fn(),
    wallRideStart: vi.fn(),
    trick: vi.fn(),
    spray: vi.fn(),
    tagSwitch: vi.fn(),
    boostStart: vi.fn(),
    bounce: vi.fn(),
    pickup: vi.fn(),
    bankScore: vi.fn(),
    bump: vi.fn(),
    eventComplete: vi.fn(),
    bossUnlock: vi.fn(),
    bossHit: vi.fn(),
    wallKick: vi.fn(),
    onBeat: vi.fn(),
    rankFanfare: vi.fn(),
    levelClear: vi.fn(),
    dispose: vi.fn(),
  };
}

describe('gameplay EffectHandlers', () => {
  it('dispatches events to multiple handlers and routes tick state', () => {
    const sfx = mockSfx();
    const cam: ChaseCamera = {
      yaw: 0,
      pitch: 0,
      shake: vi.fn(),
      fovPunch: vi.fn(),
      update: vi.fn(),
    };
    const dispatcher = createGameEffectDispatcher([
      createAudioEffectHandler(sfx),
      createCameraEffectHandler(cam),
    ]);

    dispatcher.emit({ type: 'airJump', x: 1, y: 2, z: 3 });
    expect(sfx.airJump).toHaveBeenCalledTimes(1);
    expect(cam.shake).toHaveBeenCalledWith(0.14, 0.14);
    expect(cam.fovPunch).toHaveBeenCalledWith(2.5);

    const skater = {} as SkaterState;
    dispatcher.tick(0.016, { skater, beatPulse: 0, playing: true });
    expect(sfx.update).toHaveBeenCalledWith(skater, 0.016);

    dispatcher.tick(0.016, { skater, beatPulse: 0, playing: false });
    expect(sfx.silence).toHaveBeenCalledTimes(1);
  });

  it('schedules and expires timed effects with normalized progress', () => {
    const dispatcher = createGameEffectDispatcher();
    const onTick = vi.fn();
    const onDone = vi.fn();
    dispatcher.schedule({
      id: 'pulse',
      duration: 0.5,
      onTick,
      onDone,
    });

    const skater = {} as SkaterState;
    dispatcher.tick(0.25, { skater, beatPulse: 0, playing: true });
    expect(onTick).toHaveBeenLastCalledWith(0.25, 0.5);
    expect(onDone).not.toHaveBeenCalled();

    dispatcher.tick(0.25, { skater, beatPulse: 0, playing: true });
    expect(onTick).toHaveBeenLastCalledWith(0.25, 1);
    expect(onDone).toHaveBeenCalledTimes(1);
  });
});
